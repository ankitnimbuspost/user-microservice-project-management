const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');

const app = express();

// Middleware to parse JSON data
app.use(bodyParser.json({ limit: '100mb' }));

// Middleware to parse form-data
const upload = multer();
app.use(upload.any());

// Route to handle form-data or JSON POST request
app.post('/api/test', (req, res) => {
  // Check if form-data or JSON data is present
  console.log(req.body)
  console.log(req.files)
    res.status(400).send('No data received');
});

// Start the server
app.listen(5001, () => {
  console.log('Server is running on port 3000');
});
