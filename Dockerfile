# Dockerfile
FROM node:23-slim

WORKDIR /app

# install bash correctly for slim
RUN apt-get update && apt-get install -y bash && rm -rf /var/lib/apt/lists/*

# Copy package files first for cache optimization
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY apps/dashboard/package*.json ./apps/dashboard/

# Install dependencies
RUN npm install

# Copy source code
COPY . .
ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

# Build dashboard
RUN npm run install:all && \
    npm run build:dashboard && \
    cd apps && \
    mkdir dashboard_backup && \
    mv dashboard/dist/* dashboard_backup && \
    rm -rf dashboard/* && \
    mv dashboard_backup/* dashboard/

EXPOSE 3003

CMD ["npm", "run", "start"]