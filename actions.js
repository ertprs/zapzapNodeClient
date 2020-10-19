const api = require('./api')

async function addMessage(msg, contact) {
    console.log(msg)
    // Check if contact exists.
    let contactEntity = await fetchContact(contact.number).then(
        async res => {
            // New contact.
            if (res.data[0] === undefined) {
                const contactid = await addContact(contact, msg.to)
                return contactid.data.id
            } // Existing contact.
            else {
                return res.data[0].id
            }
        })

    // Add Message
    return await api.jsonapiClient('/jsonapi/whatsapp_message/whatsapp_message',
        {
            options: {
                method: 'POST',
                body: JSON.stringify({
                    "data": {
                        "type": "whatsapp_message",
                        "attributes": {
                            "message": msg.body
                        },
                        "relationships": {
                            "contact": {
                                "data": {
                                    "type": "whatsapp_contact--whatsapp_contact",
                                    "id": contactEntity
                                }
                            }
                        }

                    }
                }
                )
            }
        }
    )
}

async function fetchContact(number) {
    return await api.jsonapiClient(`/jsonapi/whatsapp_contact/whatsapp_contact?filter[number]=${number}`)

}

async function addContact(contact, to) {
    return await api.jsonapiClient('/jsonapi/whatsapp_contact/whatsapp_contact',
        {
            options: {
                method: 'POST',
                body: JSON.stringify({
                    "data": {
                        "type": "whatsapp_contact",
                        "attributes": {
                            "name": contact.name,
                            "number": contact.number,
                            "to": to,
                            "picture": {
                                uri: await contact.getProfilePicUrl(),
                                alt: contact.name,
                                title: contact.name,
                                width: 200,
                                height: 600
                            }
                        }
                    }
                }
                )
            }
        }
    )
}

function fetchApiConfig() {
    return api.config
}

async function testToken() {
    return await api.getToken()
}

// Exports.
module.exports = { addMessage, fetchContact, fetchApiConfig, testToken }