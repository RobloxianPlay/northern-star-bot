const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('remind')
		.setDescription('Set a reminder')
		.addIntegerOption(option => option.setName('minutes').setDescription('Minutes from now').setRequired(true))
		.addStringOption(option => option.setName('message').setDescription('What to remind you about').setRequired(true)),
	async execute(interaction) {
		const minutes = interaction.options.getInteger('minutes');
		const message = interaction.options.getString('message');

		await interaction.reply(`⏰ Okay! I will remind you in ${minutes} minutes: **${message}**`);

		setTimeout(async () => {
			try {
				await interaction.user.send(`🔔 **Reminder:** ${message}`);
			} catch (error) {
				await interaction.channel.send(`🔔 <@${interaction.user.id}> **Reminder:** ${message}`);
			}
		}, minutes * 60 * 1000);
	},
};
