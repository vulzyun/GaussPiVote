import { ethers } from "hardhat";

async function main() {
  // Récupère l'adresse du déployeur
  const [deployer] = await ethers.getSigners();
  console.log("Déployé avec le compte :", deployer.address);

  // Utilisez le nom correct du contrat ("Voting")
  const Voting = await ethers.getContractFactory("Voting");
  const voting = await Voting.deploy();

  // Attendre que le contrat soit réellement déployé
  await voting.deployed();

  // Afficher l'adresse du contrat
  console.log("Contrat déployé à l'adresse :", voting.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Erreur dans la fonction principale :", error);
    process.exit(1);
  });