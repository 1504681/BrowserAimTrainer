# Browser Aim Trainer — Leaderboard Worker

A Cloudflare Worker that exposes a tiny JSON API for the trainer's global leaderboards. Backed by Workers KV.

## Endpoints

- `GET /scores?key=<scenario>-<difficulty>-<weapon>` → top 50 runs
- `POST /submit` → submit a run, body: `{ key, name, score, acc, hits, headshots, mul }`
- `GET /health` → liveness check

## Deploy

The KV namespace is already provisioned (id baked into `wrangler.toml`).

```bash
# from this folder (clickinggame/worker)
npx wrangler deploy
```

You'll need to be logged in to the Cloudflare account that owns the KV namespace:

```bash
npx wrangler login
```

After deploy, copy the `*.workers.dev` URL into the trainer's client at the top of `index.html` (search for `LEADERBOARD_URL`) and push.

## Limits

- Stores top 50 runs per `<mode>-<difficulty>-<weapon>` key
- Names: 1–20 chars, control chars stripped
- Scores: must be a finite number 0–100000
- Rate limit: 6 submits per IP per 10 seconds
