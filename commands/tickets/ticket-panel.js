const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ticket-panel')
		.setDescription('Send the support ticket panel')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	async execute(interaction) {
		const embed = new EmbedBuilder()
			.setTitle('🎫 Support Tickets')
			.setDescription(
				'Need help? Open a support ticket and our staff team will assist you!\n\n' +
				'**Before opening a ticket:**\n' +
				'› Check if your issue is already answered in FAQ\n' +
				'› Have your details ready to speed up the process\n' +
				'› One ticket per issue keeps responses fast\n\n' +
				'**Click the button below to create a ticket.**'
			)
			.addFields(
				{ name: '⏱ Response Time', value: 'Usually under 1 hour', inline: true },
				{ name: '🕐 Availability', value: 'Staff available daily', inline: true }
			)
			.setColor('#5865F2')
			.setFooter({ text: 'Northern Star Devs • Support System' })
			.setTimestamp();

		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId('create_ticket')
				.setLabel('Create Ticket')
				.setEmoji('🎫')
				.setStyle(ButtonStyle.Primary)
		);

		await interaction.reply({ content: '✅ Ticket panel sent!', ephemeral: true });
		await interaction.channel.send({ embeds: [embed], components: [row] });
	}
};
