const qrcode = require('qrcode-terminal')
const { Client } = require('whatsapp-web.js')
const fs = require('fs')
const actions = require('./actions')
const ora = require('ora')
const spinner = ora()
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
// Whatsapp ==================================
// Session file.
const SESSION_FILE_PATH = './session.json'
const ppt = { puppeteer: { headless: true, args: ['--no-sandbox'] } }
let sessionCfg;
if (fs.existsSync(SESSION_FILE_PATH)) {
    sessionCfg = require(SESSION_FILE_PATH);
}
// Start Client.
const StartClient = (session) => {
    if (sessionCfg !== undefined) {
        spinner.start('session exists, trying to authenticate...')
    }
    // Client.
    return new Client(session)
}
// Start Client using session.
let client = StartClient(sessionCfg === undefined ? { ...ppt } : { ...ppt, session: sessionCfg })
// Setup client.
const SetupClient = () => {
    // WhatsApp Client.
    client.on('qr', async qr => {
        const token = await actions.testToken()
        if (token && token.token_type) {
            qrcode.generate(qr, {
                small: true
            });
        } else {
            spinner.fail("Couldn't retrieve token, check API credentials.")
        }
    })
    // Auth.
    client.on('authenticated', async session => {
        spinner.succeed('Authenticated :)')
        fs.writeFileSync('./session.json', JSON.stringify(session))
    })
    // Auth Failure.
    client.on('auth_failure', async msg => {
        spinner.fail(msg)
        spinner.start("Starting New Client")
        client = new Client(...ppt)
        SetupClient()
    })
    // Disconnect.
    client.on('disconnected', async reason => {
        spinner.fail('disconnected ', reason)
    })
    // Ready.
    client.on('ready', async () => {

        spinner.succeed('Client is ready!')
    })
    // Receive Message.
    client.on('message', async msg => {
        const contact = await msg.getContact()
        actions.addMessage(msg, contact)

        // if (contact.number === '5521988759131') {
        //     console.log(msg.from)
        //     client.sendMessage(msg.from, 'taporrrraaa...');
        // }
    })
    // Initialize client.
    client.initialize()
}
// Starting setup.
SetupClient()
// Express ==================================
// Secret.
const { id, secret } = actions.fetchApiConfig().client
// Express.
const port = 5000
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
    extended: true
}));
// Send Message.
app.post('/api/sendmessage', async (req, res) => {
    const { id_, secret_ } = req.headers
    // Secret.
    const ok = id_ === id && secret_ === secret
    if (ok) {
        // Send Message.
        const { number, message } = req.body.data
        client.sendMessage(`${number}@c.us`, message)
    }

    return res.status(ok ? 200 : 403).send()
})

// Init.
app.listen(port)