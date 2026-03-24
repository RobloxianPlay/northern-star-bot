const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const RESPONSES = [
	{ text: 'It is certain.', type: 'positive' },
	{ text: 'It is decidedly so.', type: 'positive' },
	{ text: 'Without a doubt.', type: 'positive' },
	{ text: 'Yes, definitely.', type: 'positive' },
	{ text: 'You may rely on it.', type: 'positive' },
	{ text: 'As I see it, yes.', type: 'positive' },
	{ text: 'Most likely.', type: 'positive' },
	{ text: 'Outlook good.', type: 'positive' },
	{ text: 'Yes.', type: 'positive' },
	{ text: 'Signs point to yes.', type: 'positive' },
	{ text: 'Reply hazy, try again.', type: 'neutral' },
	{ text: 'Ask again later.', type: 'neutral' },
	{ text: 'Better not tell you now.', type: 'neutral' },
	{ text: 'Cannot predict now.', type: 'neutral' },
	{ text: 'Concentrate and ask again.', type: 'neutral' },
	{ text: "Don't count on it.", type: 'negative' },
	{ text: 'My reply is no.', type: 'negative' },
	{ text: 'My sources say no.', type: 'negative' },
	{ text: 'Outlook not so good.', type: 'negative' },
	{ text: 'Very doubtful.', type: 'negative' }
];

const COLORS = {
	positive: '#00FF00',
	neutral: '#FFFF00',
	negative: '#FF0000'
};

module.exports = {
	cooldown: 3,
	data: new SlashCommandBuilder()
		.setName('8ball')
		.setDescription('Ask the magic 8ball a question')
		.addStringOption(o =>
			o.setName('question')
				.setDescription('Your yes/no question')
				.setRequired(true)
		),

	async execute(interaction) {
		const question = interaction.options.getString('question');
		const response = RESPONSES[Math.floor(Math.random() * RESPONSES.length)];

		const embed = new EmbedBuilder()
			.setTitle('🎱 Magic 8-Ball')
			.addFields(
				{ name: '❓ Question', value: question },
				{ name: '🎱 Answer', value: `**${response.text}**` }
			)
			.setColor(COLORS[response.type])
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	}
};
