import { Response, Request } from "express";
import { UserService } from "./config/user.client"
import uploadToS3 from "../../services/s3";
import { DoctorService } from "../Doctor/config/Doctor.client";
import { NotificationService } from "../Notifications/config/notification.client";




const StatusCode = {
    OK: 200,
    Created: 201,
    BadRequest: 400,
    Unauthorized: 401,
    Forbidden: 403,
    NotFound: 404,
    InternalServerError: 500,
  };

export default class userController {

register = async (req: Request, res: Response): Promise<void> => {
  console.log('machaneeeeeeee rahathalle', req.body);
  const registerRequest = {
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    phoneNumber: req.body.phoneNumber,
    googleId: req.body.googleId, // added googleId here
  };

  try {
    UserService.Register(registerRequest, (err: any, result: any) => {
      if (err) {
        console.log('machaneeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee', err);
        res.status(StatusCode.BadRequest).json({ message: err });
      } else {
        console.log('else', result); // Should log the full response
        res.status(StatusCode.Created).json(result);
      }
    });
  } catch (error) {
    console.log('Unexpected error:', error);
    res.status(StatusCode.InternalServerError).json({ message: 'Server error' });
  }
  }

checkUser = async (req: Request, res: Response): Promise<void> => {
  
    UserService.CheckUser(
      { ...req.body },  
      (err: any, result: any) => {
        if (err) {
          console.log('api controller checkUser', err);
          res.status(StatusCode.BadRequest).json({ message: err });
        } else {
          console.log('..api..',result);
          
          res.status(StatusCode.Created).json(result);
        }
      }
    );
  };


loginUser=async(req:Request,res:Response):Promise<void>=>{

    console.log('.....',req.body)
    UserService.LoginUser(
      
      
      {...req.body},
      (err:any,result:any)=>{
        if (err) {
          console.log('api controller checkUser', err);
          res.status(StatusCode.BadRequest).json({ message: err });
        } else {
          console.log('..login controller enthelum kittando..',result);
          
          res.status(StatusCode.Created).json(result);
        }
      }
    )
  }





storingDoctorData = async(req: Request, res: Response): Promise<void> => {
    try {
      console.log('Doctor data received:', req.body);
      
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } || {};
      
      let profileImageUrl = '';
      let medicalLicenseUrl = '';
      
      // Check if files object exists and if profileImage exists
      if (files && files.profileImage && files.profileImage[0]) {
        profileImageUrl = await uploadToS3(files.profileImage[0]);
      }
      
      // Check if files object exists and if medicalLicense exists
      if (files && files.medicalLicense && files.medicalLicense[0]) {
        medicalLicenseUrl = await uploadToS3(files.medicalLicense[0]);
      }
      
      console.log('Files received:', profileImageUrl, medicalLicenseUrl);

      UserService.ApplyDoctor(
        {
          ...req.body,
          documentUrls: [profileImageUrl, medicalLicenseUrl].filter(url => url), // Only include non-empty URLs
          agreeTerms: req.body.agreeTerms === 'true' // Convert string 'true' to boolean
        },
        (err: any, result: any) => {
          if (err) {
            console.log('api controller checkUser', err);
            res.status(StatusCode.BadRequest).json({ message: err });
          } else {
            console.log('..login controller enthelum kittando..', result);
            
            res.status(StatusCode.Created).json(result);
          }
        }
      );
      
    } catch (error) {
      console.error('Error in storingDoctorData:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
}




changingPassword=async(req:Request,res:Response):Promise<void>=>{

    console.log('.foget pass....',req.body)
    UserService.ResetPassword(
      
      
      {...req.body},
      (err:any,result:any)=>{
        if (err) {
          console.log('api controller forget pass', err);
          res.status(StatusCode.BadRequest).json({ message: err });
        } else {
          console.log('..login controller enthelum kittando..',result);
          
          res.status(StatusCode.Created).json(result);
        }
      }
    )
  }



fetchDoctorDashBoardData = async(req: Request, res: Response): Promise<void> => {
    console.log('.fetching doctor data....', req.body);
    
    UserService.FetchDoctorDashBoardData(
      {...req.body},
      (err: any, result: any) => {
        if (err) {
          console.log('api controller error', err);
          res.status(StatusCode.BadRequest).json({ message: err });
        } else {
          // console.log('Doctor dashboard data:', result);
          
          // The result should now contain the doctor object directly
          if (result && result.doctor) {
            res.status(StatusCode.Created).json(result);
          } else {
            console.log('No doctor data found in response:', result);
            res.status(StatusCode.NotFound).json({ message: 'Doctor data not found' });
          }
        }
      }
    );
  }


fectingUserProfileData = async(req: Request, res: Response): Promise<void> => {
    console.log('.fetching user req.body....', req.body);
    
    UserService.fectingUserProfileDatas(
      {...req.body},
      (err: any, result: any) => {
        if (err) {
          console.log('api controller error', err);
          res.status(StatusCode.BadRequest).json({ message: err });
        } else {
          console.log('single user responce in api gateway:', result);
          res.status(StatusCode.Created).json(result);
        }
      }
    );
  }



changing_UserPassWord = async(req: Request, res: Response): Promise<void> => {
    console.log('.fetching user req.body....', req.body);
    
    UserService.changingUserPassWord(
      {...req.body},
      (err: any, result: any) => {
        if (err) {
          console.log('api controller error', err);
          res.status(StatusCode.BadRequest).json({ message: err });
        } else {
          console.log('change password responce in api gateway:', result);
          res.status(StatusCode.Created).json(result);
        }
      }
    );
  }


FectFullDoctors = async (req: Request, res: Response): Promise<void> => {
        try {
           
            const request = {};
            
            UserService.FetchAllDoctors(request, (err: any, result: any) => {
                if (err) {
                    console.log('err from api gate way in admin controller', err);
                    res.status(StatusCode.BadRequest).json({ message: err.message });
                } else {
                   console.log('success fully retraived the all doctod',result);
                   
                    res.status(StatusCode.OK).json(result); 
                }
            });
            
        } catch (error) {
            console.log('Unexpected error:', error);
            res.status(StatusCode.InternalServerError).json({ message: 'Server error' });
        }
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


fectingUserAppointMents = async(req: Request, res: Response): Promise<void> => {
    console.log('.fetching user req.body....', req.body);
    
    DoctorService.fectingUserAppointMents(
      {...req.body},
      (err: any, result: any) => {
        if (err) {
          console.log('api controller error', err);
          res.status(StatusCode.BadRequest).json({ message: err });
        } else {
          console.log('user appointments responce in api gateway:', result);
          res.status(StatusCode.Created).json(result);
        }
      }
    );
  }


ChangingUserInformations = async(req: Request, res: Response): Promise<void> => {
    console.log('.user infomationm while the editing tyme....', req.body);
    
    UserService.ChangingUserInfo(
      {...req.body},
      (err: any, result: any) => {
        if (err) {
          console.log('api controller error', err);
          res.status(StatusCode.BadRequest).json({ message: err });
        } else {
          console.log('user appointments responce in api gateway:', result);
          res.status(StatusCode.Created).json(result);
        }
      }
    );
  }


  
  create_checkOutSession_in_Stripe = async (req: Request, res: Response): Promise<void> => {
    console.log('ye yee yeee yee bro check it here', req.body);
    
    NotificationService.CreateCheckoutSession(
        {...req.body}, // This contains appointmentData
        (err: any, result: any) => {
            if (err) {
                console.log('api controller error', err);
                res.status(StatusCode.BadRequest).json({ message: err });
            } else {
                console.log('stripe check out session response:', result);
                res.status(StatusCode.Created).json(result);
            }
        }
    )
}




CancelingUserAppointMent = async(req: Request, res: Response): Promise<void> => {
  
  DoctorService.CancelUserAppointMent(
    {...req.body},
    (err: any, result: any) => {
      if (err) {
        res.status(StatusCode.BadRequest).json({ message: err });
      } else {

        res.status(StatusCode.Created).json(result);
      }
    }
  );
}






}