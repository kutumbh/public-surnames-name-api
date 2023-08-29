FROM node:14-alpine
WORKDIR /app
RUN  yarn global add pm2
RUN pm2 install pm2-logrotate
RUN pm2 set pm2-logrotate:max_size 1K
COPY package.json .   
RUN yarn install
COPY . .
EXPOSE 3000
CMD ["pm2-runtime", "production.yml"]
