# VESDI dashboard: Next.js standalone server (UI + /api/*).
# Data is NOT in the image: CBS demo data, survey answers and the route cache
# live on named volumes (see docker-compose.yaml and deploy/README.md).
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . ./
ARG NEXT_PUBLIC_BASE_PATH=/vesdi-dashboard
ARG NEXT_PUBLIC_CARTO_API_KEY=
ARG NEXT_PUBLIC_UMAMI_SRC=
ARG NEXT_PUBLIC_UMAMI_WEBSITE_ID=
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH \
    NEXT_PUBLIC_CARTO_API_KEY=$NEXT_PUBLIC_CARTO_API_KEY \
    NEXT_PUBLIC_UMAMI_SRC=$NEXT_PUBLIC_UMAMI_SRC \
    NEXT_PUBLIC_UMAMI_WEBSITE_ID=$NEXT_PUBLIC_UMAMI_WEBSITE_ID \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ARG NEXT_PUBLIC_BASE_PATH=/vesdi-dashboard
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 \
    NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH \
    DEMO_DATA_DIR=/srv/vesdi/demo-data \
    SURVEY_DATA_DIR=/srv/vesdi/survey \
    ROUTE_CACHE_DIR=/srv/vesdi/routes
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
# Mount points owned by the runtime user, so Docker seeds empty named volumes with that owner
RUN mkdir -p /srv/vesdi/demo-data /srv/vesdi/survey /srv/vesdi/routes \
 && chown -R node:node /srv/vesdi
USER node
EXPOSE 3000
CMD ["node", "server.js"]
