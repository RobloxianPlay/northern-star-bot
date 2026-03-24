const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('userinfo')
		.setDescription('Show information about a user')
		.addUserOption(option => option.setName('user').setDescription('The user to get info about')),
	async execute(interaction) {
		const user = interaction.options.getUser('user') || interaction.user;
		const member = await interaction.guild.members.fetch(user.id).catch(() => null);

		const embed = new EmbedBuilder()
			.setTitle(`${user.username}'s Information`)
			.setThumbnail(user.displayAvatarURL({ dynamic: true }))
			.addFields(
				{ name: '🔖 Username', value: user.username, inline: true },
				{ name: '🆔 User ID', value: user.id, inline: true },
				{ name: '🤖 Bot?', value: user.bot ? 'Yes' : 'No', inline: true },
				{ name: '📅 Account Created', value: user.createdAt.toLocaleDateString(), inline: true },
				{ name: '📅 Joined Server', value: member ? member.joinedAt.toLocaleDateString() : 'Unknown', inline: true },
				{ name: '⭐ Roles', value: member ? member.roles.cache.map(r => r.name).join(', ') || 'No roles' : 'N/A', inline: false }
			)
			.setColor('#0099FF')
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
