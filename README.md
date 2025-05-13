# GaussPiVote

Ce projet est une application de vote décentralisée utilisant Solidity pour les contrats intelligents et Next.js pour l'interface utilisateur.

# Contributeurs
Elyes Aïssat // Mohamed Lam // Mattéo Padou

# Déploiement
- Lien : https://gauss-pi-vote.vercel.app
- Video : https://www.youtube.com/watch?v=xxQ9VnXfPc0&ab_channel=Matt%C3%A9oPadou

## Structure du projet

- `frontend/` : Contient l'application Next.js pour l'interface utilisateur.
- `backend/` : Contient les contrats intelligents Solidity et les scripts de déploiement.

## Prérequis

- Node.js
- npm ou yarn
- Hardhat

## Installation

Clonez le dépôt et installez les dépendances pour le frontend et le backend.

```bash
git clone https://github.com/votre-repo/gausspivote.git
cd gausspivote

# Installer les dépendances du frontend
cd frontend
npm install

# Installer les dépendances du backend
cd ../backend
npm install
```

## Démarrage

### Frontend

Pour démarrer le serveur de développement Next.js :

```bash
cd frontend
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) avec votre navigateur pour voir le résultat.

### Backend

Pour déployer les contrats intelligents avec Hardhat :

```bash
cd backend
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

## Déploiement

### Frontend

Le moyen le plus simple de déployer votre application Next.js est d'utiliser la [plateforme Vercel](https://vercel.com/).

### Backend

Pour déployer les contrats intelligents sur un réseau de test ou le réseau principal, modifiez les configurations dans `hardhat.config.js` et utilisez les commandes Hardhat appropriées.

## Ressources

- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Hardhat](https://hardhat.org/getting-started/)
- [Video Youtube explicative](https://www.youtube.com/watch?v=xxQ9VnXfPc0&ab_channel=Matt%C3%A9oPadou)

## Auteurs

* **Mattéo** _alias_ [@vulzyun](https://github.com/vulzyun)
* **Mohamed**  _alias_ [@GRE4TT](https://github.com/GRE4TT)
* **Elyes** _alias_ [@skibrr](https://github.com/Skibrr)


  
[![forthebadge](https://forthebadge.com/images/featured/featured-built-with-love.svg)](https://forthebadge.com)
