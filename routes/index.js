// import bodyParser from 'body-parser';

// import AppController from 'controllers/AppController'
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';

const express = require('express');

const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json());

app.get('/status', AppController.getStatus);
app.get('/stats', AppController.getStats);

app.get('/connect', AuthController.getConnect);
app.get('/disconnect', AuthController.getDisconnect);
app.get('/users/me', UsersController.getMe);

app.post('/users', UsersController.postNew);

module.exports = app;
