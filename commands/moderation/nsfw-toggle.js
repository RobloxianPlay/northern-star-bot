const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('nsfw-toggle')
		.setDescription('Enable or disable NSFW content detection')
		.addBooleanOption(option =>
			option.setName('enabled')
				.setDescription('Enable or disable NSFW filter')
				.setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
		const enabled = interaction.options.getBoolean('enabled');
		const settingsPath = path.join(__dirname, '../../data/nsfwSettings.json');

		if (!fs.existsSync(settingsPath)) {
			fs.writeFileSync(settingsPath, JSON.stringify({}));
		}

		const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
		if (!settings[interaction.guild.id]) {
			settings[interaction.guild.id] = {};
		}

		settings[interaction.guild.id].enabled = enabled;
		fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));

		const embed = new EmbedBuilder()
			.setTitle('🔧 NSFW Filter Updated')
			.setDescription(`NSFW content detection is now **${enabled ? 'enabled' : 'disabled'}**.`)
			.setColor(enabled ? '#00FF00' : '#FF0000')
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
