const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useMainPlayer } = require('discord-player');

function progressBar(current, total, size = 15) {
	const percent = current / total;
	const filled = Math.round(size * percent);
	const empty = size - filled;
	return '▰'.repeat(filled) + '▱'.repeat(empty);
}

function formatDuration(ms) {
	const s = Math.floor(ms / 1000);
	const m = Math.floor(s / 60);
	const h = Math.floor(m / 60);
	if (h > 0) return `${h}:${String(m % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
	return `${m}:${String(s % 60).padStart(2, '0')}`;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('play')
		.setDescription('Play a song from YouTube')
		.addStringOption(opt =>
			opt.setName('song')
				.setDescription('Song name or YouTube URL')
				.setRequired(true)),

	async execute(interaction) {
		if (!interaction.member.voice.channel) {
			return interaction.reply({ content: '❌ You must be in a voice channel to play music!', ephemeral: true });
		}

		await interaction.deferReply();

		const player = useMainPlayer();
		const query = interaction.options.getString('song');

		try {
			const { track } = await player.play(interaction.member.voice.channel, query, {
				nodeOptions: {
					metadata: { channel: interaction.channel },
					selfDeaf: true,
					volume: 80,
					leaveOnEmpty: true,
					leaveOnEmptyCooldown: 30000,
					leaveOnEnd: false
				}
			});

			const embed = new EmbedBuilder()
				.setTitle('🎵 Added to Queue')
				.setDescription(`**[${track.title}](${track.url})**`)
				.setThumbnail(track.thumbnail)
				.addFields(
					{ name: '🎤 Artist', value: track.author || 'Unknown', inline: true },
					{ name: '⏱ Duration', value: track.duration || 'Unknown', inline: true },
					{ name: '👤 Requested by', value: `${interaction.user}`, inline: true }
				)
				.setColor('#1DB954')
				.setTimestamp();

			await interaction.editReply({ embeds: [embed] });
		} catch (err) {
			await interaction.editReply({ content: `❌ Could not play that song: ${err.message}` });
		}
	}
};
