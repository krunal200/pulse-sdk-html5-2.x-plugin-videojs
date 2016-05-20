# Ooyala Pulse plugin for VideoJS


# Introduction
The VideoJS Pulse plugin makes it easy to create an integration between Ooyala Pulse for ad serving and your VideoJS player. The plugin is built on top of the Ooyala Pulse HTML5 ad player, which is part of [Ooyala's HTML5 Pulse SDK](http://pulse-sdks.ooyala.com/pulse-html5/latest/).


## Build
    npm install
    grunt

## Getting started

>:warning: To integrate, you must have a VideoJS player v5.x up and running on your site, as well as an Ooyala Pulse account and a unique ID (pulseHost).

1. Load the HTML5 Pulse SDK on the page with your VideoJS player.

 ```
 <script type="text/javascript" src="http://service.videoplaza.tv/proxy/pulse-sdk-html5/2.1/latest.min.js"></script>
 ```
 >:bulb: You can download and host this javascript library yourself, but it is recommended to load it from the described location to get all bug fixes and latest versions automatically.

1. Load the Pulse VideoJS plugin after the HTML5 Pulse SDK on the page with your VideoJS player. Use the videojs.pulse.js file in the src folder directly, or build the project first to use the minified version (videojs.pulse-x.x.x.min.js, where x.x.x is the version number) in the dist folder.

  ```
  <script type="text/javascript" src="http://your_hosting_location/videojs.pulse.js"></script>
  ```
  or
  ```
  <script type="text/javascript" src="http://your_hosting_location/videojs.pulse-x.x.x.min.js"></script>
  ```

1. Optionally, load the skin.js and the associated CSS file on the page with your VideoJS player, to show a default skin containing control buttons for the ad player.
  ```
  <script type="text/javascript" src="http://your_hosting_location/js/skin.js"></script>
  <link rel="stylesheet" type="text/css" href="http://your_hosting_location/css/skin.css" />
  ```
  The skin for the ad player is located at [HTML5 Ad Player Skins](https://github.com/ooyala/pulse-sdk-html5-2.x-skins), and all resources must be hosted on your site to use the skin.

1. Initialize the plugin, passing in the options, which is an object containing:
  - your Pulse global settings,
  - the VideoJS player ID,
  - and any parameters to  pass to the videojs-contrib-ads plugin.

  The **mandatory parameters** in the options are the **pulseHost** and the **playerId**. For more information about the options, see [Plugin options](#plugin-options).
  ```
  myVideoJSPlayer.pulse({ pulseHost: "http://my-pulse-host.videoplaza.tv",  deviceContainer: deviceContainer, persistendId: persistentId, playerId: myVideoJSId});
  ```

1. Use `initSession` to initialize a new ad session and associate ads with the content selected for playback by the viewer. The session settings to pass in include the tags and categories of your ads. (See the [Session Settings](#session-settings) section for more information about each parameter).
  ```
  myVideoJSPlayer.pulse.initSession(sessionSettings);
  ```

## Inserting a callback before ad session start

The default behavior of the plugin is to start an ad session when the content starts. This means that the player starts playing prerolls as soon as the content starts and prerolls are available.

If you do not want the player to start an ad session immediately when the content starts, you can provide a callback method when you initialize the plugin. For example:
```
myVideoJSPlayer.pulse(options, function(){ console.log("Ready for prerolls!"); });
```

This callback can be used with playlists as well, so a new session can be created and started before the next item in the playlist starts:
```
myVideoJSPlayer.pulse(options, function(){ 
  var session = myVideoJSPlayer.pulse.initSession(sessionSettings);
  myVideoJSPlayer.pulse.startSession(session);
 });
```

## Handling ad clickthrough behavior

By default, the plugin automatically pauses the ad player and opens the click through link when an ad is clicked by the viewer. However, if you want to override that behavior, a callback can be given to the plugin when it is created:
```
myVideoJSPlayer.pulse(options, null, function(clickThroughURL){ console.log("the ad was clicked!"});
```

If you open the clickthrough URL, be sure to call `adClickThroughOpened` on the plugin's `adPlayer` object to correctly track the event in Ooyala Pulse.
```
myVideoJSPlayer.pulse.adPlayer.adClickThroughOpened();
```

## Controlling the ad player

The [Pulse HTML5 ad player](http://pulse-sdks.ooyala.com/pulse-html5/latest/OO.Pulse.AdPlayerController.html) is a public property of the the plugin and can be controlled directly. For example:
```
myVideoJSPlayer.pulse.adPlayer.pause();
```

## <a name="plugin-options"></a>Plugin options

The plugin options object in the VideoJS plugin is a combination of Pulse global settings, the VideoJS player id and any additional parameters to pass to the videojs-contrib-ads plugin.

* `pulseHost` : Full hostname of the Ooyala Pulse account to use.
* `deviceContainer` : Ooyala Pulse device container. It is recommended to set this parameter to `null`.
* `persistentId` : Ooyala Pulse persistent id; used for unique user tracking.
* `contrib-ads-options` : parameters to pass to the videojs-contrib-ads plugin, see [videojs-contrib-ads](https://github.com/videojs/videojs-contrib-ads) for more information.
* `playerId` : player div id. This parameter is MANDATORY.


## <a name="session-settings"></a>Session settings

The session settings object in the VideoJS plugin is a combination of contentMetadata and requestSettings, used by the Pulse SDK. You can see the description of the content metadata and request settings [here](http://pulse-sdks.ooyala.com/pulse-html5/latest/OO.Pulse.html).

* `category` : &lt;string\> Content category is used by Ooyala Pulse to target ads and determine
    the ad insertion policy. The content category is represented by either its unique id or one
    of its aliases set in Ooyala Pulse.
* `contentForm` : &lt;[OO.adrequest.AdRequester.ContentForm](http://pulse-sdks.ooyala.com/html5_2/latest/videoplaza.adrequest.AdRequester.html#toc4__anchor)>  Content form is used to determine the ad insertion policy.
* `id` : &lt;string>  Ooyala Pulse content id. Id is used to identify the content to third parties.
* `contentPartner`: &lt;string>  Ooyala Pulse content partner. Content partners can be used by
    Ooyala Pulse to target ads. The content partner is represented by either its unique id or one of its
    aliases set in Ooyala Pulse.
* `duration`: &lt;number>  The duration of the content selected by the viewer. This value cannot be negative.
* `flags` : &lt;string[]>  Ooyala Pulse flags. Because flags override Ooyala Pulse's ad insertion policy, they
    should be used with caution. For more information talk to your contact at Ooyala. Supported flags:
    nocom, noprerolls, nomidrolls, nopostrolls, nooverlays, noskins.
* `tags` : &lt;string[]>   Ooyala Pulse content tags, used to target specific ads.
* `customParameters`: &lt;object>  The custom parameters to add to the
    session request. Parameters with names containing invalid characters are omitted.
    These custom parameters are added to the ad server request URL in the style
    of "cp.[parameter_name]=[parameter_value]".
* `height` : &lt;number>  Height in pixels of the video area where ads should be shown.
* `maxBitRate` : &lt;number>  The maximum bitrate of the media files in the ad response.
* `linearPlaybackPositions` : &lt;number[]> An array of numbers which defines at what points in time linear ads should be shown.
* `nonlinearPlaybackPositions`: &lt;number[]>  An array of numbers which defines at what points in time non-linear ads should be shown.
* `insertionPointFilter` : &lt;[OO.adrequest.AdRequester.InsertionPointType](http://pulse-sdks.ooyala.com/html5_2/latest/videoplaza.adrequest.AdRequester.html#toc5__anchor)>  If not set, the request is for every kind of insertion point. If set, only the types provided are requested. See [link](http://pulse-sdks.ooyala.com/html5_2/latest/videoplaza.adrequest.AdRequester.html#toc5__anchor) for possible values.
* `width` : &lt;number>  Width in pixels of the video area where ads should be shown.
* `referrerUrl` : &lt;string>  Overrides the HTTP header's referrer property.
* `linearSlotSize` : &lt;number>  Overrides the number of linear ads per slot. Using this affects the predictability of the Ooyala Pulse forecast functionality. Use with caution.

# API Docs
The full API docs are available in the [wiki](https://github.com/ooyala/pulse-sdk-html5-2.x-plugin-videojs/wiki/API-Docs).
