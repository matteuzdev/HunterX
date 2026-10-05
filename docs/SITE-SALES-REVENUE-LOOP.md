# Revenue Loop — Runtime Design

## Decision

Use HunterX as the operational runtime chassis for Site Sales OS.

Reason: HunterX already contains the expensive interaction surfaces that would otherwise be rebuilt:
- lead discovery;
- search history;
- CRM pipeline;
- Supabase persistence;
- WhatsApp inbox;
- QR / Evolution API integration;
- automation flows;
- AI agents;
- segment intelligence.

Agentic Site Sales OS remains the commercial method / skill layer. HunterX becomes the daily execution environment.

## Sales motion selected for first validation

### Proof-led + consultative hybrid

Use:
- proof-led opening for local SMB outreach;
- SPIN-inspired discovery after interest;
- MEDDIC-lite only where deal complexity justifies it.

Do not impose full enterprise MEDDPICC on a low-ticket local site sale.

## Closed loop

```text
HUNTERX SEARCH
→ DEDUPE / HISTORY
→ ENRICH
→ ICP / FIT
→ SALES STRATEGY
→ NEXT BEST ACTION
→ HUMAN APPROVAL (when required)
→ MESSAGE
→ REPLY EVENT
→ AI CLASSIFICATION
→ PROOF / DISCOVERY / FOLLOW-UP
→ PROPOSAL
→ WON / LOST
→ LEARNING EVENT
→ UPDATE PLAYBOOK
→ NEXT LEAD
```

## Automation boundary

AI may:
- research;
- summarize;
- classify;
- score;
- recommend;
- draft;
- choose among approved playbooks.

Deterministic system code owns:
- state;
- stage transitions;
- event history;
- retries;
- timers;
- permissions;
- metrics.

Human approval remains required initially for:
- first outbound message;
- discounts;
- guarantees;
- legal/contract terms;
- final proposal;
- unusual/high-risk actions.

As conversion evidence accumulates, selected low-risk steps can graduate from approval-required to automatic.

## Immediate implementation

1. Revenue strategy selector.
2. Next-best-action engine.
3. Visible revenue queue in Today/dashboard.
4. Event persistence.
5. Reply classifier.
6. Follow-up scheduler.
7. Proof task generator.
8. Proposal trigger.
9. Outcome learner.
10. Background orchestration.

## Background orchestration options

### Recommended first: database + scheduled/event worker

Keep Postgres/Supabase as source of truth and process due actions with a durable worker.

Candidate runtimes:
- Inngest;
- Supabase Queue/Cron/Edge Function;
- dedicated VPS worker.

The worker must be idempotent: the same event must not send the same message twice.

## Anti-loop rule

No agent-to-agent infinite chatter.

Every iteration must terminate in:
- external action;
- wait;
- human approval;
- measurable experiment;
- terminal state.

## Urgent revenue objective

The system is not considered validated until it completes a paid loop:

```text
20 qualified leads
→ real outreach
→ responses
→ proof
→ proposal
→ paid client
```
