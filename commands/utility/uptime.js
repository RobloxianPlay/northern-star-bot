const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('uptime')
		.setDescription('Shows how long the bot has been running'),
	async execute(interaction) {
		let totalSeconds = (interaction.client.uptime / 1000);
		let days = Math.floor(totalSeconds / 86400);
		totalSeconds %= 86400;
		let hours = Math.floor(totalSeconds / 3600);
		totalSeconds %= 3600;
		let minutes = Math.floor(totalSeconds / 60);
		let seconds = Math.floor(totalSeconds % 60);

		const uptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;

		const embed = new EmbedBuilder()
			.setTitle('⏱️ Bot Uptime')
			.setDescription(`The bot has been online for: **${uptime}**`)
			.setColor('#0099FF')
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
