FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

# Install Playwright browsers
RUN npx playwright install --with-deps chromium

COPY . .

CMD ["node", "src/index.js"]