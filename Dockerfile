FROM node:18-alpine

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
COPY yarn*.lock ./
RUN yarn install 

# Bundle app source
COPY . .

RUN yarn build

EXPOSE 8081

CMD ["yarn", "start"]
