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