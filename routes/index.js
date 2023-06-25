// import bodyParser from 'body-parser';

// import AppController from 'controllers/AppController'
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';

const express = require('express');

const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json());

app.get('/status', AppController.getStatus);
app.get('/stats', AppController.getStats);
app.post('/users', UsersController.postNew);

module.exports = app;
