---
title: "The 'honest' number on my portfolio needed a second correction"
description: "I already walked one flattering stat back to an honest range. Turns out the honest range was still wrong — and the real finding underneath it is a better story than either number was."
date: 2026-09-04
tags: ["forecasting", "honesty", "portfolio"]
draft: true
---

> **Draft.** Written as a starting point — edit it into your own voice, or
> delete it and write something else. Set `draft: false` in the frontmatter to
> publish. Drafts never appear in the production build.

I had a number on my portfolio: **0.8–3.2% MAPE, 10–20× better than
baselines.** It was already a correction. The first version said 0.8–1.0%,
cherry-picked from the four cities with the cleanest data, and I'd walked
that back to the honest range across all 26.

Turns out the honest range wasn't honest either.

## What was actually wrong

Two features were leaking the target into the inputs. One normalised
today's AQI against today's own mean and standard deviation — algebraically
invertible, correlating **r = 1.000** with the exact value I was supposed
to be predicting. The other was a rolling mean whose window included the
current day, so "predict tomorrow" was quietly allowed to peek at tomorrow.

Fix both, rerun the backtest properly against a persistence baseline —
literally just assuming tomorrow looks like today — and the real finding
is not a MAPE range at all. It's that **persistence beats or ties the model
almost everywhere.** Across 6 cities and 4 forecast horizons, XGBoost only
reliably wins for Delhi, and only 1 to 3 days out.

## Why this correction is different from the first one

The first time, I'd narrowed a population to flatter a number — real data,
wrong framing. This time the number itself was manufactured by two lines of
feature-engineering code that shouldn't have existed. That's a worse
category of mistake, and I didn't catch it by being extra careful. I caught
it because a number that clean should have made me suspicious sooner than
it did.

The uncomfortable part isn't the bug. Bugs happen. It's that I'd already
gone through the exercise of "fixing" this once, felt satisfied I'd done the
honest thing, and stopped looking. The lesson from the first correction —
say the range, not the cherry-pick — didn't protect me from this. A more
honest-looking number is still just a number, and it can still be wrong for
reasons the honesty pass never checked for.

## The thing I'd tell a younger analyst, updated

Correcting a metric once feels like closing the loop. It isn't. The habit
that actually matters isn't "publish the honest range" — it's "keep
checking whether the range is real," on a schedule that doesn't stop the
first time you feel good about it.

The version of this project on my portfolio now doesn't lead with an
accuracy number at all. It leads with the finding that a naive baseline is
hard to beat, because that's what actually held up under a second look.
