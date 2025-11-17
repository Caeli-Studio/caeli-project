# OAuth Authentication - Android vs iOS

## Problème identifié

L'authentification Google OAuth fonctionne sur **iPhone** mais pas sur **Samsung (Android)**. Cela est dû aux différences de gestion des deep links entre les deux plateformes.

## Différences clés

### iOS (iPhone) ✅

- Les schémas personnalisés (`caeli://`) sont automatiquement reconnus
- Configuration simple via `app.json` avec la clé `scheme`
- Pas besoin de vérification de domaine
- Le callback OAuth fonctionne directement avec `caeli://auth/callback`

### Android (Samsung) ⚠️

- Les schémas personnalisés nécessitent une configuration plus complexe
- Android préfère les **App Links** (HTTPS) avec vérification de domaine
- Le schéma `caeli://` seul peut ne pas être reconnu par le navigateur OAuth
- Nécessite l'utilisation d'un proxy ou d'une URL de redirection HTTPS

## Solution implémentée

### 1. Utilisation de `expo-auth-session`

Nous utilisons maintenant `AuthSession.makeRedirectUri()` qui génère automatiquement la bonne URL de redirection selon la plateforme :

```typescript
const redirectUri = AuthSession.makeRedirectUri({
  scheme: 'caeli',
  path: 'auth/callback',
});
```

**Résultat :**

- **iOS** : `caeli://auth/callback`
- **Android** : `https://auth.expo.io/@your-username/caeli/auth/callback` (proxy Expo)

### 2. Configuration dans `app.json`

Le fichier `app.json` contient la configuration Android avec `intentFilters` :

```json
{
  "android": {
    "intentFilters": [
      {
        "action": "VIEW",
        "autoVerify": true,
        "data": [
          {
            "scheme": "caeli"
          }
        ],
        "category": ["BROWSABLE", "DEFAULT"]
      }
    ]
  }
}
```

### 3. Mise à jour du backend

Le backend doit accepter les deux types d'URL de redirection :

- `caeli://auth/callback` (iOS)
- L'URL proxy Expo (Android)

Dans Google Cloud Console, ajoutez les deux URL dans **Authorized redirect URIs** :

```
caeli://auth/callback
https://auth.expo.io/@your-username/caeli/auth/callback
http://192.168.0.5:3000/api/auth/callback
http://localhost:3000/api/auth/callback
```

### 4. Debug amélioré

Des logs de debug ont été ajoutés pour diagnostiquer les problèmes :

```typescript
console.log('[OAuth Debug] Platform:', Platform.OS);
console.log('[OAuth Debug] Redirect URI:', redirectUri);
console.log('[OAuth Debug] Result type:', result.type);
console.log('[OAuth Debug] Parsed params:', Object.keys(params));
```

## Test sur Samsung

Pour tester sur votre appareil Samsung :

```powershell
cd C:\projetIntegration\caeli-project\apps\mobile
pnpm dev
```

1. Scannez le QR code avec l'app Expo Go
2. Essayez de vous connecter avec Google
3. Vérifiez les logs dans Metro Bundler (terminal)
4. Le callback devrait maintenant fonctionner correctement

## Troubleshooting

### Si ça ne fonctionne toujours pas sur Android :

1. **Vérifiez les logs Metro** : Cherchez `[OAuth Debug]` pour voir les URLs utilisées
2. **Vérifiez Google Cloud Console** : Assurez-vous que l'URL de redirection Android (proxy Expo) est autorisée
3. **Testez avec un build standalone** : Expo Go peut avoir des limitations, testez avec un build EAS
4. **Vérifiez la connectivité réseau** : Le téléphone Samsung doit être sur le même réseau que votre PC (`192.168.0.5`)

### Commandes de debug Android :

```powershell
# Voir les logs Android en temps réel
adb logcat *:S ReactNative:V ReactNativeJS:V

# Vérifier les deep links configurés
adb shell dumpsys package com.caeli.app | grep -A 10 "intent-filter"
```

## Alternative : Build Production

Pour un environnement de production, utilisez **EAS Build** avec un build standalone :

```powershell
# Installer EAS CLI
npm install -g eas-cli

# Login
eas login

# Configurer le projet
eas build:configure

# Build Android
eas build --platform android --profile development
```

Avec un build standalone, les deep links Android fonctionnent de manière plus fiable.

## Ressources

- [Expo AuthSession Documentation](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [Android App Links](https://developer.android.com/training/app-links)
- [iOS Universal Links](https://developer.apple.com/ios/universal-links/)
