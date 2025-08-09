import path from 'path'
import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import 'dotenv/config';

// Load proto file with specific options
const packageDef = protoLoader.loadSync(
  path.resolve(__dirname, './notification.proto'),
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
  }
)

const grpcObject = (grpc.loadPackageDefinition(packageDef) as unknown) as any

const Domain = process.env.NODE_ENV === 'dev' ? process.env.DEV_DOMAIN : process.env.PRO_DOMAIN_USER
console.log(Domain, 'Domain for notification service');

// Create client with increased message size limits
const NotificationService = new grpcObject.notification.NotificationService(
  `${Domain}:${process.env.Notification_GRPC_PORT}`,
  grpc.credentials.createInsecure(),
  {
    'grpc.max_send_message_length': 10 * 1024 * 1024,
    'grpc.max_receive_message_length': 10 * 1024 * 1024 
  }
)

export { NotificationService }