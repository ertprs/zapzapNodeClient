const qrcode = require('qrcode-terminal')
const { Client } = require('whatsapp-web.js')
const actions = require('./actions')
const ora = require('ora')
const spinner = ora()
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const ppt = { puppeteer: { headless: true, args: ['--no-sandbox'] } }
let newclient
// Whatsapp ==================================
// Start Client.
const StartClient = async () => {
    // Fetch existing client.
    const existingclient = await actions.fetchClient(process.env.NAME)
    const exists = existingclient.data[0] !== undefined
    // Verbose for positive.
    if (exists) {
        spinner.start('session exists, trying to authenticate...')
    } else {
        // Create new client.
        newclient = await actions.addClient(process.env.NAME)
    }

    return new Client(exists ? { ...ppt, session: existingclient.data[0].attributes.session } : { ...ppt })
}
// Start Client using session.
let client
// Setup client.
const SetupClient = async () => {
    client = await StartClient()
    // WhatsApp Client.
    client.on('qr', async qr => {
        const token = await actions.testToken()
        if (token && token.token_type) {
            console.log("HUE", newclient)
            actions.editClient(newclient.data.id, { qr: qr })
            qrcode.generate(qr, {
                small: true
            })
        } else {
            spinner.fail("Couldn't retrieve token, check API credentials.")
        }
    })
    // Auth.
    client.on('authenticated', async session => {
        spinner.succeed('Authenticated :)')
        actions.editClient(newclient.data.id, { session: session })
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