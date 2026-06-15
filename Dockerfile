FROM node:18-slim

RUN apt-get update && apt-get install -y \
  libnss3 libatk1.0-0 libx11-6 libxcomposite1 \
  libxdamage1 libxrandr2 libgbm1 libgtk-3-0 \
  libasound2

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

CMD ["node", "app.js"]