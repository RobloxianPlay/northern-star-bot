const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ban')
		.setDescription('Ban a member from the server')
		.addUserOption(option => option.setName('target').setDescription('The member to ban').setRequired(true))
		.addStringOption(option => option.setName('reason').setDescription('Reason for the ban'))
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
	async execute(interaction) {
		const target = interaction.options.getUser('target');
		const reason = interaction.options.getString('reason') || 'No reason provided';
		const member = await interaction.guild.members.fetch(target.id).catch(() => null);

		if (member && !member.bannable) return interaction.reply({ content: 'I cannot ban this member.', ephemeral: true });

		await interaction.guild.members.ban(target, { reason });

		const embed = new EmbedBuilder()
			.setTitle('User Banned')
			.addFields(
				{ name: 'User', value: target.tag, inline: true },
				{ name: 'Moderator', value: interaction.user.tag, inline: true },
				{ name: 'Reason', value: reason }
			)
			.setColor('#FF0000')
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
