FROM node:13
RUN mkdir /app
WORKDIR /app
ADD ./package.json /app/
RUN npm install --production
COPY . /app
CMD [ "npm", "index.js" ]