FROM node:20-alpine

# Install necessary build tools for some libs (if needed)
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

ENV NODE_ENV=production

EXPOSE 3000

# MCP server entrypoint
CMD ["node", "dist/server.js"]
