FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
COPY package.json ./
# If package-lock.json exists, npm ci or npm install
RUN npm install --no-audit --no-fund

# Copy application source code
COPY src ./src

EXPOSE 8000

# Production stage
FROM base AS production
ENV NODE_ENV=production
CMD ["node", "src/server.js"]

# Development stage (with nodemon reload)
FROM base AS development
ENV NODE_ENV=development
CMD ["npm", "run", "dev"]
