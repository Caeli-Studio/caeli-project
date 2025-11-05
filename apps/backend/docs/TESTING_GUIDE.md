# Quick Testing Guide

## Start the Server

```bash
cd apps/backend
pnpm dev
```

Server will start at `http://localhost:3000`

## 1. Authentication

### Login with Google

```bash
# Open in browser
http://localhost:3000/api/auth/google

# After redirect, you'll get a JWT token
# Save it as TOKEN for subsequent requests
```

## 2. Create Profile (First Time)

```bash
TOKEN="your_jwt_token_here"

curl -X POST http://localhost:3000/api/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "John Doe",
    "locale": "en"
  }'
```

## 3. Get My Profile

```bash
curl http://localhost:3000/api/profile/me \
  -H "Authorization: Bearer $TOKEN"
```

## 4. Create a Group

```bash
curl -X POST http://localhost:3000/api/groups \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Family",
    "type": "family"
  }'

# Save the group_id from response as GROUP_ID
```

## 5. Get My Groups

```bash
curl http://localhost:3000/api/groups \
  -H "Authorization: Bearer $TOKEN"
```

## 6. Create a Task

```bash
GROUP_ID="your_group_id_here"

curl -X POST http://localhost:3000/api/groups/$GROUP_ID/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Clean the kitchen",
    "description": "Wash dishes and wipe counters",
    "importance": "medium",
    "due_date": "2024-12-31T18:00:00Z"
  }'

# Save task_id from response as TASK_ID
```

## 7. Get Tasks

```bash
# All tasks
curl "http://localhost:3000/api/groups/$GROUP_ID/tasks" \
  -H "Authorization: Bearer $TOKEN"

# Only pending tasks
curl "http://localhost:3000/api/groups/$GROUP_ID/tasks?status=pending" \
  -H "Authorization: Bearer $TOKEN"

# High importance tasks
curl "http://localhost:3000/api/groups/$GROUP_ID/tasks?importance=high" \
  -H "Authorization: Bearer $TOKEN"

# My assigned tasks
curl "http://localhost:3000/api/groups/$GROUP_ID/tasks?assigned_to=me" \
  -H "Authorization: Bearer $TOKEN"
```

## 8. Take a Task (Self-Assign)

```bash
TASK_ID="your_task_id_here"

curl -X POST http://localhost:3000/api/groups/$GROUP_ID/tasks/$TASK_ID/take \
  -H "Authorization: Bearer $TOKEN"
```

## 9. Complete a Task

```bash
curl -X POST http://localhost:3000/api/groups/$GROUP_ID/tasks/$TASK_ID/complete \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "All done!"
  }'
```

## 10. Invite a Member

```bash
curl -X POST http://localhost:3000/api/groups/$GROUP_ID/members/invite \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "other_user_uuid_here",
    "role": "member",
    "nickname": "Jane"
  }'
```

## 11. Request Task Transfer

```bash
curl -X POST http://localhost:3000/api/groups/$GROUP_ID/transfers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "'$TASK_ID'",
    "target_member_id": "other_member_uuid",
    "reason": "I have too much to do today"
  }'

# Save transfer_id from response
```

## 12. Accept Transfer

```bash
TRANSFER_ID="your_transfer_id_here"

curl -X POST http://localhost:3000/api/groups/$GROUP_ID/transfers/$TRANSFER_ID/accept \
  -H "Authorization: Bearer $TOKEN"
```

## 13. Get Notifications

```bash
curl http://localhost:3000/api/notifications \
  -H "Authorization: Bearer $TOKEN"
```

## 14. Mark Notification as Read

```bash
NOTIF_ID="your_notification_id_here"

curl -X PUT http://localhost:3000/api/notifications/$NOTIF_ID/read \
  -H "Authorization: Bearer $TOKEN"
```

## 15. Create Hub Session (Monitor Mode)

```bash
curl -X POST http://localhost:3000/api/groups/$GROUP_ID/hub/session \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_name": "Kitchen Tablet",
    "pin": "1234"
  }'

# Save session_id and pin
```

## 16. Connect to Hub (No Auth Required)

```bash
curl -X POST http://localhost:3000/api/groups/$GROUP_ID/hub/connect \
  -H "Content-Type: application/json" \
  -d '{
    "pin": "1234"
  }'
```

## 17. Update Profile

```bash
curl -X PUT http://localhost:3000/api/profile/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "John Smith",
    "pin": "5678"
  }'
```

## 18. Update Group

```bash
curl -X PUT http://localhost:3000/api/groups/$GROUP_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "The Smith Family",
    "type": "family"
  }'
```

## 19. Get Group Members

```bash
curl http://localhost:3000/api/groups/$GROUP_ID/members \
  -H "Authorization: Bearer $TOKEN"
```

## 20. Update Task

```bash
curl -X PUT http://localhost:3000/api/groups/$GROUP_ID/tasks/$TASK_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Clean the entire kitchen",
    "importance": "high"
  }'
```

## Testing Permissions

### Try as Member (should work)

```bash
# Create task
curl -X POST http://localhost:3000/api/groups/$GROUP_ID/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "New task"}'
```

### Try as Child (should fail - no permission)

```bash
# First, demote yourself to child role (need another admin to do this)
# Then try to create task - should get 403 Forbidden
```

## Common Response Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - No/invalid JWT token
- `403 Forbidden` - No permission
- `404 Not Found` - Resource doesn't exist
- `409 Conflict` - Resource conflict (e.g., duplicate)
- `500 Internal Server Error` - Server error

## Health Check

```bash
# Server health
curl http://localhost:3000/api/health

# Supabase connection
curl http://localhost:3000/api/health/supabase
```

## Tips

1. **Save your tokens**: Store JWT in environment variable for easier testing
2. **Save IDs**: Keep track of group_id, task_id, etc. from responses
3. **Check permissions**: Different roles have different permissions
4. **Use filters**: Tasks endpoint supports many query parameters
5. **Check notifications**: Many actions trigger notifications

## Troubleshooting

### "Unauthorized" error

- Make sure you're including the Authorization header
- Check that your JWT token is valid
- Try logging in again

### "Forbidden" error

- Check your role in the group
- Verify you have the required permission
- Review the permission matrix in API_DOCUMENTATION.md

### "Not found" error

- Verify the resource ID is correct
- Make sure you're a member of the group
- Check that the resource exists

### Connection errors

- Ensure server is running
- Check Supabase connection
- Verify environment variables are set

## Next Steps

1. Test all endpoints with different roles
2. Verify permission enforcement
3. Check notification creation
4. Test hub/monitor mode
5. Review audit logs in database
6. Test edge cases (invalid data, non-existent resources, etc.)

Happy testing! 🚀
