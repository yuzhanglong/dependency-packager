# Base image
FROM node:18

# Create app directory
WORKDIR /home

# Bundle app source
COPY . .

RUN npm install -g pnpm

# Install app dependencies
RUN pnpm install

# Creates a "dist" folder with the production build
RUN pnpm run build

# Start the server using the production build
CMD [ "node", "packages/server-hosted/dist/main.js" ]
