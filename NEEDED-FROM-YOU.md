# Needed before Trust Lens goes live

## 1. OpenAI API key — required

Create a project API key in the OpenAI Platform and add it to the Netlify site
as an environment variable named `OPENAI_API_KEY`.

Do not paste the key into this repository, a chat message, `index.html`, or
`js/script.js`. The code is already wired to read it securely on the server.

The default model is `gpt-5.6-luna`. An optional Netlify environment variable
named `OPENAI_MODEL` can override it later.

## 2. Netlify deployment

- Create or connect the private `ica-trust-lens` GitHub repository.
- Deploy the repository through the existing Netlify account.
- Keep the publish directory as `.` and leave the build command empty.
- Confirm the `analyze` function appears in Netlify after deployment.
- Confirm both `standing-email` and `early-access` appear under Netlify Forms.

## 3. Custom domain

Add `trustlens.idealclientalliance.com` in Netlify, then create the requested
DNS CNAME record wherever `idealclientalliance.com` is managed.

The Open Graph metadata already points to this domain.

## 4. Privacy disclosure — required before public promotion

Trust Lens now sends pasted answers to a Netlify function and the OpenAI API for
analysis. Link the site to the appropriate ICA privacy policy and explain that
processing there. The old browser-only privacy promise has been removed.

## 5. Final live checks

- Run one real analysis and confirm a tailored response appears.
- Confirm an empty or malformed submission fails safely.
- Complete three successful analyses in a fresh private window and verify the
  offer appears once.
- Close and reopen the offer and confirm both clocks use the same deadline.
- Submit both email forms and confirm the entries reach Netlify.
