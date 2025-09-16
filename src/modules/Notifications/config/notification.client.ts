import path from 'path'
import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import 'dotenv/config'

// Load proto file with options
const packageDef = protoLoader.loadSync(
  path.resolve(__dirname, './notification.proto'),
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  }
)

const grpcObject = (grpc.loadPackageDefinition(packageDef) as unknown) as any

// Detect environment
const isDocker = process.env.NODE_ENV === 'docker'

// Inside Docker → use docker-compose service name (notificationservice)
// Local dev → localhost (or DEV_DOMAIN if you prefer)
const host = isDocker
  ? process.env.NOTIFICATION_SERVICE_HOST || 'notificationservice'
  : process.env.DEV_DOMAIN || 'localhost'

const port = process.env.NOTIFICATION_GRPC_PORT || '6000'

console.log(`Notification Service connecting to: ${host}:${port}`)

// Create client
const NotificationService = new grpcObject.notification.NotificationService(
  `${host}:${port}`,
  grpc.credentials.createInsecure(),
  {
    'grpc.max_send_message_length': 10 * 1024 * 1024,
    'grpc.max_receive_message_length': 10 * 1024 * 1024,
  }
)

export { NotificationService }
