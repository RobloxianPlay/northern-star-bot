const {
	Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder,
	ButtonStyle, ChannelType, PermissionFlagsBits, AttachmentBuilder
} = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const ticketsPath    = path.join(__dirname, '../data/tickets.json');
const transcriptDir  = path.join(__dirname, '../transcripts');

function loadTickets() {
	if (!fs.existsSync(ticketsPath)) fs.writeFileSync(ticketsPath, JSON.stringify({}));
	return JSON.parse(fs.readFileSync(ticketsPath, 'utf8'));
}

function saveTickets(data) {
	fs.writeFileSync(ticketsPath, JSON.stringify(data, null, 2));
}

function nextTicketNumber(tickets) {
	const nums = Object.values(tickets).map(t => t.number || 0);
	return (nums.length ? Math.max(...nums) : 0) + 1;
}

function ticketButtons(userId, closed = false) {
	const row = new ActionRowBuilder();
	if (!closed) {
		row.addComponents(
			new ButtonBuilder()
				.setCustomId(`close_ticket_${userId}`)
				.setLabel('Close Ticket')
				.setEmoji('🔒')
				.setStyle(ButtonStyle.Danger),
			new ButtonBuilder()
				.setCustomId(`claim_ticket_${userId}`)
				.setLabel('Claim')
				.setEmoji('🙋')
				.setStyle(ButtonStyle.Success),
			new ButtonBuilder()
				.setCustomId(`add_staff_${userId}`)
				.setLabel('Add Staff')
				.setEmoji('👥')
				.setStyle(ButtonStyle.Primary),
			new ButtonBuilder()
				.setCustomId(`delete_ticket_${userId}`)
				.setLabel('Delete')
				.setEmoji('🗑️')
				.setStyle(ButtonStyle.Secondary)
		);
	} else {
		row.addComponents(
			new ButtonBuilder()
				.setCustomId(`reopen_ticket_${userId}`)
				.setLabel('Reopen Ticket')
				.setEmoji('🔓')
				.setStyle(ButtonStyle.Success),
			new ButtonBuilder()
				.setCustomId(`delete_ticket_${userId}`)
				.setLabel('Delete')
				.setEmoji('🗑️')
				.setStyle(ButtonStyle.Secondary)
		);
	}
	return row;
}

async function buildTranscript(channel) {
	try {
		const fetched = await channel.messages.fetch({ limit: 100 });
		const msgs    = [...fetched.values()].reverse();
		let txt = `===== TICKET TRANSCRIPT =====\n`;
		txt += `Channel : ${channel.name}\n`;
		txt += `Exported: ${new Date().toLocaleString()}\n`;
		txt += `Messages: ${msgs.length}\n`;
		txt += `=============================\n\n`;
		for (const m of msgs) {
			const time  = m.createdAt.toLocaleString();
			const who   = `${m.author.username}#${m.author.discriminator}`;
			const body  = m.content || (m.embeds.length ? '[Embed]' : '[Attachment]');
			txt += `[${time}] ${who}: ${body}\n`;
		}
		return txt;
	} catch {
		return 'Could not build transcript.';
	}
}

async function sendTranscript(guild, channel, userId, logChannelId) {
	const content = await buildTranscript(channel);

	if (!fs.existsSync(transcriptDir)) fs.mkdirSync(transcriptDir, { recursive: true });
	const filePath = path.join(transcriptDir, `${channel.name}-${Date.now()}.txt`);
	fs.writeFileSync(filePath, content);

	if (!logChannelId) return;
	try {
		const logCh = await guild.channels.fetch(logChannelId).catch(() => null);
		if (!logCh?.isTextBased()) return;

		const attachment = new AttachmentBuilder(Buffer.from(content), { name: `${channel.name}.txt` });
		const embed = new EmbedBuilder()
			.setTitle('📄 Ticket Transcript')
			.addFields(
				{ name: 'Channel', value: channel.name, inline: true },
				{ name: 'User', value: `<@${userId}>`, inline: true },
				{ name: 'Closed At', value: new Date().toLocaleString(), inline: false }
			)
			.setColor('#5865F2')
			.setTimestamp();

		await logCh.send({ embeds: [embed], files: [attachment] });
	} catch (err) {
		console.error('[Ticket] Transcript send error:', err.message);
	}
}

async function logAction(guild, action, data, logChannelId) {
	if (!logChannelId) return;
	try {
		const logCh = await guild.channels.fetch(logChannelId).catch(() => null);
		if (!logCh?.isTextBased()) return;
		const colors = { Created: '#00C853', Closed: '#FFD600', Deleted: '#D50000', Reopened: '#00B0FF', Claimed: '#AA00FF' };
		const embed = new EmbedBuilder()
			.setTitle(`🎫 Ticket ${action}`)
			.addFields(
				{ name: 'Ticket Owner', value: `<@${data.userId}>`, inline: true },
				{ name: 'Channel', value: data.channelId ? `<#${data.channelId}>` : 'Deleted', inline: true },
				{ name: 'Staff', value: data.staffId ? `<@${data.staffId}>` : 'N/A', inline: true }
			)
			.setColor(colors[action] || '#5865F2')
			.setTimestamp();
		await logCh.send({ embeds: [embed] });
	} catch (err) {
		console.error('[Ticket] Log error:', err.message);
	}
}

module.exports = (client) => {
	const categoryId   = process.env.TICKET_CATEGORY_ID;
	const staffRoleId  = process.env.STAFF_ROLE_ID;
	const logChannelId = process.env.LOG_CHANNEL_ID;

	client.on(Events.InteractionCreate, async (interaction) => {
		if (!interaction.isButton()) return;

		const { customId, user, guild, member } = interaction;
		const isStaff = member.roles.cache.has(staffRoleId) || member.permissions.has(PermissionFlagsBits.Administrator);

		// ── CREATE ─────────────────────────────────────────────────────────────
		if (customId === 'create_ticket') {
			const tickets = loadTickets();

			// Duplicate check via JSON (survives renames)
			const existing = Object.values(tickets).find(t => t.userId === user.id && t.status === 'open');
			if (existing) {
				const ch = guild.channels.cache.get(existing.channelId);
				return interaction.reply({
					content: ch ? `You already have an open ticket: ${ch}` : 'You already have an open ticket.',
					ephemeral: true
				});
			}

			await interaction.deferReply({ ephemeral: true });

			try {
				const num  = String(nextTicketNumber(tickets)).padStart(4, '0');
				const name = `ticket-${num}-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

				const ticketChannel = await guild.channels.create({
					name,
					type: ChannelType.GuildText,
					parent: categoryId || null,
					topic: `Support ticket for ${user.tag} | ID: ${user.id}`,
					permissionOverwrites: [
						{ id: guild.id,   deny:  [PermissionFlagsBits.ViewChannel] },
						{ id: user.id,    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
						{ id: staffRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] }
					]
				});

				const embed = new EmbedBuilder()
					.setTitle(`🎫 Ticket #${num}`)
					.setDescription(`Welcome ${user}!\n\nPlease describe your issue in detail and a staff member will assist you shortly.`)
					.setThumbnail(user.displayAvatarURL({ dynamic: true }))
					.addFields(
						{ name: '👤 Opened by', value: `${user.tag}`, inline: true },
						{ name: '🔢 Ticket #', value: num, inline: true },
						{ name: '📅 Created', value: new Date().toLocaleString(), inline: false }
					)
					.setColor('#5865F2')
					.setFooter({ text: 'Use the buttons below to manage this ticket.' })
					.setTimestamp();

				await ticketChannel.send({
					content: `${user} | <@&${staffRoleId}>`,
					embeds: [embed],
					components: [ticketButtons(user.id)]
				});

				tickets[user.id] = {
					userId: user.id,
					channelId: ticketChannel.id,
					number: parseInt(num),
					status: 'open',
					claimedBy: null,
					createdAt: new Date().toISOString()
				};
				saveTickets(tickets);

				await logAction(guild, 'Created', { userId: user.id, channelId: ticketChannel.id, staffId: null }, logChannelId);
				await interaction.editReply({ content: `✅ Ticket created: ${ticketChannel}` });
			} catch (err) {
				console.error('[Ticket] Create error:', err);
				await interaction.editReply({ content: '❌ Failed to create ticket. Check bot permissions.' });
			}
		}

		// ── CLOSE ──────────────────────────────────────────────────────────────
		if (customId.startsWith('close_ticket_')) {
			const ownerId = customId.split('_')[2];
			if (user.id !== ownerId && !isStaff) {
				return interaction.reply({ content: '❌ Only the ticket owner or staff can close this ticket.', ephemeral: true });
			}

			await interaction.deferReply();
			try {
				const channel = interaction.channel;
				await channel.permissionOverwrites.edit(ownerId, { SendMessages: false });

				const embed = new EmbedBuilder()
					.setTitle('🔒 Ticket Closed')
					.setDescription(`Closed by ${user}\n\nA transcript has been saved. Staff may reopen or delete this ticket.`)
					.setColor('#FFD600')
					.setTimestamp();

				await interaction.editReply({ embeds: [embed], components: [ticketButtons(ownerId, true)] });

				// Remove the original open buttons by editing the first bot message
				const msgs = await channel.messages.fetch({ limit: 20 });
				const openMsg = msgs.find(m => m.author.bot && m.components.length > 0 && m.id !== interaction.message?.id);
				if (openMsg) await openMsg.edit({ components: [] }).catch(() => null);

				await sendTranscript(guild, channel, ownerId, logChannelId);

				const tickets = loadTickets();
				if (tickets[ownerId]) {
					tickets[ownerId].status = 'closed';
					tickets[ownerId].closedAt = new Date().toISOString();
					tickets[ownerId].closedBy = user.id;
					saveTickets(tickets);
				}

				await logAction(guild, 'Closed', { userId: ownerId, channelId: channel.id, staffId: user.id }, logChannelId);
			} catch (err) {
				console.error('[Ticket] Close error:', err);
				await interaction.editReply({ content: '❌ Failed to close ticket.' });
			}
		}

		// ── CLAIM ──────────────────────────────────────────────────────────────
		if (customId.startsWith('claim_ticket_')) {
			if (!isStaff) {
				return interaction.reply({ content: '❌ Only staff can claim tickets.', ephemeral: true });
			}

			const ownerId = customId.split('_')[2];
			const tickets = loadTickets();
			if (tickets[ownerId]?.claimedBy) {
				const claimer = tickets[ownerId].claimedBy;
				return interaction.reply({ content: `⚠️ This ticket is already claimed by <@${claimer}>.`, ephemeral: true });
			}

			if (tickets[ownerId]) {
				tickets[ownerId].claimedBy = user.id;
				saveTickets(tickets);
			}

			const embed = new EmbedBuilder()
				.setDescription(`🙋 **${user.tag}** has claimed this ticket and will assist you!`)
				.setColor('#AA00FF')
				.setTimestamp();

			await interaction.reply({ embeds: [embed] });
			await logAction(guild, 'Claimed', { userId: ownerId, channelId: interaction.channel.id, staffId: user.id }, logChannelId);
		}

		// ── ADD STAFF ──────────────────────────────────────────────────────────
		if (customId.startsWith('add_staff_')) {
			if (!isStaff) {
				return interaction.reply({ content: '❌ Only staff can use this button.', ephemeral: true });
			}

			const channel = interaction.channel;
			const staffRole = guild.roles.cache.get(staffRoleId);

			if (staffRole && channel.permissionOverwrites.cache.has(staffRoleId)) {
				return interaction.reply({ content: '⚠️ Staff role already has access to this ticket.', ephemeral: true });
			}

			await channel.permissionOverwrites.create(staffRole, {
				ViewChannel: true, SendMessages: true, ReadMessageHistory: true, AttachFiles: true
			});

			await interaction.reply({ content: `✅ <@&${staffRoleId}> has been added to this ticket.` });
		}

		// ── REOPEN ─────────────────────────────────────────────────────────────
		if (customId.startsWith('reopen_ticket_')) {
			if (!isStaff) {
				return interaction.reply({ content: '❌ Only staff can reopen tickets.', ephemeral: true });
			}

			const ownerId = customId.split('_')[2];
			const channel = interaction.channel;

			await channel.permissionOverwrites.edit(ownerId, { SendMessages: true, ViewChannel: true });

			const embed = new EmbedBuilder()
				.setDescription(`🔓 Ticket reopened by ${user}. <@${ownerId}> can now send messages again.`)
				.setColor('#00B0FF')
				.setTimestamp();

			await interaction.reply({ embeds: [embed], components: [ticketButtons(ownerId)] });

			const tickets = loadTickets();
			if (tickets[ownerId]) {
				tickets[ownerId].status = 'open';
				tickets[ownerId].reopenedAt = new Date().toISOString();
				tickets[ownerId].claimedBy = null;
				saveTickets(tickets);
			}

			await logAction(guild, 'Reopened', { userId: ownerId, channelId: channel.id, staffId: user.id }, logChannelId);
		}

		// ── DELETE ─────────────────────────────────────────────────────────────
		if (customId.startsWith('delete_ticket_')) {
			if (!isStaff) {
				return interaction.reply({ content: '❌ Only staff can delete tickets.', ephemeral: true });
			}

			const ownerId = customId.split('_')[2];
			await interaction.reply({ content: '🗑️ Deleting ticket in **5 seconds**...' });

			const tickets = loadTickets();
			if (tickets[ownerId]) {
				tickets[ownerId].status = 'deleted';
				tickets[ownerId].deletedAt = new Date().toISOString();
				tickets[ownerId].deletedBy = user.id;
				saveTickets(tickets);
			}

			await logAction(guild, 'Deleted', { userId: ownerId, channelId: interaction.channel.id, staffId: user.id }, logChannelId);

			setTimeout(() => interaction.channel.delete().catch(() => null), 5000);
		}
	});
};
