FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --silent
COPY . .

# Accept build arguments for environment variables
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_API_BASE_URL

# Set as environment variables for Vite build
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Use the production build script which runs `vite build` only
RUN npm run build:prod

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
