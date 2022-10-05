import express from 'express';
import { Podcast } from 'podcast'
const fs = require('fs')
const busboy = require('busboy')
const shortuuid = require('short-uuid')
const app = express();
const port = 8080;
const bodyParser = require('body-parser')


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

app.get('/someoneid/:id',(req, res)=>{
  res.send(`這是某人的podcast頁面, xml連結:https://podcast-feed-example-364516.de.r.appspot.com/getxml/${req.params.id}`)
})



app.post('/upload',(req, res)=>{
  const uuid = shortuuid.generate()
  console.log(uuid)
  const bb = busboy({ headers: req.headers })
  let formData = new Map()
  req.pipe(bb)

  
  bb.on('file', (name, file, info) => {
   
    let extension = info.filename.split('.').pop()
    const saveTo = `dist/public/${uuid}.${extension}`;
    file.pipe(fs.createWriteStream(saveTo))
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
    fs.writeFileSync(`dist/public/${uuid}.xml`,xml)
    res.json({id: `${uuid}`, redirect: true})
  })
})

app.get('/getxml/:id',(req, res, next)=>{
  try{
    if (fs.existsSync(`dist/public/${req.params.id}.xml`)) {
      const data = fs.readFileSync(`dist/public/${req.params.id}.xml`,{encoding:'utf8', flag:'r'})
      res.set('Content-Type', 'text/xml')
      res.send(data)
    }else{
      res.send("404 not found")
    }
  }catch(e){
    next(e)
  }
})

app.get('/getmp3/:id',(req, res, next)=>{
  try{
    if (fs.existsSync(`dist/public/${req.params.id}.mp3`)) {
      const data = fs.readFileSync(`dist/public/${req.params.id}.mp3`,{flag:'r'})
      res.set('Content-Type', 'audio/mpeg')
      res.send(data)
    }else{
      res.send("404 not found")
    }    
  }catch(e){
    next(e)
  }
})

app.get('/getavatar/:id',(req, res, next)=>{
  try{
    if (fs.existsSync(`dist/public/${req.params.id}.jpg`)) {
      const data = fs.readFileSync(`dist/public/${req.params.id}.jpg`,{flag:'r'})
      res.set('Content-Type', 'image/jpeg')
      res.send(data)
    }else{
      res.send("404 not found")
    }
  }catch(e){
    next(e)
  }
})

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});