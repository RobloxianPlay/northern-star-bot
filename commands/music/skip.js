const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('skip')
		.setDescription('Skip the current song'),

	async execute(interaction) {
		const queue = useQueue(interaction.guild.id);

		if (!queue || !queue.isPlaying()) {
			return interaction.reply({ content: '❌ No music is currently playing!', ephemeral: true });
		}

		const current = queue.currentTrack;
		queue.node.skip();

		const embed = new EmbedBuilder()
			.setTitle('⏭ Song Skipped')
			.setDescription(`Skipped **${current?.title || 'current track'}**`)
			.setColor('#FF6B00')
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	}
};
