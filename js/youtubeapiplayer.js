/*global window,console,document,$,Videoplayer,YT,setTimeout */

(function () {
    "use strict";

    /**
     * Script tage for youtubes external API script.
     */
    var tag = document.createElement('script'),

        /**
         * First javascript tag on page.
         */
        firstScriptTag = document.getElementsByTagName('script')[0],

        /**
         * Not initialized videoplayers: videos cannot be 
         * initialized until youtubes API is loaded.
         */
        notInitedVideoplayers = [],

        /**
         * Youtubes API status
         */
        apiLoaded = false,

        /**
         * Class for handling a youtube video.
         */
        Youtubeapiplayer = function (videoElementId, settings) {

            /**
             * Current video instance.
             */
            var $this = this,

            /**
             * Youtubes player object.
             */
                player = null,
                
            /**
             * Element around the youtube player object.
             */
                container = $('#' + videoElementId).parent(),
            
            /**
             * Playprogress bar
             */
                playProgressNode = container.find('.playprogress'),
                
            /**
             * Playprogress timer
             */
                playProgressTimer = null,

            /**
             * Merged configuration.
             */
                config = $.extend({}, {
                    height: '390',
                    width: '640',
                    videoId: 'M7lc1UVf-VE',
                    onReady: function (e) {},
                    onStateChange: function () {},
                    onPlaybackQualityChange: function () {},
                    onPlaybackRateChange: function () {},
                    onError: function () {},
                    onApiChange: function () {}
                }, settings),
                
                updatePlayProgressNode = function () {
                    playProgressNode.css('width', player.getCurrentTime() / player.getDuration() * 100 + '%');
                    playProgressTimer = setTimeout(updatePlayProgressNode, 33);
                };
            
            /**
             * Controls
             */
            this.controls = {
                controlPlay: container.find('.control-play'),
                controlPause: container.find('.control-pause'),
                controlStop: container.find('.control-stop'),
                controlMute: container.find('.control-mute'),
                controlUnmute: container.find('.control-unmute')
            };

            /**
             * Play video.
             */
            this.play = function () {
                player.playVideo();
                updatePlayProgressNode();
            };

            /**
             * Pause video.
             */
            this.pause = function () {
                player.pauseVideo();
            };

            /**
             * Stop video.
             */
            this.stop = function () {
                player.stopVideo();
            };

            /**
             * Mute video.
             */
            this.mute = function () {
                player.mute();
            };

            /**
             * Unmute video.
             */
            this.unmute = function () {
                player.unMute();
            };

            /**
             * Initialize video element, search for 
             * any buttons and give them their functions.
             */
            this.init = function () {
                if (!apiLoaded) {
                    notInitedVideoplayers.push(this);
                } else {
                    player = new YT.Player(videoElementId, {
                        height: config.height,
                        width: config.width,
                        videoId: config.videoId,
                        events: {
                            onReady: function (e) {
                                $this.controls.controlPlay.click(function (e) {
                                    e.preventDefault();
                                    $this.play();
                                });

                                $this.controls.controlPause.click(function (e) {
                                    e.preventDefault();
                                    $this.pause();
                                });

                                $this.controls.controlStop.click(function (e) {
                                    e.preventDefault();
                                    $this.stop();
                                });

                                $this.controls.controlMute.click(function (e) {
                                    e.preventDefault();
                                    $this.mute();
                                });

                                $this.controls.controlUnmute.click(function (e) {
                                    e.preventDefault();
                                    $this.unmute();
                                });

                                config.onReady();
                            },
                            onStateChange: function (e) {
                                config.onStateChange(e);
                            },
                            onPlaybackQualityChange: function (e) {
                                config.onPlaybackQualityChange(e);
                            },
                            onPlaybackRateChange: function (e) {
                                config.onPlaybackRateChange(e);
                            },
                            onError: function (e) {
                                config.onError(e);
                            },
                            onApiChange: function (e) {
                                config.onApiChange(e);
                            }
                        }
                    });
                }
            };

            /**
             * Initialize the video.
             */
            this.init();
        };

    /**
     * Add class to the window object for gobal 
     * access.
     */
    window.Youtubeapiplayer = Youtubeapiplayer;

    /**
     * Called when javascript code from youtube is 
     * loaded and ready for use.
     */
    window.onYouTubeIframeAPIReady = function () {
        apiLoaded = true;

        while (notInitedVideoplayers.length > 0) {
            var videoplayerObj = notInitedVideoplayers.shift();
            videoplayerObj.init();
        }
    };

    /**
     * Load youtubes player API
     */

    tag.src = "https://www.youtube.com/iframe_api";
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

}());