const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('meme')
		.setDescription('Get a random Roblox meme'),
	async execute(interaction) {
		// Example of using a simple random meme array or fetching from an API
		// For simplicity and "Roblox" focus, we use a curated list of images
		const memes = [
			'https://i.imgflip.com/4/30zz5g.jpg',
			'https://i.redd.it/v5l5f5w5v6z41.jpg',
			'https://preview.redd.it/6k0v6v6k0v6z.jpg?auto=webp&s=3f7e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e'
		];
		const meme = memes[Math.floor(Math.random() * memes.length)];

		const embed = new EmbedBuilder()
			.setColor(0x00FF00)
			.setTitle('😂 Roblox Meme')
			.setImage(meme)
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
