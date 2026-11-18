FROM caddy:2-alpine
COPY public /srv/website
COPY deploy/Caddyfile /etc/caddy/Caddyfile
EXPOSE 80 443
