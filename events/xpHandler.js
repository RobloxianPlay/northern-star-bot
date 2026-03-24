const { Events, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const xpPath        = path.join(__dirname, '../data/xp.json');
const levelRolesPath = path.join(__dirname, '../data/levelRoles.json');
const guildsPath    = path.join(__dirname, '../data/guilds.json');

const xpCooldowns = new Map();

function loadJSON(filePath, def = {}) {
	try {
		if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify(def));
		return JSON.parse(fs.readFileSync(filePath, 'utf8'));
	} catch {
		return def;
	}
}

function saveJSON(filePath, data) {
	try {
		fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
	} catch (err) {
		console.error('[XPHandler] Save error:', err.message);
	}
}

function buildProgressBar(current, needed, length = 20) {
	const percent = Math.min(current / needed, 1);
	const filled = Math.floor(percent * length);
	return '█'.repeat(filled) + '░'.repeat(length - filled);
}

function awardGuildXp(userId, amount) {
	if (!fs.existsSync(guildsPath)) return;
	try {
		const guilds = loadJSON(guildsPath);
		const guild = Object.values(guilds).find(g =>
			(g.members && g.members.includes(userId)) || g.owner === userId
		);
		if (!guild) return;
		guild.xp = (guild.xp || 0) + amount;
		saveJSON(guildsPath, guilds);
	} catch {}
}

module.exports = (client) => {
	if (!fs.existsSync(xpPath)) saveJSON(xpPath, {});

	client.on(Events.MessageCreate, async (message) => {
		if (message.author.bot || !message.guild) return;

		const userId = message.author.id;

		// 60-second XP cooldown per user
		const lastXp = xpCooldowns.get(userId);
		if (lastXp && Date.now() - lastXp < 60000) return;
		xpCooldowns.set(userId, Date.now());

		const xpData = loadJSON(xpPath);

		if (!xpData[userId]) xpData[userId] = { xp: 0, level: 1 };

		const xpToGive = Math.floor(Math.random() * 11) + 15; // 15–25
		xpData[userId].xp += xpToGive;

		const xpNeeded = xpData[userId].level * xpData[userId].level * 100;

		if (xpData[userId].xp >= xpNeeded) {
			xpData[userId].level++;
			xpData[userId].xp = 0;

			const level = xpData[userId].level;
			const nextNeeded = level * level * 100;

			const levelUpEmbed = new EmbedBuilder()
				.setTitle('🎉 Level Up!')
				.setDescription(`Congratulations ${message.author}! You reached **Level ${level}**!`)
				.addFields(
					{ name: '⭐ New Level', value: `\`${level}\``, inline: true },
					{ name: '📈 XP Progress', value: `\`0 / ${nextNeeded}\``, inline: true },
					{ name: '📊 Progress Bar', value: `\`${buildProgressBar(0, nextNeeded)}\` 0%`, inline: false }
				)
				.setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
				.setColor('#FFD700')
				.setTimestamp();

			message.channel.send({ embeds: [levelUpEmbed] }).catch(() => null);

			// Check for level role rewards
			if (fs.existsSync(levelRolesPath)) {
				const levelRoles = loadJSON(levelRolesPath);
				if (levelRoles[level]) {
					const roleId = levelRoles[level];
					const role = message.guild.roles.cache.get(roleId);
					if (role && message.member && !message.member.roles.cache.has(roleId)) {
						try {
							await message.member.roles.add(role);
							const roleEmbed = new EmbedBuilder()
								.setTitle('🏆 Level Role Unlocked!')
								.setDescription(`${message.author} reached Level **${level}** and earned the **${role.name}** role!`)
								.setColor('#FFD700')
								.setTimestamp();
							message.channel.send({ embeds: [roleEmbed] }).catch(() => null);
						} catch (err) {
							console.error('[XPHandler] Role add error:', err.message);
						}
					}
				}
			}
		}

		saveJSON(xpPath, xpData);
		awardGuildXp(userId, 5);
	});

	// Auto-role for verified users
	client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
		const verifiedRoleId = process.env.VERIFIED_ROLE_ID || '1433916846658162818';
		const levelOneRoleId = process.env.LEVEL_ONE_ROLE_ID || '1434222664448348350';

		const hadRole = oldMember.roles.cache.has(verifiedRoleId);
		const hasRole = newMember.roles.cache.has(verifiedRoleId);

		if (!hadRole && hasRole) {
			const role = newMember.guild.roles.cache.get(levelOneRoleId);
			if (role && !newMember.roles.cache.has(levelOneRoleId)) {
				await newMember.roles.add(role).catch(err =>
					console.error('[XPHandler] Verified role error:', err.message)
				);
			}
		}
	});
};
