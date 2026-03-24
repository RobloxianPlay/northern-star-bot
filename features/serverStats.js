const { Events, ChannelType } = require('discord.js');

module.exports = (client) => {
	const categoryId = process.env.STATS_CATEGORY_ID;

	async function updateStats(guild) {
		if (!categoryId) return;

		const category = guild.channels.cache.get(categoryId);
		if (!category || category.type !== ChannelType.GuildCategory) {
			console.error('[ServerStats] Invalid category ID');
			return;
		}

		const memberCount = guild.memberCount;
		const botCount = guild.members.cache.filter(m => m.user.bot).size;
		const boostCount = guild.premiumSubscriptionCount || 0;

		const statChannels = {
			members: { name: `Members: ${memberCount}`, emoji: '👥' },
			bots: { name: `Bots: ${botCount}`, emoji: '🤖' },
			boosts: { name: `Boosts: ${boostCount}`, emoji: '💎' }
		};

		for (const [key, stat] of Object.entries(statChannels)) {
			try {
				let channel = guild.channels.cache.find(
					c => c.parent.id === categoryId && c.name.startsWith(stat.emoji)
				);

				if (!channel) {
					channel = await guild.channels.create({
						name: stat.name,
						type: ChannelType.GuildVoice,
						parent: categoryId,
						permissionOverwrites: [
							{
								id: guild.id,
								deny: ['Connect']
							}
						]
					});
					console.log(`[ServerStats] Created channel: ${stat.name}`);
				} else if (channel.name !== stat.name) {
					await channel.setName(stat.name);
					console.log(`[ServerStats] Updated channel: ${stat.name}`);
				}
			} catch (error) {
				console.error(`[ServerStats] Error managing ${key} channel:`, error);
			}
		}
	}

	// Update on member join
	client.on(Events.GuildMemberAdd, (member) => {
		updateStats(member.guild);
	});

	// Update on member leave
	client.on(Events.GuildMemberRemove, (member) => {
		updateStats(member.guild);
	});

	// Update on boost change
	client.on(Events.GuildUpdate, (oldGuild, newGuild) => {
		if (oldGuild.premiumSubscriptionCount !== newGuild.premiumSubscriptionCount) {
			updateStats(newGuild);
		}
	});

	// Initial setup when bot starts
	client.on(Events.ClientReady, () => {
		client.guilds.cache.forEach(guild => {
			updateStats(guild);
		});
	});
};
