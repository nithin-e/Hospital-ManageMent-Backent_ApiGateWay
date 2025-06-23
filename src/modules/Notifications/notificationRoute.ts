import express from "express";
const NotificationRouter=express.Router()
import NotificationController from './Notecontroller'
const NoteController = new NotificationController()
import authController from '../auth/controller';
const AuthController=new authController()

NotificationRouter.post('/storeNotificationData',NoteController.StoringNotificationData)
// NotificationRouter.post('/getNotifications',AuthController.validateTokens('user'),NoteController.fetchAllNotifications)
NotificationRouter.post('/webhook',NoteController.UpdateDbAfterPayment)
NotificationRouter.post('/handleCanceldoctorApplication',NoteController.handleCanceldoctorApplication)


export default NotificationRouter;