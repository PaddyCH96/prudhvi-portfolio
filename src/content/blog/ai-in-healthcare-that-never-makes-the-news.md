---
title: "The AI in healthcare that never makes the news"
description: "The headlines are about AI reading scans. My healthcare project was a forecasting dashboard for a mental health provider's clinical team — smaller, less glamorous, and honestly the part I trust more."
date: 2026-09-04
tags: ["healthcare", "ai", "forecasting"]
draft: true
---

> **Draft.** Written as a starting point — edit it into your own voice before
> publishing. Set `draft: false` in the frontmatter to publish. Drafts never
> appear in the production build.

Search "AI in healthcare" and you get diagnostic models — AI reading scans,
flagging tumours, triaging symptoms. That's real work, and it's not mine to
claim. What I actually built, as a data analyst intern at Stride Mental
Health in Brisbane, was much smaller: an end-to-end pipeline over roughly
500 NDIS participant records, feeding a Power BI forecasting dashboard for
the clinical team.

I want to be precise about scope here, because healthcare is exactly the
domain where vague claims do real damage. I did not touch a clinical
decision. Nothing I built diagnosed anything, recommended a treatment, or
looked at a patient outcome. It forecast *resourcing* — the unglamorous
question of which clinicians and how much capacity a service needs, and
when.

## What it actually did

The pipeline cleaned and structured participant data that had been sitting
in a form nobody could query easily. The dashboard on top of it gave the
clinical team a forecast they could act on for staffing and scheduling,
raising resource allocation accuracy by 15% against what they'd had before.

That's it. No model touched a patient record's clinical content. The value
was entirely in turning "we think we're short-staffed next month" into a
number the team could plan against.

## Why I think this matters more than it sounds like

Diagnostic AI carries enormous stakes — it needs clinical validation,
regulatory clearance, and years of trust-building before it should be
anywhere near a patient. That bar exists for good reason, and it's slow to
clear on purpose.

Operational forecasting doesn't carry that bar, and it's still real
capacity given back to a service. A clinical team that isn't scrambling to
cover a caseload they didn't see coming has more attention left for the
patients in front of them. Nobody writes a headline about a workforce
forecast, but it's some of the most immediately deployable value AI-adjacent
work has in healthcare right now — precisely because it never gets near the
clinical decision at all.

## The distinction I'd want anyone reading this to keep

"AI in healthcare" is doing a lot of work covering two very different
things: models that make or influence clinical judgments, and models that
make the operations *around* clinical judgment less painful. I've only ever
worked on the second one, at a small scale, and I think that distinction is
worth being loud about — both because it's the honest description of what I
did, and because collapsing the two is how "healthcare AI" ends up meaning
everything and nothing.
