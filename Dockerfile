FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

ENTRYPOINT ["npx", "ts-node", "src/index.ts"]
CMD ["3000"]