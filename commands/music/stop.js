const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stop')
		.setDescription('Stop music and clear the queue'),

	async execute(interaction) {
		const queue = useQueue(interaction.guild.id);

		if (!queue) {
			return interaction.reply({ content: '❌ No music is currently playing!', ephemeral: true });
		}

		queue.delete();

		const embed = new EmbedBuilder()
			.setTitle('⏹ Music Stopped')
			.setDescription('Music stopped and queue cleared. Disconnected from voice channel.')
			.setColor('#FF0000')
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	}
};
