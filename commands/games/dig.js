const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('dig')
		.setDescription('Dig for hidden treasure in this channel!'),

	async execute(interaction) {
		interaction.client.emit('treasureDig', { interaction });
	}
};
