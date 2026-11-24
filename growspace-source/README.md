# Growspace

Your goals, grown into a garden. Tell Claude what you did and the garden grows by itself.

Built by Diya Shah for the Volopay Product & Tech assignment.

- Live app: https://growspace.challengerate.com
- Test login: `demo` / `growspace`
- MCP link for the demo garden: https://growspace.challengerate.com/mcp/epuKvoOY3aHevsSfrC4b18m6

Growspace has **no AI inside**. The customer's own Claude does the thinking through MCP. This app only saves, draws, and keeps the garden live.

## Run it

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

| Variable | What it is |
|---|---|
| `DATABASE_URI` | MongoDB connection string. If empty, an in-memory store is used and data resets on restart. |
| `SECRET` | Any long random string. Signs the login cookie. |
| `APP_URL` | Public address, for example `https://growspace.app`. Used in the links Claude shows. |

Production: `npm run build`, then run `node .next/standalone/server.js` (output is standalone). It is deployed on AWS Lambda with the Lambda Web Adapter behind CloudFront. The `Dockerfile` also works for App Runner, ECS or EC2. The app must be served over HTTPS for Claude to connect. Allow the server's IP in the MongoDB Atlas network access list.

## Try it

- Demo account: username `demo`, password `growspace` (created on first login; change with `DEMO_PASSWORD`).
- Public garden: `/@demo`

## Connect Claude

1. Sign in and open **Connect Claude** (`/connect`). Copy your private link. It looks like `https://your-domain/mcp/<token>`.
2. In Claude: **Settings**, **Connectors**, **Add custom connector**. Name it Growspace and paste the link.
3. In a chat, say: *"I want to get fit, read more and stop late-night scrolling. Set up my Growspace garden."*

Keep the garden page open while you chat. It updates live.

## The MCP tools

| Tool | What Claude does with it |
|---|---|
| `get_garden` | Reads plants, stages, streak and recent activity |
| `plant` | Creates habits as plants and bad habits as weeds |
| `log` | Records progress (plant grows) or a slip (weed grows) |
| `edit_plant` | Renames, retargets, restyles or removes a plant |
| `save_recap` | Writes the weekly Garden Wrapped shown at `/wrapped` |

## How the garden works

Everything is computed from one log of events. Nothing else is stored.

- A plant grows by total wins: seed (0), sprout (1), growing (3), blooming (7), flourishing (14).
- A plant wilts after 7 days without a win. One win brings it back.
- A weed's size is the number of slips in the last 7 days, up to 4. It shrinks as slips age out.
- The streak counts consecutive days with at least one win.

## Where things live

```
lib/store.ts      data layer (MongoDB or in-memory)
lib/garden.ts     the rules: stages, streaks, wilting, weeds
lib/actions.ts    every change, shared by the app and by Claude
lib/mcp.ts        the MCP server (5 tools)
app/mcp/[token]   MCP endpoint
components/       Plant (SVG, drawn in code), Scene, GardenApp, Wrapped
```
