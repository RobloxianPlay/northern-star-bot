const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const CAT_IMAGES = [
	'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/1200px-Cat03.jpg',
	'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Cat_November_2010-1a.jpg/1200px-Cat_November_2010-1a.jpg',
	'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Kittyply_edit1.jpg/1200px-Kittyply_edit1.jpg',
	'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Orange_tabby_cat_sitting_on_fallen_leaves-Hisashi-01A.jpg/1200px-Orange_tabby_cat_sitting_on_fallen_leaves-Hisashi-01A.jpg',
	'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Dog_Breeds.jpg/1024px-Dog_Breeds.jpg',
	'https://upload.wikimedia.org/wikipedia/commons/a/a7/Camponotus_flavomarginatus_ant.jpg'
];

const CAT_FACTS = [
	'Cats spend about 70% of their lives sleeping!',
	'A group of cats is called a "clowder".',
	'Cats have 32 muscles in each ear.',
	'A cat\'s nose print is unique, like a human fingerprint.',
	'Cats can jump up to 6 times their own height.',
	'Cats cannot taste sweet things — they lack the taste receptor for sweetness.',
	'A cat\'s purr vibrates at a frequency that can heal bones!',
	'Cats walk like camels and giraffes — both right feet, then both left feet.'
];

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('cat')
		.setDescription('Get a random cat picture and fun fact'),

	async execute(interaction) {
		const img = CAT_IMAGES[Math.floor(Math.random() * CAT_IMAGES.length)];
		const fact = CAT_FACTS[Math.floor(Math.random() * CAT_FACTS.length)];

		const embed = new EmbedBuilder()
			.setTitle('🐱 Random Cat!')
			.setDescription(`**Fun Fact:** ${fact}`)
			.setImage(img)
			.setColor('#FF69B4')
			.setFooter({ text: 'Meow!' })
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	}
};
