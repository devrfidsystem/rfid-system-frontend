#build
FROM artifactory.pegadaian.co.id:8084/node:20-alpine as build-stage
WORKDIR /app

# build mode ["development", "staging", "production"]
ARG mode

RUN npm install -g pnpm
RUN pnpm config set @pegadaian:registry https://artifactory.pegadaian.co.id/repository/npm-hosted-01/
COPY package.json ./
RUN pnpm install
COPY . /app


# Debugging mode
RUN echo "Build mode is: $mode"
RUN if [ -z "$mode" ]; then pnpm run build:development; else pnpm run build:$mode; fi

#package
FROM artifactory.pegadaian.co.id:8084/nginx:1.24-alpine
WORKDIR /app
COPY --from=build-stage /app/dist /app
EXPOSE 8080
