const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('warn')
		.setDescription('Warn a user')
		.addUserOption(option => option.setName('target').setDescription('The user to warn').setRequired(true))
		.addStringOption(option => option.setName('reason').setDescription('Reason for the warning').setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
	async execute(interaction) {
		const target = interaction.options.getUser('target');
		const reason = interaction.options.getString('reason');
		const warningsPath = path.join(__dirname, '../../data/warnings.json');
		let warnings = JSON.parse(fs.readFileSync(warningsPath, 'utf8'));

		if (!warnings[target.id]) warnings[target.id] = [];
		warnings[target.id].push({
			reason,
			moderator: interaction.user.id,
			timestamp: Date.now()
		});

		fs.writeFileSync(warningsPath, JSON.stringify(warnings, null, 2));

		const embed = new EmbedBuilder()
			.setColor(0xFFAA00)
			.setTitle('⚠️ User Warned')
			.addFields(
				{ name: 'Target', value: target.tag },
				{ name: 'Moderator', value: interaction.user.tag },
				{ name: 'Reason', value: reason },
				{ name: 'Total Warnings', value: warnings[target.id].length.toString() }
			)
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
