const RSSParser = require('rss-parser');
const cron = require('node-cron');
const { EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const parser = new RSSParser();
const lastVideoPath = path.join(__dirname, '../data/lastVideo.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, '../data'))) {
    fs.mkdirSync(path.join(__dirname, '../data'));
}

// Initialize lastVideo.json if it doesn't exist
if (!fs.existsSync(lastVideoPath)) {
    fs.writeFileSync(lastVideoPath, JSON.stringify({ id: '' }));
}

module.exports = (client) => {
    cron.schedule('*/5 * * * *', async () => {
        try {
            const channelId = process.env.YOUTUBE_CHANNEL_ID;
            const notifyChannelId = process.env.YOUTUBE_NOTIFY_CHANNEL_ID;

            if (!channelId || !notifyChannelId) return;

            const feed = await parser.parseURL(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
            if (!feed.items || feed.items.length === 0) return;

            const latestVideo = feed.items[0];
            const lastVideo = JSON.parse(fs.readFileSync(lastVideoPath, 'utf8'));

            if (latestVideo.id !== lastVideo.id) {
                fs.writeFileSync(lastVideoPath, JSON.stringify({ id: latestVideo.id }));

                const channel = await client.channels.fetch(notifyChannelId).catch(() => null);
                if (!channel) return;

                const videoId = latestVideo.id.split(':')[2];
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle(latestVideo.title)
                    .setURL(latestVideo.link)
                    .setAuthor({ name: 'New Upload' })
                    .setImage(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`)
                    .setTimestamp();

                await channel.send({ content: `🎬 **New Video Alert!**\n${latestVideo.link}`, embeds: [embed] });
            }
        } catch (error) {
            console.error('Error in YouTube Notifier:', error);
        }
    });
};
