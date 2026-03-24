const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('raid')
		.setDescription('Start a dungeon raid — 60 seconds to defeat the enemy!'),

	async execute(interaction) {
		interaction.client.emit('raidStart', { interaction });
	}
};
