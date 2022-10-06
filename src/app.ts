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
const websiteURL = "https://podcast-feed-test.de.r.appspot.com"
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
  res.send(`這是某人的podcast頁面, xml連結:${websiteURL}/getxml/${req.params.id}`)
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
      feedUrl: `${websiteURL}/getxml/${uuid}`,
      siteUrl: `${websiteURL}/someoneid/${uuid}`,
      imageUrl: `${websiteURL}/getavatar/${uuid}`,
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
      itunesImage: `${websiteURL}/getavatar/${uuid}.jpg`
    })
    
    feed.addItem({
      title:  episodeTitle,
      description: episodeDescription,
      url: `${websiteURL}/someoneid//${uuid}`, // link to the item
      guid: uuid, // optional - defaults to url
      author: author, // optional - defaults to feed author property
      date: new Date(), // any format that js Date can parse.
      enclosure : {url:`${websiteURL}/getmp3/${uuid}`, type:"audio/mpeg"}, // optional enclosure
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
  })
  req.pipe(bb)
  res.json({id: `${uuid}`, redirectUrl: `${websiteURL}/someoneid/${uuid}`})
})

app.get('/getxml/:id',(req, res, next)=>{
  try{
    res.setHeader("content-type", "text/xml");
    myBucket.file(`${req.params.id}.xml`)
       .createReadStream() 
       .on('end', () => {
           console.log("ended");
       })
       .on('response', ans => {
           console.log("responded");
       })
       .on('error', err => {
           console.log("Error", err)
       })
       .pipe(res)
  }catch(e){
    res.send("404 not found.")
  }
})

app.get('/getmp3/:id',(req, res, next)=>{
  try{
    res.setHeader("content-type", "audio/mpeg");
    myBucket.file(`${req.params.id}.mp3`)
       .createReadStream() 
       .on('end', () => {
           console.log("ended");
       })
       .on('response', ans => {
           console.log("responded");
       })
       .on('error', err => {
           console.log("Error", err)
       })
       .pipe(res)
  }catch(e){
    res.send("404 not found.")
  }
})


app.get('/getavatar/:id',(req, res, next)=>{
  let fullFileName = req.params.id
  let filename = fullFileName.split(".")[0]
  try{
    res.setHeader("content-type", "image/jpeg");
    myBucket.file(`${filename}.jpg`)
       .createReadStream() 
       .on('end', () => {
           console.log("ended");
       })
       .on('response', ans => {
           console.log("responded");
       })
       .on('error', err => {
           console.log("Error", err)
       })
       .pipe(res)
 }catch(e){
   res.send("404 not found.")
 }
})

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});