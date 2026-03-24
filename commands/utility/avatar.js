const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('avatar')
		.setDescription('Show a user\'s avatar')
		.addUserOption(option => option.setName('user').setDescription('The user to get avatar for')),
	async execute(interaction) {
		const user = interaction.options.getUser('user') || interaction.user;
		const avatarUrl = user.displayAvatarURL({ dynamic: true, size: 1024 });

		const embed = new EmbedBuilder()
			.setTitle(`${user.username}'s Avatar`)
			.setImage(avatarUrl)
			.setColor('#5865F2')
			.setFooter({ text: `Requested by ${interaction.user.tag}` })
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
