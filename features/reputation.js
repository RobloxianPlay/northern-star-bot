const fs   = require('node:fs');
const path = require('node:path');

const repPath = path.join(__dirname, '../data/reputation.json');

function loadRep() {
	try {
		if (!fs.existsSync(repPath)) fs.writeFileSync(repPath, JSON.stringify({}));
		return JSON.parse(fs.readFileSync(repPath, 'utf8'));
	} catch { return {}; }
}

function saveRep(data) {
	try {
		fs.writeFileSync(repPath, JSON.stringify(data, null, 2));
	} catch {}
}

// Expose helpers for the /rep command
module.exports = (client) => {
	// No event listeners needed — logic handled via /rep command
};

module.exports.loadRep  = loadRep;
module.exports.saveRep  = saveRep;
