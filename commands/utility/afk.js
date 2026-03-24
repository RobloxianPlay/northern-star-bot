const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs   = require('node:fs');
const path = require('node:path');

const afkPath = path.join(__dirname, '../../data/afk.json');

function loadAfk() {
	try {
		if (!fs.existsSync(afkPath)) fs.writeFileSync(afkPath, JSON.stringify({}));
		return JSON.parse(fs.readFileSync(afkPath, 'utf8'));
	} catch { return {}; }
}

function saveAfk(data) {
	try {
		fs.writeFileSync(afkPath, JSON.stringify(data, null, 2));
	} catch {}
}

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('afk')
		.setDescription('Set your AFK status')
		.addStringOption(o =>
			o.setName('reason')
				.setDescription('Reason for going AFK')
				.setRequired(false)
		),

	async execute(interaction) {
		const reason = interaction.options.getString('reason') || 'No reason given';
		const userId = interaction.user.id;
		const afk = loadAfk();

		if (afk[userId]) {
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setDescription('⚠️ You are already AFK. Send a message to remove your AFK status.')
						.setColor('#FFFF00')
				],
				ephemeral: true
			});
		}

		afk[userId] = { reason, since: Date.now() };
		saveAfk(afk);

		await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle('💤 AFK Set')
					.setDescription(`${interaction.user} is now AFK.\n\n**Reason:** ${reason}`)
					.setColor('#FFFF00')
					.setFooter({ text: 'Send a message to remove your AFK status.' })
					.setTimestamp()
			]
		});
	}
};
