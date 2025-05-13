import { useState } from 'react';
import { prepareWriteContract, writeContract } from '@wagmi/core';
import { abi, contractAddress } from '@/constants';

export default function AdminPage({ fetchVotingStatus }) {
  const [voterAddress, setVoterAddress] = useState("");

  const registerVoter = async () => {
    try {
      const { request } = await prepareWriteContract({
        address: contractAddress,
        abi: abi,
        functionName: 'registerVoter',
        args: [voterAddress]
      });
      await writeContract(request);
      alert("Votant enregistré");
      setVoterAddress("");
    } catch (e) {
      console.error(e);
      alert("Erreur : " + e.message);
    }
  };

  const handleStartProposalsRegistration = async () => {
    try {
      const { request } = await prepareWriteContract({
        address: contractAddress,
        abi: abi,
        functionName: 'startProposalsRegistration'
      });
      await writeContract(request);
      alert("Enregistrement des propositions démarré");
      fetchVotingStatus();
    } catch (e) {
      console.error(e);
      alert("Erreur : " + e.message);
    }
  };

  const handleEndProposalsRegistration = async () => {
    try {
      const { request } = await prepareWriteContract({
        address: contractAddress,
        abi: abi,
        functionName: 'endProposalsRegistration'
      });
      await writeContract(request);
      alert("Enregistrement des propositions terminé");
      fetchVotingStatus();
    } catch (e) {
      console.error(e);
      alert("Erreur : " + e.message);
    }
  };

  const handleStartVotingSession = async () => {
    try {
      const { request } = await prepareWriteContract({
        address: contractAddress,
        abi: abi,
        functionName: 'startVotingSession'
      });
      await writeContract(request);
      alert("Session de vote démarrée");
      fetchVotingStatus();
    } catch (e) {
      console.error(e);
      alert("Erreur : " + e.message);
    }
  };

  const handleEndVotingSession = async () => {
    try {
      const { request } = await prepareWriteContract({
        address: contractAddress,
        abi: abi,
        functionName: 'endVotingSession'
      });
      await writeContract(request);
      alert("Session de vote terminée");
      fetchVotingStatus();
    } catch (e) {
      console.error(e);
      alert("Erreur : " + e.message);
    }
  };

  return (
    <div>
      <h2>Admin Panel</h2>
      <div>
        <input
          type="text"
          placeholder="Adresse du votant"
          value={voterAddress}
          onChange={(e) => setVoterAddress(e.target.value)}
        />
        <button onClick={registerVoter}>Enregistrer Votant</button>
      </div>
      <div>
        <button onClick={handleStartProposalsRegistration}>Démarrer l'enregistrement des propositions</button>
        <button onClick={handleEndProposalsRegistration}>Terminer l'enregistrement des propositions</button>
      </div>
      <div>
        <button onClick={handleStartVotingSession}>Démarrer la session de vote</button>
        <button onClick={handleEndVotingSession}>Terminer la session de vote</button>
      </div>
    </div>
  );
}