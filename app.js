// import library
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');

// merutekan app
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var coolRouters = require('./routes/cool');
var catalogRouter = require('./routes/catalog');

var compression = require('compression');

var app = express();

// buat koneksi ke mongodb
var mongoDb = 'mongodb+srv://rootidn:RLJ2wbasTbQxn7Oi@cluster0.umsox.mongodb.net/local_library?retryWrites=true&w=majority';
mongoose.connect(mongoDb, { useNewUrlParser: true, useUnifiedTopology:true});
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Mongodb connection error'));

// view engine setup
// menentukan folder dimana template disimpan
app.set('views', path.join(__dirname, 'views'));
// specify view engine yang digunakan
app.set('view engine', 'pug');

// menambahkan middleware library untuk request handling chain
// express.json dan express.urlencoded dibutuhkan untuk mendefinisikan req.body
// dan express.static utk mengatur static files di /public
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(compression()); //Compress all routes

app.use(express.static(path.join(__dirname, 'public')));

// menambahkan rout-handling
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/cool', coolRouters);
app.use('/catalog', catalogRouter)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
