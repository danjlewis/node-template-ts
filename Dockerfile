FROM node:16
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
ENV NODE_ENV production
CMD ["node", "--experimental-json-modules", "--es-module-specifier-resolution=node", "./dist/index.js"]
