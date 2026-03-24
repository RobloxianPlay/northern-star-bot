const { Events } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = (client) => {
	const dataPath = path.join(__dirname, '../data/reactionRoles.json');

	client.on(Events.MessageReactionAdd, async (reaction, user) => {
		if (user.bot) return;
		if (reaction.partial) await reaction.fetch().catch(() => null);

		if (!fs.existsSync(dataPath)) return;
		const db = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
		const roles = db[reaction.message.id];

		if (roles) {
			const emoji = reaction.emoji.id ? `<:${reaction.emoji.name}:${reaction.emoji.id}>` : reaction.emoji.name;
			const entry = roles.find(r => r.emoji === emoji || r.emoji === reaction.emoji.name || r.emoji === reaction.emoji.id);
			if (entry) {
				const member = await reaction.message.guild.members.fetch(user.id);
				await member.roles.add(entry.roleId).catch(() => null);
			}
		}
	});

	client.on(Events.MessageReactionRemove, async (reaction, user) => {
		if (user.bot) return;
		if (reaction.partial) await reaction.fetch().catch(() => null);

		if (!fs.existsSync(dataPath)) return;
		const db = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
		const roles = db[reaction.message.id];

		if (roles) {
			const emoji = reaction.emoji.id ? `<:${reaction.emoji.name}:${reaction.emoji.id}>` : reaction.emoji.name;
			const entry = roles.find(r => r.emoji === emoji || r.emoji === reaction.emoji.name || r.emoji === reaction.emoji.id);
			if (entry) {
				const member = await reaction.message.guild.members.fetch(user.id);
				await member.roles.remove(entry.roleId).catch(() => null);
			}
		}
	});
};
