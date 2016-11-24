# Getting Started with Brightcove Player

>:warning: To integrate, you must have a Brightcove Player v5.x up and running on your site, as well as an Ooyala Pulse account and a unique ID (pulseHost).

To get started with the integration and configure your Pulse hostname and additional page- or player-level metadata, there are two possible ways:

## <a name="bc-studio"></a>Through Brightcove Studio (Videocloud or Perform):

1. In Brightcove Studio, locate the player you want to configure and click Edit.

1. In the next page, find the Plugins section and click Edit.

1. In the next page, click _JavaScript_ and include the following source files in addition to your Brightcove embed code:
  - https://service.videoplaza.tv/proxy/pulse-sdk-html5/2.1/latest.min.js - _The Pulse SDK_
  - https://service.videoplaza.tv/proxy/pulse-sdk-html5-skin/base.min.js - _The Pulse SDK AdPlayer skin (if desired)_
  - https://service.videoplaza.tv/proxy/pulse-sdk-html5-bridges/videojs/2/latest.min.js - _The Pulse plugin for the Brightcove video player_
  - videojs.ads.js - _The videojs ad manager plugin, available on [GitHub](https://github.com/videojs/videojs-contrib-ads)_, which you need to host yourself (Our plugin v2 should be used with contrib-ads v4.x).

  **https** may be substituted for **http** if required, or omitted (like `//url.to.file`) to automatically use the protocol of the current site.

  > The files can also be added to the page itself like for a standard videoJS integration. See [Getting Started with VideoJS](videojs-getting-started.md).

1. In the Plugins page, click _Name, Options (JSON)_, enter the name `pulse`, and then provide your Pulse hostname and optional page-level metadata in JSON format:
  ```
  {
    "pulseHost": "http://pulse-demo.videoplaza.tv",
    "metadata": {
      "category": "skip-always"
    }
  }
  ```
  See [Plugin Options and Session Settings](options-settings.md) for all possible options you can set.

1. Click Save.

The plugin is automatically initiated when your player loads. No additional code is needed on the client side.

## Through script directly on page-level:

1. Include the same libraries in the same way as described above ([Through Brightcove Studio](#bc-studio)), or in the head of the page, in the same order as listed above.

2. Create a script on the page that listens for the player `ready` event and initialize the plugin there:
  ```
  function loadPlayers() {
    // Note that this has not been tested with multiple players
    var readyPlayers = videojs.getPlayers();
    for(var id in readyPlayers) {
      var player = readyPlayers[id];
      player.ready(function() {
        player.pulse({
          pulseHost: 'http://pulse-demo.videoplaza.tv',
          metadata: {
            tags: [ 'standard-linears' ],
            category: 'skip-always'
          }
        });
      });
    }
  }

  document.addEventListener('DOMContentLoaded', loadPlayers);
  ```
  See [Plugin Options and Session Settings](options-settings.md) for all possible options you can set.

## Configure Metadata on Video Items in Brightcove Studio (Videocloud or Perform)

On your video items in Brightcove Studio, the following custom metadata is read by the Pulse plugin if available:

| Name       	| Legacy name 	| Sample input                     	| Description                      	|
|------------	|-------------	|----------------------------------	|----------------------------------	|
| pulse_tags    | vpTags       	| sports,soccer,europe            	| Matched against tag targeting rules set up in Pulse; comma separated.  	|
| pulse_flags	| vpFlags      	| noprerolls,nocom*                   	| Prevents certain ad types from being served; comma separated.|
| pulse_max_linear_break_duration	| none      	| 15                	| Maximum linear ad break duration in seconds.|
| pulse_category| vpCategory   	| sports                         	| Selects alternate ad insertion policies configured in Pulse.	|
| pulse_content_partner| vpContentPartner|                          |                                  	|
| pulse_content_form| vpContentForm	| shortForm _or_ longForm               | Selects ad insertion policies configured in Pulse for short/long form content.	|

:bulb: Additionally, cue points of type _ad_, with a name of either `vpspot` or `pulse_spot` are used to trigger midroll ads, and tags provided under the _Video Information_ section in Brightcove Studio are merged with values from `pulse_tags` metadata set on the individual video items.

_*Full list of available flags:_
- **noprerolls**: do not serve preroll ads
- **nomidrolls**: do not serve midroll ads
- **nopostrolls**: do not serve postroll ads
- **nocom**: do not serve any ads


## API Docs
The full API docs are available in the [API Documentation](videojs-pulse.md).
