/*
 *
 * @author Peter Vanco <petervanco@petervanco.sk>
 *
 */

registerPlugin({
    name: 'PersonalizedWelcomeSound',
    version: '1.0',
    description: 'This script will let the bot greet with a track depending on nick and resume the last track or stream. Based on WelcomeMessage from TS3index.com',
    author: 'Peter Vanco <petervanco@petervanco.sk>; TS3index.com <info@ts3index.com>',
    vars: [
        {
            name: 'channelId',
            title: 'Default Channel (Lobby):',
            type: 'channel',
            placeholder: 'Channel ID'
        },
        {
            name: 'welcometrack',
            title: 'Add welcome track for a nick:',
            type: 'array',
            vars: [
                {
                    name: 'track',
                    title: 'Sound File:',
                    type: 'track',
                    placeholder: 'Search for track...'
                },
                {
                    name: 'nickname',
                    title: 'Nick (case insensitive):',
                    type: 'string',
                    placeholder: 'John'
                }
            ]
        },
        {
            name: 'defaulttrack',
            title: 'Default track (nick not recognized):',
            type: 'track',
            placeholder: 'Search for track...'
        },
        {
            name: 'kickunknown',
            title: 'Kick unknown clients',
            type: 'checkbox'
        },
        {
            name: 'resume',
            title: 'Resume last track or stream after welcomesound',
            type: 'checkbox'
        }
    ]
}, function (sinusbot, config) {
    var engine = require('engine');
    var backend = require('backend');
    var event = require('event');
    var media = require('media');
    var audio = require('audio');

    var check = function (member) {
        if (typeof member == 'undefined')
            return false;
        else
            return member;
    }

    if (!config || typeof config.channelId == 'undefined' || !config.channelId) {
        engine.log("Channel settings invalid. Script not loaded.");
        return;
    }
    for (var i_welcome = 0; i_welcome < config.welcometrack.length; i_welcome++) {
        if (!check(config.welcometrack[i_welcome].nickname) || !check(config.welcometrack[i_welcome].track)) {
            engine.log("Track settings invalid. Script not loaded.");
            return;
        }
    }
    if (isNaN(config.channelId)) {
        if (engine.isRunning() && backend.isConnected()) {
            engine.log("No valid Channel ID, search Channel...");
            var channel = backend.getChannelByName(config.channelId);
            if (typeof channel == 'undefined' || channel.id() < 1) {
                engine.log("No Channel found, Settings invalid. Script not loaded.");
                return;
            } else {
                engine.log("Channel '" + channel.name() + "' with ID '" + channel.id() + "' found, Settings updated.");
                config.channelId = channel.id();
                engine.saveConfig(config);
            }
        } else {
            engine.log("No valid Channel ID and Instance is not running. Script not loaded.");
            return;
        }
    }

    var resumePlayback = false;
    var resumeTrack = false;
    var resumePlaylist = false;
    var resumePos = 0;
    var securejoin = true;
    var clientToKick = null;

    var getUUID = function (url) {
        var match = url.match(/track:\/\/(\.)?(.[^/:]+)/i);
        if (match != null && match.length > 2 && typeof match[2] === 'string' && match[2].length > 0)
            return match[2];
        else
            return null;
    }

    var welcome = function (track) {
        var currentTrack = check(media.getCurrentTrack());
        if (config.resume && audio.isPlaying() && currentTrack && (check(currentTrack.id()) || check(currentTrack.Type()) == 'url') && (check(currentTrack.id()) != getUUID(track.url))) {
            resumePlayback = true;
            resumePos = check(audio.getTrackPosition());
            resumeTrack = currentTrack;
            resumePlaylist = (check(media.getActivePlaylist())) ? check(media.getActivePlaylist().id()) : false;
        } else if (resumePlayback) {
            securejoin = false;
        }
        media.playURL(track.url + '&callback=personalizedwelcomesound&copy=true');
    }

    event.on('clientMove', function (ev) {
        if (!backend.isConnected()) return;
        if (ev.client.isSelf()) return;
        if (typeof ev.toChannel == 'undefined') return;

        if (ev.toChannel.id() == config.channelId && backend.getCurrentChannel().id() == config.channelId) {
            engine.log("Looking for welcome message for client " + ev.client.nick());
            for (var i_welcome = 0; i_welcome < config.welcometrack.length; i_welcome++) {
                if (config.welcometrack[i_welcome].nickname.toUpperCase() == ev.client.nick().toUpperCase()) {
                    engine.log("Welcoming client " + ev.client.nick());
                    welcome(config.welcometrack[i_welcome].track)
                    return
                }
            }
            engine.log("No welcome message for client " + ev.client.nick() + ". Using default, if defined.");
            if (check(config.defaulttrack)) {
                if (config.kickunknown) {
                    clientToKick = ev.client
                    engine.log("Scheduling client kick");
                }
                welcome(config.defaulttrack)
            }
        } else {
            engine.log("Not in the right channel");
        }
    });

    event.on('trackEnd', function (ev, callback) {
        if (check(callback) == 'personalizedwelcomesound' && clientToKick != null) {
            engine.log("Kicking client");
            clientToKick.kickFromServer("Surprise!")
            clientToKick = null
        }
        if (check(callback) == 'personalizedwelcomesound' && resumePlayback) {
            if (securejoin && resumeTrack) {
                engine.log("Resume last track: " + check(resumeTrack.Title()));
                resumePlayback = false;
                if (check(resumeTrack.Type()) == 'url' && check(resumeTrack.Filename())) {
                    media.playURL(resumeTrack.Filename());
                } else if (check(resumeTrack.id())) {
                    audio.setMute(true);
                    if (resumePlaylist) media.getPlaylistByID(resumePlaylist).setActive();
                    media.playURL("track://" + resumeTrack.id());
                    audio.seek(resumePos);
                    audio.setMute(false);
                }
            }
            securejoin = true;
        }
    });
});