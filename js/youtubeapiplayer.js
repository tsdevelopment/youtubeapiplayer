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
             * Document instance
             */
                $document = $(document),

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
                playProgressBarNode = container.find('.playprogress-bar'),

            /**
             * Playprogress
             */
                playProgressNode = container.find('.playprogress'),
            
            /**
             * Bufferprogress
             */
                bufferProgressNode = container.find('.bufferprogress'),
            
            /**
             * Current time
             */
                currentTimeNode = container.find('.current-time'),
            
            /**
             * Remaining time
             */
                remainingTimeNode = container.find('.remaining-time'),
            
            
            /**
             * VolumeBar container.
             */
                volumeBarNode = container.find('.volume-bar'),
                
            /**
             * Volume slider.
             */
                volumeSliderNode = container.find('.volume-slider'),
            
            /**
             * Available quality levels list.
             */
                availableQualityLevelsNode = container.find('.availableQualityLevels'),
            
            /**
             * Relation from quality levels to name in menu.
             */
                gQualityLevels = {
                    hd1080: '1080pHD',
                    hd720: '720pHD',
                    large: '480p',
                    medium: '360p',
                    small: '240p',
                    tiny: '144p'
                },

            /**
             * Merged configuration.
             */
                config = $.extend({}, {
                    height: '390',
                    width: '640',
                    videoId: 'M7lc1UVf-VE',
                    volume: 100,
                    wmode: 'opaque',
                    onReady: function (e) {},
                    onStateChange: function () {},
                    onPlaybackQualityChange: function () {},
                    onPlaybackRateChange: function () {},
                    onError: function () {},
                    onApiChange: function () {}
                }, settings),

            /**
             *
             */
                requestAnimationFrame = (function () {
                    return window.requestAnimationFrame     ||
                        window.webkitRequestAnimationFrame  ||
                        window.mozRequestAnimationFrame     ||
                        window.oRequestAnimationFrame       ||
                        window.msRequestAnimationFrame      ||
                        function (callback) {
                            window.setTimeout(callback, 1000 / 60);
                        };
                }()),

            /**
             *
             */
                secondsToTimeCode = function (time, forceHours, showFrameCount, fps) {
                    //add framecount
                    if (typeof showFrameCount === 'undefined') {
                        showFrameCount = false;
                    } else if (typeof fps === 'undefined') {
                        fps = 25;
                    }

                    var hours = Math.floor(time / 3600) % 24,
                        minutes = Math.floor(time / 60) % 60,
                        seconds = Math.floor(time % 60),
                        frames = Math.floor(((time % 1) * fps).toFixed(3)),
                        result = ((forceHours || hours > 0) ? (hours < 10 ? '0' + hours : hours) + ':' : '')
                                    + (minutes < 10 ? '0' + minutes : minutes) + ':'
                                    + (seconds < 10 ? '0' + seconds : seconds)
                                    + ((showFrameCount) ? ':' + (frames < 10 ? '0' + frames : frames) : '');

                    return result;
                },

            /**
             *
             */
                updateTimeDisplays = function (currentTime) {
                    currentTimeNode.text(secondsToTimeCode(currentTime));
                    remainingTimeNode.text('-' + secondsToTimeCode(player.getDuration() - Math.floor(currentTime)));
                },

            /**
             * Update play progress bar, time displays.
             */
                updatePlayProgress = function () {
                    var currentTime = player.getCurrentTime(),
                        duration = player.getDuration();

                    playProgressNode.css('width', currentTime / duration * 100 + '%');
                    updateTimeDisplays(currentTime);

                    if (player.getPlayerState() === YT.PlayerState.PLAYING) {
                        requestAnimationFrame(updatePlayProgress);
                    }
                },

            /**
             * Update buffe rprogress bar.
             */
                updateBufferProgress = function () {
                    var progress = Math.round(player.getVideoLoadedFraction() * 100);
                    bufferProgressNode.css('width', progress + '%');

                    if (player.getPlayerState() === YT.PlayerState.PLAYING && progress < 100) {
                        requestAnimationFrame(updateBufferProgress);
                    }
                },

            /**
             * blocks marking text
             */
                blockTextSelection = function () {
                    document.body.focus();
                    document.onselectstart = function () { return false; };
                },

            /**
             * Enables mark text
             */
                unblockTextSelection = function () {
                    document.onselectstart = function () { return true; };
                },

            /**
             * Set Volume
             */
                updateVolume = function (e, volume) {
                    var pos,
                        maxPos = volumeBarNode.width() - volumeSliderNode.width();

                    if (e) {
                        if (e.type === 'mouseup') {
                            $document.off('.Youtubeapiplayer');
                            unblockTextSelection();
                        } else if (e.type === 'mousedown') {
                            blockTextSelection();

                            $document.on('mousemove.Youtubeapiplayer mouseup.Youtubeapiplayer', function (e) {
                                updateVolume(e);
                            });
                        }
    
                        pos = e.pageX - (volumeSliderNode.width() / 2) - volumeBarNode.offset().left;
                    } else {
                        pos = maxPos / 100 * volume;
                    }

                    if (pos >= 0 && pos <= maxPos) {
                        volumeSliderNode.css('margin-left', pos + 'px');
                        player.setVolume(100 / maxPos * pos);
                    }
                },

            /**
             * Update list of avalable quality levels.
             */
                updateAvailableQualityLevels = function () {
                    var qualityLevels = player.getAvailableQualityLevels(),
                        i,
                        listItems = [],
                        curQuality = player.getPlaybackQuality(),
                        quality;

                    availableQualityLevelsNode.children().remove();

                    for (i = 0; i < qualityLevels.length; i += 1) {
                        quality = qualityLevels[i];

                        listItems.push($('<li />', {
                            'text': gQualityLevels[quality],
                            'class': quality === curQuality ? 'active' : ''
                        }));
                    }

                    $.each(listItems, function (i, v) {
                        v.on('click', function (e) {
                            e.preventDefault();
                            player.setPlaybackQuality(qualityLevels[i]);
                        });

                        availableQualityLevelsNode.append(v);
                    });
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
                config.volume = player.getVolume();
                updateVolume(undefined, 0);
            };

            /**
             * Unmute video.
             */
            this.unmute = function () {
                player.unMute();
                updateVolume(undefined, config.volume);
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
                        playerVars: {
                            controls: 0,
                            wmode: config.wmode,
                            iv_load_policy: 3,
                            loop: 0,
                            modestbranding: 1,
                            rel: 0,
                            showinfo: 0
                        },
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

                                playProgressBarNode.on('mousedown', function () {
                                    var width           = playProgressBarNode.width(),
                                        allowSeekAhead  = false,
                                        doPlayAfterSeek = false;

                                    blockTextSelection();

                                    if (player.getPlayerState() === YT.PlayerState.PLAYING) {
                                        $this.pause();
                                        doPlayAfterSeek = true;
                                    }

                                    $document.on('mousemove.Youtubeapiplayer mouseup.Youtubeapiplayer', function (e) {
                                        var percentage  = e.offsetX / playProgressBarNode.width(),
                                            duration    = percentage * player.getDuration();

                                        if (e.type === 'mouseup') {
                                            $document.off('.Youtubeapiplayer');
                                            allowSeekAhead = true;

                                            if (doPlayAfterSeek) {
                                                $this.play();
                                            }

                                            unblockTextSelection();
                                        }

                                        if (percentage >= 0 && percentage <= 1 && e.pageX > playProgressBarNode.offset().left) {
                                            playProgressNode.css('width', percentage * 100 + '%');
                                            player.seekTo(duration, allowSeekAhead);
                                            updateTimeDisplays(duration);
                                        }
                                    });
                                });

                                volumeSliderNode.on('mousedown.Youtubeapiplayer', function () {
                                    updateVolume(e);
                                });

                                volumeBarNode.on('mousedown.Youtubeapiplayer', function (e) {
                                    updateVolume(e);
                                });

                                updateVolume(undefined, config.volume);

                                config.onReady();
                            },
                            onStateChange: function (e) {
                                switch (e.data) {
                                case YT.PlayerState.PLAYING:
                                    requestAnimationFrame(updatePlayProgress);
                                    requestAnimationFrame(updateBufferProgress);
                                    updateAvailableQualityLevels();
                                    break;
                                }

                                config.onStateChange(e);
                            },
                            onPlaybackQualityChange: function (e) {
                                updateAvailableQualityLevels();
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

            // Initialize the video.
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