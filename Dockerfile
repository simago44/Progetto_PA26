FROM node:lts-alpine3.24

WORKDIR /app
COPY . .

RUN npm install

CMD ["npm", "run", "buildAndStart"]
