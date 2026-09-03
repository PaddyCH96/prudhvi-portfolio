---
title: "AI in fintech is the boring part, not the exciting part"
description: "Building a GST compliance engine taught me where an LLM belongs in a regulated financial workflow — and where it very much doesn't."
date: 2026-09-04
tags: ["fintech", "ai", "compliance"]
draft: true
---

> **Draft.** Written as a starting point — edit it into your own voice before
> publishing. Set `draft: false` in the frontmatter to publish. Drafts never
> appear in the production build.

Most "AI in fintech" content is about the flashy stuff. A chatbot that
answers your banking questions. A model that approves your loan in seconds.
That's not what I ended up building.

I'm working on [ComplianceOS](/projects/compliance-os/), a GST filing tool
for Indian SMEs. It's still MVP stage, still actively changing, so I'm not
claiming it's finished or proven at scale. But building even this much of it
taught me something I didn't expect: where an LLM actually belongs in a
regulated workflow, and where it really doesn't.

## Where the LLM goes

Invoices are messy. Scanned photos, inconsistent formats, GSTINs sitting in
a different spot depending on who printed the thing. That's a genuinely good
job for an LLM plus OCR — take a photo of paper and turn it into fields you
can query.

What it doesn't do is decide whether a filing is risky. That part — a 0 to
100 score, flagging anomalies before a GSTR-1 or GSTR-3B deadline — runs on
a plain rules engine. No model involved.

## Why I split it that way

Two reasons. One's about accuracy, the other isn't.

A hallucinated field in an extracted invoice is annoying, you fix it and
move on. A hallucinated risk score is a compliance problem that can reach a
tax authority. Those aren't the same kind of mistake, and I didn't want one
system treating them as if they were.

The other reason is being able to explain yourself. If something gets
flagged, the rules engine can say which rule fired and why, same input, same
output, every time. You can read the logic. An LLM's judgment isn't like
that by default, and "the model said so" isn't going to fly with a
compliance officer, let alone a regulator.

So it's not really "AI vs. no AI" here. The model turns mess into
structure. Rules turn structure into a decision. The model never gets a say
in the part that actually has consequences.

## What I'd actually argue

The "AI in fintech" that survives contact with regulation keeps the model in
the parsing layer and keeps the decision layer boring and auditable. Less
exciting than "AI approves your loan," sure. But it's the version that
doesn't fall apart the first time someone asks why.
