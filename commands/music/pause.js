const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pause')
		.setDescription('Pause the current song'),

	async execute(interaction) {
		const queue = useQueue(interaction.guild.id);

		if (!queue || !queue.isPlaying()) {
			return interaction.reply({ content: '❌ No music is currently playing!', ephemeral: true });
		}

		if (queue.node.isPaused()) {
			return interaction.reply({ content: '⚠️ Music is already paused. Use `/resume` to continue.', ephemeral: true });
		}

		queue.node.pause();

		const embed = new EmbedBuilder()
			.setTitle('⏸ Music Paused')
			.setDescription(`**${queue.currentTrack?.title || 'Current track'}** has been paused.\nUse \`/resume\` to continue.`)
			.setColor('#FFA500')
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	}
};
