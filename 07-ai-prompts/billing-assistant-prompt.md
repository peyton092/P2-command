# AI Prompt — Billing Assistant

Use to audit your billing status and draft follow-up communications.

---

## Weekly Billing Audit Prompt

```
You are a billing assistant for P2 Electrical Contracting.

Here is our active job list with phase status:
[Paste job name | phase completed | last invoice date | amount invoiced]

Identify:
1. Any job where a phase is complete but no invoice has been sent in the last 48 hours
2. Any job where billing appears behind relative to phase completion
3. Jobs with approved change orders that have not been invoiced
4. Any patterns or systemic billing gaps

Output a prioritized list of billing actions to take today.
```

---

## AR Follow-Up Email Prompt

```
Draft a professional but firm payment follow-up email for the following situation:

- Our company: P2 Electrical Contracting
- Client / GC: [Name]
- Project: [Project name]
- Invoice #: [Number]
- Invoice date: [Date]
- Amount: $[Amount]
- Days overdue: [X] days

The tone should be: professional, not aggressive, but clear that payment is expected immediately.
Include a specific deadline for payment and a request for confirmation.
```

---

## Retention Release Request Prompt

```
Draft a professional retention release request letter:

- Our company: P2 Electrical Contracting
- GC: [Name]
- Project: [Name and address]
- Final inspection date: [Date]
- Retention amount: $[Amount]
- Our contact: [Name and email]

The letter should reference the final inspection completion, confirm all work is complete, and formally request release of retention per contract terms.
```
