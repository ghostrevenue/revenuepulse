FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --include=dev

COPY . .

RUN npm run build

EXPOSE 3000

ENV NODE_ENV=production
ENV APP_PORT=3000

CMD ["npm", "start"]
