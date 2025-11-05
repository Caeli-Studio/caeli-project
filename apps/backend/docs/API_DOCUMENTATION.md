# 🏠 Caeli API - Household Task Management

Complete REST API for managing household tasks, groups, and member coordination.

## 📋 Project Overview

Caeli is a mobile application designed to improve task organization within a household (family, roommates, etc.). This backend API provides all the necessary endpoints to:

- Manage user profiles and authentication
- Create and manage household groups
- Assign and track tasks
- Handle task transfers and exchanges
- Send notifications
- Connect to external calendars (Google/Apple)
- Manage shared hub/monitor access

## 🗄️ Database Schema

The complete schema is in `/database/schema.sql` and includes:

- **profiles** - User information and preferences
- **groups** - Household groups (family, roommates, etc.)
- **memberships** - User membership in groups with roles
- **tasks** - Tasks to be completed
- **task_assignments** - Assignment of tasks to members
- **task_transfers** - Task exchange and delegation requests
- **notifications** - In-app notifications
- **hub_sessions** - Shared monitor/screen sessions
- **calendar_connections** - OAuth connections to external calendars
- **member_preferences** - Member-specific preferences per group
- **audit_log** - Complete audit trail
- **task_templates** - Reusable task templates

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Database

Run the schema in your Supabase project:

```bash
# Apply schema to Supabase
psql -h db.PROJECT_ID.supabase.co -U postgres -d postgres -f database/schema.sql
```

### 3. Configure Environment

Update `.env` with your Supabase credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_JWT_SECRET=your-jwt-secret
```

### 4. Run the Server

```bash
pnpm dev
```

## 📡 API Endpoints

### Authentication

- `POST /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/callback` - Handle OAuth callback
- `GET /api/auth/session` - Get current session
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/signout` - Sign out

### Profile

- `GET /api/profile/me` - Get my profile
- `PUT /api/profile/me` - Update my profile
- `POST /api/profile` - Create profile
- `GET /api/profile/:user_id` - Get user profile

### Groups

- `POST /api/groups` - Create a group
- `GET /api/groups` - Get my groups
- `GET /api/groups/:group_id` - Get group details
- `PUT /api/groups/:group_id` - Update group
- `DELETE /api/groups/:group_id` - Delete group
- `POST /api/groups/:group_id/leave` - Leave group

### Members (within a group)

- `GET /api/groups/:group_id/members` - List members
- `POST /api/groups/:group_id/members/invite` - Invite member
- `PUT /api/groups/:group_id/members/:member_id` - Update member role
- `DELETE /api/groups/:group_id/members/:member_id` - Remove member

### Tasks

- `POST /api/groups/:group_id/tasks` - Create task
- `GET /api/groups/:group_id/tasks` - List tasks
- `GET /api/groups/:group_id/tasks/:task_id` - Get task
- `PUT /api/groups/:group_id/tasks/:task_id` - Update task
- `DELETE /api/groups/:group_id/tasks/:task_id` - Delete task
- `POST /api/groups/:group_id/tasks/:task_id/assign` - Assign task
- `POST /api/groups/:group_id/tasks/:task_id/complete` - Complete task
- `POST /api/groups/:group_id/tasks/:task_id/take` - Take free task

### Task Transfers

- `POST /api/groups/:group_id/transfers` - Create transfer/exchange
- `GET /api/groups/:group_id/transfers` - List transfers
- `GET /api/groups/:group_id/transfers/:transfer_id` - Get transfer
- `POST /api/groups/:group_id/transfers/:transfer_id/accept` - Accept transfer
- `POST /api/groups/:group_id/transfers/:transfer_id/refuse` - Refuse transfer
- `POST /api/groups/:group_id/transfers/:transfer_id/cancel` - Cancel transfer

### Notifications

- `GET /api/notifications` - List my notifications
- `PUT /api/notifications/read` - Mark as read
- `DELETE /api/notifications/:notification_id` - Delete notification

### Hub (Shared Monitor)

- `POST /api/groups/:group_id/hub/session` - Create hub session
- `POST /api/hub/connect` - Connect to hub with code
- `POST /api/hub/disconnect` - Disconnect from hub
- `GET /api/hub/status` - Get hub status

### Calendar

- `POST /api/calendar/connect` - Connect calendar (Google/Apple)
- `GET /api/calendar/connections` - List connections
- `DELETE /api/calendar/connections/:connection_id` - Disconnect

### Preferences

- `GET /api/groups/:group_id/preferences` - Get my preferences
- `PUT /api/groups/:group_id/preferences` - Update preferences

## 🔐 Authentication & Authorization

### JWT Authentication

All endpoints (except auth endpoints) require a valid JWT token:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.caeli.app/api/groups
```

### Role-Based Access Control

Roles (in order of importance):

- **owner** (100) - Full control
- **admin** (80) - Manage members and tasks
- **member** (50) - Create and complete tasks
- **child** (30) - View and complete assigned tasks
- **guest** (10) - View only

### Permissions

| Permission         | owner | admin | member | child | guest |
| ------------------ | ----- | ----- | ------ | ----- | ----- |
| can_create_tasks   | ✅    | ✅    | ✅     | ❌    | ❌    |
| can_assign_tasks   | ✅    | ✅    | ❌     | ❌    | ❌    |
| can_delete_tasks   | ✅    | ✅    | ❌     | ❌    | ❌    |
| can_manage_members | ✅    | ✅    | ❌     | ❌    | ❌    |
| can_edit_group     | ✅    | ✅    | ❌     | ❌    | ❌    |
| can_view_audit_log | ✅    | ✅    | ❌     | ❌    | ❌    |

## 📊 Query Parameters

### Tasks

```
GET /api/groups/:group_id/tasks?status=open&assigned_to_me=true&from=2025-11-01&limit=20
```

Parameters:

- `status` - Filter by status (open, done, cancelled)
- `assigned_to_me` - Show only my tasks (boolean)
- `is_free` - Show only free tasks (boolean)
- `from` - Start date (ISO 8601)
- `to` - End date (ISO 8601)
- `limit` - Max results (default: 50)
- `offset` - Pagination offset (default: 0)

### Notifications

```
GET /api/notifications?unread_only=true&type=task_reminder&limit=10
```

Parameters:

- `unread_only` - Show only unread (boolean)
- `type` - Filter by type
- `limit` - Max results
- `offset` - Pagination offset

## 🔔 Notification Types

- `task_reminder` - Task is due soon
- `transfer_request` - Someone wants to transfer a task
- `ping` - Member sent you a ping
- `task_assigned` - Task assigned to you
- `task_completed` - Task you created was completed
- `role_changed` - Your role was updated

## 🏃 Task Workflow

### Creating and Assigning

```bash
# 1. Create task
POST /api/groups/GROUP_ID/tasks
{
  "title": "Clean kitchen",
  "description": "Wipe counters, do dishes",
  "due_at": "2025-11-03T18:00:00Z",
  "assigned_to": ["MEMBER_ID_1", "MEMBER_ID_2"]
}

# 2. Complete task
POST /api/groups/GROUP_ID/tasks/TASK_ID/complete
```

### Free Tasks

```bash
# Create free task
POST /api/groups/GROUP_ID/tasks
{
  "title": "Water plants",
  "is_free": true
}

# Anyone can take it
POST /api/groups/GROUP_ID/tasks/TASK_ID/take
```

### Task Transfers

```bash
# Offer task to someone
POST /api/groups/GROUP_ID/transfers
{
  "task_id": "TASK_ID",
  "to_membership_id": "MEMBER_ID",
  "message": "Can you help with this?"
}

# They accept
POST /api/groups/GROUP_ID/transfers/TRANSFER_ID/accept
```

## 🖥️ Hub/Monitor Access

The hub feature allows a shared display in the household:

1. **Create Session**: Admin creates a hub session, gets a QR code
2. **Connect**: User scans code, enters their PIN
3. **Display**: Hub shows group tasks, calendar, etc.
4. **Disconnect**: User disconnects, hub returns to QR code

```bash
# Create session
POST /api/groups/GROUP_ID/hub/session
{
  "device_name": "Living Room TV"
}
# Returns: { code: "ABC12345" }

# Connect (user scans QR, app calls this)
POST /api/hub/connect
{
  "code": "ABC12345",
  "pin": "1234"
}
```

## 🛠️ Development

### Project Structure

```
apps/backend/
├── src/
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Auth, permissions, audit
│   ├── routes/          # Route definitions
│   ├── types/           # TypeScript types
│   ├── utils/           # Helpers
│   └── index.ts         # Main app file
├── database/
│   └── schema.sql       # Database schema
└── docs/                # Documentation
```

### Adding a New Endpoint

1. Add types to `src/types/database.ts`
2. Create controller in `src/controllers/`
3. Add routes in `src/routes/`
4. Register routes in `src/index.ts`

### Running Tests

```bash
pnpm test
```

## 📝 Error Handling

All responses follow this format:

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not found
- `429` - Too many requests
- `500` - Internal server error

## 🔍 Audit Logging

All important actions are logged to `audit_log` table:

- Task creation/completion
- Member role changes
- Group modifications
- Task transfers

Query audit logs (admin only):

```bash
GET /api/groups/GROUP_ID/audit?subject_type=task&from=2025-11-01
```

## 🚀 Deployment

### Environment Variables

Required:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `SUPABASE_JWT_SECRET`
- `FRONTEND_URL`

Optional:

- `PORT` (default: 3000)
- `NODE_ENV` (default: development)
- `LOG_LEVEL` (default: info)

### Production Considerations

1. **Rate Limiting**: Already implemented on sensitive endpoints
2. **CORS**: Configure `ALLOWED_ORIGINS` in `.env`
3. **Logging**: Use proper log aggregation (e.g., DataDog, LogDNA)
4. **Monitoring**: Set up health checks at `/api/health`
5. **Database**: Enable connection pooling in Supabase

## 📚 Additional Documentation

- [Google OAuth Setup](./docs/Google-OAuth-Setup.md)
- [Expo Integration](./docs/Expo-Google-OAuth-Guide.md)
- [Database Schema Details](./database/schema.sql)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

---

**Built with Fastify, Supabase, and ❤️**
