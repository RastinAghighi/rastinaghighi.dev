# rastinaghighi.dev

Source repository for the personal portfolio website of Rastin Aghighi.

## Status

Early development. This repository currently contains only this README and a
`.gitignore`: there is no website code yet, nothing is deployed from it, and
no public chatbot deployment is confirmed.

## Planned direction

These are plans, not finished or verified features.

- **Website:** built with [Astro](https://astro.build/) as static HTML pages
  generated from Markdown content.
- **Hosting:** Cloudflare, with a Cloudflare Worker planned as the public API
  gateway for the site's chatbot. The specific Cloudflare products, plan
  limits and configuration are still being verified.
- **Chatbot:** served by a separate, private inference application. Hosting
  for it has not been chosen.

## Repositories

The project is split into two independent repositories:

| Repository | Visibility | Contents |
| --- | --- | --- |
| `rastinaghighi.dev` (this repository) | Public | Astro website, Cloudflare Worker API gateway, public content, site configuration and infrastructure documentation |
| `Mascot-Lab` | Private | Python inference application for the site's chatbot |

The two repositories are developed and deployed independently and are
intended to communicate only through a versioned, authenticated API. This
repository does not include the inference application's source code,
knowledge files, prompts or evaluation data, and will not copy them.

## License

No license has been chosen yet, so none is included. Until one is added, the
repository being public does not grant permission to reuse, modify or
redistribute its code, original visual assets or any third-party material in
it, beyond what GitHub's Terms of Service allow (such as viewing and forking
on GitHub).
