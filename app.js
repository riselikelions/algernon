// Load 3rd party modules
var express = require('express');
var app = express();
var validator = require('express-validator');
var check = require('validator').check;
var u = require('url');

// Load our configuration and routes
var conf = require('./config');

// log requests
app.use(express.logger('dev'));

// static files
app.use(express.static(__dirname + '/public'));

// views
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(validator);
app.use(app.router);

// environments
app.configure('development', function(){
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
	app.use(express.errorHandler());
});

// Routes
app.get('/', function(req, res){
	res.render('index');
});

app.get('/library/:url', function(req, res){
	var nodeio = require('node.io');
	var url = req.params.url;

	var textJob = new nodeio.Job({
		input: [ url ],
		run: function(url) {
			this.getHtml('http://theanarchistlibrary.org/library/' + url, function(err, $) {
				if (err) {
					this.exit(err);
				}
				try {
					var results = $('#textwithoutmetadata').innerHTML;
				} catch(err) {
					res.redirect('/');
					return;
				}
				this.emit(results.toString('utf8'));
			});
		}
	});
	nodeio.start(textJob, function(err, output) {
		res.render('read', {text: output, url: url});
	}, true);
});

app.post('/library/', function(req, res) {

	var url = u.parse(req.body.url);

	req.onValidationError(function (msg){
		res.redirect('/', {msg: msg});
	});

	// Validate URL
	check(url.href, 'Not a url').isUrl();
	check(url.hostname, 'Please choose a text from theanarchistlibrary.org').contains('theanarchistlibrary.org');
	check(url.pathname, 'Please choose a text from theanarchistlibrary.org').contains('library');

	var redir = url.pathname;
	console.log(redir);

	res.redirect(redir);
});

app.get('*', function(req, res){
	res.redirect('/');
});
app.listen(conf.http.port);