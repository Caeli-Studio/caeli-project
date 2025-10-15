# BOM – Choix des composants électroniques

## 1. Objectif

Fournir une nomenclature (BOM) minimale, traçable et versionnée pour l’US _Choix des composants électroniques_, afin de préparer commande, prototypage et vérifications de compatibilité.

## 2. Portée

Inclut: carte principale, alimentation, affichage, capteurs, câblage, éléments de fixation, protections passives, alternatives directes.
Exclut (stade actuel): boîtier final, documentation électrique détaillée (schémas), dissipation thermique avancée.

## 3. Règles de compatibilité (résumé)

- Logique 3,3 V côté GPIO; alimentation 5 V stable (≥3 A).
- Écran tactile HDMI alimenté séparément si courant >800 mA.
- PIR HC‑SR501: sortie ≈3,3 V compatible GPIO Pi; ajouter découplage 100 nF près de Vcc/GND.
- Masse commune entre tous les sous‑ensembles.

## 4. Marges et sûreté

- Budget courant global calculé avec 20–30 % de marge.
- Découplage local (100 nF) pour capteurs sensibles.
- Alternatives pré‑validées listées pour limiter le risque de rupture.

## 5. Fichier `components.csv`

Structure tabulaire destinée à:

- Centraliser références, quantités, interfaces, paramètres électriques.
- Calculer coût total / composant et comparer alternatives.
- Automatiser plus tard des scripts (coût, disponibilité, alertes limites de puissance).
  Colonnes recommandées (ordre actuel):
  `Category,Name,MPN/Ref,Qty,Function,Interface,Voltage(V),Current(mA),Notes,Alt 1,Alt 2,Unit Cost(EUR),Supplier`

## 6. Usage

1. Ajouter ou modifier une ligne par composant dans `components.csv`.
2. Garder les unités homogènes (Voltage(V), Current(mA)).
3. Documenter une note courte (compatibilité, besoin alimentation dédiée, etc.).
4. Ne pas supprimer une ligne sans justification dans l’historique de commit.

## 7. Workflow de mise à jour

| Étape       | Action                                    | Responsable     |
| ----------- | ----------------------------------------- | --------------- |
| Proposition | Ajout ligne / modif dans branche dédiée   | Contributeur    |
| Revue       | Vérification électrique + cohérence coûts | Pair review     |
| Validation  | Merge vers `main` après approbation       | Maintainer      |
| Suivi       | Ajustements coûts / dispo fournisseurs    | Équipe hardware |

## 8. Critères de validation (Definition of Done BOM v1)

- 100 % des composants critiques listés (compute, alimentation, I/O, capteurs).
- Alternatives disponibles pour chaque élément critique.
- Paramètres électriques principaux complétés (Voltage, Current ou justification « - » si N/A).
- Coût unitaire estimé renseigné ou marqué `TBD`.
- Aucune incohérence (ex: tension hors plage Pi).

## 9. Évolution attendue

- V2: ajout dissipation thermique, boîtier, sécurités (fusible, TVS).
- V3: script d’agrégation coûts + export JSON.
- V4: intégration CI pour alerte dépassement budget.

## 10. Traçabilité

- User story source: _Choix des composants électroniques_.
- Chaque changement justifié dans le message de commit (mot‑clé `BOM:` recommandé).

## 11. Références rapides

- Datasheets: liens à ajouter dans une future colonne (`DocsURL`).
- Wiki interne: section _Hardware/BOM_ (à créer si absent).

## 12. Contenu actuel (extrait synthétique)

- Contrôleur: Raspberry Pi 4 4 GB (alts: Pi 5, Pi 4 8 GB).
- Affichage: Écran HDMI tactile 7″ (alts: 10.1″, Elecrow/Seeed 7″).
- Détection: PIR HC‑SR501 (alts: AM312, SR602).
- Alimentation: 5 V 3 A officielle (alts: 5 V 4–5 A, USB PD).
- Protection / intégrité: condensateurs 100 nF.

## 13. Prochaines actions suggérées

- Compléter coût exact fournisseurs manquants.
- Ajouter colonne `Lifecycle` (Active / NRND / EOL).
- Ajouter colonne `DocsURL`.
