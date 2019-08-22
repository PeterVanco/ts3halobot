/*
 * 
 * @author Peter Vanco <petervanco@petervanco.sk>
 * 
 */

registerPlugin({
    name: 'SentenceBot',
    version: '2.0',
    description: 'Says a random sentence mutation in defined intervals',
    author: 'Peter Vanco <petervanco@petervanco.sk>',
    vars: [
        {
            name: 'sentences',
            title: 'Sentences:',
            type: 'array',
            vars: [
                {
                    name: 'parts',
                    title: 'Sentence parts:',
                    type: 'array',
                    vars: [
                        {
                            name: 'words',
                            title: 'Words:',
                            type: 'multiline',
                            placeholder: 'word\nanother'
                        }
                    ]                
                }
            ]
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

    if (!config) {
        engine.log("Settings invalid. Script not loaded.");
        return;
    }

    var cache = [];
    for (var i_sentences = 0; i_sentences < config.sentences.length; i_sentences++) {
        cache[i_sentences] = [];
        for (var i_parts = 0; i_parts < config.sentences[i_sentences].parts.length; i_parts++) {
            if (typeof config.sentences[i_sentences].parts[i_parts].words == 'undefined' || !config.sentences[i_sentences].parts[i_parts].words) {
                continue;
            }
            engine.log("Adding: [" + i_sentences + "][" + i_parts + "] = " + config.sentences[i_sentences].parts[i_parts].words.split('\n').join(","));
            cache[i_sentences][i_parts] = config.sentences[i_sentences].parts[i_parts].words.split('\n');
        }
    }

    var interval = config.interval * 1000;
    if (interval < 1000) {
        interval = 30000;
    }

    setInterval(function () {

        if (backend.getCurrentChannel().getClientCount() < 2) {
            return;
        }

        var sentence = cache[Math.floor(Math.random() * cache.length)];

        var result = [];
        for (var i_parts = 0; i_parts < sentence.length; i_parts++) {
            var parts = sentence[i_parts];
            result.push(parts[Math.floor(Math.random() * parts.length)]);
        }

        var bakedSentence = result
          .join(' ')
          .replace(/\s\s+/g, ' ');

        engine.log("Saying: " + bakedSentence);
        sinusbot.say(bakedSentence, "sk");

    }, interval);

});
