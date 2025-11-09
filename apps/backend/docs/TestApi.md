# 🧪 Tests API - Caeli Backend

Documentation complète des tests de l'API Caeli.

---

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Structure des tests](#structure-des-tests)
- [Installation et configuration](#installation-et-configuration)
- [Lancer les tests](#lancer-les-tests)
- [Comprendre les tests](#comprendre-les-tests)
- [Ajouter de nouveaux tests](#ajouter-de-nouveaux-tests)
- [Dépannage](#dépannage)

---

## 🎯 Vue d'ensemble

Les tests de l'API Caeli sont conçus pour être **simples, rapides et efficaces**. Ils vérifient que :

- ✅ Les routes existent et répondent correctement
- ✅ L'authentification fonctionne (rejette les requêtes non authentifiées)
- ✅ Les validations de base sont en place
- ✅ Aucune erreur serveur (500) ne se produit

### 📊 Statistiques

```
Total de tests : 27
Temps d'exécution : ~2 secondes
Fichiers de test : 2
```

---

## 📁 Structure des tests

```
tests/
├── helpers/
│   └── auth.helper.ts          # Helper pour créer des tokens de test
├── api.basic.test.ts           # Tests basiques de toutes les routes (14 tests)
├── health.test.ts              # Tests de santé de l'API (13 tests)
└── setup.ts                    # Configuration globale des tests
```

### 🔧 Fichiers de configuration

```
src/
├── app.ts                      # App Fastify exportable pour les tests
└── index.ts                    # Point d'entrée qui démarre le serveur
```

---

## ⚙️ Installation et configuration

### 1️⃣ Dépendances requises

Les dépendances suivantes sont déjà installées :

```bash
pnpm add -D vitest supertest @types/supertest jsonwebtoken @types/jsonwebtoken
```

### 2️⃣ Variables d'environnement

Créer un fichier `.env.test` à la racine du projet backend :

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Node Environment
NODE_ENV=test

# JWT Secret (pour les tests)
JWT_SECRET=test-secret-key
```

### 3️⃣ Configuration Vitest

Le fichier `vitest.config.ts` est déjà configuré pour :

- Charger les variables d'environnement depuis `.env.test`
- Utiliser Node comme environnement de test
- Configurer les timeouts appropriés

---

## 🚀 Lancer les tests

### Commande de base

```bash
pnpm test
```

### Commandes avancées

```bash
# Lancer les tests en mode watch (développement)
pnpm test:watch

# Lancer les tests avec coverage
pnpm test:coverage

# Lancer un fichier de test spécifique
pnpm test tests/api.basic.test.ts

# Lancer les tests en mode verbose
pnpm test -- --reporter=verbose
```

### Résultat attendu

```
✓ tests/health.test.ts (13)
✓ tests/api.basic.test.ts (14)

Test Files  2 passed (2)
Tests  27 passed (27)
Duration  2.35s
```

---

## 🔍 Comprendre les tests

### Structure d'un test

```typescript
describe('Nom du groupe de tests', () => {
  // Configuration avant tous les tests
  beforeAll(async () => {
    // Initialisation (ex: créer l'app, obtenir un token)
  });

  // Nettoyage après tous les tests
  afterAll(async () => {
    // Fermeture des connexions
  });

  // Un test individuel
  it('devrait faire quelque chose', async () => {
    const response = await request(app.server)
      .get('/api/endpoint')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
  });
});
```

### Tests de santé (health.test.ts)

Ces tests vérifient que l'API est opérationnelle :

| Test                | Description                       | Endpoint                             |
| ------------------- | --------------------------------- | ------------------------------------ |
| Health check        | Vérifie que l'API répond          | `GET /api/health`                    |
| Liveness            | Vérifie que le serveur est vivant | `GET /api/health/live`               |
| Readiness           | Vérifie que l'API est prête       | `GET /api/health/ready`              |
| Supabase connection | Vérifie la connexion à Supabase   | `GET /api/health/supabase`           |
| Supabase details    | Obtient les détails de connexion  | `GET /api/health/supabase/details`   |
| Supabase benchmark  | Benchmark des requêtes Supabase   | `GET /api/health/supabase/benchmark` |

### Tests basiques (api.basic.test.ts)

Ces tests vérifient les fonctionnalités essentielles :

#### 🔐 Authentication (3 tests)

- OAuth Google retourne une URL
- Les requêtes sans token sont rejetées (401)
- La déconnexion nécessite l'authentification

#### 👤 Profile (4 tests)

- GET sans auth → 401
- PUT sans auth → 401
- POST sans display_name → 400 ou 401
- POST sans pin → 400 ou 401

#### 👥 Groups (3 tests)

- POST sans auth → 401
- POST sans name → 400 ou 401
- GET sans auth → 401

#### 🔔 Notifications (1 test)

- GET sans auth → 401

---

## ➕ Ajouter de nouveaux tests

### Exemple : Tester une nouvelle route

```typescript
// Dans tests/api.basic.test.ts

describe('Ma nouvelle fonctionnalité', () => {
  it('devrait créer une ressource', async () => {
    const response = await request(app.server)
      .post('/api/ma-route')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        name: 'Test',
        description: 'Description de test',
      });

    // Vérifier le code de statut
    expect(response.statusCode).toBe(201);

    // Vérifier la réponse
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('success', true);
    expect(body.data).toHaveProperty('name', 'Test');
  });

  it('devrait rejeter sans authentification', async () => {
    const response = await request(app.server)
      .post('/api/ma-route')
      .send({ name: 'Test' });

    expect(response.statusCode).toBe(401);
  });
});
```

### Bonnes pratiques

1. **Un test = une vérification** : Chaque test doit vérifier une seule chose
2. **Noms descriptifs** : `devrait rejeter sans token` plutôt que `test 1`
3. **Codes de statut flexibles** : Accepter plusieurs codes valides avec `expect([200, 201]).toContain(response.statusCode)`
4. **Nettoyage** : Toujours nettoyer les ressources créées
5. **Indépendance** : Les tests ne doivent pas dépendre les uns des autres

---

## 🐛 Dépannage

### Problème : Tests échouent avec "Invalid CORS origin option"

**Solution** : Vérifier que `src/app.ts` a la bonne configuration CORS :

```typescript
await app.register(cors, {
  origin:
    IS_DEVELOPMENT || NODE_ENV === 'test'
      ? true
      : process.env.ALLOWED_ORIGINS?.split(',') || [],
  credentials: true,
});
```

### Problème : "Cannot find module '../src/app'"

**Solution** : S'assurer que `src/app.ts` existe et exporte correctement :

```typescript
// src/app.ts
export async function createApp() {
  // ... configuration
  return app;
}
export default createApp;
```

### Problème : Tests timeout

**Solution** : Augmenter le timeout dans `vitest.config.ts` :

```typescript
export default defineConfig({
  test: {
    testTimeout: 10000, // 10 secondes
  },
});
```

### Problème : "Could not find the table 'public.users'"

**⚠️ Warning normal** : Cet avertissement n'empêche pas les tests de fonctionner. Il indique simplement que Supabase met en cache le schéma.

### Problème : Token invalide dans les tests

**Solution** : Le token est généré automatiquement dans `beforeAll`. Si problème, vérifier `tests/helpers/auth.helper.ts` :

```typescript
const secret = process.env.JWT_SECRET || 'test-secret-key';
const token = jwt.sign(payload, secret);
```

---

## 📈 Évolution future

### Tests à ajouter (optionnel)

Si besoin de tests plus détaillés à l'avenir :

- **Tests d'intégration** : Scénarios complets de bout en bout
- **Tests de charge** : Vérifier les performances sous charge
- **Tests de sécurité** : Vérifier les vulnérabilités (XSS, SQL injection, etc.)
- **Tests E2E** : Tests avec vraies données et vrais utilisateurs

### Maintenir les tests simples

**Philosophie** : Les tests doivent être **utiles sans être bloquants**. Si un test prend trop de temps ou est trop complexe, le simplifier ou le supprimer.

---

## 📚 Ressources

- [Documentation Vitest](https://vitest.dev/)
- [Documentation Supertest](https://github.com/visionmedia/supertest)
- [Documentation Fastify Testing](https://fastify.dev/docs/latest/Guides/Testing/)
- [Best practices pour les tests d'API](https://testfully.io/blog/api-testing-best-practices/)

---

## ✅ Checklist avant de commiter

- [ ] `pnpm test` passe avec succès
- [ ] Aucune erreur 500 dans les logs
- [ ] Les nouveaux tests suivent les conventions existantes
- [ ] Les tests sont rapides (< 5 secondes)
- [ ] Le README est à jour si nécessaire

---

## 🎯 Conclusion

Les tests de Caeli sont conçus pour être **pragmatiques** : ils vérifient l'essentiel sans perdre de temps sur des détails. Cette approche permet de :

- ✅ Détecter les régressions rapidement
- ✅ Garder une base de code stable
- ✅ Ne pas ralentir le développement
- ✅ Avoir confiance dans les déploiements

**Bon développement ! 🚀**
