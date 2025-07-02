import express, { Application, Request, Response, NextFunction } from "express";
import helmet from "helmet";
import logger from "morgan";
import cookieParser from "cookie-parser";
import compression from "compression";
import cors from "cors";
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

// import { limiter } from "./utils/rateLimitter.ts";

import userRoute from "./modules/user/route";
import adminRoute from "./modules/admin/adminRoutes";
import notificationRoute from "./modules/Notifications/notificationRoute";
import doctorRouter from './modules/Doctor/DoctorRoute'
import authRoute from "./modules/auth/route";

// You'll need to import your controller here
import userBlockController from './modules/user/controller';
import { UserService } from "./modules/user/config/user.client";
import DoctorController from './modules/Doctor/DoctorController'
const DoctorControllers = new DoctorController()
import NotificationController from './modules/Notifications/Notecontroller'
const NoteController = new NotificationController()


class App {
  public app: Application;
  private httpServer: http.Server;
  private io: SocketIOServer;
  private adminNamespace: any;
  private static instance: App; // Singleton instance
  private userSocketMap: Map<string, { socketId: string; role: string }> = new Map(); 

  constructor() {
    this.app = express();
    this.httpServer = http.createServer(this.app);
    App.instance = this; 
    this.setupSocketIO();
    this.applyMiddleware();
    this.routes();
    this.setupSocketHandlers();
  }

  public setupSocketIO(): void {
    // Log frontend URL for CORS
    const frontendUrl = process.env.NODE_ENV === 'dev' ? 
      "http://localhost:3001" : 
      process.env.ALLOWED_ORIGINS?.split(',') || []; 
    console.log('Frontend URL for CORS:', frontendUrl);

    // Set up Socket.io with CORS settings
    this.io = new SocketIOServer(this.httpServer, {
      cors: {
        origin: frontendUrl,
        methods: ["GET", "POST"],
        credentials: true
      }
    });
    console.log('Socket.io server created with CORS settings');

    // Create admin namespace
    this.adminNamespace = this.io.of('/admin');
    console.log('Admin namespace created');
  }

  private setupSocketHandlers(): void {
    this.adminNamespace.on('connection', (socket: any) => {
      console.log('Admin client connected:', socket.id);
    
      socket.on('register', async (data: any) => {
        console.log('Raw register data received.....................:', data);
        
        const { userId, role, email } = data;
        
        console.log('User registered:', userId, 'with role:', role, 'email:', email, 'socketId:', socket.id);
        
        const userInfo = {
            socketId: socket.id,
            role: role,
            userId: userId,
            email: email
        };
        
        // Store by both userId and email for flexible access
        this.userSocketMap.set(userId, userInfo);
        if (email) {
            this.userSocketMap.set(email, userInfo);
        }
    });

    
      socket.on('block_user', async (userData: { userId: string }, callback: (response: any) => void) => {
        console.log('Received block_user event with data:', userData);
        try {
          // Instead of going through the controller, call the service directly
          const result = await new Promise((resolve, reject) => {
            UserService.BlockUser(
              { id: userData.userId },
              (err: any, result: any) => {
                if (err) reject(err);
                else resolve(result);
              }
            );
          });  
          
          // Emit user status update to all admin clients
          this.adminNamespace.emit('user_status_updated', { 
            userId: userData.userId, 
            isBlocked: true 
          });
          
          callback({ success: true, result });
        } catch (error: any) {
          console.error('Error in block_user event handler:', error);
          callback({ success: false, error: error.message });
        }
      });
      
      // Handle user unblock via socket
      socket.on('unblock_user', async (userData: { userId: string }, callback: (response: any) => void) => {
        try {
          console.log('Received unblock_user event with data:', userData);

          const result = await new Promise((resolve, reject) => {
            UserService.UnblockUser(
              { id: userData.userId },
              (err: any, result: any) => {
                if (err) reject(err);
                else resolve(result);
              }
            );
          }); 
    
          // Emit user status update to all admin clients
          this.adminNamespace.emit('user_status_updated', { 
            userId: userData.userId, 
            isBlocked: false 
          });
      
          callback({ success: true, result });
        } catch (error: any) {
          console.error('Error in unblock_user event handler:', error);
          callback({ success: false, error: error.message });
        }
      });
      
      socket.on('reschedule-appointment', async (rescheduleData: {
        action: string;
        patientEmail: string;
        doctorEmail: string;
        originalSlot: {
          id: string;
          date: string;
          time: string;
          doctor_id: string;
        };
        newSlot: {
          id: string;
          time24: string;
          time12: string;
          available: boolean;
        };
      }, callback: (response: any) => void) => {
        console.log('Received reschedule-appointment event:', rescheduleData);
        
        try {
          console.log('Processing reschedule appointment...');
      
          // Call the reschedule appointment method
          const res = await DoctorControllers.RescheduleAppointment(rescheduleData);
          
          console.log('Controller response:', res);
          
          // Type assertion to access status property
          const typedRes = res as { status: string; data: any; message: string };
          
          if (typedRes.status === 'success') {
            // Format the new appointment time for notification
            const newAppointmentTime = `${rescheduleData.newSlot.time12}`
            
            // Send notification to patient
            const patientNotificationRes = await NoteController.RescheduleAppointmentNotification(
              rescheduleData.patientEmail, 
              newAppointmentTime
            );
            
            console.log('Notification................ results:', { 
              patient: patientNotificationRes, 
            });
            
            callback({ 
              success: true, 
              message: 'Appointment rescheduled and notifications sent successfully',
              data: typedRes.data 
            });
          } else {
            callback({ 
              success: false, 
              error: typedRes.message || 'Failed to reschedule appointment' 
            });
          }
          
        } catch (error: any) {
          console.error('Error in reschedule-appointment handler:', error);
          callback({ 
            success: false, 
            error: error.message || 'Failed to reschedule appointment' 
          });
        }
      });

      // Handle fetch notifications
      socket.on('fetchNotifications', async (data: { email: string }) => {
        console.log('Received fetchNotifications event with email:', data.email);
        try {
          const response = await NoteController.fetchAllNotifications(data.email)
          
          // Emit response back to the client
          socket.emit('notificationsResponse', response);
          
        } catch (error: any) {
          console.error('Error fetching notifications:', error);
          socket.emit('notificationsResponse', { 
            success: false, 
            error: error.message 
          });
        }
      })

      socket.on('sendMessage', async (messageData) => {
      
        console.log('bro plz check here <<<>>>',messageData);
        
        interface MessageResponse {
          success: boolean;
          message: string;
          messageId: string;
          conversationId: string;
          doctorId: string;
        }
        
         const response = await DoctorControllers.StoringMessagesInDb(messageData)as MessageResponse
        //  const doctorSocketInfo = App.instance.userSocketMap.get(response.doctorId) 
         const mapAsObject = Object.fromEntries(this.userSocketMap);
         console.log('Current userSocketMap as Object:', mapAsObject);
         

        //  console.log('now u will definetly get the doctor socket id',doctorSocketInfo);
         
 
      });

    


      socket.on('disconnect', () => {
        console.log('Admin client disconnected:', socket.id);
        for (const [userId, userInfo] of this.userSocketMap.entries()) {
          if (userInfo.socketId === socket.id) {
            this.userSocketMap.delete(userId);
            console.log(`Removed user ${userId} from socket map`);
            break;
          }
        }
      });

    });
  }


  // Fixed static method
 public static sendingAlertIn_DoctorDashboard(appointmentData: any) {
    console.log("Sending alert to doctor dashboard:", appointmentData);
    
    if (!App.instance) {
        console.error("App instance not available");
        return;
    }


    
    const doctorSocketInfo = App.instance.userSocketMap.get(appointmentData.doctorId);
    const userSocketInfo = App.instance.userSocketMap.get(appointmentData.userId);

  
    
    if (doctorSocketInfo) {
        console.log(`Alert sent to doctor ${appointmentData.doctorEmail} on socket ${doctorSocketInfo.socketId}`);



        App.instance.adminNamespace.to(doctorSocketInfo.socketId).emit("doctor_alert", {
          type: "appointment_update",
          data: appointmentData
      });


    } else {
        console.log(`Doctor ${appointmentData.doctorEmail} not connected or not found in socket map`);
    }
    
    if (userSocketInfo) {
        App.instance.adminNamespace.to(userSocketInfo.socketId).emit("user_alert", {
          type: "appointment_update",
          data: appointmentData
      });


        console.log(`Alert sent to user ${appointmentData.patientEmail} on socket ${userSocketInfo.socketId}`);
    } else {
        console.log(`User ${appointmentData.patientEmail} not connected or not found in socket map`);
    }
}

  private applyMiddleware(): void {
    console.log("Middleware applied!");

    this.app.use('/webhook', express.raw({type: 'application/json'}));
    this.app.use(express.json({ limit: "50mb" }));
    this.app.use(express.urlencoded({ extended: true }));

    this.app.use(
      cors({
        origin: [process.env.CORS_ORIGIN,'http://localhost:7000'],
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
      next();
    });
  }

  private routes(): void {
    this.app.use("/api/auth/user", userRoute);
    this.app.use('/api/admin', adminRoute);
    this.app.use('/api/notifiction', notificationRoute);
    this.app.use('/', notificationRoute);
    this.app.use('/api/doctor/', doctorRouter);
    this.app.use('/auth', authRoute);         
  }

  public startServer(port: number): void {
    this.httpServer.listen(port, () => {
      console.log("\x1b[44m\x1b[30m%s\x1b[0m", `🚀 [INFO] API-Gateway with Socket.io started on port ${port} ✅`);
    });
    
    this.httpServer.on('error', (error) => {
      console.error('HTTP Server error:', error);
    });
  }

  // Getter methods to access Socket.io instances if needed elsewhere
  public getSocketIO(): SocketIOServer {
    return this.io;
  }

  public getAdminNamespace(): any {
    return this.adminNamespace;
  }

  
  public getUserSocketMap(): Map<string, { socketId: string; role: string }> {
    return this.userSocketMap;
  }
}

export default App;