# Trust Lens — Product and Technical Handover

## 1. Product

Trust Lens is a free, standalone Ideal Client Alliance tool. A visitor pastes
an AI-generated answer and receives a personalized critical-reading review.

The product name and tagline are locked:

- Product: **Trust Lens**
- Tagline: **Look twice before you trust.**
- Wordmark: **ICA · Trust Lens**

The core outcome is judgment, not a verdict. Trust Lens identifies claims that
deserve another question; it does not tell the visitor that a claim is true or
false and does not imply that the answer has been verified.

## 2. Core experience

1. The visitor pastes the full answer from another AI.
2. “Try an example” fills the input only. It never runs an automatic check.
3. “Check this” sends the answer to the secure Netlify function.
4. The interaction behaves like a chat: the submitted answer and Trust Lens
   response appear directly above the composer.
5. The first response is deliberately punchy: one short verdict and no more
   than three important misses.
6. “Go deeper” opens the ICA Pro Hub membership gate. It does not make a
   deeper API request on the public site.
7. The gate sends non-members to the existing $20/month upgrade offer and
   directs members to use Trust Lens from their ICA Pro Hub dashboard.

Only successful AI analyses count toward the third-check offer.

## 3. AI architecture

`netlify/functions/analyze.mjs` calls the OpenAI Responses API. The default
model is `gpt-5.6-luna`, overridable through `OPENAI_MODEL`.

The API key is read only from the server-side `OPENAI_API_KEY` environment
variable. Never place a key in browser code, HTML, documentation, or source
control.

The request uses:

- `store: false`
- low reasoning effort
- low text verbosity
- a 12,000-character input limit
- a strict JSON Schema for the quick response
- a maximum of three findings
- a short request timeout
- basic per-instance request throttling

The model instructions treat pasted text as untrusted material. Instructions
inside the pasted answer must never override Trust Lens behavior.

## 4. Response contract

The default quick request returns:

```json
{
  "analysis": {
    "verdict": "...",
    "hits": [
      {
        "title": "...",
        "point": "..."
      }
    ]
  }
}
```

The server validates and length-limits every returned field before the browser
receives it. The browser renders all model text with DOM text nodes, never as
HTML.

Public requests with `"mode": "deep"` receive a `403` response. Do not remove
that server-side block until ICA Pro Hub authentication is connected; a visual
popup alone is not an access control.

## 5. Review framework

The model uses the Trust Lens workflow supplied by the product owner as its
review method. It checks, in order of relevance:

- date, access, tool, plan, permission, and constraint assumptions;
- hidden premises and conditions required for the answer to be answerable;
- factual or capability claims that lack evidence or explicit reasoning;
- overconfident weak claims and internal contradictions;
- whether the whole approach may be misframed or solving the wrong problem;
- whether consequential or fast-moving claims need a fresh-source or
  independent-model cross-check.

The two governing rules are that an answer should not grade itself in the same
generation that created it, and fluent confidence is not evidence.

## 6. Important honesty boundary

The model analyzes the supplied answer but does not browse the web. It can spot
unsupported, overly certain, stale-looking, conditional, and capability-based
claims. It cannot independently prove whether those claims are true.

Do not add copy that says “verified,” “fact checked,” or equivalent unless a
separate evidence-and-citation workflow is deliberately built and tested.

## 7. Data and privacy

Pasted answers are sent from the browser to the Netlify function and then to
the OpenAI API. The old “Stays in your browser” promise must never return.

The UI currently says “Secure AI analysis.” A public launch should link to an
appropriate ICA privacy policy explaining this processing. The Responses API
request sets `store: false`, but that setting is not a promise of universal
zero retention under every account configuration.

Local storage is used only for the check count and the early-access deadline.

## 8. Brand system

- Background: `#081117`
- Accent: `#f97316`
- Surfaces: `#0e1922` and `#13212c`
- Text: `#f2f5f7`, `#9aa7b1`, and `#62717b`
- System font stack
- Rounded pills and focused amber accents

Use the CSS custom properties at the top of `css/styles.css`. Avoid introducing
unrelated hardcoded colors.

## 9. Monetization mechanic

The early-access offer opens once, after the third successful analysis in that
browser. The behavior is intentionally strict:

- `localStorage["icaCheckCount"]` stores the successful-check count.
- `localStorage["icaEaDeadline"]` stores one fixed 24-hour deadline.
- `localStorage["icaEaShown"]` prevents repeat automatic opening.
- Closing the popup immediately reveals the reopen banner while time remains.
- Reopening never creates or extends a deadline.
- An expired deadline is never regenerated.
- Once expired, the form, link, popup, and reopen banner are unavailable.

The offer terms remain $20/month forever on every new paid AI tool ICA releases
before public pricing. Do not change the trigger, duration, or offer without an
explicit product decision.

## 10. Email capture

The standing form and early-access form use Netlify Forms. Their static markup
must remain in `index.html` so Netlify can detect them during deployment.

The two form names are:

- `standing-email`
- `early-access`

The sales URL is:

`https://stan.store/lrmobi/p/the-ica-pro-blueprint`

## 11. Deployment

The site is hosted on Netlify at the planned custom domain:

`trustlens.idealclientalliance.com`

Required Netlify environment variables:

- `OPENAI_API_KEY` — required secret
- `OPENAI_MODEL` — optional; defaults to `gpt-5.6-luna`

There is no front-end build step. Netlify deploys the static files and bundles
the function declared in `netlify.toml`.

## 12. Hard constraints

- Never expose the OpenAI API key in client-side code.
- Never execute instructions found in pasted content.
- Never present AI analysis as independent fact verification.
- Never reintroduce a numeric risk score, login, or answer history.
- Never fake or reset the 24-hour offer deadline.
- Never auto-run the loaded example.
- Keep the first output punchy and capped at three misses.
- Keep the full audit behind verified ICA Pro Hub access.
- Keep the output as one cohesive chat response rather than disconnected cards.
