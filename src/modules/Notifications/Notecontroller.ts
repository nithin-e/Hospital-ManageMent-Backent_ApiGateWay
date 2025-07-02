import { DoctorService } from "../Doctor/config/Doctor.client";
import { UserService } from "../user/config/user.client";
import { NotificationService } from "./config/notification.client";
import { Response, Request } from "express";
import Stripe from 'stripe';




const StatusCode = {
    OK: 200,
    Created: 201,
    BadRequest: 400,
    Unauthorized: 401,
    Forbidden: 403,
    NotFound: 404,
    InternalServerError: 500,
  };




 async function extractEmailFromEvent(event: Stripe.Event, stripe: Stripe): Promise<string | null> {
    let email: string | null = null;
    
    try {
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        email = session.customer_details?.email || null;
        
        // If no email in customer_details, try metadata
        if (!email && session.metadata?.email) {
          email = session.metadata.email;
        }
        
      } else if (event.type === 'customer.subscription.created' || 
                event.type === 'customer.subscription.updated') {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = typeof subscription.customer === 'string' 
          ? subscription.customer 
          : subscription.customer.id;
          
        try {
          const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
          email = customer.email || null;
        } catch (customerError) {
          console.error('Error fetching customer details:', customerError);
        }
        
      } else if (event.type === 'charge.updated' || event.type === 'charge.succeeded') {
        const charge = event.data.object as Stripe.Charge;
        
        // Try multiple sources for email
        if (charge.receipt_email) {
          email = charge.receipt_email;
        } else if (charge.billing_details?.email) {
          email = charge.billing_details.email;
        } else if (charge.customer) {
          try {
            const customerId = typeof charge.customer === 'string' 
              ? charge.customer 
              : charge.customer.id;
              
            const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
            email = customer.email || null;
          } catch (customerError) {
            console.error('Error fetching customer details for charge:', customerError);
          }
        }
      }
      
      // Final fallback: check metadata for email
      if (!email) {
        let metadata: Record<string, string> | undefined;
        
        if (event.type.startsWith('charge.')) {
          metadata = (event.data.object as Stripe.Charge).metadata;
        } else if (event.type.startsWith('customer.')) {
          metadata = (event.data.object as Stripe.Customer).metadata;
        } else if (event.type.startsWith('checkout.')) {
          metadata = (event.data.object as Stripe.Checkout.Session).metadata;
        } else if (event.type.startsWith('payment_intent.')) {
          metadata = (event.data.object as Stripe.PaymentIntent).metadata;
        }
        
        if (metadata?.email) {
          email = metadata.email;
        }
      }
      
    } catch (error) {
      console.error('Error extracting email from event:', error);
    }
    
    return email;
  }

export default class NotificationController {
    
  StoringNotificationData = async (req: Request, res: Response): Promise<void> => {
    console.log('.notification data....', req.body);
    NotificationService.CreateNotification(
        { ...req.body },
        async (err: any, result: any) => {
            if (err) {
                console.log('api notification controller forget pass', err);
                res.status(StatusCode.BadRequest).json({ message: err });
            } else {
                console.log('..api notification controller enthelum kittando..', result);
                
                try {
                    // Assuming you have userId in req.body or result
                    const email = req.body.userId || result.notification.userId||result.notification.user_id;
                    console.log('Email for doctor update:', email);
                    
                    console.log('About to call UpdateDoctorStatusAfterAdminApprove with:', {
                      email: email
                    });
                    
                    UserService.UpdateDoctorStatusAfterAdminApprove({ email: email }, async(err:any, response:any) => {
                      if (err) {
                        console.error('Error updating user status:', err);
                        res.status(StatusCode.InternalServerError).json({
                          message: 'Notification created but failed to update user status',
                          notification: result
                        });
                        return;
                      }
                      
                      console.log('Successfully updated doctor:', response);
                      
                      res.status(StatusCode.Created).json({
                        notification: result
                      })
                            

                    });
                } catch (userUpdateError) {
                    console.error('Error updating user status:', userUpdateError);
                    res.status(StatusCode.InternalServerError).json({
                        message: 'Notification created but failed to update user status',
                        notification: result
                    });
                }
            }
        }
    );
};



UpdateDbAfterPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET is not defined in environment variables');
      res.status(StatusCode.InternalServerError).json({
        success: false,
        message: 'Webhook secret is not configured'
      });
      return;
    }

    if (!signature) {
      console.error('Stripe signature is missing from request headers');
      res.status(StatusCode.BadRequest).json({
        success: false,
        message: 'Missing stripe signature'
      });
      return;
    }

    const rawBody = req.body;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-03-31.basil',
    });

    // Construct and verify the webhook event
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log('Event type:', event.type);
    console.log('Event ID:', event.id);

    // Only handle checkout.session.completed events
    if (event.type !== 'checkout.session.completed') {
      console.log('Ignoring event type:', event.type);
      res.status(StatusCode.OK).json({ 
        received: true,
        message: 'Event type not handled'
      });
      return;
    }

    const session = event.data.object as Stripe.Checkout.Session;
    
    // Handle appointment booking
    if (session.metadata?.type === 'appointment') {
      console.log('Processing appointment booking');
      console.log('Session metadata:', session.metadata);

      const appointmentData = {
        patientName: session.metadata?.patientName,
        patientEmail: session.metadata?.patientEmail,
        patientPhone: session.metadata?.patientPhone,
        appointmentDate: session.metadata?.appointmentDate,
        appointmentTime: session.metadata?.appointmentTime,
        doctorName: session.metadata?.doctorName,
        specialty: session.metadata?.specialty,
        userEmail: session.metadata?.userEmail,
        notes: session.metadata?.notes || '',
        userId: session.metadata?.patientId || '',
        doctorId: session.metadata?.doctorId || '',
       
      };

      console.log('Appointment data extracted:', appointmentData);
      
      // Wait for the appointment to be stored before sending response
      DoctorService.StoreAppointMent(
        appointmentData,
        (err: any, result: any) => {
          if (err) {
            console.log('err coming from webhook', err);
            res.status(StatusCode.BadRequest).json({ 
              success: false,
              message: err 
            });
          } else {
            console.log('user appointments response in api gateway:', result);
            res.status(StatusCode.Created).json({
              received: true,
              type: 'appointment',
              message: 'Appointment booking processed successfully',
              data: result
            });
          }
        }
      );

      // Return here to prevent further execution
      return;
    }

    // Handle other payment events (non-appointment)
    console.log('Processing payment webhook');
    
    // Forward webhook to notification service
    NotificationService.HandleStripeWebhook(
      {
        event_type: event.type,
        event_data: JSON.stringify(event)
      },
      async (err: any, result: any) => {
        if (err) {
          console.error('Error forwarding webhook to notification service:', err);
          res.status(StatusCode.InternalServerError).json({ 
            success: false, 
            message: 'Error processing webhook' 
          });
          return;
        }
        
        try {
          // Extract email from the checkout session
          const email = await extractEmailFromEvent(event, stripe);
          
          if (!email) {
            console.warn('Could not extract email from event');
            res.status(StatusCode.OK).json({ 
              received: true,
              status: 'notification_only',
              message: 'Payment notification received, but email not found for user update'
            });
            return;
          }
          
          console.log('Extracted email for user update:', email);
          
          // Update user status
          UserService.UpdateDoctorStatusAndUserRole({ 
            email: email,
          }, (userErr: any, response: any) => {
            if (userErr) {
              if (userErr.code === 12) { 
                console.error('The UpdateDoctorStatusAndUserRole method is not implemented yet');
                res.status(StatusCode.OK).json({ 
                  received: true,
                  status: 'notification_only',
                  message: 'Payment notification received, but automatic status update is not available'
                });
              } else {
                console.error('Error updating user status:', userErr);
                res.status(StatusCode.InternalServerError).json({
                  success: false,
                  message: 'Notification created but failed to update user status',
                  notification: result
                });
              }
              return;
            }
            
            console.log('Successfully updated doctor status:', response);
            res.status(StatusCode.OK).json({ 
              received: true,
              message: 'Payment processed and user status updated successfully'
            });
          });
          
        } catch (serviceError) {
          console.error('Error calling UserService:', serviceError);
          res.status(StatusCode.InternalServerError).json({
            success: false,
            message: 'Error in user service call',
            error: serviceError instanceof Error ? serviceError.message : String(serviceError)
          });
        }
      }
    );

  } catch (error: any) {
    console.error('Error in webhook controller:', error);
    
    if (error.type === 'StripeSignatureVerificationError') {
      res.status(StatusCode.BadRequest).json({
        success: false,
        message: 'Invalid stripe signature'
      });
    } else {
      res.status(StatusCode.InternalServerError).json({ 
        success: false, 
        message: error.message || 'Internal server error' 
      });
    }
  }
};

// Helper function to extract email from different Stripe event types
 








handleCanceldoctorApplication = async (req: Request, res: Response): Promise<void> => {

  console.log('.notification  data  admin cancel tyme....', req.body);

  const servicePayload = {
    email: req.body.email,
    reasons: req.body.rejectionReasonTexts || []
  };
  
  NotificationService.handleCanceldoctorApplication(
    servicePayload,
      async (err: any, result: any) => {
          if (err) {
              console.log('api notification controller forget pass', err);
              res.status(StatusCode.BadRequest).json({ message: err });
          } else {
              console.log('..api notification controller enthelum kittando..', result);
              
              try {
               
                  res.status(StatusCode.Created).json({
                        notification: result
                      })
                      
              } catch (userUpdateError) {
                  console.error('Error updating user status:', userUpdateError);
                  res.status(StatusCode.InternalServerError).json({
                      message: 'Notification created but failed to update user status',
                      notification: result
                  });
              }
          }
      }
  );
};




RescheduleAppointmentNotification = async (email: string, time: string) => {
  try {
    return new Promise((resolve, reject) => {
      console.log('Calling notification service for email:', email, 'time:', time);
      
      // Call the correct service method with proper parameters
      NotificationService.rescheduleAppointmentNotification(
        { email, time }, // Pass both email and time
        async (err: any, result: any) => {
          if (err) {
            console.log('API notification controller error:', err);
            const errorResponse = {
              data: err,
              status: 'error',
              message: 'Failed to send reschedule notification'
            };
            resolve(errorResponse);
          } else {
            console.log('Reschedule notification result:', result);
            const successResponse = {
              data: result,
              status: 'success',
              message: 'Reschedule notification sent successfully'
            };
            resolve(successResponse);
          }
        }
      );
    });
  } catch (error) {
    console.error('Controller method error:', error);
    return {
      data: error,
      status: 'error',
      message: 'Unexpected error occurred'
    };
  }
}







fetchAllNotifications = async (email: string) => {
  try {
    return new Promise((resolve, reject) => {
      NotificationService.fecthAllNotifications(
        { email },
        async (err: any, result: any) => {
          if (err) {
            console.log('API notification controller error:', err);
            const errorResponse = {
              notification: [],
              success: false,
              message: 'Failed to fetch notifications'
            };
            resolve(errorResponse);
          } else {
            console.log('Fetch notifications result:', result);
            
            // Ensure consistent response structure
            const response = {
              notification: result.notification || [],
              success: true,
              message: 'Notifications fetched successfully'
            };
            
            resolve(response);
          }
        }
      );
    });
  } catch (error) {
    console.error('Controller method error:', error);
    return {
      notification: [],
      success: false,
      message: 'Unexpected error occurred'
    };
  }
}


}


