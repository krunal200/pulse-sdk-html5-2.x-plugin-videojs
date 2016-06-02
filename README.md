# Ooyala Pulse plugin for Brightcove

**These are pre-release instructions and do not necessarily reflect the final setup procedure for the Brightcove/Pulse plugin!**

## Environment setup
Either in your HTML source (using `<script>` tags), or in your player configuration in Brightcove Videocloud, under _Plugins, JavaScript_, include the following source files in addition to your Brightcove embed code:

- https://service.videoplaza.tv/proxy/pulse-sdk-html5/2.1/latest.min.js - _The Pulse SDK_
- https://service.videoplaza.tv/proxy/pulse-sdk-html5-skin/base.min.js - _The Pulse SDK AdPlayer skin (if desired)_
- https://service.videoplaza.tv/proxy/pulse-sdk-html5-bridges/brightcove/latest.min.js - _The Pulse plugin for the Brightcove video player_
- videojs.ads.js - _The videojs ad manager plugin, available on [GitHub](https://github.com/videojs/videojs-contrib-ads)_, which you will need to host yourself.

**https** can naturally be substituted for **http** if required, or omitted (like `//url.to.file`) to automatically use the protocol of the current site.

The exact order in which these files need to be included has not yet been determined; at minium, videojs.ads.js must be loaded *after* the player has been loaded. If added as a player plugin in Videocloud, this will be the case.

## Initiate the plugin

### Easy way _(not guaranteed to work 100% on mobile in this pre-release version_):

In your Videocloud player configuration, under _Name, Options (JSON)_, enter the name `pulse`, and then provide your Pulse hostname and optional page-level metadata in JSON format:
```
{
  "pulseHost": "http://pulse-demo.videoplaza.tv",
  "metadata": {
    "category": "skip-always"
  }
}
```

The plugin will be automatically initiated when your player loads.

### Page-level way:

Listen for the player `ready` event and initialize the plugin there:
```
function loadPlayers() {
	// Note that this has not been tested with multiple players
    var readyPlayers = videojs.getPlayers();
    for(var id in readyPlayers) {
        var player = readyPlayers[id];
        player.ready(function() {
            player.pulse({
                pulseHost: 'http://pulse-demo.videoplaza.tv',
                playerId: id,
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

## Configure your metadata

On your media items in Videocloud, the following custom metadata will be picked up by the plugin if available:

| Name       	| Legacy name 	| Sample input                     	| Description                      	|
|------------	|-------------	|----------------------------------	|----------------------------------	|
| pulse_tags    | vpTags       	| sports,soccer,europe            	| Matched against tag targeting rules set up in Pulse; comma separated.  	|
| pulse_flags	| vpFlags      	| nopre,nocom*                   	| Prevents certain ad types from being served; comma separated.|
| pulse_category| vpCategory   	| sports                         	| Selects alternate ad insertion policies configured in Pulse.	|
| pulse_content_partner| vpContentPartner|                          |                                  	|
| pulse_content_form| vpContentForm	| short _or_ long               | Selects ad insertion policies configured in Pulse for short/long form content.	|

Additionally, cue points of type _ad_, with a name of either `vpspot` or `pulse_spot` will be used to trigger midroll ads, and tags provided under the _Video Information_ section in Videocloud will be concatenated with `pulse_tags`.

_*Full list of available flags:_
- **nopre**: do not serve preroll ads
- **nomid**: do not serve midroll ads
- **nopost**: do not serve postroll ads
- *..to be continued*