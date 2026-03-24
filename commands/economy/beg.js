const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('beg')
		.setDescription('Beg for some coins'),
	async execute(interaction) {
		const userId = interaction.user.id;
		const economyPath = path.join(__dirname, '../../data/economy.json');
		let economy = JSON.parse(fs.readFileSync(economyPath, 'utf8'));

		if (!economy[userId]) {
			economy[userId] = { coins: 0, lastDaily: 0 };
		}

		let amount = Math.floor(Math.random() * 50) + 10;
		
		// Pet Bonus
		const petsPath = path.join(__dirname, '../../data/pets.json');
		if (fs.existsSync(petsPath)) {
			const petsData = JSON.parse(fs.readFileSync(petsPath, 'utf8'));
			const userPet = petsData[userId];
			if (userPet) {
				const bonuses = { dog: 0.1, cat: 0.15, dragon: 0.5 };
				const bonus = bonuses[userPet.pet] || 0;
				amount = Math.floor(amount * (1 + bonus));
			}
		}

		economy[userId].coins += amount;
		fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));

		const responses = [
			'A kind stranger gave you',
			'You found some coins on the floor, specifically',
			'A generous soul tossed you',
			'You begged and received'
		];
		const response = responses[Math.floor(Math.random() * responses.length)];

		const embed = new EmbedBuilder()
			.setTitle('🙏 Begging')
			.setDescription(`${response} **${amount}** coins!`)
			.setColor('#FFFF00')
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
