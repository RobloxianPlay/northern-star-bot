const { Events, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const joinLog    = new Map(); // guildId -> [timestamps]
const spamLog    = new Map(); // userId -> [timestamps]
const mutedUsers = new Set();

const JOIN_THRESHOLD  = 10; // joins within window
const JOIN_WINDOW     = 10000; // 10 seconds
const SPAM_THRESHOLD  = 5;  // messages within window
const SPAM_WINDOW     = 5000; // 5 seconds
const MUTE_DURATION   = 5 * 60 * 1000; // 5 minutes

module.exports = (client) => {
	const logChannelId = process.env.LOG_CHANNEL_ID;

	async function sendAlert(guild, embed) {
		if (!logChannelId) return;
		try {
			const ch = await guild.channels.fetch(logChannelId).catch(() => null);
			if (ch?.isTextBased()) await ch.send({ embeds: [embed] });
		} catch {}
	}

	async function muteUser(member, reason) {
		if (!member || mutedUsers.has(member.id)) return;
		try {
			mutedUsers.add(member.id);
			await member.timeout(MUTE_DURATION, reason);
			setTimeout(() => mutedUsers.delete(member.id), MUTE_DURATION);

			const embed = new EmbedBuilder()
				.setTitle('🔇 Auto-Mute — Anti-Raid')
				.setDescription(`${member.user.tag} was automatically timed out.`)
				.addFields(
					{ name: '👤 User', value: `<@${member.id}>`, inline: true },
					{ name: '📋 Reason', value: reason, inline: true },
					{ name: '⏱️ Duration', value: '5 minutes', inline: true }
				)
				.setColor('#FF4400')
				.setTimestamp();

			await sendAlert(member.guild, embed);
		} catch (err) {
			console.error('[AntiRaid] Mute error:', err.message);
		}
	}

	// Rapid join detection
	client.on(Events.GuildMemberAdd, async (member) => {
		const guildId = member.guild.id;
		const now = Date.now();

		if (!joinLog.has(guildId)) joinLog.set(guildId, []);
		const joins = joinLog.get(guildId);
		joins.push(now);

		// Clean old entries
		const recent = joins.filter(t => now - t < JOIN_WINDOW);
		joinLog.set(guildId, recent);

		if (recent.length >= JOIN_THRESHOLD) {
			joinLog.set(guildId, []);

			const embed = new EmbedBuilder()
				.setTitle('🚨 RAID DETECTED')
				.setDescription(`**${recent.length} members** joined in the last 10 seconds!`)
				.addFields(
					{ name: '🛡️ Action', value: 'Alert sent. Manually enable verification if needed.' },
					{ name: '📅 Detected', value: new Date().toLocaleString() }
				)
				.setColor('#FF0000')
				.setTimestamp();

			await sendAlert(member.guild, embed);
		}
	});

	// Spam detection
	client.on(Events.MessageCreate, async (message) => {
		if (!message.guild || message.author.bot) return;
		if (message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) return;

		const userId = message.author.id;
		const now = Date.now();

		if (!spamLog.has(userId)) spamLog.set(userId, []);
		const msgs = spamLog.get(userId);
		msgs.push(now);

		const recent = msgs.filter(t => now - t < SPAM_WINDOW);
		spamLog.set(userId, recent);

		if (recent.length >= SPAM_THRESHOLD) {
			spamLog.set(userId, []);
			await muteUser(message.member, 'Spam detection: too many messages in quick succession');

			await message.channel.send({
				embeds: [
					new EmbedBuilder()
						.setDescription(`⚠️ ${message.author} has been timed out for **spam**.`)
						.setColor('#FF4400')
						.setTimestamp()
				]
			}).catch(() => null);
		}
	});
};
