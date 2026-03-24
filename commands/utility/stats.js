const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stats')
		.setDescription('Shows bot statistics'),
	async execute(interaction) {
		const { client } = interaction;
		
		let totalSeconds = (client.uptime / 1000);
		let days = Math.floor(totalSeconds / 86400);
		totalSeconds %= 86400;
		let hours = Math.floor(totalSeconds / 3600);
		totalSeconds %= 3600;
		let minutes = Math.floor(totalSeconds / 60);
		let seconds = Math.floor(totalSeconds % 60);
		const uptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;

		const embed = new EmbedBuilder()
			.setTitle('📊 Bot Statistics')
			.addFields(
				{ name: '🌐 Servers', value: `\`${client.guilds.cache.size}\``, inline: true },
				{ name: '👥 Users', value: `\`${client.users.cache.size}\``, inline: true },
				{ name: '⌨️ Commands', value: `\`${client.commands.size}\``, inline: true },
				{ name: '⏱️ Uptime', value: `\`${uptime}\``, inline: false }
			)
			.setColor('#FF00FF')
			.setFooter({ text: `ID: ${client.user.id}` })
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
