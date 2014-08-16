var http = require('request');
    
var QuranApi = (function(){    
    function QuranApi() {        
        this.host = 'http://api.v2.quran.com';
    };
    
    QuranApi.prototype.getVerses = function(surah, range, callback) {
        var self = this;
        
        surah = surah || '';        
        var uri = self.host + '/bucket/ayat/' + surah;
        if (range) {
          uri += '/' + range;  
        } 
        
        self.proxy(uri, function(err, verses) {
            if (err) return callback(err);
            
            verses.forEach(self.transformVerse);
            callback(null, verses);
        });
    }
    
    QuranApi.prototype.getSurahs = function(surah, callback) {
        var self = this;
        
        surah = surah || '';           
        var uri = this.host + '/info/surah/' + surah;        
        
        this.proxy(uri, function (err, surahs) {
            if (err) return callback(err);
            
            surahs.forEach(self.transformSurah);
            callback(null, surahs);
        });
    };
    
    QuranApi.prototype.transformSurah = function (surah) {
        surah.verses = surah.ayat;
        delete surah.ayat;
    };
    
    QuranApi.prototype.transformVerse = function (verse) {
        verse.verse = verse.ayah;
        delete verse.ayah;
    };
    
    QuranApi.prototype.proxy = function (uri, callback) {
        http({uri: uri}, function (err, resp, body) {
            body = JSON.parse(body || '');
            if (err || resp.statusCode !== statusCodes.OK) {
                callback(err || body);
            } else {
                var results = Array.isArray(body) ? body : [body];
                callback(null, results);
            }
        });
    };
    
    return QuranApi;
})();

exports = module.exports = QuranApi;