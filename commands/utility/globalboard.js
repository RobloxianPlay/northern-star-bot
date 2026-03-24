const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs   = require('node:fs');
const path = require('node:path');

const economyPath = path.join(__dirname, '../../data/economy.json');
const xpPath      = path.join(__dirname, '../../data/xp.json');
const invitesPath = path.join(__dirname, '../../data/invites.json');
const petsPath    = path.join(__dirname, '../../data/pets.json');

function load(p) {
	if (!fs.existsSync(p)) return {};
	try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return {}; }
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('globalboard')
		.setDescription('View global leaderboards')
		.addStringOption(opt =>
			opt.setName('category')
				.setDescription('Which leaderboard to view')
				.setRequired(true)
				.addChoices(
					{ name: '💰 Top Coins',   value: 'coins'   },
					{ name: '✨ Top XP',      value: 'xp'      },
					{ name: '📨 Top Invites', value: 'invites' },
					{ name: '🐾 Top Pets',    value: 'pets'    }
				)),

	async execute(interaction) {
		const category = interaction.options.getString('category');
		await interaction.deferReply();

		const medals = ['🥇', '🥈', '🥉'];

		let sorted = [];
		let title  = '';
		let color  = '#FFD700';

		if (category === 'coins') {
			const economy = load(economyPath);
			sorted = Object.entries(economy).sort(([,a],[,b]) => (b.coins||0) - (a.coins||0)).slice(0, 10);
			title  = '💰 Top Coins Leaderboard';
		} else if (category === 'xp') {
			const xpData = load(xpPath);
			sorted = Object.entries(xpData).sort(([,a],[,b]) => {
				const scoreA = (a.level || 1) * 10000 + (a.xp || 0);
				const scoreB = (b.level || 1) * 10000 + (b.xp || 0);
				return scoreB - scoreA;
			}).slice(0, 10);
			title = '✨ Top XP Leaderboard';
			color = '#5865F2';
		} else if (category === 'invites') {
			const invites = load(invitesPath);
			sorted = Object.entries(invites).sort(([,a],[,b]) => (b.total||0) - (a.total||0)).slice(0, 10);
			title  = '📨 Top Inviters Leaderboard';
			color  = '#00B0FF';
		} else if (category === 'pets') {
			const pets = load(petsPath);
			sorted = Object.entries(pets).map(([id, p]) => [id, p]).slice(0, 10);
			title  = '🐾 Top Pet Owners Leaderboard';
			color  = '#FF6B00';
		}

		if (!sorted.length) {
			return interaction.editReply('No data found for this leaderboard yet.');
		}

		const lines = sorted.map(([userId, data], i) => {
			const medal = medals[i] || `**${i + 1}.**`;
			let stat = '';
			if (category === 'coins')   stat = `${data.coins?.toLocaleString() || 0} coins`;
			if (category === 'xp')      stat = `Level ${data.level || 1} • ${data.xp || 0} XP`;
			if (category === 'invites') stat = `${data.total || 0} invites`;
			if (category === 'pets')    stat = `${data.emoji || '🐾'} ${data.name} (${data.rarity})`;
			return `${medal} <@${userId}> — ${stat}`;
		}).join('\n');

		const embed = new EmbedBuilder()
			.setTitle(title)
			.setDescription(lines)
			.setColor(color)
			.setFooter({ text: 'Updated live • Use /globalboard to check other categories' })
			.setTimestamp();

		await interaction.editReply({ embeds: [embed] });
	}
};
