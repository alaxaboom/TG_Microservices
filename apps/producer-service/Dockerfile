FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
COPY apps/producer-service/package*.json ./apps/producer-service/
COPY libs/contracts/package*.json ./libs/contracts/
COPY libs/rabbitmq/package*.json ./libs/rabbitmq/
COPY libs/logger/package*.json ./libs/logger/

RUN npm install

COPY . .
RUN npm run build --workspace=producer-service

CMD ["npm", "run", "start:prod", "--workspace=producer-service"]
