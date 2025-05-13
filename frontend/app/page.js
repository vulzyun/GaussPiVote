"use client"
import { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import { readContract, prepareWriteContract, writeContract } from "@wagmi/core"
import { abi, contractAddress } from "@/constants"
import { ConnectButton } from "@rainbow-me/rainbowkit"

// Enum pour les statuts du workflow (doit correspondre à celui du contrat)
const WorkflowStatus = {
  RegisteringVoters: 0,
  ProposalsRegistrationStarted: 1,
  ProposalsRegistrationEnded: 2,
  VotingSessionStarted: 3,
  VotingSessionEnded: 4,
  VotesTallied: 5,
}

export default function Home() {
  const { address, isConnected } = useAccount()
  const [isOwner, setIsOwner] = useState(false)
  const [isRegisteredVoter, setIsRegisteredVoter] = useState(false)
  const [proposals, setProposals] = useState([])
  const [workflowStatus, setWorkflowStatus] = useState(0)
  const [statusText, setStatusText] = useState("Enregistrement des votants")
  const [winner, setWinner] = useState(null)
  const [error, setError] = useState("")
  const [voterInfo, setVoterInfo] = useState({ isRegistered: false, hasVoted: false, votedProposalId: 0 })

  // Etats pour l'interface administrateur
  const [voterAddress, setVoterAddress] = useState("")
  const [multipleVoters, setMultipleVoters] = useState("")
  const [proposalDescription, setProposalDescription] = useState("")

  // Etat pour l'interface votant
  const [voteProposalId, setVoteProposalId] = useState("")

  // Fonction pour mettre à jour le texte du statut
  const updateStatusText = (status) => {
    switch (Number(status)) {
      case WorkflowStatus.RegisteringVoters:
        setStatusText("Enregistrement des votants")
        break
      case WorkflowStatus.ProposalsRegistrationStarted:
        setStatusText("Enregistrement des propositions en cours")
        break
      case WorkflowStatus.ProposalsRegistrationEnded:
        setStatusText("Enregistrement des propositions terminé")
        break
      case WorkflowStatus.VotingSessionStarted:
        setStatusText("Session de vote en cours")
        break
      case WorkflowStatus.VotingSessionEnded:
        setStatusText("Session de vote terminée")
        break
      case WorkflowStatus.VotesTallied:
        setStatusText("Votes comptabilisés")
        break
      default:
        setStatusText("Statut inconnu")
    }
  }

  // Fonction pour récupérer les informations d'un votant
  const fetchVoterInfo = async (voterAddress) => {
    try {
      const voter = await readContract({
        address: contractAddress,
        abi: abi,
        functionName: "getVoter",
        args: [voterAddress],
      })

      return {
        isRegistered: voter[0],
        hasVoted: voter[1],
        votedProposalId: voter[2].toString(),
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des informations du votant:", error)
      return { isRegistered: false, hasVoted: false, votedProposalId: 0 }
    }
  }

  // Fonction pour récupérer les propositions depuis le contrat
  const fetchProposals = async () => {
    if (isConnected && address) {
      try {
        setError("")

        // Vérifier si l'utilisateur connecté est le propriétaire
        const owner = await readContract({
          address: contractAddress,
          abi: abi,
          functionName: "owner",
        })
        setIsOwner(owner.toLowerCase() === address.toLowerCase())

        // Récupérer le statut actuel du workflow
        const status = await readContract({
          address: contractAddress,
          abi: abi,
          functionName: "getVotingStatus",
        })
        setWorkflowStatus(Number(status))
        updateStatusText(status)

        // Récupérer les informations du votant connecté
        const voterData = await fetchVoterInfo(address)
        setIsRegisteredVoter(voterData.isRegistered)
        setVoterInfo(voterData)

        // Récupérer le nombre de propositions
        const proposalsCountBN = await readContract({
          address: contractAddress,
          abi: abi,
          functionName: "getProposalsCount",
        })
        const proposalsCount = proposalsCountBN.toNumber ? proposalsCountBN.toNumber() : Number(proposalsCountBN)

        const proposalsArray = []
        for (let i = 0; i < proposalsCount; i++) {
          const proposalTuple = await readContract({
            address: contractAddress,
            abi: abi,
            functionName: "getProposal",
            args: [i],
          })
          proposalsArray.push({
            id: i,
            description: proposalTuple[0],
            voteCount: proposalTuple[1].toNumber ? proposalTuple[1].toNumber() : Number(proposalTuple[1]),
          })
        }
        setProposals(proposalsArray)

        // Si les votes sont comptabilisés, récupérer le gagnant
        if (Number(status) === WorkflowStatus.VotesTallied) {
          const winnerInfo = await getWinner()
          setWinner(winnerInfo)
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données :", error)
        setError("Erreur lors du chargement des données. Vérifiez votre connexion et l'adresse du contrat.")
      }
    }
  }

  // Chargement des données lors de la connexion ou changement d'adresse
  useEffect(() => {
    if (isConnected && address) {
      fetchProposals()
    } else {
      // Réinitialiser les états si déconnecté
      setIsOwner(false)
      setIsRegisteredVoter(false)
      setProposals([])
      setWorkflowStatus(0)
      setWinner(null)
    }
  }, [isConnected, address])

  // Fonctions de l'interface Administrateur
  const registerVoter = async () => {
    try {
      setError("")
      if (!voterAddress || !voterAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        setError("Adresse Ethereum invalide")
        return
      }

      const { request } = await prepareWriteContract({
        address: contractAddress,
        abi: abi,
        functionName: "registerVoter",
        args: [voterAddress],
      })
      await writeContract(request)
      alert("Votant enregistré !")
      setVoterAddress("")
      await fetchProposals()
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du votant :", error)
      setError(error.message || "Erreur lors de l'enregistrement du votant")
    }
  }

  const registerMultipleVoters = async () => {
    try {
      setError("")
      const addresses = multipleVoters.split(",").map((addr) => addr.trim())

      // Vérifier que toutes les adresses sont valides
      for (const addr of addresses) {
        if (!addr.match(/^0x[a-fA-F0-9]{40}$/)) {
          setError(`Adresse invalide: ${addr}`)
          return
        }
      }

      const { request } = await prepareWriteContract({
        address: contractAddress,
        abi: abi,
        functionName: "registerVoters",
        args: [addresses],
      })
      await writeContract(request)
      alert("Votants enregistrés !")
      setMultipleVoters("")
      await fetchProposals()
    } catch (error) {
      console.error("Erreur lors de l'enregistrement des votants :", error)
      setError(error.message || "Erreur lors de l'enregistrement des votants")
    }
  }

  const unregisterVoter = async () => {
    try {
      setError("")
      if (!voterAddress || !voterAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        setError("Adresse Ethereum invalide")
        return
      }

      const { request } = await prepareWriteContract({
        address: contractAddress,
        abi: abi,
        functionName: "unregisterVoter",
        args: [voterAddress],
      })
      await writeContract(request)
      alert("Votant désinscrit !")
      setVoterAddress("")
      await fetchProposals()
    } catch (error) {
      console.error("Erreur lors de la désinscription du votant :", error)
      setError(error.message || "Erreur lors de la désinscription du votant")
    }
  }

  const startProposalsRegistration = async () => {
    try {
      setError("")
      const { request } = await prepareWriteContract({
        address: contractAddress,
        abi: abi,
        functionName: "startProposalsRegistration",
      })
      await writeContract(request)
      alert("Enregistrement des propositions démarré !")
      await fetchProposals()
    } catch (error) {
      console.error("Erreur lors du démarrage de l'enregistrement des propositions :", error)
      setError(error.message || "Erreur lors du démarrage de l'enregistrement des propositions")
    }
  }

  const endProposalsRegistration = async () => {
    try {
      setError("")
      const { request } = await prepareWriteContract({
        address: contractAddress,
        abi: abi,
        functionName: "endProposalsRegistration",
      })
      await writeContract(request)
      alert("Enregistrement des propositions terminé !")
      await fetchProposals()
    } catch (error) {
      console.error("Erreur lors de la fin de l'enregistrement des propositions :", error)
      setError(error.message || "Erreur lors de la fin de l'enregistrement des propositions")
    }
  }

  const startVotingSession = async () => {
    try {
      setError("")
      const { request } = await prepareWriteContract({
        address: contractAddress,
        abi: abi,
        functionName: "startVotingSession",
      })
      await writeContract(request)
      alert("Session de vote démarrée !")
      await fetchProposals()
    } catch (error) {
      console.error("Erreur lors du démarrage de la session de vote :", error)
      setError(error.message || "Erreur lors du démarrage de la session de vote")
    }
  }

  const endVotingSession = async () => {
    try {
      setError("")
      const { request } = await prepareWriteContract({
        address: contractAddress,
        abi: abi,
        functionName: "endVotingSession",
      })
      await writeContract(request)
      alert("Session de vote terminée !")
      await fetchProposals()
    } catch (error) {
      console.error("Erreur lors de la fin de la session de vote :", error)
      setError(error.message || "Erreur lors de la fin de la session de vote")
    }
  }

  const countVotes = async () => {
    try {
      setError("")
      const { request } = await prepareWriteContract({
        address: contractAddress,
        abi: abi,
        functionName: "countVotes",
      })
      await writeContract(request)
      alert("Votes comptabilisés !")
      await fetchProposals()
    } catch (error) {
      console.error("Erreur lors du comptage des votes :", error)
      setError(error.message || "Erreur lors du comptage des votes")
    }
  }

  const getWinner = async () => {
    try {
      const winnerData = await readContract({
        address: contractAddress,
        abi: abi,
        functionName: "getWinner",
      })

      return {
        id: winnerData[0].toString(),
        description: winnerData[1],
        voteCount: winnerData[2].toNumber ? winnerData[2].toNumber() : Number(winnerData[2]),
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du gagnant :", error)
      setError("Impossible de récupérer le gagnant. Les votes n'ont peut-être pas encore été comptabilisés.")
      return null
    }
  }

  const registerProposal = async () => {
    try {
      setError("")
      if (!proposalDescription.trim()) {
        setError("La description de la proposition ne peut pas être vide")
        return
      }

      const { request } = await prepareWriteContract({
        address: contractAddress,
        abi: abi,
        functionName: "registerProposal",
        args: [proposalDescription],
      })
      await writeContract(request)
      alert("Proposition enregistrée !")
      setProposalDescription("")
      await fetchProposals()
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la proposition :", error)
      setError(error.message || "Erreur lors de l'enregistrement de la proposition")
    }
  }

  const voteForProposal = async () => {
    try {
      setError("")
      const proposalId = Number(voteProposalId)

      if (isNaN(proposalId) || proposalId < 0 || proposalId >= proposals.length) {
        setError("ID de proposition invalide")
        return
      }

      const { request } = await prepareWriteContract({
        address: contractAddress,
        abi: abi,
        functionName: "vote",
        args: [proposalId],
      })
      await writeContract(request)
      alert("Vote enregistré !")
      setVoteProposalId("")
      await fetchProposals()
    } catch (error) {
      console.error("Erreur lors du vote :", error)
      setError(error.message || "Erreur lors du vote")
    }
  }

  // Fonction pour réinitialiser le workflow (uniquement pour tests)
  const resetWorkflowForTesting = async () => {
    try {
      setError("")
      const { request } = await prepareWriteContract({
        address: contractAddress,
        abi: abi,
        functionName: "resetWorkflowForTesting",
      })
      await writeContract(request)
      alert("Workflow réinitialisé à RegisteringVoters")
      await fetchProposals()
    } catch (error) {
      console.error("Erreur lors de la réinitialisation du workflow :", error)
      setError(error.message || "Erreur lors de la réinitialisation du workflow")
    }
  }

  // Rendu de l'interface utilisateur
  return (
    <div className="p-4 max-w-6xl mx-auto">
      {!isConnected ? (
        <div className="text-center py-10">
          <h1 className="text-2xl font-bold mb-6">Système de Vote Décentralisé</h1>
          <p className="mb-4">Veuillez connecter votre wallet pour accéder à l'application</p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Système de Vote Décentralisé</h1>
            <div className="mt-2 p-2 bg-blue-100 rounded">
              <p>
                <strong>Statut actuel:</strong> {statusText}
              </p>
              <p>
                <strong>Adresse connectée:</strong> {address}
              </p>
              <p>
                <strong>Rôle:</strong>{" "}
                {isOwner ? "Administrateur" : isRegisteredVoter ? "Votant enregistré" : "Non enregistré"}
              </p>
            </div>
            {error && <div className="mt-2 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
          </div>

          {isOwner ? (
            // Interface Administrateur
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border p-4 rounded shadow">
                <h2 className="text-xl font-semibold mb-4">Gestion des votants</h2>
                <div className="mb-4">
                  <label className="block mb-2">Adresse du votant</label>
                  <input
                    type="text"
                    placeholder="0x..."
                    value={voterAddress}
                    onChange={(e) => setVoterAddress(e.target.value)}
                    className="w-full p-2 border rounded mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={registerVoter}
                      disabled={workflowStatus !== WorkflowStatus.RegisteringVoters}
                      className={`p-2 rounded ${workflowStatus === WorkflowStatus.RegisteringVoters ? "bg-blue-500 text-white" : "bg-gray-300"}`}
                    >
                      Enregistrer Votant
                    </button>
                    <button
                      onClick={unregisterVoter}
                      disabled={workflowStatus !== WorkflowStatus.RegisteringVoters}
                      className={`p-2 rounded ${workflowStatus === WorkflowStatus.RegisteringVoters ? "bg-red-500 text-white" : "bg-gray-300"}`}
                    >
                      Désinscrire Votant
                    </button>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block mb-2">Enregistrer plusieurs votants (séparés par des virgules)</label>
                  <textarea
                    placeholder="0x..., 0x..., 0x..."
                    value={multipleVoters}
                    onChange={(e) => setMultipleVoters(e.target.value)}
                    className="w-full p-2 border rounded mb-2"
                    rows={3}
                  />
                  <button
                    onClick={registerMultipleVoters}
                    disabled={workflowStatus !== WorkflowStatus.RegisteringVoters}
                    className={`p-2 rounded ${workflowStatus === WorkflowStatus.RegisteringVoters ? "bg-blue-500 text-white" : "bg-gray-300"}`}
                  >
                    Enregistrer Votants
                  </button>
                </div>
              </div>

              <div className="border p-4 rounded shadow">
                <h2 className="text-xl font-semibold mb-4">Gestion du workflow</h2>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={startProposalsRegistration}
                    disabled={workflowStatus !== WorkflowStatus.RegisteringVoters}
                    className={`p-2 rounded ${workflowStatus === WorkflowStatus.RegisteringVoters ? "bg-blue-500 text-white" : "bg-gray-300"}`}
                  >
                    Démarrer l'enregistrement des propositions
                  </button>
                  <button
                    onClick={endProposalsRegistration}
                    disabled={workflowStatus !== WorkflowStatus.ProposalsRegistrationStarted}
                    className={`p-2 rounded ${workflowStatus === WorkflowStatus.ProposalsRegistrationStarted ? "bg-blue-500 text-white" : "bg-gray-300"}`}
                  >
                    Terminer l'enregistrement des propositions
                  </button>
                  <button
                    onClick={startVotingSession}
                    disabled={workflowStatus !== WorkflowStatus.ProposalsRegistrationEnded}
                    className={`p-2 rounded ${workflowStatus === WorkflowStatus.ProposalsRegistrationEnded ? "bg-blue-500 text-white" : "bg-gray-300"}`}
                  >
                    Démarrer la session de vote
                  </button>
                  <button
                    onClick={endVotingSession}
                    disabled={workflowStatus !== WorkflowStatus.VotingSessionStarted}
                    className={`p-2 rounded ${workflowStatus === WorkflowStatus.VotingSessionStarted ? "bg-blue-500 text-white" : "bg-gray-300"}`}
                  >
                    Terminer la session de vote
                  </button>
                  <button
                    onClick={countVotes}
                    disabled={workflowStatus !== WorkflowStatus.VotingSessionEnded}
                    className={`p-2 rounded ${workflowStatus === WorkflowStatus.VotingSessionEnded ? "bg-blue-500 text-white" : "bg-gray-300"}`}
                  >
                    Comptabiliser les votes
                  </button>
                  <button onClick={resetWorkflowForTesting} className="p-2 rounded bg-gray-500 text-white mt-4">
                    Réinitialiser Workflow (Tests)
                  </button>
                </div>
              </div>

              <div className="border p-4 rounded shadow">
                <h2 className="text-xl font-semibold mb-4">Ajouter une proposition</h2>
                <div className="mb-4">
                  <textarea
                    placeholder="Description de la proposition"
                    value={proposalDescription}
                    onChange={(e) => setProposalDescription(e.target.value)}
                    className="w-full p-2 border rounded mb-2"
                    rows={3}
                  />
                  <button
                    onClick={registerProposal}
                    disabled={workflowStatus !== WorkflowStatus.ProposalsRegistrationStarted}
                    className={`p-2 rounded ${workflowStatus === WorkflowStatus.ProposalsRegistrationStarted ? "bg-blue-500 text-white" : "bg-gray-300"}`}
                  >
                    Ajouter Proposition
                  </button>
                </div>
              </div>

              <div className="border p-4 rounded shadow">
                <h2 className="text-xl font-semibold mb-4">Liste des propositions</h2>
                {proposals.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto">
                    {proposals.map((proposal, index) => (
                      <div key={index} className="p-2 border-b">
                        <p>
                          <strong>ID {index}:</strong> {proposal.description}
                        </p>
                        <p>
                          <strong>Votes:</strong> {proposal.voteCount}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>Aucune proposition enregistrée pour le moment.</p>
                )}
              </div>
            </div>
          ) : (
            // Interface Votant
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border p-4 rounded shadow">
                <h2 className="text-xl font-semibold mb-4">Liste des propositions</h2>
                {proposals.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto">
                    {proposals.map((proposal, index) => (
                      <div key={index} className="p-2 border-b">
                        <p>
                          <strong>ID {index}:</strong> {proposal.description}
                        </p>
                        <p>
                          <strong>Votes:</strong> {proposal.voteCount}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>Aucune proposition enregistrée pour le moment.</p>
                )}
              </div>

              {isRegisteredVoter && (
                <div className="border p-4 rounded shadow">
                  <h2 className="text-xl font-semibold mb-4">Voter pour une proposition</h2>
                  {voterInfo.hasVoted ? (
                    <div className="p-2 bg-green-100 rounded">
                      <p>Vous avez déjà voté pour la proposition ID: {voterInfo.votedProposalId}</p>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="number"
                        placeholder="ID de la proposition"
                        value={voteProposalId}
                        onChange={(e) => setVoteProposalId(e.target.value)}
                        className="w-full p-2 border rounded mb-2"
                      />
                      <button
                        onClick={voteForProposal}
                        disabled={workflowStatus !== WorkflowStatus.VotingSessionStarted}
                        className={`p-2 rounded ${workflowStatus === WorkflowStatus.VotingSessionStarted ? "bg-blue-500 text-white" : "bg-gray-300"}`}
                      >
                        Voter
                      </button>
                    </div>
                  )}
                </div>
              )}

              {!isRegisteredVoter && (
                <div className="border p-4 rounded shadow bg-yellow-50">
                  <h2 className="text-xl font-semibold mb-4">Non enregistré</h2>
                  <p>
                    Vous n'êtes pas enregistré comme votant. Contactez l'administrateur pour être ajouté à la liste des
                    votants.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Affichage du gagnant (visible par tous) */}
          {workflowStatus === WorkflowStatus.VotesTallied && winner && (
            <div className="mt-6 border p-4 rounded shadow bg-green-50">
              <h2 className="text-xl font-semibold mb-4">Résultat du vote</h2>
              <div className="p-4 bg-white rounded shadow">
                <h3 className="text-lg font-bold">Proposition gagnante</h3>
                <p>
                  <strong>ID:</strong> {winner.id}
                </p>
                <p>
                  <strong>Description:</strong> {winner.description}
                </p>
                <p>
                  <strong>Nombre de votes:</strong> {winner.voteCount}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

