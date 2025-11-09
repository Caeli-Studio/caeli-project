#!/bin/bash

# Script d'installation et de configuration des tests d'API
# Usage: ./setup-tests.sh

set -e

echo "🧪 Configuration des tests d'API Backend Caeli"
echo "=============================================="
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: package.json non trouvé. Assurez-vous d'être à la racine du projet."
    exit 1
fi

# Installer les dépendances de test
echo "📦 Installation des dépendances de test..."
if command -v pnpm &> /dev/null; then
    pnpm add -D vitest @vitest/ui c8 @types/node
    echo "✅ Dépendances installées avec pnpm"
elif command -v npm &> /dev/null; then
    npm install --save-dev vitest @vitest/ui c8 @types/node
    echo "✅ Dépendances installées avec npm"
else
    echo "❌ Erreur: ni pnpm ni npm trouvé. Veuillez installer l'un des deux."
    exit 1
fi

# Créer le dossier tests s'il n'existe pas
echo ""
echo "📁 Création de la structure des tests..."
mkdir -p tests

# Copier les fichiers de test
echo "📝 Copie des fichiers de test..."
if [ -d "/mnt/user-data/outputs/tests" ]; then
    cp -r /mnt/user-data/outputs/tests/* tests/
    echo "✅ Fichiers de test copiés"
else
    echo "⚠️  Dossier source non trouvé. Veuillez copier manuellement les fichiers."
fi

# Copier le fichier de configuration Vitest
if [ -f "/mnt/user-data/outputs/vitest.config.ts" ]; then
    cp /mnt/user-data/outputs/vitest.config.ts .
    echo "✅ Configuration Vitest copiée"
fi

# Créer le fichier .env.test s'il n'existe pas
if [ ! -f ".env.test" ]; then
    echo ""
    echo "⚙️  Configuration de l'environnement de test..."

    if [ -f "/mnt/user-data/outputs/.env.test.example" ]; then
        cp /mnt/user-data/outputs/.env.test.example .env.test
        echo "✅ Fichier .env.test créé depuis l'exemple"
        echo ""
        echo "⚠️  IMPORTANT: Vous devez éditer .env.test et remplir:"
        echo "   - SUPABASE_URL"
        echo "   - SUPABASE_ANON_KEY"
        echo "   - SUPABASE_SERVICE_ROLE_KEY"
    fi
else
    echo "ℹ️  .env.test existe déjà, non modifié"
fi

# Ajouter les scripts dans package.json (si pas déjà présents)
echo ""
echo "📝 Vérification des scripts npm..."

if ! grep -q '"test"' package.json; then
    echo "⚠️  Les scripts de test ne sont pas dans package.json"
    echo "   Ajoutez manuellement les scripts suivants:"
    echo ""
    echo '  "scripts": {'
    echo '    "test": "vitest run",'
    echo '    "test:watch": "vitest watch",'
    echo '    "test:ui": "vitest --ui",'
    echo '    "test:coverage": "vitest run --coverage"'
    echo '  }'
else
    echo "✅ Scripts de test déjà configurés"
fi

# Vérifier la configuration Supabase
echo ""
echo "🔍 Vérification de Supabase..."

if command -v supabase &> /dev/null; then
    echo "✅ CLI Supabase installé"

    if supabase status &> /dev/null; then
        echo "✅ Supabase est en cours d'exécution"
    else
        echo "⚠️  Supabase n'est pas démarré"
        echo "   Lancez: supabase start"
    fi
else
    echo "⚠️  CLI Supabase non installé"
    echo "   Installation: npm install -g supabase"
    echo "   Plus d'infos: https://supabase.com/docs/guides/cli"
fi

# Résumé
echo ""
echo "=============================================="
echo "✨ Configuration terminée!"
echo "=============================================="
echo ""
echo "📚 Prochaines étapes:"
echo ""
echo "1. Éditer .env.test avec vos clés Supabase"
echo "   Si vous utilisez Supabase local:"
echo "   - supabase start"
echo "   - supabase status (pour obtenir les clés)"
echo ""
echo "2. Lancer les tests:"
echo "   pnpm test              # Tous les tests"
echo "   pnpm test:watch        # Mode watch"
echo "   pnpm test:ui           # Interface UI"
echo "   pnpm test:coverage     # Avec couverture"
echo ""
echo "3. Consulter la documentation:"
echo "   - README_TESTS.md      # Guide principal"
echo "   - TESTING_GUIDE.md     # Guide détaillé"
echo "   - TEST_SUMMARY.md      # Résumé des tests"
echo ""
echo "🎉 Bonne chance avec vos tests!"