# Running PULSE (Expo) for live preview

## Reproduce uncommitted artifacts

- No `.env*` files exist in this project — nothing to copy from the main checkout.
- `node_modules` is installed (`npm install` if a fresh checkout is missing it).
- No other build artifacts are required to start the dev server.

## Run the server

Dev server is Expo/Metro. Preferred port is **8081** (Expo default).

```powershell
# From the project root — detached, hidden window:
powershell -NoProfile -Command "(Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','start' -RedirectStandardOutput '<log>' -RedirectStandardError '<log>.err' -WindowStyle Hidden -PassThru).Id"
```

- `npm run start` = `expo start` (Metro serves the web app at `http://localhost:8081` on demand).
- Wait for `http://localhost:8081` to answer HTTP 200 before registering the preview; the first web request triggers a one-time Metro bundle build.
- If 8081 is taken, pick a free port and pass it via `expo start --port <port>` (or `npx expo start --port <port>`), and register the preview against that port.
- Verify the listener: `Get-NetTCPConnection -LocalPort 8081 -State Listen` → owning process id.
