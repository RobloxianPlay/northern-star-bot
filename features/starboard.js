const { Events, EmbedBuilder } = require('discord.js');
const fs   = require('node:fs');
const path = require('node:path');

const starboardPath = path.join(__dirname, '../data/starboard.json');

const STAR_THRESHOLD = parseInt(process.env.STARBOARD_THRESHOLD ?? '3');
const STAR_EMOJI     = '⭐';

function loadStarboard() {
	try {
		if (!fs.existsSync(starboardPath)) fs.writeFileSync(starboardPath, JSON.stringify({}));
		return JSON.parse(fs.readFileSync(starboardPath, 'utf8'));
	} catch { return {}; }
}

function saveStarboard(data) {
	try {
		fs.writeFileSync(starboardPath, JSON.stringify(data, null, 2));
	} catch {}
}

module.exports = (client) => {
	const starboardChannelId = process.env.STARBOARD_CHANNEL_ID;

	client.on(Events.MessageReactionAdd, async (reaction, user) => {
		if (user.bot) return;
		if (reaction.emoji.name !== STAR_EMOJI) return;
		if (!starboardChannelId) return;

		try {
			if (reaction.partial) await reaction.fetch().catch(() => null);
			if (reaction.message.partial) await reaction.message.fetch().catch(() => null);

			const message = reaction.message;
			const starCount = reaction.count;

			if (starCount < STAR_THRESHOLD) return;

			const starboard = loadStarboard();

			// Prevent duplicates
			if (starboard[message.id]) {
				// Update star count on existing post
				try {
					const sbCh = await message.guild.channels.fetch(starboardChannelId).catch(() => null);
					if (sbCh) {
						const existing = await sbCh.messages.fetch(starboard[message.id]).catch(() => null);
						if (existing) {
							const embed = existing.embeds[0];
							if (embed) {
								const updated = EmbedBuilder.from(embed)
									.setFooter({ text: `${STAR_EMOJI} ${starCount} stars • #${message.channel.name}` });
								await existing.edit({ embeds: [updated] }).catch(() => null);
							}
						}
					}
				} catch {}
				return;
			}

			const sbChannel = await message.guild.channels.fetch(starboardChannelId).catch(() => null);
			if (!sbChannel?.isTextBased()) return;

			const content = message.content || (message.embeds.length ? '[Embed]' : '[Attachment]');
			const imageUrl = message.attachments.first()?.url ?? null;

			const embed = new EmbedBuilder()
				.setAuthor({
					name: message.author.username,
					iconURL: message.author.displayAvatarURL({ dynamic: true })
				})
				.setDescription(content)
				.addFields(
					{ name: 'Source', value: `[Jump to message](${message.url})`, inline: true },
					{ name: 'Channel', value: `<#${message.channelId}>`, inline: true }
				)
				.setFooter({ text: `${STAR_EMOJI} ${starCount} stars • #${message.channel.name}` })
				.setColor('#FFD700')
				.setTimestamp(message.createdAt);

			if (imageUrl) embed.setImage(imageUrl);

			const sent = await sbChannel.send({ embeds: [embed] });
			starboard[message.id] = sent.id;
			saveStarboard(starboard);

		} catch (err) {
			console.error('[Starboard] Error:', err.message);
		}
	});
};
