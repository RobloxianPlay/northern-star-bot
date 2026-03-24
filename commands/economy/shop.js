const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('shop')
		.setDescription('View items available in the shop'),
	async execute(interaction) {
		const shopPath = path.join(__dirname, '../../data/shop.json');
		if (!fs.existsSync(shopPath)) return interaction.reply('The shop is currently empty.');
		
		const shopItems = JSON.parse(fs.readFileSync(shopPath, 'utf8'));
		
		const embed = new EmbedBuilder()
			.setTitle('🛒 Server Shop')
			.setDescription('Use `/buy <item_id>` to purchase an item!')
			.setColor('#5865F2')
			.setTimestamp();

		shopItems.forEach(item => {
			embed.addFields({ 
				name: `${item.name} (ID: ${item.id})`, 
				value: `**Price:** ${item.price} coins\n${item.description}` 
			});
		});

		await interaction.reply({ embeds: [embed] });
	},
};
