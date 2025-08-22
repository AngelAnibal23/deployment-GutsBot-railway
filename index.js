const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('🤖 Bot conectado y listo');
});

client.on('message', msg => {
    console.log('📌 Tu ID es:', msg.author || msg.from);
});

const manualAdmins = [
    '102370629443806@lid',   // Ángel
    '198036949057568@lid',    // Jhonel
    '102370629443806@lid'       //borracho 
];

client.on('message', async msg => {
    if (msg.body.startsWith('!everyone')) {
        const chat = await msg.getChat();

        if (!chat.isGroup) {
            msg.reply('❌ Este comando solo se puede usar en grupos.');
            return;
        }

        const authorId = msg.author || msg.from;
        const sender = chat.participants.find(p => p.id._serialized === authorId);
        const isAdmin = manualAdmins.includes(authorId) || (sender && (sender.isAdmin || sender.isSuperAdmin));

        if (!isAdmin) {
            msg.reply('🚫 Solo los administradores pueden usar el comando !everyone.');
            return;
        }

        const command = msg.body.split(' ');
        const customMessage = command.slice(1).join(' ') || '🔔 ¡Atención a todos!';

        const mentions = [];
        let text = `${customMessage}\n`;

        for (let participant of chat.participants) {
            const contact = await client.getContactById(participant.id._serialized);
            mentions.push(contact);
            text += `@${contact.number} `;
        }

        await chat.sendMessage(text, { mentions });
    }
});

client.initialize();

// Evita que Railway cierre el proceso
process.stdin.resume();