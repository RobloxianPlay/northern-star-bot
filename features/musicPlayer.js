const { Player } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');

module.exports = async (client) => {
        const player = new Player(client, {
                skipFFmpeg: false
        });

        await player.extractors.loadMulti(DefaultExtractors);

        player.events.on('playerStart', (queue, track) => {
                const channel = queue.metadata?.channel;
                if (!channel) return;
                channel.send(`🎵 Now playing **${track.title}** by **${track.author}**`).catch(() => null);
        });

        player.events.on('audioTrackAdd', (queue, track) => {
                const channel = queue.metadata?.channel;
                if (!channel) return;
                channel.send(`✅ **${track.title}** has been added to the queue.`).catch(() => null);
        });

        player.events.on('emptyQueue', (queue) => {
                const channel = queue.metadata?.channel;
                if (!channel) return;
                channel.send('✅ Queue finished! No more songs to play.').catch(() => null);
        });

        player.events.on('disconnect', (queue) => {
                const channel = queue.metadata?.channel;
                if (!channel) return;
                channel.send('🔌 Disconnected from voice channel.').catch(() => null);
        });

        player.events.on('error', (queue, error) => {
                console.error(`[Music] Player error: ${error.message}`);
                const channel = queue.metadata?.channel;
                if (!channel) return;
                channel.send(`❌ Player error: ${error.message}`).catch(() => null);
        });

        console.log('[Music] Player initialized with extractors loaded.');
        return player;
};
