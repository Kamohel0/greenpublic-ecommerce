# Environment variables

Secrets are never stored in the properties files. The backend reads them from real environment variables, or from a `.env` file in the directory you start it from (`.env` or `backend/.env`). Start from [`backend/.env.example`](../backend/.env.example).

The Spring profile can't be set from `.env`. Pass `--spring.profiles.active=prod` (or export `SPRING_PROFILES_ACTIVE=prod`) on the server.

## Backend

### Required

| Variable | Purpose |
|---|---|
| `DB_URL` | JDBC URL, e.g. `jdbc:mysql://host:3306/GreenPublic?useSSL=true&serverTimezone=UTC` |
| `DB_USERNAME` / `DB_PASSWORD` | Database credentials |
| `JWT_SECRET` | Base64 HMAC key, at least 32 bytes. Generate with `openssl rand -base64 32` |
| `YOCO_API_SECRET_KEY` | Yoco secret key (`sk_test_…` for the demo) |
| `YOCO_API_PUBLIC_KEY` | Yoco public key (`pk_test_…` for the demo) |
| `YOCO_WEBHOOK_SECRET` | Signing secret Yoco gives you when you register the webhook |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | SMTP login (for Gmail, use an [app password](https://myaccount.google.com/apppasswords)) |

### Optional

| Variable | Default | Purpose |
|---|---|---|
| `MAIL_HOST` / `MAIL_PORT` | `smtp.gmail.com` / `587` | SMTP server |
| `MAIL_FROM` | `MAIL_USERNAME` | Sender address (prod profile) |
| `YOCO_WEBHOOK_URL` | `http://localhost:8080/api/webhook/yoco` | Public webhook URL |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | placeholder | Google sign-in. Without these, Google login is disabled in practice |
| `GOOGLE_REDIRECT_URI` | `http://localhost:8080/login/oauth2/code/google` | Default profile only. Prod uses the DuckDNS domain |
| `FRONTEND_URL` | `http://localhost:5173` | Links in emails and payment redirects (default profile) |
| `PUBLIC_BASE_URL` | `http://localhost:8080` | Base URL for Yoco redirect URLs (default profile) |
| `CORS_ALLOWED_ORIGINS` | localhost ports; prod: `https://greenpublic.duckdns.org` | Comma-separated allowed origins |
| `AWS_REGION` / `AWS_S3_BUCKET` | `af-south-1` / `greenpublicimages` | S3 image storage (optional) |
| `CLOUDFRONT_DOMAIN`, `CLOUDFRONT_KEY_PAIR_ID`, `CLOUDFRONT_PRIVATE_KEY_PATH` | empty | CloudFront URLs for S3 images (prod, optional) |

AWS credentials are picked up through the standard AWS provider chain: an EC2 instance role (preferred), or `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`.

## Frontend

Set these in `frontend/green-public-website/.env.local` for development, or in the environment of the machine that runs `pnpm build`.

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend URL for development (`http://localhost:8080`). Leave empty in production so requests go to `/api` on the same domain. |
| `VITE_YOCO_PUBLIC_KEY` | Yoco public key. Use `pk_test_…` for the public demo. |
