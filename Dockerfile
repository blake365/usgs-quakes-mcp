# Generated by https://smithery.ai. See: https://smithery.ai/docs/config#dockerfile
# Use the official Node.js image.
FROM node:18-alpine AS builder

# Create app directory
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the TypeScript source code to the working directory
COPY src ./src

# Copy the tsconfig.json file to the working directory
COPY tsconfig.json .

# Build the TypeScript code
RUN npm run build

# Use a lighter version of Node.js for the final image
FROM node:18-alpine AS release

# Create app directory
WORKDIR /app

# Copy the compiled JavaScript code from the builder stage
COPY --from=builder /app/build ./build

# Set the environment variable for the Node.js environment
ENV NODE_ENV=production

# Run the server
ENTRYPOINT ["node", "build/index.js"]