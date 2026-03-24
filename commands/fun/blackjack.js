const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs   = require('node:fs');
const path = require('node:path');

const economyPath = path.join(__dirname, '../../data/economy.json');

function load(p) {
	if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify({}));
	return JSON.parse(fs.readFileSync(p, 'utf8'));
}

const suits  = ['♠️','♥️','♦️','♣️'];
const values = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];

function buildDeck() {
	const deck = [];
	for (const s of suits) for (const v of values) deck.push({ v, s });
	return deck.sort(() => Math.random() - 0.5);
}

function cardValue(card) {
	if (['J','Q','K'].includes(card.v)) return 10;
	if (card.v === 'A') return 11;
	return parseInt(card.v);
}

function handTotal(hand) {
	let total = hand.reduce((s, c) => s + cardValue(c), 0);
	let aces  = hand.filter(c => c.v === 'A').length;
	while (total > 21 && aces > 0) { total -= 10; aces--; }
	return total;
}

function handStr(hand, hideSecond = false) {
	if (hideSecond) return `${hand[0].v}${hand[0].s}  🂠`;
	return hand.map(c => `${c.v}${c.s}`).join('  ');
}

const activeGames = new Map();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('blackjack')
		.setDescription('Play blackjack against the dealer')
		.addIntegerOption(opt =>
			opt.setName('bet').setDescription('Amount to bet').setMinValue(10).setRequired(true)),

	async execute(interaction) {
		const userId = interaction.user.id;
		const bet    = interaction.options.getInteger('bet');
		const economy = load(economyPath);

		if (!economy[userId]) economy[userId] = { coins: 0 };
		if (economy[userId].coins < bet) {
			return interaction.reply({ content: `❌ You only have **${economy[userId].coins} coins**.`, ephemeral: true });
		}

		const deck   = buildDeck();
		const player = [deck.pop(), deck.pop()];
		const dealer = [deck.pop(), deck.pop()];

		activeGames.set(userId, { deck, player, dealer, bet });

		const playerTotal = handTotal(player);
		const dealerShown = cardValue(dealer[0]);

		const embed = new EmbedBuilder()
			.setTitle('🃏 Blackjack')
			.addFields(
				{ name: `Dealer (showing ${dealerShown})`, value: handStr(dealer, true) },
				{ name: `Your Hand (${playerTotal})`, value: handStr(player) }
			)
			.setColor('#1A6B3C')
			.setFooter({ text: `Bet: ${bet} coins` });

		if (playerTotal === 21) {
			const win = Math.floor(bet * 1.5);
			economy[userId].coins += win;
			fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));
			activeGames.delete(userId);
			embed.setTitle('🃏 Blackjack — BLACKJACK! 🎉').setDescription(`Natural blackjack! You win **${win} coins**!`).setColor('#FFD700');
			return interaction.reply({ embeds: [embed] });
		}

		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder().setCustomId(`bj_hit_${userId}`).setLabel('Hit').setStyle(ButtonStyle.Primary).setEmoji('🎯'),
			new ButtonBuilder().setCustomId(`bj_stand_${userId}`).setLabel('Stand').setStyle(ButtonStyle.Danger).setEmoji('✋'),
			new ButtonBuilder().setCustomId(`bj_double_${userId}`).setLabel('Double Down').setStyle(ButtonStyle.Success).setEmoji('💎')
		);

		await interaction.reply({ embeds: [embed], components: [row] });

		const collector = (await interaction.fetchReply()).createMessageComponentCollector({ time: 60000 });

		collector.on('collect', async (i) => {
			if (i.user.id !== userId) return i.reply({ content: '❌ Not your game!', ephemeral: true });

			const game = activeGames.get(userId);
			if (!game) return;

			if (i.customId === `bj_hit_${userId}`) {
				game.player.push(game.deck.pop());
				const total = handTotal(game.player);

				if (total > 21) {
					economy[userId].coins -= game.bet;
					fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));
					activeGames.delete(userId);
					const bust = new EmbedBuilder()
						.setTitle('🃏 Blackjack — Bust! 💥')
						.setDescription(`You drew **${handStr([game.player[game.player.length-1]])}** and busted with **${total}**!\n\n💸 -${game.bet} coins`)
						.addFields({ name: 'Your Hand', value: handStr(game.player) })
						.setColor('#FF0000').setTimestamp();
					return i.update({ embeds: [bust], components: [] });
				}

				const updEmbed = new EmbedBuilder()
					.setTitle('🃏 Blackjack')
					.addFields(
						{ name: `Dealer (showing ${cardValue(game.dealer[0])})`, value: handStr(game.dealer, true) },
						{ name: `Your Hand (${total})`, value: handStr(game.player) }
					).setColor('#1A6B3C').setFooter({ text: `Bet: ${game.bet} coins` });

				await i.update({ embeds: [updEmbed], components: [row] });

			} else if (i.customId === `bj_stand_${userId}` || i.customId === `bj_double_${userId}`) {
				let currentBet = game.bet;
				if (i.customId === `bj_double_${userId}`) {
					if (economy[userId].coins >= game.bet * 2) {
						game.player.push(game.deck.pop());
						currentBet = game.bet * 2;
					}
				}

				while (handTotal(game.dealer) < 17) game.dealer.push(game.deck.pop());

				const pTotal = handTotal(game.player);
				const dTotal = handTotal(game.dealer);

				let result, profit;
				if (pTotal > 21)                        { result = 'lose'; profit = -currentBet; }
				else if (dTotal > 21 || pTotal > dTotal){ result = 'win';  profit = currentBet;  }
				else if (pTotal === dTotal)              { result = 'push'; profit = 0;           }
				else                                    { result = 'lose'; profit = -currentBet; }

				economy[userId].coins += profit;
				fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));
				activeGames.delete(userId);

				const endEmbed = new EmbedBuilder()
					.setTitle(`🃏 Blackjack — ${result === 'win' ? '🏆 You Win!' : result === 'push' ? '🤝 Push!' : '❌ You Lose!'}`)
					.addFields(
						{ name: `Dealer (${dTotal})`, value: handStr(game.dealer) },
						{ name: `Your Hand (${pTotal})`, value: handStr(game.player) },
						{ name: 'Result', value: profit > 0 ? `+${profit} coins` : profit < 0 ? `${profit} coins` : 'No change' }
					)
					.setColor(result === 'win' ? '#00FF00' : result === 'push' ? '#FFD700' : '#FF0000')
					.setTimestamp();

				collector.stop();
				await i.update({ embeds: [endEmbed], components: [] });
			}
		});

		collector.on('end', (_, reason) => {
			if (reason === 'time') {
				activeGames.delete(userId);
				interaction.editReply({ content: '⌛ Game timed out.', components: [] }).catch(() => null);
			}
		});
	}
};
