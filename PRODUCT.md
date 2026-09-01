# PRODUCT

Project: Event Connect

Summary:
Event Connect is a small event sourcing/procurement demo app that connects buyers (clients) with providers through proposals, requirements, and chat. This repository is used for local development, demos, and design exploration.

Primary Users:
- Event organizers (clients)
- Service providers
- Admins (site operators)

Core Flows:
- Auth: email/password login with JWT cookies (dev-only quick-login available)
- Clients: create requirements, review provider proposals, shortlist
- Providers: browse requirements, submit proposals, chat
- Admin: manage users, view submissions, demo quick-login

Dev Notes:
- This app is intentionally self-hosted and uses a local JSON store for demo data (`data/eventconnect_db.json`).
- Admin seed user: rahul@gmail.com (dev/demo only). Update credentials in the DB for production.
- Environment: `.env` should include `JWT_SECRET` and `PORT`.

Design Goals:
- Luxury, premium aesthetic: refined spacing, muted neutrals with gold accents, subtle shadows and glassy cards.
- Responsive first: layouts should adapt from mobile → desktop with careful typography scale.
- Accessible: high contrast CTAs, keyboard focus states, and semantic HTML.

Quick dev checklist:
1. Install: `npm install`
2. Start dev: `npm run dev` (uses `PORT` from `.env`)
3. If HMR/CSS doesn't reflect, hard-refresh the browser (Ctrl+Shift+R) and restart the dev server.

Contact:
- Repo: Rahulpandya11/event-connect
