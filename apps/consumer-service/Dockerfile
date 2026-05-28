FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
COPY apps/consumer-service/package*.json ./apps/consumer-service/

RUN npm install

COPY . .
RUN npm run build --workspace=consumer-service

CMD ["npm", "run", "start:prod", "--workspace=consumer-service"]
