FROM node:alpine
WORKDIR /usr/src/app
COPY ./voilasnap .
COPY ./.ssh /root/.ssh
RUN apk update && apk upgrade && \
    apk add --no-cache git openssh openrc
RUN chmod -R 700 ~/.ssh && chmod 644 ~/.ssh/id_rsa.pub && chmod 600 ~/.ssh/id_rsa
RUN ssh-keyscan github.com >> ~/.ssh/known_hosts
RUN apk add docker
RUN apk add py-pip && apk add python-dev libffi-dev openssl-dev gcc libc-dev make && pip install docker-compose
EXPOSE 3001
CMD [ "node", "server.js" ]