const { Events, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const achievements = {
	'First Message': { emoji: '💬', description: 'Send your first message' },
	'Message Milestone 100': { emoji: '📨', description: 'Send 100 messages' },
	'Message Milestone 500': { emoji: '📨', description: 'Send 500 messages' },
	'Message Milestone 1000': { emoji: '📨', description: 'Send 1000 messages' },
	'Level 10': { emoji: '⭐', description: 'Reach level 10' },
	'Level 25': { emoji: '⭐', description: 'Reach level 25' },
	'Level 50': { emoji: '⭐', description: 'Reach level 50' },
	'Server Booster': { emoji: '💎', description: 'Boost the server' },
	'Active Member': { emoji: '🔥', description: 'Maintain a 5-day activity streak' }
};

module.exports = (client) => {
	const achievementsPath = path.join(__dirname, '../data/achievements.json');

	if (!fs.existsSync(achievementsPath)) {
		fs.writeFileSync(achievementsPath, JSON.stringify({}));
	}

	function unlockAchievement(userId, achievementName, guild) {
		const data = JSON.parse(fs.readFileSync(achievementsPath, 'utf8'));
		
		if (!data[userId]) {
			data[userId] = { achievements: [], streak: 0, messages: 0 };
		}

		if (!data[userId].achievements.includes(achievementName)) {
			data[userId].achievements.push(achievementName);
			fs.writeFileSync(achievementsPath, JSON.stringify(data, null, 2));

			const achievement = achievements[achievementName];
			if (achievement && guild) {
				const embed = new EmbedBuilder()
					.setTitle(`${achievement.emoji} Achievement Unlocked!`)
					.setDescription(`<@${userId}> just unlocked: **${achievementName}**\n${achievement.description}`)
					.setColor('#FFD700')
					.setTimestamp();

				// Send to a general channel if available
				const channel = guild.channels.cache.find(c => c.name === 'general' || c.name === 'announcements');
				if (channel && channel.isTextBased()) {
					channel.send({ embeds: [embed] }).catch(() => null);
				}
			}
		}
	}

	// Track messages
	client.on(Events.MessageCreate, (message) => {
		if (message.author.bot || !message.guild) return;

		const data = JSON.parse(fs.readFileSync(achievementsPath, 'utf8'));
		const userId = message.author.id;

		if (!data[userId]) {
			data[userId] = { achievements: [], streak: 0, messages: 0 };
		}

		data[userId].messages++;
		fs.writeFileSync(achievementsPath, JSON.stringify(data, null, 2));

		// Unlock message milestones
		const milestones = [
			{ count: 1, name: 'First Message' },
			{ count: 100, name: 'Message Milestone 100' },
			{ count: 500, name: 'Message Milestone 500' },
			{ count: 1000, name: 'Message Milestone 1000' }
		];

		milestones.forEach(m => {
			if (data[userId].messages === m.count) {
				unlockAchievement(userId, m.name, message.guild);
			}
		});
	});

	// Track boosts
	client.on(Events.GuildMemberUpdate, (oldMember, newMember) => {
		if (!oldMember.premiumSince && newMember.premiumSince) {
			unlockAchievement(newMember.id, 'Server Booster', newMember.guild);
		}
	});

	// Expose function to unlock achievements from other handlers
	client.unlockAchievement = unlockAchievement;
};
