const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('feedpet')
		.setDescription('Feed your pet to increase its happiness (Costs 50 coins)'),
	async execute(interaction) {
		const userId = interaction.user.id;
		const petsPath = path.join(__dirname, '../../data/pets.json');
		const economyPath = path.join(__dirname, '../../data/economy.json');

		if (!fs.existsSync(petsPath)) fs.writeFileSync(petsPath, JSON.stringify({}));
		let petsData = JSON.parse(fs.readFileSync(petsPath, 'utf8'));
		let economy = JSON.parse(fs.readFileSync(economyPath, 'utf8'));

		if (!petsData[userId]) {
			return interaction.reply({ content: 'You don\'t have a pet to feed!', ephemeral: true });
		}

		if (!economy[userId] || economy[userId].coins < 50) {
			return interaction.reply({ content: 'You need 50 coins to buy pet food!', ephemeral: true });
		}

		if (petsData[userId].happiness >= 100) {
			return interaction.reply({ content: 'Your pet is already full and happy!', ephemeral: true });
		}

		economy[userId].coins -= 50;
		petsData[userId].happiness = Math.min(100, petsData[userId].happiness + 20);

		fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));
		fs.writeFileSync(petsPath, JSON.stringify(petsData, null, 2));

		const embed = new EmbedBuilder()
			.setTitle('🍖 Yummy!')
			.setDescription(`You fed your pet! Its happiness is now **${petsData[userId].happiness}%**.`)
			.setColor('#FFA500')
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
