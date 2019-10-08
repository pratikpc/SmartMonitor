FROM nginx:alpine as proxy-frontend-base
# Timezone
ENV TIMEZONE Asia/Jakarta

# Let's roll
RUN	apk update && \
	apk upgrade && \
	apk add --update openssl nginx && \
	apk add --update tzdata && \
	cp /usr/share/zoneinfo/${TIMEZONE} /etc/localtime && \
	echo "${TIMEZONE}" > /etc/timezone && \
	mkdir /etc/nginx/certificates && \
	apk del tzdata

RUN	openssl req \
		-x509 \
		-newkey rsa:2048 \
		-keyout /etc/nginx/certificates/key.pem \
		-out /etc/nginx/certificates/cert.pem \
		-days 365 \
		-nodes \
		-subj /CN=localhost


FROM proxy-frontend-base as proxy-frontend
ADD ./Configuration/nginx.conf /etc/nginx/
COPY ./Website /var/www/html/static/
EXPOSE 8000

FROM node:lts-alpine as base
WORKDIR /app

FROM base as dependencies
WORKDIR /app
## Install build toolchain, install node deps and compile native add-ons
RUN apk add --no-cache python make g++
COPY ./package*.json ./
RUN npm install

FROM dependencies as app-build
WORKDIR /app
COPY ./tsconfig.json ./
COPY ./lib ./lib
## we use Typescript, this runs the transpilation
RUN npm run build 

FROM base as run-dependencies
RUN apk add --no-cache ffmpeg

FROM run-dependencies as app-backend
WORKDIR /app
COPY --from=app-build /app/node_modules ./node_modules
COPY --from=app-build /app/dist ./dist
COPY --from=app-build /app/package*.json ./
COPY ./Views ./Views