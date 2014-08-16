var async = require('async'),
    QuranApi = require('../shared/quranapi'),
    log = console.log;

exports.register = function (api) {
    api.get('/', listTags);
    api.get('/:tag', listAnnotations);
    api.post('/', annotate);
}

exports.get = listTags;
exports.post = annotate;

function listAnnotations(req, res) {
    var tagsTable = req.service.tables.getTable('tags'),
        annotationsTable = req.service.tables.getTable('annotations'),
        api = new QuranApi();
    
    findTag(tagsTable, req.params.tag, function (tag) {
        if (!tag) {
            res.send(statusCodes.OK, []);
            return;
        }
        
        annotationsTable.where({tagId: tag.id})
                        .orderBy('surah', 'verse')
                        .select('surah,verse')
                        .read({
                            success: function(annotations) {
                                async.map(annotations, getVerse.bind(null, api), function(err, results){
                                    if (err) {
                                        res.send(statusCodes.BAD_REQUEST, err);
                                        return;
                                    }
                                    res.send(200, results);
                                });                                
                            }
                        });
    });
}

function getVerse(api, verse, callback) {
    api.getVerses(verse.surah, verse.verse, function(err, verses) {
        if (err) {
            callback(err);
            return;
        }
        callback(null, verses[0]);
    });
}

function annotate(req, res) {
    var tagsTable = req.service.tables.getTable('tags');
    var annotationsTable = req.service.tables.getTable('annotations');
        
    findTag(tagsTable, req.body.tag, function(tag){   
        if (!tag) {
            addTag(tagsTable, req.body.tag, function(tag) {
                addAnnotation(annotationsTable, req.body.surah, req.body.verse, tag.id, res);
            });
            return;
        }
        addAnnotation(annotationsTable, req.body.surah, req.body.verse, tag.id, res);
    });    
};

function findTag(tagsTable, text, callback) {
    tagsTable.where({text: text})
            .take(1)
            .read({ 
                    success: function(tags) {
                        var tag = tags[0];
                        callback(tag);      
                    }
            });
}

function addAnnotation(annoationsTable, surah, verse, tag, res) {
    annoationsTable.insert({
     surah: surah,
     verse: verse,
     tagId: tag   
    }, { 
            success: function() {
            res.send(statusCodes.OK, true);
        }
    });
}

function addTag(tagsTable, text, callback) {    
    var tag = { text: text };
    tagsTable.insert(tag, {
        success: function() {
            callback(tag);
        }
    });
}

function listTags(req, res) {
    var size = parseInt(req.query.n) || 10;
    var page = parseInt(req.query.p) || 0;
    var offset = size*page;
    req.service
       .tables
       .getTable('tags')
       .select('text')
       .skip(offset)
       .take(size)
       .read({
           success: function(tags) {
               res.send(statusCodes.OK, tags.map(function(t){return t.text; }));
           }
    });
};