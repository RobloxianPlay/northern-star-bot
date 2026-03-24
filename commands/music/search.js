const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { useMainPlayer } = require('discord-player');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('search')
		.setDescription('Search and pick a song to play')
		.addStringOption(opt =>
			opt.setName('query')
				.setDescription('Song name to search')
				.setRequired(true)),

	async execute(interaction) {
		if (!interaction.member.voice.channel) {
			return interaction.reply({ content: '❌ You must be in a voice channel!', ephemeral: true });
		}

		await interaction.deferReply();

		const player = useMainPlayer();
		const query = interaction.options.getString('query');

		const results = await player.search(query, { requestedBy: interaction.user });

		if (!results || !results.tracks.length) {
			return interaction.editReply('❌ No results found.');
		}

		const tracks = results.tracks.slice(0, 5);

		const options = tracks.map((t, i) => ({
			label: t.title.slice(0, 100),
			description: `${t.author} • ${t.duration}`.slice(0, 100),
			value: i.toString()
		}));

		const row = new ActionRowBuilder().addComponents(
			new StringSelectMenuBuilder()
				.setCustomId('music_search_select')
				.setPlaceholder('Pick a song...')
				.addOptions(options)
		);

		const embed = new EmbedBuilder()
			.setTitle(`🔍 Search Results for "${query}"`)
			.setDescription(tracks.map((t, i) => `**${i + 1}.** [${t.title}](${t.url}) — ${t.author} (${t.duration})`).join('\n'))
			.setColor('#1DB954')
			.setTimestamp();

		const reply = await interaction.editReply({ embeds: [embed], components: [row] });

		const collector = reply.createMessageComponentCollector({ time: 30000 });

		collector.on('collect', async (i) => {
			if (i.user.id !== interaction.user.id) {
				return i.reply({ content: '❌ Only the requester can pick a song.', ephemeral: true });
			}

			const index = parseInt(i.values[0]);
			const track = tracks[index];

			await i.deferUpdate();

			try {
				await player.play(interaction.member.voice.channel, track.url, {
					nodeOptions: {
						metadata: { channel: interaction.channel },
						selfDeaf: true,
						volume: 80,
						leaveOnEmpty: true,
						leaveOnEmptyCooldown: 30000,
						leaveOnEnd: false
					}
				});

				const doneEmbed = new EmbedBuilder()
					.setTitle('🎵 Playing')
					.setDescription(`**[${track.title}](${track.url})**`)
					.setThumbnail(track.thumbnail)
					.addFields(
						{ name: '🎤 Artist', value: track.author || 'Unknown', inline: true },
						{ name: '⏱ Duration', value: track.duration || 'Unknown', inline: true },
						{ name: '👤 Requested by', value: `${interaction.user}`, inline: true }
					)
					.setColor('#1DB954')
					.setTimestamp();

				await interaction.editReply({ embeds: [doneEmbed], components: [] });
			} catch (err) {
				await interaction.editReply({ content: `❌ Could not play: ${err.message}`, components: [] });
			}

			collector.stop();
		});

		collector.on('end', (_, reason) => {
			if (reason === 'time') {
				interaction.editReply({ content: '⌛ Search timed out.', components: [] }).catch(() => null);
			}
		});
	}
};
