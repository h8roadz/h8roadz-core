var Common = {
    express: require('express'),
	util: require('util'),
	io: require('socket.io'),
	fs: require('fs'),
	mongo: require('mongoskin'),
	mac: function() {
		var mac = '00:00:00:00:00:00';
		// gets the mac address of the ethernet port to use as a unique id for the gps
		if ( '00:00:00:00:00:00' === mac ) {
			mac =  Common.fs.readFileSync('/sys/class/net/eth0/address', 'utf8');
		}
		console.log('mac: '+mac);
		return mac;
	}
};
 
module.exports = Common;