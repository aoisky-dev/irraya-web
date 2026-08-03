FROM node:22-bookworm

WORKDIR /app

ENV NODE_ENV=production \
    PORT=9000


COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

EXPOSE 9000

CMD ["sh", "-c", "cd .medusa/server && npx medusa start --host 127.0.0.1 --port ${PORT:-9000}"]

