Semantic Quran API
==================

This REST API allows you to tag verses of Holy Quran in order to navigate the Quran by topics.

The source for web UI of [Semantic Quran](http://semquran.com) is at http://github.com/hasankhan/semantic-quran-web
The API is hosted at http://semantic-quran.azure-mobile.net

## End points

To annotate a verse of quran send a request as follows:

    url: /api/tag/heaven/1/2
    method: POST    

To deannotate a verse of quran send a request as follows:

    url: /api/tag/heaven/1/2
    method: DEL

To get a list of tags:

    url: /api/tag
    method: GET
    
To get a list of verses for a given tag:

    url: /api/tag/heaven
    method: GET
    
To get a list of surahs:

    url: /api/surah
    method: GET
    
To get details of surah:

    url: /api/surah/1
    method: GET
    
To get verses of surah:

    url: /api/verse/1/1-7
    method: GET
