var QuranApi = require('./quranapi'),
    _ = require('underscore');

var QuranApiCache = (function () {

    var Cache = {
        surahs: {},
        verses: {}
    };

    function QuranApiCache() {
        this.api = new QuranApi();
        this.cache = Cache;
    };

    QuranApiCache.prototype.getSurahsFromCache = function (id) {
        var result = id ? this.cache.surahs[id] || [] : _.sortBy(_.values(this.cache.surahs), 'id');
        return Array.isArray(result) ? result : [result];
    }

    QuranApiCache.prototype.getVersesFromCache = function (surah, start, end) {
        var surahEntry = _.first(this.getSurahsFromCache(surah));
        if (!surahEntry) {
            console.log('surah not found', surah);
            return [];
        }

        // if start specified then end at start otherwise end at last verse
        end = end || (start ? start : surahEntry.verses);
        // if start is not specified then start from beginning
        start = start || 1;

        var result = this.cache.verses[surah];

        if (!result || // surah is not cached
            (_.keys(result).length < surahEntry.verses)) { // or not enough verses cached
            return [];
        }

        result = _.sortBy(_.filter(
                                _.values(result),
                                function (x) {
                                    return x.verse >= start && x.verse <= end;
                                }),
                         'id');

        return result;        
    }

    QuranApiCache.prototype.getVerses = function (surah, start, end, callback) {
        var self = this;

        // first look in the cache
        var result = this.getVersesFromCache(surah, start, end);
        if (result.length > 0) {
            return callback(null, result);
        }

        console.log('verses not cached', start, end);

        // otherwise check the web service
        this.api.getVerses(surah, start, end, function (err, verses) {
            if (err) return callback(err);

            // cache the verses
            var surahEntry = self.cache.verses[surah];
            if (!surahEntry) {
                surahEntry = self.cache.verses[surah] = {};
            }
            verses.forEach(function (verse) {
                surahEntry[verse.verse] = verse;
            });

            callback(null, verses);
        });
    }

    QuranApiCache.prototype.getSurahs = function (surah, callback) {
        var self = this;

        // first look in the cache
        var result = this.getSurahsFromCache(surah);
        if ((surah && result.length == 1) || // if this is surah lookup then there should be single result
            (!surah && result.length == 114)) { // if this is surah list then there should be total of 114
            return callback(null, result);
        }

        console.log('surah not cached', surah);

        // otherwise check the web service
        this.api.getSurahs(surah, function (err, result) {
            if (err) return callback(err);

            // cache the surahs
            result.forEach(function (s) {
                self.cache.surahs[s.id] = s;
            });

            callback(null, result);
        });
    };

    return QuranApiCache;
})();

exports = module.exports = QuranApiCache;