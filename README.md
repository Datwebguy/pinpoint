<div align="center">
  <h1>PINPOINT</h1>
  <p><strong>A reviewed execution boundary between a live agent job and the chain.</strong></p>
  <p>
    <a href="https://img.shields.io/badge/status-executed-28704a?style=for-the-badge"><img src="https://img.shields.io/badge/status-executed-28704a?style=for-the-badge" alt="Status executed"></a>
    <a href="https://img.shields.io/badge/chain-Base%20Sepolia-0052ff?style=for-the-badge"><img src="https://img.shields.io/badge/chain-Base%20Sepolia-0052ff?style=for-the-badge" alt="Chain Base Sepolia"></a>
    <a href="https://img.shields.io/badge/sender-KeeperHub-dd5b2d?style=for-the-badge"><img src="https://img.shields.io/badge/sender-KeeperHub-dd5b2d?style=for-the-badge" alt="Sender KeeperHub"></a>
  </p>
</div>

## What PINPOINT does

PINPOINT takes a real job context from Daydreams TaskMarket, turns the approved intent into a fixed KeeperHub workflow, checks that workflow before execution, and returns a public transaction receipt.

The important boundary is simple. An agent can help interpret a job and propose a workflow. It does not hold a wallet, choose a new recipient after approval, or broadcast a transaction. KeeperHub is the only broadcaster. The human review step sits between composition and execution.

This is a focused execution layer for paid agent work. It is not a consumer application, a new marketplace, a trading interface, or a wallet.

## The live project

The live project used for this proof is [Daydreams TaskMarket](https://market.daydreams.systems/).

The selected live task is [Execute one bounded onchain action through KeeperHub](https://taskmarket.dev/tasks/0x935a2d3c8c949e8c58feacc6f9469142a1ad0d4a07c2922d0797bf2929a0a7b9) (task ID `0x935a2d3c8c949e8c58feacc6f9469142a1ad0d4a07c2922d0797bf2929a0a7b9`), published with escrow on Base Mainnet. The task brief explicitly requests:

> *"Execute one bounded onchain action through KeeperHub. Send exactly 0.0002 native ETH on Base Sepolia from KeeperHub’s managed wallet to the requester address associated with this TaskMarket task. KeeperHub must be the only broadcaster..."*

PINPOINT reads this live brief, composes the policy-checked KeeperHub workflow, validates and simulates off-chain, and executes the exact requested transfer to the requester (`0x75A0C2d1Df51C07982De3Ff031E5232518676B19`).

## The completed run

<table>
  <tr>
    <td bgcolor="#e8f4ec"><strong>Live project</strong><br>Daydreams TaskMarket</td>
    <td bgcolor="#e7efff"><strong>Network</strong><br>Base Sepolia, chain 84532</td>
    <td bgcolor="#fff0e9"><strong>Action</strong><br><code>web3/transfer-funds</code></td>
  </tr>
  <tr>
    <td bgcolor="#e8f4ec"><strong>Amount</strong><br>0.0002 native ETH</td>
    <td bgcolor="#e7efff"><strong>Workflow</strong><br><code>w2hjt7ekrdc1lwl1grza6</code></td>
    <td bgcolor="#fff0e9"><strong>Execution</strong><br><code>3evov6a25pybva45ad0so</code></td>
  </tr>
</table>

The transaction succeeded in block <code>46874941</code>.

[Open the verified Base Sepolia receipt](https://sepolia.basescan.org/tx/0x3ef851ae00647d28a2e0576216ce737abfefd22351e10afcc6c0dfb941ae4803).

The complete machine readable receipt is [proof/execution.json](proof/execution.json). The prompt change check is [proof/prompt-invariant.json](proof/prompt-invariant.json). The composed workflow and dry run records are in the [proof directory](proof/).

## Why the graph is safe to review

The workflow contains one manual review trigger and one fixed typed KeeperHub action.

The policy fixes the chain, the amount, and the recipient. It does not take those values from a later prompt. The workflow stays disabled until it is reviewed. A later instruction such as “send everything” cannot replace the reviewed graph.

The executed graph hash is:

<code>e2aeae185049a3f04c231246720310471d4aa04597631b9cf0d018c231e82eff</code>

The invariant check produced three useful facts.

<table>
  <tr>
    <td bgcolor="#e8f4ec"><strong>Prompt change</strong><br>The graph stayed the same.</td>
    <td bgcolor="#e8f4ec"><strong>Tamper attempt</strong><br>A changed amount was rejected.</td>
    <td bgcolor="#e8f4ec"><strong>Verification run</strong><br>No transaction was broadcast.</td>
  </tr>
</table>

Run the check yourself with <code>npm run verify-invariant</code>.

## How the execution works

<div align="center">

| Stage | Result |
|:---:|:---|
| Live brief | A real Daydreams task supplies the job context |
| Compose | Codex calls the KeeperHub MCP and creates a fixed typed workflow |
| Review | A person or fixed policy reviews the graph |
| Dry run | KeeperHub validates the graph and simulates the typed action |
| Execute | KeeperHub sends the approved workflow through its Turnkey wallet |
| Receipt | PINPOINT records the execution id, workflow id, graph hash, and explorer link |

</div>

The local code never signs or broadcasts. There is no private key in this repository. The only secret needed for reproduction is a local KeeperHub organization key.

## One page evidence surface

The repository includes a static judge-facing evidence surface deployed live at **[https://onpinpoint.vercel.app](https://onpinpoint.vercel.app)** (source at [platform/index.html](platform/index.html)).

It is inspired by the useful parts of the public [KeeperHub Flightcheck reference](https://keeperhub-flightcheck.timjosh507.workers.dev/): make the on-chain fact easy to inspect, show the failure and recovery path, preserve an independent receipt, and state the limits plainly.

The page is not a wallet, a marketplace, a backend, or a transaction control panel. It is a concise evidence surface for this completed run.

## Reproduce the flow

You need Node 20 or newer, npm, and a KeeperHub organization key. Keep the key in your shell environment. Never place it in a file that will be committed.

Run the composition step:

\`\`\`powershell
npm install
$env:KEEPERHUB_API_KEY = "kh_<local-only>"
npm run compose
\`\`\`

Review <code>proof/composed-workflow.json</code>. Set the returned workflow id and the approved graph hash:

\`\`\`powershell
$env:PINPOINT_WORKFLOW_ID = "w2hjt7ekrdc1lwl1grza6"
$env:PINPOINT_APPROVED_GRAPH_HASH = "<reviewed hash>"
npm run dry-run
\`\`\`

The dry run performs KeeperHub deep validation and typed transfer simulation. It does not broadcast.

After review, execute the exact approved workflow:

\`\`\`powershell
$env:PINPOINT_APPROVED = "1"
npm run execute
\`\`\`

The command writes <code>proof/execution.json</code> with the execution id, workflow id, transaction hash, and explorer URL.

## What the run proved

The first dry run was refused because the KeeperHub organization wallet had no Base Sepolia ETH. No transaction was sent. After the wallet was funded, the same graph passed validation and simulation and then executed successfully.

This non happy path is part of the record. It demonstrates that the system refuses a missing funding condition instead of silently changing the action.

## Known limits

KeeperHub <code>ai_generate_workflow</code> intermittently returned <code>upstream_cold_start</code>. PINPOINT records this and falls back to the live KeeperHub action schema for the fixed typed workflow.

The KeeperHub MCP catalog did not expose a workflow level dry run tool. PINPOINT therefore combines deep workflow validation with the typed transfer action simulation before execution.

The task brief is published and escrowed live on Daydreams TaskMarket (Base Mainnet), and the requested micro-transfer action is executed on Base Sepolia as a bounded proof to the task requester.

## Surfaces used

<table>
  <tr>
    <td bgcolor="#e7efff"><strong>MCP</strong><br>KeeperHub hosted MCP for composition, validation, execution, and execution lookup.</td>
    <td bgcolor="#fff0e9"><strong>Typed action</strong><br>KeeperHub <code>web3/transfer-funds</code> rather than hand built calldata.</td>
  </tr>
  <tr>
    <td bgcolor="#e8f4ec"><strong>Agent authored workflow</strong><br>Codex composes the graph from the live job context.</td>
    <td bgcolor="#f0eaf8"><strong>Audit trail</strong><br>Execution id, graph hash, receipt status, block, and explorer transaction.</td>
  </tr>
</table>

## Hackathon

This is the main track submission for the KeeperHub Agent Economy Hackathon.

Hackathon page: [DoraHacks Agent Economy](https://dorahacks.io/hackathon/agent-economy/detail)

The separate KeeperHub bounty is intentionally out of scope. No bounty pull request, OpenClaw integration, local wallet, or new marketplace is included here.
