---
title: "Inside the Reasoning Process"
summary: "What happens inside a language model when it reasons, makes mistakes, or corrects itself? An inside look at our ongoing QMIND mechanistic interpretability project."
published: false
tags:
  - Mechanistic Interpretability
  - Test-Time Reasoning
  - QMIND
updated: 2026-11-07
---

A language model can solve a math problem, explain every step, and arrive at the correct answer.

Great. But I have a slightly more annoying question.

**What actually happened inside the model?**

When a language model produces a chain of thought, it gives us something that *looks* like reasoning. There are intermediate steps, calculations, corrections, and occasionally a spectacularly confident wrong answer. It's tempting to treat that explanation as a window into the model's thinking.

The problem is that generating an explanation and performing the computations behind it aren't necessarily the same thing.

I want to understand the second part.

That's the question behind **Mechanistic Interpretability of Test-Time Reasoning in Large Language Models**, a research project I co-lead with Kevin Wang at QMIND, Queen's University's undergraduate AI organization.

Together, we manage a seven-member team trying to understand what happens inside language models as they reason, make mistakes, and occasionally manage to correct themselves.

## Looking Under the Hood

Mechanistic interpretability is an attempt to understand neural networks by studying their internal computations rather than judging them exclusively by their outputs.

Imagine asking a model to solve a mathematical problem. It might produce ten reasonable-looking steps and then make an arithmetic mistake on the eleventh.

Why there? Did its internal representation of the problem change? Was there an earlier error that only became visible later? Could we have identified the mistake before the final answer?

And here's the question I find particularly interesting: **Does the model internally represent uncertainty even when its answer sounds completely confident?**

One of the tools we're exploring to investigate these questions is the sparse autoencoder, or SAE.

Language models represent information in enormous collections of numerical activations. Individual neurons aren't necessarily cleanly associated with concepts, and many different features can be mixed together.

SAEs try to decompose those complicated activation patterns into a larger collection of sparsely active features. Some features may correspond to interpretable concepts or behaviors, making the model's internal activity easier to study.

Of course, finding a feature that correlates with something interesting doesn't automatically tell us what it *does*.

That's where causal interventions become important.

If a feature seems associated with a particular reasoning behavior, we can investigate what happens when we suppress, amplify, or otherwise modify the relevant activation. Does the model's behavior change in the way our hypothesis predicts? Does the effect hold across different questions?

The difference between observing a correlation and establishing a causal mechanism is a big part of what makes this research challenging.

## Turning Questions Into Experiments

Our planned research involves models such as Qwen-2.5-Math-7B and DeepSeek-R1-Distill-Llama-8B, with tools including SAELens and TransformerLens.

We're interested in examining their internal representations across reasoning benchmarks such as GSM8K and MATH, looking for patterns related to intermediate reasoning steps, uncertainty, and error correction.

One potential direction is investigating confident-but-wrong reasoning: cases where a model gives an incorrect answer without any obvious hesitation.

Another is self-correction. When a model recognizes an error and changes its approach, can we identify the internal computations associated with that change?

Eventually, we'd like to test whether the mechanisms we identify generalize across models, rather than being artifacts of a particular architecture or training procedure.

These are research questions, not discoveries we're claiming to have made. We're still developing the experimental methodology and figuring out how to distinguish genuinely meaningful features from attractive but misleading interpretations.

And, naturally, there's the small issue of actually running the models.

We learned fairly quickly that having a GPU-intensive research plan and having access to GPUs are two different achievements.

Cloud GPU quotas, model memory requirements, and compute costs have all become part of the process. At one point, our RunPod compute expenses reached roughly $80 overnight. Nothing makes you think carefully about experimental design quite like realizing that your GPU is charging you while you sleep.

## Research Is Also a Team Sport

One of my favorite parts of this project has been working with the team.

We're undergraduates reading papers on superposition, sparse autoencoders, chain-of-thought reasoning, and inference-time computation, then trying to translate those ideas into experiments we can actually run.

My role isn't simply to distribute tasks or organize meetings. It's to help turn a collection of interesting papers into a coherent research direction, challenge our assumptions, and make sure we understand *why* we're performing an experiment before we start spending GPU hours on it.

A successful meeting doesn't necessarily end with everyone agreeing. Sometimes it ends with a better question, a questionable assumption exposed, or the realization that an experiment needs a proper control.

I increasingly think that's what learning to do research looks like.

We haven't discovered a universal reasoning circuit. We don't have a magical switch that makes language models reliably correct themselves.

What we have is a set of questions that I find genuinely difficult to stop thinking about.

A model gets an answer right. Another gets it wrong. A third makes a mistake, notices something is off, and changes direction.

I don't just want to compare their final answers.

**I want to understand what happened in between.**
