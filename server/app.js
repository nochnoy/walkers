var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');

var Obj = require('./obj');
var Map = require('./map');

// ----------------------------------------------------------------------------

let paramReadOnly = false;

let dataFileName = 'data/data.txt';
let newline = '\r\n';

var map = new Map();
var commands = [];
var file;

// ----------------------------------------------------------------------------

function addCommand(cmd) {
  commands.push(cmd);
  if (paramReadOnly) {
		console.log('Changes not saved into the data file due to parameter "-nosave"');
  } else {
	  fs.write(file, JSON.stringify(cmd) + newline, (err) => {
		if (err) {
		  throw err + '?';
		}
	  });
  }
}

function sendCommands(fromId) {

}

function parseDataFile(data) {
  commands.length = 0;
  var a = data.split(newline);
  for (var i = 0; i < a.length; i++) {
    if (a[i] && a.length > 0) {
      commands.push(JSON.parse(a[i]));
    }
  }
}

function parseCommandPromptParams() {
  for (var i = 0; i < process.argv.length; i++) {
    switch (process.argv[i]) {
      case '-readonly':	
        paramReadOnly = true; 
        break;
    }
  }
}

// ----------------------------------------------------------------------------

var app = express();

app.use(favicon(path.join(__dirname, '/../public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.get('/', function(req, res, next) {
  res.sendFile(path.join(__dirname, '/../public/index.html'));
});

app.use(express.static(path.join(__dirname, '/../public')));

app.get('/api', (req, res) => {
  var s = '';
  for(var name in res.param) {
    s += '"' + name + '":"' + res.param[name] + '";';
  }
  res.send('Welcome to my superAPI: ' + s);
});

app.get('/api/:cmd/:param1', (req, res) => {
    res.send('API received command ' + req.params.cmd + ' with param1=' + req.params.param1);
    console.log(JSON.stringify(req.params, null, 4));
});

app.post('/api/get', (req, res) => {
  if (paramReadOnly) {
    // В режиме read only при каждой перезагрузке браузера
    // юзер должен получать самую свежую инфу из датафайла. 
    // Подсасываем её.
    fs.readFile(dataFileName, 'utf8', (err, data) => {
      if (err) {
        throw(err);
      }
      parseDataFile(data);
      res.send(JSON.stringify(commands));
    });
  } else {
    res.send(JSON.stringify(commands));
  }
});

app.post('/api/say', (req, res) => {
  addCommand('req.body.message');
  res.send(getMessagesHTML());
});

app.post('/api/go', (req, res) => {
  var cmd = {
    t:"go", 
    id:req.body.id,
    x:req.body.x,
    y:req.body.y
  }

  addCommand(cmd);
  res.send(JSON.stringify([cmd]));
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  //res.render('error');
  res.send('Error ' + err.status);
});

// -- Start -----------------------------------------------

parseCommandPromptParams();

fs.readFile(dataFileName, 'utf8', (err, data) => {
  if (err) {
    throw(err);
  }
  parseDataFile(data);

  if (!paramReadOnly) {
    file = fs.open(dataFileName, 'a', (err, fd) => {
      if (err) {
        throw(err);
      } else {      
        file = fd;
      }
    });
  }

});

module.exports = app;
