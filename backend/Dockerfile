FROM node:20-alpine

WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm install --production

# Copy application source (node_modules and .env are excluded via .dockerignore)
COPY . .

EXPOSE 8000

CMD ["node", "server.js"]
