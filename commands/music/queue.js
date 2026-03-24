const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('queue')
		.setDescription('Show the current music queue'),

	async execute(interaction) {
		const queue = useQueue(interaction.guild.id);

		if (!queue || !queue.isPlaying()) {
			return interaction.reply({ content: '❌ No music is currently playing!', ephemeral: true });
		}

		const tracks = queue.tracks.toArray();
		const current = queue.currentTrack;

		const embed = new EmbedBuilder()
			.setTitle('🎵 Music Queue')
			.setColor('#1DB954')
			.setTimestamp();

		embed.addFields({
			name: '▶️ Now Playing',
			value: current ? `**[${current.title}](${current.url})** — ${current.author} (${current.duration})` : 'Nothing'
		});

		if (tracks.length > 0) {
			const list = tracks.slice(0, 10).map((t, i) => `**${i + 1}.** ${t.title} — ${t.author} (${t.duration})`).join('\n');
			embed.addFields({ name: `📋 Up Next (${tracks.length} song${tracks.length !== 1 ? 's' : ''})`, value: list });
		} else {
			embed.addFields({ name: '📋 Up Next', value: 'No more songs in queue.' });
		}

		await interaction.reply({ embeds: [embed] });
	}
};
