const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs   = require('node:fs');
const path = require('node:path');

const repPath = path.join(__dirname, '../../data/reputation.json');
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

function loadRep() {
	try {
		if (!fs.existsSync(repPath)) fs.writeFileSync(repPath, JSON.stringify({}));
		return JSON.parse(fs.readFileSync(repPath, 'utf8'));
	} catch { return {}; }
}

function saveRep(data) {
	try {
		fs.writeFileSync(repPath, JSON.stringify(data, null, 2));
	} catch {}
}

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('rep')
		.setDescription('Give or view reputation')
		.addSubcommand(sub =>
			sub.setName('give')
				.setDescription('Give reputation to a user')
				.addUserOption(o => o.setName('user').setDescription('User to give rep to').setRequired(true))
		)
		.addSubcommand(sub =>
			sub.setName('view')
				.setDescription('View a user\'s reputation')
				.addUserOption(o => o.setName('user').setDescription('User to check').setRequired(false))
		),

	async execute(interaction) {
		const sub = interaction.options.getSubcommand();
		const rep = loadRep();

		if (sub === 'give') {
			const target = interaction.options.getUser('user');
			const giverId = interaction.user.id;

			if (target.id === giverId) {
				return interaction.reply({ content: '❌ You cannot give rep to yourself!', ephemeral: true });
			}
			if (target.bot) {
				return interaction.reply({ content: '❌ You cannot give rep to a bot.', ephemeral: true });
			}

			if (!rep[giverId]) rep[giverId] = { rep: 0, lastGiven: 0, givenTo: {} };

			const lastGiven = rep[giverId].givenTo?.[target.id] ?? 0;
			const remaining = COOLDOWN_MS - (Date.now() - lastGiven);

			if (remaining > 0) {
				const hours = Math.floor(remaining / 3600000);
				const mins  = Math.floor((remaining % 3600000) / 60000);
				return interaction.reply({
					content: `⏳ You can give rep to **${target.username}** again in **${hours}h ${mins}m**.`,
					ephemeral: true
				});
			}

			if (!rep[target.id]) rep[target.id] = { rep: 0, lastGiven: 0, givenTo: {} };

			rep[target.id].rep = (rep[target.id].rep || 0) + 1;
			if (!rep[giverId].givenTo) rep[giverId].givenTo = {};
			rep[giverId].givenTo[target.id] = Date.now();
			saveRep(rep);

			const embed = new EmbedBuilder()
				.setTitle('⭐ Reputation Given!')
				.setDescription(`**${interaction.user.username}** gave +1 rep to **${target.username}**!`)
				.addFields({ name: '⭐ Their Rep', value: `${rep[target.id].rep}`, inline: true })
				.setColor('#FFD700')
				.setTimestamp();

			await interaction.reply({ embeds: [embed] });

		} else if (sub === 'view') {
			const target = interaction.options.getUser('user') || interaction.user;
			const data = rep[target.id];
			const points = data?.rep ?? 0;

			const embed = new EmbedBuilder()
				.setTitle(`⭐ ${target.username}'s Reputation`)
				.setDescription(`**${target.username}** has **${points}** reputation point${points !== 1 ? 's' : ''}.`)
				.setThumbnail(target.displayAvatarURL({ dynamic: true }))
				.setColor('#FFD700')
				.setTimestamp();

			await interaction.reply({ embeds: [embed] });
		}
	}
};
