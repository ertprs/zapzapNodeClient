const fetch = require("node-fetch");
const dotenv = require('dotenv').config()
// Drupal oauth.
const apiPath = process.env.APIPATH
const domain = process.env.DOMAIN

const config = {
  client: {
    id: process.env.ID,
    secret: process.env.SECRET
  },

  auth: {
    tokenHost: domain,
    tokenPath: apiPath + '/oauth/token'
  }
}

let token = undefined

const { ClientCredentials, ResourceOwnerPassword, AuthorizationCode } = require('simple-oauth2')

async function getToken() {
  const client = new ResourceOwnerPassword(config);

  const tokenParams = {
    username: process.env.DRUPAL_USER,
    password: process.env.DRUPAL_PASS,
  };

  try {
    const accessToken = await client.getToken(tokenParams, { json: true });
    return accessToken.toJSON()
  } catch (error) {
    console.log('Access Token Error', error.message);
  }
}

async function jsonapiClient(endpoint,
  { options = {}, noauth = false } = {}) {
  if (token === undefined) {
    token = await getToken()
  }

  const auth = { 'Content-Type': 'application/vnd.api+json', Authorization: 'Bearer ' + (token.access_token) }

  options.headers = options.headers || {};
  options.headers.Accept = 'application/json';
  options.headers = { ...options.headers, ...auth };

  const data = await fetch((domain + apiPath) + endpoint, options).then(
    res => {
      if ([200, 201, 204, 401].includes(res.status)) {
        // console.log("deu BOM", options)
        return res.json().then(data => data)
      } else {
        console.log("deu merdeu", res, options)
      }
    })

  return data;
}

// Exports.
module.exports = { getToken, jsonapiClient, config }