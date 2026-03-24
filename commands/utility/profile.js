const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('profile')
		.setDescription('View a user\'s profile card')
		.addUserOption(option => option.setName('user').setDescription('The user to view')),
	async execute(interaction) {
		const targetUser = interaction.options.getUser('user') || interaction.user;
		const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

		const economyPath = path.join(__dirname, '../../data/economy.json');
		const xpPath = path.join(__dirname, '../../data/xp.json');

		let economy = {};
		let xpData = {};

		if (fs.existsSync(economyPath)) {
			economy = JSON.parse(fs.readFileSync(economyPath, 'utf8'));
		}
		if (fs.existsSync(xpPath)) {
			xpData = JSON.parse(fs.readFileSync(xpPath, 'utf8'));
		}

		const coins = economy[targetUser.id]?.coins || 0;
		const level = xpData[targetUser.id]?.level || 1;
		const xp = xpData[targetUser.id]?.xp || 0;
		const joinedAt = member ? member.joinedAt.toLocaleDateString() : 'Unknown';

		// Progress Bar Calculation
		const xpRequired = level * 100;
		const progress = xp / xpRequired;
		const filledBlocks = Math.floor(progress * 20);
		const emptyBlocks = 20 - filledBlocks;
		const progressBar = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
		const progressPercentage = Math.floor(progress * 100);

		const embed = new EmbedBuilder()
			.setTitle(`${targetUser.username}'s Profile`)
			.setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
			.addFields(
				{ name: '💰 Coins', value: `\`${coins}\``, inline: true },
				{ name: '⭐ Level', value: `\`${level}\``, inline: true },
				{ name: '📈 XP', value: `\`${xp} / ${xpRequired}\``, inline: true },
				{ name: '📊 Progress', value: `\`${progressBar}\` ${progressPercentage}%`, inline: false },
				{ name: '📅 Joined Server', value: `\`${joinedAt}\``, inline: false }
			)
			.setColor('#5865F2')
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
