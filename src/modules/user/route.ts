import express from 'express'
const userRoute = express.Router();
import userController from './controller'
import upload from '../../middleware/multer';
const controller = new userController();
import authController from '../auth/controller';
const AuthController=new authController()



userRoute.post('/register',controller.register)
userRoute.post('/checkUser',controller.checkUser)
userRoute.post('/loginUser',controller.loginUser)

// Apply doctor route - only users can apply to become doctors
userRoute.post('/applyDoctor', 
    AuthController.validateTokens('user'), 
    upload.fields([
        { name: 'profileImage', maxCount: 1 },
        { name: 'medicalLicense', maxCount: 1 }
    ]), 
    controller.storingDoctorData
)


userRoute.post('/forgetPassword',controller.changingPassword)
userRoute.post('/fetchDoctorDashBoardData',controller.fetchDoctorDashBoardData)
userRoute.post('/fectingUserProfileData',AuthController.validateTokens('user'),controller.fectingUserProfileData)
userRoute.post('/changing_UserPassWord',AuthController.validateTokens('user'),controller.changing_UserPassWord)

export default userRoute;