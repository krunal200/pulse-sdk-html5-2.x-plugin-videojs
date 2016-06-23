# Customizing Your VideoJS or Brightcove Player Integration

## Inserting a callback before ad session start

The default behavior of the plugin is to start an ad session when the content starts. This means that the player starts playing prerolls as soon as the content starts and prerolls are available.

If you do not want the player to start an ad session immediately when the content starts, you can provide a callback method when initializing the plugin. For example:
```
myPlayer.pulse(options, function(){ console.log("Ready for prerolls!"); });
```

This callback can be used with playlists as well, so a new session can be created and started before the next item in the playlist starts:
```
myPlayer.pulse(options, function(){
  var session = myPlayer.pulse.initSession(sessionSettings);
  myPlayer.pulse.startSession(session);
 });
```
In this case, you initiate and start the session yourself, and provide the [Session Settings](options-settings.md#session-settings) which should change with each new video started from the playlist.

## Handling ad clickthrough behavior

By default, the plugin automatically pauses the ad player and opens the click through link when an ad is clicked by the viewer. However, if you want to override that behavior, a callback can be given to the plugin when it is created:
```
myPlayer.pulse(options, null, function(clickThroughURL){ console.log("the ad was clicked!"});
```

If you open the clickthrough URL, be sure to call `adClickThroughOpened` on the plugin's `adPlayer` object to correctly track the event in Ooyala Pulse.
```
myPlayer.pulse.adPlayer.adClickThroughOpened();
```

## Controlling the ad player

The [Pulse HTML5 ad player](http://pulse-sdks.ooyala.com/pulse-html5/latest/OO.Pulse.AdPlayerController.html) is a public property of the the plugin and can be controlled directly. For example:
```
myPlayer.pulse.adPlayer.pause();
```
