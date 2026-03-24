const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const JOKES = [
	{ setup: 'Why do programmers prefer dark mode?', punchline: 'Because light attracts bugs!' },
	{ setup: 'Why did the scarecrow win an award?', punchline: 'Because he was outstanding in his field!' },
	{ setup: 'I told my wife she should embrace her mistakes.', punchline: 'She gave me a hug.' },
	{ setup: 'Why don\'t scientists trust atoms?', punchline: 'Because they make up everything!' },
	{ setup: 'What do you call a fish without eyes?', punchline: 'A fsh!' },
	{ setup: 'Why do cows wear bells?', punchline: 'Because their horns don\'t work!' },
	{ setup: 'What do you call cheese that isn\'t yours?', punchline: 'Nacho cheese!' },
	{ setup: 'Why can\'t your nose be 12 inches long?', punchline: 'Because then it would be a foot!' },
	{ setup: 'I used to hate facial hair...', punchline: 'But then it grew on me.' },
	{ setup: 'Why did the bicycle fall over?', punchline: 'Because it was two-tired!' },
	{ setup: 'What do you call a sleeping dinosaur?', punchline: 'A dino-snore!' },
	{ setup: 'Why did the math book look so sad?', punchline: 'Because it had too many problems.' },
	{ setup: 'What do you call a fake noodle?', punchline: 'An impasta!' },
	{ setup: 'Why did the coffee file a police report?', punchline: 'It got mugged!' },
	{ setup: 'How does the ocean say hi?', punchline: 'It waves!' }
];

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('joke')
		.setDescription('Get a random joke'),

	async execute(interaction) {
		const joke = JOKES[Math.floor(Math.random() * JOKES.length)];

		const embed = new EmbedBuilder()
			.setTitle('😂 Random Joke')
			.addFields(
				{ name: '❓ Setup', value: joke.setup },
				{ name: '💬 Punchline', value: `||${joke.punchline}||` }
			)
			.setColor('#FF9900')
			.setFooter({ text: 'Click the spoiler to reveal the punchline!' })
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	}
};
