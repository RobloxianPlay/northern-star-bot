const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('slots')
		.setDescription('Spin the slot machine')
		.addIntegerOption(option =>
			option.setName('bet')
				.setDescription('Amount of coins to bet')
				.setRequired(true)
				.setMinValue(1)),
	async execute(interaction) {
		const bet = interaction.options.getInteger('bet');
		const userId = interaction.user.id;
		const economyPath = path.join(__dirname, '../../data/economy.json');

		let economy = JSON.parse(fs.readFileSync(economyPath, 'utf8'));
		if (!economy[userId] || economy[userId].coins < bet) {
			return interaction.reply({ content: `You don't have enough coins! You have ${economy[userId]?.coins || 0}.`, ephemeral: true });
		}

		const emojis = ['🍎', '🍊', '🍐', '🍋', '🍉', '🍇', '🍓', '🍒'];
		const result = [
			emojis[Math.floor(Math.random() * emojis.length)],
			emojis[Math.floor(Math.random() * emojis.length)],
			emojis[Math.floor(Math.random() * emojis.length)]
		];

		const embed = new EmbedBuilder()
			.setTitle('🎰 Slot Machine 🎰')
			.setDescription(`**[ ${result[0]} | ${result[1]} | ${result[2]} ]**`)
			.setTimestamp();

		if (result[0] === result[1] && result[1] === result[2]) {
			const winAmount = bet * 5;
			economy[userId].coins += winAmount;
			embed.setColor('#00FF00').addFields({ name: 'Result', value: `JACKPOT! You won **${winAmount}** coins! 🎊` });
		} else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
			const winAmount = Math.floor(bet * 1.5);
			economy[userId].coins += winAmount;
			embed.setColor('#FFFF00').addFields({ name: 'Result', value: `Nice! You won **${winAmount}** coins! ✨` });
		} else {
			economy[userId].coins -= bet;
			embed.setColor('#FF0000').addFields({ name: 'Result', value: `Better luck next time! You lost **${bet}** coins.` });
		}

		fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));
		await interaction.reply({ embeds: [embed] });
	},
};
