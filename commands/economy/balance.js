const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs   = require('node:fs');
const path = require('node:path');

const economyPath = path.join(__dirname, '../../data/economy.json');

function loadEconomy() {
	try {
		if (!fs.existsSync(economyPath)) fs.writeFileSync(economyPath, JSON.stringify({}));
		return JSON.parse(fs.readFileSync(economyPath, 'utf8'));
	} catch { return {}; }
}

function saveEconomy(data) {
	try {
		fs.writeFileSync(economyPath, JSON.stringify(data, null, 2));
	} catch {}
}

module.exports = {
	cooldown: 3,
	data: new SlashCommandBuilder()
		.setName('balance')
		.setDescription('Check a user\'s coin balance')
		.addUserOption(o => o.setName('user').setDescription('The user to check')),

	async execute(interaction) {
		const target = interaction.options.getUser('user') || interaction.user;
		const economy = loadEconomy();

		if (!economy[target.id]) {
			economy[target.id] = { coins: 0, lastDaily: 0 };
			saveEconomy(economy);
		}

		// Prevent negative balances
		if (economy[target.id].coins < 0) {
			economy[target.id].coins = 0;
			saveEconomy(economy);
		}

		const coins = economy[target.id].coins;
		const isSelf = target.id === interaction.user.id;

		const embed = new EmbedBuilder()
			.setTitle(`💰 ${target.username}'s Balance`)
			.setDescription(`${isSelf ? 'You have' : `**${target.username}** has`} **${coins.toLocaleString()}** 🪙 coins.`)
			.setThumbnail(target.displayAvatarURL({ dynamic: true }))
			.setColor('#FFD700')
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	}
};
