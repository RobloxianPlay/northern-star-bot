const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs   = require('node:fs');
const path = require('node:path');

const economyPath = path.join(__dirname, '../../data/economy.json');
const xpPath      = path.join(__dirname, '../../data/xp.json');
const petsPath    = path.join(__dirname, '../../data/pets.json');

function load(p) {
	if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify({}));
	try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return {}; }
}

const pendingDuels = new Map();

const moveSet = ['⚔️ Slash', '🛡️ Block', '🔥 Fire Strike', '💨 Dodge', '⚡ Thunder Bolt'];

module.exports = {
	data: new SlashCommandBuilder()
		.setName('duel')
		.setDescription('Challenge another user to a PvP duel')
		.addUserOption(opt =>
			opt.setName('opponent').setDescription('Who to challenge').setRequired(true))
		.addIntegerOption(opt =>
			opt.setName('wager').setDescription('Coin wager (0 = free)').setMinValue(0)),

	async execute(interaction) {
		const challenger = interaction.user;
		const opponent   = interaction.options.getUser('opponent');
		const wager      = interaction.options.getInteger('wager') || 0;

		if (opponent.bot)                  return interaction.reply({ content: '❌ Cannot duel a bot.', ephemeral: true });
		if (opponent.id === challenger.id) return interaction.reply({ content: '❌ Cannot duel yourself.', ephemeral: true });

		const duelKey = [challenger.id, opponent.id].sort().join('_');
		if (pendingDuels.has(duelKey)) return interaction.reply({ content: '❌ A duel between you two is already pending.', ephemeral: true });

		if (wager > 0) {
			const eco = load(economyPath);
			if ((eco[challenger.id]?.coins || 0) < wager)
				return interaction.reply({ content: `❌ You need ${wager} coins for this wager.`, ephemeral: true });
		}

		pendingDuels.set(duelKey, { challenger: challenger.id, opponent: opponent.id, wager });

		const embed = new EmbedBuilder()
			.setTitle('⚔️ Duel Challenge!')
			.setDescription(
				`${opponent}, **${challenger.username}** challenges you to a duel!\n\n` +
				`${wager > 0 ? `💰 **Wager:** ${wager} coins each\n\n` : ''}` +
				`Do you accept?`
			)
			.setColor('#FF6B00')
			.setTimestamp();

		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder().setCustomId(`duel_accept_${duelKey}`).setLabel('Accept Duel').setEmoji('⚔️').setStyle(ButtonStyle.Success),
			new ButtonBuilder().setCustomId(`duel_decline_${duelKey}`).setLabel('Decline Duel').setEmoji('❌').setStyle(ButtonStyle.Danger)
		);

		await interaction.reply({ content: `${opponent}`, embeds: [embed], components: [row] });
		const reply = await interaction.fetchReply();

		const collector = reply.createMessageComponentCollector({ time: 60000 });

		collector.on('collect', async (i) => {
			if (i.user.id !== opponent.id) return i.reply({ content: '❌ Only the challenged user can respond.', ephemeral: true });

			pendingDuels.delete(duelKey);
			collector.stop();

			if (i.customId.startsWith('duel_decline_')) {
				return i.update({ content: `${opponent.username} declined the duel.`, embeds: [], components: [] });
			}

			await i.deferUpdate();

			// ── Battle simulation ──────────────────────────────────────────
			const xpData = load(xpPath);
			const pets   = load(petsPath);
			const eco    = load(economyPath);

			const getStats = (uid) => ({
				level: xpData[uid]?.level || 1,
				pet:   pets[uid],
				hp:    100 + (xpData[uid]?.level || 1) * 5,
			});

			let c = { ...getStats(challenger.id), id: challenger.id, name: challenger.username };
			let o = { ...getStats(opponent.id),   id: opponent.id,   name: opponent.username  };

			const log = [];
			let round = 1;

			while (c.hp > 0 && o.hp > 0 && round <= 10) {
				const cDmg = Math.floor(Math.random() * 20 * c.level) + 10 + (c.pet ? 15 : 0);
				const oDmg = Math.floor(Math.random() * 20 * o.level) + 10 + (o.pet ? 15 : 0);
				const cMove = moveSet[Math.floor(Math.random() * moveSet.length)];
				const oMove = moveSet[Math.floor(Math.random() * moveSet.length)];

				o.hp -= cDmg;
				c.hp -= oDmg;

				log.push(`**Round ${round}:** ${c.name} uses ${cMove} (${cDmg} dmg) | ${o.name} uses ${oMove} (${oDmg} dmg)`);
				round++;

				if (round > 5) log.splice(0, log.length - 3); // keep last 3 rounds
			}

			const winnerId  = c.hp >= o.hp ? c.id : o.id;
			const loserId   = winnerId === c.id ? o.id : c.id;
			const winnerName = winnerId === c.id ? c.name : o.name;

			if (!eco[winnerId]) eco[winnerId] = { coins: 0 };
			if (!eco[loserId])  eco[loserId]  = { coins: 0 };

			const prize = 75 + wager;
			eco[winnerId].coins += prize;
			if (wager > 0) eco[loserId].coins = Math.max(0, eco[loserId].coins - wager);

			if (!xpData[winnerId]) xpData[winnerId] = { xp: 0, level: 1 };
			xpData[winnerId].xp += 100;

			fs.writeFileSync(economyPath, JSON.stringify(eco, null, 2));
			fs.writeFileSync(xpPath, JSON.stringify(xpData, null, 2));

			const resultEmbed = new EmbedBuilder()
				.setTitle(`⚔️ Duel Result — 🏆 ${winnerName} Wins!`)
				.setDescription(
					`${log.slice(-3).join('\n')}\n\n` +
					`🏆 **${winnerName}** is victorious!\n` +
					`💰 +${prize} coins | ✨ +100 XP` +
					(wager > 0 ? `\n💸 <@${loserId}> lost ${wager} coins` : '')
				)
				.addFields(
					{ name: `${challenger.username} (Lv.${c.level})`, value: `${Math.max(0, c.hp)} HP left${c.pet ? ` | 🐾 ${c.pet.name}` : ''}`, inline: true },
					{ name: `${opponent.username} (Lv.${o.level})`,   value: `${Math.max(0, o.hp)} HP left${o.pet ? ` | 🐾 ${o.pet.name}` : ''}`, inline: true }
				)
				.setColor('#FFD700')
				.setTimestamp();

			await i.editReply({ embeds: [resultEmbed], components: [] });
		});

		collector.on('end', (_, reason) => {
			if (reason === 'time') {
				pendingDuels.delete(duelKey);
				interaction.editReply({ content: '⌛ Duel expired.', components: [] }).catch(() => null);
			}
		});
	}
};
