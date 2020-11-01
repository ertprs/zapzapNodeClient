const api = require('./api')

async function addMessage(msg, contact) {
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
                            "to": to.split('@')[0],
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

async function fetchClient(name) {
    return await api.jsonapiClient(`/jsonapi/whatsapp_client/whatsapp_client?filter[name]=${name}`)
}

async function editClient(id, attributes) {
    return await api.jsonapiClient(`/jsonapi/whatsapp_client/whatsapp_client/${id}`,
        {
            options: {
                method: 'PATCH',
                body: JSON.stringify({
                    "data": {
                        "type": "whatsapp_client",
                        "attributes": {
                            ...attributes
                        }
                    }
                }
                )
            }
        }
    )
}

async function addClient(name) {
    return await api.jsonapiClient('/jsonapi/whatsapp_client/whatsapp_client',
        {
            options: {
                method: 'POST',
                body: JSON.stringify({
                    "data": {
                        "type": "whatsapp_client",
                        "attributes": {
                            "name": name
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

module.exports = { addMessage, fetchContact, fetchApiConfig, testToken, fetchClient, addClient }