var QuranService = require('../shared/quranservice'),
    log = console.log;
    
exports.register = function (api) {
    api.get('/:surah', getSurah);
}

exports.get = getSurah;

function getSurah(req, res) {
    new QuranService.get(req).getSurahs(req.params.surah, function(err, surahs) {
        if (err) {
            log('Error calling api: ', err);
            res.send(statusCodes.BAD_REQUEST, err);
        } else {
            res.send(statusCodes.OK, surahs);
        }
    });
}