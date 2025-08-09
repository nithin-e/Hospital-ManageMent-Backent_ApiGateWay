import { Appointment, Doctor, UserData } from "../../user/IuserInterface/userInterFace";



export interface FetchAllUsersResponse {
    users: UserData;    
}

export interface fectAllDoctorsResponse{
  doctors:Doctor
}


export interface DeleteDoctorResponse{
  success:boolean
}


export interface fetchingUserAppointmentsResponse {
  appointments:Appointment;
  success:boolean;
  message:string
}

