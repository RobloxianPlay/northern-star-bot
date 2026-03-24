const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('volume')
		.setDescription('Adjust the music volume')
		.addIntegerOption(opt =>
			opt.setName('level')
				.setDescription('Volume level (1-100)')
				.setMinValue(1)
				.setMaxValue(100)
				.setRequired(true)),

	async execute(interaction) {
		const queue = useQueue(interaction.guild.id);

		if (!queue || !queue.isPlaying()) {
			return interaction.reply({ content: '❌ No music is currently playing!', ephemeral: true });
		}

		const level = interaction.options.getInteger('level');
		queue.node.setVolume(level);

		const bar = '█'.repeat(Math.round(level / 10)) + '░'.repeat(10 - Math.round(level / 10));

		const embed = new EmbedBuilder()
			.setTitle('🔊 Volume Adjusted')
			.setDescription(`Volume set to **${level}%**\n\`${bar}\` ${level}%`)
			.setColor('#1DB954')
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	}
};
