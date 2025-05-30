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
                      });
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




fetchAllNotifications = async (req: Request, res: Response): Promise<void> => {
  console.log('.notification ....data....', req.body);
  
  
  
  NotificationService.fecthAllNotifications(
    { ...req.body },
    async (err: any, result: any) => {
      if (err) {
        console.log('api notification controller fetching data', err);
        res.status(StatusCode.BadRequest).json({ message: err });
      } else {
        res.status(StatusCode.Created).json({
          notification: result
        });
      }
    }
  );
}



UpdateDbAfterPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('.web hook controller ....data....');
    const signature = req.headers['stripe-signature'] as string;
    
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET is not defined in environment variables');
      res.status(StatusCode.InternalServerError).json({ 
        success: false, 
        message: 'Webhook secret is not configured' 
      });
      return;
    }
    
    // For webhook endpoints, the body is already raw when using express.raw()
    const rawBody = req.body;
    if (!rawBody || !Buffer.isBuffer(rawBody)) {
      console.error('Request body is not a Buffer as expected');
      res.status(StatusCode.InternalServerError).json({
        success: false,
        message: 'Invalid webhook payload format'
      });
      return;
    }
    
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-03-31.basil',
    });

    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
      
    console.log('Event received:', event);
      
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
          // Extract email from event data based on event type
          let email: string | null = null;
          
          if (event.type === 'checkout.session.completed') {
            // Extract customer email from checkout session
            const session = event.data.object as Stripe.Checkout.Session;
            email = session.customer_details?.email || null;
          } else if (event.type === 'customer.subscription.created' || 
                    event.type === 'customer.subscription.updated') {
            // Extract customer email for subscription events
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = typeof subscription.customer === 'string' 
              ? subscription.customer 
              : subscription.customer.id;
              
            try {
              // Retrieve customer details to get the email
              const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
              email = customer.email || null;
            } catch (customerError) {
              console.error('Error fetching customer details:', customerError);
              // Still use customer ID as fallback
              email = customerId;
            }
          } else if (event.type === 'charge.updated' || event.type === 'charge.succeeded') {
            // Handle charge events
            const charge = event.data.object as Stripe.Charge;
            
            // Try to get email from different possible locations in charge object
            if (charge.receipt_email) {
              email = charge.receipt_email;
            } else if (charge.billing_details && charge.billing_details.email) {
              email = charge.billing_details.email; 
            } else if (charge.customer) {
              try {
                // Retrieve customer details to get the email
                const customerId = typeof charge.customer === 'string' 
                  ? charge.customer 
                  : charge.customer.id;
                  
                const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
                email = customer.email || null;
              } catch (customerError) {
                console.error('Error fetching customer details for charge:', customerError);
                // Still use customer ID as fallback if it's a string
                if (typeof charge.customer === 'string') {
                  email = charge.customer;
                } else {
                  email = charge.customer.id;
                }
              }
            } else if (charge.payment_intent) {
              try {
                // Try to get email from payment intent
                const paymentIntentId = typeof charge.payment_intent === 'string' 
                  ? charge.payment_intent 
                  : charge.payment_intent.id;
                  
                const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
                if (paymentIntent.receipt_email) {
                  email = paymentIntent.receipt_email;
                }
              } catch (piError) {
                console.error('Error fetching payment intent:', piError);
              }
            }
          }
          
          // Fallback for email if still not found
          if (!email) {
            console.warn('Could not extract email from event, checking for metadata');
            
            // Safely check metadata based on event type
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
            
            if (metadata && metadata.email) {
              email = metadata.email;
             
            }
          }
          
          try {
            
            console.log('avasaanam kitty mone email',email);
            
            
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
                    message: 'Notification created but failed to update user status',
                    notification: result
                  });
                }

                return;
              }
              
              console.log('Successfully updated doctor:', response);
              res.status(StatusCode.OK).json({ received: true });
            });
          } catch (serviceError) {
            console.error('Error calling UserService:', serviceError);
            res.status(StatusCode.InternalServerError).json({
              message: 'Error in user service call',
              error: serviceError instanceof Error ? serviceError.message : String(serviceError)
            });
          }
          
        } catch (error) {
          console.error('Error in user update:', error);
          res.status(StatusCode.InternalServerError).json({ 
            success: false, 
            message: error instanceof Error ? error.message : 'Internal server error during user update'
          });
        }
      }
    );
  } catch (error: any) {
    console.error('Error in webhook controller:', error);
    if (error.type === 'StripeSignatureVerificationError') {
      res.status(StatusCode.BadRequest).json({
        success: false,
        message: 'Invalid signature'
      });
    } else {
      res.status(StatusCode.InternalServerError).json({ 
        success: false, 
        message: error.message || 'Internal server error' 
      });
    }
  }
}



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



}