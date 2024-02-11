const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const globalHandler = require('./controllers/error.controller');
const authRoute = require('./routes/auth.route')
const menuRoute = require('./routes/menu.route');


const app = express();

app.use(
  session({
    secret: 'Event', 
    resave: false,
    saveUninitialized: true,
  })
);


app.use(
  cors({
    methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
    origin: '*',
    credentials: true,
  })
);

app.use(helmet());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '10kb' }));

app.use(express.urlencoded({ extended: true }));


app.use('/api/v1/auth', authRoute);
app.use('/api/v1/menu', menuRoute);

app.use(globalHandler);

app.get('/', (req, res) => {
  res.send('Server live ⚡️');
});

app.all('*', (req, res, next) => {
  res.status(404).json({
    success: false,
    messsage: `${req.originalUrl} not found`,
  });
});

module.exports = app;