const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('resume')
		.setDescription('Resume the paused song'),

	async execute(interaction) {
		const queue = useQueue(interaction.guild.id);

		if (!queue) {
			return interaction.reply({ content: '❌ No music is currently playing!', ephemeral: true });
		}

		if (!queue.node.isPaused()) {
			return interaction.reply({ content: '⚠️ Music is not paused.', ephemeral: true });
		}

		queue.node.resume();

		const embed = new EmbedBuilder()
			.setTitle('▶️ Music Resumed')
			.setDescription(`Resumed **${queue.currentTrack?.title || 'current track'}**`)
			.setColor('#1DB954')
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	}
};
