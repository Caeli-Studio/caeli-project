# Supabase Integration Architecture

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend App                             │
│  (React Native / Web - uses Supabase Auth)                      │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ JWT Token in Authorization Header
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Fastify Backend                             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              @fastify/jwt Plugin                         │  │
│  │  (Verifies JWT token from Authorization header)          │  │
│  └──────────────────────┬───────────────────────────────────┘  │
│                         │                                       │
│  ┌──────────────────────▼───────────────────────────────────┐  │
│  │       @psteinroe/fastify-supabase Plugin                 │  │
│  │                                                           │  │
│  │  ┌─────────────────┐        ┌──────────────────┐        │  │
│  │  │ Service Role    │        │ User Client      │        │  │
│  │  │ Client          │        │ (Per Request)    │        │  │
│  │  │                 │        │                  │        │  │
│  │  │ fastify.        │        │ request.         │        │  │
│  │  │ supabaseClient  │        │ supabaseClient   │        │  │
│  │  │                 │        │                  │        │  │
│  │  │ Bypasses RLS ⚠️ │        │ Respects RLS ✅  │        │  │
│  │  └────────┬────────┘        └────────┬─────────┘        │  │
│  │           │                          │                   │  │
│  └───────────┼──────────────────────────┼───────────────────┘  │
│              │                          │                      │
└──────────────┼──────────────────────────┼──────────────────────┘
               │                          │
               └──────────┬───────────────┘
                          │
                          ▼
         ┌────────────────────────────────────┐
         │        Supabase Project            │
         │                                    │
         │  ┌──────────────────────────────┐ │
         │  │  PostgreSQL Database         │ │
         │  │  (with RLS enabled)          │ │
         │  └──────────────────────────────┘ │
         │                                    │
         │  ┌──────────────────────────────┐ │
         │  │  Auth Service                │ │
         │  │  (JWT verification)          │ │
         │  └──────────────────────────────┘ │
         │                                    │
         │  ┌──────────────────────────────┐ │
         │  │  Storage & Realtime          │ │
         │  └──────────────────────────────┘ │
         └────────────────────────────────────┘
```

## 🔄 Request Flow

### Public Route (No Authentication)

```
1. Client Request → Fastify Backend
2. Route Handler → fastify.supabaseClient (Service Role)
3. Query Database → Bypass RLS
4. Return Data → Client
```

### Protected Route (With Authentication)

```
1. Client Request (with JWT) → Fastify Backend
2. verifyJWT Middleware → Verify Token with @fastify/jwt
3. Token Valid ✅ → Decode User Info
4. fastify-supabase → Create User-Scoped Client
5. Route Handler → request.supabaseClient (User Client)
6. Query Database → Apply RLS Policies
7. Return Data → Client
```

## 📦 Client Types

### Service Role Client

```typescript
// Available on: fastify.supabaseClient
// Authentication: Service Role Key
// RLS: BYPASSED
// Use Cases:
//   - Admin dashboards
//   - Scheduled tasks
//   - System operations
//   - Background jobs
```

### User Client

```typescript
// Available on: request.supabaseClient
// Authentication: User JWT Token
// RLS: ENFORCED
// Use Cases:
//   - User CRUD operations
//   - Profile management
//   - User-specific queries
//   - Protected resources
```

## 🔐 Security Layers

```
┌─────────────────────────────────────────┐
│  1. HTTPS/TLS Encryption                │
│     (Transport Layer Security)           │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│  2. JWT Verification                     │
│     (@fastify/jwt middleware)            │
│     - Validates token signature          │
│     - Checks expiration                  │
│     - Verifies issuer                    │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│  3. User-Scoped Client                   │
│     (fastify-supabase plugin)            │
│     - Creates client with user token     │
│     - Passes user context to Supabase    │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│  4. Row Level Security (RLS)             │
│     (Supabase PostgreSQL)                │
│     - Applies user-based policies        │
│     - Filters accessible rows            │
│     - Prevents unauthorized access       │
└─────────────────────────────────────────┘
```

## 📁 File Structure

```
apps/backend/
├── .env                              # Environment variables
├── CHECKLIST.md                      # Setup checklist
├── SUPABASE_SETUP_COMPLETE.md       # Setup summary
│
├── scripts/
│   └── test-supabase.js             # Env validation script
│
├── docs/
│   ├── Supabase-Setup.md            # Full documentation
│   └── Supabase-Quick-Reference.md  # Quick reference
│
└── src/
    ├── index.ts                      # Main app (registers plugin)
    │
    ├── config/
    │   └── supabase.ts              # Supabase configuration
    │
    ├── types/
    │   └── supabase.d.ts            # TypeScript declarations
    │
    ├── utils/
    │   └── auth.ts                  # verifyJWT middleware
    │
    └── routes/
        ├── index.ts                 # Route registration
        └── supabase.routes.ts       # Example routes
```

## 🎯 Key Integration Points

### 1. Plugin Registration (src/index.ts)

```typescript
await registerSupabase(app);
```

### 2. Supabase Config (src/config/supabase.ts)

```typescript
export async function registerSupabase(app: FastifyInstance) {
  await app.register(fastifyJWT, { secret: jwtSecret });
  await app.register(fastifySupabase, { url, anonKey, serviceKey });
}
```

### 3. JWT Verification (src/utils/auth.ts)

```typescript
export const verifyJWT: onRequestHookHandler = async (request) => {
  await request.jwtVerify();
};
```

### 4. Route Usage (src/routes/\*.ts)

```typescript
fastify.get(
  '/protected',
  {
    onRequest: [verifyJWT],
  },
  async (request, reply) => {
    // request.user available
    // request.supabaseClient available
  }
);
```

## 🚀 Deployment Checklist

- [ ] Environment variables set in production
- [ ] `SUPABASE_SERVICE_KEY` kept secure
- [ ] RLS enabled on all tables
- [ ] CORS configured for production origins
- [ ] HTTPS enabled
- [ ] Rate limiting configured
- [ ] Monitoring and logging set up

---

**This architecture provides a secure, scalable way to integrate Supabase with Fastify!** ✨
