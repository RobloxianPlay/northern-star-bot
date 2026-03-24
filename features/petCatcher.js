const { Events, EmbedBuilder, ChannelType } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const petsPath    = path.join(__dirname, '../data/pets.json');
const economyPath = path.join(__dirname, '../data/economy.json');
const xpPath      = path.join(__dirname, '../data/xp.json');

const wildPets = [
	{ name: 'Dragon',       emoji: '🐉', rarity: 'Legendary', xpBoost: 0.25, coinBoost: 0.20, chance: 2  },
	{ name: 'Phoenix',      emoji: '🦅', rarity: 'Legendary', xpBoost: 0.20, coinBoost: 0.15, chance: 3  },
	{ name: 'Wolf',         emoji: '🐺', rarity: 'Rare',      xpBoost: 0.10, coinBoost: 0.10, chance: 10 },
	{ name: 'Fox',          emoji: '🦊', rarity: 'Rare',      xpBoost: 0.08, coinBoost: 0.08, chance: 12 },
	{ name: 'Cat',          emoji: '🐱', rarity: 'Common',    xpBoost: 0.05, coinBoost: 0.05, chance: 25 },
	{ name: 'Dog',          emoji: '🐶', rarity: 'Common',    xpBoost: 0.04, coinBoost: 0.04, chance: 25 },
	{ name: 'Rabbit',       emoji: '🐰', rarity: 'Common',    xpBoost: 0.03, coinBoost: 0.03, chance: 23 },
];

function pickPet() {
	const roll = Math.random() * 100;
	let acc = 0;
	for (const p of wildPets) {
		acc += p.chance;
		if (roll < acc) return p;
	}
	return wildPets[wildPets.length - 1];
}

const rarityColors = { Legendary: '#FFD700', Rare: '#9B59B6', Common: '#2ECC71' };

module.exports = (client) => {
	let activePet = null; // { pet, channelId, spawnTime }

	async function spawnPet(channel) {
		if (activePet) return;
		const pet = pickPet();
		activePet = { pet, channelId: channel.id, spawnTime: Date.now() };

		const embed = new EmbedBuilder()
			.setTitle(`${pet.emoji} A Wild ${pet.name} Appeared!`)
			.setDescription(`A **${pet.rarity}** ${pet.name} has appeared!\n\nType **\`catch\`** in chat to catch it!`)
			.addFields(
				{ name: '⭐ Rarity',    value: pet.rarity,              inline: true },
				{ name: '✨ XP Boost',  value: `+${pet.xpBoost * 100}%`,  inline: true },
				{ name: '💰 Coin Boost', value: `+${pet.coinBoost * 100}%`, inline: true }
			)
			.setColor(rarityColors[pet.rarity] || '#FFFFFF')
			.setFooter({ text: 'Type "catch" to catch this pet! • Disappears in 60 seconds' })
			.setTimestamp();

		await channel.send({ embeds: [embed] });

		setTimeout(() => {
			if (activePet?.spawnTime === activePet?.spawnTime) {
				activePet = null;
				channel.send(`😢 The **${pet.name}** got away! Be faster next time.`).catch(() => null);
			}
		}, 60000);
	}

	client.on(Events.MessageCreate, async (message) => {
		if (message.author.bot || !message.guild) return;

		if (activePet && message.channelId === activePet.channelId && message.content.toLowerCase() === 'catch') {
			const caught = activePet;
			activePet = null;

			const userId = message.author.id;
			const pets = fs.existsSync(petsPath) ? JSON.parse(fs.readFileSync(petsPath, 'utf8')) : {};

			if (pets[userId]) {
				return message.reply(`❌ You already have a **${pets[userId].name}**! Sell it first with \`/pets sell\`.`);
			}

			pets[userId] = {
				name: caught.pet.name,
				emoji: caught.pet.emoji,
				rarity: caught.pet.rarity,
				xpBoost: caught.pet.xpBoost,
				coinBoost: caught.pet.coinBoost,
				level: 1,
				xp: 0,
				caughtAt: new Date().toISOString()
			};
			fs.writeFileSync(petsPath, JSON.stringify(pets, null, 2));

			const economy = fs.existsSync(economyPath) ? JSON.parse(fs.readFileSync(economyPath, 'utf8')) : {};
			if (!economy[userId]) economy[userId] = { coins: 0 };
			economy[userId].coins += 100;
			fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));

			const embed = new EmbedBuilder()
				.setTitle(`${caught.pet.emoji} ${message.author.username} caught a ${caught.pet.name}!`)
				.setDescription(`🎉 You successfully caught a **${caught.pet.rarity} ${caught.pet.name}**!\n\n+100 bonus coins awarded!`)
				.addFields(
					{ name: '✨ XP Boost',   value: `+${caught.pet.xpBoost * 100}%`,   inline: true },
					{ name: '💰 Coin Boost', value: `+${caught.pet.coinBoost * 100}%`,  inline: true }
				)
				.setColor(rarityColors[caught.pet.rarity] || '#FFFFFF')
				.setTimestamp();

			await message.reply({ embeds: [embed] });
		}
	});

	// Spawn every 8 minutes with 15% chance
	setInterval(() => {
		client.guilds.cache.forEach(guild => {
			if (Math.random() > 0.15) return;
			const channel = guild.channels.cache.find(c =>
				c.isTextBased() && c.type === ChannelType.GuildText
			);
			if (channel) spawnPet(channel).catch(() => null);
		});
	}, 480000);
};
