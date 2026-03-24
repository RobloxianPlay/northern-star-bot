const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs   = require('node:fs');
const path = require('node:path');

const economyPath = path.join(__dirname, '../../data/economy.json');
const xpPath      = path.join(__dirname, '../../data/xp.json');
const petsPath    = path.join(__dirname, '../../data/pets.json');
const streaksPath = path.join(__dirname, '../../data/streaks.json');

function load(p) {
	if (!fs.existsSync(p)) return {};
	try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return {}; }
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('globalbalance')
		.setDescription('View your global balance across all servers')
		.addUserOption(opt => opt.setName('user').setDescription('User to check')),

	async execute(interaction) {
		const target  = interaction.options.getUser('user') || interaction.user;
		const userId  = target.id;

		const economy = load(economyPath);
		const xpData  = load(xpPath);
		const pets    = load(petsPath);
		const streaks = load(streaksPath);

		const coins   = economy[userId]?.coins  || 0;
		const level   = xpData[userId]?.level   || 1;
		const xp      = xpData[userId]?.xp      || 0;
		const pet     = pets[userId];
		const streak  = streaks[userId]?.streak  || 0;

		// Rank by coins
		const allCoins = Object.values(economy).map(e => e.coins || 0);
		const sorted   = [...allCoins].sort((a, b) => b - a);
		const rank     = sorted.indexOf(coins) + 1;

		const embed = new EmbedBuilder()
			.setTitle(`🌐 Global Balance — ${target.username}`)
			.setThumbnail(target.displayAvatarURL({ dynamic: true }))
			.addFields(
				{ name: '💰 Coins',       value: coins.toLocaleString(),  inline: true },
				{ name: '✨ Level',        value: `${level} (${xp} XP)`,   inline: true },
				{ name: '🌍 Global Rank',  value: `#${rank}`,              inline: true },
				{ name: '🔥 Chat Streak',  value: `${streak} days`,        inline: true },
				{ name: '🐾 Pet',          value: pet ? `${pet.emoji} ${pet.name} (Lv.${pet.level || 1})` : 'None', inline: true },
				{ name: '📊 Net Worth',    value: `${coins.toLocaleString()} coins`, inline: true }
			)
			.setColor('#FFD700')
			.setFooter({ text: 'Global economy — stats shared across all servers' })
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	}
};
