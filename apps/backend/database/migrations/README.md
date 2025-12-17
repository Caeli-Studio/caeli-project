# Database Migrations

This directory contains SQL migration files for the Caeli project's Supabase database.

## 📋 Liste des Migrations

### `apply_all.sql`

**Fichier principal** - Exécute ce fichier dans l'éditeur SQL de Supabase pour appliquer toutes les migrations d'un coup.

Ce fichier inclut:

- Migration 001: Trigger de création automatique des profils
- Migration 002: Création des profils manquants
- Migration 003: Système de rôles personnalisables

### Migrations Individuelles

#### `001_auto_create_profile_trigger.sql`

**Objectif**: Créer automatiquement un profil pour chaque nouvel utilisateur qui s'inscrit.

**Problème résolu**: Quand un utilisateur se connecte avec Google OAuth, Supabase crée le user dans `auth.users` mais ne crée pas automatiquement un profil dans `public.profiles`.

**Ce que fait cette migration**:

- Crée une fonction `handle_new_user()` qui insère automatiquement un profil
- Crée un trigger `on_auth_user_created` qui s'exécute après chaque inscription
- Extrait le nom et l'avatar depuis les métadonnées OAuth

#### `002_create_missing_profiles.sql` / `002_fix_memberships_profiles_fk.sql`

**Objectif**: Créer des profils pour les utilisateurs existants qui n'en ont pas.

**Ce que fait cette migration**:

- Trouve tous les users dans `auth.users` qui n'ont pas de profil
- Crée un profil pour chacun d'eux
- Utilise les métadonnées OAuth pour remplir le nom et l'avatar

#### `003_create_group_roles_system.sql`

**Système de rôles personnalisables** - Crée l'infrastructure complète pour les rôles:

- Crée la table `group_roles`
- Ajoute la colonne `role_id` à la table `memberships`
- Crée les 5 rôles par défaut (owner, admin, member, child, guest) pour tous les groupes
- Crée les triggers pour créer automatiquement les rôles pour les nouveaux groupes
- Migre les memberships existants pour utiliser `role_id`

---

## 🏗️ Architecture: Database vs Backend

Ce projet sépare clairement les responsabilités entre la base de données et le backend:

### 🗄️ Database (PostgreSQL/Supabase)

- **Structure des données** (tables, colonnes, types)
- **Intégrité des données** (contraintes, foreign keys, UNIQUE)
- **Automatisations critiques** (triggers pour créer profils/rôles)
- **Performance** (indexes)

### ⚙️ Backend API (Node.js/Express)

- **Logique métier** (validation complexe, règles business)
- **Permissions** (qui peut faire quoi)
- **Transformation des données** (formatter les réponses)
- **Intégrations** (emails, notifications, services externes)

**Pas de RLS (Row Level Security)** - Toutes les requêtes passent par le backend qui valide les permissions.

---

## 🚀 Comment Appliquer les Migrations

### Option 1: Appliquer Toutes les Migrations (Recommandé)

1. Va sur le **Dashboard Supabase**
2. Navigue vers **SQL Editor**
3. Copie le contenu de [apply_all.sql](./apply_all.sql)
4. Colle dans l'éditeur SQL
5. Clique sur **Run**

Le script va:

- Exécuter toutes les migrations dans l'ordre
- Afficher les messages de progression
- Montrer un résumé de vérification final
- Mettre en évidence les problèmes avec des warnings

### Option 2: Appliquer les Migrations Individuellement

Si tu veux appliquer les migrations une par une (par exemple pour déboguer):

1. Ouvre l'éditeur SQL Supabase
2. Copie le contenu de la migration que tu veux appliquer
3. Colle et exécute

**L'ordre est important!** Applique les migrations dans cet ordre:

1. `001_auto_create_profile_trigger.sql`
2. `002_create_missing_profiles.sql`
3. `003_create_group_roles_system.sql`

---

## 📖 Détails de la Migration 003: Système de Rôles

### Ce Qu'elle Crée

#### Table `group_roles`

Stocke tous les rôles (système + personnalisés) pour chaque groupe.

**Colonnes:**

- `id` (UUID) - Clé primaire
- `group_id` (UUID) - Clé étrangère vers `groups`
- `name` (VARCHAR) - Nom technique (ex: "owner", "chef-cuisinier")
- `display_name` (VARCHAR) - Nom affiché (ex: "Maître de foyer", "Chef cuisinier")
- `description` (TEXT) - Description optionnelle
- `is_default` (BOOLEAN) - `true` pour les rôles système, `false` pour les rôles personnalisés
- `importance` (INTEGER) - Ordre d'affichage et priorité (0-100)
- `permissions` (JSONB) - Flags de permissions:
  - `can_create_tasks` - Créer des tâches
  - `can_assign_tasks` - Assigner des tâches
  - `can_delete_tasks` - Supprimer des tâches
  - `can_manage_members` - Gérer les membres
  - `can_edit_group` - Modifier le foyer
  - `can_view_audit_log` - Voir l'historique
  - `can_connect_calendar` - Connecter un calendrier
  - `can_manage_hub` - Gérer le hub
  - `can_manage_roles` - Gérer les rôles

#### Rôles Par Défaut Créés Automatiquement

Pour **chaque groupe** (existant et nouveau), 5 rôles par défaut sont créés:

1. **Owner** (`owner`)
   - Importance: 100
   - Toutes les permissions: ✅
   - Ne peut pas être supprimé ou modifié

2. **Admin** (`admin`)
   - Importance: 80
   - Toutes les permissions sauf `can_manage_roles`
   - Ne peut pas être supprimé ou modifié

3. **Member** (`member`)
   - Importance: 50
   - Peut créer et assigner des tâches
   - Ne peut pas être supprimé ou modifié

4. **Child** (`child`)
   - Importance: 30
   - Aucune permission (lecture seule)
   - Ne peut pas être supprimé ou modifié

5. **Guest** (`guest`)
   - Importance: 10
   - Aucune permission (lecture seule)
   - Ne peut pas être supprimé ou modifié

#### Triggers Automatiques

**Trigger `on_group_created`:**
Crée automatiquement les 5 rôles par défaut quand un nouveau groupe est créé.

#### Sécurité

**Note**: Ce projet n'utilise pas Row Level Security (RLS). Toute la logique de permissions est gérée dans le backend API Node.js/Express.

Les permissions sont validées dans le backend avant chaque opération:

- **Voir les rôles**: Vérifié dans `GET /api/groups/:group_id/roles`
- **Créer un rôle**: Vérifié dans `POST /api/groups/:group_id/roles` (nécessite `can_manage_roles`)
- **Modifier un rôle**: Vérifié dans `PUT /api/groups/:group_id/roles/:role_id` (nécessite `can_manage_roles` + rôle non-système)
- **Supprimer un rôle**: Vérifié dans `DELETE /api/groups/:group_id/roles/:role_id` (nécessite `can_manage_roles` + rôle non-système + aucun membre)

### Ce Qu'elle Modifie

#### Table `memberships`

Ajoute une nouvelle colonne:

- `role_id` (UUID, nullable) - Clé étrangère vers `group_roles.id`

**Compatibilité**: La colonne `role_name` est conservée, donc le code existant continue de fonctionner.

### Migration des Données

Le script de migration:

1. Crée les rôles par défaut pour **tous les groupes existants**
2. Met à jour tous les memberships existants pour définir leur `role_id` basé sur leur `role_name`

### Vérification

Après avoir exécuté la migration, tu verras un résultat comme:

```
====================================
All Migrations Complete!
====================================
Users: 5
Profiles: 5
Groups: 14
Roles: 70
Memberships: 28
Memberships with role_id: 28

✅ All users have profiles!
✅ All groups have 5 default roles!
✅ All memberships have role_id!
```

Si tu vois des warnings (⚠️), investigate le problème mentionné.

---

## 🔧 Troubleshooting

### Issue: Policies not working

Si tu actives RLS plus tard, assure-toi d'activer RLS sur la table:

```sql
ALTER TABLE public.group_roles ENABLE ROW LEVEL SECURITY;
```

### Issue: New groups don't have default roles

Vérifie que le trigger existe:

```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_group_created';
```

Si manquant, exécute la migration 003 à nouveau.

### Issue: Memberships missing role_id

Exécute cette requête pour mettre à jour les memberships:

```sql
DO $$
DECLARE
  v_membership RECORD;
  v_role_id UUID;
BEGIN
  FOR v_membership IN
    SELECT id, group_id, role_name
    FROM public.memberships
    WHERE role_id IS NULL
  LOOP
    SELECT id INTO v_role_id
    FROM public.group_roles
    WHERE group_id = v_membership.group_id
      AND name = v_membership.role_name
    LIMIT 1;

    IF v_role_id IS NOT NULL THEN
      UPDATE public.memberships
      SET role_id = v_role_id
      WHERE id = v_membership.id;
    END IF;
  END LOOP;
END $$;
```

---

## 📚 Ressources

Pour plus d'informations:

- Backend API: [apps/backend/src/routes/roles.ts](../../src/routes/roles.ts)
- Mobile types: [apps/mobile/types/role.ts](../../../mobile/types/role.ts)
- Mobile service: [apps/mobile/services/role.service.ts](../../../mobile/services/role.service.ts)
- Écran de gestion: [apps/mobile/app/household-roles.tsx](../../../mobile/app/household-roles.tsx)
