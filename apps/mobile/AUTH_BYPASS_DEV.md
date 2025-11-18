# Bypass d'Authentification - Mode Développement

## 🎯 Objectif

Ce bypass permet de désactiver temporairement l'authentification pour faciliter le développement et les tests des User Stories sans dépendre du système d'authentification Google/Supabase.

## ⚙️ Configuration

### Activer le bypass

Dans le fichier `.env.development` :

```env
EXPO_PUBLIC_BYPASS_AUTH=true
```

### Désactiver le bypass

Pour revenir au mode normal avec authentification :

```env
EXPO_PUBLIC_BYPASS_AUTH=false
```

## 👤 Utilisateur Mock

Lorsque le bypass est activé, l'application utilise un utilisateur fictif :

- **ID**: `mock-user-dev-12345`
- **Email**: `dev@caeli.com`
- **Nom**: `Dev User`
- **Avatar**: `null`

## 🚀 Utilisation

1. **Démarrer l'application**

   ```bash
   cd apps/mobile
   pnpm dev
   ```

2. **Vérification**
   - Vous verrez dans la console : `🚨 AUTH BYPASS ENABLED - Development mode`
   - L'application vous connectera automatiquement avec l'utilisateur mock
   - Pas besoin de passer par l'écran de connexion Google

## ⚠️ Important

- **NE PAS COMMITER** avec `BYPASS_AUTH=true` en production
- Ce mode est **UNIQUEMENT pour le développement local**
- Désactivez le bypass avant de tester l'authentification réelle
- Pensez à réactiver l'authentification normale une fois vos US terminées

## 🔄 Retour à l'authentification normale

1. Modifier `.env.development` :

   ```env
   EXPO_PUBLIC_BYPASS_AUTH=false
   ```

2. Redémarrer l'application :
   ```bash
   pnpm dev
   ```

## 📝 Fichiers modifiés

- `apps/mobile/.env.development` - Configuration du bypass
- `apps/mobile/contexts/AuthContext.tsx` - Logique de bypass dans le contexte d'authentification
