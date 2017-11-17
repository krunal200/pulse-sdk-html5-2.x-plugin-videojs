(function(vjs) {
    'use strict';

  function log() {
        var args = Array.prototype.slice.call(arguments);
        if(OO.Pulse) {
            if(OO.Pulse.Utils.logTagged) {
                args.unshift([{ tag: 'vjs', color: '#407A5C' }]);
                OO.Pulse.Utils.logTagged.apply(null, args);
            } else {
                OO.Pulse.Utils.log.apply(null, args);
            }
        } else {
            args.unshift('OO.Pulse: ');
            console.log.apply(window.console, args);
        }
    }

var pulsePlugin = function(options, readyForPrerollCallback, adClickedCallback) {
  	(function(player) {
	    