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

Search "AI in healthcare" and you get diagnostic models. AI reading scans,
flagging tumours, triaging symptoms. That's real, important work and it's
not mine to claim credit for. What I actually built, as a data analyst
intern at Stride Mental Health in Brisbane, was a lot smaller: a pipeline
over roughly 500 NDIS participant records, feeding a Power BI dashboard the
clinical team used for forecasting.

I want to be clear about the scope, because healthcare is exactly the place
where vague claims cause real problems. I never touched a clinical
decision. Nothing I built diagnosed anything or looked at patient outcomes.
It forecast resourcing, basically: which clinicians and how much capacity
the service needed, and when.

## What it actually did

The pipeline cleaned up participant data that had been sitting around in a
form nobody could easily query. The dashboard on top gave the clinical team
a forecast they could plan staffing against, and it raised resource
allocation accuracy by 15% over what they had before.

That's the whole thing. No model near a patient record's clinical content.
The value was just turning "we think we're short-staffed next month" into
an actual number.

## Why I think it matters anyway

Diagnostic AI carries huge stakes. It needs clinical validation, regulatory
sign-off, years of trust built up before it should go near a patient. That
bar is high on purpose, and it should stay that way.

Operational forecasting doesn't carry that bar, but it's still real
capacity handed back to a service. A clinical team that isn't scrambling to
cover a caseload it didn't see coming has more attention left for the
people in front of them. Nobody writes a headline about a workforce
forecast. But it might be some of the most usable AI-adjacent work in
healthcare right now, precisely because it never goes near the clinical
call at all.

## The distinction worth keeping

"AI in healthcare" covers two really different things: models that make or
shape clinical judgments, and models that make the work around clinical
judgment less painful. I've only ever worked on the second, at a small
scale, and I think that distinction matters. It's the honest description of
what I did. And blurring the two is how "healthcare AI" ends up meaning
everything and, functionally, nothing.
