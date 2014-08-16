var QuranService = require('../shared/quranservice'),
    log = console.log;

exports.register = function (api) {
    api.get('/', listTags);
    api.get('/:tag', listVerses);
    api.post('/', annotate);
    api.del('/:tag/:surah/:verse', deannotate);
}

exports.get = listTags;
exports.post = annotate;

function listVerses(req, res) {
    var service = QuranService.get(req);
    service.listAnnotations(req.params.tag, function(err, verses) {
        if (err) {
            res.send(statusCodes.BAD_REQUEST, err);
            return;
        }
        res.send(statusCodes.OK, verses);
    });    
}

function annotate(req, res) {
     QuranService.get(req).annotate(req.body.tag, req.body.surah, req.body.verse, function (err, tag) {
        if (err) {
            res.send(statusCodes.BAD_REQUEST, err);
            return;
        }
        res.send(statusCodes.OK, tag);
    });           
}

function deannotate(req, res) {
    var service = QuranService.get(req);
    var surah = parseInt(req.params.surah);
    var verse = parseInt(req.params.verse);
    service.deannotate(req.params.tag, surah, verse, function (err) {
        if (err) {
            res.send(statusCodes.BAD_REQUEST, err);
            return;
        }
        res.send(statusCodes.NO_CONTENT, true);
    });
}

function listTags(req, res) {    
    var page = parseInt(req.query.p);
    var size = parseInt(req.query.n);
    QuranService.get(req).listTags(page, size, function(err, tags) {
        if (err) {
            res.send(statusCodes.BAD_REQUEST, err);
            return;
        }
        res.send(statusCodes.OK, tags);
    });
}

