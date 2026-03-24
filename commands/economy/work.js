const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
        data: new SlashCommandBuilder()
                .setName('work')
                .setDescription('Work to earn some coins'),
        async execute(interaction) {
                const userId = interaction.user.id;
                const economyPath = path.join(__dirname, '../../data/economy.json');
                let economy = JSON.parse(fs.readFileSync(economyPath, 'utf8'));

                if (!economy[userId]) {
                        economy[userId] = { coins: 0, lastDaily: 0 };
                }

                let amount = Math.floor(Math.random() * 200) + 50;
                const jobs = ['Pizza Delivery', 'Developer', 'Designer', 'Chef', 'Streamer', 'Farmer'];
                const job = jobs[Math.floor(Math.random() * jobs.length)];

                // Pet Bonus
                const petsPath = path.join(__dirname, '../../data/pets.json');
                if (fs.existsSync(petsPath)) {
                        const petsData = JSON.parse(fs.readFileSync(petsPath, 'utf8'));
                        const userPet = petsData[userId];
                        if (userPet) {
                                const bonuses = { dog: 0.1, cat: 0.15, dragon: 0.5 };
                                const bonus = bonuses[userPet.pet] || 0;
                                amount = Math.floor(amount * (1 + bonus));
                        }
                }

                economy[userId].coins += amount;
                fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));

                const embed = new EmbedBuilder()
                        .setTitle('💼 Work')
                        .setDescription(`You worked as a **${job}** and earned **${amount}** coins!`)
                        .setColor('#3498db')
                        .setTimestamp();

                await interaction.reply({ embeds: [embed] });
        },
};
