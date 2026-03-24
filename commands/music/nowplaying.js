const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useQueue, useTimeline } = require('discord-player');

function progressBar(current, total, size = 20) {
	if (!total) return '▱'.repeat(size);
	const percent = Math.min(current / total, 1);
	const filled = Math.round(size * percent);
	const empty = size - filled;
	return '▰'.repeat(filled) + '▱'.repeat(empty);
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('nowplaying')
		.setDescription('Show the currently playing song'),

	async execute(interaction) {
		const queue = useQueue(interaction.guild.id);

		if (!queue || !queue.isPlaying()) {
			return interaction.reply({ content: '❌ No music is currently playing!', ephemeral: true });
		}

		const track = queue.currentTrack;
		const timeline = useTimeline(interaction.guild.id);

		const currentMs = timeline?.timestamp?.current?.value || 0;
		const totalMs = timeline?.timestamp?.total?.value || 0;

		const currentFormatted = timeline?.timestamp?.current?.label || '0:00';
		const totalFormatted = timeline?.timestamp?.total?.label || track.duration;

		const bar = progressBar(currentMs, totalMs);

		const embed = new EmbedBuilder()
			.setTitle('🎵 Now Playing')
			.setDescription(`**[${track.title}](${track.url})**`)
			.setThumbnail(track.thumbnail)
			.addFields(
				{ name: '🎤 Artist', value: track.author || 'Unknown', inline: true },
				{ name: '⏱ Duration', value: track.duration || 'Unknown', inline: true },
				{ name: '👤 Requested by', value: track.requestedBy ? `${track.requestedBy}` : 'Unknown', inline: true },
				{ name: '🔊 Volume', value: `${queue.node.volume}%`, inline: true },
				{ name: '📋 Queue', value: `${queue.tracks.size} song${queue.tracks.size !== 1 ? 's' : ''} remaining`, inline: true },
				{ name: '⏯ Status', value: queue.node.isPaused() ? '⏸ Paused' : '▶️ Playing', inline: true },
				{ name: `${currentFormatted} ${bar} ${totalFormatted}`, value: '\u200b' }
			)
			.setColor('#1DB954')
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	}
};
