const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs   = require('node:fs');
const path = require('node:path');

const economyPath = path.join(__dirname, '../../data/economy.json');

function load(p) {
	if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify({}));
	return JSON.parse(fs.readFileSync(p, 'utf8'));
}

const redNumbers   = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
const blackNumbers = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];

function spin() { return Math.floor(Math.random() * 37); } // 0-36

module.exports = {
	data: new SlashCommandBuilder()
		.setName('roulette')
		.setDescription('Spin the roulette wheel')
		.addIntegerOption(opt =>
			opt.setName('bet').setDescription('Amount of coins to bet').setMinValue(10).setRequired(true))
		.addStringOption(opt =>
			opt.setName('choice')
				.setDescription('What to bet on')
				.setRequired(true)
				.addChoices(
					{ name: 'Red',   value: 'red' },
					{ name: 'Black', value: 'black' },
					{ name: 'Green (0)', value: 'green' },
					{ name: 'Odd',   value: 'odd' },
					{ name: 'Even',  value: 'even' },
					{ name: '1-18',  value: 'low' },
					{ name: '19-36', value: 'high' }
				)),

	async execute(interaction) {
		const bet    = interaction.options.getInteger('bet');
		const choice = interaction.options.getString('choice');
		const userId = interaction.user.id;
		const economy = load(economyPath);

		if (!economy[userId]) economy[userId] = { coins: 0 };
		if (economy[userId].coins < bet) {
			return interaction.reply({ content: `❌ You only have **${economy[userId].coins} coins**.`, ephemeral: true });
		}

		const result  = spin();
		const isRed   = redNumbers.includes(result);
		const isBlack = blackNumbers.includes(result);
		const isGreen = result === 0;

		let won = false;
		let multiplier = 2;

		switch (choice) {
			case 'red':   won = isRed;   break;
			case 'black': won = isBlack; break;
			case 'green': won = isGreen; multiplier = 14; break;
			case 'odd':   won = result !== 0 && result % 2 !== 0; break;
			case 'even':  won = result !== 0 && result % 2 === 0; break;
			case 'low':   won = result >= 1 && result <= 18; break;
			case 'high':  won = result >= 19 && result <= 36; break;
		}

		const color  = isGreen ? '🟢' : isRed ? '🔴' : '⚫';
		const profit = won ? bet * (multiplier - 1) : -bet;
		economy[userId].coins += profit;
		fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));

		const embed = new EmbedBuilder()
			.setTitle(`🎡 Roulette — ${color} ${result}`)
			.setDescription(won
				? `✅ **You won!** The ball landed on **${color} ${result}**\n\n💰 +${profit} coins (${multiplier}x)`
				: `❌ **You lost!** The ball landed on **${color} ${result}**\n\n💸 -${bet} coins`)
			.addFields({ name: '💰 Balance', value: `${economy[userId].coins} coins`, inline: true })
			.setColor(won ? '#00FF00' : '#FF0000')
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	}
};
