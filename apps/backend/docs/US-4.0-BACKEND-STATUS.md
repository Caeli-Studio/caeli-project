# US-4.0 - Create Task - Backend Status

## ✅ Backend Completement Implémenté

Le backend pour la création de tâches est **100% fonctionnel** et ne nécessite **AUCUNE modification**.

## Critères de Validation - Status Backend

- ✅ **CA1**: L'utilisateur peut créer une tâche avec titre (obligatoire)
  - Endpoint: `POST /api/groups/:group_id/tasks`
  - Validation: `title` requis (1-200 caractères)

- ✅ **CA2**: L'utilisateur peut ajouter une description, date d'échéance, et assigner la tâche
  - Champs supportés: `description`, `due_at`, `assigned_to[]`

- ✅ **CA3**: La tâche est enregistrée et visible dans la liste
  - Endpoint: `GET /api/groups/:group_id/tasks`
  - Filtres disponibles: status, assigned_to_me, date range, etc.

- ✅ **CA4**: Une notification est envoyée au membre assigné
  - Implémenté automatiquement lors de l'assignation
  - Type: `task_assigned`

- ✅ **CA5**: La tâche apparaît sur l'écran connecté en temps réel
  - Hub Sessions: `POST /api/groups/:group_id/hub`
  - Supabase Realtime supporté nativement

## API Disponibles

### Créer une Tâche

```
POST /api/groups/:group_id/tasks
Authorization: Bearer <token>

Body:
{
  "title": "string (requis)",
  "description": "string (optionnel)",
  "due_at": "ISO 8601 date-time (optionnel)",
  "assigned_to": ["membership_id1", "membership_id2"]
}
```

### Lister les Tâches

```
GET /api/groups/:group_id/tasks?status=open&assigned_to_me=true
```

### Autres Endpoints

- `GET /api/groups/:group_id/tasks/:task_id` - Détails
- `PUT /api/groups/:group_id/tasks/:task_id` - Modifier
- `DELETE /api/groups/:group_id/tasks/:task_id` - Supprimer
- `POST /api/groups/:group_id/tasks/:task_id/assign` - Assigner
- `POST /api/groups/:group_id/tasks/:task_id/complete` - Compléter
- `POST /api/groups/:group_id/tasks/:task_id/take` - Prendre (tâche libre)

### Notifications

```
GET /api/notifications?unread_only=true
POST /api/notifications/mark-read
```

### Hub (Écran Partagé)

```
POST /api/groups/:group_id/hub - Créer session
POST /api/groups/:group_id/hub/connect - Se connecter
GET /api/groups/:group_id/hub/tasks - Tâches du hub
```

## Documentation Complète

- API Docs: `http://localhost:3000/docs` (Swagger UI)
- Schema DB: [database/schema.sql](../database/schema.sql)
- Types: [src/types/database.ts](../src/types/database.ts)

## Prochaines Étapes

**Frontend React Native uniquement** :

1. Créer l'écran de création de tâche
2. Form avec: titre, description, date picker, sélection de membres
3. Appeler l'API `POST /api/groups/:group_id/tasks`
4. Afficher les notifications
5. Intégrer le temps réel (optionnel)

Aucune modification du backend n'est requise ! 🎉
