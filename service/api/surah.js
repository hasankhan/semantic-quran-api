var QuranApi = require('../shared/quranapi'),
    log = console.log;
    
exports.register = function (api) {
    api.get('/:surah', getSurah);
}

exports.get = getSurah;

function getSurah(req, res) {
    new QuranApi().getSurahs(req.params.surah, function(err, surahs) {
        if (err) {
            log('Error calling api: ', err);
            res.send(statusCodes.BAD_REQUEST, err);
        } else {
            res.send(statusCodes.OK, surahs);
        }
    });
}