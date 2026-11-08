---
title: "Two Days at Camp QMIND"
summary: "Two days of activation-level experiments at Camp QMIND 2026: steering Qwen3 with sparse-autoencoder features, ablating refusal directions across model families, and a first-place award for Best Research Project."
published: false
tags:
  - QMIND
  - Mechanistic Interpretability
  - Hackathon
updated: 2026-11-08
---

It's around 11 p.m., and I get a message from Kevin saying he's managed to jailbreak an AI model.

Out of context, that's a fairly concerning message to receive.

Fortunately, Kevin Wang is my co-project manager at QMIND, and we were in the middle of a research hackathon. The model wasn't hacking websites, nobody's bank account was in danger, and somehow this was relevant to our research.

Welcome to Camp QMIND.

On October 3–4, 2026, our team spent two days on a question that had been occupying us for weeks:

**Can we change a language model's behavior by intervening directly in its internal representations?**

## At a Glance

- **Event:** Camp QMIND 2026, a two-day research hackathon (October 3–4, 2026)
- **Team:** Kevin Wang, Stuart Fong, Nathan Fong, Adam Ulster, Barberry Yu, Jacob Power, and me
- **My role:** Co-project manager, alongside Kevin Wang
- **Track 1:** Sparse-autoencoder feature steering on Qwen3; Adam Ulster worked on the Canada-related feature
- **Track 2:** Refusal-vector ablation across model families including Mistral 7B, Qwen, and DeepSeek, run by Kevin Wang's group
- **Outcome:** First place for Best Research Project

## Opening the Hood

We were working on mechanistic interpretability: research concerned with understanding what neural networks are actually doing internally.

Instead of just asking a model questions and analyzing its responses, we wanted to open the hood, find something interesting, and see what happened when we touched it.

Which, as it turns out, is an excellent way to spend a weekend.

We pursued that question along two exploratory tracks.

A quick note on credit, since "we" covers a lot of people in this post. Kevin and I were the team's co-project managers. Adam worked on the Canada-related feature steering, and Kevin's group ran the refusal-vector experiments. The results below are the team's work, and I've tried to say who did what.

## Track 1: Making Qwen a Little More Canadian

A language model represents information through complicated patterns of neural activations. Sparse autoencoders (SAEs) can help decompose those patterns into features that are sometimes easier for humans to interpret.

Once you've identified an interesting feature, you can try modifying its activation while the model generates a response, then see what changes. This is called *activation steering*.

And naturally, being students at Queen's University, we had a very academically sophisticated research objective:

**Could we make a language model recommend Queen's?**

Using Qwen3 and a pretrained sparse autoencoder, we investigated whether manipulating features related to Canadian concepts could influence the model's university recommendations.

Adam worked on identifying and steering a feature associated with Canada. In one of our demonstrations, intervening on the model's activations shifted a university recommendation from UC Berkeley toward Queen's University.

That was exciting, though not because we'd discovered a secret Queen's University neuron hidden inside Qwen. We hadn't. A single successful demonstration doesn't establish that an intervention will work reliably across prompts or models.

It was exciting because the user's question never explicitly instructed the model to prefer Canada. We changed something *inside* the network, in its internal computation, and observed a corresponding change in its behavior.

For a team learning mechanistic interpretability, seeing that distinction play out in an actual model was a big moment.

## Track 2: Testing Refusal Directions

Meanwhile, Kevin's group was having a different kind of fun.

Language models trained to follow safety guidelines sometimes refuse requests they classify as unsafe. Previous interpretability research has investigated whether aspects of this refusal behavior are associated with particular directions in a model's activation space.

Kevin's group explored whether intervening on those directions could alter a model's tendency to refuse certain requests. They experimented with *refusal-vector ablation*, which removes a refusal-associated direction from the model's activations, across several model families, including Mistral 7B, Qwen, and DeepSeek.

The behavior was far from uniform. In the group's exploratory tests, Mistral 7B appeared easier to push past its refusals, while the Qwen and DeepSeek models resisted more often in the particular trials they ran.

These weren't controlled safety benchmarks, and we couldn't confidently attribute every changed response to a single causal mechanism. The results were observations from a limited set of interventions, not a ranking of which model is objectively safest.

But they gave us something useful to investigate: **Why might similar interventions produce different outcomes across models?**

That's what made Kevin's late-night message interesting. What initially sounded like an absurd hackathon update was connected to a serious interpretability question: where are safety-related behaviors represented, and how robust are they to changes in internal activations?

Still an unusual text to receive at 11 p.m., though.

## What We Could, and Couldn't, Conclude

In interpretability research, getting code to execute and understanding what the result means are very different accomplishments.

A model can produce a surprising response for all sorts of reasons. A feature can appear meaningful without being causally important. A single successful intervention can be compelling while telling us very little about reliability.

Throughout Camp QMIND, we were balancing the excitement of making something work with the much harder question of what we could responsibly conclude from it. There were pretrained models to load, experiments to organize, technical problems to navigate, and results to turn into something we could explain.

## Presenting the Work

We had the opportunity to present and discuss our work with Bill Hughes, CEO of Proxmox North America Inc.

Explaining the research outside our immediate group was a useful test of how well we understood it ourselves. If we couldn't explain why changing an activation mattered, we probably needed to think about the experiment a little more.

By the end of the weekend, we had two exploratory experimental tracks, a better understanding of activation-level interventions, and considerably more research questions than we'd started with.

We also won **first place for Best Research Project**.

That was a pretty wonderful ending.

## What Stayed With Me

What I remember most is seeing ideas we'd encountered in papers turn into something we could test ourselves.

Camp QMIND didn't solve our larger research problem. It gave us a small glimpse of what it might look like to investigate that problem experimentally.

And apparently, it also established a new standard for what counts as a normal late-night message from Kevin.
