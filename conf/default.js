 var conf = exports = module.exports = {	

 	core: {
		modules: [{name: 'gps', path: './lib/gps.js', active: true}],
		server: {
			http_port: 9673,
			static: __dirname + '/../static'
		}
	},
	gps: {
		log_to_db: true,
		counter_reset: 60*5,
		send_sky_data: true,
		send_thresh: 0.00005,
		db: 'gpsdata' 
	},
	pubnub: {
		conf: {
	   		publish_key: 'pub-c-365a0741-9d97-4b52-a5f8-de2d1d90e7ba',
	   		subscribe_key: 'sub-c-65503d0c-1b74-11e3-a995-02ee2ddab7fe',
	   		error: function(err) { console.log('init error: '+err); }
	   	},
	   	channels: [{type: 'public', name:'h8roadz-gps', active: true}]
	},
	mongo: {
		url: 'localhost:27017',
	}
}