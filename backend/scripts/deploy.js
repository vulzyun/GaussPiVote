const hre = require("hardhat");

async function deployVotingContract() {
  try {
    console.log("Lancement du déploiement du contrat Voting...");

    // Obtenir la factory pour le contrat Voting
    const Voting = await hre.ethers.getContractFactory("Voting");

    // Déployer le contrat
    const deployedVoting = await Voting.deploy();

    // Attendre que le contrat soit complètement déployé
    await deployedVoting.waitForDeployment();

    // Afficher l'adresse où le contrat a été déployé
    const contractAddress = await deployedVoting.getAddress();
    console.log(`L'adresse du contrat a été déployé à l'adresse : ${contractAddress}`);

    // Afficher le hash de la transaction de déploiement
    const txHash = deployedVoting.deploymentTransaction().hash;
    console.log(`Hash de la transaction : ${txHash}`);
  } catch (error) {
    console.error("Erreur durant le déploiement :", error);
    process.exit(1);
  }
}

deployVotingContract().then(() => process.exit(0));
