# GreenPublic: E-commerce Store

A full-stack online store for a South African sea moss skincare brand. Customers can browse products, manage a cart and wishlist, check out as a guest or signed-in user, and pay by card through Yoco. Staff manage orders, stock and fulfilment from admin and owner dashboards.

**Live demo:** https://greenpublic.duckdns.org
<!-- Add screenshots here, e.g. ![Home page](docs/screenshots/home.png) -->

> The demo runs with Yoco **test** keys. Use a [Yoco test card](https://developer.yoco.com/online/resources/testing-info) at checkout. No real payments are taken.

## Features

**Storefront**
- Product catalogue with categories, search, product detail pages and customer reviews
- Cart that persists across sessions, plus a wishlist
- Guest checkout or account checkout, with delivery or pickup and saved addresses
- Card payments through the Yoco Checkout API, with webhook confirmation and refunds
- Built-in FAQ chatbot

**Accounts and security**
- Email/password sign-up with email verification, password reset and Google sign-in (OAuth2)
- JWT access and refresh tokens with rotation, token blacklisting and versioning
- Rate limiting and lockout on login, registration and password reset
- Security alert emails for suspicious sign-ins

**Back office**
- Admin dashboard for orders, order details and the fulfilment workflow
- Owner dashboard for managing stock levels
- Automatic release of stock reserved by abandoned checkouts
- HTML email notifications (order confirmation, refunds, password reset and more)

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 7, React Router 7, Tailwind CSS 3, shadcn/ui (Radix), Framer Motion, Zustand, Axios |
| Backend | Java 25, Spring Boot 3.5 (Web, Security, Data JPA, Validation, Mail, OAuth2 Client, Actuator), Thymeleaf email templates |
| Auth | JJWT 0.13 (HS256), Spring Security, Google OAuth2 |
| Database | MySQL 8 (AWS RDS), H2 for tests |
| Payments | Yoco Checkout API and webhooks |
| Infrastructure | AWS EC2, Nginx reverse proxy, Let's Encrypt TLS, DuckDNS, optional S3 image storage (AWS SDK v2) |

## Architecture

```
Browser ──HTTPS──▶ Nginx (greenpublic.duckdns.org)
                    ├── /        → React build (static files)
                    └── /api/*   → Spring Boot :8080 ──▶ MySQL (RDS)
                                         │
                                         ├──▶ Yoco API (payments)  ◀── Yoco webhooks
                                         └──▶ SMTP (email)
```

## Project structure

```
backend/                  Spring Boot API
  src/main/java/...       controllers, services, entities, security (jwt/), config
  src/main/resources/     application*.properties, email templates, SQL migrations
frontend/green-public-website/   React + Vite single-page app
deploy/                   Nginx site config
docs/                     Environment variable reference and SQL migrations
```

## Running locally

**Requirements:** Java 25, Node 20+ with [pnpm](https://pnpm.io), MySQL 8.

### 1. Database

```bash
sudo mysql -e "CREATE DATABASE greenpublic; CREATE USER 'greenpublic'@'localhost' IDENTIFIED BY 'choose-a-password'; GRANT ALL ON greenpublic.* TO 'greenpublic'@'localhost';"
```

### 2. Backend

```bash
cd backend
cp .env.example .env          # set DB_PASSWORD and JWT_SECRET (openssl rand -base64 32); placeholders are fine for the rest
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev     # http://localhost:8080
```

The `dev` profile creates the database tables on first start. Secrets are only read from environment variables or `backend/.env`. They are never stored in the properties files.

Once it's running, load the sample products from another terminal:

```bash
mysql -u greenpublic -p greenpublic < docs/dev-seed.sql
```

### 3. Frontend

```bash
cd frontend/green-public-website
cp .env.example .env.local
pnpm install
pnpm dev                      # http://localhost:5173
```

### 4. Admin access

Sign up on the site, then give your account the admin role (use `OWNER` for the owner dashboard):

```bash
mysql -u greenpublic -p greenpublic -e "UPDATE users SET role='ADMIN' WHERE email='you@example.com';"
```

Log out and back in to open `/admin`.

### Tests and lint

```bash
cd backend && ./mvnw test                                  # uses in-memory H2, no external services
cd frontend/green-public-website && pnpm lint && pnpm build
```

## Deploying (EC2 + DuckDNS)

1. **Domain.** Point a DuckDNS subdomain at the server's public IP. Attach an Elastic IP, or run the DuckDNS update cron job, so the address doesn't change after a restart.
2. **Backend.** Install Java 25 on the server (`sudo dnf install java-25-amazon-corretto-headless` on Amazon Linux). Build with `./mvnw package -DskipTests`, copy the jar to the server and create a `.env` next to it from `backend/.env.example`. Run it as a systemd service with `java -jar ecommerce.jar --spring.profiles.active=prod`. The profile has to be passed this way or as a real environment variable, because it can't be set from `.env`. Using `prod` keeps the debug endpoints switched off.
3. **Frontend.** Run `pnpm build` and copy `dist/` to `/var/www/green-public/dist`.
4. **Nginx and TLS.** Install `deploy/nginx-greenpublic.conf` and get a certificate with `sudo certbot --nginx -d greenpublic.duckdns.org`.
5. **Firewall.** Open ports 80 and 443 in the EC2 security group. Port 8080 should not be public.
6. **Yoco webhook.** Register `https://<your-domain>/api/webhook/yoco` in the Yoco dashboard and put the signing secret in `YOCO_WEBHOOK_SECRET`.

See [docs/ENV_VARS.md](docs/ENV_VARS.md) for every environment variable.
