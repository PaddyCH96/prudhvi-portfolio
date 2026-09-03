---
title: "I'm not sure my healthcare project counts as 'AI'"
description: "A forecasting dashboard for a mental health provider's clinical team, built as an intern. Small, real, useful — and I'm genuinely unsure it deserves the label I'm about to put on it."
date: 2026-09-04
tags: ["healthcare", "ai", "forecasting"]
draft: true
---

> **Draft.** Written as a starting point — edit it into your own voice before
> publishing. Set `draft: false` in the frontmatter to publish. Drafts never
> appear in the production build.

As a data analyst intern at Stride Mental Health in Brisbane, I built a
pipeline over roughly 500 NDIS participant records and put a Power BI
forecasting dashboard on top of it, for the clinical team to plan staffing
against. It raised resource allocation accuracy by 15% over what they had
before.

That's the project. Now the part I keep going back and forth on: is that
"AI in healthcare," or is it just forecasting with a label attached?

## What it actually was

No model touched a patient record's clinical content. Nothing diagnosed
anything, nothing looked at outcomes. The pipeline cleaned up data that had
been sitting around in a form nobody could easily query. The dashboard
turned "we think we're short-staffed next month" into a number the team
could act on.

Whether that's "AI" depends on what's actually driving the forecast under
the hood, and honestly, at intern scale, on a small provider's data, it's
closer to structured trend analysis than anything I'd confidently call
machine learning. I'm not going to dress it up as more sophisticated than it
was to make the title work.

## Why I'm writing about it anyway

Because I think the honest answer is that a lot of "AI in healthcare" work,
in practice, sits exactly here. Not the diagnostic models making headlines.
Something closer to: decent forecasting, applied to a boring operational
question, that a service actually uses. Whether you call the method AI or
just statistics is almost beside the point next to whether it changed how a
team planned their week.

A clinical team that isn't scrambling to cover a caseload it didn't see
coming has more attention left for the people in front of them. That's real
value, and it didn't need a sophisticated model to produce it. It needed
clean data and a dashboard someone actually opened.

## Where I land

If "AI in healthcare" is going to mean something, it probably shouldn't
stretch to cover every dashboard with a trend line on it. But I also don't
think the honest, unglamorous version of this work — forecasting, not
diagnosing — should get dismissed just because it doesn't need the label to
be useful. I'd rather undersell what I built and have it hold up than call
it AI and have someone ask what model I used.
