FROM node:24.22.1-alpine@sha256:06d7adf3e0ef61a13f1d28682726366f97a15aa1888c934d3ecec86c33918b53

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
COPY yarn*.lock ./
RUN yarn install --frozen-lockfile

# Bundle app source
COPY . .

RUN yarn build

EXPOSE 8081

CMD ["node", "dist/src/main"]
