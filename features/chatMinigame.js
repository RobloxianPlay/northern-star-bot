const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const messageCountPath = path.join(__dirname, '../data/messageCount.json');
const activeGamesPath  = path.join(__dirname, '../data/activeGames.json');
const economyPath      = path.join(__dirname, '../data/economy.json');
const xpPath           = path.join(__dirname, '../data/xp.json');

const MINIGAMES = [
	{ name: 'Type Race', emoji: '⌨️', type: 'typing', word: 'discord', coins: 35, xp: 15 },
	{ name: 'Type Race', emoji: '⌨️', type: 'typing', word: 'botmaster', coins: 35, xp: 15 },
	{ name: 'Type Race', emoji: '⌨️', type: 'typing', word: 'champion', coins: 35, xp: 15 },
	{ name: 'Type Race', emoji: '⌨️', type: 'typing', word: 'keyboard', coins: 35, xp: 15 },
	{ name: 'Type Race', emoji: '⌨️', type: 'typing', word: 'velocity', coins: 40, xp: 20 },
	{ name: 'Word Scramble', emoji: '🔀', type: 'scramble', word: 'server', scrambled: 'revres', coins: 35, xp: 15, answer: 'server' },
	{ name: 'Word Scramble', emoji: '🔀', type: 'scramble', word: 'gaming', scrambled: 'gnigam', coins: 35, xp: 15, answer: 'gaming' },
	{ name: 'Word Scramble', emoji: '🔀', type: 'scramble', word: 'trophy', scrambled: 'yphort', coins: 40, xp: 20, answer: 'trophy' },
	{ name: 'Math Challenge', emoji: '🔢', type: 'math', problem: '14 + 6', answer: '20', coins: 40, xp: 20 },
	{ name: 'Math Challenge', emoji: '🔢', type: 'math', problem: '25 - 8', answer: '17', coins: 40, xp: 20 },
	{ name: 'Math Challenge', emoji: '🔢', type: 'math', problem: '7 * 3', answer: '21', coins: 40, xp: 20 },
	{ name: 'Math Challenge', emoji: '🔢', type: 'math', problem: '100 / 4', answer: '25', coins: 45, xp: 20 },
	{ name: 'Math Challenge', emoji: '🔢', type: 'math', problem: '9 * 9', answer: '81', coins: 45, xp: 20 },
	{ name: 'Math Challenge', emoji: '🔢', type: 'math', problem: '50 + 33', answer: '83', coins: 40, xp: 20 },
	{ name: 'Trivia', emoji: '🧠', type: 'trivia', question: 'What color is the sky on a clear day?', answer: 'blue', coins: 40, xp: 20 },
	{ name: 'Trivia', emoji: '🧠', type: 'trivia', question: 'How many sides does a triangle have?', answer: '3', coins: 40, xp: 20 },
	{ name: 'Trivia', emoji: '🧠', type: 'trivia', question: 'What planet is closest to the Sun?', answer: 'mercury', coins: 50, xp: 25 },
	{ name: 'Trivia', emoji: '🧠', type: 'trivia', question: 'How many continents are there on Earth?', answer: '7', coins: 40, xp: 20 },
	{ name: 'Trivia', emoji: '🧠', type: 'trivia', question: 'What is the chemical symbol for water?', answer: 'h2o', coins: 50, xp: 25 },
	{ name: 'Trivia', emoji: '🧠', type: 'trivia', question: 'What is 2 to the power of 8?', answer: '256', coins: 55, xp: 30 },
	{ name: 'Reaction Race', emoji: '⚡', type: 'reaction', coins: 45, xp: 20 },
	{ name: 'Button Race', emoji: '🔘', type: 'button', coins: 55, xp: 30 }
];

const RARE_EVENTS = [
	{ name: 'Coin Drop', emoji: '💰', type: 'coinDrop', coins: 100, xp: 0 },
	{ name: 'Lucky Word', emoji: '🍀', type: 'luckyWord', word: 'lucky', coins: 150, xp: 50 },
	{ name: 'Jackpot', emoji: '🎰', type: 'jackpot', coins: 200, xp: 75 }
];

const cooldowns = new Map();
const farmCooldowns = new Map();

module.exports = (client) => {
	if (!fs.existsSync(messageCountPath)) fs.writeFileSync(messageCountPath, JSON.stringify({}));
	if (!fs.existsSync(activeGamesPath)) fs.writeFileSync(activeGamesPath, JSON.stringify({}));

	function loadJSON(filePath) {
		try {
			if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify({}));
			return JSON.parse(fs.readFileSync(filePath, 'utf8'));
		} catch {
			return {};
		}
	}

	function saveJSON(filePath, data) {
		try {
			fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
		} catch (err) {
			console.error('[ChatMinigame] Save error:', err.message);
		}
	}

	async function giveRewards(userId, guild, coins, xp) {
		try {
			const economy = loadJSON(economyPath);
			const xpData = loadJSON(xpPath);

			if (!economy[userId]) economy[userId] = { coins: 0, lastDaily: 0 };
			if (!xpData[userId]) xpData[userId] = { xp: 0, level: 1 };

			economy[userId].coins = Math.max(0, economy[userId].coins + coins);
			xpData[userId].xp += xp;

			saveJSON(economyPath, economy);
			saveJSON(xpPath, xpData);
		} catch (error) {
			console.error('[ChatMinigame] Error giving rewards:', error.message);
		}
	}

	async function startMinigame(channel, isRare = false) {
		const activeGames = loadJSON(activeGamesPath);
		activeGames[channel.id] = true;
		saveJSON(activeGamesPath, activeGames);

		const pool = isRare ? RARE_EVENTS : MINIGAMES;
		const game = pool[Math.floor(Math.random() * pool.length)];

		try {
			if (game.type === 'typing' || game.type === 'scramble') {
				const desc = game.type === 'typing'
					? `Type the word below to win!\n\n**Word:** \`${game.word}\``
					: `Unscramble this word!\n\n**Scrambled:** \`${game.scrambled}\``;

				const embed = new EmbedBuilder()
					.setTitle(`${game.emoji} ${game.name}`)
					.setDescription(desc)
					.setColor('#FFFF00')
					.setFooter({ text: '30 seconds to answer!' })
					.setTimestamp();

				const msg = await channel.send({ embeds: [embed] });
				await runTypingGame(channel, msg, game);

			} else if (game.type === 'math' || game.type === 'trivia') {
				const desc = game.type === 'math'
					? `Solve this math problem!\n\n**Problem:** \`${game.problem}\``
					: `Answer the trivia question!\n\n**Question:** ${game.question}`;

				const embed = new EmbedBuilder()
					.setTitle(`${game.emoji} ${game.name}`)
					.setDescription(desc)
					.setColor('#FF9900')
					.setFooter({ text: '30 seconds to answer!' })
					.setTimestamp();

				const msg = await channel.send({ embeds: [embed] });
				await runTypingGame(channel, msg, game);

			} else if (game.type === 'reaction') {
				const embed = new EmbedBuilder()
					.setTitle(`${game.emoji} Reaction Race!`)
					.setDescription(`First to react with ⚡ wins!\n\n**React now!**`)
					.setColor('#FFFF00')
					.setFooter({ text: '30 seconds!' })
					.setTimestamp();

				const msg = await channel.send({ embeds: [embed] });
				await msg.react('⚡');
				await runReactionGame(channel, msg, game);

			} else if (game.type === 'button') {
				const row = new ActionRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId('minigame_clickme')
						.setLabel('Click Me First!')
						.setStyle(ButtonStyle.Primary)
				);

				const embed = new EmbedBuilder()
					.setTitle(`${game.emoji} Button Race!`)
					.setDescription(`First to click the button wins!`)
					.setColor('#FFFF00')
					.setFooter({ text: '30 seconds!' })
					.setTimestamp();

				const msg = await channel.send({ embeds: [embed], components: [row] });
				await runButtonGame(channel, msg, game, 'minigame_clickme');

			} else if (game.type === 'coinDrop') {
				const row = new ActionRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId('minigame_coindrop')
						.setLabel('Collect Coins!')
						.setStyle(ButtonStyle.Success)
						.setEmoji('💰')
				);

				const embed = new EmbedBuilder()
					.setTitle(`${game.emoji} Coin Drop! ✨`)
					.setDescription(`**RARE EVENT!** First to click collects **${game.coins} coins**!`)
					.setColor('#FF00FF')
					.setFooter({ text: 'Rare Event — 30 seconds!' })
					.setTimestamp();

				const msg = await channel.send({ embeds: [embed], components: [row] });
				await runButtonGame(channel, msg, game, 'minigame_coindrop');

			} else if (game.type === 'luckyWord') {
				const embed = new EmbedBuilder()
					.setTitle(`${game.emoji} Lucky Word! ✨`)
					.setDescription(`**RARE EVENT!** Type the secret word to win **${game.coins} coins**!\n\n**Hint:** It means fortunate.`)
					.setColor('#FF00FF')
					.setFooter({ text: 'Rare Event — 30 seconds!' })
					.setTimestamp();

				const msg = await channel.send({ embeds: [embed] });
				await runTypingGame(channel, msg, game);

			} else if (game.type === 'jackpot') {
				const embed = new EmbedBuilder()
					.setTitle(`${game.emoji} JACKPOT! ✨`)
					.setDescription(`**RARE EVENT!** First to react with 🎰 wins **${game.coins} coins**!`)
					.setColor('#FF00FF')
					.setFooter({ text: 'Rare Event — 30 seconds!' })
					.setTimestamp();

				const msg = await channel.send({ embeds: [embed] });
				await msg.react('🎰');
				await runReactionGame(channel, msg, game);
			}
		} catch (err) {
			console.error('[ChatMinigame] Error starting minigame:', err.message);
			endGame(channel.id);
		}
	}

	function endGame(channelId) {
		const ag = loadJSON(activeGamesPath);
		delete ag[channelId];
		saveJSON(activeGamesPath, ag);
		setGameCooldown(channelId);
	}

	async function runTypingGame(channel, message, game) {
		const collector = channel.createMessageCollector({ time: 30000 });
		let won = false;

		collector.on('collect', async (msg) => {
			if (msg.author.bot || won) return;

			// Prevent spam farming
			const lastTime = farmCooldowns.get(msg.author.id + channel.id);
			if (lastTime && Date.now() - lastTime < 2000) return;
			farmCooldowns.set(msg.author.id + channel.id, Date.now());

			const answer = game.answer ?? game.word;
			const isCorrect = msg.content.trim().toLowerCase() === answer.toLowerCase();

			if (isCorrect) {
				won = true;
				collector.stop('won');

				const embed = new EmbedBuilder()
					.setTitle(`${game.emoji} ${game.name} — Winner!`)
					.setDescription(`🎉 **${msg.author}** got it!\n\n**Reward:** +${game.coins} 🪙 coins  +${game.xp} ✨ XP`)
					.setColor('#00FF00')
					.setTimestamp();

				await channel.send({ embeds: [embed] }).catch(() => null);
				await giveRewards(msg.author.id, channel.guild, game.coins, game.xp);
			}
		});

		collector.on('end', (_, reason) => {
			if (!won) {
				const embed = new EmbedBuilder()
					.setTitle(`${game.emoji} ${game.name} — Time's Up!`)
					.setDescription(`Nobody answered in time! The answer was: \`${game.answer ?? game.word}\``)
					.setColor('#FF0000')
					.setTimestamp();
				channel.send({ embeds: [embed] }).catch(() => null);
			}
			endGame(channel.id);
		});
	}

	async function runReactionGame(channel, message, game) {
		const collector = message.createReactionCollector({ time: 30000, max: 1, filter: (r, u) => !u.bot });

		collector.on('collect', async (reaction, user) => {
			const embed = new EmbedBuilder()
				.setTitle(`${game.emoji} ${game.name} — Winner!`)
				.setDescription(`🎉 **${user}** was fastest!\n\n**Reward:** +${game.coins} 🪙 coins  +${game.xp} ✨ XP`)
				.setColor('#00FF00')
				.setTimestamp();

			await channel.send({ embeds: [embed] }).catch(() => null);
			await giveRewards(user.id, channel.guild, game.coins, game.xp);
			collector.stop();
		});

		collector.on('end', (collected) => {
			if (collected.size === 0) {
				const embed = new EmbedBuilder()
					.setTitle(`${game.emoji} ${game.name} — Time's Up!`)
					.setDescription('Nobody reacted in time! Better luck next time.')
					.setColor('#FF0000')
					.setTimestamp();
				channel.send({ embeds: [embed] }).catch(() => null);
			}
			endGame(channel.id);
		});
	}

	async function runButtonGame(channel, message, game, customId) {
		const collector = message.createMessageComponentCollector({ time: 30000, max: 1 });

		collector.on('collect', async (interaction) => {
			if (interaction.customId !== customId) return;
			await interaction.deferUpdate().catch(() => null);

			const embed = new EmbedBuilder()
				.setTitle(`${game.emoji} ${game.name} — Winner!`)
				.setDescription(`🎉 **${interaction.user}** was fastest!\n\n**Reward:** +${game.coins} 🪙 coins  +${game.xp} ✨ XP`)
				.setColor('#00FF00')
				.setTimestamp();

			await channel.send({ embeds: [embed] }).catch(() => null);
			await giveRewards(interaction.user.id, channel.guild, game.coins, game.xp);
			collector.stop();
		});

		collector.on('end', (collected) => {
			message.edit({ components: [] }).catch(() => null);
			if (collected.size === 0) {
				const embed = new EmbedBuilder()
					.setTitle(`${game.emoji} ${game.name} — Time's Up!`)
					.setDescription('Nobody clicked in time! Better luck next time.')
					.setColor('#FF0000')
					.setTimestamp();
				channel.send({ embeds: [embed] }).catch(() => null);
			}
			endGame(channel.id);
		});
	}

	function setGameCooldown(channelId) {
		cooldowns.set(channelId, Date.now() + 60000);
		setTimeout(() => cooldowns.delete(channelId), 60000);
	}

	function isOnCooldown(channelId) {
		return cooldowns.has(channelId) && cooldowns.get(channelId) > Date.now();
	}

	client.on(Events.MessageCreate, async (message) => {
		if (message.author.bot || !message.guild) return;

		const messageCount = loadJSON(messageCountPath);
		const activeGames = loadJSON(activeGamesPath);

		if (!messageCount[message.channelId]) messageCount[message.channelId] = 0;
		messageCount[message.channelId]++;
		saveJSON(messageCountPath, messageCount);

		if (
			messageCount[message.channelId] >= 50 &&
			!activeGames[message.channelId] &&
			!isOnCooldown(message.channelId)
		) {
			messageCount[message.channelId] = 0;
			saveJSON(messageCountPath, messageCount);
			const isRare = Math.random() < 0.05;
			await startMinigame(message.channel, isRare).catch(console.error);
		}
	});
};
