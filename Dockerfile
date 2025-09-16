FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Build TypeScript using local installation
RUN npm run build

EXPOSE 4001

CMD ["node", "dist/server.js"]