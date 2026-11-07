# Chat API v1: public contract

| | |
|---|---|
| **Status** | **PROPOSED.** Not owner-approved. Nothing in this document is implemented, configured or deployed. |
| **Date** | 2026-11-06; revised 2026-11-07 |
| **Applies to** | `POST /api/chat/v1` between the rastinaghighi.dev website (browser and Cloudflare gateway) and the private inference application (Mascot-Lab) |
| **Machine-readable parts** | [`schemas/chat-request-v1.schema.json`](schemas/chat-request-v1.schema.json) and [`schemas/chat-response-v1.schema.json`](schemas/chat-response-v1.schema.json) (JSON Schema Draft 2020-12); [`examples/`](examples/) |

Labels used below: **PROPOSED** marks a choice this document makes, pending owner approval. **OPEN** marks a question that needs an owner decision or a measurement; all are listed in [§21](#21-open-decisions). **PROVISIONAL** marks a value taken over from the inference application's own provisional configuration.

This document defines a contract only. It does not define or authorize an HTTP server, a Cloudflare Worker, frontend code, a model-serving service, a hostname, a page URL or a deployment.

## 1. At a glance

- **One endpoint:** `POST /api/chat/v1`, JSON in and JSON out. The hostname and the Cloudflare routing method are OPEN.
- **One request field:** `message`, 1 to 1,000 characters. Every other field is rejected.
- **One response shape for every outcome:** `request_id`, `status`, `answer_text`, `cloud_preview`, `continuation`, `actions` and `error`, and nothing else.
- **Five public statuses:** `answered`, `navigation` and `refused` (HTTP 200), `error` (HTTP 4xx) and `unavailable` (HTTP 429 or 5xx).
- **Navigation by semantic route ID only,** from a fixed allowlist. A route ID is never a URL; only the website maps IDs to pages.
- **Complete, validated answers:** an answer is sent only after the inference application has validated the whole text. v1 does not stream; streaming remains an OPEN requirement ([§15](#15-streaming-open)).
- **Structure is not safety:** the schemas check structure only. The origin enforces output safety, and the origin and the gateway both run the checks that the schemas cannot express ([§18](#18-schema-and-runtime-validation)).
- **Single-turn:** every request is answered on its own, and the model never sees earlier messages ([§14](#14-conversation-model-and-the-mascot-page)).
- **Two trust boundaries:** anonymous browser to gateway, and authenticated gateway to origin. The browser never holds a credential ([§13](#13-authentication-and-trust-boundaries)).

## 2. Basis and scope

The contract is derived from:

1. **The inference application as it exists,** inspected read-only on 2026-11-06 and again on 2026-11-07. Every value below that is taken from it, such as the input limit, the cloud size, the action types, the continuation reasons and the route IDs, was checked against its source and configuration.
2. **The November 4, 2026 design plan,** for the chatbot's product behavior.
3. **The backend master plan** (v0.3, sections 7 to 9), for the gateway's responsibilities, the proposed status set and HTTP codes, and the trust model.

Both planning documents are private and are not reproduced here.

What the engine does today, and what follows from it:

| The engine today | Consequence for this contract |
|---|---|
| Handles one message per call and keeps no conversation history | Single-turn; no history or session fields ([§14](#14-conversation-model-and-the-mascot-page)) |
| First normalizes the message and refuses an empty one or one longer than 1,000 characters (PROVISIONAL) | `message` limit of 1,000; error codes `empty_input` and `input_too_long` |
| Answers navigation commands deterministically and without the model, using only allowlisted route IDs | `navigation` and `refused` responses need no model; actions come only from the allowlist ([§10](#10-navigation-routes)) |
| Calls the model runtime without streaming, then validates the complete answer | Non-streamed v1 ([§15](#15-streaming-open)) |
| Gives every outcome a display text, a cloud preview, an optional continuation and allowlisted actions | These four fields are the public payload |
| Also keeps internal records and diagnostics, which are not written for visitors | Never published ([§16](#16-data-that-never-leaves-the-origin), [§17](#17-public-error-message-restrictions)) |

The wire format needs no change to the engine. A future HTTP adapter in the inference application maps the engine's results to this contract ([§8.2](#82-the-origin-boundary)) and, together with the engine, meets the origin's runtime requirements ([§18](#18-schema-and-runtime-validation)).

## 3. Architecture and trust boundaries

```text
Visitor's browser  (untrusted; holds no credential)
   │  HTTPS  POST /api/chat/v1                      Boundary 1: public, anonymous
   ▼
Cloudflare gateway  (a Worker, planned; website repository)
   │  validates the request, applies admission control, assigns the request ID,
   │  authenticates to the origin, re-validates the origin's response
   │  HTTPS + gateway credential                    Boundary 2: private, authenticated
   ▼
Inference origin  (HTTP adapter around the existing engine; Mascot-Lab repository; host OPEN)
   │  re-validates the request, runs the engine, builds and checks the public body
   │  loopback only
   ▼
Model runtime  (never reachable from outside the origin host)
```

| Component | Trusted to | Never holds or receives |
|---|---|---|
| Browser | Render text and map route IDs to the site's own pages | Credentials, the origin's address, prompts, private facts |
| Gateway | Enforce the request rules, quotas and deadlines; assign request IDs; authenticate to the origin; re-validate the structure and consistency of responses; normalize errors | Prompts, private facts, internal engine records |
| Origin | Run the engine, which applies the private instruction and facts; enforce output safety; build the public response from the allowlist and check it ([§18](#18-schema-and-runtime-validation)) | Visitor identifiers such as IP addresses or cookies ([§13.1](#131-boundary-1-browser-to-gateway-public)) |
| Model runtime | Generate text | Any network exposure |

## 4. Endpoint

| Item | Value |
|---|---|
| Method | `POST` |
| Path | `/api/chat/v1` (PROPOSED; the backend master plan's placeholder) |
| Host and routing | OPEN: a same-origin route on the site's host, or a separate API host with CORS (API-01) |
| Request `Content-Type` | `application/json`, optionally with `charset=utf-8` and no other parameter |
| Request `Content-Encoding` | None. Compressed bodies are rejected. |
| Query string | None. A request with a query string is rejected, so message text is never accepted in a URL. |
| Response `Content-Type` | `application/json; charset=utf-8`, for every response |
| Response headers | `Cache-Control: no-store` on every response; `X-Content-Type-Options: nosniff`; `Allow: POST` on 405; `Retry-After` on 429 when the wait is known |
| Visitor authentication | None: no account, cookie or API key. The site's script sends requests with `credentials: "omit"`, and the gateway ignores any cookie and never forwards one. |

The gateway builds every response to the browser itself. It never forwards the origin's response headers, which could name the host, vendor or software.

Other methods on this path receive 405. `OPTIONS` is answered only if a separate API host is chosen (CORS preflight). In that case the gateway allows exactly the approved site origins (never `*`), sends no `Access-Control-Allow-Credentials` and adds `Vary: Origin`. With a same-origin route, no CORS headers are sent at all. Paths other than this one are outside the contract.

## 5. Request

```json
{ "message": "What kinds of projects are featured on this site?" }
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `message` | string | yes | 1 to 1,000 characters (PROVISIONAL), counted as Unicode code points as sent; at least one non-whitespace character; well-formed Unicode, so no unpaired surrogates; plain text, where line feeds and tabs are allowed and the origin removes other control and format characters ([§6.2](#62-origin)) |

**Rejected with HTTP 400 `invalid_request`:** any other member; a body that is not a JSON object; a `message` that is not a string, including `null`. These members are named so that their absence is clearly intentional:

| Rejected members | Why |
|---|---|
| `history`, `messages`, `context`, `conversation_id`, `session_id` | The engine is single-turn; the API has no memory or session ([§14](#14-conversation-model-and-the-mascot-page)) |
| `model`, `options`, `temperature`, `system`, `prompt` | Only the origin chooses the model, its settings and its instruction |
| `stream` | v1 is not streamed |
| `url`, `route`, `route_id`, `action` | Navigation is decided only by the application's allowlist |
| `request_id`, `client_request_id` | Request IDs are assigned by the gateway ([§11](#11-request-ids)) |
| `user`, `metadata` | No visitor identity or free-form data is collected |

**Limits**

| Limit | Value | Enforced by |
|---|---|---|
| `message` length | 1,000 code points (PROVISIONAL) | The gateway, on the message as sent; the origin, as sent and again after normalization |
| Request body | 8,192 bytes (PROPOSED) | Gateway and origin, counted while reading |

The body limit covers every valid message written by a standard JSON serializer such as the browser's `JSON.stringify`. Such a serializer writes each code point in at most 6 bytes (a `\u` escape for a control character, otherwise at most 4 bytes of UTF-8), so 1,000 code points and the 14 bytes of structure need at most 6,014 bytes. Bodies padded with whitespace or written entirely as escape sequences can exceed the limit and are rejected with 413.

"Character" means a Unicode code point, as in JSON Schema. JavaScript's `String.prototype.length` counts UTF-16 code units instead, so a gateway written in JavaScript must count code points (for example by iterating over the string); otherwise characters outside the Basic Multilingual Plane, such as most emoji, count twice. The browser should count the same way for its input limit and trim surrounding whitespace before sending.

## 6. Request validation

### 6.1 Gateway

The gateway applies these steps in order and stops at the first failure. Every rejection receives the standard response body ([§7](#7-response)).

| # | Check | On failure |
|---|---|---|
| 1 | The method is `POST` (or `OPTIONS`, if CORS is adopted) | 405 `invalid_request`, with `Allow: POST` |
| 2 | The URL has no query string | 400 `invalid_request` |
| 3 | If an `Origin` header is present, it is an approved site origin | 403 `invalid_request` |
| 4 | `Content-Type` is `application/json`, with charset `utf-8` if one is given; there is no `Content-Encoding` other than `identity` | 415 `invalid_request` |
| 5 | The body has at most 8,192 bytes. A larger `Content-Length` is refused at once, and bytes are counted while reading, never trusting the header alone. | 413 `invalid_request` |
| 6 | The body is valid UTF-8 without a byte-order mark | 400 `invalid_request` |
| 7 | The body parses as JSON (RFC 8259). Duplicate member names are rejected where the parser can detect them. | 400 `invalid_request` |
| 8 | The value has the request schema's structure: an object whose only member is `message`, a string | 400 `invalid_request` |
| 9 | `message` contains no unpaired surrogate (for example, `String.prototype.isWellFormed()` in JavaScript; in Python, no code point from U+D800 to U+DFFF) | 400 `invalid_request` |
| 10 | `message` is not empty and contains a non-whitespace character | 400 `empty_input` |
| 11 | `message` has at most 1,000 code points | 400 `input_too_long` |
| 12 | Admission control: kill switch, per-visitor limits, global budget, concurrency | 503 `unavailable` or 429 `rate_limited` ([§12](#12-deadlines-unavailability-and-retries)) |

A per-visitor limit may count every request, valid or not, and answer 429 at any step. Only requests forwarded to the origin count toward the generation budget, so an invalid request never consumes it.

Step 9 protects the origin. A JSON parser accepts an escaped unpaired surrogate such as `"\ud800"`, but such a string cannot be encoded as UTF-8 when the origin builds its request to the model runtime. Without the check, the request would end in an unexpected internal error instead of a clean 400.

**Forwarding.** The gateway sends the origin a newly serialized body, `{"message": <the validated string>}`, never the client's raw bytes. The origin therefore sees exactly the value the gateway validated, and parser differences (duplicate members, escapes, whitespace) cannot matter. The gateway adds the request ID and its authentication material ([§13.2](#132-boundary-2-gateway-to-origin-private)) and nothing taken from the client's request headers.

### 6.2 Origin

| # | Check | On failure |
|---|---|---|
| O1 | Authenticate the gateway ([§13.2](#132-boundary-2-gateway-to-origin-private)) before parsing the body. A bounded read to check a signature is allowed. | Rejected without running the engine, with a generic response that does not say why (status code OPEN, API-02) |
| O2 | Repeat steps 1, 2 and 4 to 11; check that the request ID is present and well formed ([§11](#11-request-ids)) | The same status and code as at the gateway |
| O3 | The engine normalizes the message: line endings become LF; control characters other than line feed and tab, and invisible format characters (Unicode category Cf), are removed; surrounding whitespace is trimmed. An empty result gives `empty_input`, and more than 1,000 characters gives `input_too_long`. | 400 |
| O4 | The engine routes the message, loads knowledge, calls the model and validates the output; the adapter builds the public response and checks it | [§8](#8-statuses-and-the-origin-boundary), [§18](#18-schema-and-runtime-validation) |

Because the origin also checks the normalized message, a few messages pass the gateway and are refused only by the origin: one made only of zero-width characters, for example, gives 400 `empty_input`. Conversely, the gateway's check on the message as sent is stricter than the engine's check after normalization. A message of 1,000 characters plus trailing spaces is refused at the gateway, which is why the browser trims first.

## 7. Response

Every response from the endpoint, successful or not, has exactly these members, and all of them are always present:

| Field | Type | Content |
|---|---|---|
| `request_id` | string, 36 characters | The gateway's identifier for this request ([§11](#11-request-ids)) |
| `status` | `answered` \| `navigation` \| `refused` \| `error` \| `unavailable` | The public outcome ([§8](#8-statuses-and-the-origin-boundary)) |
| `answer_text` | string, 1 to 4,000 characters | The complete display text: the validated model answer for `answered`, otherwise a fixed application text |
| `cloud_preview` | string, 1 to 137 characters | The start of `answer_text`, sized for the thought cloud; identical to `answer_text` when that fits |
| `continuation` | `null` or object | `{"route_id": "mascot_chat", "reasons": [...]}` when the full answer should be read on the mascot's page ([§14](#14-conversation-model-and-the-mascot-page)) |
| `actions` | array of 0 to 5 items | Semantic navigation actions, each `{"type", "route_id"}` ([§10](#10-navigation-routes)) |
| `error` | `null` or object | `{"code"}`, plus `"retry_after_seconds"` only with `rate_limited` |

No other member is allowed at any level of the body.

**Text rules** for `answer_text` and `cloud_preview`:

- Both are plain text on one line. The schema rejects C0 and C1 control characters, DEL, the line and paragraph separators (U+2028, U+2029) and the bidirectional embedding, override and isolate controls (U+202A to U+202E, U+2066 to U+2069). It does not reject the directional marks U+061C, U+200E and U+200F or any other format character (Unicode category Cf) outside those two ranges; the origin removes control and format characters from model answers ([§18.2](#182-runtime-checks), R2). That is all the schema checks about their content: whether a text is approved, free of markup and links, and free of private material is a runtime requirement ([§18](#18-schema-and-runtime-validation)).
- Clients render both as text, for example through `textContent`: never as HTML, which could execute, and never through a Markdown renderer, which would interpret it. They never turn anything in them into a link. The origin removes markup and links from model answers ([§18.2](#182-runtime-checks), R2), but rendering as text is what makes the display safe, and it must not depend on those checks.
- Clients never parse the texts or depend on their wording, which is PROVISIONAL and may change without a version change.
- When `cloud_preview` is shortened, it is a nonempty start of `answer_text`, copied exactly, followed by an ellipsis (`…`, U+2026). The cut is placed at a word boundary unless one word fills a whole cloud line. The schema can check neither this relationship nor where the cut falls; both are runtime requirements ([§18.2](#182-runtime-checks), R4).

**Bounds**

- **137 characters for `cloud_preview`:** 3 lines of 45 characters plus 2 joining spaces, the engine's PROVISIONAL text-level approximation of the cloud's "about 3 short lines". It holds for every model answer and every current fixed text, and it must be recomputed if the cloud settings change ([§19.2](#192-allowed-v1-revisions)).
- **4,000 characters for `answer_text`** (PROPOSED): a backstop far above what the current generation settings produce. The engine limits generation in tokens, not answers in characters. If a validated answer is longer than this, the origin fails closed with 502 `unavailable`; it never truncates. The bound must be re-checked whenever the generation settings change.
- **137 characters for `answer_text` in `error` and `unavailable` responses,** so that every error text fits the cloud whole.

**Per-status constraints** (enforced by the schema):

| `status` | `actions` | `continuation` | `error` |
|---|---|---|---|
| `answered` | Empty | `null`, or any of the reasons | `null` |
| `navigation` | Exactly one `navigate`, or 2 to 5 `suggest` with distinct route IDs | `null`, or the reason `exceeds_cloud` only | `null` |
| `refused` | Empty | `null`, or the reason `exceeds_cloud` only | `null` |
| `error` | Empty | `null` | `invalid_request`, `empty_input` or `input_too_long` |
| `unavailable` | Empty | `null` | `rate_limited`, `timeout` or `unavailable` |

With the current fixed texts, `continuation` is non-null only for `answered`. The schema allows `exceeds_cloud` on `navigation` and `refused` because the engine would produce it if a configured text ever outgrew the cloud. For `error` and `unavailable`, `cloud_preview` equals `answer_text`. That equality is a runtime check ([§18.2](#182-runtime-checks), R4); the schema enforces only the per-status rules above.

## 8. Statuses and the origin boundary

### 8.1 Public statuses

| `status` | HTTP | Meaning | Client behavior |
|---|---|---|---|
| `answered` | 200 | The model's answer, validated after generation. This includes answers in which the model itself declines an off-topic question: the API does not classify answer content. | Show `cloud_preview`; if `continuation` is set, add the "continue on the mascot's page" link |
| `navigation` | 200 | The application handled a navigation command without the model | One `navigate` action: go to its page. `suggest` actions: show the text and one "take me there" button per action. |
| `refused` | 200 | The application declined without showing model text: the destination is not allowlisted, the command contains a web address or path, or output validation withheld the answer | Show the text |
| `error` | 400, 403, 405, 413, 415 | The request was invalid; sending it again unchanged fails again | Show the text; do not resend it unchanged |
| `unavailable` | 429, 500, 502, 503, 504 | No answer can be given now | Show the text; never retry automatically; respect `retry_after_seconds` |

### 8.2 The origin boundary

Inside the origin, the engine uses its own, more detailed outcome and error identifiers. They are internal to the inference application, are not part of this contract and never appear on the wire. The origin adapter maps every engine outcome to exactly one public `status` ([§8.1](#81-public-statuses)) and one row of [§9](#9-http-status-codes). It takes `answer_text`, `cloud_preview`, `continuation` and `actions` from the engine's visitor fields: the validated answer for `answered`, and otherwise the engine's fixed reply for that outcome. The mapping is a closed table that is implemented and tested in the private inference repository; it is not published here.

Adapter rules:

1. Build the public body from the allowlisted fields only. Never serialize the engine's internal record ([§16](#16-data-that-never-leaves-the-origin)).
2. An engine outcome or error code that the mapping does not list, for example after an engine update, never passes through. The adapter answers 502 `unavailable`, and its contract tests must fail until the mapping is revised.
3. If the engine raises an exception instead of returning a result, the origin answers 500 with its fixed unavailable body, and the gateway turns that into 502.
4. The origin chooses the model from its own configuration; nothing in the request can choose it. Until its configuration and knowledge have loaded and the configured model is known, the origin answers 503 `unavailable`.
5. Before sending, the origin checks the body it built ([§18.2](#182-runtime-checks)).

## 9. HTTP status codes

| HTTP | `status` | `error.code` | Produced by | When |
|---|---|---|---|---|
| 200 | `answered`, `navigation`, `refused` | `null` | Origin | [§8](#8-statuses-and-the-origin-boundary) |
| 400 | `error` | `invalid_request` | Gateway or origin | Malformed body, query string, wrong JSON structure, unknown or missing member, unpaired surrogate; at the origin, also a missing or malformed request ID |
| 400 | `error` | `empty_input` | Gateway or origin | No visible characters |
| 400 | `error` | `input_too_long` | Gateway or origin | More than 1,000 characters |
| 403 | `error` | `invalid_request` | Gateway | An `Origin` header that is not approved |
| 405 | `error` | `invalid_request` | Gateway or origin | A method other than `POST` |
| 413 | `error` | `invalid_request` | Gateway or origin | A body over 8,192 bytes |
| 415 | `error` | `invalid_request` | Gateway or origin | A wrong `Content-Type`, or a compressed body |
| 429 | `unavailable` | `rate_limited` | Gateway (the origin may also limit) | A per-visitor limit or the global budget is reached |
| 500 | `unavailable` | `unavailable` | Gateway | An unexpected failure in the gateway itself |
| 502 | `unavailable` | `unavailable` | Gateway or origin | The origin or the model runtime produced no usable answer: a runtime error or invalid runtime response, an empty validated answer, an answer over the 4,000-character bound, an exception at the origin, an invalid or inconsistent origin response, or a rejected gateway credential |
| 503 | `unavailable` | `unavailable` | Gateway or origin | Chat disabled by the kill switch; the origin unreachable, not ready or at capacity; the knowledge block or the configured model unavailable at the origin |
| 504 | `unavailable` | `timeout` | Gateway or origin | No complete answer within the deadline ([§12](#12-deadlines-unavailability-and-retries)) |

The gateway accepts an origin response only if its HTTP status and body together match one row of this table that the origin may produce ([§18.2](#182-runtime-checks), R7); an origin 500 becomes 502. Responses generated by the Cloudflare platform itself, such as an edge error page, are outside the contract, and clients treat every response that does not conform as `unavailable`.

## 10. Navigation routes

**Action allowlist,** in the engine's configuration order:

| `route_id` | Destination |
|---|---|
| `project_qmind` | A featured project's page |
| `project_ingenuity` | A featured project's page |
| `project_satira` | A featured project's page |
| `project_deeplense` | A featured project's page |
| `project_website` | The featured project page for this website |

**Continuation route:** `mascot_chat`, the mascot's own page. It is not an action route, and no typed command selects it: visitors reach it through the cloud's continuation link or by clicking the mascot.

Rules:

1. A route ID is a semantic identifier, never a URL, path or slug. This contract defines no page URL. The website keeps its own build-time map from all six route IDs to pages, created once the site's paths are approved (OPEN, API-10).
2. Route IDs have the engine's form, lowercase letters and digits in underscore-separated groups (`^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$`), but only the allowlist is authoritative.
3. The engine creates actions only from its allowlist, never from model output. The gateway checks every route ID again against its own allowlist. The browser looks each one up in its map and ignores any it cannot map. No component builds a URL by inserting a route ID into a string.
4. `navigate` means "go to the page now"; the engine uses it for a direct command such as "take me to …". `suggest` means "offer a 'take me there' button"; the engine uses it for an ambiguous destination, one action per candidate in allowlist order (PROVISIONAL in the engine).
5. In v1, model answers carry no actions, because the engine produces none for them. Whether answers should offer "take me there" suggestions is OPEN (API-11).
6. The phrases that select each route belong to the inference application's configuration, not to this contract. That configuration, including its decision that the mascot's page has no typed command, is itself awaiting the owner's review.

For example, the engine routes the command "take me to the website project" to `project_website`, which gives the response in [`examples/navigation.json`](examples/navigation.json).

## 11. Request IDs

1. **Assigned by the gateway** to every request it answers, rejected ones included, before any other step, and returned in every response body.
2. **Format:** a random version 4 UUID in lowercase canonical form, exactly 36 characters, matching `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`. It is generated from a cryptographically secure source, for example `crypto.randomUUID()` in the Workers runtime. Version 4 is chosen because it embeds no time, host or sequence, unlike UUID versions 1, 6 and 7 or ULIDs.
3. **Never supplied by clients.** A body member carrying one is rejected as unknown. Request-ID headers sent by clients, such as `X-Request-ID`, are ignored: never adopted, forwarded or logged as the request's ID.
4. **Gateway to origin:** sent with every origin request. The header name is decided together with the authentication design (OPEN, API-02); if requests are signed, the ID is part of the signed material.
5. **Origin validation:** after authentication, a missing ID, or one that does not match the pattern exactly, is rejected with 400 `invalid_request` without running the engine. Matching is exact and case-sensitive, so uppercase letters, braces, a `urn:uuid:` prefix and surrounding whitespace are all invalid.
6. **Echo check:** the origin's response carries the ID it received, and the gateway rejects a response whose ID differs from the one it sent (502; [§18.2](#182-runtime-checks), R8).
7. **Purpose:** correlating gateway and origin logs, and support ("please quote this ID"). It is not a session, visitor or conversation identifier, it retrieves nothing later because nothing is stored, it is never put in a URL, and it grants no access.

## 12. Deadlines, unavailability and retries

### 12.1 Deadlines (values OPEN, API-03)

- The deadlines nest: the model runtime timeout is shorter than the origin's request deadline, which is shorter than the gateway's deadline for the origin, which is shorter than the browser's deadline, each with a margin. The innermost layer that gives up therefore still returns a well-formed `timeout` response instead of an outer layer dropping the connection.
- The origin adapter sets the model runtime's timeout explicitly from the approved values. It never relies on a library default, which can be far longer than a visitor-facing deadline.
- Local, laptop-only measurements show first requests that include loading the model taking tens of seconds, far longer than warm answers. They are not a production benchmark. Until the chosen host's warm-up behavior is decided, a cold origin will produce `timeout` or `unavailable` responses.
- The platform's limits on how long the gateway may wait for an origin response must be verified before the deadline is chosen.

### 12.2 When there is no answer

| Situation | Response |
|---|---|
| Chat disabled by the kill switch | 503 `unavailable`; the origin is not contacted |
| A per-visitor limit or the global budget reached | 429 `rate_limited`, with `retry_after_seconds` and `Retry-After` when the wait is known |
| Origin unreachable, a connection or TLS failure, or the origin at capacity or not ready | 503 `unavailable` |
| No complete origin response within the gateway's deadline | 504 `timeout` |
| An origin response that fails a check of [§18.2](#182-runtime-checks): for example one that is invalid, inconsistent ([§9](#9-http-status-codes)), larger than 65,536 bytes (PROPOSED) or carrying a different request ID | 502 `unavailable` |
| The origin rejects the gateway's credential | 502 `unavailable`, and an operator alert |

The 65,536-byte limit on origin responses covers the largest valid body even when every character is written as an escape sequence.

The gateway uses one fixed text of its own for every `unavailable` outcome except rate limiting, so the cause cannot be inferred from the text. Matching the engine's "unavailable" wording is recommended, as a presentation choice only ([§17](#17-public-error-message-restrictions)). The rest of the website never depends on the chat: pages and links keep working while it is unavailable.

### 12.3 Retries and cancellation

- **No automatic retries.** The gateway never retries an origin request after a failure or timeout, because the generation may still be running and billed. The browser never retries on its own; the visitor may send the message again.
- `POST` is not idempotent: every accepted request may start a generation, and v1 has no deduplication.
- The browser may abort a pending request, for example when a new prompt replaces it. Aborting does not stop work already started at the origin, so the generation budget counts generations started, not answers delivered.

## 13. Authentication and trust boundaries

### 13.1 Boundary 1: browser to gateway (public)

- Visitors are anonymous: no accounts, cookies or API keys. No credential appears in page source, scripts, browser storage or any response.
- Every request is untrusted and is validated as in [§6](#6-request-validation). The message is data for the engine, never an instruction to the gateway.
- `Origin` checks and CORS only stop other websites from using the API through their visitors' browsers. They are not authentication: any client outside a browser can send any header. Abuse is controlled by per-visitor limits, an atomic global budget, a concurrency cap, an optional bot challenge and the kill switch, whose mechanisms and values are OPEN (API-09).
- If a bot challenge is adopted, its token should travel in a request header so that the v1 body schema stays unchanged (OPEN, API-09).
- The gateway forwards nothing from the visitor's request except the validated message: no cookies, IP address, user agent, `Origin` or other client headers. Keys used for rate limiting stay at the gateway.

### 13.2 Boundary 2: gateway to origin (private)

The mechanism is **OPEN** (API-02) and needs owner approval. Whatever is chosen must meet these requirements:

1. **Independent authentication.** The origin authenticates every request itself, without relying on CORS, `Origin`, `Referer` or network location. It rejects unauthenticated requests before parsing the body and before any routing, knowledge loading or model call, with a generic response that does not say what was wrong.
2. **Transport.** HTTPS with certificate validation on every hop. Credentials never appear in URLs.
3. **Secret handling.** Credentials live only in the gateway's secret store and the origin host's secret store: never in either repository, in client code, in logs, in error bodies or in this document.
4. **Verification.** Credentials and signatures are compared in constant time, and failures are logged without the presented value.
5. **Replay.** A captured request stops being accepted after a short window (for example through a signed timestamp and request ID), or the owner explicitly accepts the residual risk of a static credential.
6. **Rotation.** The origin can accept the current and the next credential during a changeover, so rotation needs no downtime, and an exposed credential can be revoked at once.
7. **Separation.** Staging and production use different credentials.
8. **No side doors.** The origin exposes no unauthenticated endpoint that routes messages or calls the model. Any health check does not call the model and reveals no version or host details.
9. **Network allowlists are not authentication.** Cloudflare's address ranges are shared by all its customers, so allowing them identifies no particular gateway. They can only be an additional layer.
10. **Defense in depth.** The origin re-validates the request ([§6.2](#62-origin)) and builds the public body itself. It never relies on the gateway's validation alone.

Candidates, the backend master plan's three options with examples:

| Candidate | Outline | Trade-offs |
|---|---|---|
| A. Static shared secret | The gateway sends a high-entropy secret in a request header; the origin compares it in constant time | Simplest; no replay protection on its own; rotated by overlapping two secrets |
| B. Request signature | An HMAC over method, path, timestamp, request ID and body hash, valid for a short window, optionally with a nonce cache | Resists replay; needs clock tolerance and an identical body hash on both sides, which the re-serialized body makes easier |
| C. Platform identity | For example, mutual TLS with a client certificate held by the gateway, or a private tunnel to an origin with no public listener, protected by an access service's tokens | Depends on the host; can remove the public origin endpoint entirely |

Header names, algorithms, validity windows, rotation periods and the origin's rejection status code are all OPEN.

### 13.3 Origin to model runtime

The model runtime stays bound to loopback on the origin host and is never exposed. The engine's existing runtime adapter refuses non-loopback addresses, so a remote runtime would need a new, authenticated transport: a deliberate design change, not a configuration setting.

## 14. Conversation model and the mascot page

**Single-turn.** The engine answers each message on its own. The model receives only the current message, together with the server-side instruction and approved facts. It never sees earlier questions or answers, in the cloud or on the mascot's page.

- v1 has no conversation state: no session or conversation IDs, no cookies and no server-side transcript. Members such as `history` are rejected ([§5](#5-request)).
- The interface must not suggest that the mascot remembers earlier messages. Contextual memory would be a new engine capability that has to be built and tested first, and it would need a new contract version ([§19](#19-versioning-and-compatibility)).
- The design lets the mascot's page show the whole conversation. In v1, that is a list of independent exchanges kept by the browser, for display only.
- Responses carry no sequence number. The browser discards the response to a prompt it has replaced, for example by aborting the pending request. Whether a new prompt clears the previous question and answer is a design decision that is still open; the API works either way.

**Continuing on the mascot's page.** The design's "continue on the mascot's page" link is driven by `continuation`:

1. When `continuation` is not `null`, the cloud shows `cloud_preview` followed by the link. Its target is the site's page for `continuation.route_id` (`mascot_chat`), whose path is not decided yet (OPEN, API-10).
2. The browser carries the exchange to that page: the visitor's question, which it already has (the API never echoes it), and `answer_text`. It uses same-origin, tab-scoped state, such as in-memory navigation state or `sessionStorage`, as the backend master plan proposes.
3. The link's URL carries no chat text and no request ID, whether in the path, the query string or the fragment. URLs are kept in browser history and can reach server logs, analytics and referrers. The mascot's page does not send chat text to analytics.
4. `reasons` tells the page why the answer continues. `exceeds_cloud`: the preview is only the start of the full answer. `output_limit_reached`: generation stopped at the origin's length limit, so `answer_text` itself is incomplete, and the page may say so. Both can apply.
5. If the tab's state is missing, for example after a direct visit or in a new tab, the mascot's page starts empty. The server cannot restore the exchange, because it stores nothing.
6. `sessionStorage` can be read by any script on the site's origin, so the browser stores only the exchange, renders it as text and relies on a strict Content Security Policy.

## 15. Streaming (OPEN)

- **v1 is not streamed.** The origin returns one complete JSON response after the engine has validated the complete answer. This is how the engine works today: it calls the model runtime without streaming and then validates the whole text, and several of its checks can only judge a complete text.
- **The design requirement is preserved, not dropped.** The design calls for the mascot's talking animation while an answer streams in. With v1, the client can tie that animation only to the request's progress (waiting, arrival, display); text cannot arrive progressively from the server. Whether that is acceptable for the first release, or whether the client should reveal the already-validated answer progressively, is an OPEN product decision (API-04).
- **No streaming endpoint is defined here, and raw tokens are never forwarded.** Forwarding unvalidated tokens to animate the cloud would bypass output validation. A later streaming design needs its own contract version, a decision between incremental validation and accepting the delay of final validation, and defined termination and error behavior.
- Time to first token is not measured today, because requests are not streamed.

## 16. Data that never leaves the origin

Besides the four visitor fields, the origin holds internal data about each request. None of it is published:

| Internal data | Why excluded |
|---|---|
| The selected model's name or tag, and the runtime request settings such as decoding options and timeouts | Reveals the model and its configuration, and would tie the API to a model and host |
| The validated visitor message | The browser already has it, and nothing visitor-supplied is reflected |
| Routing details, such as the configured phrases that matched | `actions` carries what the site needs, and the phrases reveal configuration |
| The instruction, the knowledge block, the assembled prompt, and any hash or other fingerprint of them | The instruction is private, the facts are published only through answers, and fingerprints identify private versions |
| Raw model output: the text before the output checks, any reasoning, the stop reason, token counts, timestamps and durations | Raw model output is never public, and timings are internal |
| What the output checks found or changed | Reveals how the checks work |
| Internal outcome and error identifiers, diagnostic messages, and upstream status codes and timings | Diagnostic text is not written for visitors and can contain internal addresses ([§17](#17-public-error-message-restrictions)); internal identifiers are mapped ([§8.2](#82-the-origin-boundary)), never copied |
| Fingerprints of configuration files | They identify private files |

Host names, the origin's address, software and runtime versions, model digests, environment names and anything else the engine or host knows are never published either.

What is published: `answer_text`, `cloud_preview`, `continuation` (`route_id`, `reasons`) and `actions` (`type`, `route_id`), which are the engine's visitor fields, plus this contract's own `request_id`, `status` and `error` (`code`, `retry_after_seconds`).

The allowlist is enforced three times: the origin adapter builds the body from it, the response schema rejects any other member at every level, and the gateway re-validates the body and builds its own response. This keeps unexpected members out of the body; it does not establish that the permitted string values are safe or where they came from. Keeping private or internal information out of the texts that come from the origin depends on the origin's content controls ([§18.2](#182-runtime-checks), R2 and R3).

## 17. Public error-message restrictions

1. Error and refusal texts are fixed strings chosen in advance: the engine's fixed replies and the gateway's own texts. They are plain, one line and short; `error` and `unavailable` texts have at most 137 characters.
2. They are never built from exception messages or types, stack traces, runtime or upstream error bodies, upstream status codes, file paths, host names, IP addresses, ports, URLs, model names or tags, configuration values or hashes, timings, token counts, vendor or product names, environment names, the visitor's message or any part of it, or the name of a rejected member.
3. The public `error` object has no free-text member.
4. Every `unavailable` cause other than rate limiting shares one text.
5. A validation failure does not say which member or rule failed. The only client is the site itself, and diagnosis uses the request ID and the logs.
6. Internal codes and diagnostic text stay in private logs at the origin. Message text is not logged by default, and retention follows the backend master plan.
7. Error responses, like all responses, are `no-store`.

Gateway texts (PROVISIONAL; wording OPEN, API-07):

| Code | Proposed text |
|---|---|
| `empty_input`, `input_too_long` | The same wording as the engine's reply for the same case, so the visitor sees the same text whichever layer refused the message (a presentation choice; see below) |
| `unavailable`, `timeout` | The same wording as the engine's "unavailable" reply (a presentation choice; see below) |
| `invalid_request` | "Sorry, something went wrong with that message. Please try again." |
| `rate_limited` | "Please wait a little before asking another question." |

How the gateway uses these texts:

1. The gateway sends one of these texts, as both `answer_text` and `cloud_preview`, in every `error` and `unavailable` response: its own rejections, its own failures, and outcomes that the origin decided ([§18.2](#182-runtime-checks), R6).
2. They are public message constants owned by the gateway, kept and reviewed with the gateway's code in the website repository, independently of the inference application. The gateway never takes them from the origin, its configuration or its responses.
3. Where a gateway text has the same wording as the engine's, as proposed above, that is a presentation choice made when the texts are reviewed, not a runtime dependency. Neither layer reads or checks the other's texts, and a change of wording on one side changes nothing on the other.
4. Upstream error text and diagnostic details are never forwarded: not the origin's `answer_text` or `cloud_preview` in an `error` or `unavailable` response, not any part of an origin response that fails the checks, and not platform error pages, exception messages, upstream status codes or headers.
5. A body the gateway builds after normalizing an error must itself satisfy this contract: it passes the response schema, it uses the same text as `answer_text` and `cloud_preview` with `continuation` `null` (R4), and `actions` is empty.
6. Its fields agree with each other and with the transport: the HTTP status is one that [§9](#9-http-status-codes) pairs with its `status` and `error.code` (R7); `request_id` is the ID the gateway assigned to this request ([§11](#11-request-ids)); and `retry_after_seconds` appears only with 429 `rate_limited`, only when the wait is known, and then together with a `Retry-After` header giving the same number of seconds.

## 18. Schema and runtime validation

The schemas define structure. A body that passes them is well formed, not necessarily correct or safe to show. The origin enforces output safety and constructs an explicit public response. The gateway independently checks that response's structure, its cross-field rules and its transport properties before it builds its own response; it does not repeat the origin's content checks, which depend on the private instruction, facts and configuration. The browser renders every text as text ([§7](#7-response)) and treats a response that does not conform as `unavailable` ([§19.4](#194-client-robustness)).

### 18.1 What the schemas check

The gateway and the origin both validate every request and every origin response against the schemas, with a Draft 2020-12 validator that counts string length in code points ([§5](#5-request)). The schemas check:

- **Members:** every required member is present, and no other member appears at any level.
- **Types and lengths:** the type of every member; `message` from 1 to 1,000 characters; `answer_text` from 1 to 4,000, and at most 137 for `error` and `unavailable`; `cloud_preview` from 1 to 137; at least one non-whitespace character in each of these texts; `request_id` in the form of [§11](#11-request-ids); `retry_after_seconds` from 1 to 86,400.
- **Characters in the display texts:** none of those listed in [§7](#7-response): C0 and C1 controls, DEL, U+2028, U+2029 and the bidirectional embedding, override and isolate controls. Other format characters, including the directional marks U+061C, U+200E and U+200F, are not covered (R2).
- **Enumerations and allowlists:** `status`, `error.code`, `actions[].type`, the five action route IDs, the continuation route `mascot_chat` and the allowed lists of `reasons`.
- **Structural rules per status:** the action, continuation and error rules of [§7](#7-response), including distinct routes for `suggest` actions and `retry_after_seconds` only with `rate_limited`.

The schemas cannot check:

- **Transport:** HTTP status codes, headers, body size in bytes, the body's encoding, and deadlines.
- **Well-formed Unicode:** a JSON parser accepts an escaped unpaired surrogate such as `"\ud800"`, and the schemas do not test for one.
- **Relations:** whether `cloud_preview` is `answer_text` or a shortened start of it, whether the continuation reasons are true, whether `status` and `error.code` match the HTTP status, and whether `request_id` is the ID the gateway sent.
- **Content:** whether a text is the approved text for its outcome, and whether an answer is safe. A schema-valid `answer_text` can contain HTML or Markdown, a URL, private or diagnostic text, a paraphrase of the private instruction, or an unsafe or false claim. The schemas detect none of these.

No runtime check can prove that an answer is true or free of paraphrased private instructions either. The origin manages that residual risk through its instruction, the approved facts and evaluation; rendering every text as text keeps an undetected problem from becoming active content.

### 18.2 Runtime checks

Each requirement states what the origin and what the gateway must do. "Fails closed" means the response described in R10.

| # | Requirement | Origin | Gateway |
|---|---|---|---|
| R1 | Well-formed Unicode | Repeats the request checks ([§6.2](#62-origin), O2). Publishes no text containing a code point from U+D800 to U+DFFF, which can arise, for example, from an escape in the model runtime's output; such a response fails closed and is never repaired | Rejects requests as in [§6.1](#61-gateway), steps 6 and 9. Decodes the origin's body as strict UTF-8 and checks every string for unpaired surrogates, for example with `String.prototype.isWellFormed()` |
| R2 | Model output sanitized | Publishes as `answer_text` only the result of its checks on the complete model output, never raw output. The checks remove or replace reasoning, HTML tags, Markdown formatting, links, addresses and other contact details, and control and format characters (Unicode Cc and Cf), and collapse whitespace to single spaces. Names approved for display may remain as plain text. If nothing displayable is left: 502 `unavailable` | Applies only the schema's character rules. Repeating the output checks would duplicate private logic |
| R3 | No private or internal content | Withholds an answer that copies the private instruction, giving `refused`. Never publishes the assembled prompt, knowledge-block delimiters, template placeholders, internal annotations of the approved facts (such as source or entry markers), raw output, reasoning or diagnostic text ([§16](#16-data-that-never-leaves-the-origin), [§17](#17-public-error-message-restrictions)). Approved facts may be stated in answers | Cannot detect these: it holds neither the instruction nor the facts |
| R4 | Preview consistent with `answer_text` | Computes `cloud_preview` from the final `answer_text`, after any change to it: identical when it fits the cloud, otherwise a nonempty start of it, shorter than the whole, followed by `…` and cut as described in [§7](#7-response). That start is copied exactly: nothing is inserted, removed or changed in it, including where a long word is cut | Checks the conditions listed after this table, using only string comparison. It does not rebuild the preview or repeat the origin's word-boundary rule |
| R5 | Continuation reasons true | Sets `exceeds_cloud` exactly when the preview is shortened, and `output_limit_reached` exactly when the model runtime reported that generation stopped at the origin's output limit, which can occur only for `answered` | Applies the schema's per-status rules and R4. Cannot verify `output_limit_reached`, which only the origin knows |
| R6 | Approved fixed texts | Uses only approved texts from its reviewed configuration for `navigation`, `refused`, `error` and `unavailable`, never text built from exceptions, runtime output or the visitor's message | For `error` and `unavailable`, discards the origin's text and sends its own approved constant for the `error.code` as `answer_text` and `cloud_preview`; the body it builds must itself meet this contract ([§17](#17-public-error-message-restrictions)). Forwards `navigation` and `refused` texts after the other checks |
| R7 | HTTP status, `status` and `error.code` agree | Sends each outcome with the HTTP status of its row in [§9](#9-http-status-codes) | Accepts only the combinations listed after this table |
| R8 | Request ID echoed | Copies the ID it received into `request_id`, unchanged, in every response; never creates or alters one | Compares `request_id` with the ID it sent, exactly |
| R9 | Valid, bounded origin response | Sends one complete body with `Content-Type: application/json; charset=utf-8` | Rejects a body that is larger than 65,536 bytes (counted while reading, never trusting `Content-Length`), has another `Content-Type`, is not valid UTF-8 or starts with a byte-order mark, is not valid JSON, has duplicate member names where its parser detects them, or fails the response schema. If no complete response arrives within its deadline: 504 `timeout` ([§12](#12-deadlines-unavailability-and-retries)) |
| R10 | Fail closed | Validates its own body against the schema and R1 and R4 to R8 before sending. On any failure, or for an unmapped engine outcome ([§8.2](#82-the-origin-boundary)), sends its fixed unavailable body with HTTP 502 instead: never a partial, truncated or repaired body | On any failure of R1, R4 or R7 to R9, discards the whole origin response and answers 502 `unavailable` (504 `timeout` for a missed deadline) with its own fixed text, the same for every failure. It never forwards part of the origin's response, repairs it or retries ([§12.3](#123-retries-and-cancellation)), and it logs the request ID and the failed check, never the body |

**Preview consistency (R4).** The gateway treats the preview as shortened exactly when `cloud_preview` differs from `answer_text`. Texts are compared as exact sequences of code points, with no Unicode normalization, case folding or whitespace trimming; on the well-formed strings that R1 guarantees, JavaScript's `===` and `startsWith` compare this way. The gateway accepts a response only if all of these hold:

1. **Not shortened:** a preview that is not shortened equals `answer_text`. A preview that differs from `answer_text` in any way is therefore treated as shortened and must pass checks 2 to 4.
2. **Reason present:** if the preview is shortened, `continuation` is not `null` and its `reasons` include `exceeds_cloud`.
3. **Ellipsis:** a shortened preview ends with `…` (U+2026).
4. **Exact prefix:** the part of a shortened preview before that final `…` is nonempty, is an exact prefix of `answer_text` and is shorter than `answer_text`.
5. **Reason only when shortened:** `exceeds_cloud` is present if and only if the preview is shortened. A response that lists `exceeds_cloud` while its preview equals `answer_text` fails.

These checks need neither the cloud's dimensions nor the origin's truncation algorithm. The gateway does not check where the cut falls, so a preview that is cut at the wrong point but is otherwise consistent passes the gateway; the origin's contract tests cover the cut ([§18.3](#183-required-tests), item 5). A failure of any check gives 502 (R10).

**Accepted combinations (R7).** 200 with `answered`, `navigation` or `refused`; 400 with `error` and `invalid_request`, `empty_input` or `input_too_long`; 405, 413 or 415 with `error` and `invalid_request`; 429 with `unavailable` and `rate_limited`; 500, 502 or 503 with `unavailable` and `unavailable`, an origin 500 becoming 502; and 504 with `unavailable` and `timeout`. Any other HTTP status or combination, including the origin's rejection of the gateway's credential ([§13.2](#132-boundary-2-gateway-to-origin-private)), gives 502. The gateway sets the HTTP status of its own response from the same table.

**Request IDs (R8).** The gateway sends only well-formed IDs, so an origin response to a request whose ID the origin rejected ([§11](#11-request-ids), rule 5) cannot pass R8 and reaches the visitor as 502; it indicates a gateway defect.

**After the checks,** the gateway serializes a new body from the validated values and sends it with its own headers ([§4](#4-endpoint)). It never forwards the origin's bytes or headers.

### 18.3 Required tests

The conditions that only the origin can evaluate are verified by contract tests of the HTTP adapter, in the private inference repository. Before the origin serves visitors, these tests must show:

1. Every response the adapter can produce passes a standard Draft 2020-12 validator against the response schema and matches an accepted combination of R7.
2. Every engine outcome and error code maps to exactly one public outcome, and an unlisted one gives 502 ([§8.2](#82-the-origin-boundary)).
3. R2 and R3, with crafted model outputs that contain reasoning, markup, links and addresses, copied instruction text, knowledge-block delimiters, placeholders and annotations of the facts.
4. A model output with an unpaired surrogate gives 502: no exception, and no escaped surrogate on the wire (R1).
5. The preview of a text that fits, of a shortened text and of texts in which one word fills or overflows a cloud line, anywhere in the preview, each meeting the gateway's R4 conditions; each continuation reason alone and both together (R4, R5).
6. The approved text for each outcome other than `answered`, and no diagnostic text in any response (R6, [§17](#17-public-error-message-restrictions)).
7. The request ID echoed unchanged (R8), and a body that fails the adapter's own checks replaced by the fixed 502 body (R10).

The gateway's tests cover R1, R4 and R7 to R10 with crafted origin responses: every violation must give the same 502 response, with nothing from the origin's body. For R4, each of the following responses passes the response schema and must still fail the gateway's runtime checks:

- **An unrelated preview:** an `answered` response whose `cloud_preview` is not taken from `answer_text` but ends with `…`, together with the superficially valid continuation `{"route_id": "mascot_chat", "reasons": ["exceeds_cloud"]}`. It fails check 4.
- A preview that differs from `answer_text` while `exceeds_cloud` is absent, and `exceeds_cloud` with a preview that equals `answer_text`.
- A shortened preview without the final `…`; a preview that is only `…`; and the whole of `answer_text` followed by `…`.
- A preview whose start differs from `answer_text` only in Unicode normalization, letter case or whitespace.

The preview of [`examples/answered.json`](examples/answered.json) must pass. The tests also cover R6 and [§17](#17-public-error-message-restrictions): an origin `error` or `unavailable` body whose text contains diagnostic details is answered with the gateway's own constant, and every body the gateway builds itself passes the response schema, uses an HTTP status that [§9](#9-http-status-codes) pairs with its `status` and `error.code`, carries the gateway's request ID and has retry metadata only as §17 allows.

## 19. Versioning and compatibility

### 19.1 Rules

1. The major version is the last path segment, as in `/api/chat/v1`, and it is authoritative. Bodies carry no version member.
2. Until the owner approves this document, everything in it is PROPOSED and may change without a version change.
3. After approval, the v1 wire format is frozen except for the revisions in [§19.2](#192-allowed-v1-revisions). Each revision is recorded in [§23](#23-revision-log), and the schemas are updated in the same change.
4. Any other change creates v2 at `/api/chat/v2`. The gateway and origin then serve v1 alongside v2 until no deployed page calls v1, allowing for cached pages and scripts, and only then retire it.

### 19.2 Allowed v1 revisions

| Change | Deployment order |
|---|---|
| Add a route ID (to the action allowlist or as the continuation route) | Site's route map, then gateway allowlist and schema, then origin configuration |
| Remove a route ID | Origin configuration, then gateway allowlist and schema, then site's route map |
| Raise the message limit or the body limit | Origin, then gateway, then browser |
| Lower the message limit or the body limit | Browser, then gateway, then origin |
| Change the cloud size, and with it the 137-character bound | Raising: gateway schema, then origin. Lowering: origin, then gateway schema. Review the browser's layout either way. |
| Change the wording of any fixed text | Any order; clients do not depend on wording |
| Change deadlines, rate limits, budgets or the kill switch | Any order; these are not part of the wire format |

### 19.3 Breaking changes (v2)

- Adding, removing or renaming any member, at any level, of the request or the response.
- Changing a member's type, format or meaning.
- Adding a value to `status`, `error.code`, `actions[].type` or `continuation.reasons`.
- Allowing actions or continuations where the per-status rules ([§7](#7-response)) do not allow them.
- Changing the HTTP status of an existing outcome, or the request-ID format.
- Streaming, conversation history, or any client choice of model or settings.

### 19.4 Client robustness

In every version, clients treat a response that does not conform as `unavailable`, ignore actions whose route ID they cannot map, never depend on wording and never retry automatically.

### 19.5 The inference application

- The wire format requires no change to the engine. The origin's runtime requirements ([§18.2](#182-runtime-checks)) bind the engine and the adapter together and are verified by the adapter's contract tests ([§18.3](#183-required-tests)). Whatever is added to meet them, the engine's existing automated tests must keep passing unchanged.
- If an engine change adds an outcome, error code, action type or continuation reason, it must not reach the wire: the adapter fails closed with 502 until its private mapping ([§8.2](#82-the-origin-boundary)) and, for any new public value, this contract and its schemas are revised.
- The schemas encode some engine values: the PROVISIONAL 1,000-character input limit, the PROVISIONAL cloud size behind the 137-character bound, the continuation route and the route allowlist. Changing any of them needs the matching revision in [§19.2](#192-allowed-v1-revisions).

## 20. Differences from the backend master plan's draft

The backend master plan sketched a conceptual v1 contract and left its field names to be checked against the engine. The differences, all PROPOSED (API-05):

| Master plan draft | This contract | Reason |
|---|---|---|
| `message` | `message` | Unchanged |
| `client_request_id` (optional) | Not accepted | No v1 consumer: the browser matches each response to its own request, and the gateway assigns the ID. Leaving it out also keeps client-chosen values out of the logs. |
| `version: "1"` | Not included | The path carries the version |
| `answer` | `answer_text` | The engine's field, present for every outcome, fixed texts included |
| `preview` | `cloud_preview` | The engine's field |
| `continue_on_mascot_page` (boolean) | `continuation`: `null` or `{route_id, reasons}` | The engine's structure: a semantic route instead of an implied page, and reasons that distinguish an answer cut off by the length limit |
| `actions` | `actions` | Unchanged; the plan's `action_id` is the engine's `route_id` |
| `request_id` | `request_id` | Format fixed as a version 4 UUID ([§11](#11-request-ids)) |
| Status `navigated` | Status `navigation` | An ambiguous destination returns suggestions without navigating, so the status names the kind of outcome instead of claiming that navigation happened |
| Statuses `answered`, `refused`, `unavailable`, `error` | Kept | Meanings defined in [§8.1](#81-public-statuses) |
| (none) | `error`: `null` or `{code, retry_after_seconds}` | One body shape for every outcome, with no free-text error member |
| HTTP 200, 400, 413, 429, 502, 503 and 504 | Adds 403, 405, 415 and 500 | Covers every rejection the gateway makes |

## 21. Open decisions

| ID | Decision | Affects |
|---|---|---|
| API-01 | Production hostname and routing: a same-origin route on the site's host, or a separate API host with CORS | §4, §6.1 |
| API-02 | Gateway-to-origin authentication: candidate A, B or C; header names, algorithm, replay window and rotation period; the origin's rejection status code; the request-ID header, and what the origin returns when that header is missing or malformed | §11, §13.2, §18.2 |
| API-03 | Deadline values for runtime, origin, gateway and browser, after measurements on the chosen host; and the cold-start policy, either keeping the model warm or accepting timeouts after idle periods | §12 |
| API-04 | Streaming and the talking animation in the first release: animation tied to request progress only, a client-side reveal of the validated answer, or a later streaming version | §15 |
| API-05 | Names that differ from the master plan's draft (§20), including leaving out `client_request_id` and `version` | §5, §7, §8, §20 |
| API-06 | The PROPOSED bounds (8,192-byte requests, 65,536-byte origin responses, 4,000-character answers) and the engine values the schemas encode (the PROVISIONAL 1,000-character limit and 3 × 45 cloud behind 137, `mascot_chat` and the route allowlist) | §5, §7, §12, §18 |
| API-07 | Wording of the gateway's fixed texts, including whether any of them should match the engine's wording | §12.2, §17, §18.2 |
| API-08 | Whether the reply for a withheld answer should use the same wording as the other refusals | §8.1, §18.2 |
| API-09 | Values and mechanisms for per-visitor limits, the global budget, the concurrency cap and any bot challenge, including how a challenge token is carried | §6.1, §13.1 |
| API-10 | The map from route IDs to page URLs, and the path of the mascot's page | §10, §14 |
| API-11 | Whether model answers may carry "take me there" suggestions, which would need an engine change and a contract revision | §10 |
| API-12 | Publication of this document in the public repository. The 2026-11-07 revision removed the engine's internal identifiers and the internal-to-public mapping, which are to be implemented and tested in the private repository, and keeps the six route IDs as an intended part of the public interface. What remains is the owner's review of the whole text before it is committed. | §8.2, §10, §16 |
| API-13 | A non-inference health or readiness endpoint, which this document does not define | §13.2 |

## 22. Files and verification

| File | Content |
|---|---|
| `docs/api/chat-v1.md` | This document |
| `docs/api/schemas/chat-request-v1.schema.json` | The request body |
| `docs/api/schemas/chat-response-v1.schema.json` | The response body, for every outcome |
| `docs/api/examples/request.json` | An ordinary question |
| `docs/api/examples/answered.json` | HTTP 200 `answered`: an answer cut for the cloud, with a continuation |
| `docs/api/examples/navigation.json` | HTTP 200 `navigation` for the command "take me to the website project" |
| `docs/api/examples/error.json` | HTTP 503 `unavailable` |

The examples use generic sample text, not real facts. Their request IDs are random and identify nothing.

Verification:

- **2026-11-06, first draft:** local and offline. All JSON files parsed, the examples satisfied the schemas according to a limited local checker that covers the keywords these schemas use, and the enumerations, limits, example texts and preview were compared with the engine's source and configuration. An independent review then reported that both schemas pass JSON Schema Draft 2020-12 meta-schema validation, that all four examples pass standard validation and that 46 further checks gave their expected results.
- **2026-11-07, first revision:** documentation only, local and offline. The schemas and examples are byte-identical to their state before the revision (SHA-256), all JSON files parse, the examples still satisfy the schemas under the same kind of limited local checker, every link inside this document resolves to a heading, and the limits and route IDs were compared with the engine's source and configuration again. No standard validator is installed locally, so this revision relies on the independent review for standard validation; the adapter's contract tests run one as well ([§18.3](#183-required-tests)).
- **2026-11-07, second revision:** documentation only, local and offline. In the schemas only descriptions changed: with every `title`, `description` and `$comment` removed, each schema is identical to its state before the revision. The examples are byte-identical (SHA-256). All JSON files parse, and the examples satisfy the schemas under a limited local checker that covers the keywords these schemas use, with Python's regular expressions standing in for ECMA-262. The same checker showed that the response schema still rejects unexpected members at every level checked; that the display-text pattern rejects exactly the characters its description lists, and of the format characters only U+202A to U+202E and U+2066 to U+2069; that the examples meet the gateway's R4 conditions; and that each R4 negative case of [§18.3](#183-required-tests) passes the schema and fails R4. Every link inside this document resolves. No standard Draft 2020-12 validator is installed locally, so standard validation of this revision is still outstanding.

## 23. Revision log

| Date | Change |
|---|---|
| 2026-11-06 | First draft, PROPOSED. Not owner-approved. |
| 2026-11-07 | Revision, PROPOSED. Added §18, which separates what the schemas check from the runtime checks and assigns each runtime check to the origin or the gateway, with the tests they require. Replaced the engine-to-public mapping tables of §8.2 with a description of the origin boundary; the mapping is to be implemented and tested in the private repository. Removed internal engine identifiers and implementation details from §2, §7, §12.1, §16 and §19.5, and stated exactly which characters the schema rejects (§7). Specified that the gateway sends its own fixed texts for every `error` and `unavailable` response (§18.2, R6). Former §18 to §22 are now §19 to §23. No change to fields, statuses, error codes, route IDs, limits, schemas or examples. Not owner-approved. |
| 2026-11-07 | Second revision, PROPOSED. Corrected schema descriptions so that they state only what the schemas enforce: which control and format characters the display-text pattern rejects and which it does not (§7, §18.1), how `cloud_preview` relates to `answer_text` and when `exceeds_cloud` applies (§7, §14), that excluding unexpected members does not make the permitted values safe (§16), and that unpaired surrogates are rejected by a runtime check. Strengthened the gateway's preview-consistency checks (§18.2, R4) and the required tests (§18.3), including an unrelated preview that ends with an ellipsis. Clarified that the gateway's `error` and `unavailable` texts are its own constants, that matching the engine's wording is a presentation choice, and that the bodies the gateway builds must meet this contract (§12.2, §17, §18.2, R6; wording still OPEN, API-07). No change to fields, statuses, error codes, route IDs, limits, schema validation or examples. Not owner-approved. |
