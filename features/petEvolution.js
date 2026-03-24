const { EmbedBuilder } = require('discord.js');
const fs   = require('node:fs');
const path = require('node:path');

const petsPath = path.join(__dirname, '../data/pets.json');

// Evolution chains: baseName → [{ minLevel, name, emoji, xpBoostAdd, coinBoostAdd }]
const evolutionChains = {
	'Dragon':    [
		{ minLevel: 1,  name: 'Dragon',       emoji: '🐉', xpBoostAdd: 0,    coinBoostAdd: 0    },
		{ minLevel: 20, name: 'Fire Dragon',   emoji: '🔥', xpBoostAdd: 0.10, coinBoostAdd: 0.08 },
		{ minLevel: 50, name: 'Mythic Dragon', emoji: '⚡', xpBoostAdd: 0.20, coinBoostAdd: 0.15 },
	],
	'Phoenix':   [
		{ minLevel: 1,  name: 'Phoenix',       emoji: '🦅', xpBoostAdd: 0,    coinBoostAdd: 0    },
		{ minLevel: 20, name: 'Flame Phoenix',  emoji: '🌟', xpBoostAdd: 0.10, coinBoostAdd: 0.08 },
		{ minLevel: 50, name: 'Eternal Phoenix',emoji: '☀️', xpBoostAdd: 0.18, coinBoostAdd: 0.14 },
	],
	'Wolf':      [
		{ minLevel: 1,  name: 'Wolf',          emoji: '🐺', xpBoostAdd: 0,    coinBoostAdd: 0    },
		{ minLevel: 15, name: 'Shadow Wolf',   emoji: '🌑', xpBoostAdd: 0.08, coinBoostAdd: 0.06 },
		{ minLevel: 40, name: 'Dire Wolf',     emoji: '💀', xpBoostAdd: 0.15, coinBoostAdd: 0.12 },
	],
	'Cat':       [
		{ minLevel: 1,  name: 'Cat',           emoji: '🐱', xpBoostAdd: 0,    coinBoostAdd: 0    },
		{ minLevel: 10, name: 'Mystic Cat',    emoji: '🔮', xpBoostAdd: 0.06, coinBoostAdd: 0.04 },
		{ minLevel: 30, name: 'Celestial Cat', emoji: '🌙', xpBoostAdd: 0.12, coinBoostAdd: 0.10 },
	],
	'Fox':       [
		{ minLevel: 1,  name: 'Fox',           emoji: '🦊', xpBoostAdd: 0,    coinBoostAdd: 0    },
		{ minLevel: 12, name: 'Spirit Fox',    emoji: '🎋', xpBoostAdd: 0.07, coinBoostAdd: 0.05 },
		{ minLevel: 35, name: 'Void Fox',      emoji: '🌌', xpBoostAdd: 0.14, coinBoostAdd: 0.11 },
	],
};

function load(p, def = {}) {
	if (!fs.existsSync(p)) fs.writeFileSync(p, JSON.stringify(def));
	try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return def; }
}

function getBaseName(petName) {
	for (const base of Object.keys(evolutionChains)) {
		if (evolutionChains[base].some(e => e.name === petName)) return base;
	}
	return petName;
}

function checkEvolution(userId, pet) {
	const baseName = getBaseName(pet.name);
	const chain    = evolutionChains[baseName];
	if (!chain) return null;

	const currentStage = [...chain].reverse().find(e => e.name === pet.name);
	const nextStage    = chain.find(e => e.minLevel > (pet.level || 1) && e.minLevel <= (pet.level || 1));

	// Find what stage we should be at given current level
	const targetStage = [...chain].reverse().find(e => (pet.level || 1) >= e.minLevel);
	if (!targetStage || targetStage.name === pet.name) return null;

	return { targetStage, baseName };
}

// Award pet XP and check for level up / evolution
function awardPetXp(userId, amount, sendEvolutionCallback) {
	const pets = load(petsPath);
	const pet  = pets[userId];
	if (!pet) return;

	pet.xp    = (pet.xp    || 0) + amount;
	pet.level = (pet.level || 1);

	const xpNeeded = pet.level * 50;
	if (pet.xp >= xpNeeded) {
		pet.xp -= xpNeeded;
		pet.level += 1;

		// Check evolution
		const result = checkEvolution(userId, pet);
		if (result) {
			const prev = pet.name;
			const stage = result.targetStage;
			pet.name      = stage.name;
			pet.emoji     = stage.emoji;
			pet.xpBoost   = (pet.xpBoost   || 0.05) + stage.xpBoostAdd;
			pet.coinBoost = (pet.coinBoost || 0.05) + stage.coinBoostAdd;
			pet.evolvedAt = new Date().toISOString();

			if (sendEvolutionCallback) {
				sendEvolutionCallback({ prev, next: stage.name, emoji: stage.emoji, level: pet.level, userId });
			}
		}
	}

	pets[userId] = pet;
	fs.writeFileSync(petsPath, JSON.stringify(pets, null, 2));
}

module.exports = (client) => {
	module.exports.awardPetXp = awardPetXp;

	function sendEvolution({ prev, next, emoji, level, userId, guild }) {
		const guild_ = guild || client.guilds.cache.first();
		if (!guild_) return;
		const channel = guild_.channels.cache.find(c => c.isTextBased());
		if (!channel) return;

		const embed = new EmbedBuilder()
			.setTitle(`🌟 PET EVOLVED!`)
			.setDescription(`<@${userId}>'s **${prev}** evolved into **${emoji} ${next}**!\n\n> Level ${level} reached — stats have been boosted!`)
			.setColor('#FFD700')
			.setTimestamp();

		channel.send({ embeds: [embed] }).catch(() => null);
	}

	// Hook into XP events by periodically checking pet XP can be awarded
	// Pets gain XP from messages (via xpHandler integration)
	client.on('petXpAward', ({ userId, amount, guild }) => {
		awardPetXp(userId, amount, (data) => sendEvolution({ ...data, guild }));
	});
};

module.exports.awardPetXp = awardPetXp;
module.exports.getBaseName = getBaseName;
