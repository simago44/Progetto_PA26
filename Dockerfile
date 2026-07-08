# ---- base: shared deps ----
FROM node:24 AS base
WORKDIR /app
COPY package*.json ./
RUN npm install

# ---- dev target ----
FROM base AS dev
COPY . .
CMD ["npm", "run", "dev"]

# ---- build target (compiles TS -> JS) ----
FROM base AS build
COPY . .
RUN npm run build

# ---- prod target: slim runtime image ----
FROM node:24-slim AS prod
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
CMD ["node", "dist/server.js"]
