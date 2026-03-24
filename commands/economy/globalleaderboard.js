const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs   = require('node:fs');
const path = require('node:path');

const economyPath = path.join(__dirname, '../../data/economy.json');
const xpPath      = path.join(__dirname, '../../data/xp.json');
const invitesPath = path.join(__dirname, '../../data/invites.json');

function load(p) {
	if (!fs.existsSync(p)) return {};
	try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return {}; }
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('globalleaderboard')
		.setDescription('View the global leaderboard of richest players')
		.addStringOption(opt =>
			opt.setName('type')
				.setDescription('Leaderboard type')
				.addChoices(
					{ name: '💰 Richest Players', value: 'coins' },
					{ name: '✨ Highest Level',   value: 'level' },
					{ name: '📨 Top Inviters',    value: 'invites' }
				)),

	async execute(interaction) {
		const type = interaction.options.getString('type') || 'coins';
		await interaction.deferReply();

		const medals = ['🥇', '🥈', '🥉'];
		let entries = [];
		let title   = '';
		let color   = '#FFD700';

		if (type === 'coins') {
			const economy = load(economyPath);
			entries = Object.entries(economy)
				.map(([id, d]) => ({ id, val: d.coins || 0 }))
				.sort((a, b) => b.val - a.val)
				.slice(0, 10);
			title = '💰 Global Richest Players';
		} else if (type === 'level') {
			const xpData = load(xpPath);
			entries = Object.entries(xpData)
				.map(([id, d]) => ({ id, val: (d.level || 1) * 10000 + (d.xp || 0), display: `Level ${d.level || 1} (${d.xp || 0} XP)` }))
				.sort((a, b) => b.val - a.val)
				.slice(0, 10);
			title = '✨ Global Highest Levels';
			color = '#5865F2';
		} else if (type === 'invites') {
			const invites = load(invitesPath);
			entries = Object.entries(invites)
				.map(([id, d]) => ({ id, val: d.total || 0 }))
				.sort((a, b) => b.val - a.val)
				.slice(0, 10);
			title = '📨 Global Top Inviters';
			color = '#00B0FF';
		}

		if (!entries.length) {
			return interaction.editReply('No data found yet!');
		}

		const lines = entries.map((e, i) => {
			const medal = medals[i] || `**${i + 1}.**`;
			const stat  = e.display || e.val.toLocaleString() + (type === 'coins' ? ' coins' : type === 'invites' ? ' invites' : '');
			return `${medal} <@${e.id}> — ${stat}`;
		}).join('\n');

		const embed = new EmbedBuilder()
			.setTitle(`🌐 ${title}`)
			.setDescription(lines)
			.setColor(color)
			.setFooter({ text: 'Global leaderboard • All servers combined' })
			.setTimestamp();

		await interaction.editReply({ embeds: [embed] });
	}
};
