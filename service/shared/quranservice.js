var async = require('async'),
    QuranApi = require('./quranapi');
    
var QuranService = (function(){ 
   
    function QuranService(tables, mssql) {        
        this.mssql = mssql;
        this.surahs = tables.getTable('surahs');
        this.verses = tables.getTable('verses');
        this.annotations = tables.getTable('annotations');
        this.tags = tables.getTable('tags');
        this.api = new QuranApi();        
    };        
    
    QuranService.get = function (req) {
        return new QuranService(req.service.tables, req.service.mssql);
    };
    
    QuranService.prototype.getSurahs = function(surah, callback) {
        this.api.getSurahs(surah, callback);
    };
    
    QuranService.prototype.getVerses = function(surah, verse, callback) {
        var self = this;
        
        self.api.getVerses(surah, verse, function (err, verses) {
            if (err) return callback(err);

            async.map(verses, self._transformVerse.bind(self), callback);
        });
    };
    
    QuranService.prototype.getVerse = function(verse, callback) {
        var self = this;
        
        self.api.getVerses(verse.surah, verse.verse, function(err, verses) {
            if (err) return callback(err);
            
            async.map(verses, self._transformVerse.bind(self), callback);
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
    
    QuranService.prototype._getAnnotations = function(surah, verse, callback) {
        this.mssql.query('select t.text as tag from annotations a join tags t on a.tagId = t.id where a.surah = ? and a.verse = ?',
                         [surah, verse],
                         {
                            success: function (annotations) {
                                callback(null, annotations.map(function(t){ return t.tag }));
                            },
                            error: function(err) {
                                callback(err);
                            }
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
                                    async.map(annotations, self.getVerse.bind(self), callback);                                
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
    
    QuranService.prototype._transformVerse = function(verse, callback) {
        this._getAnnotations(verse.surah, verse.verse, function(err, tags) {
            if (err) return callback(err);
            
            verse.tags = tags;
            callback(null, verse);
        });
    };
       
    return QuranService;
})();

exports = module.exports = QuranService;