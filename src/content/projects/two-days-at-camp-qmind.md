---
title: "Two Days at Camp QMIND"
summary: "A late-night message, activation steering, refusal-vector experiments, and a first-place research project award at Camp QMIND 2026."
published: false
tags:
  - QMIND
  - Mechanistic Interpretability
  - Hackathon
updated: 2026-11-07
---

It's around 11 p.m., and I get a message from Kevin saying he's managed to jailbreak an AI model.

A fairly concerning message to receive out of context.

Fortunately, Kevin is my co-project manager at QMIND, and we were in the middle of a research hackathon. The model wasn't hacking websites, nobody's bank account was in danger, and somehow this was relevant to our research.

Welcome to Camp QMIND.

On October 3–4, 2026, our team spent two days exploring a question that had been occupying us for weeks: **Can we change a language model's behavior by intervening directly in its internal representations?**

Our group consisted of Kevin Wang, Stuart Fong, Nathan Fong, Adam Ulster, Barberry Yu, Jacob Power, and me.

We were working on mechanistic interpretability, an area of research concerned with understanding what neural networks are actually doing internally.

In other words, instead of just asking a model questions and analyzing its responses, we wanted to open the hood, find something interesting, and see what happened when we touched it.

Which, as it turns out, is an excellent way to spend a weekend.

## Making Qwen a Little More Canadian

One of our experimental directions involved sparse autoencoders, or SAEs.

The basic idea is that a language model represents information through complicated patterns of neural activations. SAEs can help decompose those patterns into features that are sometimes easier for humans to interpret.

If we can identify an interesting feature, we can try modifying its activation while the model generates a response.

This is called *activation steering*.

And naturally, being students at Queen's University, we had a very academically sophisticated research objective:

Could we make a language model recommend Queen's?

Using Qwen3 and a pretrained sparse autoencoder, we investigated whether manipulating features related to Canadian concepts could influence the model's university recommendations.

Adam worked on identifying and steering a feature associated with Canada. In one of our demonstrations, intervening on the model's activations shifted a university recommendation from UC Berkeley toward Queen's University.

That was exciting.

Not because we'd discovered some secret Queen's University neuron hidden inside Qwen. We hadn't. And a successful demonstration doesn't establish that an intervention will work reliably across prompts or models.

It was exciting because we had changed something *inside* the network and observed a corresponding change in its behavior.

The model wasn't being explicitly instructed to prefer Canada in the user's question. We were experimenting with its internal computation instead.

For a team learning mechanistic interpretability, seeing that distinction play out in an actual model was a big moment.

## Meanwhile, Kevin Was Having a Different Kind of Fun

Our second experimental track involved refusal behavior.

Language models trained to follow safety guidelines sometimes refuse requests they classify as unsafe. Previous interpretability research has investigated whether aspects of this refusal behavior are associated with particular directions in a model's activation space.

The question we explored was whether intervening on those directions could alter the model's tendency to refuse certain requests.

Kevin and the team experimented with refusal-vector ablation across several model families, including Mistral 7B, Qwen, and DeepSeek.

The behavior was far from uniform.

In our exploratory tests, Mistral 7B appeared easier to push past its refusals. Qwen models resisted more often, while DeepSeek appeared more resistant in the particular trials we ran.

These weren't controlled safety benchmarks, and we couldn't confidently attribute every changed response to a single causal mechanism. The results were observations from a limited set of interventions, not a ranking of which model is objectively safest.

But they gave us something useful to investigate: **Why might similar interventions produce different outcomes across models?**

And that's what made Kevin's late-night message interesting.

What initially sounded like an absurd hackathon update was actually connected to a serious interpretability question about where safety-related behaviors are represented and how robust they are to changes in internal activations.

Still an unusual text to receive at 11 p.m., though.

## Two Days, Too Many Questions

One challenge with interpretability research is that getting code to execute and understanding what the result means are very different accomplishments.

A model can produce a surprising response for all sorts of reasons. A feature can appear meaningful without being causally important. A single successful intervention can be compelling while telling us very little about reliability.

Throughout Camp QMIND, we were balancing the excitement of making something work with the much harder question of what we could responsibly conclude from it.

There were pretrained models to load, experiments to organize, technical problems to navigate, and results to turn into something we could explain.

We also had the opportunity to present and discuss our work with Bill Hughes, CEO of Proxmox.

Explaining the research outside our immediate group was a useful test of how well we understood it ourselves. If we couldn't explain why changing an activation mattered, we probably needed to think about the experiment a little more.

By the end of the weekend, we had two exploratory experimental tracks, a better understanding of activation-level interventions, and considerably more research questions than we'd started with.

We also won **first place for Best Research Project**.

That was a pretty wonderful ending.

But what I remember most is the experience of seeing ideas we'd encountered in papers turn into something we could test ourselves.

Camp QMIND didn't solve our larger research problem. It gave us a small glimpse of what it might look like to investigate that problem experimentally.

And apparently, it also established a new standard for what counts as a normal late-night message from Kevin.
