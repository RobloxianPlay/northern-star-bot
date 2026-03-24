const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pets')
		.setDescription('View your owned pets'),
	async execute(interaction) {
		const userId = interaction.user.id;
		const petsPath = path.join(__dirname, '../../data/pets.json');
		
		if (!fs.existsSync(petsPath)) fs.writeFileSync(petsPath, JSON.stringify({}));
		const petsData = JSON.parse(fs.readFileSync(petsPath, 'utf8'));
		
		const userPet = petsData[userId];
		
		if (!userPet) {
			return interaction.reply('You don\'t have any pets yet! Use `/adopt` to get one.');
		}

		const petIcons = { dog: '🐶', cat: '🐱', dragon: '🐲' };
		const embed = new EmbedBuilder()
			.setTitle(`${interaction.user.username}'s Pet`)
			.setDescription(`**Type:** ${petIcons[userPet.pet] || ''} ${userPet.pet.toUpperCase()}\n**Happiness:** ${userPet.happiness}%`)
			.setColor('#FF69B4')
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
