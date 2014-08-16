var QuranService = require('../shared/quranservice'),
    log = console.log;

exports.register = function (api) {
    api.get('/', listTags);
    api.get('/:tag', listAnnotations);
    api.post('/', annotate);
}

exports.get = listTags;
exports.post = annotate;

function listAnnotations(req, res) {
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
     QuranService.get(req).annotate(req.body.tag, req.body.surah, req.body.verse, function (err) {
        if (err) {
            res.send(statusCodes.BAD_REQUEST, err);
            return;
        }
        res.send(statusCodes.OK, true);
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