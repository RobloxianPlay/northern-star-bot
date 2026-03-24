const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('socials')
		.setDescription('Shows all creator social media links'),
	async execute(interaction) {
		const channelId = process.env.YOUTUBE_CHANNEL_ID;
		
		const embed = new EmbedBuilder()
			.setTitle('📱 Creator Socials')
			.setDescription('Stay connected across all platforms!')
			.addFields(
				{ name: 'YouTube', value: `[Channel Link](https://www.youtube.com/channel/${channelId})`, inline: true },
				{ name: 'Twitter', value: '[Follow on Twitter](https://twitter.com)', inline: true },
				{ name: 'Discord', value: '[Join the Server](https://discord.gg)', inline: true }
			)
			.setColor('#5865F2')
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
