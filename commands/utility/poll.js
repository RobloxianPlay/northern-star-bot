const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('poll')
		.setDescription('Create a poll with up to 4 options')
		.addStringOption(option => 
			option.setName('question')
				.setDescription('The question for the poll')
				.setRequired(true))
		.addStringOption(option => 
			option.setName('option1')
				.setDescription('First option')
				.setRequired(true))
		.addStringOption(option => 
			option.setName('option2')
				.setDescription('Second option')
				.setRequired(true))
		.addStringOption(option => 
			option.setName('option3')
				.setDescription('Third option (optional)'))
		.addStringOption(option => 
			option.setName('option4')
				.setDescription('Fourth option (optional)')),
	async execute(interaction) {
		const question = interaction.options.getString('question');
		const op1 = interaction.options.getString('option1');
		const op2 = interaction.options.getString('option2');
		const op3 = interaction.options.getString('option3');
		const op4 = interaction.options.getString('option4');

		const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'];
		let description = `**Question:** ${question}\n\n`;
		description += `${emojis[0]} ${op1}\n`;
		description += `${emojis[1]} ${op2}\n`;
		
		const reactionCount = [true, true, !!op3, !!op4];
		if (op3) description += `${emojis[2]} ${op3}\n`;
		if (op4) description += `${emojis[3]} ${op4}\n`;

		const embed = new EmbedBuilder()
			.setTitle('📊 Poll')
			.setDescription(description)
			.setColor('#FFFF00')
			.setFooter({ text: 'Vote by reacting.' })
			.setTimestamp();

		const message = await interaction.reply({ embeds: [embed], fetchReply: true });

		for (let i = 0; i < reactionCount.length; i++) {
			if (reactionCount[i]) {
				await message.react(emojis[i]).catch(err => console.error('Error reacting to poll:', err));
			}
		}
	},
};
