# Database Migrations

## 📋 Liste des Migrations

### 001_auto_create_profile_trigger.sql

**Objectif**: Créer automatiquement un profil pour chaque nouvel utilisateur qui s'inscrit.

**Problème résolu**: Quand un utilisateur se connecte avec Google OAuth, Supabase crée le user dans `auth.users` mais ne crée pas automatiquement un profil dans `public.profiles`. Cela causait l'erreur:

```
violates foreign key constraint "memberships_user_id_fkey"
Key (user_id)=(...) is not present in table "profiles"
```

**Ce que fait cette migration**:

- Crée une fonction `handle_new_user()` qui insère automatiquement un profil
- Crée un trigger `on_auth_user_created` qui s'exécute après chaque inscription
- Extrait le nom et l'avatar depuis les métadonnées Google OAuth

### 002_create_missing_profiles.sql

**Objectif**: Créer des profils pour les utilisateurs existants qui n'en ont pas.

**Ce que fait cette migration**:

- Trouve tous les users dans `auth.users` qui n'ont pas de profil
- Crée un profil pour chacun d'eux
- Utilise les métadonnées OAuth pour remplir le nom et l'avatar

---

## 🚀 Comment Appliquer les Migrations

### Option 1: Via Supabase Dashboard (Recommandé pour tester)

1. Va sur **[Supabase Dashboard](https://supabase.com/dashboard)**
2. Sélectionne ton projet
3. Va dans **SQL Editor**
4. Copie-colle le contenu de `001_auto_create_profile_trigger.sql`
5. Clique sur **Run**
6. Répète pour `002_create_missing_profiles.sql`
7. Vérifie dans **Table Editor** → **profiles** que ton profil a été créé

### Option 2: Via CLI Supabase (Production)

```bash
# Depuis le dossier backend
cd apps/backend

# Appliquer la migration du trigger
supabase db execute -f database/migrations/001_auto_create_profile_trigger.sql

# Créer les profils manquants
supabase db execute -f database/migrations/002_create_missing_profiles.sql
```

### Option 3: Via psql (Local)

```bash
# Connexion à la base locale
psql postgresql://postgres:postgres@localhost:54322/postgres

# Exécuter les migrations
\i apps/backend/database/migrations/001_auto_create_profile_trigger.sql
\i apps/backend/database/migrations/002_create_missing_profiles.sql
```

---

## ✅ Vérification

Après avoir appliqué les migrations, vérifie que tout fonctionne:

### 1. Vérifier le Trigger

```sql
-- Doit retourner 1 ligne
SELECT COUNT(*)
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';
```

### 2. Vérifier tes Profils

```sql
-- Doit montrer tous tes utilisateurs avec leur profil
SELECT
  au.id,
  au.email,
  p.display_name,
  p.avatar_url,
  p.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON p.user_id = au.id;
```

### 3. Tester la Création Automatique

1. Crée un nouveau compte de test via Google OAuth
2. Vérifie dans la table `profiles` qu'un profil a été créé automatiquement
3. Le `display_name` devrait être ton nom Google
4. L'`avatar_url` devrait être ta photo Google

---

## 🔧 Troubleshooting

### Erreur: "permission denied for schema auth"

**Solution**: Assure-toi que la fonction a `SECURITY DEFINER` (déjà dans le code).

### Erreur: "trigger already exists"

**Solution**: Le `DROP TRIGGER IF EXISTS` devrait gérer ça, mais si besoin:

```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
```

### Mon profil n'a toujours pas été créé

**Solution manuelle rapide**:

```sql
-- Remplace USER_ID et les valeurs par les tiennes
INSERT INTO public.profiles (user_id, display_name, created_at, updated_at)
VALUES (
  '127d48cf-7c45-4009-85ab-035426fbfa1b',  -- Ton user_id
  'Noah',  -- Ton nom
  NOW(),
  NOW()
);
```

---

## 📝 Notes Importantes

1. **Ces migrations sont idempotentes**: Tu peux les exécuter plusieurs fois sans problème
2. **Le trigger fonctionne pour tous les providers**: Google, GitHub, Email, etc.
3. **Les profils existants ne seront pas modifiés**: Seuls les nouveaux utilisateurs sans profil seront affectés

---

## 🎯 Résultat Attendu

Après ces migrations:

- ✅ Tous les utilisateurs existants ont un profil
- ✅ Les nouveaux utilisateurs auront automatiquement un profil
- ✅ Tu peux créer des foyers sans erreur
- ✅ Plus besoin de créer manuellement les profils
