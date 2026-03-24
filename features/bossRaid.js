const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const fs   = require('node:fs');
const path = require('node:path');

const economyPath = path.join(__dirname, '../data/economy.json');
const xpPath      = path.join(__dirname, '../data/xp.json');
const petsPath    = path.join(__dirname, '../data/pets.json');
const bossPath    = path.join(__dirname, '../data/boss.json');

const rarePetDrops = [
	{ name: 'Phoenix',    emoji: '🦅', rarity: 'Legendary', xpBoost: 0.20, coinBoost: 0.15 },
	{ name: 'Shadow Wolf',emoji: '🐺', rarity: 'Epic',      xpBoost: 0.12, coinBoost: 0.12 },
	{ name: 'Fire Drake', emoji: '🔥', rarity: 'Rare',      xpBoost: 0.08, coinBoost: 0.10 },
];

const bosses = [
	{ name: 'Dragon Lord',    emoji: '🐉', hp: 20000, baseReward: 500,  xpReward: 200 },
	{ name: 'Shadow King',    emoji: '👤', hp: 18000, baseReward: 450,  xpReward: 180 },
	{ name: 'Frost Giant',    emoji: '❄️', hp: 22000, baseReward: 550,  xpReward: 220 },
	{ name: 'Demon Overlord', emoji: '😈', hp: 25000, baseReward: 600,  xpReward: 250 },
	{ name: 'Ancient Titan',  emoji: '⚡', hp: 30000, baseReward: 750,  xpReward: 300 },
];

function load(p, def = {}) {
	if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(def));
	try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return def; }
}

function hpBar(current, max, size = 20) {
	const pct    = Math.max(0, current / max);
	const filled = Math.round(size * pct);
	const color  = pct > 0.5 ? '🟩' : pct > 0.25 ? '🟨' : '🟥';
	return color.repeat(filled) + '⬛'.repeat(size - filled) + ` ${Math.round(pct * 100)}%`;
}

module.exports = (client) => {
	async function spawnBoss(channel) {
		const bossData = load(bossPath);
		if (bossData[channel.id]) return;

		const boss   = bosses[Math.floor(Math.random() * bosses.length)];
		const bossId = Date.now().toString();

		const embed = new EmbedBuilder()
			.setTitle(`${boss.emoji} WORLD BOSS APPEARED — ${boss.name}`)
			.setDescription(
				`A mighty **${boss.name}** has invaded the server!\n\n` +
				`**HP:** ${boss.hp.toLocaleString()} / ${boss.hp.toLocaleString()}\n` +
				`${hpBar(boss.hp, boss.hp)}\n\n` +
				`⚔️ Attack to deal damage! Top 3 damage dealers earn bonus rewards.\n` +
				`🐉 Rare pet drop chance for #1 damage dealer!`
			)
			.addFields(
				{ name: '💰 Base Reward', value: `${boss.baseReward} coins`, inline: true },
				{ name: '✨ XP Reward',   value: `${boss.xpReward} XP`,     inline: true },
				{ name: '⏳ Time Limit',  value: '3 minutes',                inline: true }
			)
			.setColor('#FF0000')
			.setFooter({ text: `Boss ID: ${bossId}` })
			.setTimestamp();

		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId(`boss_attack_${bossId}`)
				.setLabel('Attack')
				.setEmoji('⚔️')
				.setStyle(ButtonStyle.Danger)
		);

		const message = await channel.send({ embeds: [embed], components: [row] });

		bossData[channel.id] = {
			bossId, channelId: channel.id,
			name: boss.name, emoji: boss.emoji,
			hp: boss.hp, maxHp: boss.hp,
			baseReward: boss.baseReward, xpReward: boss.xpReward,
			messageId: message.id, damage: {},
			startTime: Date.now()
		};
		fs.writeFileSync(bossPath, JSON.stringify(bossData, null, 2));

		setTimeout(() => {
			const current = load(bossPath);
			if (current[channel.id]?.bossId === bossId) {
				finishBoss(channel, current[channel.id], false).catch(() => null);
			}
		}, 180000);
	}

	async function updateBossMessage(channel, bossData) {
		try {
			const msg = await channel.messages.fetch(bossData.messageId);
			const embed = EmbedBuilder.from(msg.embeds[0])
				.setDescription(
					`A mighty **${bossData.name}** is under attack!\n\n` +
					`**HP:** ${Math.max(0, bossData.hp).toLocaleString()} / ${bossData.maxHp.toLocaleString()}\n` +
					`${hpBar(bossData.hp, bossData.maxHp)}\n\n` +
					`⚔️ Keep attacking! Top 3 earn bonus rewards.`
				);
			await msg.edit({ embeds: [embed] });
		} catch {}
	}

	async function finishBoss(channel, bossData, killed) {
		const allBoss = load(bossPath);
		delete allBoss[channel.id];
		fs.writeFileSync(bossPath, JSON.stringify(allBoss, null, 2));

		let getMultipliers = () => ({ xpMult: 1, coinMult: 1 });
		try { getMultipliers = require('./cosmicEvents.js').getMultipliers; } catch {}

		if (!killed) {
			const embed = new EmbedBuilder()
				.setTitle(`💨 ${bossData.emoji} ${bossData.name} Fled!`)
				.setDescription(`The boss escaped with **${bossData.hp.toLocaleString()} HP** remaining!\n\nBe faster next time!`)
				.setColor('#FFFF00').setTimestamp();
			return channel.send({ embeds: [embed] }).catch(() => null);
		}

		const top = Object.entries(bossData.damage).sort(([,a],[,b]) => b - a).slice(0, 3);
		const mult = getMultipliers();

		const economy = load(economyPath);
		const xpData  = load(xpPath);
		const pets    = load(petsPath);

		const rewardLines = [];

		top.forEach(([userId, dmg], i) => {
			if (!economy[userId]) economy[userId] = { coins: 0 };
			if (!xpData[userId])  xpData[userId]  = { xp: 0, level: 1 };

			const rankMult  = [1.5, 1.2, 1.0][i];
			const coins     = Math.floor(bossData.baseReward * rankMult * mult.coinMult);
			const xp        = Math.floor(bossData.xpReward * rankMult * mult.xpMult);
			economy[userId].coins += coins;
			xpData[userId].xp    += xp;

			let petLine = '';
			if (i === 0 && Math.random() < 0.25 && !pets[userId]) {
				const drop = rarePetDrops[Math.floor(Math.random() * rarePetDrops.length)];
				pets[userId] = { name: drop.name, emoji: drop.emoji, rarity: drop.rarity, xpBoost: drop.xpBoost, coinBoost: drop.coinBoost, level: 1, xp: 0, caughtAt: new Date().toISOString() };
				petLine = ` + 🐾 ${drop.emoji} ${drop.name}`;
			}

			const medals = ['🥇','🥈','🥉'];
			rewardLines.push(`${medals[i]} <@${userId}> — **${dmg.toLocaleString()}** dmg | +${coins}💰 +${xp}✨${petLine}`);
		});

		// All participants get a participation reward
		const allParticipants = Object.keys(bossData.damage);
		allParticipants.forEach(uid => {
			if (!economy[uid]) economy[uid] = { coins: 0 };
			economy[uid].coins += Math.floor(50 * mult.coinMult);
		});

		fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));
		fs.writeFileSync(xpPath, JSON.stringify(xpData, null, 2));
		fs.writeFileSync(petsPath, JSON.stringify(pets, null, 2));

		const embed = new EmbedBuilder()
			.setTitle(`🎉 ${bossData.emoji} ${bossData.name} DEFEATED!`)
			.setDescription(
				`The **${bossData.name}** has been slain!\n\n` +
				`**🏆 Top Damage Dealers:**\n${rewardLines.join('\n') || 'No participants'}\n\n` +
				`All ${allParticipants.length} participants received **+50 coins**!` +
				(mult.coinMult > 1 ? `\n\n🌌 Cosmic multiplier active: **${mult.coinMult}x coins, ${mult.xpMult}x XP**` : '')
			)
			.setColor('#FFD700').setTimestamp();

		// Disable attack button
		try {
			const msg = await channel.messages.fetch(bossData.messageId);
			const disabledRow = new ActionRowBuilder().addComponents(
				new ButtonBuilder().setCustomId('boss_dead').setLabel('Boss Defeated').setStyle(ButtonStyle.Secondary).setDisabled(true)
			);
			await msg.edit({ components: [disabledRow] });
		} catch {}

		channel.send({ embeds: [embed] }).catch(() => null);
	}

	client.on(Events.InteractionCreate, async (interaction) => {
		if (!interaction.isButton() || !interaction.customId.startsWith('boss_attack_')) return;

		const bossId  = interaction.customId.replace('boss_attack_', '');
		const allBoss = load(bossPath);
		const bd      = allBoss[interaction.channelId];

		if (!bd || bd.bossId !== bossId) {
			return interaction.reply({ content: '❌ This boss is no longer active!', ephemeral: true });
		}

		const pets    = load(petsPath);
		const userPet = pets[interaction.user.id];
		const petBonus = userPet ? Math.floor(userPet.coinBoost * 200) : 0;
		const damage  = Math.floor(Math.random() * 600) + 200 + petBonus;

		bd.hp -= damage;
		if (!bd.damage[interaction.user.id]) bd.damage[interaction.user.id] = 0;
		bd.damage[interaction.user.id] += damage;

		const embed = new EmbedBuilder()
			.setDescription(`${interaction.user} attacked for **${damage.toLocaleString()} damage**! ${userPet ? `🐾 ${userPet.name} assisted!` : ''}\n\nBoss HP: **${Math.max(0, bd.hp).toLocaleString()}** / ${bd.maxHp.toLocaleString()}\n${hpBar(bd.hp, bd.maxHp)}`)
			.setColor('#FF6600');

		await interaction.reply({ embeds: [embed] });

		if (bd.hp <= 0) {
			await finishBoss(interaction.channel, bd, true).catch(() => null);
		} else {
			allBoss[interaction.channelId] = bd;
			fs.writeFileSync(bossPath, JSON.stringify(allBoss, null, 2));
			updateBossMessage(interaction.channel, bd).catch(() => null);
		}
	});

	// Spawn every 20 min with 25% chance
	setInterval(() => {
		client.guilds.cache.forEach(guild => {
			if (Math.random() > 0.25) return;
			const channel = guild.channels.cache.find(c => c.isTextBased() && c.type === ChannelType.GuildText);
			if (channel) spawnBoss(channel).catch(() => null);
		});
	}, 1200000);
};
