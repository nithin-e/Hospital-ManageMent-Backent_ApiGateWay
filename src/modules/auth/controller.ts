import { Response, Request, NextFunction } from "express";
import { AuthService } from "./config/auth.client";



const StatusCode = {
    OK: 200,
    Created: 201,
    BadRequest: 400,
    Unauthorized: 401,
    Forbidden: 403,
    NotFound: 404,
    InternalServerError: 500,
  };


export default class authController {
  
  validateTokens = (allowedRoles: string | string[]) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authHeader = req.headers.authorization;
            const token = authHeader?.split(' ')[1];
            
            if (!token) {
                res.status(401).json({ 
                    success: false, 
                    message: 'No token provided' 
                });
                return;
            }


            console.log('role', allowedRoles);

            // Convert allowedRoles to string
            const roleString = Array.isArray(allowedRoles) 
                ? allowedRoles.join(',') 
                : allowedRoles;
            
            const request = {
                token: token,
                required_role:roleString  // Now it's always a string
            };

            console.log('check out the datas', request);

          
            

            AuthService.ValidateToken(
                request,  
                (err: any, result: any) => {
                    if (err) {
                        console.log('gRPC error:', err);
                        res.status(500).json({ message: 'Authentication service error' });
                    } else {

                      console.log('result in api gate way',result);
                      
                        if (result.message=='Authentication successful') {
                            next();
                        } else {
                            res.status(401).json({ 
                                success: false, 
                                message: result.message || 'Token validation failed' 
                            });
                        }
                    }
                }
            );
            
        } catch (error) {
            console.error('Error validating token:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Internal server error' 
            });
        }
    }
}

refreshToken = async (req: Request, response: Response): Promise<void> => {
    try {
        console.log('Token refresh request received');
        
        const { token } = req.body;
        
        if (!token) {
            response.status(StatusCode.BadRequest).json({
                success: false,
                message: 'Refresh token is required'
            });
            return;
        }

        console.log('Refreshing token for:', token.substring(0, 20) + '...');

        const request = {
            token: token
        };

        // Call AuthService to refresh the token
        AuthService.RefreshToken(
            request,
            (err: any, result: any) => {
                if (err) {
                    console.error('gRPC error during token refresh:', err);
                    response.status(StatusCode.InternalServerError).json({
                        success: false,
                        message: 'Authentication service error'
                    });
                    return;
                }

                console.log('Token refresh result:', {
                    success: result.success,
                    message: result.message
                });
                
                if (result.success) {
                    response.status(StatusCode.OK).json({
                        success: true,
                        message: 'Token refreshed successfully',
                        data: {
                            accessToken: result.accessToken,
                            refreshToken: result.refreshToken,
                            userId: result.userId,
                            role: result.role
                        }
                    });
                } else {
                    console.log('yee yee yeeeeeeeeeee');
                    
                    let statusCode = StatusCode.Unauthorized;
                    
                    
                    if (result.message?.includes('expired')) {
                        statusCode = StatusCode.Unauthorized;
                        console.log('Refresh token expired - user needs to login again');
                    } else if (result.message?.includes('Invalid refresh token')) {
                        statusCode = StatusCode.BadRequest;
                        console.log('Invalid refresh token format');
                    }
                    
                    response.status(statusCode).json({
                        success: false,
                        message: result.message || 'Token refresh failed',
                        code: result.message?.includes('expired') ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN'
                    });
                }
            }
        );

    } catch (error) {
        console.error('Error refreshing token:', error);
        response.status(StatusCode.InternalServerError).json({
            success: false,
            message: 'Internal server error'
        });
    }
}


}