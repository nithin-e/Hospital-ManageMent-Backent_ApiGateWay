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
const grpcObject=(grpc.loadPackageDefinition(packageDef)as unknown)as any

const Domain=process.env.NODE_ENV==='dev'? process.env.DEV_DOMAIN:process.env.PRO_DOMAIN_USER
console.log("....",Domain);

const AuthService = new grpcObject.Auth.AuthService(
    `${Domain}:${process.env.Auth_GRPC_PORT}`,grpc.credentials.createInsecure()
)

export {AuthService}