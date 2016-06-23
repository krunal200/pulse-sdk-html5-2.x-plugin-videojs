# Getting Started with VideoJS

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

1. Optionally, load the Pulse ad player skin  on the page with your VideoJS player, to show a default skin containing control buttons for the ad player.
  ```
  <script type="text/javascript" src="my_pulse_account.videoplaza.tv/proxy/pulse-sdk-html5-skin/base.min.js"></script>
  ```
  >The skin for the ad player is located at [HTML5 Ad Player Skins](https://github.com/ooyala/pulse-sdk-html5-2.x-skins).

1. Initialize the plugin, passing in the options, which is an object containing:
  - your Pulse global settings,
  - the Pulse session settings,
  - and any parameters to  pass to the videojs-contrib-ads plugin.

  The **pulseHost** parameter in the options is mandatory. See [Plugin Options and Session Settings](options-settings.md) for all possible options you can set.

  ```
  myVideoJSPlayer.pulse({ pulseHost: "http://my-pulse-host.videoplaza.tv",  deviceContainer: deviceContainer, persistendId: persistentId, playerId: myVideoJSId});
  ```

## API Docs
The full API docs are available in the [wiki](https://github.com/ooyala/pulse-sdk-html5-2.x-plugin-videojs/wiki/API-Docs).
