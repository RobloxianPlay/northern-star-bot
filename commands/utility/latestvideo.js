const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const RSSParser = require('rss-parser');
const parser = new RSSParser();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('latestvideo')
		.setDescription('Shows the newest YouTube video'),
	async execute(interaction) {
		const channelId = process.env.YOUTUBE_CHANNEL_ID;
		if (!channelId) return interaction.reply({ content: 'YouTube Channel ID not configured!', ephemeral: true });

		try {
			const feed = await parser.parseURL(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
			if (!feed.items || feed.items.length === 0) return interaction.reply('No videos found.');

			const latestVideo = feed.items[0];
			const videoId = latestVideo.id.split(':')[2];

			const embed = new EmbedBuilder()
				.setColor('#FF0000')
				.setTitle(latestVideo.title)
				.setURL(latestVideo.link)
				.setImage(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`)
				.setTimestamp();

			await interaction.reply({ embeds: [embed] });
		} catch (error) {
			console.error(error);
			await interaction.reply({ content: 'Failed to fetch the latest video.', ephemeral: true });
		}
	},
};
