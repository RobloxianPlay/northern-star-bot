const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs   = require('node:fs');
const path = require('node:path');

const territoriesPath = path.join(__dirname, '../../data/territories.json');
const guildsPath      = path.join(__dirname, '../../data/guilds.json');

function load(p) {
	if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify({}));
	return JSON.parse(fs.readFileSync(p, 'utf8'));
}

const attackCooldowns = new Map();

module.exports = {
	data: new SlashCommandBuilder()
		.setName('territory')
		.setDescription('Territory Wars — fight for server zones')
		.addSubcommand(sub => sub.setName('status').setDescription('View all claimed territories'))
		.addSubcommand(sub =>
			sub.setName('attack')
				.setDescription('Attack a zone for your guild')
				.addChannelOption(opt =>
					opt.setName('zone').setDescription('Channel to attack').setRequired(true))),

	async execute(interaction) {
		const sub    = interaction.options.getSubcommand();
		const userId = interaction.user.id;

		if (sub === 'status') {
			const territories = load(territoriesPath);
			const list = Object.values(territories);
			if (!list.length) {
				const embed = new EmbedBuilder().setTitle('🏴 Territory Wars').setDescription('No zones have been claimed yet!\n\nUse `/territory attack #channel` to claim a zone for your guild.').setColor('#FF0000').setTimestamp();
				return interaction.reply({ embeds: [embed] });
			}
			const lines = list.map(t => `<#${t.zoneId}> — **${t.guildName}** (since ${new Date(t.claimedAt).toLocaleDateString()})`).join('\n');
			const embed = new EmbedBuilder()
				.setTitle('🗺️ Territory Map')
				.setDescription(lines)
				.addFields({ name: '💰 Income', value: 'Territory owners earn +25 coins every 30 minutes' })
				.setColor('#FF6B00').setTimestamp();
			return interaction.reply({ embeds: [embed] });
		}

		if (sub === 'attack') {
			const zone  = interaction.options.getChannel('zone');
			const guilds = load(guildsPath);
			const userGuild = Object.values(guilds).find(g => g.members.includes(userId) || g.owner === userId);

			if (!userGuild) return interaction.reply({ content: '❌ You must be in a guild to attack territories. Use `/guild create`.', ephemeral: true });

			const lastAttack = attackCooldowns.get(`${userId}_${zone.id}`) || 0;
			const remaining  = 1800000 - (Date.now() - lastAttack);
			if (remaining > 0) {
				return interaction.reply({ content: `⏳ You attacked this zone recently. Wait **${Math.ceil(remaining / 60000)} min**.`, ephemeral: true });
			}

			const territories = load(territoriesPath);
			const current     = territories[zone.id];

			const success = Math.random() > 0.35;
			attackCooldowns.set(`${userId}_${zone.id}`, Date.now());

			if (success) {
				const previous = current?.guildName || 'Nobody';
				territories[zone.id] = {
					zoneId: zone.id,
					zoneName: zone.name,
					guildId: userGuild.id,
					guildName: userGuild.name,
					claimedAt: new Date().toISOString()
				};
				fs.writeFileSync(territoriesPath, JSON.stringify(territories, null, 2));

				const embed = new EmbedBuilder()
					.setTitle('🏴 Zone Captured!')
					.setDescription(`**${userGuild.name}** has captured **#${zone.name}**!\n\nPrevious owner: ${previous}\n\n💰 Your guild now earns +25 coins every 30 minutes from this zone.`)
					.setColor('#00FF00').setTimestamp();
				return interaction.reply({ embeds: [embed] });
			} else {
				const embed = new EmbedBuilder()
					.setTitle('❌ Attack Failed!')
					.setDescription(`**${userGuild.name}**'s attack on **#${zone.name}** was repelled!\n\n${current ? `**${current.guildName}** successfully defended their territory.` : 'The zone held its ground.'}`)
					.setColor('#FF0000').setTimestamp();
				return interaction.reply({ embeds: [embed] });
			}
		}
	}
};
