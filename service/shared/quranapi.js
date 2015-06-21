var http = require('request');
    
var QuranApi = (function(){    
    function QuranApi() {        
        this.host = 'http://45.55.158.85';
    };
    
    QuranApi.prototype.getVerses = function(surah, start, end, callback) {
        var self = this;
        
        surah = surah || '';

        var uri = self.host + '/surahs/' + surah + '/ayat?';

        if (start) {
            uri += 'from=' + start + '&';
            if (end) {
                uri += 'to=' + end + '&';
            }
        } 
        
        // use Sahih International translation
        uri += 'content=19'
        
        self.proxy(uri, function(err, verses) {
            if (err) return callback(err);
            
            verses.forEach(self.transformVerse);
            callback(null, verses);
        });
    }
    
    QuranApi.prototype.getSurahs = function(surah, callback) {
        var self = this;
        
        surah = surah || '';           
        var uri = this.host + '/surahs/' + surah;
        
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
        console.log('proxy: ' + uri);
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