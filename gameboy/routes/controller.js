const express = require('express');
const router = new express.Router();
const robot = require('robotjs');

router.get('/left', (req, res) => {
  try {
    res.send('go left');
    setTimeout(() => {
      robot.keyToggle('left', 'down');
    }, 2000);
  } catch (error) {
    res.send({ error: error.message });
  }
});

router.get('/right', (req, res) => {
  try {
    res.send('go right');
    setTimeout(() => {
      robot.keyToggle('right', 'down');
    }, 2000);
  } catch (error) {
    res.send({ error: error.message });
  }
});

router.get('/up', (req, res) => {
  try {
    res.send('go up');
    setTimeout(() => {
      robot.keyToggle('up', 'down');
    }, 2000);
  } catch (error) {
    res.send({ error: error.message });
  }
});

router.get('/down', (req, res) => {
  try {
    res.send('go down');
    setTimeout(() => {
      robot.keyToggle('down', 'down');
    }, 2000);
  } catch (error) {
    res.send({ error: error.message });
  }
});

router.get('/pressB', (req, res) => {
  try {
    res.send('b');
    setTimeout(() => {
      robot.keyToggle('a', 'down');
    }, 2000);
  } catch (error) {
    res.send({ error: error.message });
  }
});

router.get('/pressA', (req, res) => {
  try {
    res.send('a');
    setTimeout(() => {
      robot.keyToggle('s', 'down');
    }, 2000);
  } catch (error) {
    res.send({ error: error.message });
  }
});

router.get('/pressStart', (req, res) => {
  try {
    res.send('start');
    setTimeout(() => {
      robot.keyToggle('w', 'down');
    }, 2000);
  } catch (error) {
    res.send({ error: error.message });
  }
});

router.get('/pressSelect', (req, res) => {
  try {
    res.send('select');
    setTimeout(() => {
      robot.keyToggle('q', 'down');
    }, 2000);
  } catch (error) {
    res.send({ error: error.message });
  }
});
module.exports = router;
