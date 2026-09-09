# TournaDash - Project Brain

## 1. Project Overview & Multi-Project Ecosystem
TournaDash is a multi-tenant SaaS platform designed for Minecraft tournament organizers. It consists of interconnected projects managed under `E:\Vaibhav\Projects\TournaDash\`:
1. **`tournadash` (Web App)**: A Next.js 14 (App Router) web application. Contains public-facing pages, tournament organizer dashboard, and secure backend API proxy.
2. **`tournadash-bot` (Discord Bot)**: An Express.js + Discord.js service that handles Discord verification and checks guild membership.
3. **`tournadash-plugin` (Paper/Spigot Plugin)**: A Minecraft server-side plugin for Paper/Spigot/Folia that handles whitelisting, bans, disguised IGNs, and tournament spectator workflows.
4. **`tournadash-fabric` (Fabric Server Mod)**: A server-side Fabric mod equivalent to the Spigot plugin, managing whitelist and commands on Fabric servers.
5. **`tournadash-mod` (Fabric Client Mod)**: An in-game client-side Fabric mod offering a GUI to browse tournaments, register, view prize pools, and join games directly.

---

## 2. Discord Bot Configuration & Status Checks

### Bot API URL Configuration
The Next.js web application connects to the Discord bot API via the route `src/app/api/discord/check-member/route.js`.
- **Environment Variable**: `DISCORD_BOT_API_URL`
- **Fallback URL**: `http://localhost:3001`
- **Code Reference**:
  ```javascript
  const botUrl = process.env.DISCORD_BOT_API_URL || 'http://localhost:3001'
  ```

### Bot Endpoints (`tournadash-bot`)
The Express API inside the bot codebase exposes the following endpoints on port `3001` (or the configured environment port `PORT`):
1. **Health Check**: `GET /api/bot/health`
   - **Returns**: `{ status: "ok", botTag: client.user.tag }`
2. **Member Verification**: `GET /api/bot/check-member?guild_id=<guild_id>&user_id=<user_id>`
   - **Returns**: `{ isMember: true/false }`
3. **Guild Information**: `GET /api/bot/guild-info?guild_id=<guild_id>`
   - **Returns**: `{ name: string, id: string, memberCount: number, iconUrl: string }`

### Pterodactyl Hosting & Panel
The bot is hosted on the **Skycastle** hosting environment:
- **Client Area / User Panel**: [client.skycastle.us](https://client.skycastle.us)
- **Pterodactyl Panel**: [panel.skycastle.us](https://panel.skycastle.us)

---

## 3. Database Schema & Security
- **Supabase Instance**: `https://quwtcgxqinnugjzbfoym.supabase.co`
- **Authentication**: Token-based auth on Minecraft integrations:
  - `tournament_tok_...` (Scoped to tournament)
  - `org_tok_...` (Scoped to organization)
  - `td_key_...` (Scoped to user login/client mod)

---

## 4. Status Checks for Other Components
- **Tournament Web Status API**: `GET /api/plugin/status`
  - Validates a server token and returns: `{ status, whitelist_enabled, registration_open, player_count, name }`.
- **Player Verification API**: `GET /api/plugin/check?ign=<player_ign>`
  - Checks if a player is allowed to connect based on tournament status, whitelist, and ban tables.

---

## 5. SpySpectator (v3.0.x) Spectator Engine Integration
TournaDash integrates with the standalone **SpySpectator** plugin (v3.0.x) for in-match spectator management:
- **Soft Dependency**: Declared in `plugin.yml` via `softdepend: [SpySpectator]`.
- **Dynamic Reflection Hook**: `SpectatorHook.java` binds to `com.spygamingog.spyspectator.api.SpySpectatorAPI` dynamically at runtime, ensuring zero crashes if SpySpectator is not present on a server.
- **Match Elimination Auto-Spectate**: On player death during tournament matches (`PlayerDeathEvent`), `SpectatorListener.java` automatically transitions the eliminated participant to isolated spectator mode.
- **Anti-Unspectate Protection**: Dynamically registers a listener for `com.spygamingog.spyspectator.api.events.PlayerUnspectateEvent` to prevent eliminated players from leaving spectator mode while the tournament match is ongoing.
- **Admin Commands**:
  - `/tw spectate <player>` - Puts a player into spectator mode.
  - `/tw unspectate <player>` - Removes a player from spectator mode and restores inventory/location.
  - `/tw spectators` - Lists all currently active tournament spectators.

---

## 6. Development and Build Commands
- **Web App**: `npm run dev` (Vercel production deploy: `https://tournadash.vercel.app`)
- **Discord Bot**: `npm start` / `npm run dev`
- **Paper Plugin**: `mvn clean package`
- **Fabric Mod & Plugin**: `./gradlew build`
