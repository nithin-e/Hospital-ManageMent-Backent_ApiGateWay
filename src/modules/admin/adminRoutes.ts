import express  from "express";
const adminRoute=express.Router()
import adminController from "./controller/adminController";
const AdminController=new adminController()
import authController from "../auth/controller";
const AuthController=new authController()


adminRoute.get('/fecthAllUser',AuthController.validateTokens('admin'),AdminController.FectFullUsers)
adminRoute.get('/fecthAllDoctors',AuthController.validateTokens('admin'),AdminController.FectFullDoctors)
adminRoute.post('/deleteDoctorAfterReject',AuthController.validateTokens('admin'),AdminController.deleteDoctorAfterReject)
adminRoute.get('/search',AuthController.validateTokens('admin'),AdminController.filteringUsers)
adminRoute.get('/doctorPagination',AdminController.filteringDoctors)
adminRoute.post('/FecthAppointMentForAdmin',AuthController.validateTokens('admin'),AdminController.FecthAppointMentForAdmin)
adminRoute.post('/blockingDoctor',AuthController.validateTokens('admin'),AdminController.createAdminBlockingNotifications)
adminRoute.post('/addService',AuthController.validateTokens('admin'),AdminController.addNewService)
adminRoute.get('/fetchService',AdminController.fetchServices)
adminRoute.post('/deleteService/:serviceId',AuthController.validateTokens('admin'),AdminController.deleteService)
adminRoute.post('/editService/:serviceId',AuthController.validateTokens('admin'),AdminController.editService)




export default adminRoute;