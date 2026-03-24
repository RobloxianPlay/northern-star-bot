const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs   = require('node:fs');
const path = require('node:path');

const economyPath = path.join(__dirname, '../../data/economy.json');

const MEDALS = ['🥇', '🥈', '🥉'];

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('Show the top 10 richest users in the server'),

	async execute(interaction) {
		try {
			if (!fs.existsSync(economyPath)) {
				return interaction.reply({ content: '📭 No economy data yet. Start earning coins!', ephemeral: true });
			}

			const economy = JSON.parse(fs.readFileSync(economyPath, 'utf8'));

			const sorted = Object.entries(economy)
				.filter(([, d]) => d.coins > 0)
				.sort(([, a], [, b]) => b.coins - a.coins)
				.slice(0, 10);

			if (sorted.length === 0) {
				return interaction.reply({ content: '📭 No users in the economy yet! Try `/daily` to get started.', ephemeral: true });
			}

			const lines = sorted.map(([id, data], i) => {
				const medal = MEDALS[i] || `**${i + 1}.**`;
				const coins = data.coins.toLocaleString();
				return `${medal} <@${id}> — **${coins}** 🪙`;
			});

			// Find caller's rank
			const allSorted = Object.entries(economy)
				.sort(([, a], [, b]) => b.coins - a.coins);
			const myRank = allSorted.findIndex(([id]) => id === interaction.user.id) + 1;
			const myCoins = economy[interaction.user.id]?.coins ?? 0;

			const embed = new EmbedBuilder()
				.setTitle('🏆 Economy Leaderboard')
				.setDescription(lines.join('\n'))
				.addFields({
					name: '📍 Your Position',
					value: myRank > 0
						? `You are **#${myRank}** with **${myCoins.toLocaleString()}** 🪙 coins`
						: 'You are not on the leaderboard yet.'
				})
				.setColor('#FFD700')
				.setFooter({ text: `Top ${sorted.length} richest users` })
				.setTimestamp();

			await interaction.reply({ embeds: [embed] });

		} catch (err) {
			console.error('[Leaderboard] Error:', err.message);
			await interaction.reply({ content: '❌ Failed to load leaderboard.', ephemeral: true });
		}
	}
};
