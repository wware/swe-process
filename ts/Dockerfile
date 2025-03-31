# Base stage for dependencies
FROM node:16-alpine as deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Development stage
FROM node:16-alpine
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules

# Add development tools
RUN apk add --no-cache git

# Set environment variables
ENV NODE_ENV=development
ENV PATH=/app/node_modules/.bin:$PATH

# Do this last to avoid rebuilding the node_modules
COPY . .

# Default command (can be overridden)
CMD ["npm", "run", "test"] 