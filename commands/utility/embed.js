const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('embed')
		.setDescription('Create a custom embed')
		.addStringOption(option => option.setName('title').setDescription('The title of the embed').setRequired(true))
		.addStringOption(option => option.setName('description').setDescription('The description of the embed').setRequired(true))
		.addStringOption(option => option.setName('color').setDescription('Hex color code (e.g. #FF0000)'))
		.addStringOption(option => option.setName('image').setDescription('URL of the image')),
	async execute(interaction) {
		const title = interaction.options.getString('title');
		const description = interaction.options.getString('description');
		const color = interaction.options.getString('color') || '#0099FF';
		const image = interaction.options.getString('image');

		const embed = new EmbedBuilder()
			.setTitle(title)
			.setDescription(description)
			.setColor(color.startsWith('#') ? color : `#${color}`)
			.setTimestamp();

		if (image) embed.setImage(image);

		await interaction.reply({ embeds: [embed] });
	},
};
