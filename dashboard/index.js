const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('node:path');
const fs   = require('node:fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app    = express();
const server = createServer(app);
const io     = new Server(server);

const PORT = process.env.DASHBOARD_PORT || 3000;

// Data paths
const DATA = path.join(__dirname, '../data');
const files = {
	economy : path.join(DATA, 'economy.json'),
	xp      : path.join(DATA, 'xp.json'),
	tickets : path.join(DATA, 'tickets.json'),
	warnings: path.join(DATA, 'warnings.json'),
	shop    : path.join(DATA, 'shop.json'),
	reputation: path.join(DATA, 'reputation.json')
};

function readJSON(filePath) {
	try {
		if (!fs.existsSync(filePath)) return {};
		return JSON.parse(fs.readFileSync(filePath, 'utf8'));
	} catch {
		return {};
	}
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Dashboard home
app.get('/', (req, res) => {
	const economy  = readJSON(files.economy);
	const xp       = readJSON(files.xp);
	const tickets  = readJSON(files.tickets);
	const warnings = readJSON(files.warnings);

	const topEconomy = Object.entries(economy)
		.sort(([, a], [, b]) => b.coins - a.coins)
		.slice(0, 5)
		.map(([id, d]) => ({ id, coins: d.coins }));

	const topXp = Object.entries(xp)
		.sort(([, a], [, b]) => b.level - a.level || b.xp - a.xp)
		.slice(0, 5)
		.map(([id, d]) => ({ id, level: d.level, xp: d.xp }));

	const openTickets   = Object.values(tickets).filter(t => t.status === 'open').length;
	const closedTickets = Object.values(tickets).filter(t => t.status === 'closed').length;
	const totalUsers    = Object.keys(economy).length;
	const totalWarnings = Object.keys(warnings).length;

	res.render('dashboard', {
		topEconomy, topXp,
		openTickets, closedTickets,
		totalUsers, totalWarnings
	});
});

// JSON API endpoints
app.get('/api/economy', (req, res) => res.json(readJSON(files.economy)));
app.get('/api/xp',      (req, res) => res.json(readJSON(files.xp)));
app.get('/api/tickets', (req, res) => res.json(readJSON(files.tickets)));
app.get('/api/shop',    (req, res) => res.json(readJSON(files.shop)));

// Socket.io live updates
io.on('connection', (socket) => {
	console.log('[Dashboard] Client connected');

	const interval = setInterval(() => {
		const economy = readJSON(files.economy);
		const xp      = readJSON(files.xp);
		const tickets = readJSON(files.tickets);

		socket.emit('update', {
			totalUsers: Object.keys(economy).length,
			topCoins: Math.max(...Object.values(economy).map(d => d.coins || 0), 0),
			openTickets: Object.values(tickets).filter(t => t.status === 'open').length,
			topLevel: Math.max(...Object.values(xp).map(d => d.level || 1), 1)
		});
	}, 5000);

	socket.on('disconnect', () => {
		clearInterval(interval);
		console.log('[Dashboard] Client disconnected');
	});
});

server.listen(PORT, () => {
	console.log(`📊 Dashboard running at http://localhost:${PORT}`);
});

module.exports = { app, server, io };
