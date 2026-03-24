const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('serverstats')
		.setDescription('Show server statistics'),
	async execute(interaction) {
		const guild = interaction.guild;
		const members = await guild.members.fetch();
		const humans = members.filter(m => !m.user.bot).size;
		const bots = members.filter(m => m.user.bot).size;

		const embed = new EmbedBuilder()
			.setTitle(`${guild.name} Statistics`)
			.setThumbnail(guild.iconURL({ dynamic: true }))
			.addFields(
				{ name: '👥 Total Members', value: `${guild.memberCount}`, inline: true },
				{ name: '👤 Humans', value: `${humans}`, inline: true },
				{ name: '🤖 Bots', value: `${bots}`, inline: true },
				{ name: '#️⃣ Channels', value: `${guild.channels.cache.size}`, inline: true },
				{ name: '📋 Roles', value: `${guild.roles.cache.size}`, inline: true },
				{ name: '💎 Boosts', value: `${guild.premiumSubscriptionCount || 0}`, inline: true },
				{ name: '👑 Owner', value: `<@${guild.ownerId}>`, inline: false },
				{ name: '📅 Created', value: guild.createdAt.toLocaleDateString(), inline: false }
			)
			.setColor('#FFA500')
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
