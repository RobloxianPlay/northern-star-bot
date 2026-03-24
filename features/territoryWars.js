const { EmbedBuilder, ChannelType } = require('discord.js');
const fs   = require('node:fs');
const path = require('node:path');

const territoriesPath = path.join(__dirname, '../data/territories.json');
const guildsPath      = path.join(__dirname, '../data/guilds.json');
const economyPath     = path.join(__dirname, '../data/economy.json');

function loadTerritories() {
	if (!fs.existsSync(territoriesPath)) fs.writeFileSync(territoriesPath, JSON.stringify({}));
	return JSON.parse(fs.readFileSync(territoriesPath, 'utf8'));
}

function loadGuilds() {
	if (!fs.existsSync(guildsPath)) return {};
	return JSON.parse(fs.readFileSync(guildsPath, 'utf8'));
}

module.exports = (client) => {
	// Every 30 minutes, pick a random channel as a contestable zone
	setInterval(async () => {
		const territories = loadTerritories();
		const allGuilds   = loadGuilds();
		if (Object.keys(allGuilds).length < 2) return;

		client.guilds.cache.forEach(async (discordGuild) => {
			const channel = discordGuild.channels.cache.find(c =>
				c.isTextBased() && c.type === ChannelType.GuildText
			);
			if (!channel) return;

			const zoneId    = channel.id;
			const zoneName  = channel.name;
			const territory = territories[zoneId];

			if (territory) {
				// Give coins to members of the owning guild
				const ownerGuild = Object.values(allGuilds).find(g => g.id === territory.guildId);
				if (ownerGuild) {
					const economy = fs.existsSync(economyPath) ? JSON.parse(fs.readFileSync(economyPath, 'utf8')) : {};
					ownerGuild.members.forEach(uid => {
						if (!economy[uid]) economy[uid] = { coins: 0 };
						economy[uid].coins += 25;
					});
					fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));
				}
			}

			const embed = new EmbedBuilder()
				.setTitle('🏴 Territory War Event!')
				.setDescription(
					`The zone **#${zoneName}** is up for contest!\n\n` +
					`Use \`/territory attack #${zoneName}\` to claim it for your guild!\n\n` +
					`${territory ? `Current owner: **${territory.guildName}**` : 'This zone is unclaimed — first attack wins!'}`
				)
				.setColor('#FF0000')
				.setFooter({ text: 'Territory owners earn +25 coins every 30 minutes!' })
				.setTimestamp();

			channel.send({ embeds: [embed] }).catch(() => null);
		});
	}, 1800000);
};
