import express from 'express';
import { Podcast } from 'podcast'
const fs = require('fs')
const busboy = require('busboy')
const shortuuid = require('short-uuid')
const app = express();
const port = 8080;
const bodyParser = require('body-parser')
const {Storage} = require('@google-cloud/storage')
const stream = require('stream')
const path = require('path')
const Readable = require('stream').Readable
//Google storage 設定
let projectId = 'podcast-feed-test'
let keyFilename = '../mykey.json'
const storage = new Storage({
  projectId,
  keyFilename: path.join('__dirname',keyFilename)
})
const myBucket = storage.bucket('podcast-feed-test.appspot.com')


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

// set the view engine to ejs
app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')

app.get('/', (req, res) => {
  res.render('hello');
});

app.get('/test', (req,res)=>{
  res.render('test')
})
app.post('/testupload', (req,res)=>{
  const uuid = shortuuid.generate()
  const bb = busboy({ headers: req.headers })
  bb.on('file', (name, file, info)=>{
    console.log("file uploading...")
    const extension = info.filename.split(".").pop()
    const blob = myBucket.file(`uuid.${extension}`)
    const blobStream = blob.createWriteStream({
      resumable: false
    })
    file.pipe(blobStream)

    return new Promise((resolve, reject)=>{
      file.on('end', () => {
        blobStream.end();
      })
      blobStream.on('finish',()=>{
        console.log('upload finished!')
        return resolve
      })
      blobStream.on('error',reject)
    })
  })
  bb.on('close', ()=>{ })
  req.pipe(bb)
  res.send("aaa")
})

app.get('/someoneid/:id',(req, res)=>{
  res.send(`這是某人的podcast頁面, xml連結:https://podcast-feed-example-364516.de.r.appspot.com/getxml/${req.params.id}`)
})



app.post('/upload',(req, res)=>{

  const uuid = shortuuid.generate()
  console.log(uuid)
  const bb = busboy({ headers: req.headers })
  let formData = new Map()
  
  bb.on('file', (name, file, info) => {
    console.log("file uploading...")
    const extension = info.filename.split(".").pop()
    const blob = myBucket.file(`${uuid}.${extension}`)
    const blobStream = blob.createWriteStream({
      resumable: false
    })
    file.pipe(blobStream)

    return new Promise((resolve, reject)=>{
      file.on('end', () => {
        blobStream.end();
      })
      blobStream.on('finish',()=>{
        console.log('files upload')
        return resolve
      })
      blobStream.on('error',reject)
    })
  })
  bb.on('field', (name, val, info) => {
    formData.set(name, val)
  })
  bb.on('close', () => {
    const channelTitle = formData.get('channelTitle')
    const channelDescription = formData.get('channelDescription')
    const author = formData.get('author')
    const email = formData.get('email')
    const episodeTitle = formData.get('episodeTitle')
    const episodeDescription = formData.get('episodeDescription')
    const feed = new Podcast({
      title: channelTitle,
      description: channelDescription,
      feedUrl: `https://podcast-feed-example-364516.de.r.appspot.com/getxml/${uuid}`,
      siteUrl: `https://podcast-feed-example-364516.de.r.appspot.com/someoneid/${uuid}`,
      imageUrl: `https://podcast-feed-example-364516.de.r.appspot.com/getavater/${uuid}`,
      author: formData.get('author'),
      copyright: `2022 ${author}`,
      language: 'zh',
      categories: ['Comedy'],
      pubDate: new Date(),
      itunesAuthor: author,
      itunesSubtitle: 'I am a sub title',
      itunesSummary: 'I am a summary',
      itunesOwner: { name: author, email: email },
      itunesExplicit: false,
      itunesCategory: [{
          text: 'Comedy'
      }],
      itunesImage: `https://podcast-feed-example-364516.de.r.appspot.com/getavater/${uuid}`
    })
    
    feed.addItem({
      title:  episodeTitle,
      description: episodeDescription,
      url: `https://podcast-feed-example-364516.de.r.appspot.com/someoneid//${uuid}`, // link to the item
      guid: uuid, // optional - defaults to url
      author: author, // optional - defaults to feed author property
      date: new Date(), // any format that js Date can parse.
      enclosure : {url:`https://podcast-feed-example-364516.de.r.appspot.com/getmp3/${uuid}`}, // optional enclosure
      itunesAuthor: author,
      itunesExplicit: false,
      itunesSubtitle: 'I am a sub title',
      itunesSummary: 'I am a summary',
      itunesDuration: 0.033,
    })
    const xml = feed.buildXml()
    const blob = myBucket.file(`${uuid}.xml`)
    const blobStream = blob.createWriteStream({
      resumable: false
    })

    let readableStream = new Readable({
      read(size){
        this.push(xml)
        this.push(null)
      }
    })
    readableStream
    .pipe(blobStream)
    .on('error', function(err) { console.log(err)})
    .on('finish', function() {
      console.log("xml uploaded")
    })
    
    // readableStream.on('data', function(err,))
    // readableStream.pipe(bucketFile.createWriteStream())
    // .on('error', function(err){})
    // .on('finish', function(){
    //   console.log('upload xml to bucket is successed!')
    // })
  })
  req.pipe(bb)
  res.json({id: `${uuid}`, redirectUrl: `https://podcast-feed-example-364516.de.r.appspot.com/someoneid/${uuid}`})
})

app.get('/getxml/:id',(req, res, next)=>{
  try{
    const result = getFileFromBucket(`${req.params.id}.xml`)
    res.set('Content-Type', 'text/xml')
    res.send(result)
  }catch(e){
    res.send("404 not found.")
  }
})

app.get('/getmp3/:id',(req, res, next)=>{

  
  try{
     const result = getFileFromBucket(`${req.params.id}.mp3`)
     res.set('Content-Type', 'audio/mpeg')
     res.send(result)
  }catch(e){
    res.send("404 not found.")
  }
})


app.get('/getavatar/:id',(req, res, next)=>{
  try{
    const result = getFileFromBucket(`${req.params.id}.jpg`)
    res.set('Content-Type', 'image/jpeg')
    res.send(result)
 }catch(e){
   res.send("404 not found.")
 }
})


function getFileFromBucket(filename){
  return new Promise<void>((resolve, reject) => {
    const file = myBucket.file(filename)
    file.get(function(err, file, apiResponse) {
      if(err) throw err    
      resolve(file)
    })
  })
}

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});