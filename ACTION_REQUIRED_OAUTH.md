# 🔧 Action Requise : Configuration OAuth Google

## ⚠️ Problème Actuel

Vous êtes redirigé vers `http://localhost:3000/#access_token=...` au lieu de votre application mobile après l'authentification Google.

## ✅ Solution (3 étapes simples)

### Étape 1 : Supabase Dashboard (2 minutes)

1. Ouvrez : https://supabase.com/dashboard/project/iqimcokjruundhupcfyu/auth/url-configuration
2. Dans la section **Redirect URLs**, ajoutez :
   ```
   caeli://auth/callback
   ```
3. Cliquez sur **Save**

### Étape 2 : Google Cloud Console (2 minutes)

1. Ouvrez : https://console.cloud.google.com/apis/credentials
2. Cliquez sur votre **OAuth 2.0 Client ID**
3. Dans **Authorized redirect URIs**, assurez-vous que cette URL existe :
   ```
   https://iqimcokjruundhupcfyu.supabase.co/auth/v1/callback
   ```
4. Cliquez sur **Save**

### Étape 3 : Tester

1. Relancez votre application mobile :

   ```bash
   cd apps/mobile
   pnpm start
   ```

2. Testez la connexion Google à nouveau

## 📝 Ce qui a été modifié dans le code

✅ Création de `/apps/mobile/app/auth/callback.tsx` - Route pour gérer le callback OAuth
✅ Mise à jour de `/apps/mobile/services/auth.service.ts` - Utilisation de `OAUTH_REDIRECT_URL`
✅ Ajout de logs dans `/apps/backend/src/controllers/auth.controller.ts` - Pour déboguer la redirection

## 🐛 Déboguer

Si ça ne fonctionne toujours pas, regardez les logs du backend quand vous cliquez sur "Sign in with Google". Vous devriez voir :

```json
{
  "redirectUrl": "caeli://auth/callback",
  "finalRedirectUrl": "caeli://auth/callback",
  "msg": "Initiating Google OAuth"
}
```

Si `redirectUrl` est `undefined`, c'est que l'app mobile n'envoie pas le bon paramètre.

## 📚 Documentation complète

Voir `OAUTH_SETUP.md` pour plus de détails sur le flux OAuth complet.

## 🆘 Besoin d'aide ?

1. Vérifiez que votre `scheme` dans `app.json` est bien `"caeli"` ✅
2. Assurez-vous que le backend tourne sur le bon port (3000) ✅
3. Vérifiez que l'IP dans `/apps/mobile/lib/config.ts` est correcte ✅
