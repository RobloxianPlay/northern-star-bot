const {
	SlashCommandBuilder, EmbedBuilder, ActionRowBuilder,
	ButtonBuilder, ButtonStyle
} = require('discord.js');

const CATEGORIES = {
	economy: {
		label: '💰 Economy',
		color: '#FFD700',
		commands: [
			{ name: '/balance', desc: 'Check your coin balance' },
			{ name: '/daily', desc: 'Claim your daily coins' },
			{ name: '/work', desc: 'Work to earn coins' },
			{ name: '/beg', desc: 'Beg for coins (small chance)' },
			{ name: '/give', desc: 'Give coins to another user' },
			{ name: '/leaderboard', desc: 'Top richest users' },
			{ name: '/shop', desc: 'Browse the item shop' },
			{ name: '/buy', desc: 'Purchase an item' },
			{ name: '/inventory', desc: 'View your inventory' },
			{ name: '/giveaway', desc: 'Start a coin giveaway' },
			{ name: '/quest', desc: 'View your active quests' }
		]
	},
	fun: {
		label: '🎮 Fun',
		color: '#FF69B4',
		commands: [
			{ name: '/meme', desc: 'Get a random meme' },
			{ name: '/joke', desc: 'Hear a random joke' },
			{ name: '/8ball', desc: 'Ask the magic 8ball' },
			{ name: '/cat', desc: 'Get a random cat picture' },
			{ name: '/dog', desc: 'Get a random dog picture' },
			{ name: '/coinflip', desc: 'Flip a coin' },
			{ name: '/rps', desc: 'Rock Paper Scissors' },
			{ name: '/slots', desc: 'Spin the slot machine' },
			{ name: '/blackjack', desc: 'Play blackjack' },
			{ name: '/trivia', desc: 'Answer a trivia question' },
			{ name: '/guessnumber', desc: 'Guess the number game' }
		]
	},
	utility: {
		label: '🛠️ Utility',
		color: '#00BFFF',
		commands: [
			{ name: '/help', desc: 'Show this help menu' },
			{ name: '/ping', desc: 'Check bot latency' },
			{ name: '/profile', desc: 'View a user\'s profile' },
			{ name: '/rank', desc: 'Check your XP rank' },
			{ name: '/userinfo', desc: 'Get info about a user' },
			{ name: '/avatar', desc: 'View a user\'s avatar' },
			{ name: '/embed', desc: 'Create a custom embed' },
			{ name: '/announce', desc: 'Send an announcement' },
			{ name: '/poll', desc: 'Create a poll' },
			{ name: '/remind', desc: 'Set a reminder' },
			{ name: '/afk', desc: 'Set your AFK status' },
			{ name: '/rep', desc: 'Give reputation to a user' },
			{ name: '/reactionroles', desc: 'Set up reaction roles' },
			{ name: '/stats', desc: 'View bot statistics' }
		]
	},
	moderation: {
		label: '🛡️ Moderation',
		color: '#FF4444',
		commands: [
			{ name: '/kick', desc: 'Kick a member' },
			{ name: '/ban', desc: 'Ban a member' },
			{ name: '/timeout', desc: 'Timeout a member' },
			{ name: '/clear', desc: 'Bulk delete messages' },
			{ name: '/warn', desc: 'Warn a member' },
			{ name: '/warnings', desc: 'View a member\'s warnings' },
			{ name: '/lock', desc: 'Lock a channel' },
			{ name: '/unlock', desc: 'Unlock a channel' }
		]
	}
};

function buildEmbed(categoryKey) {
	const cat = CATEGORIES[categoryKey];
	const commandList = cat.commands.map(c => `\`${c.name}\` — ${c.desc}`).join('\n');

	return new EmbedBuilder()
		.setTitle(`${cat.label} Commands`)
		.setDescription(commandList)
		.setColor(cat.color)
		.setFooter({ text: 'Click a button below to switch categories | Use / before any command' })
		.setTimestamp();
}

function buildRow(active) {
	return new ActionRowBuilder().addComponents(
		new ButtonBuilder()
			.setCustomId('help_economy')
			.setLabel('💰 Economy')
			.setStyle(active === 'economy' ? ButtonStyle.Primary : ButtonStyle.Secondary),
		new ButtonBuilder()
			.setCustomId('help_fun')
			.setLabel('🎮 Fun')
			.setStyle(active === 'fun' ? ButtonStyle.Primary : ButtonStyle.Secondary),
		new ButtonBuilder()
			.setCustomId('help_utility')
			.setLabel('🛠️ Utility')
			.setStyle(active === 'utility' ? ButtonStyle.Primary : ButtonStyle.Secondary),
		new ButtonBuilder()
			.setCustomId('help_moderation')
			.setLabel('🛡️ Moderation')
			.setStyle(active === 'moderation' ? ButtonStyle.Primary : ButtonStyle.Secondary)
	);
}

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Browse all commands by category'),

	async execute(interaction) {
		const defaultCat = 'economy';
		const reply = await interaction.reply({
			embeds: [buildEmbed(defaultCat)],
			components: [buildRow(defaultCat)],
			fetchReply: true
		});

		const collector = reply.createMessageComponentCollector({
			filter: i => i.user.id === interaction.user.id,
			time: 120000
		});

		collector.on('collect', async i => {
			const cat = i.customId.replace('help_', '');
			await i.update({
				embeds: [buildEmbed(cat)],
				components: [buildRow(cat)]
			}).catch(() => null);
		});

		collector.on('end', () => {
			reply.edit({ components: [] }).catch(() => null);
		});
	}
};
