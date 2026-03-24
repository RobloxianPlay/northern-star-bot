const { EmbedBuilder, ChannelType } = require('discord.js');
const fs   = require('node:fs');
const path = require('node:path');

const eventsPath  = path.join(__dirname, '../data/events.json');

const cosmicTypes = [
	{ type: 'double_xp',    label: '2x XP Storm',       desc: 'All XP gains are doubled!',               xpMult: 2, coinMult: 1,   emoji: '⚡' },
	{ type: 'double_coins', label: '2x Coin Rain',       desc: 'All coin rewards are doubled!',           xpMult: 1, coinMult: 2,   emoji: '💰' },
	{ type: 'full_boost',   label: 'Full Cosmic Surge',  desc: 'XP and coins both doubled!',              xpMult: 2, coinMult: 2,   emoji: '🌌' },
	{ type: 'loot_frenzy',  label: 'Loot Frenzy',        desc: 'Rare loot chance tripled!',               xpMult: 1.5, coinMult: 1.5, emoji: '🎁' },
	{ type: 'boss_power',   label: 'Boss Power Surge',   desc: 'Boss rewards are tripled!',               xpMult: 1, coinMult: 1,   emoji: '👹' },
];

function loadEvent() {
	if (!fs.existsSync(eventsPath)) {
		const def = { active: false, multiplier: 1, xpMult: 1, coinMult: 1, endsAt: null, type: null };
		fs.writeFileSync(eventsPath, JSON.stringify(def, null, 2));
		return def;
	}
	return JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
}

function getMultipliers() {
	const ev = loadEvent();
	if (!ev.active || (ev.endsAt && Date.now() > ev.endsAt)) {
		if (ev.active) {
			ev.active = false; ev.xpMult = 1; ev.coinMult = 1;
			fs.writeFileSync(eventsPath, JSON.stringify(ev, null, 2));
		}
		return { xpMult: 1, coinMult: 1, active: false, type: null };
	}
	return { xpMult: ev.xpMult || 1, coinMult: ev.coinMult || 1, active: true, type: ev.type, label: ev.label, emoji: ev.emoji };
}

module.exports = (client) => {
	module.exports.getMultipliers = getMultipliers;

	async function activateEvent(guild) {
		const ev = cosmicTypes[Math.floor(Math.random() * cosmicTypes.length)];
		const duration = 10 * 60 * 1000; // 10 minutes
		const endsAt   = Date.now() + duration;

		const eventData = {
			active: true,
			type: ev.type,
			label: ev.label,
			emoji: ev.emoji,
			xpMult: ev.xpMult,
			coinMult: ev.coinMult,
			endsAt
		};
		fs.writeFileSync(eventsPath, JSON.stringify(eventData, null, 2));

		const channel = guild.channels.cache.find(c => c.isTextBased() && c.type === ChannelType.GuildText);
		if (!channel) return;

		const embed = new EmbedBuilder()
			.setTitle(`🌌 COSMIC EVENT ACTIVATED — ${ev.emoji} ${ev.label}`)
			.setDescription(`**${ev.desc}**\n\nThis event lasts **10 minutes**.\n\n> Get active now to maximise your rewards!`)
			.addFields(
				{ name: '✨ XP Multiplier',   value: `${ev.xpMult}x`,   inline: true },
				{ name: '💰 Coin Multiplier', value: `${ev.coinMult}x`, inline: true },
				{ name: '⏳ Ends In',          value: '10 minutes',      inline: true }
			)
			.setColor('#9B59B6')
			.setFooter({ text: 'Cosmic Event • All systems boosted!' })
			.setTimestamp();

		await channel.send({ embeds: [embed] }).catch(() => null);

		setTimeout(async () => {
			const data = loadEvent();
			if (data.active) {
				data.active = false; data.xpMult = 1; data.coinMult = 1;
				fs.writeFileSync(eventsPath, JSON.stringify(data, null, 2));
				channel.send(`🌌 The **${ev.label}** cosmic event has ended. Back to normal rewards.`).catch(() => null);
			}
		}, duration);
	}

	// Trigger every ~45 min with 20% chance
	setInterval(() => {
		const ev = loadEvent();
		if (ev.active) return;
		if (Math.random() > 0.20) return;
		client.guilds.cache.forEach(g => activateEvent(g).catch(() => null));
	}, 2700000);
};

module.exports.getMultipliers = getMultipliers;
