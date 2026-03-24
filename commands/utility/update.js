const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('update')
		.setDescription('Send an admin announcement')
		.addStringOption(option => option.setName('title').setDescription('The title of the update').setRequired(true))
		.addStringOption(option => option.setName('content').setDescription('The content of the update').setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
		const title = interaction.options.getString('title');
		const content = interaction.options.getString('content');

		const embed = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle(`📢 ${title}`)
			.setDescription(content)
			.setFooter({ text: `Posted by ${interaction.user.tag}` })
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
