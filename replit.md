# Discord Bot — Project Overview

## Architecture

- **Runtime:** Node.js with discord.js v14
- **Entry Point:** `index.js`
- **Command Registration:** `deploy-commands.js`
- **Storage:** JSON files in `data/` (auto-created on first run)

## Key Files & Folders

| Path | Purpose |
|------|---------|
| `index.js` | Bot entry, command loader, cooldown system, feature loader |
| `commands/` | Slash commands grouped by category folder |
| `features/` | Background features loaded on startup |
| `events/` | Discord event handlers (XP, reaction roles) |
| `data/` | JSON data storage |
| `dashboard/` | Web dashboard (Express + EJS + Socket.io) on port 3000 |
| `deploy-commands.js` | Registers slash commands with Discord API |
| `.env.example` | Template for all environment variables |

## Slash Command Categories

- **economy/** — balance, daily, work, beg, give, leaderboard, shop, buy, inventory, giveaway, quest, adopt, battle, crate, dungeon, feedpet, globalbalance, globalleaderboard, pets, territory
- **fun/** — meme, joke, 8ball, cat, dog, coinflip, rps, slots, blackjack, trivia, guessnumber, roulette
- **moderation/** — kick, ban, timeout, clear, warn, warnings, lock, unlock, nsfw-toggle
- **utility/** — help, ping, profile, afk, rep, userinfo, avatar, embed, announce, poll, remind, reactionroles, stats, setlevelrole, serverstats, subscribe, socials, update, uptime, latestvideo, ai, globalboard, achievement-leaderboard, achievements

## Features Loaded on Startup

- youtubeNotifier, reactionRoleHandler, roleSync, xpHandler, achievementHandler
- ticketHandler, serverStats, nsfwFilter, logger, chatMinigame
- bossRaid, lootDrops, musicPlayer, petCatcher, chatStreak
- serverAchievements, territoryWars, dailyQuests, inviteRewards, cosmicEvents
- petEvolution, treasureHunt, dungeonRaid, antiRaid, afk, starboard, reputation

## Environment Variables

All described in `.env.example`. Critical ones:
- `DISCORD_TOKEN` — Bot token
- `CLIENT_ID` — Application ID  
- `GUILD_ID` — Server ID
- `LOG_CHANNEL_ID` — Log channel
- `STAFF_ROLE_ID` — Staff role for tickets
- `TICKET_CATEGORY_ID` — Ticket channel category
- `STARBOARD_CHANNEL_ID` — Starboard channel
- `STARBOARD_THRESHOLD` — Star count (default 3)
- `DASHBOARD_PORT` — Dashboard port (default 3000)

## Recent Major Changes

- Added global cooldown system to all commands (default 3s, configurable per command)
- Rebuilt `/help` as interactive button-based category navigator
- XP handler: 60s cooldown, 15-25 XP per message, rich level-up embeds with progress bars
- Chat minigames: full rewrite with type race, math quiz, trivia, reaction race, button race
- `/give` command: confirmation dialog with Accept/Cancel buttons
- Leaderboard: improved formatting with medals and caller's rank position
- Added `/joke`, `/8ball`, `/cat`, `/dog` commands
- Added Anti-Raid system: rapid join detection + spam auto-mute
- Added AFK system: set reason, auto-remove, mention notifications
- Added Starboard: ⭐ threshold, duplicate prevention, live count updates
- Added Reputation system: 24h cooldown, self-rep prevented, /rep give and view
- Added Web Dashboard: real-time stats via Express + EJS + Socket.io
- Negative balance prevention across all economy commands
- Removed invalid file `commands/moderation/warnings.js!`
