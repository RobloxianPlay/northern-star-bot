const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('warnings')
		.setDescription('Check a user\'s warnings')
		.addUserOption(option => option.setName('target').setDescription('The user to check').setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
	async execute(interaction) {
		const target = interaction.options.getUser('target');
		const warningsPath = path.join(__dirname, '../../data/warnings.json');
		const warnings = JSON.parse(fs.readFileSync(warningsPath, 'utf8'));

		const userWarnings = warnings[target.id] || [];
		if (userWarnings.length === 0) {
			return interaction.reply(`${target.tag} has no warnings.`);
		}

		const warnList = userWarnings.map((w, i) => `${i + 1}. **Reason:** ${w.reason} (By <@${w.moderator}>)`).join('\n');

		const embed = new EmbedBuilder()
			.setColor(0xFFFF00)
			.setTitle(`Warnings for ${target.tag}`)
			.setDescription(warnList)
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
