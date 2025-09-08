import { status } from "@grpc/grpc-js";
import { UserService } from "../user/config/user.client";
import { DoctorService } from "./config/Doctor.client";
import { Response, Request } from "express";
import App from "../../app";
import { AppointmentData, FetchingAppointmentSlotsResponse, FetchingDoctorSlotsResponse, fetchingPrescriptionResponse, fetchingUserAppointmentsResponse, makingAddPrescriptionResponse, StoreAppointmentSlotsResponse } from "./IdoctorInterface/IdoctorInterFace";






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
  


     
      

      // Call gRPC Service
      DoctorService.StoreAppointmentSlots(
        serviceData,
        (err: Error | null, result: StoreAppointmentSlotsResponse) => {
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
    async (err: Error | null, result: FetchingDoctorSlotsResponse) => {
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
    async (err: Error | null, result: FetchingAppointmentSlotsResponse) => {
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





fetchingAllUserAppointMents = async (req: Request, res: Response): Promise<void> => {
    

  
  // API Controller
    DoctorService.fectingUserAppointMents(
  {...req.body},
     async (err: Error | null, result: fetchingUserAppointmentsResponse) => {
       if (err) {
         console.log('api doctor controller error', err);
         res.status(StatusCode.BadRequest).json({ message: err });
       } else {
     console.log('machuveeeeeeeeeeeeeeeeeeeeeeeeeeeeee',result);

         res.status(StatusCode.Created).json({
            result
         });
       }
     }
   );
 }




 rescheduleAppointment = async (rescheduleData) => {
  try {

    const transformedData = {
      action: rescheduleData.action || '',
      patientEmail: rescheduleData.patientEmail || '',  
      doctorEmail: rescheduleData.doctorEmail || '',    
      originalSlot: rescheduleData.originalSlot || null, 
      newSlot: rescheduleData.newSlot || null           
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
        async (err: Error | null, result) => {
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



sendingAlertInDoctorDash = async (req: Request, res: Response): Promise<void> => {
  try {
   

    const {startedAppointments} = req.body;
   
    startedAppointments.forEach(element => {
      
      
      App.sendingAlertInDoctorDashboard(element);

    });
    
  } catch (error) {
    console.log(error)
  }
}



StoringMessagesInDb = async (messageData) => {
  try {
    return new Promise((resolve, reject) => {
     
      const grpcMessageData = {
        appointmentId: messageData.appointmentId ||messageData.conversationId|| '',
        messageType: messageData.type || messageData.messageType || 'text',
        content: messageData.text || messageData.content ||messageData.message||'',
        senderType: messageData.sender || messageData.senderType || '',
        timestamp: messageData.timestamp || new Date().toISOString(),
        senderId: messageData.senderId || messageData.userId ||messageData.patientId || '',
        fileUrl :messageData.fileUrl,
        receverId:messageData.receverId  ||messageData.receiverId   
      };

      
    

     
      
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




fecthingUserDetailsThroughSocket = async (callData) => {
  try {
      return new Promise((resolve, reject) => {
        UserService.fecthingUserDetailsThroughSockets(callData, (err, result) => {
              if (err) {
                  console.log('API gateway fecthingUserDetailsThroughSocket error:', err);
                  const errorResponse = {
                      success: false,
                      message: err.message || 'Failed to fetch user details',
                      data: null
                  };
                  resolve(errorResponse);
              } else {
                  
                  resolve(result);
              }
          });
      });
  } catch (error) {
      console.error('API Gateway fecthingUserDetailsThroughSocket error:', error);
      return {
          success: false,
          message: `Unexpected error occurred: ${error.message}`,
          data: null
      };
  }
};



CancellingAppointmentDueToUser = async (callData) => {
  try {

    return new Promise((resolve, reject) => {
      const requestData = {
        appointmentId: callData.AppointmentInfo.appointmentId
      };
      
      DoctorService.AppointmentCancelingDueToUser(requestData, (err, result) => {
        if (err) {
          console.log('API gateway cancellingAppointmentDueToUser error:', err);
          const errorResponse = {
            success: false,
            message: err.message || 'cancellingAppointmentDueToUser',
            data: null
          };
          resolve(errorResponse);
        } else {
          resolve(result);
        }
      });
    });
  } catch (error) {
    console.error('API Gateway cancellingAppointmentDueToUser error:', error);
    return {
      success: false,
      message: `Unexpected error occurred: ${error.message}`,
      data: null
    };
  }
}


afterTheConsultation = async (callData) => {
  try {
    console.log('video chat ended', callData);
    
    return new Promise((resolve, reject) => {
      const requestData = {
        appointmentId: callData.appointmentId,
        endedBy:callData.endedBy
      };
      
      DoctorService.AfterTheConsultationUpdatingAppointMent(requestData, (err, result) => {
        if (err) {
          console.log('API gateway cancellingAppointmentDueToUser error:', err);
          const errorResponse = {
            success: false,
            message: err.message || 'cancellingAppointmentDueToUser',
            data: null
          };
          resolve(errorResponse);
        } else {

          console.log('ckeck the response  aftrt the consultation',result)
          resolve(result);
        }
      });
    });
  } catch (error) {
    console.error('API Gateway cancellingAppointmentDueToUser error:', error);
    return {
      success: false,
      message: `Unexpected error occurred: ${error.message}`,
      data: null
    };
  }
}

addPrescription = async (req: Request, res: Response): Promise<void> => {
 DoctorService.makingAddPrescription(
     {...req.body},
     async (err: Error | null, result: makingAddPrescriptionResponse) => {
       if (err) {
         console.log('api doctor controller error', err);
         res.status(StatusCode.BadRequest).json({ message: err });
       } else {
         res.status(StatusCode.Created).json({
            result
         });
       }
     }
   );
 }


fetchingUserPrescription = async (req: Request, res: Response): Promise<void> => {

 DoctorService.fetchingPrescription(
     {...req.body},
     async (err: Error | null,result: fetchingPrescriptionResponse) => {
       if (err) {
         console.log('api doctor controller error', err);
         res.status(StatusCode.BadRequest).json({ message: err });
       } else {

         res.status(StatusCode.Created).json({
            result
         });
       }
     }
   );
 }


  


 cancelingBookedUserAppointMent = async (callData:AppointmentData) => {
  try {
   
    
    console.log('this is my booked user apppointment data',callData);
    
    return new Promise((resolve, reject) => {


      const requestData = {
        id: callData.id,
        doctor_id:callData.doctor_id,
        date:callData.date,
        time:callData.time,
        patientEmail:callData.patientEmail,
        is_booked:callData.is_booked
      };
      
      console.log('.....check here......',requestData)
      DoctorService.doctorCancellingUserBookedAppointMent(requestData, (err, result) => {
        if (err) {
          console.log('API gateway cancellingAppointmentDueToUser error:', err);
          const errorResponse = {
            success: false,
            message: err.message || 'cancellingAppointmentDueToUser',
            data: null
          };
          resolve(errorResponse);
        } else {

          console.log('ckeck the response  aftrt the consultation',result)
          resolve(result);
        }
      });
    });
  } catch (error) {
    console.error('API Gateway cancellingAppointmentDueToUser error:', error);
    return {
      success: false,
      message: `Unexpected error occurred: ${error.message}`,
      data: null
    };
  }
}



filteringDoctorAppoinments = async (req: Request, res: Response): Promise<void> => {

  const searchRequest = {
        searchQuery: (req.query.q as string) || "",
        sortBy: (req.query.sortBy as string) || "createdAt",
        sortDirection: (req.query.sortDirection as string) || "desc",
        role: (req.query.role as string) || "",
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 50,
      };


       console.log("are u getting this check the responce",searchRequest);

 DoctorService.filteringDoctorAppoinments(
     {...req.body},
     async (err: Error | null,result: fetchingPrescriptionResponse) => {
       if (err) {
         console.log('api doctor controller error', err);
         res.status(StatusCode.BadRequest).json({ message: err });
       } else {
          // console.log('check this responce',result)
         res.status(StatusCode.Created).json({
            result
         });
       }
     }
   );
 }



}