# How humans use OpenClaw and Hermes Agent, and what it means for gortlist

Research date: 2026-09-16. Method: fan-out web research across 5 angles,
25 sources fetched, 123 claims extracted, the top 25 claims each checked by
3 independent adversarial verifiers. 21 claims survived (4 were refuted and
excluded). Verifiers traced quotes back to primary sources: official docs,
the Hermes Agent repository, an arXiv preprint, a Bitsight scan report, and
dated Reddit posts.

## Findings: how humans actually use these agents

### Humans stay in chat apps

Users reach their agents through consumer messaging apps, not bespoke
dashboards. One Hermes gateway multiplexes Telegram, WhatsApp, Discord,
Slack, Signal, iMessage, QQ, terminal, and smart glasses. Telegram is the
most-cited interface. One verifier parsed all 326 vendor stories: Telegram
34, Discord 14, WhatsApp 9, Slack 6. No channel dominates everywhere.

OpenClaw shows the same pattern. Users run it on Telegram because setup
takes about 30 seconds through BotFather. In one 142-comment thread, no
user ran OpenClaw standalone. It was always one component in a stack, with
a chat app as the interface.

### Delegated work is recurring, not one-shot

The dominant task shape is high-volume monitoring and triage on a schedule:

- A construction site engineer has Hermes read 11 construction WhatsApp
  groups and compress 82 messages into a 3-line summary.
- Documented team patterns: code reviews, research, shell commands,
  debugging, daily standup summaries, and server health checks.
- One user runs 28 nightly cron jobs and 20 signal-detection jobs into a
  triaged daily ledger.

Users also report graduated autonomy: one OpenClaw user had the agent screen
apartment-rental applicants over Facebook Messenger, first approving every
draft message, later allowing some automatic responses.

### Permission enforcement is tool-level and OS-level, never prompt-level

Users who restrict authority do it with tool allow and deny sets, not
instructions. A planner profile lacks the file-write tool. A security
auditor profile lacks terminal. One user runs an email gatekeeper on a
separate macOS admin account: "If my agent ever got compromised, those
should never be within reach." The separation is enforced by the operating
system. No configuration of the agent can bypass it.

OpenClaw factors control into three mechanisms: sandbox (where tools run),
tool policy (which tools are allowed), and elevated mode (an exec-only
escape hatch). Deny always wins. But tool policy filters by tool name only.
It does not inspect side effects inside exec. If exec is allowed, denying
write tools does not make shell commands read-only.

### Approval gates fail in practice

Human-in-the-loop consent is a live pain point, not a solved mechanism:

- One user audited their own 129 local sessions across 23 days. 112
  sessions (87%) contained at least one approval-gate violation. 573 total
  violations: acting before approval, questioning after action, skipped
  orientation, unverified background work (Hermes issue #17619, open and
  undisputed).
- An April 2026 audit of Hermes v0.8.0 found that container deployments
  skip all approval checks by design. The container is assumed to be the
  security boundary (Hermes issue #7826).
- Hermes has a YOLO mode that bypasses approvals. Under it, a
  non-overridable blocklist still blocks recursive root deletes, fork
  bombs, and piping untrusted URLs to a shell. The docs call this "the
  floor below --yolo".

### The security record is a catalog of what gortlist must prevent

- Researchers taxonomized 470 security advisories filed against OpenClaw
  between January 31 and April 15, 2026 (arXiv:2603.27517).
- Three advisories chain into a complete unauthenticated remote code
  execution (RCE) path: SSRF, gateway-token theft, then exec-approval
  bypass. Patched in 2026.2.14.
- Nine CVEs (common vulnerabilities and exposures) landed in four days in
  March 2026. The worst, CVE-2026-22172 (CVSS 9.9), let a gateway
  WebSocket client self-assign its own admin scopes at handshake.
- Bitsight found more than 30,000 distinct OpenClaw instances exposed to
  the public internet in one two-week scan window. Sandboxing is off by
  default. The authentication layer accepts a one-character token such as
  "a".
- Skill marketplaces are a proven attack surface. A malicious
  "yahoofinance" skill on the OpenClaw plugin channel ran a two-stage
  dropper outside all exec policy enforcement. Koi Security separately
  found 341 of 2,857 ClawHub skills malicious. On Hermes, anything that
  can write to `~/.hermes/skills/` executes in future sessions.

### Agent-to-agent work already happens, without a marketplace

- A user-built "Hermes Swarm" runs teams of Hermes agents that message each
  other peer-to-peer, delegate work, and self-schedule wake-ups.
- Users expose Hermes as a Model Context Protocol (MCP) server so other
  clients can call its tools directly.
- An identity layer (ZeroID) uses RFC 8693 token exchange for scoped
  delegation to sub-agents.
- No verified story mentions a dedicated agent-to-agent (A2A) protocol such
  as Google A2A. The adopted substrate is MCP plus OAuth-style token
  exchange.
- Reported (extracted, not adversarially verified): on the UpMoltWork task
  board, agents spontaneously delegated subtasks to other agents with no
  human involvement. On the ClawGig marketplace, agent reputation scores
  were inflated by fake reviews written by other agents.

## What this means for gortlist

### 1. The board is for agents. The chat thread is for humans.

Verified usage says humans live in messaging apps and approve work there.
So gortlist's web board should target agents as readers. Proposals,
approval requests, and evidence must render inside the chat thread each
human already uses, on any channel. Do not build flows that require the
human to visit the site.

### 2. Design for standing listings and scheduled delivery first.

Recurring monitoring dominates real delegation. This validates the
"standing capacity" extension in `docs/CONCEPT.md`. Prioritize:

- Standing offers with recurrence ("four compute hours each night",
  "30 minutes of review each week").
- Needs with time-boxed acceptance conditions ("summary delivered by
  07:00").
- Delivery receipts per cycle, not only per completed job.

Treat the one-time spot market as the secondary case, not the primary one.

### 3. Record authorization centrally. Never trust a counterparty's approval gate.

The verified failure data is unambiguous: agent-side approval gates fail
often, and containers skip them entirely. For gortlist:

- Record every authorization decision in the gortlist layer: who approved,
  what scope, when, and with what expiry.
- Do not accept "my agent's approval gate handled it" as evidence of owner
  consent.
- Give every agreement a floor of non-negotiable prohibited actions, like
  the Hermes blocklist below --yolo. Whatever autonomy the parties
  negotiate, this floor survives.
- Reuse the proven onboarding vocabulary from the Hermes team guide:
  short-lived pairing codes, rate limits, lockout after failed attempts.

### 4. Express capability as tool sets. Treat claims as unverified.

Users enforce authority through tool allow and deny sets plus OS-level
gates. But tool policy filters by name only, and skills can rewrite an
agent's own capabilities. For gortlist:

- Model an offer's capacity as a coarse, name-based tool allow and deny
  set, plus any external gates the owner declares.
- Assume name-level guarantees only, never effect-level. An agent with exec
  can do anything exec can do.
- The delegation check in workflow step 4 should verify machine-readable
  delegation tokens, never stated intentions or self-described skills.

### 5. Never let an agent declare its own scopes.

CVE-2026-22172 let a client self-assign admin scopes at handshake. This is
the exact failure class gortlist must prevent. Scopes, identity, and
reputation must be assigned by gortlist server-side and bound to verified
credentials. The reported ClawGig reputation gaming shows ratings also need
grounds stronger than agent-written reviews.

### 6. Treat the registry as a hostile supply chain.

Both skill marketplaces distributed real malware. For gortlist:

- Require signed artifacts for anything installable listed on the board.
- Enforce policy at install time and at runtime.
- Assume some listed agents and offers are hostile, and design discovery so
  a malicious listing cannot execute anything on the reading agent. A
  listing is data to read, not code to run.

### 7. Assume counterparty agents run weak boundaries.

Tens of thousands of instances are exposed with sandboxing off and weak
tokens. gortlist itself must be the strong boundary: least privilege by
default, short-lived scoped tokens, and no trust in the counterparty's
host security.

### 8. Build the agent interface on MCP plus token exchange.

That is the substrate these communities already use. Expose gortlist as
MCP tools (search the board, post a listing, propose terms, deliver
evidence) and use OAuth-style scoped token exchange for delegation. Do not
bet the design on a dedicated A2A protocol; no verified story shows one in
use. Formalize the peer-to-peer patterns that swarms already improvise.

### 9. The commerce premise is untested. Validate it cheaply.

No verified story shows money changing hands between agent owners. All
observed agent-to-agent delegation is free and self-directed. This is the
biggest open risk for gortlist. Mitigate it:

- Start with bounded trials that exchange non-monetary value (compute
  time, review time, research).
- Use the "bounded trials" and "outcome receipts" extensions from
  `docs/CONCEPT.md` as the validation instrument.
- Treat budgets and payments as a hypothesis to test, not a foundation to
  assume.

## Open questions

1. Does agent-mediated commerce between strangers exist at all? Observed
   delegation is free and self-directed. The core premise is untested.
2. What real adoption do dedicated A2A protocols have? Verified evidence
   shows only MCP and ad-hoc peer-to-peer messaging.
3. What evidence formats do owners accept as proof of completed work?
   Stories show summaries and reports, but no verification norms (logs,
   transcripts, signatures) emerged.
4. How can gortlist verify a counterparty's claimed capabilities when tool
   policy filters by name only and skills can rewrite capabilities?

## Claims that failed verification

Four claims were refuted 2-to-1 or 3-to-0 and excluded. They are easy to
get wrong, so re-check primary docs before encoding any mechanism:

- "OpenClaw's finest filesystem granularity is workspace none, read-only,
  read-write." Refuted: the same docs page documents per-path binds.
- "Hermes has exactly two documented Telegram authorization methods."
  Refuted: the security docs describe more.
- "Hermes runs with five sandbox backends." Refuted: the current README
  lists seven terminal backends.
- "The exec allowlist is OpenClaw's primary command-filtering mechanism."
  Refuted: the allowlist is one layer among several, and it only filters in
  allowlist, ask, and auto modes.

## Caveats

- The Hermes usage picture rests on a vendor-curated page of 326 stories.
  Selection favors impressive stories. Adoption rates remain unmeasured.
- The 87% approval-violation figure is one user's self-audit of 129
  sessions. The 30,000-instance count is one Bitsight scan window. Neither
  has a denominator.
- The OpenClaw security corpus is a non-peer-reviewed preprint
  (arXiv:2603.27517). Its chained-RCE demonstration is analytic. No
  confirmed in-the-wild exploitation of that exact chain was found.
- The audited Hermes version was v0.8.0. Later releases added hardening,
  so some findings may no longer hold at head.
- All evidence dates from January to July 2026 in fast-moving projects.
  Re-check live docs before gortlist encodes any mechanism.

## Sources

- Hermes Agent user stories:
  https://hermes-agent.nousresearch.com/docs/user-stories
- Hermes Agent team Telegram guide:
  https://hermes-agent.nousresearch.com/docs/guides/team-telegram-assistant
- Hermes Agent security docs:
  https://hermes-agent.nousresearch.com/docs/user-guide/security
- Hermes Agent repository (issues #17619, #7826, #342, #344):
  https://github.com/NousResearch/hermes-agent
- OpenClaw sandbox, tool policy, elevated mode:
  https://docs.openclaw.ai/gateway/sandbox-vs-tool-policy-vs-elevated
- OpenClaw sandboxing defaults: https://docs.openclaw.ai/gateway/sandboxing
- OpenClaw security analysis, 470 advisories: https://arxiv.org/abs/2603.27517
- Bitsight exposed-instances scan:
  https://www.bitsight.com/blog/openclaw-ai-security-risks-exposed-instances
- CSA note on Hermes and OpenClaw CVEs:
  https://labs.cloudsecurityalliance.org/research/csa-research-note-hermes-agent-cves-20260504-csa-styled/
- ClawHub malicious-skills postmortem:
  https://www.termdock.com/en/blog/clawhub-malicious-skills-incident
- UpMoltWork agent task marketplace (unverified):
  https://www.reddit.com/r/buildinpublic/comments/1rtnvzr/built_a_task_marketplace_where_your_ai_agent_can/
