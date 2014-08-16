var async = require('async'),
    QuranApi = require('./quranapi');
    
var QuranService = (function(){    
    function QuranService(tables) {        
        this.surahs = tables.getTable('surahs');
        this.verses = tables.getTable('verses');
        this.annotations = tables.getTable('annotations');
        this.tags = tables.getTable('tags');
        this.api = new QuranApi();        
    };
    
    QuranService.prototype.getVerses = function(surah, range, callback) {
        var self = this;
        
        surah = surah || '';        
        var uri = self.host + '/bucket/ayat/' + surah;
        if (range) {
          uri += '/' + range;  
        } 
        
        self.proxy(uri, function(err, verses) {
            if (!err) {
                verses.forEach(self.transformVerse);
            }
            callback(err, verses);
        });
    };
    
    QuranService.prototype.getVerse = function(verse, callback) {
        this.api.getVerses(verse.surah, verse.verse, function(err, verses) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, verses[0]);
        });
    };
    
    QuranService.prototype.annotate = function(text, surah, verse, callback) {
        var self = this;
            
        self.findTag(text, function(tag){   
            if (!tag) {
                self.addTag(text, function(tag) {
                    self.addAnnotation(surah, verse, tag.id, callback);
                });
                return;
            }
            self.addAnnotation(surah, verse, tag.id, callback);
        });    
    };
    
    QuranService.prototype.listAnnotations = function(tag, callback) {
        var self = this;
        
        self.findTag(tag, function (tag) {
            if (!tag) {
                callback(null, []);
            }
            
            self.annotations.where({tagId: tag.id})
                            .orderBy('surah', 'verse')
                            .select('surah,verse')
                            .read({
                                success: function(annotations) {
                                    async.map(annotations, self.getVerse.bind(self), function(err, results){
                                        if (err) {
                                            callback(err);
                                            return;
                                        }
                                        callback(null, results);
                                    });                                
                                }
                            });
        });
    };
    
    QuranService.prototype.findTag = function(text, callback) {
        this.tags.where({text: text})
                .take(1)
                .read({ 
                        success: function(tags) {
                            var tag = tags[0];
                            callback(tag);      
                        },
                       error: function (err) {
                            callback(err);
                       }
                });
    };
    
    QuranService.prototype.addAnnotation = function(surah, verse, tag, callback) {
        this.annotations.insert({
                                 surah: surah,
                                 verse: verse,
                                 tagId: tag   
                                }, { 
                                    success: function() {
                                        callback();
                                    },
                                    error: function (err) {
                                        callback(err);
                                   }
                                });                           
    };
    
    QuranService.prototype.addTag = function(text, callback) {    
        var tag = { text: text };
        this.tags.insert(tag, {
            success: function() {
                callback(null, tag);
            },
           error: function (err) {
                callback(err);
           }
        });
    };
    
    QuranService.prototype.listTags = function(page, size, callback) {
        var size = size || 10;
        var page = page || 0;
        var offset = size*page;
        this.tags
           .select('text')
           .skip(offset)
           .take(size)
           .read({
               success: function(tags) {
                   callback(null, tags.map(function(t){return t.text; }));
               },
               error: function (err) {
                    callback(err);
               }
        });
    };
    
    QuranService.prototype.getSurahs = function(surah, callback) {
        var self = this;
        
        surah = surah || '';           
        var uri = this.host + '/info/surah/' + surah;        
        
        this.proxy(uri, function (err, surahs) {
            if (!err) {
                surahs.forEach(self.transformSurah);
            }
            callback(err, surahs);
        });
    };           
    
    return QuranService;
})();

exports = module.exports = QuranService;