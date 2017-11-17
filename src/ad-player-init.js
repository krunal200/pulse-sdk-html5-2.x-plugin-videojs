var session = null;
var pageMetadata = options.metadata || { };
var vjsControls;
var adPlayer;
var adContainerDiv;
var isInLinearAdMode = false;
var sharedElement = null;
var playerSrc;
var postrollsPlaying = false;
var prerollSlot = true;
var contentPaused = false;
var resizeHandle;
var sessionStarted = false;
var firstPlay = true;
var playlistCurrentItem = 0;
var pauseAdTimeout = null;
var isFree = false;
var readyforprerollFired = false;
var contentUpdated = false;

if(!OO || !OO.Pulse) {
    throw new Error('The Pulse SDK is not included in the page. Be sure to load it before the Pulse plugin for videojs.');
}

//Init videojs-contrib-ads plugin
player.ads(options['contrib-ads-options']);
var queryParams = getQueryStringParams();
// Automatically hide poster if autoplay is enabled
// (autoplay will not work on the following mobile devices)
if(!videojs.browser.IS_IOS && !videojs.browser.IS_ANDROID) {
    if(player.autoplay() || (queryParams.hasOwnProperty('autoplay') && queryParams.autoplay === undefined) || queryParams.autoplay === '1' || queryParams.autoplay === 'true') {
        player.addClass('vjs-pulse-hideposter');
    }
} else if(options.hidePoster) {
    player.addClass('vjs-pulse-hideposter');
}

OO.Pulse.debug = options.debug || OO.Pulse.debug;
//Set the Pulse global settings
OO.Pulse.setPulseHost(options.pulseHost, options.deviceContainer, options.persistentId);
//Create the ad player
createAdContainer();

var customBehaviours = { };
var forceSharedElement = queryParams.hasOwnProperty('pulse_force_shared');
var useShared = false;

if(forceSharedElement) {
    useShared = true;
    log('Using shared element because pulse_force_shared parameter is present');
} else if(!isAutoplaySupported()) {
    useShared = true;
    log('Using shared element because autoplay support was not detected');
}

if(useShared) {
    sharedElement = getSharedElement();
    // Set the video element source with MIME-type included to avoid issues with other media sources
    customBehaviours.setVideoSource = (function(mediaFile, element) {
        player.src({
            src: mediaFile.url,
            type: mediaFile.mimeType
        });
    });
}


adPlayer = OO.Pulse.createAdPlayer(adContainerDiv, null, sharedElement, customBehaviours);

// Hide the videojs spinner when ads are playing; hide poster, player if options.hidePoster is true
(function(){
    var style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = '.vjs-ad-playing.vjs-ad-playing .vjs-loading-spinner{display:none} .vjs-pulse-hideposter .vjs-poster, .vjs-pulse-hideposter .vjs-tech, .vjs-pulse-hideposter .vjs-dock-title { opacity: 0 }';
    document.getElementsByTagName('head')[0].appendChild(style);
}());

adPlayer.addEventListener(OO.Pulse.AdPlayer.Events.PAUSE_AD_SHOWN, function(event, metadata) {
    // Make sure that the videojs control are visible for pause ads
    vjsControls.el().style['z-index'] = 10000;
});

adPlayer.addEventListener(OO.Pulse.AdPlayer.Events.AD_CLICKED, function(event, eventData) {
    if(adClickedCallback) {
        adClickedCallback(eventData);
    } else if (eventData.url) {
        // Default clickthrough behaviour
        adPlayer.pause();
        openAndTrackClickThrough(eventData.url);
    }
});

adPlayer.addEventListener(OO.Pulse.AdPlayer.Events.AD_BREAK_STARTED, function() {
    player.trigger('ads-pod-started');
    player.trigger('playing');
    // Hide the VJS loading spinner
    var spinners = document.getElementsByClassName('vjs-loading-spinner');
    for (var i = 0; i < spinners.length; i++) {
        spinners[i].style.display = "none";
    }
});

adPlayer.addEventListener(OO.Pulse.AdPlayer.Events.AD_BREAK_FINISHED, function() {
    player.trigger('ads-pod-ended');
});

var createSession = function() {
    if(session === null) {
        if(player.playlist){
            playlistCurrentItem = player.playlist.currentItem();
        }
        resetPlugin();
        player.trigger('adsready');

        if(!firstPlay) {
            //Workaround to avoid contrib-ads to force restart the video. Probably a bug in contrib-ads
            player.clearTimeout(player.ads.tryToResumeTimeout_);
            player.ads.tryToResumeTimeout_ = null;
            player.play();
        }
    } else if(player.playlist && playlistCurrentItem !== player.playlist.currentItem()){
        //The video was changed, we need to stop the previous session
        resetPlugin();
        playlistCurrentItem = player.playlist.currentItem();
        createSession();
    } else if(contentUpdated) {
        contentUpdated = false;
        resetPlugin();
        createSession();
    }
};

player.on('play', function() {                
    if(firstPlay) {
        // workaround for desktop if the user clicks play before we get loadedmetadata
        if(player.ads.state === 'ads-ready?') {
            createSession();
            player.trigger('play');
        }
    } else if(!isFree) {
        delete vjsControls.el().style['z-index'];
        adPlayer.contentStarted();
    }
});

player.on('pause', function() {
    if(!isFree && !player.scrubbing() && player.ads.state === 'content-playback') {
        pauseAdTimeout = setTimeout(function() {
            pauseAdTimeout = null;
            adPlayer.contentPaused();
        }, 100);
    }
});

player.on('loadedmetadata', function() {
    createSession();
});

player.on('seeked', function() {
    console.log('seeked', arguments);
});


player.on('seeking', function() {
    console.log('seeking', arguments);
});

player.getChild('ControlBar').getChild('ProgressControl').getChild('SeekBar').on('mouseup', function() {
    console.log('seek mouse up', arguments);
})

// a.getChild('ControlBar').getChild('ProgressControl').getChild('SeekBar').handleMouseUp