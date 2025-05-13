// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Voting Contract
/// @notice This contract manages a voting process with proposals, voters, and an administrator
/// @dev The contract allows an admin to register voters, start proposal registration, handle voting, and tally votes
contract Voting is Ownable {

    /// @dev Enum to track the status of the voting process
    enum WorkflowStatus {
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
    }

    /// @notice Represents a voter in the system
    /// @param isRegistered Boolean that indicates if the voter is registered
    /// @param hasVoted Boolean that indicates if the voter has already voted
    /// @param votedProposalId The proposal ID the voter voted for
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint votedProposalId;
    }

    /// @notice Represents a proposal in the voting process
    /// @param description A text description of the proposal
    /// @param voteCount The total number of votes received by this proposal
    struct Proposal {
        string description;
        uint voteCount;
    }

    uint private winningProposalID;
    WorkflowStatus public status;

    Proposal[] public proposals;
    mapping(address => Voter) public voters;
    address[] public voterAddresses; // Array to keep track of registered voters

    event VoterRegistered(address indexed voterAddress);
    event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus newStatus);
    event ProposalRegistered(uint proposalId);
    event Voted(address indexed voter, uint proposalId);
    event VoterUnregistered(address indexed voterAddress); // Event for unregistered voters
    event ProposalTie(uint[] proposalIds); // Event for tied proposals

    /// @notice Constructor sets the initial state to RegisteringVoters
    constructor() Ownable(msg.sender) {
        // L'admin est automatiquement l'adresse qui déploie le contrat grâce à Ownable
        status = WorkflowStatus.RegisteringVoters;
    }

    /// @notice Modifier to restrict access to the admin only
    modifier onlyVoter() {
        require(voters[msg.sender].isRegistered, unicode"Vous n'êtes pas un votant enregistré");
        _;
    }

    /// @notice Register a single voter to the whitelist
    /// @param _voter The address of the voter to register
    function registerVoter(address _voter) public onlyOwner {
        require(status == WorkflowStatus.RegisteringVoters, unicode"Impossible d'enregistrer les votants à ce stade");
        require(!voters[_voter].isRegistered, unicode"Le votant est déjà enregistré");

        voters[_voter].isRegistered = true;
        voterAddresses.push(_voter);
        emit VoterRegistered(_voter);
    }

    /// @notice Register multiple voters to the whitelist in batch
    /// @param _voters Array of addresses to register
    function registerVoters(address[] calldata _voters) public onlyOwner {
        require(status == WorkflowStatus.RegisteringVoters, unicode"Impossible d'enregistrer les votants à ce stade");

        for (uint i = 0; i < _voters.length; i++) {
            if (!voters[_voters[i]].isRegistered) {
                voters[_voters[i]].isRegistered = true;
                voterAddresses.push(_voters[i]);
                emit VoterRegistered(_voters[i]);
            }
        }
    }

    /// @notice Start the proposal registration phase
    function startProposalsRegistration() public onlyOwner {
        require(status == WorkflowStatus.RegisteringVoters, unicode"Impossible de démarrer l'enregistrement des propositions maintenant");
        status = WorkflowStatus.ProposalsRegistrationStarted;
        emit WorkflowStatusChange(WorkflowStatus.RegisteringVoters, WorkflowStatus.ProposalsRegistrationStarted);
    }

    /// @notice End the proposal registration phase
    function endProposalsRegistration() public onlyOwner {
        require(status == WorkflowStatus.ProposalsRegistrationStarted, unicode"L'enregistrement des propositions n'a pas commencé");
        require(proposals.length > 0, unicode"Impossible de terminer l'enregistrement des propositions sans propositions");
        status = WorkflowStatus.ProposalsRegistrationEnded;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationStarted, WorkflowStatus.ProposalsRegistrationEnded);
    }

    /// @notice Allows a registered voter to submit a proposal
    /// @param _description The description of the proposal
    function registerProposal(string memory _description) public onlyVoter {
        require(status == WorkflowStatus.ProposalsRegistrationStarted, unicode"L'enregistrement des propositions est terminé");
        require(bytes(_description).length > 0, unicode"Description de la proposition ne peut pas être vide");

        proposals.push(Proposal({ description: _description, voteCount: 0 }));
        emit ProposalRegistered(proposals.length - 1);
    }

    /// @notice Start the voting session
    function startVotingSession() public onlyOwner {
        require(status == WorkflowStatus.ProposalsRegistrationEnded, unicode"L'enregistrement des propositions n'est pas encore terminé");
        status = WorkflowStatus.VotingSessionStarted;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationEnded, WorkflowStatus.VotingSessionStarted);
    }

    /// @notice End the voting session
    function endVotingSession() public onlyOwner {
        require(status == WorkflowStatus.VotingSessionStarted, unicode"La session de vote n'a pas encore commencé");
        status = WorkflowStatus.VotingSessionEnded;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionStarted, WorkflowStatus.VotingSessionEnded);
    }

    /// @notice Allows a registered voter to vote for a proposal
    /// @param _proposalId The ID of the proposal to vote for
    function vote(uint _proposalId) public onlyVoter {
        require(status == WorkflowStatus.VotingSessionStarted, unicode"La session de vote n'a pas encore commencé");
        require(!voters[msg.sender].hasVoted, unicode"Vous avez déjà voté");
        require(_proposalId < proposals.length, unicode"Proposition invalide");

        voters[msg.sender].hasVoted = true;
        voters[msg.sender].votedProposalId = _proposalId;
        proposals[_proposalId].voteCount += 1;
        emit Voted(msg.sender, _proposalId);
    }

    /// @notice Count the votes and determine the winner
    function countVotes() public onlyOwner {
        require(status == WorkflowStatus.VotingSessionEnded, unicode"La session de vote n'est pas encore terminée");

        uint maxVotes = 0;
        uint winnerIndex = 0;
        uint tieCount = 0;
        uint[] memory tiedProposals = new uint[](proposals.length);

        for (uint i = 0; i < proposals.length; i++) {
            if (proposals[i].voteCount > maxVotes) {
                maxVotes = proposals[i].voteCount;
                winnerIndex = i;
                tieCount = 0; // reset tie count
                tiedProposals[tieCount] = i;
            } else if (proposals[i].voteCount == maxVotes && proposals[i].voteCount > 0) {
                tieCount++;
                tiedProposals[tieCount] = i;
            }
        }

        if (tieCount > 0) {
            uint[] memory finalTiedProposals = new uint[](tieCount + 1);
            for (uint i = 0; i <= tieCount; i++) {
                finalTiedProposals[i] = tiedProposals[i];
            }
            emit ProposalTie(finalTiedProposals); // Emit a tie event
        }

        winningProposalID = winnerIndex;
        status = WorkflowStatus.VotesTallied;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionEnded, WorkflowStatus.VotesTallied);
    }

    /// @notice Get the winning proposal details
    function getWinner() public view returns (uint, string memory, uint) {
        require(status == WorkflowStatus.VotesTallied, unicode"Les votes n'ont pas encore été comptabilisés");
        Proposal memory winner = proposals[winningProposalID];
        return (winningProposalID, winner.description, winner.voteCount);
    }

    /// @notice Unregister a voter from the whitelist
    function unregisterVoter(address _voter) public onlyOwner {
        require(voters[_voter].isRegistered, unicode"Le votant n'est pas enregistré");

        voters[_voter].isRegistered = false;
        emit VoterUnregistered(_voter);
    }

    /// @notice Get the current voting status
    function getVotingStatus() public view returns (WorkflowStatus) {
        return status;
    }

    /// @notice Get the total number of proposals
    function getProposalsCount() public view returns (uint) {
        return proposals.length;
    }

    /// @notice Get a specific proposal's details
    function getProposal(uint _proposalId) public view returns (string memory description, uint voteCount) {
        require(_proposalId < proposals.length, unicode"Proposition invalide");
        Proposal memory prop = proposals[_proposalId];
        return (prop.description, prop.voteCount);
    }

    /// @notice Get details about a specific voter
    function getVoter(address _voter) public view returns (bool isRegistered, bool hasVoted, uint votedProposalId) {
        Voter memory voter = voters[_voter];
        return (voter.isRegistered, voter.hasVoted, voter.votedProposalId);
    }

    function resetWorkflowForTesting() public onlyOwner {
        // Remise à zéro de l'état du workflow
        status = WorkflowStatus.RegisteringVoters;
        winningProposalID = 0;
        
        // Réinitialisation des propositions
        delete proposals;
        
        // Pour chaque votant enregistré, remettre à zéro les informations
        for (uint i = 0; i < voterAddresses.length; i++) {
            address voterAddr = voterAddresses[i];
            voters[voterAddr] = Voter(false, false, 0);
        }
        // Réinitialisation du tableau des adresses des votants
        delete voterAddresses;
}
}