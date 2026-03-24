const { Events, EmbedBuilder, ChannelType } = require('discord.js');
const fs   = require('node:fs');
const path = require('node:path');

const statsPath   = path.join(__dirname, '../data/serverStats.json');
const economyPath = path.join(__dirname, '../data/economy.json');
const xpPath      = path.join(__dirname, '../data/xp.json');

function load(p, def) {
	if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(def));
	try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return def; }
}

const defaultStats = { messageCount: 0, minigameWins: 0, memberCount: 0, achievements: [] };

const achievements = [
	// Messages
	{ id: 'msg_1k',    label: '1,000 Messages!',    type: 'messages', count: 1000,   coins: 50,   xp: 30,  emoji: '💬' },
	{ id: 'msg_10k',   label: '10,000 Messages!',   type: 'messages', count: 10000,  coins: 200,  xp: 100, emoji: '📢' },
	{ id: 'msg_50k',   label: '50,000 Messages!',   type: 'messages', count: 50000,  coins: 500,  xp: 250, emoji: '🔥' },
	{ id: 'msg_100k',  label: '100,000 Messages!',  type: 'messages', count: 100000, coins: 1000, xp: 500, emoji: '🏆' },
	// Members
	{ id: 'mem_50',    label: '50 Members!',         type: 'members',  count: 50,    coins: 100,  xp: 50,  emoji: '👥' },
	{ id: 'mem_100',   label: '100 Members!',        type: 'members',  count: 100,   coins: 250,  xp: 100, emoji: '🎊' },
	{ id: 'mem_500',   label: '500 Members!',        type: 'members',  count: 500,   coins: 800,  xp: 300, emoji: '🌟' },
	// Minigame wins
	{ id: 'mini_10',   label: '10 Minigame Wins!',   type: 'minigames', count: 10,   coins: 75,   xp: 40,  emoji: '🎮' },
	{ id: 'mini_50',   label: '50 Minigame Wins!',   type: 'minigames', count: 50,   coins: 300,  xp: 150, emoji: '🕹️' },
	{ id: 'mini_100',  label: '100 Minigame Wins!',  type: 'minigames', count: 100,  coins: 600,  xp: 300, emoji: '🎯' },
];

async function checkAndAward(guild, stats, channel) {
	const economy = load(economyPath, {});
	const xpData  = load(xpPath, {});
	let awarded = false;

	for (const ach of achievements) {
		if (stats.achievements.includes(ach.id)) continue;

		let currentVal = 0;
		if (ach.type === 'messages')  currentVal = stats.messageCount;
		if (ach.type === 'members')   currentVal = guild.memberCount;
		if (ach.type === 'minigames') currentVal = stats.minigameWins;

		if (currentVal < ach.count) continue;

		stats.achievements.push(ach.id);
		awarded = true;

		const members = guild.members.cache.filter(m => !m.user.bot);
		members.forEach(m => {
			if (!economy[m.id]) economy[m.id] = { coins: 0 };
			if (!xpData[m.id])  xpData[m.id]  = { xp: 0, level: 1 };
			economy[m.id].coins += ach.coins;
			xpData[m.id].xp    += ach.xp;
		});

		const embed = new EmbedBuilder()
			.setTitle(`${ach.emoji} SERVER ACHIEVEMENT UNLOCKED!`)
			.setDescription(
				`**${ach.label}**\n\n` +
				`🎁 Every member received:\n💰 +${ach.coins} coins | ✨ +${ach.xp} XP`
			)
			.setColor('#FFD700')
			.setFooter({ text: `Server Achievement • ${guild.name}` })
			.setTimestamp();

		if (channel) channel.send({ embeds: [embed] }).catch(() => null);
	}

	if (awarded) {
		fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));
		fs.writeFileSync(xpPath, JSON.stringify(xpData, null, 2));
		fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
	}
}

module.exports = (client) => {
	module.exports.incrementMinigameWins = function () {
		const stats = load(statsPath, defaultStats);
		stats.minigameWins = (stats.minigameWins || 0) + 1;
		fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
	};

	client.on(Events.MessageCreate, async (message) => {
		if (message.author.bot || !message.guild) return;
		const stats = load(statsPath, defaultStats);
		stats.messageCount = (stats.messageCount || 0) + 1;
		fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
		await checkAndAward(message.guild, stats, message.channel).catch(() => null);
	});

	client.on(Events.GuildMemberAdd, async (member) => {
		const stats = load(statsPath, defaultStats);
		await checkAndAward(member.guild, stats, null).catch(() => null);
	});
};

module.exports.incrementMinigameWins = function () {
	const stats = load(statsPath, defaultStats);
	stats.minigameWins = (stats.minigameWins || 0) + 1;
	fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
};
