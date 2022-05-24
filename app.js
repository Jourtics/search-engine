var express=require('express')
var bodyParser=require('body-parser');
const fs = require('fs');
const SpellChecker  = require('spellchecker');
const { removeStopwords } = require('stopword')
const app=express()
const {lemmatizer}=require('lemmatizer')
app.set('view engine', 'ejs')
app.use('/public', express.static('public'));
app.use(express.json());

var urlencodedParser= bodyParser.urlencoded({extended:false})

const PORT=process.env.PORT||5000;

app.get('/', (req, res)=>{
    res.render('index')
});


titles = fs.readFileSync('./dummyPS/titles.txt').toString().split("\r\n")
urls = fs.readFileSync('./dummyPS/urls.txt').toString().split("\r\n")

idf = fs.readFileSync('./dummyPS/idf.txt').toString().split('\r\n')
keywords = fs.readFileSync('./dummyPS/keywords.txt').toString().split("\r\n")
magnitude = fs.readFileSync('./dummyPS/magnitude.txt').toString().split("\r\n")
tf_idf = fs.readFileSync('./dummyPS/tf_idf.txt').toString().split("\r\n")

idf.pop()
keywords.pop()
tf_idf.pop()
magnitude.pop()

app.get('/search', (req, res) => {
    // import { lemmatizer } from "lemmatizer";
    var query=req.query.query    
    

    queryWords = removeStopwords(query.split(' '))
    let len=queryWords.length;

    for(let i=0;i<len;i++)
    {
        queryWords[i]=queryWords[i].toLowerCase();
        if(SpellChecker.isMisspelled(queryWords[i]))
        {
            corrected_words = SpellChecker.getCorrectionsForMisspelling(queryWords[i]);
            if(corrected_words.length>0)
                queryWords[i]=corrected_words[0];
        }
        console.log(queryWords[i])
        queryWords.push(lemmatizer(queryWords[i]));
        console.log(queryWords[i])
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
    console.log(final_cos)

    // Now create a database of 10 files along with their titles and URLS to send to the search.ejs file.
    // It should have titles, URLs, and Problem Descriptions.

    frequency=10;

    seq=[]
    for(let i=0;i<frequency;i++){
        seq[i]=final_cos[i][1]
    }
    
    // data = fs.readFileSync('./dummyPS/2.txt', 'utf-8').toString().split('\n')
    console.log(seq)
    s=[]
    for(let i=0;i<frequency;i++)
    {
        s[i] = fs.readFileSync('./dummyPS/' + (seq[i] + 1).toString() + '.txt', 'utf-8').toString().split('\r\n')
    }

    at=[]
    aurl=[]
    ast=[]

    for(let i=0; i<frequency; i++)  
    {
        if(final_cos[i][0]==0 || isNaN(final_cos[i][0]))
            break;

        at[i]=titles[seq[i]];
        aurl[i]=seq[i]+1;
        ast[i]=s[i][0];
    }
    res.render('search',{query:query, title:at, url:aurl, st:ast})
});


app.get('/dummyPS/:id', (req, res) => {
    filename = req.params.id.toString()
    // console.log(filename)
    data = fs.readFileSync('./dummyPS/' + filename +".txt", 'utf-8').toString().split('\r\n')
    res.render('description', { title: titles[filename-1] , url: urls[filename-1] , data: data })
});

app.listen(PORT)