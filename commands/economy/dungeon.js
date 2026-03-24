const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs   = require('node:fs');
const path = require('node:path');

const economyPath = path.join(__dirname, '../../data/economy.json');
const xpPath      = path.join(__dirname, '../../data/xp.json');
const petsPath    = path.join(__dirname, '../../data/pets.json');

function load(p) {
	if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify({}));
	return JSON.parse(fs.readFileSync(p, 'utf8'));
}

const dungeons = [
	{
		name: 'Crystal Caves',  emoji: '💎', minLevel: 1,
		enemies: ['Cave Bat','Stone Golem','Crystal Elemental'],
		coinRange: [50, 200], xpRange: [30, 100]
	},
	{
		name: 'Shadow Forest',  emoji: '🌲', minLevel: 5,
		enemies: ['Dark Wolf','Shadow Sprite','Forest Witch'],
		coinRange: [150, 400], xpRange: [80, 200]
	},
	{
		name: 'Dragon\'s Lair', emoji: '🐉', minLevel: 10,
		enemies: ['Fire Drake','Lava Giant','Elder Dragon'],
		coinRange: [300, 800], xpRange: [150, 400]
	},
];

const cooldowns = new Map();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('dungeon')
		.setDescription('Explore a dungeon for loot and XP')
		.addSubcommand(sub => sub.setName('explore').setDescription('Enter a dungeon'))
		.addSubcommand(sub => sub.setName('list').setDescription('View available dungeons')),

	async execute(interaction) {
		const sub    = interaction.options.getSubcommand();
		const userId = interaction.user.id;

		if (sub === 'list') {
			const xpData = load(xpPath);
			const level  = xpData[userId]?.level || 1;
			const lines  = dungeons.map(d =>
				`${d.emoji} **${d.name}** — Min Level: ${d.minLevel} ${level >= d.minLevel ? '✅' : '🔒'}\n` +
				`Rewards: ${d.coinRange[0]}-${d.coinRange[1]} coins | ${d.xpRange[0]}-${d.xpRange[1]} XP`
			).join('\n\n');

			const embed = new EmbedBuilder()
				.setTitle('🗡️ Available Dungeons')
				.setDescription(lines)
				.setColor('#8B0000')
				.setFooter({ text: `Your level: ${level} • 30 min cooldown between runs` })
				.setTimestamp();
			return interaction.reply({ embeds: [embed] });
		}

		// Cooldown check
		const lastRun = cooldowns.get(userId) || 0;
		const remaining = 1800000 - (Date.now() - lastRun);
		if (remaining > 0) {
			const mins = Math.ceil(remaining / 60000);
			return interaction.reply({ content: `⏳ You need to rest! Dungeon available again in **${mins} min**.`, ephemeral: true });
		}

		const xpData = load(xpPath);
		const level  = xpData[userId]?.level || 1;
		const available = dungeons.filter(d => d.minLevel <= level);
		if (!available.length) return interaction.reply({ content: '❌ You need at least level 1 to enter dungeons.', ephemeral: true });

		const dungeon = available[available.length - 1];
		const pet     = load(petsPath)[userId];

		const embed = new EmbedBuilder()
			.setTitle(`${dungeon.emoji} Dungeon: ${dungeon.name}`)
			.setDescription(
				`You enter the **${dungeon.name}**...\n\n` +
				`${pet ? `🐾 ${pet.name} is fighting alongside you!` : 'You have no pet. Consider catching one for combat bonuses!'}\n\n` +
				`Click **Fight** to battle through the dungeon!`
			)
			.addFields({ name: '⚔️ Enemies', value: dungeon.enemies.join(', ') })
			.setColor('#8B0000')
			.setFooter({ text: `Your Level: ${level}` })
			.setTimestamp();

		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder().setCustomId(`dungeon_fight_${userId}`).setLabel('Fight!').setStyle(ButtonStyle.Danger).setEmoji('⚔️'),
			new ButtonBuilder().setCustomId(`dungeon_flee_${userId}`).setLabel('Flee').setStyle(ButtonStyle.Secondary).setEmoji('🏃')
		);

		await interaction.reply({ embeds: [embed], components: [row] });
		const reply = await interaction.fetchReply();
		const collector = reply.createMessageComponentCollector({ time: 30000 });

		collector.on('collect', async (i) => {
			if (i.user.id !== userId) return i.reply({ content: '❌ This is not your dungeon run!', ephemeral: true });

			collector.stop();
			if (i.customId.startsWith('dungeon_flee_')) {
				return i.update({ content: '🏃 You fled from the dungeon!', embeds: [], components: [] });
			}

			cooldowns.set(userId, Date.now());

			// Calculate outcome (pet bonus, level bonus)
			const petBonus    = pet ? 0.2 : 0;
			const successRate = 0.6 + (level * 0.02) + petBonus;
			const success     = Math.random() < successRate;

			const coins = Math.floor(Math.random() * (dungeon.coinRange[1] - dungeon.coinRange[0]) + dungeon.coinRange[0]);
			const xpEarned = Math.floor(Math.random() * (dungeon.xpRange[1] - dungeon.xpRange[0]) + dungeon.xpRange[0]);
			const enemy   = dungeon.enemies[Math.floor(Math.random() * dungeon.enemies.length)];

			if (success) {
				const economy = load(economyPath);
				if (!economy[userId]) economy[userId] = { coins: 0 };
				economy[userId].coins += coins;
				fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));

				if (!xpData[userId]) xpData[userId] = { xp: 0, level: 1 };
				xpData[userId].xp += xpEarned;
				fs.writeFileSync(xpPath, JSON.stringify(xpData, null, 2));

				const win = new EmbedBuilder()
					.setTitle(`${dungeon.emoji} Victory!`)
					.setDescription(
						`You defeated **${enemy}** and cleared the **${dungeon.name}**!\n\n` +
						`💰 +${coins} coins\n✨ +${xpEarned} XP${pet ? `\n🐾 ${pet.name} helped you deal extra damage!` : ''}`
					)
					.setColor('#00FF00').setTimestamp();
				return i.update({ embeds: [win], components: [] });
			} else {
				const economy = load(economyPath);
				const lost = Math.floor(coins * 0.3);
				if (!economy[userId]) economy[userId] = { coins: 0 };
				economy[userId].coins = Math.max(0, economy[userId].coins - lost);
				fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));

				const lose = new EmbedBuilder()
					.setTitle(`${dungeon.emoji} Defeated!`)
					.setDescription(`**${enemy}** overpowered you! You retreated and lost **${lost} coins**.\n\nTrain more and try again!`)
					.setColor('#FF0000').setTimestamp();
				return i.update({ embeds: [lose], components: [] });
			}
		});

		collector.on('end', (_, reason) => {
			if (reason === 'time') interaction.editReply({ content: '⌛ Dungeon timed out.', components: [] }).catch(() => null);
		});
	}
};
