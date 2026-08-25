# syntax=docker/dockerfile:1

# --- Build stage ---------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Vite inlines VITE_* at build time, so the API URL is a build arg, not runtime env.
ARG VITE_API_URL=http://localhost:8000/api/v1
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


# --- Runtime stage -------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

# 127.0.0.1, not localhost: nginx listens on IPv4 only, and localhost resolves to
# ::1 first inside the container, so the check would fail against a healthy server.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
