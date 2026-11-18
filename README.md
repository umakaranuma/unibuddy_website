# UniBuddy public website

Responsive, buildless HTML/CSS/JavaScript website using the supplied UniBuddy promotional artwork. No framework, package installation, API key, database, or running Node server is needed in production. Google Fonts is the only external page dependency; system fonts are the fallback.

## Motion and footer

The homepage includes scroll-triggered reveals, a floating hero note, subtle desktop parallax, a reading-progress line, and three campus story panels. On desktop, normal vertical scrolling advances the horizontal story inside a sticky section. On mobile, it becomes a native horizontal swipe area with arrow buttons and keyboard controls. Operating-system reduced-motion settings disable decorative motion and the pinned scroll mapping. Visitors can also pause motion from the footer; the choice is session-only and is not stored. All content remains readable without JavaScript.

The footer groups navigation and links to standalone `/privacy.html` and `/terms.html` pages. These describe the current promotional website, not the unreleased app. They must be reviewed and expanded with the actual operator/contact and app data handling details before enabling subscriptions or releasing the app.

## Preview and verify

From this directory, with Node 22 or newer:

```sh
npm run check
npm run dev
```

Open http://127.0.0.1:4173. `npm run build` copies `public/` to `dist/` if another static host needs a build directory. The existing VPS integration serves `public/` directly, so building is optional.

## Enable real launch notifications

1. Create a subscription list and hosted signup form in Brevo. Include consent/privacy information, double opt-in, and anti-abuse protection.
2. Publish the form and copy its public HTTPS subscription URL.
3. Set `newsletterUrl` in `public/site-config.js` to that URL.
4. The CTA then opens the real Brevo form. Until configured, the page explicitly says the list is not open. No email addresses are stored locally or falsely reported as subscribed. No SMTP credentials belong in this project.

Set `androidUrl` and `iosUrl` to the official store listings when available. Empty values display non-interactive “coming soon” badges. Configure domains, signup notices, and operator/contact details before a public launch. The footer website notices are scoped to this promotional site; publish reviewed app privacy/terms separately before releasing the mobile app.

## Existing VPS deployment (recommended)

Keep the repositories beside each other:

```text
/opt/unibuddy/unibuddy_backend
/opt/unibuddy/unibuddy_admin
/opt/unibuddy/unibuddy_website
```

The backend production Compose and Caddy files have been extended to mount `unibuddy_website/public` read-only at `/srv/website`. They serve the website directly through the existing HTTPS proxy, with no additional container or Node process.

1. Copy/clone this folder alongside the backend and admin on the VPS. Keep the `public/` folder structure intact.
2. In `unibuddy_backend/deploy/prod/.env.prod`, set `WEBSITE_DOMAIN=unibuddy.info` (or your actual purchased domain).
3. At the authoritative DNS provider, point A records `@` and `www` to the VPS IPv4 address. Preserve email DNS records. Ensure any AAAA records point to a working server IPv6 address or remove stale records. Ports 80/443 must be reachable for HTTPS issuance.
4. From the backend's `deploy/prod` directory, run:

```sh
docker compose --env-file .env.prod up -d caddy
```

5. Verify HTTPS on the root domain, the `www` redirect, and the existing API/admin. A future website-only file change is visible through the bind mount; no rebuild needed. If changing the Caddy configuration later, validate it and reload Caddy explicitly.

The other existing services must already be configured and running. This change does not deploy or initialize Django/MySQL. Do not run the standalone image on the same VPS's ports 80/443 while the existing proxy is running.

## Standalone alternative

```sh
docker build -t unibuddy-website .
docker run -d --name unibuddy-website --restart unless-stopped -p 80:80 -p 443:443 -e WEBSITE_DOMAIN=unibuddy.info -v unibuddy_website_caddy_data:/data -v unibuddy_website_caddy_config:/config unibuddy-website
```

Use this only when the website owns the HTTP/HTTPS ports. `deploy/Caddyfile` includes the standalone config and security headers.

## Content and artwork

`public/assets` contains WebP versions of supplied reference images and the supplied logo. Originals are retained under `assets/` for reference and are not deployed. Images are promotional concepts, not verified product screenshots, university endorsements, or evidence of actual users. There are no invented metrics, testimonials, release dates, or working-store claims.

Before launch: set the real subscription/store links, verify domain DNS/HTTPS, test signup and unsubscribe, test delivery to university email addresses, review privacy/operator contact details, and perform mobile QA. This repository does not contain a backend subscription endpoint.
