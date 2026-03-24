const { Events, EmbedBuilder } = require('discord.js');
const fs   = require('node:fs');
const path = require('node:path');

const afkPath = path.join(__dirname, '../data/afk.json');

function loadAfk() {
	try {
		if (!fs.existsSync(afkPath)) fs.writeFileSync(afkPath, JSON.stringify({}));
		return JSON.parse(fs.readFileSync(afkPath, 'utf8'));
	} catch { return {}; }
}

function saveAfk(data) {
	try {
		fs.writeFileSync(afkPath, JSON.stringify(data, null, 2));
	} catch {}
}

module.exports = (client) => {
	client.on(Events.MessageCreate, async (message) => {
		if (message.author.bot || !message.guild) return;

		const afk = loadAfk();
		const userId = message.author.id;

		// Remove AFK status when user sends a message
		if (afk[userId]) {
			delete afk[userId];
			saveAfk(afk);

			message.reply({
				embeds: [
					new EmbedBuilder()
						.setDescription(`👋 Welcome back, ${message.author}! Your AFK status has been removed.`)
						.setColor('#00FF00')
						.setTimestamp()
				]
			}).catch(() => null);
			return;
		}

		// Notify when an AFK user is mentioned
		const mentionedAfk = message.mentions.users.filter(u => afk[u.id] && !u.bot);
		if (mentionedAfk.size > 0) {
			const lines = mentionedAfk.map(u => {
				const entry = afk[u.id];
				const since = Math.floor((Date.now() - entry.since) / 60000);
				return `**${u.username}** is AFK: *${entry.reason}* (${since}m ago)`;
			});

			message.reply({
				embeds: [
					new EmbedBuilder()
						.setTitle('💤 AFK Notice')
						.setDescription(lines.join('\n'))
						.setColor('#FFFF00')
						.setTimestamp()
				]
			}).catch(() => null);
		}
	});
};
