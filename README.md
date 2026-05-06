# One Million Checkboxes

A real-time multi-app platform built with a shared backend and a React client. The project supports multiple authentication methods (OIDC and FreeAPI) and features real-time collaboration using Socket.IO, Redis pub/sub, and Kafka.

## Demo Video

[![Watch the Demo](https://img.youtube.com/vi/3IPKBTWIYOk/maxresdefault.jpg)](https://youtu.be/3IPKBTWIYOk)

Click the image above to watch the demo video.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture and Data Flow](#architecture-and-data-flow)
4. [Repository Structure](#repository-structure)
5. [Prerequisites](#prerequisites)
6. [Environment Variables](#environment-variables)
7. [Local Setup (Step by Step)](#local-setup-step-by-step)
8. [Running the Project](#running-the-project)
9. [API Documentation](#api-documentation)
10. [Socket.IO Contract](#socketio-contract)
11. [Authentication Flows](#authentication-flows)
12. [Scripts](#scripts)
13. [Troubleshooting](#troubleshooting)
14. [Production Notes](#production-notes)

## Project Overview

This repository contains two collaborative real-time applications that share the same backend service:

### 1. One Million Checkboxes

- Users toggle checkboxes in a large collaborative board.
- Changes are propagated in real-time to all connected clients via Socket.IO.
- State is persisted in Redis and distributed through Redis pub/sub fanout.
- Multiple users see live updates as others toggle checkboxes.

### 2. Live Location Tracker

- Users publish geolocation data periodically.
- Location events are produced to Kafka and consumed by the backend.
- Backend emits live updates to all connected clients over Socket.IO.
- Real-time marker visualization on interactive map (React Leaflet).

### Authentication System

The project supports **two authentication methods**:

#### OIDC (OpenID Connect)

- Frontend redirects users to external OIDC issuer UI.
- Issuer redirects back with authorization code.
- Backend exchanges code for issuer token, verifies via JWKS.
- Backend mints app-specific JWT access token.
- Access token used for protected HTTP routes and Socket.IO auth.

#### FreeAPI Authentication

- Frontend sends username/password to `/api/freeapi/exchange` (FreeAPI credentials).
- Backend validates credentials via FreeAPI endpoint.
- Backend exchanges FreeAPI token for app-specific JWT access token.
- Access token used identically to OIDC flow.

**Dual-Token Model:**

- FreeAPI token → only for `api.freeapi.app` calls
- App JWT token → for your backend + WebSocket authentication

## Tech Stack

### Backend

- **Runtime:** Node.js 20+ (ESM)
- **Framework:** Express.js
- **Language:** TypeScript
- **Real-time:** Socket.IO (with Socket.IO-Redis adapter for multi-instance support)
- **Message Queue:** Kafka (kafkajs)
- **Cache/Pub-Sub:** Redis/Valkey (ioredis)
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **Authentication:** JWT (jsonwebtoken)
- **External Auth:** OIDC (OpenID Connect) + FreeAPI

### Frontend

- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Real-time:** Socket.IO Client
- **Maps:** React Leaflet + Leaflet
- **Styling:** Tailwind CSS
- **Auth State:** localStorage + axios interceptors

### Infrastructure (Local Development)

- **Containerization:** Docker Compose
- **Services:** PostgreSQL, Kafka, Valkey (Redis-compatible)

## Architecture and Data Flow

### High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Client (SPA)                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Pages: Login, Checkbox, Location, OIDCCallback         │   │
│  │  State: Auth session, user, tokens                      │   │
│  │  Routes: Protected + Public routes                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────┬────────────────────────────────────┬──────────────────┘
           │ HTTP + WebSocket                   │
           │                                    │
    ┌──────▼─────────────────────────────────────▼──────────┐
    │         Express.js + Socket.IO Server                 │
    │  ┌──────────────────────────────────────────────────┐ │
    │  │ Routes:                                          │ │
    │  │  • GET /api/oauth2/:code (OIDC exchange)        │ │
    │  │  • POST /api/freeapi/exchange (FreeAPI token)   │ │
    │  │  • GET /api/checkboxState (fetch state)         │ │
    │  │  • GET /health (protected)                      │ │
    │  └──────────────────────────────────────────────────┘ │
    │  ┌──────────────────────────────────────────────────┐ │
    │  │ Socket.IO Events:                                │ │
    │  │  • checkbox:join / checkbox:update               │ │
    │  │  • checkbox:updated (broadcast)                  │ │
    │  │  • location:update / location:updated            │ │
    │  └──────────────────────────────────────────────────┘ │
    │  ┌──────────────────────────────────────────────────┐ │
    │  │ Middlewares:                                     │ │
    │  │  • JWT auth (Authorization header)               │ │
    │  │  • Socket.IO auth (token in handshake)           │ │
    │  │  • CORS                                          │ │
    │  └──────────────────────────────────────────────────┘ │
    └──────┬─────────────┬──────────────┬───────────────────┘
           │             │              │
      ┌────▼──┐    ┌─────▼─────┐  ┌────▼───────┐
      │ Redis │    │ PostgreSQL │  │   Kafka    │
      │       │    │            │  │            │
      │Pub/Sub│    │ Drizzle    │  │ Location   │
      │State  │    │ Migrations │  │ Consumer   │
      └───────┘    └────────────┘  └────────────┘
```

### Checkbox Real-Time Flow

1. Client loads initial state from `GET /api/checkboxState` (Redis).
2. Client connects to Socket.IO with JWT token in `auth`.
3. Client emits `checkbox:join` with `chunkId` (optional chunk-based optimization).
4. Client emits `checkbox:update` with `{ index: number }` when user toggles.
5. Server toggles bit in Redis key `CHECKBOX_STATE_KEY`.
6. Server publishes event to Redis channel `client:checkbox-update`.
7. Redis subscriber receives event and re-emits `checkbox:updated` to **all connected clients**.
8. All clients update local UI state in sync.

### Location Real-Time Flow

1. Client requests browser geolocation via Geolocation API.
2. Client emits `location:update` with `{ lat, lng, userId }` periodically.
3. Server receives event and publishes to Kafka topic (default: `location-updates`).
4. Backend Kafka consumer reads from topic.
5. Consumer validates and stores location (optional: in DB or cache).
6. Consumer emits `location:updated` to Socket.IO clients.
7. All clients receive location update and render marker on map.

### OIDC Auth Flow

```
User                    React Client            Backend             OIDC Issuer
 │                          │                     │                      │
 ├─ Click Login ────────────▶│                     │                      │
 │                          │                     │                      │
 │                          ├─ Redirect URL ─────────────────────────────▶│
 │                          │  (client_id, redirect_uri, scope)          │
 │                          │                     │                      │
 │                     ◁─ User Login Flow ◀──────────────────────────────┤
 │                          │                     │                      │
 │ ◁─────────────── Redirect with code ──────────────────────────────────┤
 │                          │                     │                      │
 ├─ Callback URL ──────────▶│                     │                      │
 │  (?code=xxx)             │                     │                      │
 │                          ├─ GET /api/oauth2/xxx                       │
 │                          ├────────────────────▶│                      │
 │                          │                     ├─ Fetch OpenID Config │
 │                          │                     ├────────────────────▶│
 │                          │                     │◀────────────────────┤
 │                          │                     │                      │
 │                          │                     ├─ Exchange code ──────▶│
 │                          │                     │◀─ access_token ─────┤
 │                          │                     │                      │
 │                          │                     ├─ Fetch JWKS ────────▶│
 │                          │                     │◀─ public_keys ──────┤
 │                          │                     │                      │
 │                          │                     ├─ Verify token       │
 │                          │                     ├─ Mint app JWT       │
 │                          │◀─ { user, token }──┤                      │
 │                          │                     │                      │
 │ ◁──────────────── Store token, redirect ─────┤                      │
 │                          │                     │                      │
```

### FreeAPI Auth Flow

```
User                    React Client            Backend           FreeAPI
 │                          │                     │                   │
 ├─ Enter credentials ──────▶│                     │                   │
 │  (username, password)    │                     │                   │
 │                          │                     │                   │
 │                          ├─ POST /api/freeapi/exchange             │
 │                          │  (Bearer token or body)                 │
 │                          ├────────────────────▶│                   │
 │                          │                     ├─ GET /current-user─▶│
 │                          │                     │  (validate FreeAPI token)
 │                          │                     │◀─ user data ──────┤
 │                          │                     │                   │
 │                          │                     ├─ Mint app JWT     │
 │                          │◀─ { user, token }──┤                   │
 │                          │                     │                   │
 │ ◁──────────────── Store token, redirect ─────┤                   │
 │                          │                     │                   │
```

## Repository Structure

```
oneMillionCheckboxes/
├── index.ts                          # Server bootstrap (Express + Socket.IO)
├── package.json                      # Root dependencies
├── tsconfig.json                     # TypeScript config
├── .env.development                  # Backend dev env vars
├── .env.production                   # Backend prod env vars
│
├── src/
│   ├── controllers/
│   │   ├── oidc.controller.ts        # OIDC code exchange & verification
│   │   ├── freeAPI.controller.ts     # FreeAPI token exchange
│   │   └── health.controller.ts      # Health check endpoints
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.ts        # JWT verification for HTTP routes
│   │   └── errorHandler.ts           # Centralized error handling
│   │
│   ├── routes/
│   │   ├── oidc.routes.ts            # GET /api/oauth2/:code
│   │   ├── freeAPI.routes.ts         # POST /api/freeapi/exchange
│   │   ├── health.routes.ts          # GET /health
│   │   ├── checkbox.routes.ts        # GET /api/checkboxState
│   │   └── index.ts                  # Mount all routes
│   │
│   ├── sockets/
│   │   ├── auth.socket.ts            # Socket.IO auth middleware
│   │   ├── checkbox.socket.ts        # checkbox:* event handlers
│   │   ├── location.socket.ts        # location:* event handlers
│   │   └── index.ts                  # Socket.IO setup & event registration
│   │
│   ├── kafka/
│   │   ├── kafka-client.ts           # Kafka client configuration
│   │   ├── producer.ts               # Kafka producer for publishing events
│   │   ├── consumer.ts               # Kafka consumer for location events
│   │   ├── kafka-admin.ts            # Topic creation & management
│   │   └── index.ts                  # Kafka initialization
│   │
│   ├── redis/
│   │   ├── redis-client.ts           # Redis connection setup
│   │   ├── subscriber.ts             # Redis pub/sub subscriber
│   │   └── index.ts                  # Redis initialization
│   │
│   └── utils/
│       ├── jwt.ts                    # JWT signing & verification
│       ├── env.ts                    # Environment variable parsing
│       ├── ApiResponse.ts            # Standardized API response wrapper
│       ├── ApiError.ts               # Standardized error class
│       ├── asyncHandler.ts           # Express async error wrapper
│       └── constants.ts              # App-wide constants
│
├── drizzle/
│   ├── schema.ts                     # Database schema definitions
│   ├── migrations/                   # SQL migration files
│   └── config.ts                     # Drizzle configuration
│
├── docker-compose.yml                # Local services (Postgres, Kafka, Valkey)
│
└── client/                           # React frontend (Vite)
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── .env.development
    ├── .env.production
    │
    ├── src/
    │   ├── main.tsx                  # React entry point
    │   ├── App.tsx                   # Root component & router setup
    │   │
    │   ├── pages/
    │   │   ├── Login.tsx             # Login form (OIDC + FreeAPI)
    │   │   ├── Checkbox.tsx          # Checkbox board (Socket.IO)
    │   │   ├── Location.tsx          # Location map (Socket.IO + Leaflet)
    │   │   ├── OIDCCallback.tsx      # Handle OIDC redirect callback
    │   │   ├── Home.tsx              # Dashboard/home page
    │   │   └── NotFound.tsx          # 404 page
    │   │
    │   ├── routes/
    │   │   ├── ProtectedRoute.tsx    # Route wrapper for auth guard
    │   │   └── index.tsx             # Route definitions
    │   │
    │   ├── BackendRoutes/
    │   │   ├── FreeAPI.ts            # Axios client for public APIs
    │   │   ├── apiClient.ts          # Main axios instance for app APIs
    │   │   └── index.ts              # Export all API clients
    │   │
    │   ├── state/
    │   │   ├── authSession.ts        # Auth session state & storage
    │   │   ├── useAuth.ts            # React hook for auth state
    │   │   └── cookies.ts            # Cookie utilities
    │   │
    │   ├── utilityFunctions/
    │   │   ├── socket.ts             # Socket.IO client setup & listeners
    │   │   ├── geolocation.ts        # Browser geolocation helper
    │   │   └── helpers.ts            # General utilities
    │   │
    │   ├── components/
    │   │   ├── Navbar.tsx            # Top navigation
    │   │   ├── Checkbox.tsx          # Checkbox component
    │   │   ├── LocationMarker.tsx    # Map marker component
    │   │   └── Loading.tsx           # Loading spinner
    │   │
    │   ├── styles/
    │   │   └── index.css             # Global Tailwind styles
    │   │
    │   └── lib/
    │       ├── utils.ts              # Utility functions
    │       └── constants.ts          # Frontend constants
    │
    └── public/                       # Static assets
```

## Prerequisites

- **Node.js:** v20 or higher
- **npm:** v10 or higher (or pnpm)
- **Docker & Docker Compose:** Latest version
- **OIDC Issuer:** Accessible OIDC server (or skip if using only FreeAPI)
- **FreeAPI Account:** Optional (for FreeAPI authentication)
- **Git:** For cloning the repository

## Environment Variables

### Backend Environment Files

The backend uses `NODE_ENV` to select configuration:

- `NODE_ENV=development` → reads `.env.development`
- `NODE_ENV=production` → reads `.env.production`

#### Backend Env Reference

| Variable                    | Required | Example                                                | Description                                               |
| --------------------------- | -------- | ------------------------------------------------------ | --------------------------------------------------------- |
| `PORT`                      | Yes      | `3005`                                                 | Backend HTTP & Socket.IO server port                      |
| `NODE_ENV`                  | Yes      | `development`                                          | Environment mode (development / production)               |
| `DATABASE_URL`              | Yes      | `postgresql://postgres:postgres@localhost:9252/authdb` | PostgreSQL connection string                              |
| `CLIENT_ID`                 | Yes      | `client_xxxxx`                                         | OIDC client id for token endpoint & audience verification |
| `CLIENT_SECRET`             | Yes      | `super-secret`                                         | OIDC client secret for code exchange                      |
| `REDIRECT_URI`              | Yes      | `http://localhost:5174/oidc/auth`                      | Frontend callback URI (must match OIDC issuer config)     |
| `OIDC_ISSUER`               | Yes      | `http://localhost:3000`                                | OIDC issuer base URL (for OpenID config & JWKS)           |
| `JWT_ACCESS_SECRET`         | Yes      | `long-random-hex-string`                               | App access token signing secret                           |
| `JWT_REFRESH_SECRET`        | Yes      | `another-long-random-hex-string`                       | App refresh token signing secret                          |
| `ACCESS_TOKEN_TTL`          | Yes      | `15m`                                                  | Access token time-to-live (15m, 1h, 7d, etc.)             |
| `REFRESH_TOKEN_TTL`         | Yes      | `7d`                                                   | Refresh token time-to-live                                |
| `KAFKA_BROKERS`             | Yes      | `localhost:9092`                                       | Comma-separated Kafka broker addresses                    |
| `KAFKA_CLIENT_ID`           | Yes      | `one-million-checkboxes-admin`                         | Kafka client identifier                                   |
| `KAFKA_TOPIC_LOCATION`      | Yes      | `location-updates`                                     | Kafka topic name for location events                      |
| `KAFKA_LOCATION_PARTITIONS` | Yes      | `3`                                                    | Number of partitions for location topic                   |
| `KAFKA_TOPIC_CHECKBOX`      | Yes      | `checkbox-updates`                                     | Kafka topic name for checkbox events                      |
| `KAFKA_CHECKBOX_PARTITIONS` | Yes      | `3`                                                    | Number of partitions for checkbox topic                   |
| `KAFKA_REPLICATION_FACTOR`  | Yes      | `1`                                                    | Kafka replication factor (1 for local, 3+ for production) |
| `KAFKA_GROUP_ID`            | Yes      | `one-million-checkboxes-consumer`                      | Kafka consumer group id                                   |
| `REDIS_URL`                 | Yes      | `redis://localhost:6379`                               | Redis/Valkey connection URL                               |
| `REDIS_PASSWORD`            | No       | `redis-password`                                       | Redis password if authentication required                 |
| `CORS_ORIGIN`               | Yes      | `http://localhost:5174`                                | Allowed CORS origin(s), comma-separated for multiple      |
| `CHECKBOX_STATE_KEY`        | No       | `checkbox:state`                                       | Redis key for checkbox state (default: `checkbox:state`)  |
| `CHECKBOX_UPDATE_CHANNEL`   | No       | `client:checkbox-update`                               | Redis pub/sub channel for checkbox updates                |

#### Backend Env Example (`.env.development`)

```env
# APP
PORT=3005
NODE_ENV=development

# DATABASE
DATABASE_URL=postgresql://postgres:postgres@localhost:9252/authdb

# OIDC / AUTH
CLIENT_ID=client_your_local_client_id
CLIENT_SECRET=your_local_client_secret
REDIRECT_URI=http://localhost:5174/oidc/auth
OIDC_ISSUER=http://localhost:3000

# JWT
JWT_ACCESS_SECRET=aaaabbbbccccddddeeeeffffgggghhhhiiiijjjjkkkkllllmmmmnnnnoooopppp
JWT_REFRESH_SECRET=ppppoooonnnnmmmmllllkkkkjjjjiiiihhhh ggggffffeeeeddddc cccbbbbaaaa
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

# REDIS
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# CORS
CORS_ORIGIN=http://localhost:5174

# CHECKBOX STATE
CHECKBOX_STATE_KEY=checkbox:state
CHECKBOX_UPDATE_CHANNEL=client:checkbox-update
```

### Frontend Environment Files

Vite uses env files inside the `client/` directory:

- `client/.env.development` (development)
- `client/.env.production` (production)

#### Frontend Env Reference

| Variable            | Required | Example                           | Description                              |
| ------------------- | -------- | --------------------------------- | ---------------------------------------- |
| `VITE_PORT`         | Yes      | `5174`                            | Frontend dev server port                 |
| `VITE_CLIENT_ID`    | Yes      | `client_your_local_client_id`     | OIDC client id for login redirect        |
| `VITE_REDIRECT_URI` | Yes      | `http://localhost:5174/oidc/auth` | Frontend callback URL (OIDC redirect)    |
| `VITE_OIDC_ISSUER`  | Yes      | `http://localhost:3000/accounts`  | OIDC issuer login UI base URL            |
| `VITE_API_URL`      | Yes      | `http://localhost:3005`           | Backend API base URL (for HTTP + Socket) |
| `VITE_FREEAPI_URL`  | No       | `https://api.freeapi.app/api/v1`  | FreeAPI base URL                         |

#### Frontend Env Example (`client/.env.development`)

```env
VITE_PORT=5174
VITE_CLIENT_ID=client_your_local_client_id
VITE_REDIRECT_URI=http://localhost:5174/oidc/auth
VITE_OIDC_ISSUER=http://localhost:3000/accounts
VITE_API_URL=http://localhost:3005
VITE_FREEAPI_URL=https://api.freeapi.app/api/v1
```

## Local Setup (Step by Step)

### Step 1: Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd oneMillionCheckboxes
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### Step 2: Start Infrastructure Services

```bash
docker compose up -d
```

This starts:

- **PostgreSQL** on `localhost:9252` (user: `postgres`, pass: `postgres`)
- **Kafka** on `localhost:9092` with Zookeeper
- **Valkey (Redis)** on `localhost:6379`

Verify services are running:

```bash
docker compose ps
```

### Step 3: Create Environment Files

Create `.env.development` in root:

```bash
cp .env.example .env.development
# Edit with your values
```

Create `client/.env.development`:

```bash
cp client/.env.example client/.env.development
# Edit with your values
```

### Step 4: Initialize Database (Optional)

If Drizzle migrations exist:

```bash
npm run migrate:dev
```

Or use Drizzle Studio:

```bash
npm run drizzle:studio
```

### Step 5: Create Kafka Topics (Optional)

```bash
npx tsx src/kafka/kafka-admin.ts
```

This creates topics defined in your env (`location-updates`, `checkbox-updates`).

### Step 6: Start Backend

```bash
npm run dev
```

Expected output:

```
✓ Server running on http://localhost:3005
✓ Socket.IO ready
✓ Kafka connected
✓ Redis connected
```

### Step 7: Start Frontend (New Terminal)

```bash
cd client
npm run dev
```

Expected output:

```
Local: http://localhost:5174/
```

### Step 8: Open Browser

Visit `http://localhost:5174` and test the features:

- **Login:** Use OIDC or FreeAPI credentials
- **Checkboxes:** Toggle boxes in real-time with other tabs
- **Location:** Share geolocation and see markers update

## Running the Project

### Backend

```bash
# Development (watch mode)
npm run dev

# Production build
npm run build

# Production start
npm start

# Type check
npm run type-check

# Lint
npm run lint
```

### Frontend

```bash
cd client

# Development (Vite dev server)
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview

# Lint
npm run lint

# Type check
npm run type-check
```

## API Documentation

### Authentication Endpoints

#### OIDC Code Exchange

**Endpoint:** `GET /api/oauth2/:code`

**Parameters:**

- `code` (URL param): Authorization code from OIDC issuer

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "user": {
      "userId": 123,
      "email": "user@example.com",
      "username": "johndoe"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

**Errors:**

- `400` - Missing or invalid code
- `401` - Token verification failed
- `500` - Server error

#### FreeAPI Token Exchange

**Endpoint:** `POST /api/freeapi/exchange`

**Request Methods:**

- Header: `Authorization: Bearer <freeApiToken>`
- Body: `{ "token": "<freeApiToken>" }`

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "user": {
      "userId": "freeapi_user_id",
      "email": "user@freeapi.app",
      "username": "freeapiuser"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

**Errors:**

- `400` - Missing FreeAPI token
- `401` - Invalid FreeAPI token
- `500` - Server error

### Protected Endpoints

All protected endpoints require `Authorization: Bearer <accessToken>` header.

#### Health Check

**Endpoint:** `GET /health`

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "status": "ok",
    "timestamp": "2026-05-06T10:30:00Z"
  }
}
```

#### Get Checkbox State

**Endpoint:** `GET /api/checkboxState`

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "state": "0000000000000000..." // bit string
  }
}
```

## Socket.IO Contract

### Authentication

Client connects with Bearer token:

```typescript
const socket = io("http://localhost:3005", {
  auth: {
    token: "<accessToken>",
  },
});
```

### Events

#### Checkbox Events

**Client → Server: `checkbox:join`**

```json
{
  "chunkId": 1
}
```

**Client → Server: `checkbox:update`**

```json
{
  "index": 42
}
```

**Server → Client: `checkbox:updated`** (broadcast)

```json
{
  "index": 42,
  "user": "johndoe"
}
```

#### Location Events

**Client → Server: `location:update`**

```json
{
  "lat": 40.7128,
  "lng": -74.006,
  "userId": "user123"
}
```

**Server → Client: `location:updated`** (broadcast)

```json
{
  "userId": "user123",
  "lat": 40.7128,
  "lng": -74.006,
  "timestamp": 1714987800000
}
```

## Authentication Flows

### OIDC Flow (Recommended for Production)

1. User clicks "Login with [OIDC Issuer]"
2. Frontend redirects to OIDC authorization UI
3. User authenticates with issuer (credentials, MFA, OAuth, etc.)
4. Issuer redirects to `REDIRECT_URI?code=xxx`
5. Frontend captures code and calls `GET /api/oauth2/xxx`
6. Backend verifies code at issuer token endpoint
7. Backend verifies token signature using issuer JWKS
8. Backend mints app JWT and returns to client
9. Client stores JWT in cookie and localStorage
10. Client uses JWT for all subsequent API & WebSocket calls

**Pros:**

- Centralized identity management
- Supports enterprise features (MFA, SSO)
- Token rotation & refresh flows supported
- Production-hardened

**Cons:**

- Requires external OIDC server

### FreeAPI Flow

1. User enters username/password in login form
2. Frontend sends credentials to FreeAPI to get token (or user does this externally)
3. Frontend calls `POST /api/freeapi/exchange` with FreeAPI token
4. Backend validates FreeAPI token by calling FreeAPI `/current-user` endpoint
5. Backend mints app JWT and returns to client
6. Client stores JWT identically to OIDC flow
7. Client uses JWT for API & WebSocket

**Pros:**

- Simple username/password flow
- Good for demos and internal apps
- No external OIDC setup needed

**Cons:**

- Credentials exposed in request (use HTTPS always)
- Less flexible than OIDC
- No enterprise features (MFA, etc.) unless FreeAPI adds them

### Dual-Token Model

- **FreeAPI Token:** Only sent to `api.freeapi.app` (e.g., getting quotes, products, etc.)
- **App JWT Token:** Only sent to your backend + WebSocket

```typescript
// Axios interceptor example
apiClient.interceptors.request.use((config) => {
  const session = getAuthSession();
  if (session?.provider === "freeapi" && session.accessToken) {
    // Use FreeAPI token only for freeapi.app
    if (config.url?.includes("freeapi.app")) {
      config.headers.Authorization = `Bearer ${session.freeApiToken}`;
    }
    // Use app JWT for your backend
    if (config.url?.includes(YOUR_API_DOMAIN)) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }
  }
  return config;
});
```

## Scripts

### Root `package.json`

```bash
# Development
npm run dev                    # NODE_ENV=development, tsx watch mode

# Production
npm run build                  # TypeScript build
npm start                      # Start compiled server

# Database
npm run migrate:dev            # Run Drizzle migrations
npm run migrate:prod           # Run migrations in production
npm run drizzle:studio         # Open Drizzle Studio UI

# Kafka
npx tsx src/kafka/kafka-admin.ts   # Create Kafka topics

# Utilities
npm run type-check             # TypeScript check
npm run lint                   # ESLint
npm run format                 # Format code (prettier)
```

### Client `package.json`

```bash
cd client

# Development
npm run dev                    # Vite dev server on VITE_PORT

# Production
npm run build                  # Production build
npm run preview                # Preview production build

# Code Quality
npm run lint                   # ESLint
npm run type-check             # TypeScript check
npm run format                 # Format code
```

## Troubleshooting

### CORS Blocked Requests

**Problem:** Browser console shows CORS error.

**Solution:**

1. Ensure `CORS_ORIGIN` in backend env matches your frontend origin exactly.

   ```env
   # For localhost
   CORS_ORIGIN=http://localhost:5174

   # For multiple origins
   CORS_ORIGIN=http://localhost:5174,https://app.example.com
   ```

2. Restart backend after env change.

3. Clear browser cache and reload.

### OIDC Exchange Fails

**Problem:** `GET /api/oauth2/:code` returns 401 or fails.

**Solution:**

1. Verify env variables:
   - `CLIENT_ID` matches issuer config
   - `CLIENT_SECRET` is correct
   - `REDIRECT_URI` matches exactly (including protocol & port)
   - `OIDC_ISSUER` is reachable

2. Check issuer configuration:
   - Confirm `REDIRECT_URI` is registered as authorized redirect
   - Verify issuer is running and accessible

3. Inspect network requests:
   - Check browser DevTools → Network tab for auth requests
   - Verify token endpoint & JWKS endpoints return valid responses

### Socket.IO Connection Unauthorized

**Problem:** WebSocket connects but immediately disconnects with auth error.

**Solution:**

1. Verify access token is valid:

   ```bash
   # Decode token (use jwt.io or terminal)
   node -e "console.log(require('jsonwebtoken').decode('<token>'))"
   ```

2. Ensure token is in Socket handshake:

   ```typescript
   const socket = io(API_URL, {
     auth: { token: accessToken },
   });
   ```

3. Verify backend `JWT_ACCESS_SECRET` matches token signing secret.

4. Check token expiration:
   - Tokens expire based on `ACCESS_TOKEN_TTL`
   - Implement refresh logic or re-login

### Kafka Topics Not Found

**Problem:** Consumer errors or topics don't exist.

**Solution:**

1. Verify Kafka is running:

   ```bash
   docker compose ps | grep kafka
   ```

2. Create topics explicitly:

   ```bash
   npx tsx src/kafka/kafka-admin.ts
   ```

3. List all topics:

   ```bash
   docker compose exec kafka kafka-topics --bootstrap-server localhost:9092 --list
   ```

4. Verify env topic names match:
   ```env
   KAFKA_TOPIC_LOCATION=location-updates
   KAFKA_TOPIC_CHECKBOX=checkbox-updates
   ```

### Checkbox State is Null or Resets

**Problem:** Checkboxes always start at 0 or state is lost.

**Solution:**

1. Verify Redis is running:

   ```bash
   docker compose ps | grep valkey
   redis-cli ping  # Should return PONG
   ```

2. Check Redis key exists:

   ```bash
   redis-cli GET checkbox:state
   ```

3. Verify `REDIS_URL` env is correct:

   ```env
   REDIS_URL=redis://localhost:6379
   ```

4. Clear Redis cache and reload:
   ```bash
   redis-cli FLUSHALL
   ```

### Frontend Points to Wrong Backend

**Problem:** Frontend makes requests to wrong API URL.

**Solution:**

1. Check `VITE_API_URL` in `client/.env.development`:

   ```env
   VITE_API_URL=http://localhost:3005
   ```

2. Verify backend is running on that port.

3. Clear frontend cache and hot-reload:
   - Restart Vite dev server
   - Hard refresh browser (Ctrl+Shift+R)

### Database Connection Failed

**Problem:** `error: connect ECONNREFUSED 127.0.0.1:9252`

**Solution:**

1. Verify PostgreSQL container is running:

   ```bash
   docker compose ps | grep postgres
   ```

2. Check `DATABASE_URL` is correct:

   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:9252/authdb
   ```

3. Restart PostgreSQL:

   ```bash
   docker compose down
   docker compose up -d postgres
   ```

4. Verify connection:
   ```bash
   psql postgresql://postgres:postgres@localhost:9252/authdb
   ```

### FreeAPI Token Exchange Fails

**Problem:** `POST /api/freeapi/exchange` returns 401.

**Solution:**

1. Verify FreeAPI token is valid:
   - Get fresh token from FreeAPI's test endpoint
   - Ensure token hasn't expired

2. Check internet connectivity to `api.freeapi.app`

3. Ensure token is passed correctly:

   ```typescript
   // Option 1: Header
   axios.post(
     "http://localhost:3005/api/freeapi/exchange",
     {},
     {
       headers: { Authorization: `Bearer ${freeApiToken}` },
     },
   );

   // Option 2: Body
   axios.post("http://localhost:3005/api/freeapi/exchange", {
     token: freeApiToken,
   });
   ```

4. Test FreeAPI token manually:
   ```bash
   curl -H "Authorization: Bearer <token>" \
        https://api.freeapi.app/api/v1/users/current-user
   ```

## Production Notes

### Deployment Checklist

- [ ] Never commit real production secrets to version control
- [ ] Rotate `CLIENT_SECRET`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` before deployment
- [ ] Use HTTPS for all endpoints (frontend, backend, OIDC issuer)
- [ ] Set secure cookie attributes:
  - `Secure` flag (HTTPS only)
  - `HttpOnly` flag (no JavaScript access)
  - `SameSite=Strict` (CSRF protection)
- [ ] Tighten `CORS_ORIGIN` to explicit trusted domains
- [ ] Enable request logging and monitoring
- [ ] Set up centralized error tracking (e.g., Sentry)
- [ ] Use managed services for Redis and Kafka (avoid self-hosting)
- [ ] Implement rate limiting on auth endpoints
- [ ] Enable CSRF protection if serving HTML

### Scaling Considerations

#### Multi-Instance Backend

For scaling backend to multiple instances:

1. **Socket.IO Adapter:** Use Socket.IO-Redis adapter

   ```typescript
   import { createAdapter } from "@socket.io-redis";
   io.adapter(createAdapter(redisClient, redisSubscriber));
   ```

2. **Load Balancer:** Use sticky sessions (route by user ID or session)

3. **External Redis:** Use managed Redis service (AWS ElastiCache, etc.)

4. **External Kafka:** Use managed Kafka (AWS MSK, Confluent Cloud, etc.)

#### Frontend Optimization

1. **CDN:** Serve static assets from CDN
2. **Code Splitting:** Lazy-load page components
3. **Service Worker:** Enable offline support and caching
4. **Compression:** Enable gzip/brotli on backend

### Security Best Practices

1. **Input Validation:** Validate all user inputs server-side
2. **Rate Limiting:** Protect auth endpoints from brute force
3. **HTTPS/TLS:** Use certificates (Let's Encrypt for free)
4. **Secrets Management:** Use env vars or secret manager (AWS Secrets Manager, etc.)
5. **CORS:** Be strict with origins
6. **CSP Headers:** Define Content Security Policy
7. **Socket.IO Auth:** Verify tokens on every socket event
8. **Database:** Use parameterized queries (Drizzle handles this)
9. **Logging:** Don't log sensitive data (tokens, passwords)
10. **Updates:** Keep dependencies updated (`npm audit`, `npm update`)

### Monitoring & Observability

1. **Logs:** Structure logs (JSON format for parsing)
2. **Metrics:** Track response times, error rates, connection counts
3. **Tracing:** Use distributed tracing for multi-service requests
4. **Alerts:** Set up alerts for errors, high latency, connection issues

---

**Last Updated:** May 6, 2026
