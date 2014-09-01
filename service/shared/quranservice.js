var async = require('async'),
    _ = require('underscore'),
    QuranApi = require('./quranapi');
    
var QuranService = (function () {

    var Cache = {
        surahs: {},
        verses: {},

        getSurah: function (id) {
            var result = id ? this.surahs[id] || [] : _.sortBy(_.values(this.surahs), 'id');
            return Array.isArray(result) ? result : [result];
        },

        getVerses: function (surah, start, end) {            
            var s = _.first(this.getSurah(surah));
            if (!s) {
                console.log('surah not found', surah);
                return [];
            }

            end = end || (start ? start : s.verses); // if start specified then end at start otherwise end at last verse
            start = start || 1;

            var result = this.verses[surah];

            if (!result || // surah is not cached
                (_.keys(result).length < s.verses)) { // or not enough verses cached
                return [];
            }

            result = _.sortBy(_.filter(_.values(result), function (x) { return x.verse >= start && x.verse <= end; }), 'id');
            return result;
        }
    };        
   
    function QuranService(tables, mssql) {        
        this.mssql = mssql;
        this.annotations = tables.getTable('annotations');
        this.tags = tables.getTable('tags');
        this.api = new QuranApi();
    };        
    
    QuranService.get = function (req) {
        return new QuranService(req.service.tables, req.service.mssql);
    };
    
    QuranService.prototype.getSurahs = function (surah, callback) {
        var self = this;

        // first look in the cache
        var result = Cache.getSurah(surah);
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
                Cache.surahs[s.id] = s;
            });

            callback(null, result);
        });
    };
    
    QuranService.prototype.getVerses = function(surah, start, end, callback) {
        var self = this;              

        // first look in the cache
        var result = Cache.getVerses(surah, start, end);
        if (result.length > 0) {
            return callback(null, result);
        }

        console.log('verses not cached', start, end);

        // otherwise check the web service
        self.api.getVerses(surah, start, end, function (err, verses) {
            if (err) return callback(err);

            // cache the verses
            var s = Cache.verses[surah];
            if (!s) {
                s = Cache.verses[surah] = {};
            }
            verses.forEach(function (v) {
                s[v.verse] = v;
            });

            async.map(verses, self._transformVerse.bind(self), callback);
        });
    };

    QuranService.prototype.getVerse = function (verse, callback) {
        this.getVerses(verse.surah, verse.verse, verse.verse, function (err, verses) {
            if (err) return callback(err);

            callback(null, verses[0]);
        });
    };
    
    QuranService.prototype.annotate = function(text, surah, verse, callback) {
        var self = this,
            text = self._normalizeTag(text);
            
        if (text.length < 3 || text.length > 15) {
            callback(new Error('tag must be between 3 and 15 characters in length.'));
        }

        function addAnnotation(tag) {
            self.addAnnotation(surah, verse, tag.id, function(err) {
                if (err) return callback(err);
                
                callback(null, tag);
            });
        }
            
        self.findTag(text, function(err, tag){   
            if (err) return callback(err);
            
            if (!tag) {
                self.addTag(text, function(err, tag) {
                    if (err) return callback(err);
                    
                    addAnnotation(tag);
                });
                return;
            }
            addAnnotation(tag);
        });    
    };
    
    QuranService.prototype.deannotate = function (text, surah, verse, callback) {
        var self = this,
            text = self._normalizeTag(text);
        
        self.findTag(text, function(err, tag) {
            if (err || !tag) return callback(err, tag);
            
            self.mssql.query('delete from annotations where surah = ? and verse = ? and tagId = ?',
                        [surah, verse, tag.id],
                        {
                            success: callback.bind(null, null),
                            error: callback
                        });
        });
    };   
    
    QuranService.prototype.listAnnotations = function(tag, callback) {
        var self = this,
            tag = this._normalizeTag(tag);
        
        self.findTag(tag, function (err, tag) {
            if (err) return callback(err);
            if (!tag) return callback(null, []);
            
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
                        callback(null, tag);      
                    },
                    error: callback
                });
    };
    
    QuranService.prototype.addAnnotation = function(surah, verse, tagId, callback) {
        this.mssql.query('if not exists (select 1 from annotations where surah=? and verse=? and tagId=?) insert into annotations (tagId, surah, verse) values (?, ?, ?)',
                        [surah, verse, tagId, tagId, surah, verse],
                        { 
                            success: callback.bind(null, null),
                            error: callback
                        });                           
    };
    
    QuranService.prototype.addTag = function(text, callback) {    
        var tag = { text: text };
        this.tags.insert(tag, {
            success: callback.bind(null, null, tag),
           error: callback
        });
    };
    
    QuranService.prototype.listTags = function(page, size, callback) {
        var size = size || 10;
        var page = page || 0;
        var offset = size*page;
        this.tags
           .select('text')
           .orderByDescending('createdAt')
           .skip(offset)
           .take(size)
           .read({
               success: function(tags) {
                   callback(null, tags.map(function(t){return t.text; }));
               },
               error: callback
        });
    };

    QuranService.prototype._getAnnotations = function (surah, verse, callback) {
        this.mssql.query('select t.text as tag from annotations a join tags t on a.tagId = t.id where a.surah = ? and a.verse = ?',
                         [surah, verse],
                         {
                             success: function (annotations) {
                                 callback(null, annotations.map(function (t) { return t.tag }));
                             },
                             error: callback
                         });
    };
    
    QuranService.prototype._transformVerse = function(verse, callback) {
        this._getAnnotations(verse.surah, verse.verse, function(err, tags) {
            if (err) return callback(err);
            
            verse.tags = tags;
            callback(null, verse);
        });
    };    
    
    QuranService.prototype._normalizeTag = function(tag) {
        tag = tag.toLowerCase()
                 .trim()
                 .replace(/[^\w -]/g, '')
                 .replace(/[ -]+/g, '-')
                 .replace('allah', 'Allah');
        return tag;
    };
       
    return QuranService;
})();

exports = module.exports = QuranService;