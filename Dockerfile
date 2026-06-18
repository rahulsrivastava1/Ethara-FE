# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN pnpm build

# Production stage
FROM nginx:alpine

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/build /usr/share/nginx/html

ENV API_UPSTREAM=http://host.docker.internal:8000
ENV NGINX_ENVSUBST_FILTER=API_UPSTREAM

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
