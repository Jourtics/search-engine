var express = require('express')
const fs = require('fs');
const SpellChecker = require('spellchecker');
const { removeStopwords } = require('stopword')
const app = express()
const lemmatizer = require('wink-lemmatizer');
const path = require("path")
app.set('view engine', 'ejs')

app.use(express.static(path.join(__dirname, "/public")))

app.use(express.json());

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.render('index')
});


titles = fs.readFileSync('./PS/titles.txt').toString().split(/\r?\n/)
urls = fs.readFileSync('./PS/urls.txt').toString().split(/\r?\n/)

// console.log(titles)

idf = fs.readFileSync('./PS/idf.txt').toString().split(/\r?\n/)
keywords = fs.readFileSync('./PS/keywords.txt').toString().split(/\r?\n/)
magnitude = fs.readFileSync('./PS/magnitude.txt').toString().split(/\r?\n/)
tf_idf = fs.readFileSync('./PS/tf_idf.txt').toString().split(/\r?\n/)

idf.pop()
keywords.pop()
tf_idf.pop()
magnitude.pop()


app.get('/search', (req, res) => {

    // console.log(magnitude);

    var query = req.query.query

    query_Words = removeStopwords(query.split(' '))

    queryWords = []

    // to avoid empty strings 
    for (let i = 0; i < query_Words.length; i++) {
        if (query_Words[i] != '')
            queryWords.push(query_Words[i])
    }

    // console.log(queryWords)
    let len = queryWords.length

    for (let i = 0; i < len; i++) {
        queryWords[i] = queryWords[i].toLowerCase();
        if (SpellChecker.isMisspelled(queryWords[i])) {
            corrected_words = SpellChecker.getCorrectionsForMisspelling(queryWords[i]);
            if (corrected_words.length > 0)
                queryWords[i] = corrected_words[0];
        }
        // console.log(queryWords[i])
        queryWords[i] = lemmatizer.verb(queryWords[i]);
        // console.log(queryWords[i])
    }

    // console.log(queryWords)

    query_tf = []
    i = 0
    keywords.forEach(element => {
        cnt = 0
        queryWords.forEach(qw => {
            if (qw == element) {
                cnt = cnt + 1
            }
        })
        query_tf[i] = cnt / queryWords.length
        i = i + 1
    });

    query_tf_idf = []

    i = 0
    query_magnitude = 0
    query_tf.forEach(element => {
        query_tf_idf[i] = element * idf[i]
        query_magnitude = query_magnitude + query_tf_idf[i] * query_tf_idf[i]
        i++
    })

    query_magnitude = Math.sqrt(query_magnitude)

    cos = []

    for (let i = 0; i < magnitude.length; i++)
        cos[i] = 0

    for (let i = 0; i < tf_idf.length; i++) {
        var cur = (tf_idf[i].split(" "))
        a = Number(cur[0])
        b = Number(cur[1])
        c = Number(cur[2])
        cos[a - 1] = cos[a - 1] + c * query_tf_idf[b - 1]
    }

    final_cos = []
    for (let i = 0; i < magnitude.length; i++) {
        cos[i] = cos[i] / (Number(magnitude[i]) * query_magnitude)
        final_cos[i] = [Number(cos[i]), Number(i)]
    }

    final_cos.sort((a, b) => {
        return Number(b[0]) - Number(a[0])
    })

    // console.log(final_cos)

    // Now create a database of 10 files along with their titles and URLS to send to the search.ejs file.
    // It should have titles, URLs, and Problem Descriptions.

    frequency = 10;

    seq = []

    for (let i = 0; i < frequency; i++) {
        seq[i] = final_cos[i][1]
    }

    // data = fs.readFileSync('./PS/2.txt', 'utf-8').toString().split('\n')

    s = []

    for (let i = 0; i < frequency; i++) {
        s[i] = fs.readFileSync('./PS/' + (seq[i] + 1).toString() + '.txt').toString().split('\n')
        // console.log(seq[i])
    }

    _titles = []
    _urls = []
    _statements = []

    for (let i = 0; i < frequency; i++) {
        if (final_cos[i][0] == 0 || isNaN(final_cos[i][0]))
            break;

        _titles[i] = titles[seq[i]];
        _urls[i] = seq[i] + 1;

        let j=0
        _statements[i]=""

        while(j<s[i].length && s[i][j].length<=1)
            j++;

        if(j<s[i].length)
            _statements[i]=s[i][j];  
    }

    res.render('search', { query: query, title: _titles, url: _urls, st: _statements })
});


app.get('/PS/:id', (req, res) => {
    filename = req.params.id.toString()
    // console.log(filename)
    data = fs.readFileSync('./PS/' + filename + ".txt", 'utf-8').toString().split('\n')
    res.render('description', { title: titles[filename - 1], url: urls[filename - 1], data: data })
});

app.listen(PORT)