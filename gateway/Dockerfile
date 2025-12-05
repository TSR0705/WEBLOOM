FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install express mongodb

COPY . .

CMD ["node", "src/index.js"]
