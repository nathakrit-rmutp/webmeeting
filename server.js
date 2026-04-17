const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors()); // 🔥 แก้ CORS
app.use(express.json());
app.use(express.static(path.join(__dirname))); // 🔥 Serve static files

const GAS_URL = 'https://script.google.com/macros/s/AKfycbwq70-vF_Na5-71yyqGvfDKY6d3PwZhvgJ2dGjbTFF3RjzJHLA79XFqy3eESlZ2LJngrg/exec';

app.post('/api', async (req, res) => {
    try {
        const response = await fetch(GAS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(req.body)
        });

        const text = await response.text();
        res.send(text);

    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Server error' });
    }
});

app.listen(3000, () => {
    console.log('🚀 Proxy running on http://localhost:3000');
});
