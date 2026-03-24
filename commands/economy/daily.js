const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
        data: new SlashCommandBuilder()
                .setName('daily')
                .setDescription('Claim your daily reward'),
        async execute(interaction) {
                const userId = interaction.user.id;
                const economyPath = path.join(__dirname, '../../data/economy.json');
                let economy = JSON.parse(fs.readFileSync(economyPath, 'utf8'));

                if (!economy[userId]) {
                        economy[userId] = { coins: 0, lastDaily: 0 };
                }

                const now = Date.now();
                const cooldown = 24 * 60 * 60 * 1000;
                const lastDaily = economy[userId].lastDaily || 0;

                if (now - lastDaily < cooldown) {
                        const remaining = cooldown - (now - lastDaily);
                        const hours = Math.floor(remaining / (60 * 60 * 1000));
                        const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
                        return interaction.reply({ content: `You already claimed your daily reward! Try again in **${hours}h ${minutes}m**.`, ephemeral: true });
                }

                let reward = 500;

                // Pet Bonus
                const petsPath = path.join(__dirname, '../../data/pets.json');
                if (fs.existsSync(petsPath)) {
                        const petsData = JSON.parse(fs.readFileSync(petsPath, 'utf8'));
                        const userPet = petsData[userId];
                        if (userPet) {
                                const bonuses = { dog: 0.1, cat: 0.15, dragon: 0.5 };
                                const bonus = bonuses[userPet.pet] || 0;
                                reward = Math.floor(reward * (1 + bonus));
                        }
                }

                economy[userId].coins += reward;
                economy[userId].lastDaily = now;
                fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));

                const embed = new EmbedBuilder()
                        .setTitle('🎁 Daily Reward')
                        .setDescription(`You claimed your daily reward of **${reward}** coins!`)
                        .setColor('#00FF00')
                        .setTimestamp();

                await interaction.reply({ embeds: [embed] });
        },
};
