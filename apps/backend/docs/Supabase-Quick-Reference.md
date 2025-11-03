# Supabase Quick Reference

## 🔧 Environment Setup

```bash
# .env file
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
```

## 📦 Two Client Types

### 1. Service Role Client (Admin)

- **Access**: `fastify.supabaseClient`
- **Auth**: Service role key
- **RLS**: Bypassed ⚠️
- **Use for**: Admin operations, server-side tasks

### 2. User Client (User-scoped)

- **Access**: `request.supabaseClient`
- **Auth**: User's JWT token
- **RLS**: Enforced ✅
- **Use for**: User operations, protected routes

## 🚀 Quick Examples

### Public Route (Service Role)

```typescript
fastify.get('/api/admin/stats', async (request, reply) => {
  const { data } = await fastify.supabaseClient.from('users').select('count');

  return reply.send(data);
});
```

### Protected Route (User)

```typescript
import { verifyJWT } from '../utils/auth';

fastify.get(
  '/api/profile',
  {
    onRequest: [verifyJWT],
  },
  async (request, reply) => {
    const { data } = await request.supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', request.user.sub)
      .single();

    return reply.send(data);
  }
);
```

## 🔐 Frontend Authentication

```typescript
// Login
const { data } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
});

const token = data.session?.access_token;

// Make authenticated request
fetch('http://localhost:3000/api/profile', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

## 👤 User Object Properties

```typescript
request.user = {
  sub: string, // User ID
  email: string,
  iat: number, // Issued at
  exp: number, // Expires at
  app_metadata: {}, // App metadata
  user_metadata: {}, // User metadata
};
```

## 📝 Common Patterns

### Insert with User ID

```typescript
fastify.post(
  '/api/posts',
  {
    onRequest: [verifyJWT],
  },
  async (request, reply) => {
    const { title, content } = request.body;

    const { data } = await request.supabaseClient
      .from('posts')
      .insert({
        title,
        content,
        user_id: request.user.sub, // Auto-add user ID
      })
      .select()
      .single();

    return reply.send(data);
  }
);
```

### Update Own Records

```typescript
fastify.put(
  '/api/posts/:id',
  {
    onRequest: [verifyJWT],
  },
  async (request, reply) => {
    const { id } = request.params;
    const { title, content } = request.body;

    const { data } = await request.supabaseClient
      .from('posts')
      .update({ title, content })
      .eq('id', id)
      .eq('user_id', request.user.sub) // Ensure ownership
      .select()
      .single();

    return reply.send(data);
  }
);
```

### Delete Own Records

```typescript
fastify.delete(
  '/api/posts/:id',
  {
    onRequest: [verifyJWT],
  },
  async (request, reply) => {
    const { id } = request.params;

    const { error } = await request.supabaseClient
      .from('posts')
      .delete()
      .eq('id', id)
      .eq('user_id', request.user.sub);

    if (error) {
      return reply.status(500).send({ error: error.message });
    }

    return reply.status(204).send();
  }
);
```

## ⚡ Files Reference

| File                            | Purpose                             |
| ------------------------------- | ----------------------------------- |
| `src/config/supabase.ts`        | Plugin configuration & registration |
| `src/utils/auth.ts`             | JWT verification middleware         |
| `src/types/supabase.d.ts`       | TypeScript type declarations        |
| `src/routes/supabase.routes.ts` | Example routes                      |
| `docs/Supabase-Setup.md`        | Full documentation                  |
