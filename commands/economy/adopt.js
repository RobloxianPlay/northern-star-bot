const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('adopt')
		.setDescription('Adopt a pet using coins')
		.addStringOption(option =>
			option.setName('pet')
				.setDescription('The pet you want to adopt')
				.setRequired(true)
				.addChoices(
					{ name: 'Dog (500 coins, +10%)', value: 'dog' },
					{ name: 'Cat (500 coins, +15%)', value: 'cat' },
					{ name: 'Dragon (5000 coins, +50%)', value: 'dragon' }
				)),
	async execute(interaction) {
		const petType = interaction.options.getString('pet');
		const userId = interaction.user.id;
		const economyPath = path.join(__dirname, '../../data/economy.json');
		const petsPath = path.join(__dirname, '../../data/pets.json');

		const prices = { dog: 500, cat: 500, dragon: 5000 };
		const price = prices[petType];

		let economy = JSON.parse(fs.readFileSync(economyPath, 'utf8'));
		if (!economy[userId] || economy[userId].coins < price) {
			return interaction.reply({ content: `You need ${price} coins to adopt this pet!`, ephemeral: true });
		}

		if (!fs.existsSync(petsPath)) fs.writeFileSync(petsPath, JSON.stringify({}));
		let petsData = JSON.parse(fs.readFileSync(petsPath, 'utf8'));

		economy[userId].coins -= price;
		petsData[userId] = { pet: petType, happiness: 100 };

		fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));
		fs.writeFileSync(petsPath, JSON.stringify(petsData, null, 2));

		const embed = new EmbedBuilder()
			.setTitle('🐾 New Family Member!')
			.setDescription(`Congratulations! You've adopted a **${petType.toUpperCase()}** for **${price}** coins!`)
			.setColor('#00FF00')
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
