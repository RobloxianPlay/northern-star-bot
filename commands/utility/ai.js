const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ai')
		.setDescription('Ask the AI assistant a question')
		.addStringOption(opt =>
			opt.setName('question')
				.setDescription('What do you want to ask?')
				.setRequired(true)),

	async execute(interaction) {
		const apiKey = process.env.OPENAI_API_KEY;
		if (!apiKey) {
			return interaction.reply({
				content: '❌ AI assistant is not configured. An `OPENAI_API_KEY` environment variable is required.',
				ephemeral: true
			});
		}

		const question = interaction.options.getString('question');
		await interaction.deferReply();

		try {
			const OpenAI = require('openai');
			const openai = new OpenAI({ apiKey });

			const completion = await openai.chat.completions.create({
				model: 'gpt-3.5-turbo',
				messages: [
					{
						role: 'system',
						content: 'You are a helpful assistant for a Roblox community Discord server called Northern Star Devs. Answer questions clearly and concisely, especially about Roblox game development, scripting, and building.'
					},
					{ role: 'user', content: question }
				],
				max_tokens: 500
			});

			const answer = completion.choices[0]?.message?.content || 'No response received.';

			const embed = new EmbedBuilder()
				.setTitle('🤖 AI Assistant')
				.addFields(
					{ name: '❓ Question', value: question.slice(0, 1024) },
					{ name: '💡 Answer', value: answer.slice(0, 1024) }
				)
				.setColor('#5865F2')
				.setFooter({ text: `Asked by ${interaction.user.tag}` })
				.setTimestamp();

			await interaction.editReply({ embeds: [embed] });
		} catch (err) {
			await interaction.editReply({ content: `❌ AI request failed: ${err.message}` });
		}
	}
};
