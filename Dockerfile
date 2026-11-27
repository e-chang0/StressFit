FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY public ./public
COPY src ./src
COPY scripts/build.js ./scripts/build.js
RUN npm run build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=10000
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY scripts/preview.js ./scripts/preview.js
USER node
EXPOSE 10000
CMD ["node", "scripts/preview.js"]
