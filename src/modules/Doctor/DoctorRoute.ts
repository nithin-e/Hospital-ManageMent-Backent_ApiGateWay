import express from "express";
const DoctorRouter=express.Router()
import DoctorController from './DoctorController'
const DoctorControllers=new DoctorController()
import authController from "../auth/controller";
const AuthController=new authController()


DoctorRouter.post('/appointment-slots',AuthController.validateTokens('doctor'),DoctorControllers.storeDoctorSlotes)
DoctorRouter.post('/fetchDoctorSlots',AuthController.validateTokens('doctor'),DoctorControllers.fetchDoctorSlots)
DoctorRouter.post('/fectingAppointMentSlotes',AuthController.validateTokens('doctor'),DoctorControllers.fetchAppontMentSlotes)
DoctorRouter.get('/fectingAllUserAppointMents',AuthController.validateTokens('doctor'),DoctorControllers.fetchingAllUserAppointMents)
DoctorRouter.post('/appointment-alert',DoctorControllers.sendingAlertInDoctorDash)
DoctorRouter.post('/AddPrescription',AuthController.validateTokens('doctor'),DoctorControllers.addPrescription)
DoctorRouter.post('/fetchingPrescription',DoctorControllers.fetchingUserPrescription)




export default DoctorRouter