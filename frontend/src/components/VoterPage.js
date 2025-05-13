import { useState } from 'react';
import { prepareWriteContract, writeContract } from '@wagmi/core';
import { abi, contractAddress } from '@/constants';

export default function VoterPage({ proposals }) {
  const [proposalDescription, setProposalDescription] = useState("");
  const [voteProposalId, setVoteProposalId] = useState("");

  const registerProposal = async () => {
    try {
      const { request } = await prepareWriteContract({
        address: contractAddress,
        abi: abi,
        functionName: 'registerProposal',
        args: [proposalDescription]
      });
      await writeContract(request);
      alert("Proposition enregistrée");
      setProposalDescription("");
    } catch (e) {
      console.error(e);
      alert("Erreur : " + e.message);
    }
  };

  const voteProposal = async () => {
    try {
      const id = Number(voteProposalId);
      const { request } = await prepareWriteContract({
        address: contractAddress,
        abi: abi,
        functionName: 'vote',
        args: [id]
      });
      await writeContract(request);
      alert("Vote enregistré");
    } catch (e) {
      console.error(e);
      alert("Erreur : " + e.message);
    }
  };

  return (
    <div>
      <h2>Voter Panel</h2>
      <div>
        <input
          type="text"
          placeholder="Description de la proposition"
          value={proposalDescription}
          onChange={(e) => setProposalDescription(e.target.value)}
        />
        <button onClick={registerProposal}>Enregistrer Proposition</button>
      </div>
      <div>
        <input
          type="number"
          placeholder="ID de la proposition à voter"
          value={voteProposalId}
          onChange={(e) => setVoteProposalId(e.target.value)}
        />
        <button onClick={voteProposal}>Voter</button>
      </div>
      <div>
        <h3>Propositions</h3>
        <ul>
          {proposals.map((proposal, index) => (
            <li key={index}>{proposal.description}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}