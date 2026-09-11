# Stage 1: Build the React application
FROM node:22-alpine AS builder
WORKDIR /app

# Copy package manifests
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source and assets
COPY . .

# Build production bundle
RUN npm run build

# Stage 2: Serve with Node 22 Production Server
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=80
ENV STORAGE_DIR=/data/bugs

# Copy package manifests
COPY package.json package-lock.json* ./

# Install production dependencies
RUN npm install --omit=dev

# Copy server code
COPY server/ ./server/

# Copy built frontend assets
COPY --from=builder /app/dist ./dist

# Create persistent storage directory
RUN mkdir -p /data/bugs

EXPOSE 80
CMD ["node", "server/index.js"]
