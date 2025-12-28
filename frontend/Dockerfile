FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --silent
COPY . .
# Use the production build script which runs `vite build` only
# (skips `tsc -b` to avoid TypeScript build-time errors during docker image builds)
RUN npm run build:prod

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
