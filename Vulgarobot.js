/*
 * 
 * @author Peter Vanco <petervanco@petervanco.sk>
 * 
 */

registerPlugin({
    name: 'Vulgarobot',
    version: '1.0',
    description: 'Says a random mutation in defined intervals',
    author: 'Peter Vanco <petervanco@petervanco.sk>',
    vars: [
        {
            name: 'names',
            title: 'Names (comma separated):',
            type: 'string',
            placeholder: 'John, Joe'
        },
        {
            name: 'joinword',
            title: 'Join word:',
            type: 'string',
            placeholder: 'is'
        },
        {
            name: 'words',
            title: 'Words:',
            type: 'string',
            placeholder: 'is'
        },
        {
            name: 'interval',
            title: 'Interval (in seconds):',
            type: 'number',
            placeholder: 600
        }
    ]
}, function (sinusbot, config) {
    var engine = require('engine');
    var backend = require('backend');

    if (!config
        || typeof config.names == 'undefined' || !config.names
        || typeof config.joinword == 'undefined' || !config.joinword
        || typeof config.words == 'undefined' || !config.words
        || typeof config.interval == 'undefined' || !config.interval) {
        engine.log("Settings invalid. Script not loaded.");
        return;
    }

    var names = config.names.split(',');
    var words = config.words.split(',');

    engine.log("Got " + names.length + " names and " + words.length + " words");

    var interval = config.interval * 1000;
    if (interval < 1000) {
        interval = 30000;
    }

    setInterval(function () {

        if (backend.getCurrentChannel().getClientCount() < 2) {
            return;
        }

        var randomName = names[Math.floor(Math.random() * names.length)];
        var randomWord = words[Math.floor(Math.random() * words.length)];

        var sentence = randomName + " " + config.joinword + " " + randomWord;
        sentence = sentence.replace(/\s\s+/g, ' ');

        engine.log("Saying: " + sentence);
        // backend.chat(sentence);
        sinusbot.say(sentence, "sk");

    }, interval);

});
