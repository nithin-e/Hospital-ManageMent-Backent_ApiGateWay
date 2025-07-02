import { status } from "@grpc/grpc-js";
import { UserService } from "../user/config/user.client";
import { DoctorService } from "./config/Doctor.client";
import { Response, Request } from "express";
import App from "../../app";






const StatusCode = {
    OK: 200,
    Created: 201,
    BadRequest: 400,
    Unauthorized: 401,
    Forbidden: 403,
    NotFound: 404,
    InternalServerError: 500,
  };


export default class DoctorController {
    
  


  storeDoctorSlotes = async (req: Request, res: Response): Promise<void> => {
    try {
      const { appointmentSettings } = req.body;
  
      // Validate required fields
      if (!appointmentSettings || !appointmentSettings.doctorEmail) {
      res.status(StatusCode.BadRequest).json({ 
          message: 'Doctor email is required' 
        });
      }
  
      // Prepare data based on action type
      let serviceData;
      
      if (appointmentSettings.action === 'update') {
        // For update mode
        serviceData = {
          doctor_email: appointmentSettings.doctorEmail,
          action: 'update',
          removed_slot_ids: appointmentSettings.removedSlotIds || [],
          remaining_slots: appointmentSettings.remainingSlots || [],
          new_time_slots:appointmentSettings.newTimeSlots||[]
     

        };
      } else {
        // For create mode
        const timeSlots = appointmentSettings.timeSlots || [];
        serviceData = {
          doctor_email: appointmentSettings.doctorEmail,
          date_range: appointmentSettings.dateRange,
          selected_dates: appointmentSettings.selectedDates,
          time_slots: timeSlots.map(slot => ({
            date: slot.date,
            slots: slot.slots
          })),
          action: 'create'
        };
      }
  


      console.log('...................77777776666666666666777777777................',serviceData);
      

      // Call gRPC Service
      DoctorService.StoreAppointmentSlots(
        serviceData,
        (err: any, result: any) => {
          if (err) {
            console.log('API doctor controller error:', err);
            return res.status(StatusCode.BadRequest).json({ 
              message: err.message || 'Failed to process appointment slots' 
            });
          } else {
            console.log('Appointment slots processed successfully:', result);
            
            const statusCode = serviceData.action === 'create' ? StatusCode.Created : StatusCode.OK;
            return res.status(statusCode).json({
              success: true,
              result: result
            });
          }
        }
      );
    } catch (error) {
      console.error('Error in storeDoctorSlotes:', error);
       res.status(StatusCode.InternalServerError).json({ 
        message: 'Internal server error' 
      });
    }
  }




fetchDoctorSlots = async (req: Request, res: Response): Promise<void> => {
    
 // API Controller
DoctorService.fetchingDoctorSlots(
    {...req.body},
    async (err: any, result: any) => {
      if (err) {
        console.log('api doctor controller error', err);
        res.status(StatusCode.BadRequest).json({ message: err });
      } else {

       console.log('...check slotes and   result verfiy this....',result)
       

        res.status(StatusCode.Created).json({
           result
        });
      }
    }
  );
}


fetchAppontMentSlotes = async (req: Request, res: Response): Promise<void> => {
    
 // API Controller
DoctorService.fetchingAppontMentSlotes(
    {...req.body},
    async (err: any, result: any) => {
      if (err) {
        console.log('api doctor controller error', err);
        res.status(StatusCode.BadRequest).json({ message: err });
      } else {

       console.log('...check result....',result)
       

        res.status(StatusCode.Created).json({
           result
        });
      }
    }
  );
}





fectingAllUserAppointMents = async (req: Request, res: Response): Promise<void> => {
    
  // API Controller
 DoctorService.fectingAllUserAppointMents(
  {...req.body},
     async (err: any, result: any) => {
       if (err) {
         console.log('api doctor controller error', err);
         res.status(StatusCode.BadRequest).json({ message: err });
       } else {
 
        console.log('...check result for fecthing all appointments....',result)
        
 
         res.status(StatusCode.Created).json({
            result
         });
       }
     }
   );
 }





 RescheduleAppointment = async (rescheduleData: any) => {
  try {
  
    
    // Keep camelCase to match protobuf definition
    const transformedData = {
      action: rescheduleData.action || '',
      patientEmail: rescheduleData.patientEmail || '',  // Keep camelCase
      doctorEmail: rescheduleData.doctorEmail || '',    // Keep camelCase
      originalSlot: rescheduleData.originalSlot || null, // Keep camelCase
      newSlot: rescheduleData.newSlot || null           // Keep camelCase
    };
 
    
    // Validate the transformed data structure
    if (!transformedData.action || !transformedData.patientEmail || !transformedData.doctorEmail) {
      return {
        data: null,
        status: 'error',
        message: 'Missing required fields: action, patientEmail, or doctorEmail'
      };
    }
    
    if (!transformedData.originalSlot || !transformedData.newSlot) {
      return {
        data: null,
        status: 'error',
        message: 'Missing required slot information: originalSlot or newSlot'
      };
    }
    
    return new Promise((resolve, reject) => {
      DoctorService.rescheduleAppointment(
        transformedData,  
        async (err: any, result: any) => {
          if (err) {
            console.log('API doctor controller error:', err);
            const errorResponse = {
              data: err,
              status: 'error',
              message: 'Failed to reschedule appointment'
            };
            resolve(errorResponse);
          } else {
            console.log('Reschedule appointment result:', result);
            const successResponse = {
              data: result,
              status: 'success',
              message: 'Appointment rescheduled successfully'
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



SendingAlertInDoctorDash = async (req: Request, res: Response): Promise<void> => {
  try {
   

    const {startedAppointments} = req.body;
   
    startedAppointments.forEach(element => {
      console.log("element====",element);
      
      App.sendingAlertIn_DoctorDashboard(element);

    });
    
  } catch (error) {
    console.log(error)
  }
}



StoringMessagesInDb = async (messageData) => {
  try {
    return new Promise((resolve, reject) => {
      console.log('API gateway StoreMessage request:', messageData);
      
      // Map the incoming data to match the gRPC proto structure
      const grpcMessageData = {
        appointmentId: messageData.appointmentId || '',
        messageType: messageData.type || messageData.messageType || 'text',
        content: messageData.text || messageData.content || '',
        senderType: messageData.sender || messageData.senderType || '',
        timestamp: messageData.timestamp || new Date().toISOString(),
        senderId: messageData.senderId || messageData.userId || ''
      };

      
     
      
      
      
     
      
     
      
      

      console.log('Mapped gRPC message data:', grpcMessageData);
      
      DoctorService.StoreMessage(grpcMessageData, (err, result) => {
        if (err) {
          console.log('API gateway StoreMessage error:', err);
          const errorResponse = {
            success: false,
            message: err.message || 'Failed to store message',
            messageId: null,
            conversationId: null,
            savedAt: null
          };
          resolve(errorResponse);
        } else {
          console.log('Store message result:', result);
          const response = {
            success: result.success || false,
            message: result.message || 'Message stored successfully',
            messageId: result.messageId || null,
            conversationId: result.conversationId || null,
            doctorId: result.doctorId || null
          };
          resolve(response);
        }
      });
    });
  } catch (error) {
    console.error('API Gateway StoreMessage error:', error);
    return {
      success: false,
      message: `Unexpected error occurred: ${error.message}`,
      messageId: null,
      conversationId: null,
      savedAt: null
    };
  }
};

}