# MVC Architecture Flow

## Request Flow Diagram

````
┌─────────────────────────────────────────────────────────────┐
│                      Client Request                         │
│                   (HTTP: GET, POST, etc.)                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    ROUTES LAYER                             │
│  • Maps endpoints to controllers                            │
│  • Defines URL structure                                    │
│  • Logs route registration                                  │
│                                                             │
│  📁 src/routes/user.routes.ts                              │
│  ├─ GET    /api/v1/users                                   │
│  ├─ POST   /api/v1/users                                   │
│  ├─ GET    /api/v1/users/:id                              │
│  ├─ PUT    /api/v1/users/:id                              │
│  └─ DELETE /api/v1/users/:id                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  CONTROLLERS LAYER                          │
│  • Handles HTTP request/response                            │
│  • Validates input data                                     │
│  • Calls service methods                                    │
│  • Formats responses                                        │
│                                                             │
│  📁 src/controllers/user.controller.ts                     │
│  ├─ getAllUsers()                                          │
│  ├─ getUserById()                                          │
│  ├─ createUser()                                           │
│  ├─ updateUser()                                           │
│  └─ deleteUser()                                           │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   SERVICES LAYER                            │
│  • Business logic implementation                            │
│  • Data validation & transformation                         │
│  • Database/store operations                                │
│  • Error handling                                           │
│                                                             │
│  📁 src/services/user.service.ts                           │
│  ├─ getAllUsers()                                          │
│  ├─ getUserById(id)                                        │
│  ├─ getUserByEmail(email)                                  │
│  ├─ createUser(data)                                       │
│  ├─ updateUser(id, data)                                   │
│  └─ deleteUser(id)                                         │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    MODELS LAYER                             │
│  • Data structure definitions                               │
│  • Zod validation schemas                                   │
│  • TypeScript types & DTOs                                  │
│                                                             │
│  📁 src/models/user.model.ts                               │
│  ├─ User type                                              │
│  ├─ CreateUserDto type                                     │
│  ├─ UpdateUserDto type                                     │
│  ├─ userSchema (Zod)                                       │
│  ├─ createUserSchema (Zod)                                 │
│  └─ updateUserSchema (Zod)                                 │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
                  ┌────────────────┐
                  │   Data Store   │
                  │  (In-memory /  │
                  │   Database)    │
                  └────────────────┘

═══════════════════════════════════════════════════════════════

## Response Flow

Data Store → Models → Services → Controllers → Routes → Client

═══════════════════════════════════════════════════════════════

## Example: Creating a User

1. **Client** sends POST /api/v1/users with JSON body

2. **Route** receives request and calls controller
   ```typescript
   app.post('/', userController.createUser.bind(userController))
````

3. **Controller** validates input and calls service

   ```typescript
   const result = createUserSchema.safeParse(request.body);
   const user = await userService.createUser(result.data);
   ```

4. **Service** implements business logic

   ```typescript
   // Check if email exists
   const existing = await this.getUserByEmail(email);
   if (existing) throw createError.conflict('Email exists');

   // Create user
   const newUser = { id: uuid(), ...userData };
   users.push(newUser);
   return newUser;
   ```

5. **Model** provides type safety and validation

   ```typescript
   export type CreateUserDto = z.infer<typeof createUserSchema>;
   ```

6. **Controller** formats and sends response

   ```typescript
   reply.code(201).send({
     data: user,
     message: 'User created successfully',
   });
   ```

7. **Client** receives response

═══════════════════════════════════════════════════════════════

## Folder Structure

```
src/
├── models/           # Data definitions & schemas
├── services/         # Business logic
├── controllers/      # HTTP handlers
├── routes/          # Endpoint definitions
└── utils/           # Shared utilities
```

## Key Principles

✅ **Single Responsibility**: Each layer has one job
✅ **Separation of Concerns**: Business logic separate from HTTP logic
✅ **Dependency Flow**: Routes → Controllers → Services → Models
✅ **Type Safety**: TypeScript + Zod throughout
✅ **Testability**: Each layer can be tested independently
