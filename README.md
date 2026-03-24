# 🤖 Discord Bot — Production Ready

A complete, modular, production-ready Discord bot built with **Node.js** and **discord.js v14**.

## Features

- **Economy System** — Balance, daily, work, beg, give (with confirmation dialog), shop, inventory, leaderboard with ranks
- **Leveling System** — XP 15–25 per message, 60s XP cooldown, rich level-up embeds with progress bars, auto role rewards
- **Minigame System** — Auto-triggers every 50 messages per channel: Type Race, Math Quiz, Trivia, Reaction Race, Button Race + Rare Events
- **Ticket System** — Duplicate prevention, claim, add staff, close, reopen, delete, transcript export to log channel
- **Moderation** — Kick, ban, timeout, clear, warn, warnings, lock, unlock
- **Anti-Raid & Security** — Rapid join detection (10 joins/10s), spam auto-mute, alerts to log channel
- **Logging** — Message delete/edit, member join/leave, role changes logged to dedicated channel
- **Fun Commands** — /meme, /joke, /8ball, /cat, /dog, /coinflip, /rps, /slots, /blackjack, /trivia, /guessnumber
- **AFK System** — Set reason, auto-remove when user types, notify mentioners
- **Reputation System** — Give +1 rep with 24h cooldown, view rep, self-rep prevented
- **Starboard** — ⭐ reaction threshold triggers starboard post with jump link, duplicate prevention
- **Reaction Roles** — Multi-panel support, emoji-to-role mapping
- **Web Dashboard** — Real-time stats (economy, leveling, tickets) via Express + EJS + Socket.io
- **Global Cooldown System** — Per-command configurable cooldowns (default 3s), spam prevention
- **Interactive Help** — Button-based category navigation: Economy | Fun | Utility | Moderation

## Setup

1. Copy `.env.example` to `.env` and fill in your values
2. Run `node deploy-commands.js` to register slash commands with Discord
3. Run `node index.js` to start the bot
4. Dashboard runs automatically at `http://localhost:3000` (port configurable via `DASHBOARD_PORT`)

## Environment Variables

See `.env.example` for all required and optional variables.

Key variables:
- `DISCORD_TOKEN` — Your bot token
- `CLIENT_ID` — Your bot's application ID
- `GUILD_ID` — Your server ID (for command registration)
- `LOG_CHANNEL_ID` — Channel for logs and anti-raid alerts
- `STAFF_ROLE_ID` — Role for ticket staff
- `TICKET_CATEGORY_ID` — Category for ticket channels
- `STARBOARD_CHANNEL_ID` — Channel for starboard posts
- `STARBOARD_THRESHOLD` — Stars needed for starboard (default: 3)

## Folder Structure

```
commands/
  economy/       — Economy commands
  fun/           — Fun commands
  moderation/    — Moderation commands
  utility/       — Utility commands
  tickets/       — Ticket panel setup
features/        — Auto-running background features
events/          — Discord event handlers
data/            — JSON storage (auto-created on first run)
dashboard/       — Web dashboard (Express + EJS + Socket.io)
  views/         — EJS templates
  public/        — Static assets
```
