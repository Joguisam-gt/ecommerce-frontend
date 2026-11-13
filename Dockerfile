# Etapa 1: compila la version web de Expo en archivos estaticos.
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Las variables EXPO_PUBLIC_* se incrustan en el bundle al compilar.
ARG EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
ARG EXPO_PUBLIC_RECEIPT_UPLOAD_URL=
ENV EXPO_PUBLIC_API_BASE_URL=$EXPO_PUBLIC_API_BASE_URL \
    EXPO_PUBLIC_RECEIPT_UPLOAD_URL=$EXPO_PUBLIC_RECEIPT_UPLOAD_URL
RUN npx expo export --platform web --output-dir dist

# Etapa 2: sirve los estaticos con nginx.
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
