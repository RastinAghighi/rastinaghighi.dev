import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Projects: one Markdown file per project in src/content/projects/.
//
// The schema holds content only. Layout and visual fields (colors, images,
// ordering, page paths) are deliberately absent until a design needs them.
// Every entry is checked against this schema, so a missing, mistyped or
// unknown field fails the build.
const projects = defineCollection({
  loader: glob({ base: './src/content/projects', pattern: '**/*.md' }),
  schema: z
    .object({
      title: z.string().trim().min(1),
      // Short plain-text description.
      summary: z.string().trim().min(1),
      // Required, with no default, so every entry states whether it is public.
      // Only entries with `published: true` may appear on the site.
      published: z.boolean(),
      // Optional metadata.
      tags: z.array(z.string().trim().min(1)).optional(),
      updated: z.coerce.date().optional(),
    })
    .strict(),
});

// Papers: one Markdown file per paper in src/content/papers/.
//
// Same minimal, strict content-only schema as Projects: a missing, mistyped
// or unknown field fails the build.
const papers = defineCollection({
  loader: glob({ base: './src/content/papers', pattern: '**/*.md' }),
  schema: z
    .object({
      title: z.string().trim().min(1),
      // Short plain-text description.
      summary: z.string().trim().min(1),
      // Required, with no default, so every entry states whether it is public.
      // Only entries with `published: true` may appear on the site.
      published: z.boolean(),
      // Optional metadata.
      tags: z.array(z.string().trim().min(1)).optional(),
      updated: z.coerce.date().optional(),
    })
    .strict(),
});

// Notes: one Markdown file per note in src/content/notes/.
//
// Same minimal, strict content-only schema as Projects and Papers: a missing,
// mistyped or unknown field fails the build.
const notes = defineCollection({
  loader: glob({ base: './src/content/notes', pattern: '**/*.md' }),
  schema: z
    .object({
      title: z.string().trim().min(1),
      // Short plain-text description.
      summary: z.string().trim().min(1),
      // Required, with no default, so every entry states whether it is public.
      // Only entries with `published: true` may appear on the site.
      published: z.boolean(),
      // Optional metadata.
      tags: z.array(z.string().trim().min(1)).optional(),
      updated: z.coerce.date().optional(),
    })
    .strict(),
});

export const collections = { projects, papers, notes };
