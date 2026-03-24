const { Events, EmbedBuilder } = require('discord.js');

module.exports = (client) => {
	const logChannelId = process.env.LOG_CHANNEL_ID;

	async function sendLog(guild, embed) {
		if (!logChannelId) return;
		try {
			const channel = await guild.channels.fetch(logChannelId);
			if (channel && channel.isTextBased()) {
				await channel.send({ embeds: [embed] });
			}
		} catch (error) {
			console.error('[Logger] Error sending log:', error);
		}
	}

	// Message Delete
	client.on(Events.MessageDelete, async (message) => {
		if (!message.guild || message.author.bot) return;

		const embed = new EmbedBuilder()
			.setTitle('🗑️ Message Deleted')
			.addFields(
				{ name: '👤 User', value: message.author.tag, inline: true },
				{ name: '#️⃣ Channel', value: `<#${message.channel.id}>`, inline: true },
				{ name: '📝 Content', value: message.content || '[No text content]', inline: false }
			)
			.setColor('#FF0000')
			.setFooter({ text: message.author.id })
			.setTimestamp();

		sendLog(message.guild, embed);
	});

	// Message Edit
	client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
		if (!newMessage.guild || newMessage.author.bot || oldMessage.content === newMessage.content) return;

		const embed = new EmbedBuilder()
			.setTitle('✏️ Message Edited')
			.addFields(
				{ name: '👤 User', value: newMessage.author.tag, inline: true },
				{ name: '#️⃣ Channel', value: `<#${newMessage.channel.id}>`, inline: true },
				{ name: '📝 Old Content', value: oldMessage.content || '[No text content]', inline: false },
				{ name: '📝 New Content', value: newMessage.content || '[No text content]', inline: false }
			)
			.setColor('#FFFF00')
			.setFooter({ text: newMessage.author.id })
			.setTimestamp();

		sendLog(newMessage.guild, embed);
	});

	// Member Join
	client.on(Events.GuildMemberAdd, async (member) => {
		const embed = new EmbedBuilder()
			.setTitle('➕ Member Joined')
			.addFields(
				{ name: '👤 User', value: member.user.tag, inline: true },
				{ name: '🆔 User ID', value: member.id, inline: true },
				{ name: '📅 Joined At', value: new Date().toLocaleString(), inline: false }
			)
			.setColor('#00FF00')
			.setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
			.setFooter({ text: member.id })
			.setTimestamp();

		sendLog(member.guild, embed);
	});

	// Member Leave
	client.on(Events.GuildMemberRemove, async (member) => {
		const embed = new EmbedBuilder()
			.setTitle('➖ Member Left')
			.addFields(
				{ name: '👤 User', value: member.user.tag, inline: true },
				{ name: '🆔 User ID', value: member.id, inline: true },
				{ name: '📅 Left At', value: new Date().toLocaleString(), inline: false }
			)
			.setColor('#FF6600')
			.setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
			.setFooter({ text: member.id })
			.setTimestamp();

		sendLog(member.guild, embed);
	});

	// Role Added
	client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
		const addedRoles = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));

		addedRoles.forEach(role => {
			const embed = new EmbedBuilder()
				.setTitle('⚡ Role Added')
				.addFields(
					{ name: '👤 User', value: newMember.user.tag, inline: true },
					{ name: '🔘 Role', value: role.name, inline: true },
					{ name: '📅 Added At', value: new Date().toLocaleString(), inline: false }
				)
				.setColor('#0099FF')
				.setFooter({ text: newMember.id })
				.setTimestamp();

			sendLog(newMember.guild, embed);
		});
	});

	// Role Removed
	client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
		const removedRoles = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));

		removedRoles.forEach(role => {
			const embed = new EmbedBuilder()
				.setTitle('❌ Role Removed')
				.addFields(
					{ name: '👤 User', value: newMember.user.tag, inline: true },
					{ name: '🔘 Role', value: role.name, inline: true },
					{ name: '📅 Removed At', value: new Date().toLocaleString(), inline: false }
				)
				.setColor('#FF0000')
				.setFooter({ text: newMember.id })
				.setTimestamp();

			sendLog(newMember.guild, embed);
		});
	});
};
