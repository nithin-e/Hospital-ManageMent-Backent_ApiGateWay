import { Response, Request } from "express";
import { UserService } from "../../user/config/user.client";

const StatusCode = {
    OK: 200,
    Created: 201,
    BadRequest: 400,
    Unauthorized: 401,
    Forbidden: 403,
    NotFound: 404,
    InternalServerError: 500,
};

export default class adminController {
    FectFullUsers = async (req: Request, res: Response): Promise<void> => {
        try {
           
            const request = {};
            
            UserService.FetchAllUsers(request, (err: any, result: any) => {
                if (err) {
                    console.log('err from api gate way in admin controller', err);
                    res.status(StatusCode.BadRequest).json({ message: err.message });
                } else {
                   
                    
                    res.status(StatusCode.OK).json(result); // Using 200 OK is more appropriate for GET
                }
            });
            
        } catch (error) {
            console.log('Unexpected error:', error);
            res.status(StatusCode.InternalServerError).json({ message: 'Server error' });
        }
    }


    FectFullDoctors = async (req: Request, res: Response): Promise<void> => {
        try {
           
            const request = {};
            
            UserService.FetchAllDoctors(request, (err: any, result: any) => {
                if (err) {
                    console.log('err from api gate way in admin controller', err);
                    res.status(StatusCode.BadRequest).json({ message: err.message });
                } else {
                   
                    res.status(StatusCode.OK).json(result); // Using 200 OK is more appropriate for GET
                }
            });
            
        } catch (error) {
            console.log('Unexpected error:', error);
            res.status(StatusCode.InternalServerError).json({ message: 'Server error' });
        }
    }


    deleteDoctorAfterReject = async (req: Request, res: Response): Promise<void> => {
        try {
           
           
            
            UserService.DeleteDoctorAfterAdminReject(
                {...req.body}, 
                (err: any, result: any) => {
                if (err) {
                    console.log('err from api gate way in admin controller', err);
                    res.status(StatusCode.BadRequest).json({ message: err.message });
                } else {
                    console.log('else heyy', result);
                    res.status(StatusCode.OK).json(result); // Using 200 OK is more appropriate for GET
                }
            });
            
        } catch (error) {
            console.log('Unexpected error:', error);
            res.status(StatusCode.InternalServerError).json({ message: 'Server error' });
        }
    }
}