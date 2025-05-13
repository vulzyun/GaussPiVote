import { useEffect, useState } from 'react';
import { readContract } from '@wagmi/core';
import { abi, contractAddress } from '@/constants';

export default function ProposalList() {
  const [proposals, setProposals] = useState([]);

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const proposalsCount = await readContract({
          address: contractAddress,
          abi: abi,
          functionName: 'getProposalsCount'
        });
        const proposalsArray = [];
        for (let i = 0; i < proposalsCount; i++) {
          const proposal = await readContract({
            address: contractAddress,
            abi: abi,
            functionName: 'getProposal',
            args: [i]
          });
          proposalsArray.push(proposal);
        }
        setProposals(proposalsArray);
      } catch (e) {
        console.error(e);
      }
    };

    fetchProposals();
  }, []);

  return (
    <div>
      <h3>Propositions</h3>
      <ul>
        {proposals.map((proposal, index) => (
          <li key={index}>{proposal.description}</li>
        ))}
      </ul>
    </div>
  );
}