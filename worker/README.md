# PARAGOS chat proxy

1. Get a free key at https://aistudio.google.com/apikey
2. `npm i -g wrangler` then `wrangler login`
3. Edit `ALLOWED_ORIGIN` in `wrangler.toml` (e.g. `https://yourname.github.io`)
4. From this folder: `wrangler secret put GEMINI_API_KEY` (paste the key)
5. `wrangler deploy` — copy the printed `https://paragos-chat.<you>.workers.dev` URL
6. Paste it into `CHATBOT_ENDPOINT` at the top of `assets/chatbot.js`

For local testing, temporarily set `ALLOWED_ORIGIN` to `http://localhost:5500` (your dev server origin).
