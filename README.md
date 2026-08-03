# PT Abtekindo Primalestari

Website perusahaan untuk penjualan, pemasangan, dan perawatan AC.

The site's purpose is exposure and lead generation, not e-commerce: visitors browse products and
published service prices, then convert through WhatsApp or the contact form.

## Architecture

Two deployables plus managed infrastructure.

| Part | Stack | Responsibility |
| --- | --- | --- |
| `backend/` | Go 1.26, chi, huma v2, sqlc, pgx | Owns all data. Public catalog API, admin CRUD, auth, lead capture |
| `frontend/` | Next.js 16, React 19, Tailwind v4 | Public site in Bahasa Indonesia, plus the admin CMS at `/admin` |

The frontend generates its TypeScript types from the API's OpenAPI document, so the two stay in
sync across the language boundary: a backend field rename becomes a frontend compile error.

Public pages render from a tag-based cache. After an admin write, the API calls the frontend's
`/api/revalidate` webhook, which expires the affected tag. The site therefore serves at static
speed while still reflecting a CMS edit within seconds.

## Requirements

- Go 1.26+
- Node.js 20+
- Docker (for local Postgres)

## Getting started

```bash
# 1. Start Postgres
docker compose up -d

# 2. Backend
cd backend
cp .env.example .env          # defaults work for local development
make migrate-up               # create the schema
make seed                     # load the starting catalog (safe to re-run)
make create-admin EMAIL=you@example.com NAME="Nama Anda"
make run                      # http://localhost:8080, docs at /docs

# 3. Frontend, in another terminal
cd frontend
npm install
npm run dev                   # http://localhost:3000
```

The CMS is at <http://localhost:3000/admin>.

### Useful commands

```bash
# backend
make check          # go vet + tests
make sqlc           # regenerate query code after editing db/queries
make migrate-new NAME=add_something
make openapi        # write openapi.json

# frontend
npm run api:types   # regenerate TypeScript types from backend/openapi.json
npm run typecheck
npm run lint
npm run build
```

After changing anything in `backend/internal/api`, run `make openapi` then `npm run api:types` so
the frontend types match.

## Before going live

### 1. Fill in the company details

Everything the site says about the company lives in **`frontend/lib/site.ts`**. Values marked
`TODO` are deliberately obvious placeholders rather than plausible-looking fakes, so an unfinished
value cannot quietly ship. WhatsApp and map links stay hidden until real values are set.

| Value | Why it matters |
| --- | --- |
| `whatsapp` | The main conversion path. Every call to action routes through it, and all WhatsApp buttons stay hidden until this is set |
| `phone` | Shown in the header bar, footer and contact page |
| `email` | Footer and contact page |
| `address` | Contact page, footer, and the `LocalBusiness` structured data Google reads |
| `mapsEmbedUrl`, `mapsUrl` | The map on the contact page is hidden until these are set |
| `foundedYear` | Drives the "X+ tahun" figure on the about page |
| `serviceAreas` | Contact and about pages, and local SEO |
| `social` | Footer icons. Leave blank to hide |

### 2. Confirm the catalog and prices

The seeded 20 products and 6 services use realistic placeholder specifications and prices for the
Indonesian market. **They are not a confirmed price list.** Review every figure, then maintain the
catalog through the CMS rather than by editing seed files.

### 3. Add product photography

Products without photos render a branded placeholder panel labelled with the product name, so
pages look deliberate rather than broken. Upload real photos through the CMS once object storage
is configured; images are wired through `next/image` already, so nothing else needs changing.

### 4. Configure the production services

Set these in the backend environment. The API refuses to start in production without them, which
is intentional: a silently disabled mailer would mean quietly losing customer enquiries.

- `R2_*` for image uploads
- `RESEND_API_KEY`, `LEAD_NOTIFY_FROM`, `LEAD_NOTIFY_TO` for lead notification email
- `TURNSTILE_SECRET_KEY` for contact form spam protection
- `COOKIE_DOMAIN=.abtekindo.com` so the frontend and API subdomain share the admin session
- `JWT_SECRET` (at least 32 characters) and `REVALIDATE_SECRET`

On the frontend set `API_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL` and
`REVALIDATE_SECRET` (matching the backend).

## Deployment

| Piece | Target |
| --- | --- |
| Frontend | Vercel, `abtekindo.com` |
| API | Fly.io, `sin` region (closest to Indonesia) |
| Database | Neon, Singapore |
| Images | Cloudflare R2 |

Both services are containerised and configured purely through environment variables, so neither is
tied to a specific host.

## Security notes

- Admin passwords are hashed with Argon2id; cost parameters are stored per hash, so they can be
  raised later without invalidating existing passwords.
- Sessions use a short-lived JWT plus a rotating refresh token stored hashed in the database.
  Refresh tokens are single use, so a stolen one stops working at the real user's next refresh.
- There is no public registration endpoint. Admins are created with `make create-admin`.
- The contact form is protected by a per-IP burst limit, a longer database-backed limit, a
  honeypot field, and Cloudflare Turnstile.
