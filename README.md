# EventConnect — Event Marketplace Platform

A full-stack event marketplace platform serving clients and service providers.

## Security Architecture & Fixes (Phase 1)

1. **Bcrypt Password Verification**: All user passwords (including seeded demo accounts and newly registered accounts) are hashed with `bcryptjs`. Authentication strictly compares submitted passwords against stored `passwordHash` values using `bcrypt.compareSync`. `passwordHash` is stripped from API responses.
2. **Environment Configuration**: `JWT_SECRET` is required and loaded from environment variables (`.env`). The server safely exits at startup if `JWT_SECRET` is missing rather than relying on a hardcoded fallback.
3. **Authorization & Ownership Checks**:
   - Proposal rejection (`POST /api/proposals/:id/reject`) verifies that the requesting user owns the associated requirement group.
   - Pre-shortlist Q&A (`GET /api/proposals/:id/questions`) verifies that the requester is the provider who submitted the proposal, the client who owns the requirement, or an administrator.
   - Chat threads (`GET /api/chat/threads/:id/messages` and `POST /api/chat/threads/:id/messages`) verify that the user is the client, provider, or admin associated with that specific thread.
4. **Secure Socket.IO Real-Time Communications**: Socket.IO connection handshakes verify JWT tokens from `httpOnly` cookies or socket auth parameters. Room join events (`join_thread`) verify user authorization before permitting access to thread rooms.
5. **Cookie-Based Authentication**: The application exclusively relies on `httpOnly` cookies (`token`) for authentication tokens. LocalStorage token storage has been eliminated across client applications and services.

## Seed Demo Credentials

| Role | Email | Password |
| --- | --- | --- |
| Admin | `rahul@gmail.com` | `admin123` |
| Client 1 | `sarah.client@example.com` | `password123` |
| Client 2 | `david.client@example.com` | `password123` |
| Provider 1 (Verified) | `grandevents@example.com` | `password123` |
| Provider 2 (Verified) | `aperture@example.com` | `password123` |
| Provider 3 (Verified) | `gourmet@example.com` | `password123` |
| Provider 4 (Verified) | `blooms@example.com` | `password123` |
| Provider 5 (Pending) | `lenscraft@example.com` | `password123` |
