const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('announce')
		.setDescription('Send an announcement embed')
		.addStringOption(option => option.setName('title').setDescription('Announcement title').setRequired(true))
		.addStringOption(option => option.setName('message').setDescription('Announcement message').setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
		const title = interaction.options.getString('title');
		const message = interaction.options.getString('message');

		const embed = new EmbedBuilder()
			.setTitle(`📢 ${title}`)
			.setDescription(message)
			.setColor('#FF0000')
			.setFooter({ text: `Announced by ${interaction.user.tag}` })
			.setTimestamp();

		await interaction.reply({ content: 'Announcement sent!', ephemeral: true });
		await interaction.channel.send({ embeds: [embed] });
	},
};
