const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('giveaway')
		.setDescription('Start an advanced giveaway')
		.addStringOption(option => option.setName('prize').setDescription('The prize for the giveaway').setRequired(true))
		.addIntegerOption(option => option.setName('duration').setDescription('Duration in minutes').setRequired(true))
		.addIntegerOption(option => option.setName('winners').setDescription('Number of winners').setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
		const prize = interaction.options.getString('prize');
		const duration = interaction.options.getInteger('duration');
		const winnerCount = interaction.options.getInteger('winners');
		const endTime = Date.now() + duration * 60 * 1000;

		const giveawayPath = path.join(__dirname, '../../data/giveaways.json');
		if (!fs.existsSync(giveawayPath)) fs.writeFileSync(giveawayPath, JSON.stringify({}));
		
		const embed = new EmbedBuilder()
			.setTitle('🎉 GIVEAWAY 🎉')
			.setDescription(`**Prize:** ${prize}\n**Winners:** ${winnerCount}\n**Ends:** <t:${Math.floor(endTime / 1000)}:R>`)
			.setColor('#00FFFF')
			.setTimestamp();

		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId('join_giveaway')
				.setLabel('Join')
				.setEmoji('🎉')
				.setStyle(ButtonStyle.Primary)
		);

		const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

		let giveaways = JSON.parse(fs.readFileSync(giveawayPath, 'utf8'));
		giveaways[message.id] = {
			prize,
			endTime,
			winnerCount,
			participants: [],
			guildId: interaction.guild.id,
			channelId: interaction.channel.id
		};
		fs.writeFileSync(giveawayPath, JSON.stringify(giveaways, null, 2));

		const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: duration * 60 * 1000 });

		collector.on('collect', async i => {
			let currentGiveaways = JSON.parse(fs.readFileSync(giveawayPath, 'utf8'));
			if (!currentGiveaways[message.id]) return i.reply({ content: 'Giveaway no longer exists.', ephemeral: true });

			if (currentGiveaways[message.id].participants.includes(i.user.id)) {
				return i.reply({ content: 'You already joined!', ephemeral: true });
			}

			currentGiveaways[message.id].participants.push(i.user.id);
			fs.writeFileSync(giveawayPath, JSON.stringify(currentGiveaways, null, 2));
			await i.reply({ content: 'You joined the giveaway!', ephemeral: true });
		});

		collector.on('end', async () => {
			let finalGiveaways = JSON.parse(fs.readFileSync(giveawayPath, 'utf8'));
			const data = finalGiveaways[message.id];
			if (!data) return;

			const winners = [];
			const participants = data.participants;

			if (participants.length > 0) {
				for (let j = 0; j < Math.min(data.winnerCount, participants.length); j++) {
					const winnerIdx = Math.floor(Math.random() * participants.length);
					winners.push(participants.splice(winnerIdx, 1)[0]);
				}
			}

			const endEmbed = new EmbedBuilder()
				.setTitle('🎉 GIVEAWAY ENDED 🎉')
				.setDescription(`**Prize:** ${data.prize}\n**Winners:** ${winners.length > 0 ? winners.map(w => `<@${w}>`).join(', ') : 'No one joined.'}`)
				.setColor('#FF0000')
				.setTimestamp();

			await interaction.editReply({ embeds: [endEmbed], components: [] });

			if (winners.length > 0) {
				await interaction.followUp(`Congratulations ${winners.map(w => `<@${w}>`).join(', ')}! You won **${data.prize}**!`);
				
				// Economy Integration
				if (data.prize.toLowerCase().includes('coins')) {
					const amountMatch = data.prize.match(/\d+/);
					if (amountMatch) {
						const amount = parseInt(amountMatch[0]);
						const economyPath = path.join(__dirname, '../../data/economy.json');
						let economy = JSON.parse(fs.readFileSync(economyPath, 'utf8'));
						winners.forEach(wId => {
							if (!economy[wId]) economy[wId] = { coins: 0 };
							economy[wId].coins += amount;
						});
						fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));
					}
				}
			}

			delete finalGiveaways[message.id];
			fs.writeFileSync(giveawayPath, JSON.stringify(finalGiveaways, null, 2));
		});
	},
};
