


export interface Doctor {
    id?:string;
    firstName:string;
    lastName:string;
    email:string;
    phoneNumber?:string;
    licenseNumber?:string;
    medicalLicenseNumber?:string;
    specialty?:string;
    qualifications?:string;
    agreeTerms?:boolean;
    profileImageUrl?:string;
    medicalLicenseUrl?:string;
    status?:string;
    createdAt?:string;
    isActive:boolean;
}



export interface UserData {
  _id?: string;
  name?: string;
  email?: string;
  password?: string;
  phone_number?: string;
  created_at?: string;
  version?: number;
  google_id?: string;
  role?: string;
  isActive?: boolean;
  id?: string;
}

export interface Appointment {
    id:string;
    patientName:string;
    doctorEmail:string;
    patientPhone:string;
    appointmentDate:string;
    appointmentTime:string;
    notes?:string;
    doctorName:string;
    specialty:string;
    patientEmail:string;
    status?:string;
    message:string;
    payment_method:string;
    paymentStatus:string;
    amount:string;
    doctorAmount:string;
    adminAmount:string;
    userRefoundAmount:string;
    userId:string;
    doctorId:string;
    Prescription:string;
}




export interface RegisterResponse {
  user: UserData;
  access_token: string;
  refresh_token: string;
}

export interface checkUserResponse {
  message:string;
  success:boolean
}


export interface LoginUserResponse {
     user: UserData;
      access_token: string;
     refresh_token: string;
}


export  interface ApplyDoctorResponse {
    success :boolean;
    id?:string;
    first_name?:string;
    last_name?:string;
    phone_number?:string;
    specialty?:string;
    status?:string;
    message?:string
}

export  interface ResetPasswordResponse {
    success :boolean;
   
}



export interface FetchDoctorDashBoardDataResponse {
    doctor:Doctor 
}


export interface fectingUserProfileDatasResponse {
    user: UserData;    
}

export interface fectAllDoctorsResponse{
doctors:Doctor
}


export interface SlotInfo {
    id:string;
    time:string;
    is_booked:boolean
}





export interface DateSlots {
    date:string;
    slots:SlotInfo;
}




export interface fetchingAppontMentSlotesResponse {
    success:boolean;
    slots_created?:any
    dates:string
    time_slots:DateSlots

}

export interface StoreAppointMentResponse {
    success:boolean;
    message:string;
    appointment_id:string
}

export interface fetchingUserAppointmentsResponse{
    appointments:Appointment;
    success:boolean;
    message:string
}


export interface MessageInfo {
  messageId: string;
  senderId: string;
  receiverId: string;
  appointmentId: string;
  messageType: string;
  content: string;
  senderType: string;
  fileUrl: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationInfo {
    conversationId:string;
    participants:string;
    appointmentId:string;
    lastMessage:string;
    lastMessageType:string;
    lastMessageTimestamp:string;
    messages:MessageInfo;
}

export interface fetchingConversationsResponse {
    success:boolean;
    conversations:ConversationInfo;
    message:string;
}


