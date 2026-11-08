---
title: "Learning to See Inside Vision-Language Models"
summary: "From intimidating equations to content–style disentanglement: what I'm learning as an undergraduate research assistant at AIIM Lab."
published: false
tags:
  - Ingenuity Lab
  - Vision-Language Models
  - Representation Learning
updated: 2026-11-07
---

There's a particular kind of confidence you get after reading the abstract of a machine learning paper.

The problem sounds interesting. The proposed method makes sense. The results look promising.

Then you reach page four, encounter an equation with twelve symbols, and realize you might not understand the paper nearly as well as you thought.

I've become quite familiar with that experience.

I'm an undergraduate research assistant at AIIM Lab, part of Ingenuity Lab at Queen's University, where I work under the supervision of Yawar in a research environment led by Dr. Ali Etemad.

My work and reading have focused on vision-language models, representation learning, and the problem of disentangling content from style in visual data.

It's been one of my first sustained experiences with academic research, and it's changed the way I read papers, evaluate ideas, and think about what it actually means to understand a machine learning method.

## What Does an Image Know About Itself?

Consider two images of the same house.

One is a photograph. The other is a watercolor painting.

The subject is the same, but the visual presentation is completely different.

Humans can recognize that fairly easily. We understand that the house's identity is separate from the brushstrokes, texture, color palette, or photographic appearance used to depict it.

But how do we encourage a neural network to make that distinction?

This is the central idea behind *content–style disentanglement*.

Ideally, a model would learn representations that separate the semantic content of an image from its stylistic attributes. That separation could support tasks such as style transfer, image generation, or understanding the relationship between visual representations.

Of course, the actual problem is much more complicated.

What counts as content? What counts as style? Is color always stylistic, or can it be essential to an object's identity? How do we tell whether a model genuinely learned separate representations rather than exploiting shortcuts in its training data?

These are the kinds of questions that make representation learning interesting to me.

## The Part Where the Equations Fight Back

One of the first papers I studied was SCFlow, which investigates content–style disentanglement using a continuous-flow-based approach.

My initial presentation was too high-level.

I could explain the central idea, but the mathematical details needed considerably more attention.

That experience revealed a distinction I've since become much more conscious of: understanding *what* a paper claims to accomplish is not the same as understanding *how* its method accomplishes it.

The equations aren't decorative accessories placed in the middle of the paper to intimidate undergraduate students, although they occasionally do an excellent job of that.

They're the actual specification of the method.

I've been learning to approach papers by working through the architecture, the objective functions, and the role of individual components.

Why was this loss function chosen? What information is this representation supposed to preserve? Why is this module necessary? What happens if we remove it?

Those questions are much harder than producing a convincing summary of the introduction.

They're also far more useful.

## One Problem, Several Very Different Solutions

As I explored more of the literature, I became interested in how different approaches try to structure information within neural networks.

For example, StyleExpert-40K explores style representation through a system involving learned visual representations and a mixture-of-experts architecture.

A mixture-of-experts model uses multiple specialized components, with a routing mechanism determining which experts should contribute to a particular input.

It's an interesting architectural choice because not every visual style necessarily requires the same processing.

Studying systems like StyleExpert and MoE-ViE has pushed me to think more carefully about what specialization actually means inside a neural network, and how we might evaluate whether it is happening.

I've also worked on surveying datasets used in content–style disentanglement and related visual tasks.

That sounds straightforward until you start comparing what different datasets actually provide.

Some contain paired images with shared content and different styles. Others use reference images, generated samples, or curated combinations of objects and artistic styles.

Those differences matter. A method evaluated on carefully paired synthetic data may face different challenges when confronted with natural images, inconsistent style references, or imperfectly aligned examples.

Learning to evaluate a dataset's assumptions is just as important as learning to read a model architecture.

## Learning How to Ask Better Questions

Something I've discovered about academic research is that progress doesn't always look particularly impressive from the outside.

Sometimes it looks like spending an afternoon understanding why a paper uses one loss function instead of another.

Sometimes it's rebuilding your understanding of an architecture after realizing you misunderstood a diagram.

Sometimes it's preparing a presentation and discovering that the question you can't answer is the most important one on the slide.

I haven't authored the papers I've been studying, and I don't want to present other researchers' experimental results as my own. Much of my work at this stage involves literature analysis, technical presentations, understanding existing methods, and developing the foundations needed to conduct stronger research.

But that process has been valuable in a way I didn't fully appreciate when I started.

I'm becoming less interested in whether I can explain a paper quickly and more interested in whether I can defend my understanding of it.

Because when someone points to an equation and asks why it's there, I'd like to have a better answer than simply saying that the results looked good.

And increasingly, the equations I once wanted to skip are where I find the most interesting questions.
