const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('rps')
		.setDescription('Play Rock Paper Scissors for coins')
		.addStringOption(option =>
			option.setName('choice')
				.setDescription('Your choice')
				.setRequired(true)
				.addChoices(
					{ name: 'Rock', value: 'rock' },
					{ name: 'Paper', value: 'paper' },
					{ name: 'Scissors', value: 'scissors' }
				))
		.addIntegerOption(option =>
			option.setName('bet')
				.setDescription('Amount of coins to bet')
				.setRequired(true)
				.setMinValue(1)),
	async execute(interaction) {
		const choice = interaction.options.getString('choice');
		const bet = interaction.options.getInteger('bet');
		const userId = interaction.user.id;
		const economyPath = path.join(__dirname, '../../data/economy.json');

		let economy = JSON.parse(fs.readFileSync(economyPath, 'utf8'));
		if (!economy[userId] || economy[userId].coins < bet) {
			return interaction.reply({ content: `You don't have enough coins! You have ${economy[userId]?.coins || 0}.`, ephemeral: true });
		}

		const choices = ['rock', 'paper', 'scissors'];
		const botChoice = choices[Math.floor(Math.random() * choices.length)];
		let result;

		if (choice === botChoice) {
			result = 'tie';
		} else if (
			(choice === 'rock' && botChoice === 'scissors') ||
			(choice === 'paper' && botChoice === 'rock') ||
			(choice === 'scissors' && botChoice === 'paper')
		) {
			result = 'win';
		} else {
			result = 'lose';
		}

		const embed = new EmbedBuilder()
			.setTitle('🪨 Rock Paper Scissors ✂️')
			.addFields(
				{ name: 'Your Choice', value: choice.charAt(0).toUpperCase() + choice.slice(1), inline: true },
				{ name: 'My Choice', value: botChoice.charAt(0).toUpperCase() + botChoice.slice(1), inline: true }
			)
			.setTimestamp();

		if (result === 'win') {
			economy[userId].coins += bet;
			embed.setColor('#00FF00').setDescription(`You won **${bet}** coins! 🎉`);
		} else if (result === 'lose') {
			economy[userId].coins -= bet;
			embed.setColor('#FF0000').setDescription(`You lost **${bet}** coins. 😢`);
		} else {
			embed.setColor('#FFFF00').setDescription('It\'s a tie! No coins lost.');
		}

		fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));
		await interaction.reply({ embeds: [embed] });
	},
};
