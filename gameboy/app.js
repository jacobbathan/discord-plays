const express = require('express');
const app = express();
const path = require('path');
const port = 8080;
const router = require('./routes/controller');

app.use(express.static(__dirname + '/gameboy'));

app.get('/', (req, res) => {
  res.sendFile('index.html', {
    root: path.join(__dirname, 'gameboy')
  });
});

app.use('/api/controller', router);

app.listen(port, () => console.log('APP LIVE ON PORT' + port));
