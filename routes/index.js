// import bodyParser from 'body-parser';

// import AppController from 'controllers/AppController'
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

const express = require('express');

const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json( {limit: '10mb' }));

app.get('/status', AppController.getStatus);
app.get('/stats', AppController.getStats);

app.get('/connect', AuthController.getConnect);
app.get('/disconnect', AuthController.getDisconnect);
app.get('/users/me', UsersController.getMe);

app.post('/files', (req, res) => {
    const contentLength = req.headers['content-length'];
    console.log('Payload size: ', contentLength);
    FilesController.postUpload(req, res);
});

app.post('/users', UsersController.postNew);

app.get('/files/:id', FilesController.getShow);
app.get('/files', FilesController.getIndex);



module.exports = app;
