
import express from 'express'
const authRoute = express.Router();
import authController from './controller'
const AuthController=new authController()


 authRoute.post('/refresh',AuthController.refreshToken) 

export default authRoute;