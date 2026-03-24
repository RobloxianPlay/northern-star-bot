const { Events, EmbedBuilder } = require('discord.js');
const fs   = require('node:fs');
const path = require('node:path');

const streaksPath = path.join(__dirname, '../data/streaks.json');
const xpPath      = path.join(__dirname, '../data/xp.json');
const economyPath = path.join(__dirname, '../data/economy.json');

function load(p) {
	if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify({}));
	return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function today() { return new Date().toISOString().split('T')[0]; }

module.exports = (client) => {
	client.on(Events.MessageCreate, async (message) => {
		if (message.author.bot || !message.guild) return;

		const userId  = message.author.id;
		const streaks = load(streaksPath);
		const todayDate = today();
		const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

		if (!streaks[userId]) {
			streaks[userId] = { streak: 1, lastDate: todayDate, longest: 1 };
		} else {
			const s = streaks[userId];
			if (s.lastDate === todayDate) {
				// already messaged today
				fs.writeFileSync(streaksPath, JSON.stringify(streaks, null, 2));
				return;
			}
			if (s.lastDate === yesterday) {
				s.streak += 1;
				if (s.streak > (s.longest || 0)) s.longest = s.streak;
			} else {
				s.streak = 1;
			}
			s.lastDate = todayDate;
		}

		const s = streaks[userId];
		fs.writeFileSync(streaksPath, JSON.stringify(streaks, null, 2));

		// Milestone rewards: 3, 7, 14, 30 days
		const milestones = { 3: 100, 7: 300, 14: 700, 30: 2000 };
		if (milestones[s.streak]) {
			const reward = milestones[s.streak];
			const economy = load(economyPath);
			if (!economy[userId]) economy[userId] = { coins: 0 };
			economy[userId].coins += reward;
			fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));

			const xpData = load(xpPath);
			if (!xpData[userId]) xpData[userId] = { xp: 0, level: 1 };
			xpData[userId].xp += reward / 2;
			fs.writeFileSync(xpPath, JSON.stringify(xpData, null, 2));

			const embed = new EmbedBuilder()
				.setTitle(`🔥 ${s.streak}-Day Chat Streak!`)
				.setDescription(`${message.author} hit a **${s.streak}-day streak** milestone!\n\n🎁 **Reward:** +${reward} coins & +${reward / 2} XP`)
				.setColor('#FF6B00')
				.setTimestamp();

			message.channel.send({ embeds: [embed] }).catch(() => null);
		}
	});
};
