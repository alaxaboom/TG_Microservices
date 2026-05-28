FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
COPY apps/telegram-service/package*.json ./apps/telegram-service/

RUN npm install

COPY . .
RUN npm run build --workspace=telegram-service

CMD ["npm", "run", "start:prod", "--workspace=telegram-service"]
