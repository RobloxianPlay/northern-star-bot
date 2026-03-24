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

const activeDuels = new Map();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('battle')
		.setDescription('Challenge another user to a PvP battle')
		.addUserOption(opt =>
			opt.setName('opponent').setDescription('User to challenge').setRequired(true))
		.addIntegerOption(opt =>
			opt.setName('wager').setDescription('Coin wager (optional)').setMinValue(0)),

	async execute(interaction) {
		const challenger = interaction.user;
		const opponent   = interaction.options.getUser('opponent');
		const wager      = interaction.options.getInteger('wager') || 0;

		if (opponent.bot) return interaction.reply({ content: '❌ You cannot battle a bot.', ephemeral: true });
		if (opponent.id === challenger.id) return interaction.reply({ content: '❌ You cannot battle yourself.', ephemeral: true });

		if (wager > 0) {
			const economy = load(economyPath);
			if ((economy[challenger.id]?.coins || 0) < wager) {
				return interaction.reply({ content: `❌ You don't have **${wager} coins** to wager.`, ephemeral: true });
			}
		}

		const duelId = `${challenger.id}_${opponent.id}`;
		if (activeDuels.has(duelId)) return interaction.reply({ content: '❌ A duel between you two is already active.', ephemeral: true });

		const embed = new EmbedBuilder()
			.setTitle('⚔️ Battle Challenge!')
			.setDescription(`${opponent}, **${challenger.username}** has challenged you to a battle!\n\n${wager > 0 ? `💰 Wager: **${wager} coins**\n\n` : ''}Click **Accept** to fight or **Decline** to refuse.`)
			.setColor('#FF6B00')
			.setTimestamp();

		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder().setCustomId(`battle_accept_${duelId}`).setLabel('Accept').setStyle(ButtonStyle.Success).setEmoji('⚔️'),
			new ButtonBuilder().setCustomId(`battle_decline_${duelId}`).setLabel('Decline').setStyle(ButtonStyle.Danger).setEmoji('❌')
		);

		activeDuels.set(duelId, { challenger: challenger.id, opponent: opponent.id, wager });
		await interaction.reply({ content: `${opponent}`, embeds: [embed], components: [row] });

		const reply = await interaction.fetchReply();
		const collector = reply.createMessageComponentCollector({ time: 60000 });

		collector.on('collect', async (i) => {
			if (i.user.id !== opponent.id) return i.reply({ content: '❌ Only the challenged user can respond.', ephemeral: true });

			activeDuels.delete(duelId);

			if (i.customId.startsWith('battle_decline_')) {
				return i.update({ content: `${opponent.username} declined the battle.`, components: [], embeds: [] });
			}

			// Run battle
			const pets   = load(petsPath);
			const xpData = load(xpPath);

			const challengerPet  = pets[challenger.id];
			const opponentPet    = pets[opponent.id];
			const challengerLevel = xpData[challenger.id]?.level || 1;
			const opponentLevel   = xpData[opponent.id]?.level || 1;

			const challengerPower = challengerLevel * 10 + (challengerPet ? 20 : 0) + Math.floor(Math.random() * 50);
			const opponentPower   = opponentLevel   * 10 + (opponentPet   ? 20 : 0) + Math.floor(Math.random() * 50);

			const winnerId = challengerPower >= opponentPower ? challenger.id : opponent.id;
			const loserId  = winnerId === challenger.id ? opponent.id : challenger.id;
			const winnerName = winnerId === challenger.id ? challenger.username : opponent.username;
			const loserName  = loserId  === challenger.id ? challenger.username : opponent.username;

			const economy = load(economyPath);
			if (!economy[winnerId]) economy[winnerId] = { coins: 0 };
			if (!economy[loserId])  economy[loserId]  = { coins: 0 };

			const coinReward = 50 + wager;
			economy[winnerId].coins += coinReward;
			if (wager > 0) economy[loserId].coins = Math.max(0, economy[loserId].coins - wager);
			fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));

			if (!xpData[winnerId]) xpData[winnerId] = { xp: 0, level: 1 };
			xpData[winnerId].xp += 75;
			fs.writeFileSync(xpPath, JSON.stringify(xpData, null, 2));

			const battleLog = [
				`⚔️ ${challenger.username} (Power: ${challengerPower}) vs ${opponent.username} (Power: ${opponentPower})`,
				`🏆 **${winnerName}** wins the battle!`,
				`💰 +${coinReward} coins to winner${wager > 0 ? ` | -${wager} coins from ${loserName}` : ''}`
			].join('\n');

			const resultEmbed = new EmbedBuilder()
				.setTitle(`⚔️ Battle Result — ${winnerName} Wins!`)
				.setDescription(battleLog)
				.addFields(
					{ name: `${challenger.username}`, value: `Power: ${challengerPower}${challengerPet ? ` 🐾 ${challengerPet.name}` : ''}`, inline: true },
					{ name: `${opponent.username}`,   value: `Power: ${opponentPower}${opponentPet ? ` 🐾 ${opponentPet.name}` : ''}`, inline: true }
				)
				.setColor('#FFD700')
				.setTimestamp();

			collector.stop();
			await i.update({ embeds: [resultEmbed], components: [] });
		});

		collector.on('end', (_, reason) => {
			if (reason === 'time') {
				activeDuels.delete(duelId);
				interaction.editReply({ content: '⌛ Battle challenge expired.', components: [] }).catch(() => null);
			}
		});
	}
};
