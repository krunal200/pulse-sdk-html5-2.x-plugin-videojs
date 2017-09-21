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
             * Start a pulse session
             * @param userSession
             */
            PulseAPI.prototype.startSession = function(userSession) {
                adPlayer.startSession(userSession, adPlayerListener);
                sessionStarted = true;
            };

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

            function sessionIsValid() {
                return !!session && !!session._currentSession;
            }

            //Merge the brightcove studio metadata with the page metadata
            function mergeMetadata(mediaMetadata, pageMetadata) {
                var finalMetadata = { };

                // Brightcove CMS metadata
                if(mediaMetadata) {
                    finalMetadata.tags = mediaMetadata.tags;

                    // cue points
                    if(mediaMetadata.cue_points && mediaMetadata.cue_points.length > 0) {
                        var mediaCuePoints = [ ];
                        var cuePoint;
                        for(var i = 0; i < mediaMetadata.cue_points.length; ++i) {
                            cuePoint = mediaMetadata.cue_points[i];

                            if(cuePoint.type === 'AD' && (cuePoint.name === 'vpspot' || cuePoint.name === 'pulse_ad')) {
                                mediaCuePoints.push(cuePoint.time);
                            }
                        }

                        if(mediaCuePoints.length > 0) {
                            finalMetadata.linearPlaybackPositions = mediaCuePoints;
                        }
                    }
                    if(mediaMetadata.custom_fields) {


                        var pulseTags = mediaMetadata.custom_fields.pulse_tags || mediaMetadata.custom_fields.vpTags;
                        if (pulseTags) {
                            finalMetadata.tags = pulseTags.split(',');
                        }

                        var pulseFlags = mediaMetadata.custom_fields.pulse_flags || mediaMetadata.custom_fields.vpFlags;
                        if (pulseFlags) {
                            finalMetadata.flags = pulseFlags.split(',');
                        }

                        // TODO: reinit session if this is present or what?
                        var pulseHost = mediaMetadata.custom_fields.pulse_host || mediaMetadata.custom_fields.vpHost;
                        if (pulseHost) {
                            finalMetadata.pulseHost = pulseHost;
                        }

                        var pulseCategory = mediaMetadata.custom_fields.pulse_category || mediaMetadata.custom_fields.vpCategory;
                        if (pulseCategory) {
                            finalMetadata.category = pulseCategory;
                        }

                        var pulseContentPartner = mediaMetadata.custom_fields.pulse_content_partner || mediaMetadata.custom_fields.vpContentPartner;
                        if (pulseContentPartner) {
                            finalMetadata.contentPartner = pulseContentPartner;
                        }

                        var pulseContentForm = mediaMetadata.custom_fields.pulse_content_form || mediaMetadata.custom_fields.vpContentForm;
                        if (pulseContentForm) {
                            finalMetadata.contentForm = pulseContentForm;
                        }

                        var pulseMaxLinearBreakDuration = parseInt(mediaMetadata.custom_fields.pulse_max_linear_break_duration);
                        if (pulseMaxLinearBreakDuration && !isNaN(pulseMaxLinearBreakDuration)) {
                            finalMetadata.maxLinearBreakDuration = pulseMaxLinearBreakDuration;
                        }

                    }
                    if(mediaMetadata.id) {
                        finalMetadata.id = mediaMetadata.id;
                    }

                    // Legacy: BC map metadata
                    if(mediaMetadata.vpBCMapTags) {
                        finalMetadata.tags = mediaMetadata[mediaMetadata.vpBCMapTags].split(',');
                    }

                    if(mediaMetadata.vpBCMapFlags) {
                        finalMetadata.flags = mediaMetadata[mediaMetadata.vpBCMapFlags].split(',');
                    }

                    if(mediaMetadata.vpBCMapCategory) {
                        finalMetadata.category = mediaMetadata[mediaMetadata.vpBCMapCategory];
                    }

                    if(mediaMetadata.vpBCMapContentPartner) {
                        finalMetadata.contentPartner = mediaMetadata[mediaMetadata.vpBCMapContentPartner];
                    }
                }

                // Player plugin config or page-level metadata
                if(pageMetadata) {
                    for(var key in pageMetadata) {
                        if(key === 'tags') {
                            if(!finalMetadata.tags) {
                                finalMetadata.tags = pageMetadata.tags;
                            } else {
                                finalMetadata.tags = finalMetadata.tags.concat(pageMetadata.tags);
                            }
                        } else {
                            finalMetadata[key] = pageMetadata[key];
                        }
                    }
                }

                // translate page params like 'pulse_tags' -> sdk format 'tags'
                // read query params for some things

                /*
                 vpCategory: getParameterByName('category'),
                 contentPartner: getParameterByName('contentPartner'),
                 tags: getParameterByName('tags').split(','),
                 */

                return finalMetadata;
            }

            function resetPlugin() {
                sessionStarted = false;

                //If there was an existing session, stop it
                player.pulse.stopSession();
                resetStates();
                //Register the relevant event listeners
                registerPlayerEventListeners();
            }

            function doInitSession(mediaMetadata, pageMetadata) {
                resetPlugin();

                var finalMetadata = mergeMetadata(mediaMetadata, pageMetadata);
                initSession.call(this, getContentMetadataFromSessionSettings(finalMetadata),
                    getRequestSettingsFromSessionSettings(finalMetadata));
                player.trigger('adsready');
            }

            //Volume change listener
            function onVolumeChange(){
                var volume = player.muted() ? 0 : player.volume();
                adPlayer.setVolume(volume);
            }

            //fullscreen change listener
            function onSizeChanged(){
                adPlayer.resize(
                    OO.Pulse.AdPlayer.Settings.SCALING.AUTO,
                    OO.Pulse.AdPlayer.Settings.SCALING.AUTO,
                    player.isFullscreen()
                );
            }

            // Get the HTML5 video element
            function getSharedElement() {
                return document.getElementById(player.id() + '_html5_api');
            }

            function readyForPreroll() {
                isFree = !!player.mediainfo && player.mediainfo.economics === 'FREE';
                if(isFree) {
                    firstPlay = false;
                    log('Video is marked as not ad-supported; ad session will not be requested');
                    return;
                }

                if(sessionStarted || isFree) {
                    return;
                }

                player.ads.startLinearAdMode();
                isInLinearAdMode = true;

                // Store content's metadata
                var mediaMetadata = player.mediainfo;

                // Save the player content
                playerSrc = player.currentSrc();

                if(readyForPrerollCallback) {
                    readyForPrerollCallback();
                } else {
                    // Init session with a combination of media and page level metadata
                    doInitSession(mediaMetadata, pageMetadata);
                    player.pulse.startSession(session);
                }

            }

            //Time update callback for videojs
            function timeUpdate(){
                if(sessionIsValid()) {
                    adPlayer.contentPositionChanged(player.currentTime());
                }
            }

            //Content ended listener for videojs
            function contentEnded() {
                if(pauseAdTimeout) {
                    clearTimeout(pauseAdTimeout);
                    pauseAdTimeout = null;
                }

                if(isFree) {
                    return;
                }

                postrollsPlaying = true;
                unregisterPlayerEventListeners();
                adPlayer.contentFinished();
            }

            //Content playback listener for videojs
            function contentPlayback(event){
                player.removeClass('vjs-pulse-hideposter');

                if(sessionIsValid()) {
                    adPlayer.contentStarted();
                }
            }

            //Register the relevant event listeners
            function registerPlayerEventListeners(){
                player.on('readyforpreroll',readyForPreroll);
                player.on('timeupdate', timeUpdate);
                player.on('contentended', contentEnded);
                player.on('playing', contentPlayback);
                player.on('fullscreenchange', onSizeChanged);
                player.on('volumechange', onVolumeChange);

                //Start checking for the player size
                resizeHandle = setInterval(onSizeChanged, 1000);
            }

            function unregisterPlayerEventListeners(){
                player.off('readyforpreroll', readyForPreroll);
                player.off('timeupdate', timeUpdate);
                player.off('contentended', contentEnded);
                player.off('contentplayback', contentPlayback);
                player.off('fullscreenchange', onSizeChanged);
                player.off('volumechange', onVolumeChange);
                clearInterval(resizeHandle);
            }

            function getQueryStringParams() {
                var params = {};
                var ps = [];

                try{
                    if(window){
                        if(window.top && window.top.location){
                            ps = window.top.location.search.split("&")
                        } else {
                            ps = window.location.search.split("&");
                        }
                    }
                } catch (e){
                    return ps;
                }


                if(ps && ps[0]){
                    ps[0] = ps[0].slice(1);
                }

                for (var i = 0; i < ps.length; i++) {
                    if (ps[i]) {
                        var p = ps[i].split(/=/);
                        params[p[0]] = p[1];
                    }
                }
                return params;
            }

            //Reset all the states to their original values
            function resetStates(){
                unregisterPlayerEventListeners();
                postrollsPlaying = false;
                prerollSlot = true;
                contentPaused = false;
            }

            /**
             * Default clickThrough handler
             * @param url
             */
            function openAndTrackClickThrough(url) {
                window.open(url);
                if(sessionIsValid()) {
                    adPlayer.adClickThroughOpened();
                }
            }

            //Detects if a mobile device is used. If that's the case the plugin will used a shared video
            //element to show ads
            function isMobile(){
                var check = false;
                (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
                return check;
            }

            function isAutoplaySupported() {
                // New behaviour
                if(typeof OO.Pulse.canAutoplay === 'function') {
                    return OO.Pulse.canAutoplay();
                }

                // Old behaviour
                return !isMobile();
            }

            /**
             * Remove null/undefined properties from an object
             * @param obj
             */
            function cleanObject(obj){
                for (var prop in obj){
                    if(obj[prop] === null || obj[prop] === undefined){
                        delete obj[prop];
                    }
                }
            }

            /**
             * Get the content metadata object from the session settings
             * @param sessionSettings
             * @returns {{category: *, contentForm: (*|string), id: *, contentPartner: *, duration: *, flags: *, tags: *, customParameters: *}}
             */
            function getContentMetadataFromSessionSettings(sessionSettings){
                var contentMetadata = {
                    category: sessionSettings.category,
                    contentForm: sessionSettings.contentForm,
                    id: sessionSettings.id,
                    contentPartner: sessionSettings.contentPartner,
                    duration: sessionSettings.duration,
                    flags: sessionSettings.flags,
                    tags: sessionSettings.tags,
                    customParameters: sessionSettings.customParameters

                };

                //Remove the empty elements for the SDK
                cleanObject(contentMetadata);

                return contentMetadata;
            }

            /**
             * Extract the request settings object needed by the Pulse SDK
             * @param sessionSettings
             * @returns {{height: *, width: *, maxBitRate: *, linearPlaybackPositions: *, nonlinearPlaybackPositions: *, insertionPointFilter: *, referrerUrl: *, linearSlotSize: *}}
             */
            function getRequestSettingsFromSessionSettings(sessionSettings) {
                var requestSettings = {
                    height: sessionSettings.height,
                    width: sessionSettings.width,
                    maxBitRate: sessionSettings.maxBitRate,
                    linearPlaybackPositions: sessionSettings.linearPlaybackPositions,
                    nonlinearPlaybackPositions: sessionSettings.nonlinearPlaybackPositions,
                    insertionPointFilter: sessionSettings.insertionPointFilter,
                    referrerUrl: sessionSettings.referrerUrl,
                    linearSlotSize: sessionSettings.linearSlotSize,
                    maxLinearBreakDuration: sessionSettings.maxLinearBreakDuration
                };

                requestSettings.width = requestSettings.width || player.width();
                requestSettings.height = requestSettings.height || player.height();

                // Remove the empty fields for the SDK
                cleanObject(requestSettings);

                return requestSettings;
            }

            /**
             * Init the Pulse session
             * @param contentMetadata content Metadata
             * @param requestSettings request Settings
             */
            function initSession(contentMetadata, requestSettings) {
                session = OO.Pulse.createSession(contentMetadata, requestSettings);
            }

            /**
             * Create the ad container div for the Pulse ad player
             */
            function createAdContainer(){
                // The adContainerDiv is the DOM of the element that will house
                // the ads and ad controls.
                vjsControls = player.getChild('controlBar');
                adContainerDiv =
                    vjsControls.el().parentNode.appendChild(
                        document.createElement('div'));
            }

            /**
             * Make sure the ad player gets the click events
             */
            function setPointerEventsForClick() {
                if(sharedElement){
                    document.getElementById(player.id()).style.pointerEvents ="none";
                    sharedElement.style.pointerEvents = "all";
                }
            }


            /**
             * Restores the pointer events to their defaults states
             */
            function removePointerEventsForClick() {
                if(sharedElement){
                    document.getElementById(player.id()).style.pointerEvents = "";
                    sharedElement.style.pointerEvents = "";
                }
            }


            //Ad player listener interface for the ad player
            var adPlayerListener = {
                startContentPlayback : function(){
                    if(sharedElement){
                        sharedElement.style.display = 'block'; // Make sure the shared element is visible
                    }
                    firstPlay = false;
                    if(prerollSlot && !contentPaused){
                        player.trigger("nopreroll");
                    }

                    player.ads.endLinearAdMode();
                    if(!postrollsPlaying) {
                        log('Playing; ending linear ad mode with state ' + player.ads.state);
                        isInLinearAdMode = false;
                    }

                    vjsControls.show();
                    removePointerEventsForClick();
                    player.play();
                },
                pauseContentPlayback : function(){
                    contentPaused = true;
                    player.pause();
                    vjsControls.hide();

                    log('Paused; starting linear ad mode with state ' + player.ads.state);
                    player.ads.startLinearAdMode();

                    setPointerEventsForClick();
                    isInLinearAdMode = true;
                },
                illegalOperationOccurred : function(msg){
                    //not needed
                },
                openClickThrough : function(url){
                    openAndTrackClickThrough(url);
                },
                sessionEnded: function(){
                    // Do not exit linear ad mode on mobile after postrolls or the content will restart
                    log('Session ended; ending linear ad mode with state ' + player.ads.state);
                    player.ads.endLinearAdMode();
                    if(!sharedElement){
                    } else {
                        sharedElement.style.display = "block";
                    }

                    vjsControls.show();
                    session = null;
                    removePointerEventsForClick();
                    //Reset the plugin state
                    resetStates();

                    // if mobile: advance playlist if necessary, plus incorporate video replay hack
                    if(isMobile()) {
                        if(player.playlist) {
                            var videoCount = player.playlist().length;
                            if(player.playlist.currentItem() !== videoCount - 1) {
                                player.playlist.currentItem(player.playlist.currentItem() + 1);
                            }
                        }
                    }
                }
            }
        })(this);
    };

    vjs.plugin('pulse', pulsePlugin);
})(window.videojs);