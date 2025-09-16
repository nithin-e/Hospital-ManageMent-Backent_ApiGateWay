import path from 'path'
import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import 'dotenv/config';

// Load proto file with options
const packageDef = protoLoader.loadSync(
  path.resolve(__dirname, './Doctor.proto'),
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  }
);

const grpcObject = (grpc.loadPackageDefinition(packageDef) as unknown) as any;

// Detect environment
const isDocker = process.env.NODE_ENV === 'docker';

// Inside Docker → use docker-compose service name (doctorservice)
// Local dev → use localhost (or DEV_DOMAIN if you want)
const host = isDocker
  ? process.env.DOCTOR_SERVICE_HOST || 'doctorservice'
  : process.env.DEV_DOMAIN || 'localhost';

const port = process.env.DOCTOR_GRPC_PORT || '7000';

console.log(`Doctor Service connecting to: ${host}:${port}`);

// Create client with message size limits
const DoctorService = new grpcObject.Doctor.DoctorService(
  `${host}:${port}`,
  grpc.credentials.createInsecure(),
  {
    'grpc.max_send_message_length': 10 * 1024 * 1024,
    'grpc.max_receive_message_length': 10 * 1024 * 1024,
  }
);

export { DoctorService };
