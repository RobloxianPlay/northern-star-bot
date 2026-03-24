const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const DOG_IMAGES = [
	'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/YellowLabradorLooking_new.jpg/1200px-YellowLabradorLooking_new.jpg',
	'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Dog_Breeds.jpg/1024px-Dog_Breeds.jpg',
	'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Collage_of_Nine_Dogs.jpg/1200px-Collage_of_Nine_Dogs.jpg',
	'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Camponotus_flavomarginatus_ant.jpg/1200px-Camponotus_flavomarginatus_ant.jpg',
	'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Taka_Shiba.jpg/1200px-Taka_Shiba.jpg'
];

const DOG_FACTS = [
	'Dogs have an extraordinary sense of smell, 10,000–100,000 times more sensitive than humans.',
	'A dog\'s nose print is unique, just like a human fingerprint.',
	'Dogs can understand up to 250 words and gestures!',
	'Puppies are born blind, deaf, and without teeth.',
	'Dogs dream just like humans — they even twitch in their sleep.',
	'The Basenji dog breed cannot bark — it yodels instead!',
	'Dogs sweat through their paw pads.',
	'A dog\'s whiskers help it sense changes in airflow.'
];

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('dog')
		.setDescription('Get a random dog picture and fun fact'),

	async execute(interaction) {
		const img = DOG_IMAGES[Math.floor(Math.random() * DOG_IMAGES.length)];
		const fact = DOG_FACTS[Math.floor(Math.random() * DOG_FACTS.length)];

		const embed = new EmbedBuilder()
			.setTitle('🐶 Random Dog!')
			.setDescription(`**Fun Fact:** ${fact}`)
			.setImage(img)
			.setColor('#A0522D')
			.setFooter({ text: 'Woof!' })
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	}
};
