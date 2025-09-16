import path from 'path'
import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import 'dotenv/config';

const packageDef = protoLoader.loadSync(path.resolve(__dirname, './user.proto'))
const grpcObject = (grpc.loadPackageDefinition(packageDef) as unknown) as any

// If running locally without Docker → use localhost
// If running inside Docker → use the docker-compose service name
const isDocker = process.env.NODE_ENV === 'docker';

const host = isDocker
  ? process.env.USER_SERVICE_HOST || "userservice"   // service name in docker-compose
  : process.env.DEV_DOMAIN || "localhost";

const port = process.env.USER_GRPC_PORT || "3001";

console.log(`Connecting to UserService at ${host}:${port}`);

const UserService = new grpcObject.user_package.User(
  `${host}:${port}`,
  grpc.credentials.createInsecure()
);

export { UserService };
