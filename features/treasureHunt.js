const { EmbedBuilder, ChannelType } = require('discord.js');
const fs   = require('node:fs');
const path = require('node:path');

const treasurePath = path.join(__dirname, '../data/treasures.json');
const economyPath  = path.join(__dirname, '../data/economy.json');
const xpPath       = path.join(__dirname, '../data/xp.json');
const inventoryPath = path.join(__dirname, '../data/inventory.json');

function load(p, def = {}) {
	if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(def));
	try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return def; }
}

const treasures = [
	{ name: 'Ancient Gold',   emoji: '🏺', coins: 500,  xp: 150, item: null         },
	{ name: 'Dragon Egg',     emoji: '🥚', coins: 300,  xp: 200, item: 'Dragon Egg' },
	{ name: 'Magic Crystal',  emoji: '💎', coins: 700,  xp: 100, item: null         },
	{ name: 'Pirate Chest',   emoji: '🏴‍☠️', coins: 1000, xp: 250, item: null         },
	{ name: 'Mystic Relic',   emoji: '🔮', coins: 400,  xp: 300, item: 'Mystic Relic' },
];

module.exports = (client) => {
	let activeTreasure = null;

	async function startHunt(guild) {
		if (activeTreasure) return;

		const textChannels = guild.channels.cache.filter(c => c.isTextBased() && c.type === ChannelType.GuildText);
		if (!textChannels.size) return;

		const channels     = [...textChannels.values()];
		const targetChannel = channels[Math.floor(Math.random() * channels.length)];
		const treasure      = treasures[Math.floor(Math.random() * treasures.length)];
		const huntId        = Date.now().toString();

		activeTreasure = { huntId, channelId: targetChannel.id, treasure, startTime: Date.now() };

		// Announce in a random OTHER channel (or same if only one)
		const announceChannel = channels.find(c => c.id !== targetChannel.id) || targetChannel;

		const embed = new EmbedBuilder()
			.setTitle('🗺️ TREASURE HUNT STARTED!')
			.setDescription(
				`A treasure has been buried somewhere in the server!\n\n` +
				`**Treasure:** ${treasure.emoji} ${treasure.name}\n` +
				`**Rewards:** ${treasure.coins} coins | ${treasure.xp} XP${treasure.item ? ` | 🎒 ${treasure.item}` : ''}\n\n` +
				`> Find the right channel and use \`/dig\` to claim it!\n` +
				`> ⚠️ Hint: check <#${targetChannel.id}>`
			)
			.setColor('#D4AF37')
			.setFooter({ text: 'First to /dig in the correct channel wins! • Expires in 5 minutes' })
			.setTimestamp();

		await announceChannel.send({ embeds: [embed] }).catch(() => null);

		// Expire after 5 min
		setTimeout(() => {
			if (activeTreasure?.huntId === huntId) {
				activeTreasure = null;
				targetChannel.send(`💨 Nobody found the **${treasure.emoji} ${treasure.name}** in time! It vanished.`).catch(() => null);
			}
		}, 300000);
	}

	// /dig command handler — fires when slash command is used
	client.on('treasureDig', async ({ interaction }) => {
		if (!activeTreasure) {
			return interaction.reply({ content: '🕳️ There is no active treasure hunt right now.', ephemeral: true });
		}

		if (interaction.channelId !== activeTreasure.channelId) {
			return interaction.reply({ content: `❌ No treasure here! Keep searching…`, ephemeral: true });
		}

		const found    = activeTreasure;
		activeTreasure = null;

		const userId  = interaction.user.id;
		const economy = load(economyPath);
		const xpData  = load(xpPath);
		if (!economy[userId]) economy[userId] = { coins: 0 };
		if (!xpData[userId])  xpData[userId]  = { xp: 0, level: 1 };

		economy[userId].coins += found.treasure.coins;
		xpData[userId].xp    += found.treasure.xp;

		if (found.treasure.item) {
			const inv = load(inventoryPath);
			if (!inv[userId]) inv[userId] = [];
			inv[userId].push({ name: found.treasure.item, emoji: found.treasure.emoji, obtained: new Date().toISOString() });
			fs.writeFileSync(inventoryPath, JSON.stringify(inv, null, 2));
		}
		fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));
		fs.writeFileSync(xpPath, JSON.stringify(xpData, null, 2));

		const embed = new EmbedBuilder()
			.setTitle(`${found.treasure.emoji} Treasure Found!`)
			.setDescription(
				`🎉 ${interaction.user} discovered the **${found.treasure.name}**!\n\n` +
				`💰 +${found.treasure.coins} coins\n` +
				`✨ +${found.treasure.xp} XP` +
				(found.treasure.item ? `\n🎒 +${found.treasure.item}` : '')
			)
			.setColor('#FFD700')
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	});

	// Spawn hunt every 30 min with 20% chance
	setInterval(() => {
		if (activeTreasure) return;
		if (Math.random() > 0.20) return;
		client.guilds.cache.forEach(g => startHunt(g).catch(() => null));
	}, 1800000);
};
