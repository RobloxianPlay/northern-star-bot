const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('clear')
		.setDescription('Clear messages from the channel')
		.addIntegerOption(option => option.setName('amount').setDescription('Number of messages to clear').setRequired(true).setMinValue(1).setMaxValue(100))
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
	async execute(interaction) {
		const amount = interaction.options.getInteger('amount');

		const messages = await interaction.channel.bulkDelete(amount, true).catch(err => {
			console.error(err);
			return null;
		});

		if (!messages) return interaction.reply({ content: 'Failed to clear messages. They might be older than 14 days.', ephemeral: true });

		const embed = new EmbedBuilder()
			.setTitle('Messages Cleared')
			.setDescription(`Successfully cleared **${messages.size}** messages.`)
			.setColor('#00FF00')
			.setTimestamp();

		await interaction.reply({ embeds: [embed], ephemeral: true });
	},
};
