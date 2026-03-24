const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, Partials } = require('discord.js');
require('dotenv').config();

const client = new Client({
        intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMessageReactions,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildInvites
        ],
        partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.commands = new Collection();
client.cooldowns = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        const stat = fs.statSync(commandsPath);
        if (!stat.isDirectory()) continue;
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);
                try {
                        const command = require(filePath);
                        if ('data' in command && 'execute' in command) {
                                command.category = folder;
                                client.commands.set(command.data.name, command);
                        } else {
                                console.warn(`[WARN] ${filePath} is missing "data" or "execute".`);
                        }
                } catch (err) {
                        console.error(`[ERROR] Failed to load command ${filePath}:`, err.message);
                }
        }
}

client.once(Events.ClientReady, readyClient => {
        console.log(`✅ Ready! Logged in as ${readyClient.user.tag}`);
        console.log(`📦 Loaded ${client.commands.size} commands`);
});

client.on(Events.InteractionCreate, async interaction => {
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;

        // Cooldown system
        const { cooldowns } = interaction.client;
        if (!cooldowns.has(command.data.name)) {
                cooldowns.set(command.data.name, new Collection());
        }

        const now = Date.now();
        const timestamps = cooldowns.get(command.data.name);
        const cooldownAmount = (command.cooldown ?? 3) * 1000;

        if (timestamps.has(interaction.user.id)) {
                const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
                if (now < expirationTime) {
                        const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
                        return interaction.reply({
                                content: `⏳ Please wait **${timeLeft}s** before using \`/${command.data.name}\` again.`,
                                ephemeral: true
                        });
                }
        }

        timestamps.set(interaction.user.id, now);
        setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

        try {
                await command.execute(interaction);
        } catch (error) {
                console.error(`[ERROR] Command "${interaction.commandName}":`, error);
                const msg = { content: '❌ There was an error executing that command.', ephemeral: true };
                if (interaction.replied || interaction.deferred) {
                        await interaction.followUp(msg).catch(() => null);
                } else {
                        await interaction.reply(msg).catch(() => null);
                }
        }
});

client.login(process.env.DISCORD_TOKEN);

// Start web dashboard (optional — remove if not needed)
try {
        require('./dashboard/index.js');
} catch (err) {
        console.error('[Dashboard] Failed to start:', err.message);
}

// Load Features
const features = [
        './features/youtubeNotifier.js',
        './events/reactionRoleHandler.js',
        './features/roleSync.js',
        './events/xpHandler.js',
        './features/achievementHandler.js',
        './features/ticketHandler.js',
        './features/serverStats.js',
        './features/nsfwFilter.js',
        './features/logger.js',
        './features/chatMinigame.js',
        './features/bossRaid.js',
        './features/lootDrops.js',
        './features/petCatcher.js',
        './features/chatStreak.js',
        './features/serverAchievements.js',
        './features/territoryWars.js',
        './features/dailyQuests.js',
        './features/inviteRewards.js',
        './features/cosmicEvents.js',
        './features/petEvolution.js',
        './features/treasureHunt.js',
        './features/dungeonRaid.js',
        './features/musicPlayer.js',
        './features/antiRaid.js',
        './features/afk.js',
        './features/starboard.js',
        './features/reputation.js'
];

for (const feature of features) {
        try {
                const loaded = require(feature);
                if (feature === './features/musicPlayer.js') {
                        loaded(client).catch(console.error);
                } else {
                        loaded(client);
                }
        } catch (err) {
                console.error(`[ERROR] Failed to load feature ${feature}:`, err.message);
        }
}
