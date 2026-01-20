require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const multer = require('multer');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

client.login(process.env.BOT_TOKEN);

const auditLogs = [];

function addLog(userId, guildId, action) {
    const log = {
        timestamp: new Date().toISOString(),
        userId: userId,
        guildId: guildId,
        action: action
    };
    auditLogs.unshift(log);
    if (auditLogs.length > 50) auditLogs.pop();
}

const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute window
    max: 50, // Limit each IP to 50 requests per minute (Was 5)
    message: { error: "⛔ Rate limit exceeded. Please wait a moment." },
    standardHeaders: true,
    legacyHeaders: false,
});

const app = express();
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } });

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 }
}));

app.use('/api/', apiLimiter);

app.get('/api/login', (req, res) => {
    const url = `https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&response_type=code&scope=identify`;
    res.redirect(url);
});

app.get('/api/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.send('No code provided');

    try {
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: process.env.REDIRECT_URI
        }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });

        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` }
        });

        req.session.user = userResponse.data;
        res.redirect('/');

    } catch (error) {
        console.error('OAuth Error:', error);
        res.send('Login Failed');
    }
});

app.get('/api/user', (req, res) => {
    if (!req.session.user) return res.json({ user: null });
    const userLogs = auditLogs.filter(log => log.userId === req.session.user.id).slice(0, 3);
    res.json({ user: req.session.user, logs: userLogs });
});

// --- 5. SECURE UPDATE ---
app.post('/api/update-profile', upload.single('avatar'), async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "Please log in first." });

    const { guildId, nickname } = req.body;
    const file = req.file;

    if (!guildId) return res.status(400).json({ error: "Guild ID is missing" });

    try {
        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) return res.status(404).json({ error: "Bot is not in this server." });

        if (guild.ownerId !== req.session.user.id) {
            return res.status(403).json({ error: "⛔ You are not the Owner of this server." });
        }

        const payload = {};
        const changes = [];

        if (nickname) {
            payload.nick = nickname;
            changes.push("Nickname");
        }

        if (file) {
            const base64Image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
            payload.avatar = base64Image;
            changes.push("Avatar");
        }

        if (changes.length === 0) return res.status(400).json({ error: "No changes requested." });

        const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
        await rest.patch(Routes.guildMember(guildId, '@me'), { body: payload });

        addLog(req.session.user.id, guildId, `Changed: ${changes.join(' & ')}`);

        res.json({ success: true, guildName: guild.name });

    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(process.env.PORT, () => {
    console.log(`🌐 SaaS Dashboard running at http://localhost:${process.env.PORT}`);
});