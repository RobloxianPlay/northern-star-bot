const { Events } = require('discord.js');
const fs   = require('node:fs');
const path = require('node:path');

const questsPath  = path.join(__dirname, '../data/quests.json');
const economyPath = path.join(__dirname, '../data/economy.json');
const xpPath      = path.join(__dirname, '../data/xp.json');

const questTemplates = [
	{ id: 'send_messages', label: 'Send 20 messages', type: 'messages', target: 20, coins: 150, xp: 100 },
	{ id: 'send_messages_hard', label: 'Send 50 messages', type: 'messages', target: 50, coins: 300, xp: 200 },
	{ id: 'earn_coins', label: 'Earn 200 coins', type: 'coins_earned', target: 200, coins: 100, xp: 75 },
	{ id: 'use_commands', label: 'Use 5 commands', type: 'commands', target: 5, coins: 100, xp: 80 },
	{ id: 'daily_claimed', label: 'Claim daily reward', type: 'daily', target: 1, coins: 50, xp: 50 },
];

function load(p, def = {}) {
	if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(def));
	return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function today() { return new Date().toISOString().split('T')[0]; }

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

module.exports = (client) => {
	// Track message-based quest progress
	client.on(Events.MessageCreate, (message) => {
		if (message.author.bot || !message.guild) return;
		const userId = message.author.id;
		const allQuests = getOrCreateQuests(userId);
		let changed = false;
		for (const q of allQuests[userId].quests) {
			if (q.type === 'messages' && !q.completed) {
				q.progress = Math.min(q.progress + 1, q.target);
				if (q.progress >= q.target) q.completed = true;
				changed = true;
			}
		}
		if (changed) fs.writeFileSync(questsPath, JSON.stringify(allQuests, null, 2));
	});

	// Track command usage
	client.on(Events.InteractionCreate, (interaction) => {
		if (!interaction.isChatInputCommand() || !interaction.guild) return;
		const userId = interaction.user.id;
		const allQuests = getOrCreateQuests(userId);
		let changed = false;
		for (const q of allQuests[userId].quests) {
			if (q.type === 'commands' && !q.completed) {
				q.progress = Math.min(q.progress + 1, q.target);
				if (q.progress >= q.target) q.completed = true;
				changed = true;
			}
		}
		if (changed) fs.writeFileSync(questsPath, JSON.stringify(allQuests, null, 2));
	});
};

module.exports.getOrCreateQuests = getOrCreateQuests;
module.exports.questsPath = questsPath;
