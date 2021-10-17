FROM node:14.16.0-alpine
  
WORKDIR /server-asset

ENV PATH /server-asset/node_modules/.bin:$PATH

COPY package.json ./
COPY package-lock.json ./
RUN npm install

COPY . ./

CMD ["npm","start"]