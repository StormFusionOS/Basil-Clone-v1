FROM nginx:alpine
RUN apk add --no-cache openssl \
  && mkdir -p /etc/nginx/certs \
  && openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -subj "/CN=bookforge.local" \
    -keyout /etc/nginx/certs/bookforge.key \
    -out /etc/nginx/certs/bookforge.crt
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 8443
CMD ["nginx", "-g", "daemon off;"]
