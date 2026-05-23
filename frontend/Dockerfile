FROM node:20-alpine AS build
WORKDIR /app
ARG API_URL=http://localhost:8080
COPY package*.json ./
RUN npm ci --quiet
COPY . .
RUN npm run build:prod

FROM nginx:alpine
COPY --from=build /app/dist/e-compta-ia-inter/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
