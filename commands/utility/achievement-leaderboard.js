const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('achievement-leaderboard')
		.setDescription('View the achievement leaderboard'),
	async execute(interaction) {
		const achievementsPath = path.join(__dirname, '../../data/achievements.json');

		if (!fs.existsSync(achievementsPath)) {
			return interaction.reply('No achievements unlocked yet!');
		}

		const data = JSON.parse(fs.readFileSync(achievementsPath, 'utf8'));
		const sorted = Object.entries(data)
			.map(([userId, userData]) => ({
				userId,
				count: userData.achievements ? userData.achievements.length : 0
			}))
			.sort((a, b) => b.count - a.count)
			.slice(0, 10);

		if (sorted.length === 0) {
			return interaction.reply('No achievements unlocked yet!');
		}

		const leaderboard = await Promise.all(
			sorted.map(async (entry, index) => {
				try {
					const user = await interaction.client.users.fetch(entry.userId);
					return `${index + 1}. ${user.username} - **${entry.count}** achievements`;
				} catch {
					return `${index + 1}. Unknown User - **${entry.count}** achievements`;
				}
			})
		);

		const embed = new EmbedBuilder()
			.setTitle('🏆 Achievement Leaderboard')
			.setDescription(leaderboard.join('\n'))
			.setColor('#FFD700')
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
