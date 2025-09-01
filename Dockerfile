# Stage 1: Build the React application
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the application source code
COPY . .
# Build the application
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:stable-alpine

# Copy the built assets from the builder stage to the Nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80, the default port for Nginx
EXPOSE 80

# Command to run Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]