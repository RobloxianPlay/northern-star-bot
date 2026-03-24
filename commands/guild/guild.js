const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs   = require('node:fs');
const path = require('node:path');

const guildsPath = path.join(__dirname, '../../data/guilds.json');

function load() {
	if (!fs.existsSync(guildsPath)) fs.writeFileSync(guildsPath, JSON.stringify({}));
	try { return JSON.parse(fs.readFileSync(guildsPath, 'utf8')); } catch { return {}; }
}
function save(d) { fs.writeFileSync(guildsPath, JSON.stringify(d, null, 2)); }

function findByUser(guilds, userId) {
	return Object.values(guilds).find(g => g.members.includes(userId) || g.owner === userId);
}
function findByName(guilds, name) {
	return Object.values(guilds).find(g => g.name.toLowerCase() === name.toLowerCase());
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('guild')
		.setDescription('Guild / Clan system')
		.addSubcommand(s => s.setName('create').setDescription('Create a guild')
			.addStringOption(o => o.setName('name').setDescription('Guild name').setRequired(true)))
		.addSubcommand(s => s.setName('invite').setDescription('Invite a member')
			.addUserOption(o => o.setName('user').setDescription('User to invite').setRequired(true)))
		.addSubcommand(s => s.setName('join').setDescription('Join a guild you were invited to')
			.addStringOption(o => o.setName('name').setDescription('Guild name').setRequired(true)))
		.addSubcommand(s => s.setName('leaderboard').setDescription('Top guilds by XP'))
		.addSubcommand(s => s.setName('info').setDescription('View your guild'))
		.addSubcommand(s => s.setName('leave').setDescription('Leave your current guild')),

	async execute(interaction) {
		const sub    = interaction.options.getSubcommand();
		const userId = interaction.user.id;
		const guilds = load();

		// ── CREATE ────────────────────────────────────────────────────────────
		if (sub === 'create') {
			const name = interaction.options.getString('name').trim();
			if (findByUser(guilds, userId)) return interaction.reply({ content: '❌ You are already in a guild.', ephemeral: true });
			if (findByName(guilds, name))   return interaction.reply({ content: '❌ That guild name is taken.', ephemeral: true });
			if (name.length < 2 || name.length > 30) return interaction.reply({ content: '❌ Guild name must be 2–30 characters.', ephemeral: true });

			const id = Date.now().toString();
			guilds[id] = { id, name, owner: userId, members: [userId], xp: 0, invites: [], createdAt: new Date().toISOString() };
			save(guilds);

			const embed = new EmbedBuilder()
				.setTitle('⚔️ Guild Created!')
				.setDescription(`**${name}** has been founded!\n\nInvite members with \`/guild invite @user\`.`)
				.setColor('#00C853').setTimestamp();
			return interaction.reply({ embeds: [embed] });
		}

		// ── INVITE ────────────────────────────────────────────────────────────
		if (sub === 'invite') {
			const target = interaction.options.getUser('user');
			const g      = findByUser(guilds, userId);
			if (!g)                   return interaction.reply({ content: '❌ You are not in a guild.', ephemeral: true });
			if (g.owner !== userId)   return interaction.reply({ content: '❌ Only the owner can invite.', ephemeral: true });
			if (findByUser(guilds, target.id)) return interaction.reply({ content: '❌ That user is already in a guild.', ephemeral: true });
			if (g.invites.includes(target.id)) return interaction.reply({ content: '❌ Already invited.', ephemeral: true });

			g.invites.push(target.id);
			save(guilds);

			const embed = new EmbedBuilder()
				.setDescription(`📨 ${target} has been invited to **${g.name}**!\nThey can accept with \`/guild join ${g.name}\``)
				.setColor('#0099FF').setTimestamp();
			return interaction.reply({ embeds: [embed] });
		}

		// ── JOIN ──────────────────────────────────────────────────────────────
		if (sub === 'join') {
			const name = interaction.options.getString('name');
			const g    = findByName(guilds, name);
			if (findByUser(guilds, userId)) return interaction.reply({ content: '❌ You are already in a guild.', ephemeral: true });
			if (!g)                         return interaction.reply({ content: '❌ Guild not found.', ephemeral: true });
			if (!g.invites.includes(userId)) return interaction.reply({ content: '❌ You have not been invited.', ephemeral: true });

			g.members.push(userId);
			g.invites = g.invites.filter(id => id !== userId);
			save(guilds);

			const embed = new EmbedBuilder()
				.setDescription(`✅ You joined **${g.name}**!`)
				.setColor('#00C853').setTimestamp();
			return interaction.reply({ embeds: [embed] });
		}

		// ── LEADERBOARD ───────────────────────────────────────────────────────
		if (sub === 'leaderboard') {
			const sorted = Object.values(guilds).sort((a, b) => (b.xp || 0) - (a.xp || 0)).slice(0, 10);
			if (!sorted.length) return interaction.reply('No guilds exist yet!');

			const medals = ['🥇','🥈','🥉'];
			const list   = sorted.map((g, i) => `${medals[i] || `**${i+1}.**`} **${g.name}** — ${(g.xp||0).toLocaleString()} XP | ${g.members.length} members`).join('\n');
			const embed  = new EmbedBuilder()
				.setTitle('🏆 Guild Leaderboard')
				.setDescription(list)
				.setColor('#FFD700').setTimestamp();
			return interaction.reply({ embeds: [embed] });
		}

		// ── INFO ──────────────────────────────────────────────────────────────
		if (sub === 'info') {
			const g = findByUser(guilds, userId);
			if (!g) return interaction.reply({ content: '❌ You are not in a guild.', ephemeral: true });

			const embed = new EmbedBuilder()
				.setTitle(`⚔️ ${g.name}`)
				.addFields(
					{ name: '👑 Owner',   value: `<@${g.owner}>`,   inline: true },
					{ name: '👥 Members', value: `${g.members.length}`, inline: true },
					{ name: '✨ Guild XP', value: (g.xp || 0).toLocaleString(), inline: true },
					{ name: '🧑 Roster',  value: g.members.map(id => `<@${id}>`).join(', ').slice(0, 1024) || 'None' },
					{ name: '📅 Founded', value: new Date(g.createdAt).toLocaleDateString() }
				)
				.setColor('#5865F2').setTimestamp();
			return interaction.reply({ embeds: [embed] });
		}

		// ── LEAVE ─────────────────────────────────────────────────────────────
		if (sub === 'leave') {
			const g = findByUser(guilds, userId);
			if (!g) return interaction.reply({ content: '❌ You are not in a guild.', ephemeral: true });
			if (g.owner === userId) return interaction.reply({ content: '❌ Owners cannot leave. Transfer ownership or disband first.', ephemeral: true });

			g.members = g.members.filter(id => id !== userId);
			save(guilds);
			return interaction.reply({ content: `✅ You left **${g.name}**.`, ephemeral: true });
		}
	}
};
