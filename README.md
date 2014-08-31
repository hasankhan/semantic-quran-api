Semantic Quran API
==================

This REST API allows you to tag verses of Holy Quran in order to navigate the Quran by topics.

The source for web UI of [Semantic Quran](http://semquran.com) is at http://github.com/hasankhan/semantic-quran-web

## End points

To annotate a verse of quran send a request as follows:

    url: http://semantic-quran.azure-mobile.net/api/tag
    method: POST
    body: {tag: name-of-Allah,
            surah: 1, 
            verse: 2}

To deannotate a verse of quran send a request as follows:

    url: http://semantic-quran.azure-mobile.net/api/tag/1/2
    method: DEL

To get a list of tags:

    url: http://semantic-quran.azure-mobile.net/api/tag
    method: GET
    
To get a list of verses for a given tag:

    url: http://semantic-quran.azure-mobile.net/api/tag/name-of-Allah
    method: GET
    
To get a list of surahs:

    url: http://semantic-quran.azure-mobile.net/api/surah
    method: GET
    
To get details of surah:

    url: http://semantic-quran.azure-mobile.net/api/surah/1
    method: GET
    
To get verses of surah:

    url: http://semantic-quran.azure-mobile.net/api/verse/1/1-7
    method: GET
