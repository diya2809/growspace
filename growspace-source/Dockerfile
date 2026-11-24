FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && cp -r .next/static .next/standalone/.next/static && cp -r assets .next/standalone/assets
WORKDIR /app/.next/standalone
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
EXPOSE 3000
CMD ["node", "server.js"]
