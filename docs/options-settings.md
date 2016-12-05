# Plugin Options and Session Settings

## <a name="plugin-options"></a>Plugin options

The plugin options object is a combination of Pulse global settings, Pulse metadata related to the selected video and any additional parameters to pass to the videojs-contrib-ads plugin.

* `pulseHost` : &lt;string\> Full hostname of the Ooyala Pulse account to use.
* `deviceContainer` : &lt;string\> Ooyala Pulse device container. It is recommended to set this parameter to `null`.
* `persistentId` : &lt;string\> Ooyala Pulse persistent id; used for unique user tracking.
* `metadata` : &lt;object> An object containing the session settings as described under [Session Settings](#session-settings). When integrating with the Brightcove Player, these settings are combined with the metadata set for each video item in Brightcove Studio.
* `contrib-ads-options` : &lt;object> An object containing the parameters to pass to the videojs-contrib-ads plugin, see [videojs-contrib-ads](https://github.com/videojs/videojs-contrib-ads) for more information.
* `hidePoster` : &lt;Boolean> If true, the video poster and title will be hidden until the first time the content plays, after prerolls. Useful if you have implemented your own autoplay solution.
* `debug` : &lt;Boolean> If true, the plugin and Pulse SDK will output debug info to the console

## <a name="session-settings"></a>Session settings

The session settings object is a combination of contentMetadata and requestSettings, used by the Pulse SDK. You can see the description of the content metadata and request settings [here](http://pulse-sdks.ooyala.com/pulse-html5/latest/OO.Pulse.html).

* `category` : &lt;string\> Content category is used by Ooyala Pulse to target ads and determine the ad insertion policy. The content category is represented by either its unique id or one of its aliases set in Ooyala Pulse.
* `contentForm` : &lt;[OO.Pulse.ContentForm](http://pulse-sdks.ooyala.com/pulse-html5/latest/OO.Pulse.html#.ContentForm)> Content form is used to determine the ad insertion policy.
* `id` : &lt;string>  Ooyala Pulse content id. Id is used to identify the content to third parties.
* `contentPartner`: &lt;string> Ooyala Pulse content partner. Content partners can be used by Ooyala Pulse to target ads. The content partner is represented by either its unique id or one of its aliases set in Ooyala Pulse.
* `duration`: &lt;number>  The duration of the content selected by the viewer. This value cannot be negative.
* `flags` : &lt;string[]> Ooyala Pulse flags. Because flags override Ooyala Pulse's ad insertion policy, they should be used with caution. For more information talk to your contact at Ooyala. Supported flags: nocom, noprerolls, nomidrolls, nopostrolls, nooverlays, noskins.
* `tags` : &lt;string[]> Ooyala Pulse content tags, used to target specific ads.
* `customParameters`: &lt;object>  The custom parameters to add to the session request. Parameters with names containing invalid characters are omitted. These custom parameters are added to the ad server request URL in the style of "cp.[parameter_name]=[parameter_value]".
* `height` : &lt;number>  Height in pixels of the video area where ads should be shown.
* `maxBitRate` : &lt;number>  The maximum bitrate of the media files in the ad response.
* `maxLinearBreakDuration` : &lt;number>  The maximum length (in seconds) of linear ad breaks.
* `linearPlaybackPositions` : &lt;number[]> An array of numbers which defines at what points in time linear ads should be shown.
* `nonlinearPlaybackPositions`: &lt;number[]>  An array of numbers which defines at what points in time non-linear ads should be shown.
* `insertionPointFilter` : &lt;[OO.Pulse.InsertionPointType](http://pulse-sdks.ooyala.com/pulse-html5/latest/OO.Pulse.html#.InsertionPointType)>  If not set, the request is for every kind of insertion point. If set, only the types provided are requested.
* `width` : &lt;number>  Width in pixels of the video area where ads should be shown.
* `referrerUrl` : &lt;string>  Overrides the HTTP header's referrer property.
* `linearSlotSize` : &lt;number>  Overrides the number of linear ads per slot. Using this affects the predictability of the Ooyala Pulse forecast functionality. Use with caution.
