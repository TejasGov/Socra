# Development Dockerfile for the Socra Next.js frontend.
# Production builds should use a multi-stage build with `next build`.
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]
