const { Events, EmbedBuilder } = require('discord.js');
const fs   = require('node:fs');
const path = require('node:path');

const invitesPath = path.join(__dirname, '../data/invites.json');
const economyPath = path.join(__dirname, '../data/economy.json');
const petsPath    = path.join(__dirname, '../data/pets.json');

function load(p, def = {}) {
	if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(def));
	return JSON.parse(fs.readFileSync(p, 'utf8'));
}

const inviteMilestones = [
	{ count: 1,   coins: 100,  xp: 50,  pet: null,    label: '1 Invite'  },
	{ count: 5,   coins: 500,  xp: 200, pet: null,    label: '5 Invites' },
	{ count: 10,  coins: 1000, xp: 400, pet: 'Cat',   label: '10 Invites' },
	{ count: 25,  coins: 2500, xp: 800, pet: null,    label: '25 Invites' },
	{ count: 50,  coins: 5000, xp: 1500, pet: 'Wolf', label: '50 Invites' },
	{ count: 100, coins: 10000, xp: 3000, pet: 'Dragon', label: '100 Invites' },
];

module.exports = (client) => {
	let cachedInvites = new Map();

	client.once(Events.ClientReady, async () => {
		for (const guild of client.guilds.cache.values()) {
			try {
				const invites = await guild.invites.fetch();
				cachedInvites.set(guild.id, new Map(invites.map(i => [i.code, i.uses])));
			} catch {}
		}
	});

	client.on(Events.GuildMemberAdd, async (member) => {
		if (member.user.bot) return;
		const guild = member.guild;

		try {
			const newInvites  = await guild.invites.fetch();
			const oldInvites  = cachedInvites.get(guild.id) || new Map();
			const usedInvite  = newInvites.find(i => (oldInvites.get(i.code) || 0) < i.uses);
			cachedInvites.set(guild.id, new Map(newInvites.map(i => [i.code, i.uses])));

			if (!usedInvite?.inviter) return;
			const inviterId = usedInvite.inviter.id;

			const invData = load(invitesPath);
			if (!invData[inviterId]) invData[inviterId] = { total: 0, rewarded: [] };
			invData[inviterId].total += 1;
			fs.writeFileSync(invitesPath, JSON.stringify(invData, null, 2));

			const total    = invData[inviterId].total;
			const rewarded = invData[inviterId].rewarded;
			const milestone = inviteMilestones.find(m => m.count === total && !rewarded.includes(m.count));

			if (milestone) {
				invData[inviterId].rewarded.push(milestone.count);
				fs.writeFileSync(invitesPath, JSON.stringify(invData, null, 2));

				const economy = load(economyPath);
				if (!economy[inviterId]) economy[inviterId] = { coins: 0 };
				economy[inviterId].coins += milestone.coins;
				fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));

				if (milestone.pet) {
					const pets = load(petsPath);
					if (!pets[inviterId]) {
						pets[inviterId] = { name: milestone.pet, emoji: '🐾', rarity: 'Rare', xpBoost: 0.1, coinBoost: 0.1, level: 1, xp: 0 };
						fs.writeFileSync(petsPath, JSON.stringify(pets, null, 2));
					}
				}

				try {
					const inviter = await guild.members.fetch(inviterId);
					const channel = guild.channels.cache.find(c => c.isTextBased());
					if (channel) {
						const embed = new EmbedBuilder()
							.setTitle('🎉 Invite Milestone Reached!')
							.setDescription(`${inviter} reached **${milestone.label}** and earned rewards!`)
							.addFields(
								{ name: '💰 Coins', value: `+${milestone.coins}`, inline: true },
								{ name: '📨 Total Invites', value: `${total}`, inline: true },
								{ name: '🐾 Pet Reward', value: milestone.pet || 'None', inline: true }
							)
							.setColor('#FFD700')
							.setTimestamp();
						channel.send({ embeds: [embed] });
					}
				} catch {}
			}
		} catch (err) {
			console.error('[InviteRewards]', err.message);
		}
	});
};
