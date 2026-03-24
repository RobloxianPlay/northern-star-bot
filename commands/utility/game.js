const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('game')
		.setDescription('Get the Roblox game link'),
	async execute(interaction) {
		const embed = new EmbedBuilder()
			.setColor(0xFFFFFF)
			.setTitle('🎮 Our Roblox Game')
			.setDescription('Check out our Roblox game here: [Click to Play](https://www.roblox.com/games/your_game_id)')
			.setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Roblox_player_icon_black.svg/1200px-Roblox_player_icon_black.svg.png')
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
