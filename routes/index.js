const express = require('express');
const app = express();
// import AppController from 'controllers/AppController'
import AppController from '../controllers/AppController';

app.get('/status', AppController.getStatus);
app.get('/stats', AppController.getStats)

module.exports = app;
