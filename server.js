<<<<<<< HEAD
const express = require('express');
const routes = require('./routes');

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(routes);

app.listen(port, () => {
  console.log(`server running on port ${port}`);
});
=======
import app from './routes/index';

const PORT = process.env.PORT || '5000';

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
>>>>>>> main
