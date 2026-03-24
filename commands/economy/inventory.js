const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('inventory')
		.setDescription('Show your owned items'),
	async execute(interaction) {
		const userId = interaction.user.id;
		const inventoryPath = path.join(__dirname, '../../data/inventory.json');

		if (!fs.existsSync(inventoryPath)) return interaction.reply('You don\'t own any items yet.');
		
		const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
		const userItems = inventory[userId] || [];

		if (userItems.length === 0) {
			return interaction.reply('Your inventory is empty.');
		}

		const embed = new EmbedBuilder()
			.setTitle(`🎒 ${interaction.user.username}'s Inventory`)
			.setDescription(userItems.map((item, index) => `${index + 1}. ${item}`).join('\n'))
			.setColor('#FFAA00')
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
