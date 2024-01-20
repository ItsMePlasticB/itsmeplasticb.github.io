// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

let accessToken = null;

app.post('/token', async (req, res) => {
    const { code, client_id, redirect_uri, grant_type } = req.body;

    try {
        // Check if we already have a valid access token
        if (accessToken) {
            console.log('Returning existing access token:', accessToken);
            return res.json({ access_token: accessToken });
        }

        // If not, perform token exchange logic by making a request to Spotify API
        const response = await axios.post('https://accounts.spotify.com/api/token', null, {
            params: {
                code: code,
                client_id: client_id,
                client_secret: '785b5b8bd16f4bf79b2c81b2a0596e16', // Replace with your client secret
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code',
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        accessToken = response.data.access_token;
        res.json({ access_token: accessToken });
    } catch (error) {
        console.error('Error exchanging authorization code for token:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/refresh', async (req, res) => {
    // Check if we have a valid access token to refresh
    if (!accessToken) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // Perform token refresh logic by making a request to Spotify API
        const response = await axios.post('https://accounts.spotify.com/api/token', null, {
            params: {
                grant_type: 'refresh_token',
                refresh_token: 'YOUR_REFRESH_TOKEN', // Replace with your refresh token
                client_id: 'a596f6c3ebbc41c9a607c2a2a704cfdf', // Replace with your client ID
                client_secret: '785b5b8bd16f4bf79b2c81b2a0596e16', // Replace with your client secret
            },
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        accessToken = response.data.access_token;
        res.json({ access_token: accessToken });
    } catch (error) {
        console.error('Error refreshing access token:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
