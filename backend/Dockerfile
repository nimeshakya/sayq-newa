FROM node:18-alpine

WORKDIR /app

# Install deps (including dev so ts-node-dev/nodemon works)
COPY package*.json ./
RUN npm ci --silent

# Copy source
COPY . .

ENV PORT=5000
EXPOSE 5000

CMD [ "npm", "start" ]
