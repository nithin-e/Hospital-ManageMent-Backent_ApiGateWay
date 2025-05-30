import express, { Application, Request, Response, NextFunction } from "express";
import helmet from "helmet";
import logger from "morgan";
import cookieParser from "cookie-parser";
import compression from "compression";
import cors from "cors";

// import { limiter } from "./utils/rateLimitter.ts";

import userRoute from "./modules/user/route";
import adminRoute from "./modules/admin/adminRoutes";
import notificationRoute from "./modules/Notifications/notificationRoute";
import doctorRouter from './modules/Doctor/DoctorRoute'
import authRoute from "./modules/auth/route";






class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.applyMiddleware();
    this.routes();
  }

  private applyMiddleware(): void {
    console.log("Middleware applied!");

    
    this.app.use('/webhook', express.raw({type: 'application/json'}));
    this.app.use(express.json({ limit: "50mb" }));
    this.app.use(express.urlencoded({ extended: true }));
   

    this.app.use(
      cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
      })
    );

    this.app.use(compression());
    this.app.use(helmet());
    this.app.use(logger("dev"));
    this.app.use(cookieParser());

    // Global middleware to verify API Gateway handling
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`🌐 [API-GATEWAY] Incoming request: ${req.method} ${req.url}`);
      // console.log("Request Body:", req.body); 
      // console.log("Request Headers:", req.headers); 
      next();
    });



    // this.app.use(limiter);
  }

  private routes(): void {
    this.app.use("/api/auth/user",userRoute)
    this.app.use('/api/admin',adminRoute)
    this.app.use('/api/notifiction',notificationRoute)
    this.app.use('/',notificationRoute)
    this.app.use('/api/doctor/',doctorRouter)
    this.app.use('/auth',authRoute)
  }



  public startServer(port: number): void {
    this.app.listen(port, () => {
      console.log("\x1b[44m\x1b[30m%s\x1b[0m", `🚀 [INFO] API-Gateway started on port ${port} ✅`);
    });
  }
}







export default App;