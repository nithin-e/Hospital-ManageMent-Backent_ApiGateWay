import path from 'path'
import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import 'dotenv/config';

const packageDef = protoLoader.loadSync(
  path.resolve(__dirname, './auth.proto'),
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  }
)
const grpcObject = (grpc.loadPackageDefinition(packageDef) as unknown) as any




const authServiceHost = process.env.AUTH_SERVICE_HOST || 'localhost';
const authServicePort = process.env.AUTH_SERVICE_PORT || '8000';

console.log("Auth Service connecting to:", `${authServiceHost}:${authServicePort}`);

const AuthService = new grpcObject.Auth.AuthService(
  `${authServiceHost}:${authServicePort}`,
  grpc.credentials.createInsecure()
);





export { AuthService }