---
title: "What 0.8% MAPE actually meant"
description: "My portfolio claimed a forecast accuracy I could only defend for four cities out of twenty-six. Here is why I changed the number upward instead of quietly leaving it."
date: 2026-08-24
tags: ["forecasting", "honesty", "portfolio"]
draft: true
---

> **Draft.** Written as a starting point — edit it into your own voice, or
> delete it and write something else. Set `draft: false` in the frontmatter to
> publish. Drafts never appear in the production build.

I had a number on my portfolio: **0.8–1.0% MAPE**. It was true. It was also
the four cities where the data was complete.

Across all twenty-six, the honest range is **0.8–3.2%**. Mumbai sits at 2.9%
with 227 days of training data. Kolkata is 3.2% on 206 days. Bengaluru, where
I had 1,362 days, comes in at 0.8%.

## Why I changed it

The flattering version would not have survived contact with anyone who opened
the repository — and the people I want to work for open the repository.

More than that, the range *is* the finding. The model is not inconsistent; the
data coverage is. Stating "0.8–3.2% across all cities, 0.8–1.0% where data is
complete" says something the cherry-picked number cannot: I know which of my
results I can defend, and why the others differ.

## The thing I would tell a younger analyst

A metric without its denominator is marketing. Every accuracy figure is really
a claim about a population, and the moment you quietly narrow that population
you have stopped reporting and started selling.

Say the range. Say the reason. It reads as rigour, not modesty.
