import { Response, Request } from "express";
import { UserService } from "../../user/config/user.client";
import { DoctorService } from "../../Doctor/config/Doctor.client";
import { NotificationService } from "../../Notifications/config/notification.client";
import {
  DeleteDoctorResponse,
  fectAllDoctorsResponse,
  FetchAllUsersResponse,
  fetchingUserAppointmentsResponse,
} from "../IadminInterface/Iadmin";

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

      UserService.FetchAllUsers(
        request,
        (err: Error | null, result: FetchAllUsersResponse) => {
          if (err) {
            console.log("err from api gate way in admin controller", err);
            res.status(StatusCode.BadRequest).json({ message: err.message });
          } else {
            console.log("ibde onn nokke", result);

            res.status(StatusCode.OK).json(result);
          }
        }
      );
    } catch (error) {
      console.log("Unexpected error:", error);
      res
        .status(StatusCode.InternalServerError)
        .json({ message: "Server error" });
    }
  };

  FectFullDoctors = async (req: Request, res: Response): Promise<void> => {
    try {
      const request = {};

      UserService.FetchAllDoctors(
        request,
        (err: Error | null, result: fectAllDoctorsResponse) => {
          if (err) {
            console.log("err from api gate way in admin controller", err);
            res.status(StatusCode.BadRequest).json({ message: err.message });
          } else {
            console.log("check the all doctor", result);

            res.status(StatusCode.OK).json(result);
          }
        }
      );
    } catch (error) {
      console.log("Unexpected error:", error);
      res
        .status(StatusCode.InternalServerError)
        .json({ message: "Server error" });
    }
  };

  deleteDoctorAfterReject = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      UserService.DeleteDoctorAfterAdminReject(
        { ...req.body },
        (err: Error | null, result: DeleteDoctorResponse) => {
          if (err) {
            console.log("err from api gate way in admin controller", err);
            res.status(StatusCode.BadRequest).json({ message: err.message });
          } else {
            console.log("else heyy", result);
            res.status(StatusCode.OK).json(result);
          }
        }
      );
    } catch (error) {
      console.log("Unexpected error:", error);
      res
        .status(StatusCode.InternalServerError)
        .json({ message: "Server error" });
    }
  };

  FilteringUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log("check for this query params", req.query);

      
      const searchRequest = {
        searchQuery: (req.query.q as string) || "",
        sortBy: (req.query.sortBy as string) || "createdAt",
        sortDirection: (req.query.sortDirection as string) || "desc",
        role: (req.query.role as string) || "",
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 50,
      };

      UserService.SearchUsers(searchRequest, (err: Error | null, result) => {
        if (err) {
          console.log("err from api gateway in admin controller", err);
          res.status(StatusCode.BadRequest).json({ message: err.message });
        } else {
          console.log("check the result query params", result);
          res.status(StatusCode.OK).json(result);
        }
      });
    } catch (error) {
      console.log("Unexpected error:", error);
      res
        .status(StatusCode.InternalServerError)
        .json({ message: "Server error" });
    }
  };

  FecthAppointMentForAdmin = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      DoctorService.fectingAllUserAppointMents(
        { ...req.body },
        async (err: Error | null, result: fetchingUserAppointmentsResponse) => {
          if (err) {
            console.log("api doctor controller error", err);
            res.status(StatusCode.BadRequest).json({ message: err });
          } else {
            console.log(
              "...check result for fecthing all appointments admin aahne....",
              result
            );

            res.status(StatusCode.Created).json({
              result,
            });
          }
        }
      );
    } catch (error) {
      console.log("Unexpected error:", error);
      res
        .status(StatusCode.InternalServerError)
        .json({ message: "Server error" });
    }
  };

  createAdminBlockingNotifications = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    NotificationService.createAdminBlockingNotification(
      { ...req.body },
      async (err: Error | null, result) => {
        if (err) {
          console.log("api notification controller forget pass", err);
          res.status(StatusCode.BadRequest).json({ message: err });
        } else {
          UserService.blockingDoctor(
            { ...req.body },
            async (err: Error | null, result: boolean) => {
              if (err) {
                console.log("api notification controller forget pass", err);
                res.status(StatusCode.BadRequest).json({ message: err });
              } else {
                console.log(
                  "check here after getting bocking the user",
                  result
                );
                res.status(StatusCode.Created).json({
                  result,
                });
              }
            }
          );
        }
      }
    );
  };
}
