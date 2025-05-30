import { UserService } from "../user/config/user.client";
import { DoctorService } from "./config/Doctor.client";
import { Response, Request } from "express";





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
          remaining_slots: appointmentSettings.remainingSlots || []
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


// storeDoctorSlotes = async (req: Request, res: Response): Promise<void> => {
    
      
//     const { appointmentSettings } = req.body;
  
  
  
//  // API Controller
// DoctorService.StoreAppointmentSlots(
//     {
//       doctor_email: appointmentSettings.doctorEmail,
//       date_range: appointmentSettings.dateRange,
//       selected_dates: appointmentSettings.selectedDates,
//       time_slots: appointmentSettings.timeSlots.map(slot => ({
//         date: slot.date,
//         slots: slot.slots
//       }))
//     },
//     async (err: any, result: any) => {
//       if (err) {
//         console.log('api doctor controller error', err);
//         res.status(StatusCode.BadRequest).json({ message: err });
//       } else {

//        console.log('...check theeee result....',result)
       

//         res.status(StatusCode.Created).json({
//            result
//         });
//       }
//     }
//   );
// }


fetchDoctorSlots = async (req: Request, res: Response): Promise<void> => {
    
    
  
 // API Controller
DoctorService.fetchingDoctorSlots(
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


makingAppointMent = async (req: Request, res: Response): Promise<void> => {
    console.log('.....makingAppointMent.......',req.body);
    
 // API Controller
DoctorService.StoreAppointMent(
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





}