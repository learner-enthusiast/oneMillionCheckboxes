# One Million Checkboxes

A real-time multi-app platform built with a shared backend and a React client. The project currently includes:

- A collaborative checkbox board (live updates across connected users)
- A live location sharing map (real-time marker updates)
- OIDC-based login handshake that exchanges auth code for an app JWT

The system is designed around event-driven communication using Socket.IO, Redis pub/sub, and Kafka.

## Table of Contents

1. Project Overview
2. Tech Stack
3. Architecture and Data Flow
4. Repository Structure
5. Prerequisites
6. Environment Variables
7. Local Setup (Step by Step)
8. Running the Project
9. API and Socket Contract
10. Scripts
11. Troubleshooting
12. Production Notes

## Project Overview

This repository contains two apps that share the same backend service:

1. One Million Checkboxes
   - Users toggle checkboxes.
   - Changes are propagated in real-time to all connected clients.
   - State is stored in Redis and distributed through Redis pub/sub.

2. Live Location Tracker
   - Users publish geolocation periodically.
   - Events are produced to Kafka and consumed by the backend.
   - Backend emits updates to clients over Socket.IO.

Authentication flow:

- The frontend redirects users to an external OIDC issuer UI.
- The issuer redirects back with an authorization code.
- Backend exchanges that code for an issuer token, verifies it via JWKS, then mints an app access token.
- That app access token is used for protected HTTP routes and Socket.IO auth.

## Tech Stack

Backend:

- Node.js + TypeScript (ESM)
- Express
- Socket.IO
- Kafka (kafkajs)
- Redis/Valkey (ioredis)
- PostgreSQL
- Drizzle ORM
- JWT (jsonwebtoken)

Frontend:

- React 19 + TypeScript
- Vite
- React Router
- Axios
- Socket.IO Client
- React Leaflet
- Tailwind CSS

Infrastructure (local):

- Docker Compose for PostgreSQL, Kafka, and Valkey

## Architecture and Data Flow

### High-Level Components

- React client (`client/`) for UI and browser-side auth/socket handling
- Express server (`index.ts`) for API routes and Socket.IO server
- Redis for checkbox shared state and pub/sub fanout
- Kafka for location event stream processing
- PostgreSQL for relational persistence (Drizzle scaffold is present)
- External OIDC issuer for identity and code exchange

### Checkbox Flow

1. Client loads initial state from `GET /api/checkboxState`.
2. Client emits `checkbox:update` with an index over Socket.IO.
3. Server toggles state in Redis key `CHECKBOX_STATE_KEY`.
4. Server publishes event to Redis channel `client:checkbox-update`.
5. Redis subscriber re-emits `checkbox:updated` to all clients.

### Location Flow

1. Client obtains browser geolocation.
2. Client emits `location:update` over Socket.IO.
3. Server publishes location event to Kafka topic.
4. Backend consumer reads Kafka message.
5. Server emits `location:updated` event to clients.

### Auth Flow (OIDC Code Exchange)

1. User clicks login in frontend.
2. Frontend redirects to issuer with `client_id` and `redirect_uri`.
3. Issuer redirects to frontend callback with `code` query param.
4. Frontend calls backend `GET /api/oauth2/:code`.
5. Backend:
   - fetches issuer openid configuration
   - exchanges code at token endpoint
   - verifies token with issuer JWKS
   - signs app access token
6. Frontend stores access token cookie and enters protected routes.

## Repository Structure

```text
.
|- index.ts                      # Server bootstrap (Express + Socket.IO)
|- src/
|  |- controllers/               # OIDC controller and utility controllers
|  |- kafka/                     # Kafka client, producer, consumer, topic admin
|  |- middlewares/               # HTTP auth middleware
|  |- redis/                     # Redis connections and subscriber fanout
|  |- routes/                    # Express routes (OIDC route)
|  |- sockets/                   # Socket auth + realtime app event handlers
|  |- utils/                     # ENV parsing, JWT, API helpers
|- drizzle/                      # Drizzle db and migration scaffold
|- client/
|  |- src/
|  |  |- BackendRoutes/          # Axios setup and API wrappers
|  |  |- pages/                  # Home, Login, OIDC callback, Checkbox, Location
|  |  |- routes/                 # Protected route wrapper
|  |  |- state/                  # Auth/cookie state helpers
|  |  |- utiltyFunctions/        # Socket and geolocation helpers
|- docker-compose.yml            # Postgres + Kafka + Valkey local infra
```

## Prerequisites

- Node.js 20+
- npm 10+ (or pnpm if preferred)
- Docker + Docker Compose
- A reachable OIDC issuer for code exchange and JWKS verification

## Environment Variables

The backend uses `NODE_ENV` to select env files:

- `NODE_ENV=development` -> `.env.development`
- `NODE_ENV=production` -> `.env.production`

Frontend (Vite) uses env files inside `client/`:

- `client/.env.development`
- `client/.env.production`

### Backend Env Reference

| Variable                    | Required | Example                                                | Description                                                     |
| --------------------------- | -------- | ------------------------------------------------------ | --------------------------------------------------------------- |
| `PORT`                      | Yes      | `3005`                                                 | Backend HTTP/Socket port                                        |
| `DATABASE_URL`              | Yes      | `postgresql://postgres:postgres@localhost:9252/authdb` | PostgreSQL connection string                                    |
| `CLIENT_ID`                 | Yes      | `client_xxxxx`                                         | OIDC client id used in token exchange and audience verification |
| `CLIENT_SECRET`             | Yes      | `super-secret`                                         | OIDC client secret                                              |
| `REDIRECT_URI`              | Yes      | `http://localhost:5174/oidc/auth`                      | Frontend callback URI registered at issuer                      |
| `OIDC_ISSUER`               | Yes      | `http://localhost:3000`                                | Issuer base URL used to fetch OIDC metadata/JWKS                |
| `JWT_ACCESS_SECRET`         | Yes      | `long-random-string`                                   | App access token signing secret                                 |
| `JWT_REFRESH_SECRET`        | Yes      | `another-long-random-string`                           | App refresh token signing secret                                |
| `ACCESS_TOKEN_TTL`          | Yes      | `15m`                                                  | Access token TTL                                                |
| `REFRESH_TOKEN_TTL`         | Yes      | `7d`                                                   | Refresh token TTL                                               |
| `KAFKA_BROKERS`             | Yes      | `localhost:9092`                                       | Comma-separated Kafka brokers                                   |
| `KAFKA_CLIENT_ID`           | Yes      | `one-million-checkboxes-admin`                         | Kafka client id                                                 |
| `KAFKA_TOPIC_LOCATION`      | Yes      | `location-updates`                                     | Topic for location events                                       |
| `KAFKA_LOCATION_PARTITIONS` | Yes      | `3`                                                    | Partitions for location topic setup                             |
| `KAFKA_TOPIC_CHECKBOX`      | Yes      | `checkbox-updates`                                     | Topic for checkbox events                                       |
| `KAFKA_CHECKBOX_PARTITIONS` | Optional | `3`                                                    | Used by topic admin utility                                     |
| `KAFKA_REPLICATION_FACTOR`  | Yes      | `1`                                                    | Kafka topic replication factor                                  |
| `KAFKA_GROUP_ID`            | Yes      | `one-million-checkboxes-consumer`                      | Kafka consumer group id                                         |
| `CORS_ORIGIN`               | Yes      | `http://localhost:5174`                                | Allowed origin(s), comma-separated                              |

### Frontend Env Reference

| Variable            | Required | Example                           | Description                         |
| ------------------- | -------- | --------------------------------- | ----------------------------------- |
| `VITE_PORT`         | Yes      | `5174`                            | Frontend dev port                   |
| `VITE_CLIENT_ID`    | Yes      | `client_xxxxx`                    | OIDC client id for login redirect   |
| `VITE_REDIRECT_URI` | Yes      | `http://localhost:5174/oidc/auth` | Callback URL used in login redirect |
| `VITE_OIDC_ISSUER`  | Yes      | `http://localhost:3000/accounts`  | Login UI/authorize URL base         |
| `VITE_API_URL`      | Yes      | `http://localhost:3005`           | Backend base URL for API/socket     |

### Backend Env Example (`.env.development`)

```env
# APP
PORT=3005

# DATABASE
DATABASE_URL=postgresql://postgres:postgres@localhost:9252/authdb

# OIDC / AUTH
CLIENT_ID=client_your_local_client_id
CLIENT_SECRET=your_local_client_secret
REDIRECT_URI=http://localhost:5174/oidc/auth
OIDC_ISSUER=http://localhost:3000

# JWT
JWT_ACCESS_SECRET=replace_with_long_random_hex_or_base64
JWT_REFRESH_SECRET=replace_with_different_long_random_hex_or_base64
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d

# KAFKA
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=one-million-checkboxes-admin
KAFKA_TOPIC_LOCATION=location-updates
KAFKA_LOCATION_PARTITIONS=3
KAFKA_TOPIC_CHECKBOX=checkbox-updates
KAFKA_CHECKBOX_PARTITIONS=3
KAFKA_REPLICATION_FACTOR=1
KAFKA_GROUP_ID=one-million-checkboxes-consumer

# CORS
CORS_ORIGIN=http://localhost:5174
```

### Frontend Env Example (`client/.env.development`)

```env
VITE_PORT=5174
VITE_CLIENT_ID=client_your_local_client_id
VITE_REDIRECT_URI=http://localhost:5174/oidc/auth
VITE_OIDC_ISSUER=http://localhost:3000/accounts
VITE_API_URL=http://localhost:3005
```

## Local Setup (Step by Step)

1. Clone and install dependencies.

```bash
git clone <your-repo-url>
cd oneMillionCheckboxes
npm install
cd client && npm install && cd ..
```

2. Start infrastructure services.

```bash
docker compose up -d
```

This starts:

- Postgres on host port `9252`
- Kafka on host port `9092`
- Valkey on host port `6379`

3. Create env files.

- Ensure root `.env.development` contains backend values.
- Ensure `client/.env.development` contains frontend values.

4. Optional: create Kafka topics explicitly.

```bash
npx tsx src/kafka/kafka-admin.ts
```

5. Start backend.

```bash
npm run dev
```

6. Start frontend in a second terminal.

```bash
cd client
npm run dev
```

7. Open the frontend URL shown by Vite (commonly `http://localhost:5174`).

## Running the Project

Backend:

- Development: `npm run dev`
- Production mode env selection: `npm run prod`
- TypeScript build: `npm run build`

Frontend:

- Development: `cd client && npm run dev`
- Build: `cd client && npm run build`
- Preview: `cd client && npm run preview`

## API and Socket Contract

### HTTP Endpoints

- `GET /api/oauth2/:code`
  - Exchanges OIDC code, verifies issuer token, returns app token + user.

- `GET /health`
  - Protected route. Requires `Authorization: Bearer <app_access_token>`.

- `GET /api/checkboxState`
  - Returns persisted checkbox state from Redis.

### Socket.IO Auth

Client connects with:

```json
{
  "auth": {
    "token": "<app_access_token>"
  }
}
```

### Socket Events

Client -> Server:

- `checkbox:join` payload: `chunkId: number`
- `checkbox:update` payload: `{ index: number }`
- `location:update` payload: `{ lat: number, lng: number }`

Server -> Client:

- `checkbox:updated` payload: `{ index: number, user: string }`
- `location:updated` payload: location object from Kafka consumer

## Scripts

Root `package.json`:

- `npm run dev` -> `NODE_ENV=development tsx watch index.ts`
- `npm run prod` -> `NODE_ENV=production tsx watch index.ts`
- `npm run build` -> `tsc`

Client `package.json`:

- `npm run dev` -> Vite dev server
- `npm run build` -> production bundle
- `npm run lint` -> ESLint
- `npm run preview` -> preview built app

## Troubleshooting

1. CORS blocked requests
   - Ensure `CORS_ORIGIN` exactly matches your frontend origin.
   - For multiple origins, use comma-separated values.

2. OIDC exchange fails
   - Verify `CLIENT_ID`, `CLIENT_SECRET`, `REDIRECT_URI`, `OIDC_ISSUER`.
   - Ensure redirect URI matches issuer client config exactly.

3. Socket connection unauthorized
   - Confirm browser has `accessToken` cookie.
   - Verify token is signed with backend JWT secret and not expired.

4. Kafka messages not flowing
   - Ensure Kafka container is healthy and reachable at `localhost:9092`.
   - Ensure topics exist (`npx tsx src/kafka/kafka-admin.ts`).

5. Checkbox state is null or resets
   - Confirm Valkey container is running.
   - Verify Redis key `CHECKBOX_STATE_KEY` is populated after first updates.

6. Frontend points to wrong backend
   - Check `VITE_API_URL` in `client/.env.development`.

## Production Notes

- Never commit real production secrets to version control.
- Rotate `CLIENT_SECRET`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET` before deployment.
- Serve frontend and backend over HTTPS.
- Use secure cookie attributes in production (`Secure`, `HttpOnly` where applicable).
- Tighten CORS to explicit trusted origins.
- For multi-instance scaling, keep Redis/Kafka external and highly available.

## Current Implementation Notes

- OIDC login and token exchange path is implemented and used by the UI.
- Realtime checkbox and location flows are implemented.
- Client code contains helper paths for `/api/auth/*` refresh/login flows, but those routes are not present in the current backend route set in this repository. The active login path in the current UI is OIDC redirect + `/api/oauth2/:code`.
