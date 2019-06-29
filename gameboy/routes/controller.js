const express = require('express');
const router = new express.Router();
const robot = require('robotjs');

router.get('/left', (req, res) => {
  try {
    robot.keyToggle('left', 'down');
    setTimeout(() => {
      robot.keyToggle('left', 'up');
    }, 500);
  } catch (error) {
    res.send({ error: error.message });
  }
});

router.get('/right', (req, res) => {
  try {
    robot.keyToggle('right', 'down');
    setTimeout(() => {
      robot.keyToggle('right', 'up');
    }, 500);
  } catch (error) {
    res.send({ error: error.message });
  }
});

router.get('/up', (req, res) => {
  try {
    robot.keyToggle('up', 'down');
    setTimeout(() => {
      robot.keyToggle('up', 'up');
    }, 500);
  } catch (error) {
    res.send({ error: error.message });
  }
});

router.get('/down', (req, res) => {
  try {
    robot.keyToggle('down', 'down');
    setTimeout(() => {
      robot.keyToggle('down', 'up');
    }, 500);
  } catch (error) {
    res.send({ error: error.message });
  }
});

router.get('/pressB', (req, res) => {
  try {
    robot.keyToggle('a', 'down');
    setTimeout(() => {
      robot.keyToggle('a', 'up');
    }, 500);
  } catch (error) {
    res.send({ error: error.message });
  }
});

router.get('/pressA', (req, res) => {
  try {
    robot.keyToggle('s', 'down');
    setTimeout(() => {
      robot.keyToggle('s', 'up');
    }, 500);
  } catch (error) {
    res.send({ error: error.message });
  }
});

router.get('/pressStart', (req, res) => {
  try {
    robot.keyToggle('w', 'down');
    setTimeout(() => {
      robot.keyToggle('w', 'up');
    }, 500);
  } catch (error) {
    res.send({ error: error.message });
  }
});

router.get('/pressSelect', (req, res) => {
  try {
    robot.keyToggle('q', 'down');
    setTimeout(() => {
      robot.keyToggle('q', 'up');
    }, 500);
  } catch (error) {
    res.send({ error: error.message });
  }
});
module.exports = router;
