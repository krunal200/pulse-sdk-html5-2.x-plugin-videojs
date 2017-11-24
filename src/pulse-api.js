//=====================================================================
//                      PUBLIC API
//=====================================================================

var PulseAPI = function(adPlayer) {
    /**
     * Pulse ad player
     */
    this.adPlayer = adPlayer;

    /**
     * Pulse plugin version
     */
    this.version = "@VERSION";
}

/**
 * Initialize a new session.
 * @param sessionSettings
 * @returns {*}
 */
PulseAPI.prototype.initSession = function(sessionSettings) {
    resetPlugin();
    pageMetadata = sessionSettings;
    return session;
};

/**
 * Show linear ad registered to display at 'time' ms in linearPlaybackPositions array.
 * Useful to show ad if video playback position is changed as a result of some user interactions (eg: seeking)
 * @param  {number} time Time in milli second
 */
PulseAPI.prototype.showLinearAd = function(time) {
    showLinearAd(time);
};


/**
 * Start a pulse session
 * @param userSession
 */
PulseAPI.prototype.startSession = function(userSession) {
    adPlayer.startSession(userSession, adPlayerListener);
    sessionStarted = true;
};

/**
 * Set the metadata used for ad requests
 * @param sessionSettings
 */
PulseAPI.prototype.setMetadata = function(sessionSettings) {
    pageMetadata = sessionSettings;
}

/**
 * True if in an ad break
 * @returns {boolean}
 */
PulseAPI.prototype.isInLinearAdMode = function() {
    return isInLinearAdMode;
};

/**
 * Add an event listener to the Pulse ad player to access event data or to add
 * your own logic to the event handling. All ad player events are listed
 * [here](http://pulse-sdks.ooyala.com/pulse-html5/latest/OO.Pulse.AdPlayer.Events.html).
 * @param event event to listen to
 * @param callback callback function
 */
PulseAPI.prototype.addEventListener = function(event, callback) {
    adPlayer.addEventListener(event, callback);
};

/**
 * Remove an event listener
 * @param event ad player event
 * @param callback callback to remove
 */
PulseAPI.prototype.removeEventListener = function(event, callback) {
    adPlayer.removeEventListener(event, callback);
};

/**
 * Stop the ad session. No more ads will be displayed in the video.
 */
PulseAPI.prototype.stopSession = function() {
    if(sessionIsValid()) {
        try {
            adPlayer.stopSession();
        } catch (e){

        }
        session = null;
    }
};

/**
 * Destroy the plugin and the ad player. Call this method in case the page is also
 * used to display other content where you no longer need the Brightcove player and the
 * player is removed from the page.
 */
PulseAPI.prototype.destroy = function() {
    this.stopSession();
    resetStates();
};

// Make sure each player has its own public API instance
player.pulse = new PulseAPI(adPlayer);