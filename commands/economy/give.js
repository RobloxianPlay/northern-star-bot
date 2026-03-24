const {
	SlashCommandBuilder, EmbedBuilder, ActionRowBuilder,
	ButtonBuilder, ButtonStyle
} = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const economyPath = path.join(__dirname, '../../data/economy.json');

function loadEconomy() {
	try {
		if (!fs.existsSync(economyPath)) fs.writeFileSync(economyPath, JSON.stringify({}));
		return JSON.parse(fs.readFileSync(economyPath, 'utf8'));
	} catch { return {}; }
}

function saveEconomy(data) {
	fs.writeFileSync(economyPath, JSON.stringify(data, null, 2));
}

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('give')
		.setDescription('Give coins to another user')
		.addUserOption(o => o.setName('target').setDescription('The user to give coins to').setRequired(true))
		.addIntegerOption(o => o.setName('amount').setDescription('Amount of coins to give').setRequired(true).setMinValue(1)),

	async execute(interaction) {
		const target = interaction.options.getUser('target');
		const amount = interaction.options.getInteger('amount');
		const userId = interaction.user.id;

		if (target.id === userId) {
			return interaction.reply({ content: '❌ You cannot give coins to yourself.', ephemeral: true });
		}
		if (target.bot) {
			return interaction.reply({ content: '❌ You cannot give coins to a bot.', ephemeral: true });
		}

		const economy = loadEconomy();
		const senderCoins = economy[userId]?.coins ?? 0;

		if (senderCoins < amount) {
			return interaction.reply({
				content: `❌ You only have **${senderCoins}** coins. Not enough to give **${amount}**.`,
				ephemeral: true
			});
		}

		// Confirmation embed
		const confirmEmbed = new EmbedBuilder()
			.setTitle('💸 Confirm Transfer')
			.setDescription(`Are you sure you want to give **${amount}** 🪙 coins to **${target.username}**?`)
			.addFields(
				{ name: '👤 From', value: interaction.user.username, inline: true },
				{ name: '👤 To', value: target.username, inline: true },
				{ name: '💰 Amount', value: `${amount} coins`, inline: true }
			)
			.setColor('#FFD700')
			.setFooter({ text: 'This expires in 30 seconds.' })
			.setTimestamp();

		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setCustomId('give_confirm')
				.setLabel('✅ Confirm')
				.setStyle(ButtonStyle.Success),
			new ButtonBuilder()
				.setCustomId('give_cancel')
				.setLabel('❌ Cancel')
				.setStyle(ButtonStyle.Danger)
		);

		const reply = await interaction.reply({
			embeds: [confirmEmbed],
			components: [row],
			fetchReply: true
		});

		const collector = reply.createMessageComponentCollector({
			filter: i => i.user.id === userId,
			time: 30000,
			max: 1
		});

		collector.on('collect', async i => {
			if (i.customId === 'give_confirm') {
				const econ = loadEconomy();
				const senderNow = econ[userId]?.coins ?? 0;

				if (senderNow < amount) {
					return i.update({
						embeds: [new EmbedBuilder().setDescription('❌ You no longer have enough coins.').setColor('#FF0000')],
						components: []
					});
				}

				if (!econ[userId]) econ[userId] = { coins: 0, lastDaily: 0 };
				if (!econ[target.id]) econ[target.id] = { coins: 0, lastDaily: 0 };

				econ[userId].coins = Math.max(0, econ[userId].coins - amount);
				econ[target.id].coins += amount;
				saveEconomy(econ);

				const successEmbed = new EmbedBuilder()
					.setTitle('✅ Transfer Complete')
					.setDescription(`**${interaction.user.username}** gave **${amount}** 🪙 coins to **${target.username}**!`)
					.addFields(
						{ name: '💳 Your Balance', value: `${econ[userId].coins} coins`, inline: true },
						{ name: '💳 Their Balance', value: `${econ[target.id].coins} coins`, inline: true }
					)
					.setColor('#00FF00')
					.setTimestamp();

				await i.update({ embeds: [successEmbed], components: [] });
			} else {
				await i.update({
					embeds: [new EmbedBuilder().setDescription('❌ Transfer cancelled.').setColor('#FF0000')],
					components: []
				});
			}
		});

		collector.on('end', (collected) => {
			if (collected.size === 0) {
				reply.edit({
					embeds: [new EmbedBuilder().setDescription('⏰ Transfer timed out.').setColor('#888888')],
					components: []
				}).catch(() => null);
			}
		});
	}
};
