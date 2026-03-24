const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('kick')
		.setDescription('Kick a member from the server')
		.addUserOption(option => option.setName('target').setDescription('The member to kick').setRequired(true))
		.addStringOption(option => option.setName('reason').setDescription('Reason for the kick'))
		.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
	async execute(interaction) {
		const target = interaction.options.getMember('target');
		const reason = interaction.options.getString('reason') || 'No reason provided';

		if (!target) return interaction.reply({ content: 'Member not found.', ephemeral: true });
		if (!target.kickable) return interaction.reply({ content: 'I cannot kick this member.', ephemeral: true });

		await target.kick(reason);

		const embed = new EmbedBuilder()
			.setTitle('User Kicked')
			.addFields(
				{ name: 'User', value: target.user.tag, inline: true },
				{ name: 'Moderator', value: interaction.user.tag, inline: true },
				{ name: 'Reason', value: reason }
			)
			.setColor('#FFA500')
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
