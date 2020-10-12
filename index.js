const qrcode = require('qrcode-terminal')
const { Client } = require('whatsapp-web.js')
const express = require('express')
const client = new Client()
const app = express()
const bodyParser = require('body-parser')
const port = 5000
const actions = require('./actions')
// WhatsApp Client.
client.on('qr', qr => {
    qrcode.generate(qr, {
        small: true
    });
});
// Ready.
client.on('ready', async () => {
    console.log('Client is ready!')
});
// Receive Message.
client.on('message', async msg => {
    const contact = await msg.getContact()
    actions.addMessage(msg, contact)

    // if (contact.number === '5521988759131') {
    //     console.log(msg.from)
    //     client.sendMessage(msg.from, 'taporrrraaa...');
    // }
});

// Express.
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}));

app.post('/api/sendmessage', async (req, res) => {
    const { number, message } = req.body.data
    client.sendMessage(`${number}@c.us`, message)

    return res.status(200).send()
})

// Init.
app.listen(port, () => {
    console.log(`server running on port ${port}`)
})
client.initialize()

