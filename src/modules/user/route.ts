import express from 'express'
const userRoute = express.Router();
import userController from './controller'
import upload from '../../middleware/multer';
const controller = new userController();
import authController from '../auth/controller';
const AuthController=new authController()



userRoute.post('/register',controller.registerUser)
userRoute.post('/checkUser',controller.checkUser)
userRoute.post('/loginUser',controller.loginUser)


userRoute.post('/applyDoctor', 
    AuthController.validateTokens('user'), 
    upload.fields([
        { name: 'profileImage', maxCount: 1 },
        { name: 'medicalLicense', maxCount: 1 }
    ]), 
    controller.applyDoctor
)


userRoute.post('/forgetPassword',controller.changingPassword)
userRoute.post('/fetchDoctorDashBoardData',controller.fetchDoctorDashBoardData)
userRoute.post('/fectingUserProfileData',AuthController.validateTokens('user'),controller.fetchingUserProfileData)
userRoute.post('/changing_UserPassWord',AuthController.validateTokens('user'),controller.changingUserPassWord)
userRoute.get('/fecthAllDoctors',AuthController.validateTokens('user'),controller.FetchFullDoctors)
userRoute.post('/fectingAppointMentSlotes',AuthController.validateTokens('user'),controller.fetchAppontMentSlotes)
userRoute.post('/makingAppointMent',AuthController.validateTokens('user'),controller.makingAppointMent)
userRoute.post('/fectingAppointMent',AuthController.validateTokens('user'),controller.fectingUserAppointMents)
userRoute.post('/ChangingUserInfo',AuthController.validateTokens('user'),controller.ChangingUserInformations)
userRoute.post('/create-checkout-session',AuthController.validateTokens('user'),controller.createCheckOutSessionInStripe)
userRoute.post('/CancelingUserAppointMent',AuthController.validateTokens('user'),controller.CancelingUserAppointMent)
userRoute.post('/fetchUserConversations',controller.fetchUserConversations)




export default userRoute;