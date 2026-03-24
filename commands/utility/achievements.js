const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('achievements')
		.setDescription('View your unlocked achievements')
		.addUserOption(option => option.setName('user').setDescription('View another user\'s achievements')),
	async execute(interaction) {
		const targetUser = interaction.options.getUser('user') || interaction.user;
		const achievementsPath = path.join(__dirname, '../../data/achievements.json');

		if (!fs.existsSync(achievementsPath)) {
			return interaction.reply('No achievements unlocked yet!');
		}

		const data = JSON.parse(fs.readFileSync(achievementsPath, 'utf8'));
		const userAchievements = data[targetUser.id];

		if (!userAchievements || !userAchievements.achievements || userAchievements.achievements.length === 0) {
			return interaction.reply(`${targetUser.username} has not unlocked any achievements yet.`);
		}

		const achievementList = userAchievements.achievements
			.map((a, i) => `${i + 1}. 🏆 ${a}`)
			.join('\n');

		const embed = new EmbedBuilder()
			.setTitle(`${targetUser.username}'s Achievements`)
			.setDescription(achievementList)
			.addFields(
				{ name: 'Total Achievements', value: `${userAchievements.achievements.length}`, inline: true },
				{ name: 'Activity Streak', value: `${userAchievements.streak || 0} days`, inline: true },
				{ name: 'Messages Sent', value: `${userAchievements.messages || 0}`, inline: true }
			)
			.setColor('#FFD700')
			.setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
