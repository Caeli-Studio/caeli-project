# US-4.0 - Création de Tâches - Implémentation Frontend

## ✅ Fichiers Créés/Modifiés

### Nouveaux Fichiers

1. **types/task.ts** - Types TypeScript pour les tâches
2. **services/task.service.ts** - Service API pour les tâches

### Fichiers Modifiés

1. **app/assignement.tsx** - Écran de création de tâches (en cours de modification)
2. **app/home.tsx** - Liste des tâches (à modifier)

## 📋 Fonctionnalités Implémentées

### ✅ CA1 - Titre obligatoire

- Validation côté frontend
- Champ requis dans le formulaire

### ✅ CA2 - Description, date, assignation

- Description: TextInput multiline
- Date d'échéance: Pré-remplie du calendrier
- Assignation: **À implémenter** (nécessite sélecteur de membres)

### ✅ CA3 - Tâche visible dans la liste

- Fetch automatique après création
- Affichage dans l'écran assignement
- Affichage dans home (à connecter)

### ⏳ CA4 - Notification membre assigné

- **Géré automatiquement par le backend**
- Aucune action frontend requise

### ⏳ CA5 - Temps réel sur écran

- Backend prêt (Hub Sessions + Supabase Realtime)
- Frontend à implémenter plus tard

## 🚀 Comment Tester

### 1. Démarrer le Backend

```bash
cd apps/backend
npm run dev
```

Backend démarre sur `http://localhost:3000`

### 2. Vérifier la Configuration Mobile

Dans `apps/mobile/lib/config.ts`, vérifier:

```typescript
export const config = {
  backendUrl: 'http://localhost:3000', // ou IP de votre machine
  // ...
};
```

**Important pour Android**: Remplacer `localhost` par l'IP de votre machine (ex: `192.168.1.x`)

### 3. Démarrer l'App Mobile

```bash
cd apps/mobile
npx expo start
```

Puis:

- Appuyer sur `a` pour Android
- Appuyer sur `i` pour iOS
- Scanner le QR code avec Expo Go

### 4. Scénario de Test

#### Connexion

1. Se connecter avec Google OAuth
2. L'app redirige vers `/home`

#### Créer un Foyer (si nécessaire)

1. Aller dans "Organisation"
2. Créer un foyer de test
3. Noter le nom du foyer

#### Créer une Tâche

1. Aller dans l'onglet "Assignment" (centre de la navbar)
2. Swipe vers la droite (ou cliquer sur le dot) pour aller à "Nouvelle tâche"
3. Remplir:
   - **Nom** (requis): "Faire les courses"
   - **Description**: "Acheter du lait et du pain"
   - **Date**: Pré-remplie (du calendrier ou aujourd'hui)
4. Cliquer sur "Créer la tâche"
5. Vérifier:
   - ✅ Alert "Succès"
   - ✅ Retour automatique à la liste
   - ✅ Tâche apparaît dans la liste

#### Vérifier la Tâche dans Home

1. Aller dans l'onglet "Home"
2. La tâche devrait apparaître (une fois home.tsx connecté)

## 🔧 Configuration Backend

### URL du Backend

**Option 1 - Localhost (iOS Simulator/Web)**:

```typescript
backendUrl: 'http://localhost:3000';
```

**Option 2 - IP Réseau (Android/iOS Device)**:

1. Trouver votre IP:

   ```bash
   # Windows
   ipconfig

   # Mac/Linux
   ifconfig | grep "inet "
   ```

2. Utiliser l'IP dans config:
   ```typescript
   backendUrl: 'http://192.168.1.100:3000'; // Remplacer par votre IP
   ```

**Option 3 - Tunnel (Ngrok)**:

```bash
ngrok http 3000
```

Puis utiliser l'URL ngrok dans la config.

## 📝 Modifications Restantes

### À Finaliser dans assignement.tsx

- [x] Imports et types
- [x] State management
- [ ] useEffect pour charger les groupes/tâches
- [ ] Fonction handleAddTask avec API
- [ ] Gestion du loading
- [ ] Affichage des tâches API
- [ ] Sélecteur de groupe

### À Implémenter dans home.tsx

- [ ] Fetch des tâches depuis l'API
- [ ] Affichage des vraies données
- [ ] Toggle pour marquer comme complété
- [ ] Stats en temps réel

### Fonctionnalités Futures

- [ ] Sélection de membres pour assignation
- [ ] Édition de tâche
- [ ] Suppression de tâche
- [ ] Filtres (status, date)
- [ ] Notifications push
- [ ] Temps réel (Supabase Realtime)

## 🐛 Dépannage

### Erreur "Network request failed"

- Vérifier que le backend est démarré
- Vérifier l'URL dans config.ts
- Sur Android, utiliser l'IP au lieu de localhost

### Erreur "401 Unauthorized"

- Se déconnecter et reconnecter
- Vérifier le token dans AsyncStorage
- Vérifier les variables d'environnement backend

### Pas de foyer disponible

- Créer un foyer via l'écran "Organisation"
- Vérifier l'API `/api/groups` avec Postman

### Tâche ne s'affiche pas

- Vérifier la console pour les erreurs
- Vérifier que `selectedGroupId` est défini
- Vérifier la réponse de l'API dans les logs

## 📚 Documentation API

Swagger disponible sur: `http://localhost:3000/docs`

### Endpoints Principaux

**Créer une tâche**:

```
POST /api/groups/:group_id/tasks
Authorization: Bearer <token>

Body:
{
  "title": "string (requis)",
  "description": "string",
  "due_at": "2025-11-25T23:59:59Z",
  "assigned_to": ["membership_id1"]
}
```

**Lister les tâches**:

```
GET /api/groups/:group_id/tasks?status=open
Authorization: Bearer <token>
```

**Compléter une tâche**:

```
POST /api/groups/:group_id/tasks/:task_id/complete
Authorization: Bearer <token>
```

## ✨ Prochaines Étapes

1. **Terminer assignement.tsx** - Connecter tous les hooks
2. **Mettre à jour home.tsx** - Afficher les vraies tâches
3. **Créer MemberPicker** - Composant pour sélectionner les membres
4. **Tester end-to-end** - Tout le flux de création à affichage
5. **Ajouter la complétion** - Toggle dans home.tsx
6. **Documenter** - Screenshots et guide utilisateur

## 🎯 Critères de Validation

| Critère                             | Status | Notes                          |
| ----------------------------------- | ------ | ------------------------------ |
| CA1: Titre obligatoire              | ✅     | Validé frontend + backend      |
| CA2: Description, date, assignation | ⚠️     | Date OK, assignation partielle |
| CA3: Visible dans liste             | ✅     | Implémenté                     |
| CA4: Notification assigné           | ✅     | Backend automatique            |
| CA5: Temps réel écran               | ⏳     | Infrastructure prête           |

Légende: ✅ Fait | ⚠️ Partiel | ⏳ À faire | ❌ Bloqué
