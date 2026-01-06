# Stage 1: Build React App
FROM node:18-alpine as build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Serve with Node API
FROM node:18-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm install --production

# Backend kodlarını kopyala
COPY server/ ./
# Frontend build dosyalarını backend içine taşı
COPY --from=build /app/client/build ./client/build

# Veritabanı ve upload klasörlerini oluştur (Volume mount için)
RUN mkdir -p data/uploads

EXPOSE 5000
CMD ["node", "server.js"]