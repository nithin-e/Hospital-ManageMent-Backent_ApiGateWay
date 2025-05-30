import express  from "express";
const adminRoute=express.Router()
import adminController from "./controller/adminController";
const AdminController=new adminController()
import authController from "../auth/controller";
const AuthController=new authController()


adminRoute.get('/fecthAllUser',AuthController.validateTokens('admin'),AdminController.FectFullUsers)
adminRoute.get('/fecthAllDoctors',AuthController.validateTokens('admin'),AdminController.FectFullDoctors)
adminRoute.post('/deleteDoctorAfterReject',AuthController.validateTokens('admin'),AdminController.deleteDoctorAfterReject)


export default adminRoute;