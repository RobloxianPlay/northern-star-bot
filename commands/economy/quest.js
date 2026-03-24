const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs   = require('node:fs');
const path = require('node:path');

const questsPath  = path.join(__dirname, '../../data/quests.json');
const economyPath = path.join(__dirname, '../../data/economy.json');
const xpPath      = path.join(__dirname, '../../data/xp.json');

function load(p, def = {}) {
	if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(def));
	return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function today() { return new Date().toISOString().split('T')[0]; }

const questTemplates = [
	{ id: 'send_messages',      label: 'Send 20 messages',   type: 'messages',    target: 20,  coins: 150, xp: 100 },
	{ id: 'send_messages_hard', label: 'Send 50 messages',   type: 'messages',    target: 50,  coins: 300, xp: 200 },
	{ id: 'earn_coins',         label: 'Earn 200 coins',     type: 'coins_earned', target: 200, coins: 100, xp: 75  },
	{ id: 'use_commands',       label: 'Use 5 commands',     type: 'commands',    target: 5,   coins: 100, xp: 80  },
	{ id: 'daily_claimed',      label: 'Claim daily reward', type: 'daily',       target: 1,   coins: 50,  xp: 50  },
];

function generateQuests() {
	const shuffled = [...questTemplates].sort(() => Math.random() - 0.5);
	return shuffled.slice(0, 3).map(q => ({ ...q, progress: 0, completed: false, claimed: false }));
}

function getOrCreateQuests(userId) {
	const allQuests = load(questsPath);
	const todayDate = today();
	if (!allQuests[userId] || allQuests[userId].date !== todayDate) {
		allQuests[userId] = { date: todayDate, quests: generateQuests() };
		fs.writeFileSync(questsPath, JSON.stringify(allQuests, null, 2));
	}
	return allQuests;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('quest')
		.setDescription('View and claim your daily quests')
		.addSubcommand(sub => sub.setName('view').setDescription('View your daily quests'))
		.addSubcommand(sub =>
			sub.setName('claim')
				.setDescription('Claim rewards for a completed quest')
				.addIntegerOption(opt =>
					opt.setName('number')
						.setDescription('Quest number to claim (1, 2, or 3)')
						.setMinValue(1)
						.setMaxValue(3)
						.setRequired(true))),

	async execute(interaction) {
		const userId = interaction.user.id;
		const sub    = interaction.options.getSubcommand();

		if (sub === 'view') {
			const allQuests = getOrCreateQuests(userId);
			const quests    = allQuests[userId].quests;

			const lines = quests.map((q, i) => {
				const bar  = `${'█'.repeat(Math.floor((q.progress / q.target) * 10))}${'░'.repeat(10 - Math.floor((q.progress / q.target) * 10))}`;
				const done = q.completed ? (q.claimed ? '✅ Claimed' : '🎁 Ready to claim!') : `\`${bar}\` ${q.progress}/${q.target}`;
				return `**${i + 1}.** ${q.label}\n${done} — 💰 ${q.coins} coins | ✨ ${q.xp} XP`;
			}).join('\n\n');

			const embed = new EmbedBuilder()
				.setTitle('📋 Daily Quests')
				.setDescription(lines)
				.setColor('#FF8C00')
				.setFooter({ text: 'Quests reset every day • Use /quest claim <number> to collect rewards' })
				.setTimestamp();

			return interaction.reply({ embeds: [embed] });
		}

		if (sub === 'claim') {
			const num       = interaction.options.getInteger('number') - 1;
			const allQuests = getOrCreateQuests(userId);
			const quest     = allQuests[userId].quests[num];

			if (!quest) return interaction.reply({ content: '❌ Invalid quest number.', ephemeral: true });
			if (!quest.completed) return interaction.reply({ content: `❌ Quest not yet completed! Progress: ${quest.progress}/${quest.target}`, ephemeral: true });
			if (quest.claimed) return interaction.reply({ content: '❌ You already claimed this quest!', ephemeral: true });

			quest.claimed = true;
			fs.writeFileSync(questsPath, JSON.stringify(allQuests, null, 2));

			const economy = load(economyPath);
			if (!economy[userId]) economy[userId] = { coins: 0 };
			economy[userId].coins += quest.coins;
			fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));

			const xpData = load(xpPath);
			if (!xpData[userId]) xpData[userId] = { xp: 0, level: 1 };
			xpData[userId].xp += quest.xp;
			fs.writeFileSync(xpPath, JSON.stringify(xpData, null, 2));

			const embed = new EmbedBuilder()
				.setTitle('🎁 Quest Reward Claimed!')
				.setDescription(`**${quest.label}** complete!\n\n💰 +${quest.coins} coins\n✨ +${quest.xp} XP`)
				.setColor('#00FF00')
				.setTimestamp();

			return interaction.reply({ embeds: [embed] });
		}
	}
};
