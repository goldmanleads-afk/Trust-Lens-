# Trust Lens

Trust Lens is a free AI-answer review tool from Ideal Client Alliance. A user
pastes an answer from ChatGPT, Claude, or another AI and receives a short,
tailored first look at the most important misses. “Go deeper” opens the ICA Pro
Hub membership gate for the full audit.

## Architecture

- `index.html` — page markup and Netlify Forms
- `css/styles.css` — responsive ICA visual system
- `js/script.js` — interactive UI, email forms, and offer countdown
- `netlify/functions/analyze.mjs` — secure server-side OpenAI Responses API call
- `.env.example` — required environment variables without secret values
- `assets/og-image-ai.png` — AI-version social sharing card

The browser never receives the OpenAI API key. Pasted answers are sent to the
Netlify function, which calls OpenAI with structured output and returns only the
normalized Trust Lens analysis.

## Local preview

The complete AI flow needs Netlify Dev and an OpenAI API key:

```sh
cp .env.example .env
# Add your real OPENAI_API_KEY to .env
npm install
npm start
```

Open `http://localhost:8888` in your browser. Keep the terminal running while
you test, and press `Ctrl+C` when you want to stop the local server.

Never commit `.env` or paste the key into `index.html` or `js/script.js`.

## Deployment

Deploy to Netlify with the repository root as the publish directory. Add
`OPENAI_API_KEY` under the site's environment variables, then point
`trustlens.idealclientalliance.com` to the Netlify site.

Netlify detects the two email forms directly from `index.html`.
