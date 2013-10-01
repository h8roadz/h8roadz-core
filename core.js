var common = require('./lib/common.js')
,	  conf = require('./conf/default.js')
,	   app = common.express()
,	server = require('http').createServer(app);
	
var HCore = function (configure) {
	
	var self = this;
	var core_conf = configure || conf.core;
		
		common.app = app;
		common.io = common.io.listen(server),
		common.io.set('log level', 1);

		/*
			call initializers on all attached modules
		*/

		load_modules(self);
		
		app.set('veiw engine', 'jade');
		app.set('views', './views');
		
		// this is what should be called in the initializers
		app.use(common.express.static(core_conf.server.static));
		app.use(common.express.responseTime());
		app.use(app.router);
	
	server.listen( core_conf.server.http_port );
	
	common.io.sockets.on('connection', function(socket) {

		socket.on('error', function (error) {
			console.log('socket error: '+error);
		});

		socket.emit('message', 'core active');
		
	});

	activate_modules(self);
	
	function load_modules(p) {
		/* loads the modules required setups */
		for (var index in core_conf.modules) {
			var current = core_conf.modules[index];
			if (typeof current != 'undefined' &&  current.active) {
				console.log('mod: '+ current.name);
				p[current.name] = require(current.path);
				p[current.name].init(self);
			}
		}
	}

	function activate_modules(p) {
		for (var index in core_conf.modules) {
			var current = core_conf.modules[index];
			if (typeof current != 'undefined' &&  current.active) {
				p[current.name].worker();
			}
		}
	}

	return self;
}

HCore();

/*
exports.init = function(setup) {
    var H8C = {};
    H8C = HCore(setup);
    return H8C;
}
H8RoadzCore = exports.init();
*/ 