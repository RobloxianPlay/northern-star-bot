const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const fs   = require('node:fs');
const path = require('node:path');

const economyPath = path.join(__dirname, '../data/economy.json');
const xpPath      = path.join(__dirname, '../data/xp.json');
const petsPath    = path.join(__dirname, '../data/pets.json');

function load(p, def = {}) {
	if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(def));
	try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return def; }
}

function getMultipliers() {
	try { return require('./cosmicEvents.js').getMultipliers(); } catch { return { xpMult: 1, coinMult: 1 }; }
}

const raidEnemies = [
	{ name: 'Cave Troll',    hp: 500,  reward: 40  },
	{ name: 'Dark Wizard',   hp: 800,  reward: 60  },
	{ name: 'Stone Golem',   hp: 1200, reward: 80  },
	{ name: 'Shadow Demon',  hp: 2000, reward: 120 },
	{ name: 'Dungeon Boss',  hp: 5000, reward: 300 },
];

const activeRaids = new Map();

module.exports = (client) => {
	// /raid command fires this
	client.on('raidStart', async ({ interaction }) => {
		const guildId = interaction.guild.id;
		if (activeRaids.has(guildId)) {
			return interaction.reply({ content: '⚔️ A raid is already active! Join it by clicking **Attack**.', ephemeral: true });
		}

		const enemy  = raidEnemies[Math.floor(Math.random() * (raidEnemies.length - 1))]; // exclude boss initially
		const raidId = Date.now().toString();

		const raid = {
			raidId, guildId,
			enemy: { ...enemy },
			currentHp: enemy.hp,
			damage: {},
			participants: new Set(),
			startTime: Date.now()
		};
		activeRaids.set(guildId, raid);

		const embed = new EmbedBuilder()
			.setTitle(`🗡️ DUNGEON RAID STARTED!`)
			.setDescription(
				`A **${enemy.name}** (HP: ${enemy.hp}) has appeared in the dungeon!\n\n` +
				`⚔️ Everyone click **Attack** to fight!\n` +
				`🏆 Raid ends in **60 seconds** — all participants share the rewards!`
			)
			.addFields(
				{ name: '👾 Enemy', value: enemy.name, inline: true },
				{ name: '❤️ HP',   value: enemy.hp.toString(), inline: true },
				{ name: '💰 Reward', value: `${enemy.reward} coins each`, inline: true }
			)
			.setColor('#8B0000')
			.setTimestamp();

		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId(`raid_attack_${raidId}`)
				.setLabel('Attack')
				.setEmoji('⚔️')
				.setStyle(ButtonStyle.Danger)
		);

		await interaction.reply({ embeds: [embed], components: [row] });

		// End raid after 60 seconds
		setTimeout(() => finishRaid(guildId, interaction.channel), 60000);
	});

	client.on(Events.InteractionCreate, async (interaction) => {
		if (!interaction.isButton() || !interaction.customId.startsWith('raid_attack_')) return;

		const raidId = interaction.customId.replace('raid_attack_', '');
		const raid   = activeRaids.get(interaction.guild.id);
		if (!raid || raid.raidId !== raidId) {
			return interaction.reply({ content: '❌ This raid has ended.', ephemeral: true });
		}

		const userId = interaction.user.id;
		const pets   = load(petsPath);
		const petBonus = pets[userId] ? Math.floor(pets[userId].coinBoost * 100) : 0;
		const damage = Math.floor(Math.random() * 300) + 100 + petBonus;

		raid.currentHp -= damage;
		if (!raid.damage[userId]) raid.damage[userId] = 0;
		raid.damage[userId] += damage;
		raid.participants.add(userId);

		await interaction.reply({
			content: `⚔️ ${interaction.user} dealt **${damage} damage**! Enemy HP: ${Math.max(0, raid.currentHp)}`,
			ephemeral: true
		});

		if (raid.currentHp <= 0) {
			finishRaid(interaction.guild.id, interaction.channel, true);
		}
	});

	async function finishRaid(guildId, channel, killed = false) {
		const raid = activeRaids.get(guildId);
		if (!raid) return;
		activeRaids.delete(guildId);

		const mult      = getMultipliers();
		const economy   = load(economyPath);
		const xpData    = load(xpPath);
		const participants = [...raid.participants];

		if (!participants.length) {
			return channel.send('🗡️ The dungeon raid ended with no participants.').catch(() => null);
		}

		const topDmg = Object.entries(raid.damage).sort(([,a],[,b]) => b - a);
		const baseCoins = Math.floor(raid.enemy.reward * mult.coinMult);
		const baseXp    = Math.floor(50 * mult.xpMult);

		participants.forEach(uid => {
			if (!economy[uid]) economy[uid] = { coins: 0 };
			if (!xpData[uid])  xpData[uid]  = { xp: 0, level: 1 };
			economy[uid].coins += baseCoins;
			xpData[uid].xp    += baseXp;
		});

		// Bonus for top damage
		if (topDmg[0]) {
			const [topUid] = topDmg[0];
			economy[topUid].coins += baseCoins;
			xpData[topUid].xp    += baseXp;
		}

		fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));
		fs.writeFileSync(xpPath, JSON.stringify(xpData, null, 2));

		const embed = new EmbedBuilder()
			.setTitle(killed ? `🏆 ${raid.enemy.name} Defeated!` : `⏰ Raid Ended — ${raid.enemy.name} Survived!`)
			.setDescription(
				`${killed ? '🎉 The enemy was slain!' : '😤 Time ran out but great effort!'}\n\n` +
				`**${participants.length} raiders** each received:\n💰 +${baseCoins} coins | ✨ +${baseXp} XP\n\n` +
				`**Top Damage:** <@${topDmg[0]?.[0]}> — ${topDmg[0]?.[1]} damage (bonus rewards!)`
			)
			.setColor(killed ? '#FFD700' : '#FF6B00')
			.setTimestamp();

		channel.send({ embeds: [embed] }).catch(() => null);
	}
};
