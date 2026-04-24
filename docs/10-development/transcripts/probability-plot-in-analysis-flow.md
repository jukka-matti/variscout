---
title: Probability Plot in Analysis Flow
type: transcript
language: en
date: 2026-04-05
duration: 359.2s
status: raw
audience: [developer, product]
category: reference
---

# Probability Plot in Analysis Flow

Voice memo transcript (English, ~6 min). Thinking about where probability plots fit in the VariScout analysis workflow — using them to check if different subgroups follow similar distributions, deciding whether to create separate regression equations per region/product.

## Transcript

[00:00] Okay, something I'm thinking about is the usage of probability plots in combination
with the best-subsidized regression.

[00:14] So in this example of the sales analysis system, there were the different subgroups,
so it was built for different cities or areas, so one area was one subgroup.
And if we are looking at the different areas, and we are projecting sales per different
product type, for example, and then we have different factors for those, by the way,
I think we shouldn't limit our factor count now in the system to three, but I don't know,
up to seven to ten, I would say, something to be checked.

[01:08] So what I'm thinking is that it would make sense that you could do the overall best-subsidized
regression, and then you could do a new one if you are projecting it for the specific
area. So new, check which of the factors matter for this region, because the dynamics
in different regions might be different, right? And how to do that, or then that would
generate new factors for the different regions, so would that make architectural sense as
well from a practical point of view?

[02:06] And how does all that play out? And then, because
it could be the case for the different products, the configurations are different and the
thing I have been wondering about is the usage of probability plots and multiple probability
plots. So would it make sense, and where in this analysis flow should those be checked?

[02:41] So if I would do for different regions, in this case, should I do the new regression
equation for those, so I could use the probability plot by the factor, so have the
regions as one factor, and then check if those lines are about straight, so that confirms,
okay, these have the similar function, they have own function, and then that kind
of helps me to think that, hey, okay, now I perhaps should make these.

[03:22] And then,
on the other hand, if I'll do, and yeah, then if it doesn't, then it could become an algorithm,
okay, let's check for the different factors, do they have the same, what we have now in
the data set, and then just look visually, does it make sense, or do they have the
same distribution for different factors, like the different products, for example,
do they have straight lines, and if they do, then that could initiate this new
equation for them. So it's a bit different point of view from which point we are looking at.

[04:09] And then I think the system and the analysis point of view that you can have only one
of those split ups, and then go do the investigation from that angle throughout to the,
how do we call the suspected cost, and then it could become actually an algorithm, right,
that using Colesco and maybe something else, that which of these,
that if we have this making it a new algorithm, the new regression equations,
that what is the right angle for the analysis, then that could be done
iteratively, or maybe checking some values, and then that could say, okay, let's do it from
this angle if we really want to go.

[05:24] Just thinking out loud about the probability plots
could fit into the analysis flow, or then it is just that, hey, we do the
best-subsidized regression for the y, whatever it is, against the different factors,
and then once we have the equation, then we move into the EDA questions about the
individual factors, and there we do that. And maybe that's how it should go.
