const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('subscribe')
		.setDescription('Encourages users to subscribe to the YouTube channel'),
	async execute(interaction) {
		const channelId = process.env.YOUTUBE_CHANNEL_ID;
		const subscribeLink = `https://www.youtube.com/channel/${channelId}?sub_confirmation=1`;

		const embed = new EmbedBuilder()
			.setTitle('🔴 Subscribe to the Channel!')
			.setDescription('Support the content by subscribing! Click the button below to head over to YouTube.')
			.setColor('#FF0000')
			.setTimestamp();

		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setLabel('Subscribe Now')
				.setURL(subscribeLink)
				.setStyle(ButtonStyle.Link)
		);

		await interaction.reply({ embeds: [embed], components: [row] });
	},
};
