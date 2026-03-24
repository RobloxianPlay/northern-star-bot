const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('buy')
		.setDescription('Buy an item from the shop')
		.addStringOption(option => 
			option.setName('item_id')
				.setDescription('The ID of the item to buy')
				.setRequired(true)),
	async execute(interaction) {
		const itemId = interaction.options.getString('item_id');
		const userId = interaction.user.id;
		
		const shopPath = path.join(__dirname, '../../data/shop.json');
		const economyPath = path.join(__dirname, '../../data/economy.json');
		const inventoryPath = path.join(__dirname, '../../data/inventory.json');

		if (!fs.existsSync(shopPath)) return interaction.reply('Shop is not available.');
		const shopItems = JSON.parse(fs.readFileSync(shopPath, 'utf8'));
		const item = shopItems.find(i => i.id === itemId);

		if (!item) return interaction.reply({ content: 'That item does not exist in the shop!', ephemeral: true });

		let economy = JSON.parse(fs.readFileSync(economyPath, 'utf8'));
		if (!economy[userId] || economy[userId].coins < item.price) {
			return interaction.reply({ content: `You need ${item.price} coins to buy this, but you only have ${economy[userId]?.coins || 0}.`, ephemeral: true });
		}

		// Deduct coins
		economy[userId].coins -= item.price;
		fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));

		let response = `You successfully bought **${item.name}** for ${item.price} coins!`;

		if (item.roleId) {
			const role = interaction.guild.roles.cache.get(item.roleId);
			if (role) {
				await interaction.member.roles.add(role).catch(err => {
					console.error(err);
					response += '\n*Note: I couldn\'t give you the role. Please contact an admin.*';
				});
			}
		} else {
			if (!fs.existsSync(inventoryPath)) fs.writeFileSync(inventoryPath, JSON.stringify({}));
			let inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
			if (!inventory[userId]) inventory[userId] = [];
			inventory[userId].push(item.name);
			fs.writeFileSync(inventoryPath, JSON.stringify(inventory, null, 2));
		}

		const embed = new EmbedBuilder()
			.setTitle('🛍️ Purchase Successful')
			.setDescription(response)
			.setColor('#00FF00')
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
