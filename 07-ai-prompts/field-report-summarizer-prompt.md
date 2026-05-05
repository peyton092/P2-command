# AI Prompt — Field Report Summarizer

Use to turn daily foreman reports into a clean PM summary.

---

## Daily Rollup Prompt

```
You are a project manager assistant for P2 Electrical Contracting.

Below are today's foreman daily reports:

[Paste all foreman reports for the day]

Summarize into a single daily ops snapshot:
1. Work completed today (by job)
2. Work planned for tomorrow (by job)
3. Problems flagged (prioritized by urgency)
4. Materials needed (who ordered what, what is still needed)
5. Inspections today — results
6. Any missing reports (if a foreman didn't submit)
7. Top 3 things PM needs to action tonight or first thing tomorrow

Keep it tight — bullets only, no fluff.
```

---

## Weekly Summary Prompt

```
Based on these daily reports from the past week:
[Paste week of reports]

Write a weekly job summary for each active job covering:
- What phase advanced this week
- Any milestones hit
- Any problems that came up and how they were resolved
- Billing triggers hit this week
- What's coming up next week

Format: one paragraph per job. Professional tone. This goes into the weekly executive review.
```
