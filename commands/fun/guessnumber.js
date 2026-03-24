const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('guessnumber')
		.setDescription('Guess a number between 1 and 10')
		.addIntegerOption(option =>
			option.setName('number')
				.setDescription('The number you guess (1-10)')
				.setRequired(true)
				.setMinValue(1)
				.setMaxValue(10))
		.addIntegerOption(option =>
			option.setName('bet')
				.setDescription('Amount of coins to bet')
				.setRequired(true)
				.setMinValue(1)),
	async execute(interaction) {
		const guess = interaction.options.getInteger('number');
		const bet = interaction.options.getInteger('bet');
		const userId = interaction.user.id;
		const economyPath = path.join(__dirname, '../../data/economy.json');

		let economy = JSON.parse(fs.readFileSync(economyPath, 'utf8'));
		if (!economy[userId] || economy[userId].coins < bet) {
			return interaction.reply({ content: `You don't have enough coins! You have ${economy[userId]?.coins || 0}.`, ephemeral: true });
		}

		const winningNumber = Math.floor(Math.random() * 10) + 1;
		const embed = new EmbedBuilder()
			.setTitle('🔢 Guess the Number 🔢')
			.addFields(
				{ name: 'Your Guess', value: guess.toString(), inline: true },
				{ name: 'Winning Number', value: winningNumber.toString(), inline: true }
			)
			.setTimestamp();

		if (guess === winningNumber) {
			const winAmount = bet * 8;
			economy[userId].coins += winAmount;
			embed.setColor('#00FF00').setDescription(`AMAZING! You guessed it and won **${winAmount}** coins! 🏆`);
		} else {
			economy[userId].coins -= bet;
			embed.setColor('#FF0000').setDescription(`So close! You lost **${bet}** coins.`);
		}

		fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));
		await interaction.reply({ embeds: [embed] });
	},
};
