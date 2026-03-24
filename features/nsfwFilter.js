const { Events, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const badWords = ['porn', 'nsfw', 'sex', 'xxx', 'adult', 'explicit'];
const settingsPath = path.join(__dirname, '../data/nsfwSettings.json');

module.exports = (client) => {
	if (!fs.existsSync(settingsPath)) {
		fs.writeFileSync(settingsPath, JSON.stringify({}));
	}

	function isNsfwEnabled(guildId) {
		const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
		return settings[guildId]?.enabled !== false;
	}

	client.on(Events.MessageCreate, async (message) => {
		if (message.author.bot || !message.guild) return;

		// Check if NSFW filter is enabled
		if (!isNsfwEnabled(message.guild.id)) return;

		// Ignore admins
		if (message.member.permissions.has(PermissionFlagsBits.Administrator)) return;

		const content = message.content.toLowerCase();
		const foundWords = badWords.filter(word => content.includes(word));

		if (foundWords.length > 0) {
			try {
				// Delete the message
				await message.delete();

				// Send warning embed
				const embed = new EmbedBuilder()
					.setTitle('⚠️ Message Removed')
					.setDescription(`${message.author}, your message was removed for containing inappropriate content.`)
					.setColor('#FF0000')
					.setTimestamp();

				await message.channel.send({ embeds: [embed] });

				// Log the event
				console.log(`[NSFW] ${message.author.tag} in ${message.guild.name}: "${message.content}"`);
			} catch (error) {
				console.error('[NSFW] Error deleting message:', error);
			}
		}
	});

	// Expose toggle function
	client.toggleNsfwFilter = (guildId, enabled) => {
		const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
		if (!settings[guildId]) {
			settings[guildId] = {};
		}
		settings[guildId].enabled = enabled;
		fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
	};
};
