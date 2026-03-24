const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reactionroles')
		.setDescription('Setup reaction roles')
		.addStringOption(option => option.setName('title').setDescription('Embed title').setRequired(true))
		.addStringOption(option => option.setName('description').setDescription('Embed description').setRequired(true))
		.addStringOption(option => option.setName('roles').setDescription('Format: emoji:roleId, emoji:roleId').setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
		const title = interaction.options.getString('title');
		const description = interaction.options.getString('description');
		const rolesInput = interaction.options.getString('roles');
		const rolesArray = rolesInput.split(',').map(r => r.trim());

		const dataPath = path.join(__dirname, '../../data/reactionRoles.json');
		if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, JSON.stringify({}));

		const embed = new EmbedBuilder()
			.setTitle(title)
			.setDescription(description)
			.setColor('#00FF00')
			.setTimestamp();

		const message = await interaction.reply({ embeds: [embed], fetchReply: true });

		const roleData = [];
		for (const item of rolesArray) {
			const [emoji, roleId] = item.split(':');
			if (emoji && roleId) {
				roleData.push({ emoji: emoji.trim(), roleId: roleId.trim() });
				await message.react(emoji.trim()).catch(() => null);
			}
		}

		const db = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
		db[message.id] = roleData;
		fs.writeFileSync(dataPath, JSON.stringify(db, null, 2));
	},
};
