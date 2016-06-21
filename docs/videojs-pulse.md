# API Documentation

## Initialisation
Given `player` as a VideoJS player instance:
```
var player = videojs('vjsVideo');
```


### player.pulse(options, readyForPrerollCallback, adClickedCallback)

Initializes the plugin for the given player.

 * **Parameters:**
   * `options` - Plugin options. See the [Plugin Options and Session Settings](options-settings.md) file for their description.
   * `readyForPrerollCallback` - called when prerolls are ready to play. If not set, the ad player automatically starts the session.
   * `adClickedCallback` - called when an ad is clicked. If null the plugin automatically opens the clickthrough URL and tracks the clickThrough event. The  clickthrough URL is passed as parameter in the method (see the [Customizing Your VideoJS or Brightcove Player Integration](player-customization.md) file for an example)

## Properties of player.pulse

### `adPlayer`

The Ooyala Pulse ad player controller. To get the full ad player SDK, check out the [SDK documentation](http://pulse-sdks.ooyala.com/pulse-html5/latest/index.html).

## Methods of player.pulse

### `initSession(sessionSettings)`

Initialize a new session. The plugin automatically initializes the session, but the method should be called if you need to override the [Session Settings](options-settings.md#session-settings). The main use case is when the player loads the next video from a playlist. See [Customizing Your VideoJS or Brightcove Player Integration](player-customization.md) for an example.

 * **Parameters:** `sessionSettings`  — The session settings list is available in the [Session Settings](options-settings.md#session-settings) file.

### `startSession(session)`

Start a new ad session. This method should only be useful if you provide your own readyForPrerollCallback method to the plugin. Otherwise the plugin automatically starts the session when the content starts.
 * **Parameters:** `sesssion` - The session to start.

### `addEventListener(event, callback)`

Add an event listener to the Pulse ad player to access event data or to add your own logic to the event handling. All ad player events are listed [here](http://pulse-sdks.ooyala.com/pulse-html5/latest/OO.Pulse.AdPlayer.Events.html).

 * **Parameters:**
   * `event` — to listen to
   * `callback` — function

For example:
```
myVideoJSPlayer.pulse.addEventListener(OO.Pulse.AdPlayer.Events.LINEAR_AD_STARTED, function(event, eventData){
 var currentAd = eventData.ad;
 });
```

### `removeEventListener(event, callback)`

Remove an event listener.

 * **Parameters:**
   * `event` — player event
   * `callback` — to remove

### `destroy()`

Destroy the plugin and the ad player. Call this method in case the page is also used to display other content where you no longer need the VideoJS player and the player is removed from the page.

### `stopSession()`

Stop the ad session. No more ads will be displayed in the video.

### `isInLinearAdMode()`

Know if the ad player is currently in a linear ad break

 * **Returns:** `Boolean`
