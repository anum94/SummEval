# Use an official node runtime as a parent image
FROM node:18-alpine AS builder

# Adding frontend directory to make absolute filepaths consistent across services
WORKDIR /frontend

# Install dependencies
COPY package.json ./
RUN npm install 

# Add the rest of the code
COPY . .

# Build the app
RUN npm run build


# Use an official node runtime as a parent image
FROM node:18-alpine

# Adding frontend directory to make absolute filepaths consistent across services
WORKDIR /frontend

COPY --from=builder /frontend/dist /frontend/dist

# Install serve. It helps you serve a static site, single page application or just a static file.
RUN npm install -g serve

# Make port 3000 available for the app and set the NODE_ENV to production
ENV NODE_ENV production
EXPOSE 3000

# Set environment variables
#ARG REACT_APP_BACKEND_URL=http://localhost:8000
#ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

# Add lables to the image
LABEL maintainer="Software Engineering for Business Information Systems (sebis)"
LABEL version="1.0"
LABEL description="This is the frontend image for the SummEval application."

# The last command serve -s dist runs only when the container spins up. It is not part of the Image creation process.
CMD [ "serve", "-s", "dist" ]
