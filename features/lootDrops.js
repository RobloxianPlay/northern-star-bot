const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const fs   = require('node:fs');
const path = require('node:path');

const economyPath   = path.join(__dirname, '../data/economy.json');
const xpPath        = path.join(__dirname, '../data/xp.json');
const petsPath      = path.join(__dirname, '../data/pets.json');
const inventoryPath = path.join(__dirname, '../data/inventory.json');

function load(p, def = {}) {
	if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(def));
	try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return def; }
}

function getMultipliers() {
	try { return require('./cosmicEvents.js').getMultipliers(); } catch { return { xpMult: 1, coinMult: 1 }; }
}

const lootTable = [
	{ name: 'Gold Pouch',     emoji: '💰', type: 'coins', value: 150,   rarity: 'Common',    chance: 28 },
	{ name: 'Treasure Chest', emoji: '🎁', type: 'coins', value: 400,   rarity: 'Uncommon',  chance: 18 },
	{ name: 'Diamond Cache',  emoji: '💎', type: 'coins', value: 900,   rarity: 'Rare',      chance: 8  },
	{ name: 'XP Orb',         emoji: '✨', type: 'xp',    value: 80,    rarity: 'Common',    chance: 22 },
	{ name: 'XP Crystal',     emoji: '⭐', type: 'xp',    value: 250,   rarity: 'Rare',      chance: 9  },
	{ name: 'Iron Sword',     emoji: '⚔️', type: 'item',  value: 'Iron Sword', rarity: 'Common', chance: 7 },
	{ name: 'Mystic Robe',    emoji: '🧥', type: 'item',  value: 'Mystic Robe', rarity: 'Uncommon', chance: 4 },
	{ name: 'Common Egg',     emoji: '🥚', type: 'pet',   value: { name: 'Cat',    emoji: '🐱', rarity: 'Common',    xpBoost: 0.05, coinBoost: 0.05 }, chance: 3 },
	{ name: 'Rare Pet Egg',   emoji: '🐾', type: 'pet',   value: { name: 'Wolf',   emoji: '🐺', rarity: 'Rare',      xpBoost: 0.10, coinBoost: 0.10 }, chance: 1 },
];

const claimedDrops = new Set();

module.exports = (client) => {
	client.on(Events.InteractionCreate, async (interaction) => {
		if (!interaction.isButton() || !interaction.customId.startsWith('loot_claim_')) return;

		const dropId = interaction.customId.replace('loot_claim_', '');
		if (claimedDrops.has(dropId)) {
			return interaction.reply({ content: '❌ This loot was already claimed!', ephemeral: true });
		}
		claimedDrops.add(dropId);

		const lootIdx = parseInt(dropId.split('_')[0]);
		const loot    = lootTable[lootIdx];
		if (!loot) return interaction.reply({ content: '❌ Invalid loot.', ephemeral: true });

		const mult    = getMultipliers();
		const userId  = interaction.user.id;
		const economy = load(economyPath);
		const xpData  = load(xpPath);
		if (!economy[userId]) economy[userId] = { coins: 0 };
		if (!xpData[userId])  xpData[userId]  = { xp: 0, level: 1 };

		let rewardLine = '';

		if (loot.type === 'coins') {
			const coins = Math.floor(loot.value * mult.coinMult);
			economy[userId].coins += coins;
			rewardLine = `💰 **+${coins} coins**${mult.coinMult > 1 ? ` (${mult.coinMult}x boost!)` : ''}`;
		} else if (loot.type === 'xp') {
			const xp = Math.floor(loot.value * mult.xpMult);
			xpData[userId].xp += xp;
			rewardLine = `✨ **+${xp} XP**${mult.xpMult > 1 ? ` (${mult.xpMult}x boost!)` : ''}`;
		} else if (loot.type === 'item') {
			const inv = load(inventoryPath);
			if (!inv[userId]) inv[userId] = [];
			inv[userId].push({ name: loot.value, emoji: loot.emoji, obtained: new Date().toISOString() });
			fs.writeFileSync(inventoryPath, JSON.stringify(inv, null, 2));
			rewardLine = `${loot.emoji} **${loot.value}** added to inventory`;
		} else if (loot.type === 'pet') {
			const pets = load(petsPath);
			if (pets[userId]) {
				rewardLine = `🐾 You already have a pet! Got **+50 coins** instead.`;
				economy[userId].coins += 50;
			} else {
				pets[userId] = { ...loot.value, level: 1, xp: 0, caughtAt: new Date().toISOString() };
				fs.writeFileSync(petsPath, JSON.stringify(pets, null, 2));
				rewardLine = `🐾 **${loot.value.emoji} ${loot.value.name}** pet obtained!`;
			}
		}

		fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));
		fs.writeFileSync(xpPath, JSON.stringify(xpData, null, 2));

		const rarityColors = { Common: '#95A5A6', Uncommon: '#2ECC71', Rare: '#3498DB', Epic: '#9B59B6', Legendary: '#FFD700' };
		const embed = new EmbedBuilder()
			.setTitle(`${loot.emoji} Loot Claimed!`)
			.setDescription(`${interaction.user} claimed **${loot.name}**!\n\n${rewardLine}`)
			.setColor(rarityColors[loot.rarity] || '#FFD700')
			.setTimestamp();

		// Disable the button
		const disabledRow = new ActionRowBuilder().addComponents(
			new ButtonBuilder().setCustomId(`loot_claimed_${dropId}`).setLabel('Claimed!').setStyle(ButtonStyle.Secondary).setDisabled(true)
		);
		await interaction.update({ components: [disabledRow] });
		await interaction.followUp({ embeds: [embed] });
	});

	function spawnLoot(channel) {
		const mult    = getMultipliers();
		const roll    = Math.random() * 100;
		let acc = 0;
		let loot = lootTable[0];
		for (const l of lootTable) {
			acc += mult.coinMult > 1 ? l.chance * 1.5 : l.chance;
			if (roll < acc) { loot = l; break; }
		}
		const lootIdx = lootTable.indexOf(loot);
		const dropId  = `${lootIdx}_${Date.now()}`;

		const rarityColors = { Common: '#95A5A6', Uncommon: '#2ECC71', Rare: '#3498DB', Epic: '#9B59B6', Legendary: '#FFD700' };
		const embed = new EmbedBuilder()
			.setTitle(`${loot.emoji} LOOT DROP!`)
			.setDescription(`A **${loot.rarity} ${loot.name}** has appeared!\n\nClick the button to claim it!${mult.coinMult > 1 ? `\n\n🌌 Cosmic event active — boosted rewards!` : ''}`)
			.setColor(rarityColors[loot.rarity] || '#FFD700')
			.setFooter({ text: 'First come, first served! • One claim only' })
			.setTimestamp();

		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId(`loot_claim_${dropId}`)
				.setLabel('Claim Loot')
				.setEmoji(loot.emoji)
				.setStyle(ButtonStyle.Success)
		);

		channel.send({ embeds: [embed], components: [row] }).catch(() => null);
	}

	// Spawn every 5 min with 12% chance
	setInterval(() => {
		client.guilds.cache.forEach(guild => {
			if (Math.random() > 0.12) return;
			const channel = guild.channels.cache.find(c => c.isTextBased() && c.type === ChannelType.GuildText);
			if (channel) spawnLoot(channel);
		});
	}, 300000);
};
