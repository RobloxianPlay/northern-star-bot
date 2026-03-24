const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs   = require('node:fs');
const path = require('node:path');

const economyPath = path.join(__dirname, '../../data/economy.json');
const xpPath      = path.join(__dirname, '../../data/xp.json');
const petsPath    = path.join(__dirname, '../../data/pets.json');
const inventoryPath = path.join(__dirname, '../../data/inventory.json');

function load(p, def = {}) {
	if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(def));
	return JSON.parse(fs.readFileSync(p, 'utf8'));
}

const CRATE_COST = 200;

const crateRewards = [
	{ label: '💰 Small Coins',   type: 'coins',  value: 100,  chance: 25, emoji: '💰' },
	{ label: '💎 Big Coins',     type: 'coins',  value: 500,  chance: 15, emoji: '💎' },
	{ label: '🏆 Jackpot Coins', type: 'coins',  value: 2000, chance: 3,  emoji: '🏆' },
	{ label: '✨ Small XP',      type: 'xp',     value: 50,   chance: 20, emoji: '✨' },
	{ label: '⭐ Big XP',        type: 'xp',     value: 200,  chance: 12, emoji: '⭐' },
	{ label: '🐱 Cat Pet',       type: 'pet',    value: 'Cat', chance: 8, emoji: '🐱' },
	{ label: '🐺 Wolf Pet',      type: 'pet',    value: 'Wolf', chance: 4, emoji: '🐺' },
	{ label: '🐉 Dragon Pet',    type: 'pet',    value: 'Dragon', chance: 1, emoji: '🐉' },
	{ label: '🎁 Mystery Box',   type: 'item',   value: 'Mystery Box', chance: 7, emoji: '🎁' },
	{ label: '⚔️ Weapon',        type: 'item',   value: 'Iron Sword', chance: 5, emoji: '⚔️' },
];

function rollReward() {
	const roll = Math.random() * 100;
	let acc = 0;
	for (const r of crateRewards) {
		acc += r.chance;
		if (roll < acc) return r;
	}
	return crateRewards[0];
}

const rarityColor = { '🐉': '#FFD700', '🐺': '#9B59B6', '🐱': '#2ECC71', '🏆': '#FF0000' };

module.exports = {
	data: new SlashCommandBuilder()
		.setName('crate')
		.setDescription('Open a mystery crate for random rewards')
		.addSubcommand(sub => sub.setName('open').setDescription(`Open a mystery crate (costs ${CRATE_COST} coins)`))
		.addSubcommand(sub => sub.setName('info').setDescription('View what you can get from crates')),

	async execute(interaction) {
		const sub    = interaction.options.getSubcommand();
		const userId = interaction.user.id;

		if (sub === 'info') {
			const lines = crateRewards.map(r => `${r.emoji} **${r.label}** — ${r.chance}% chance`).join('\n');
			const embed = new EmbedBuilder()
				.setTitle('🎁 Mystery Crate Contents')
				.setDescription(lines)
				.setColor('#FF8C00')
				.setFooter({ text: `Costs ${CRATE_COST} coins per crate` })
				.setTimestamp();
			return interaction.reply({ embeds: [embed] });
		}

		const economy = load(economyPath);
		if (!economy[userId]) economy[userId] = { coins: 0 };
		if (economy[userId].coins < CRATE_COST) {
			return interaction.reply({ content: `❌ You need **${CRATE_COST} coins** to open a crate. You have **${economy[userId].coins}**.`, ephemeral: true });
		}

		economy[userId].coins -= CRATE_COST;

		const reward = rollReward();

		if (reward.type === 'coins') {
			economy[userId].coins += reward.value;
			fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));
		} else if (reward.type === 'xp') {
			fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));
			const xpData = load(xpPath);
			if (!xpData[userId]) xpData[userId] = { xp: 0, level: 1 };
			xpData[userId].xp += reward.value;
			fs.writeFileSync(xpPath, JSON.stringify(xpData, null, 2));
		} else if (reward.type === 'pet') {
			fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));
			const pets = load(petsPath);
			if (!pets[userId]) {
				pets[userId] = { name: reward.value, emoji: reward.emoji, rarity: 'Rare', xpBoost: 0.08, coinBoost: 0.08, level: 1, xp: 0 };
				fs.writeFileSync(petsPath, JSON.stringify(pets, null, 2));
			}
		} else if (reward.type === 'item') {
			fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));
			const inv = load(inventoryPath);
			if (!inv[userId]) inv[userId] = [];
			inv[userId].push({ name: reward.value, emoji: reward.emoji, obtained: new Date().toISOString() });
			fs.writeFileSync(inventoryPath, JSON.stringify(inv, null, 2));
		}

		const embed = new EmbedBuilder()
			.setTitle('🎁 Mystery Crate Opened!')
			.setDescription(`You spent **${CRATE_COST} coins** and received...`)
			.addFields(
				{ name: `${reward.emoji} ${reward.label}`, value: reward.type === 'coins' ? `+${reward.value} coins` : reward.type === 'xp' ? `+${reward.value} XP` : reward.type === 'pet' ? `🐾 New pet: ${reward.value}` : `🎒 Item added to inventory` }
			)
			.setColor(rarityColor[reward.emoji] || '#FF8C00')
			.setTimestamp();

		return interaction.reply({ embeds: [embed] });
	}
};
