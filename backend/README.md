# Backend - GaussPiVote

Ce dossier contient les contrats intelligents Solidity et les scripts de déploiement utilisant Hardhat.

## Prérequis

- Node.js
- npm ou yarn
- Hardhat

## Installation

Installez les dépendances :

```bash
npm install
```

## Démarrage

Pour démarrer un nœud local Hardhat et déployer les contrats :

```bash
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

## Tests

Pour exécuter les tests :

```bash
npx hardhat test
```

## Déploiement

Pour déployer les contrats sur un réseau de test ou le réseau principal, modifiez les configurations dans `hardhat.config.js` et utilisez les commandes Hardhat appropriées.

## Ressources

- [Documentation Hardhat](https://hardhat.org/getting-started/)
