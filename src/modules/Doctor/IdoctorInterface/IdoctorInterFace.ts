import { Appointment } from "../../user/IuserInterface/userInterFace";

export interface AppointmentData{
 id :string;
 doctor_id:string;
 date:string;
 time:string;
 is_booked:boolean;
 patientEmail:string;
}

export interface StoreAppointmentSlotsResponse {
  success?: boolean;
  message?: string;
  slots_created?: number;
  dates?: string
  slots_removed?: number;
  slots_updated?: number;
  new_slots_created?: number;
}



export interface AppointmentSlot {
    id:string;
    doctor_id:string;
    date:string;
    time:string;
    is_booked:string;
    patientEmail:string;
}

export interface FetchingDoctorSlotsResponse {
  success?: boolean;
  message?: string;
  slots_created?: number;
  dates?: string;
  slots:AppointmentSlot
}






interface SlotInfo{
    id:string;
    time:string;
    is_booked:boolean
}


export interface DateSlots {
    date:string;
    slots:SlotInfo
    
}

export interface FetchingAppointmentSlotsResponse {
  success?: boolean;
  slots_created?: number;
  dates?: string;
  time_slots:DateSlots
}

export interface fetchingUserAppointmentsResponse {
    appointments:Appointment;
    success:boolean;
    message:string;

}

export interface makingAddPrescriptionResponse {
    success:boolean;
}


export interface fetchingPrescriptionResponse {
    prescriptionDetails : string;
    date:string;
    time:string;
    patientEmail:string;
    doctorEmail:string;
}


