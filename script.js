// script.js
document.addEventListener('DOMContentLoaded', function () {
    const clientId = 'a596f6c3ebbc41c9a607c2a2a704cfdf';
    const redirectUri = 'http://localhost:5500/player.html'; // Updated redirect URI
    const scopes = ['user-read-currently-playing', 'user-read-private', 'user-read-email']; // Add user-read-email scope for email info

    const loginButton = document.getElementById('loginButton');
    const metadataSection = document.getElementById('metadata');
    const accountInfoDiv = document.getElementById('accountInfo');

    if (loginButton) {
        loginButton.addEventListener('click', () => {
            const authorizeUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join('%20')}&response_type=code`;
            window.location.replace(authorizeUrl);
        });
    }

    // Check for authorization code in the URL after redirect
    const code = new URLSearchParams(window.location.search).get('code');
    const refreshToken = 'YOUR_REFRESH_TOKEN'; // Replace with your actual refresh token

    if (code) {
        // Use the authorization code to obtain an access token
        fetch('http://localhost:3000/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                code: code,
                client_id: clientId,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        })
        .then(response => response.json())
        .then(data => {
            // Extract access token and refresh token from the response
            const accessToken = data.access_token;
            const refreshToken = data.refresh_token;

            // Fetch and display Spotify metadata
            fetch('https://api.spotify.com/v1/me/player/currently-playing', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // Extract metadata from the response and update the HTML
                const artist = data.item.artists.map(artist => artist.name).join(', ');
                const songName = data.item.name;
                const albumCoverUrl = data.item.album.images[0].url; // Use the first image for simplicity

                // Update HTML with album cover, artist, and song information
                document.getElementById('albumCover').src = albumCoverUrl;
                document.getElementById('artistInfo').textContent = `Artist: ${artist}`;
                document.getElementById('songInfo').textContent = `Song: ${songName}`;
            })
            .catch(error => console.error('Error fetching Spotify data:', error));

            // Fetch and display Spotify account info
            fetch('https://api.spotify.com/v1/me', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // Extract account info from the response and update the HTML
                const accountInfoDiv = document.getElementById('accountText');
                const accountInfo = `Welcome, ${data.display_name || 'Unknown'}`;
                accountInfoDiv.textContent = accountInfo;
            
                // Update profile picture
                const profilePicture = document.getElementById('profilePicture');
                if (data.images && data.images.length > 0) {
                    profilePicture.src = data.images[0].url; // Use the first image for simplicity
                }
            })
            .catch(error => console.error('Error fetching Spotify account info:', error));

            // Function to refresh the access token before it expires
            function refreshAccessToken(refreshToken) {
                const refreshEndpoint = 'http://localhost:3000/refresh';

                return fetch(refreshEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        refresh_token: refreshToken,
                    }),
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }

                    return response.json();
                })
                .then(data => {
                    console.log('Refreshed Access Token:', data.access_token);
                    return data.access_token;
                })
                .catch(error => {
                    console.error('Error refreshing access token:', error);
                    throw error;
                });
            }

            // Function to periodically refresh the access token before it expires
            function scheduleTokenRefresh(refreshToken, expiresIn) {
                const interval = expiresIn * 0.9 * 1000; // Refresh 90% before expiration time

                setInterval(async () => {
                    try {
                        const newAccessToken = await refreshAccessToken(refreshToken);
                        // Use the new access token for your Spotify API requests

                        // Optionally, update the HTML or perform any other actions
                    } catch (error) {
                        console.error('Failed to refresh access token:', error);
                    }
                }, interval);
            }

            // Schedule token refresh
            scheduleTokenRefresh(refreshToken, data.expires_in);
        })
        .catch(error => console.error('Error exchanging authorization code for token:', error));
    }
});
