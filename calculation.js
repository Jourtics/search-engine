// query=require("./app")
// function calculation(string query)
// {

// }

const fs = require('fs')
const { removeStopwords } = require('stopword')
let query="two length line less is an the if but sum"
// console.log(query)

// Remove Stopwords from query
// Calculate TF-IDF values for query array

//Vector product of tfidf(query) and tfidf(problems)
//Sort all the product values

idf=fs.readFileSync('./dummyPS/idf.txt').toString().split('\r\n')
keywords=fs.readFileSync('./dummyPS/keywords.txt').toString().split("\r\n")
magnitude=fs.readFileSync('./dummyPS/magnitude.txt').toString().split("\r\n")
tf_idf=fs.readFileSync('./dummyPS/tf_idf.txt').toString().split("\r\n")
titles = fs.readFileSync('./dummyPS/titles.txt').toString().split("\r\n")
urls = fs.readFileSync('./dummyPS/urls.txt').toString().split("\r\n")

console.log(titles)
console.log(urls)

idf.pop()
keywords.pop()
tf_idf.pop()
magnitude.pop()

// console.log(idf)
// console.log(tf_idf)
// console.log(keywords)
// console.log(magnitude)

// remove the stopwords from keywords.
queryWords=removeStopwords(query.split(' '))
// console.log(queryWords)

query_tf=[]
i=0
keywords.forEach(element => {
    cnt=0
    queryWords.forEach(qw=>{
        if(qw==element){
            cnt=cnt+1
        }
    })
    query_tf[i]=cnt/queryWords.length
    i=i+1
});

// console.log(query_tf)
query_tf_idf = []

i=0
query_magnitude=0
query_tf.forEach(element=>{
        query_tf_idf[i]=element*idf[i]
        query_magnitude=query_magnitude+query_tf_idf[i]*query_tf_idf[i]
    i++
})
// console.log(query_tf_idf)

query_magnitude = Math.sqrt(query_magnitude)

cos=[]

for (let i=0; i<magnitude.length;i++)
cos[i]=0

for(let i=0; i<tf_idf.length;i++)
{
    var cur=(tf_idf[i].split(" "))
    a=Number(cur[0])
    b=Number(cur[1])
    c=Number(cur[2])
    // console.log(a,b,c, cos[a])
    cos[a-1]=cos[a-1]+c*query_tf_idf[b-1]
    // console.log(cos[a] + cur[2] * query_tf_idf[b - 1])
}


//Now calculate values and sort them accordingly.
final_cos = []
for(let i=0;i<magnitude.length;i++)
{
    cos[i]=cos[i]/(Number(magnitude[i])*query_magnitude)
   // console.log(cos[i])
    final_cos[i]=[Number(cos[i]), Number(i)]
    console.log(final_cos[i])
}

final_cos.sort((a, b)=>{
    return Number(b[0])-Number(a[0])
})
console.log(final_cos)


// now take top 10 values and return them.




