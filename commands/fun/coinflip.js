const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('coinflip')
		.setDescription('Bet your coins on a coinflip')
		.addIntegerOption(option => option.setName('bet').setDescription('Amount to bet').setRequired(true).setMinValue(1)),
	async execute(interaction) {
		const bet = interaction.options.getInteger('bet');
		const fs = require('node:fs');
		const path = require('node:path');
		const economyPath = path.join(__dirname, '../../data/economy.json');
		let economy = JSON.parse(fs.readFileSync(economyPath, 'utf8'));
		const userId = interaction.user.id;

		if (!economy[userId] || economy[userId].coins < bet) {
			return interaction.reply({ content: 'You do not have enough coins to bet that much!', ephemeral: true });
		}

		const win = Math.random() > 0.5;
		if (win) {
			economy[userId].coins += bet;
		} else {
			economy[userId].coins -= bet;
		}

		fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));

		const embed = new EmbedBuilder()
			.setColor(win ? 0x00FF00 : 0xFF0000)
			.setTitle('🪙 Coinflip')
			.setDescription(win ? `You won **${bet}** coins! 🎊` : `You lost **${bet}** coins. 😢`)
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
