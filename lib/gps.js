var common = require('./common.js')
,     gpsd = require('node-gpsd')
,     conf = require('../conf/default.js');

var gps = exports = module.exports = {};

gps.init = function(){
  console.log('gps module: initializing');
  this.settings = {};
  this.defaultConfiguration();
};

gps.set = function(setting, val){
  if (1 == arguments.length) {
    return this.settings[setting];
  } else {
    this.settings[setting] = val;
    return this;
  }
};

gps.enabled = function(setting){
  return !!this.set(setting);
};

gps.disabled = function(setting){
  return !this.set(setting);
};

gps.enable = function(setting){
  return this.set(setting, true);
};

gps.disable = function(setting){
  return this.set(setting, false);
};

gps.defaultConfiguration = function() {

  console.log('stat:' + common.util.inspect(conf));
	gps.settings = conf.gps;
  gps.set('ID', common.mac()); // setup

};

gps.worker = function() {
  console.log('gps module: activated');
  var counter = 0
  ,      mess = 0
  ,  listener = new gpsd.Listener()
  ,    daemon = new gpsd.Daemon({ 
        program: 'gpsd',
        device: '/dev/ttyAMA0',
        verbose: false
      })
  ,        db = common.mongo.db(conf.mongo.url+'/'+conf.gps.db, {w:1})
  ,   gpsData = {};

  gpsData.sky = typeof gpsData.sky !== 'undefined' ? gpsData.sky : {};
  gpsData.sky.hdop = typeof gpsData.sky.hdop !== 'undefined' ? gpsData.sky.hdop : 9672;
  
  listener.on('TPV', function (tpv) {
    // ticks 
    if (counter++ >= gps.settings.counter_reset) { 
       db.collection('fixes').count(function(err, result) {
         if (err) throw err;
         console.log('fixes: ' + result);
      });
      counter = 0;
    }

    if (typeof gpsData.tpv != 'undefined'  ) {
       //data = {'lat': tpv.lat, 'lon': tpv.lon};
        if (gps.shouldupdate(gpsData.tpv, tpv, gps.settings.send_thresh)|| counter == 5) { 
          //io.sockets.emit('sample', {'lat': tpv.lat, 'lon': tpv.lon, 'hdop': gpsData.sky.hdop});
            if (gps.settings.log_to_db === true && tpv.mode > 1) {
              var data_obj = {g: gpsData.id, s: tpv.speed, h: tpv.track, a: tpv.alt, t: tpv.mode, d: gpsData.sky.hdop, loc: {lon: tpv.lon, lat: tpv.lat} };
              db.collection('fixes').insert( data_obj, function(err, result) {
                if (err) console.log("gps_insert_err: "+err);
                if (result); 
              });
              /*
              if (send_pubnub){
                pubnub.publish({
                  channel: 'h8roadz-gps',
                  message: {t: "fix", d: data_obj},
                  callback: function(data){console.log('['+ (++mess) +']publishing to pubnub');},
                  error: function(err){console.log("pub error: " + JSON.stringify(err));}
                });
              } 
              */
            }
        }
        gps.emmiter(gpsData.tpv.lat, tpv.lat, 'lat');
        gps.emmiter(gpsData.tpv.lon, tpv.lon, 'lon');
        gps.emmiter(gpsData.tpv.alt, tpv.alt, 'alt');
        gps.emmiter(gpsData.tpv.speed, tpv.speed, 'speed');
        gps.emmiter(gpsData.tpv.track, tpv.track, 'track');
        gps.emmiter(gpsData.tpv.epx, tpv.epx, 'epx');
        gps.emmiter(gpsData.tpv.epy, tpv.epy, 'epy');
        gps.emmiter(gpsData.tpv.epv, tpv.epv, 'epv');
        
     } else {
       gpsData.tpv = tpv;
       common.io.sockets.emit('tpv', tpv);
     }
  });

  listener.on('SKY', function (sky) {
        //console.log(sky);
    if (gps.settings.send_sky_data) {
      if (typeof gpsData.sky != 'undefined') {
        gps.emmiter(gpsData.sky.satellites, sky.satellites, 'satellites');
        gps.emmiter(gpsData.sky.hdop, sky.hdop, 'hdop');
      } else {
         gpsData.sky = sky.satellites;
         common.io.sockets.emit('sky', sky.satellites);
       }
    }
  });
  listener.on('GST', function (gst) {
      //console.log(gst);
  });
  listener.on('ATT', function (att) {
    //console.log(att);
  });
  listener.on('DEVICE', function (dev) {
    //console.log(dev);
  });
  listener.on('INFO', function (info) {
     //console.log(info);
  });
  listener.connect(function() {
    listener.watch();
  });

	common.io.sockets.on('connection', function(socket) {
    socket.emit('message', 'gps message');
    common.io.sockets.emit('tpv', gpsData.tpv);
    socket.emit('gpsid', gps.settings.ID);
  });

  db.collection('fixes').count(function(err, result) {
    if (err) throw err;
      console.log('fixes: ' + result);
  });
}

gps.emmiter = function(param, data, eventname) {
  if (typeof param != 'undefined') {
    if (param != data) {   
      param = data;
      common.io.sockets.emit(eventname, data);
    }
  } else {
    param = data;
    common.io.sockets.emit(eventname, data);
  }
  //console.log('emitted: [' + eventname + ']: ' + data);
}

/* 
    this is a very crude method to determin if the fix has
    moved more than the threhold ammount, which will cause it return true. 

    It gets an estimated distance in meters by 
    adding the diference of lat and lon
*/
gps.shouldupdate = function(current, last, threshold) {
    latdif = Math.abs(current.lat - last.lat);
    londif = Math.abs(current.lon - last.lon);
    var sum = (latdif + londif);
    
    if ( sum >= threshold) {
    
      //console.log("SEND diff: " + sum);
      return true;
    } else { 
      var sum = (latdif + londif);
      //console.log("NOGO diff: " + sum);
      return false;
    }
  
    return (current.lat != last.lat || current.lon != last.lon);
}

gps.toString = function() {'I am a gps module'};