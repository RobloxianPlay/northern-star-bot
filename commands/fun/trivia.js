const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('trivia')
		.setDescription('Answer a Roblox trivia question'),
	async execute(interaction) {
		const questions = [
			{ q: 'Who is the creator of Roblox?', a: 'david baszucki' },
			{ q: 'What year was Roblox released?', a: '2006' },
			{ q: 'What was Roblox originally called?', a: 'dynablocks' },
			{ q: 'Which game is famous for "Adopt Me"?', a: 'adopt me' }
		];

		const item = questions[Math.floor(Math.random() * questions.length)];
		
		await interaction.reply({ content: `**Trivia:** ${item.q}\n(Type your answer in the chat within 15 seconds!)` });

		const filter = m => m.author.id === interaction.user.id;
		const collector = interaction.channel.createMessageCollector({ filter, time: 15000, max: 1 });

		collector.on('collect', m => {
			if (m.content.toLowerCase() === item.a.toLowerCase()) {
				interaction.followUp('✅ Correct! You are a Roblox pro!');
			} else {
				interaction.followUp(`❌ Wrong! The correct answer was **${item.a}**.`);
			}
		});

		collector.on('end', collected => {
			if (collected.size === 0) {
				interaction.followUp('⏰ Time is up! You didn\'t answer.');
			}
		});
	},
};
