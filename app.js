const express = require('express');
var app = express();
var bodyParser = require('body-parser')
var session = require('express-session')
var cookieParser = require('cookie-parser')
var cors = require('cors')
var helmet = require('helmet')
var xss = require('xss-clean')
app.use(xss())
app.use(helmet())

app.use(express.json())
app.use(cookieParser())
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}))

app.use(cors({
  origin: 'http://localhost:8000', //Chan tat ca cac domain khac ngoai domain nay
  credentials: true, //Để bật cookie HTTP qua CORS
}))

app.use('/api/xe/', require('./routers'));

app.listen(8000,function(){
  console.log('Node server running @ http://localhost:8000')
});


module.exports = app;