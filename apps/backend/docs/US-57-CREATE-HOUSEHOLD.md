# US #57 - Créer un foyer

## 📋 Description

En tant qu'utilisateur, je veux pouvoir créer un nouveau foyer afin de commencer à gérer les tâches avec les membres de ma famille ou colocataires.

## ✅ Critères de validation implémentés

| Critère | Implémentation                                                   | Status                                  |
| ------- | ---------------------------------------------------------------- | --------------------------------------- |
| **CA1** | L'utilisateur peut créer un foyer avec un nom (obligatoire)      | ✅ Validation Zod dans routes           |
| **CA2** | L'utilisateur créateur devient automatiquement "maître de foyer" | ✅ Membership avec role_name = 'owner'  |
| **CA3** | Le foyer est enregistré dans la base de données                  | ✅ Insert dans `groups` + `memberships` |
| **CA4** | L'utilisateur est redirigé vers le tableau de bord               | ❌ Frontend (hors scope backend)        |
| **CA5** | Un message de succès s'affiche après création                    | ✅ Message "Foyer créé avec succès"     |

## 🚀 API Endpoint

### POST /api/groups

Crée un nouveau foyer (household group).

**Headers:**

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "Famille Dupont",
  "description": "Notre famille heureuse", // optionnel
  "type": "family" // optionnel, default: "family"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "group": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Famille Dupont",
      "description": "Notre famille heureuse",
      "type": "family",
      "shared_calendar_id": null,
      "created_at": "2025-11-12T10:30:00Z",
      "updated_at": "2025-11-12T10:30:00Z"
    },
    "membership": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "group_id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "auth0|user123",
      "role_name": "owner",
      "importance": 100,
      "custom_permissions": {},
      "joined_at": "2025-11-12T10:30:00Z",
      "left_at": null
    }
  },
  "message": "Foyer créé avec succès"
}
```

**Response (400) - Erreur:**

```json
{
  "success": false,
  "error": "Failed to create group",
  "message": "Detailed error message"
}
```

**Response (401) - Non authentifié:**

```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "No JWT token provided"
}
```

## 📁 Fichiers modifiés

### 1. Schema SQL

- **Fichier:** `apps/backend/database/schema.sql`
- **Changement:** Ajout colonne `description TEXT` à la table `groups`

### 2. Migration SQL

- **Fichier:** `apps/backend/database/migrations/001_add_description_to_groups.sql`
- **Usage:** `psql < migrations/001_add_description_to_groups.sql`

### 3. Types TypeScript

- **Fichier:** `apps/backend/src/types/database.ts`
- **Interface modifiée:** `CreateGroupRequest`
- **Ajout:** Champ `description?: string`
- **Changement:** `type` est maintenant optionnel (default: 'family')

### 4. Controller

- **Fichier:** `apps/backend/src/controllers/group.controller.ts`
- **Fonction:** `createGroup()`
- **Améliorations:**
  - Ajout du champ `description` lors de l'insert
  - Retour du `membership` créé dans la response
  - Ajout du message de succès français

### 5. Routes (déjà existant)

- **Fichier:** `apps/backend/src/routes/group.routes.ts`
- **Route:** `POST /`
- **Middleware:** `verifyJWT`
- **Validation:** Schema Fastify avec `name` requis

### 6. Enregistrement routes (déjà existant)

- **Fichier:** `apps/backend/src/routes/index.ts`
- **Préfixe:** `/api/groups`

## 🧪 Tests

### Test manuel avec curl

```bash
# 1. Se connecter et obtenir un JWT token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# 2. Créer un foyer
curl -X POST http://localhost:3000/api/groups \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Famille Dupont",
    "description": "Notre famille heureuse",
    "type": "family"
  }'
```

### Test avec Postman

1. Importer la collection `TESTING_GUIDE.md`
2. Obtenir un JWT token via `/api/auth/login`
3. Envoyer POST `/api/groups` avec le body JSON

### Validation en base de données

```sql
-- Vérifier le groupe créé
SELECT * FROM groups WHERE name = 'Famille Dupont';

-- Vérifier le membership
SELECT m.*, p.display_name
FROM memberships m
JOIN profiles p ON p.id = m.user_id
WHERE m.group_id = '<group_id>' AND m.role_name = 'owner';
```

## 🔐 Permissions

- **Authentification requise:** Oui (JWT token)
- **Rôle requis:** Aucun (tout utilisateur authentifié peut créer un foyer)
- **Rôle attribué:** `owner` (maître de foyer) automatiquement au créateur

## 📝 Notes techniques

1. **Rollback automatique:** Si la création du membership échoue, le groupe est automatiquement supprimé (transaction atomique simulée)

2. **Type par défaut:** Si `type` n'est pas fourni, la valeur par défaut est `'family'`

3. **Description optionnelle:** Le champ `description` peut être `null` ou omis

4. **Importance:** Le créateur reçoit automatiquement `importance = 100` (niveau owner)

5. **RLS (Row Level Security):** Les policies Supabase garantissent que seuls les membres du groupe peuvent le voir/modifier

## 🎯 Prochaines étapes

- [ ] Tests unitaires pour `createGroup()`
- [ ] Tests d'intégration end-to-end
- [ ] Documentation Swagger/OpenAPI
- [ ] Implémenter US suivantes (inviter membres, etc.)

## 🐛 Problèmes connus

Aucun pour le moment.

## 📚 Références

- Documentation API: `apps/backend/docs/API_DOCUMENTATION.md`
- Schema SQL complet: `apps/backend/database/schema.sql`
- Guide de test: `apps/backend/docs/TESTING_GUIDE.md`
