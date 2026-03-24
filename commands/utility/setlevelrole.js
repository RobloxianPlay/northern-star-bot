const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setlevelrole')
		.setDescription('Set a role reward for a specific level')
		.addIntegerOption(option => 
			option.setName('level')
				.setDescription('The level required for the role')
				.setRequired(true))
		.addRoleOption(option => 
			option.setName('role')
				.setDescription('The role to reward')
				.setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
		const level = interaction.options.getInteger('level');
		const role = interaction.options.getRole('role');
		const dataPath = path.join(__dirname, '../../data/levelRoles.json');

		if (!fs.existsSync(dataPath)) {
			fs.writeFileSync(dataPath, JSON.stringify({}));
		}

		const levelRoles = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
		levelRoles[level] = role.id;

		fs.writeFileSync(dataPath, JSON.stringify(levelRoles, null, 2));

		const embed = new EmbedBuilder()
			.setTitle('✅ Level Role Set')
			.setDescription(`Level **${level}** will now reward the ${role} role!`)
			.setColor('#00FF00')
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
