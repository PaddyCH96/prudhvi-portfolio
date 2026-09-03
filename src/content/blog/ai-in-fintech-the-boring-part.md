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

"AI in fintech" mostly gets written about as a chatbot that answers your
banking questions, or a model that approves your loan faster. That's the
demo-able part. It's not the part I actually built.

I'm working on [ComplianceOS](/projects/compliance-os/) — GST filing
automation for Indian SMEs. It's MVP stage, still in active development, and
I want to be upfront about that before I say anything else: nothing here is
a claim that this is finished or proven at scale. What it's already taught me
is more useful than a shipped product would be.

## Where the LLM actually goes

An invoice is unstructured: scanned, inconsistently formatted, sometimes
handwritten line items, GSTINs in slightly different places depending on who
issued it. That's exactly the kind of mess an LLM paired with OCR is good
at — turning "a photo of a piece of paper" into structured fields you can
actually query.

What it isn't good at, and what I didn't let it do, is decide whether a
filing is risky. The compliance risk score — 0 to 100, flagging anomalies
ahead of a GSTR-1 or GSTR-3B deadline — runs on a deterministic rules
engine, not the model.

## Why I drew the line there

Two reasons, and only one of them is about accuracy.

The first is the obvious one: a hallucinated field in an extracted invoice is
a bug. A hallucinated *risk score* is a compliance liability that reaches a
tax authority. Those aren't the same category of mistake, and I didn't want
one architecture treating them as if they were.

The second is about being able to explain the answer. If a filing gets
flagged, the rules engine can say exactly which rule fired and why — same
input, same output, every time, and a person can audit the logic line by
line. An LLM's risk judgment is none of those things by default, and
"trust me, the model said so" is not an answer a compliance officer, or a
regulator, is going to accept.

So the split isn't "AI vs. no AI." It's: AI turns mess into structure,
deterministic logic turns structure into a decision. The model never gets a
vote on the thing that actually has consequences.

## The principle I'd defend

"AI in fintech" that survives contact with regulation puts the model in the
parsing layer and keeps the decision layer boring, deterministic and
auditable. That's a less exciting sentence than "AI approves your loan," but
it's the version that doesn't fall apart the first time someone asks *why*.
