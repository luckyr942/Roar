# Going live: play ROAR with a friend anywhere

The website (Netlify) and the server (Render) are two separate parts. Live banter, stickers, meme sounds and voice roasts only work when the website knows where the server is. Without it, each phone runs alone and nothing syncs.

## 1. MongoDB Atlas: let Render connect

Render's servers change IP address, so Atlas must allow every address.

- Go to cloud.mongodb.com → **Security → Network Access → + Add IP Address**.
- Choose **Allow access from anywhere** (`0.0.0.0/0`) and confirm.

If you skip this, the server stops on start-up with `tlsv1 alert internal error ... alert number 80`.

## 2. Render: run the server

| Setting | Value |
| --- | --- |
| Root Directory | `liveroom` |
| Build Command | `npm install` |
| Start Command | `node server/index.mjs` |

Environment variables. Copy the values from `liveroom/.env`, and never commit that file:

| Name | Value |
| --- | --- |
| `MONGODB_URI` | your Atlas connection string |
| `DB_NAME` | `roar` |
| `ROAR_GEMINI_KEY` | your Gemini API key (AI roasts; without it the app uses its built-in templates) |

Deploy, then open `https://YOUR-NAME.onrender.com/health`. It should show `{"ok":true,...}`.

## 3. Netlify: point the website at the server

- **Site configuration → Environment variables**: add `EXPO_PUBLIC_SERVER_URL` set to `https://YOUR-NAME.onrender.com` (no `/` at the end).
- **Deploys → Trigger deploy → Clear cache and deploy site**. The address is built into the website, so a rebuild is needed every time it changes.

## 4. Play with a friend

1. Both of you open the Netlify link.
2. **Me** tab: set your own name, your team, and your friend's name as the rival. Your friend does the same with your name.
3. **Banter** tab: both tap **⚡ Quick join**. The room code is made from both names, so you land in the same room.
4. Tap the screen once so the browser lets sounds play. Allow the microphone for voice roasts.

## Good to know

- Render's free server sleeps after 15 minutes without visitors. Open the site a minute before the match so it can wake up (the first load takes about 50 seconds).
- The Gemini free tier has a daily limit. When it runs out, roasts fall back to templates and everything else keeps working.
- If the sticker tray says **"OFF: THIS SITE HAS NO ROAR SERVER YET"**, step 3 is missing or Netlify hasn't been rebuilt.

## Same Wi-Fi only (no deploy)

```bash
cd liveroom && npm run server
```

```bash
cd liveroom && npx expo start
```

Your friend installs Expo Go and scans the QR code. The app finds the server on your laptop automatically. This works only while both phones are on your Wi-Fi and your laptop is on.
