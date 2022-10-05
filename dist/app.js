"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const podcast_1 = require("podcast");
const fs = require('fs-extra');
const busboy = require('busboy');
const shortuuid = require('short-uuid');
// var multer  = require('multer')
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'dist/public')
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + ".mp3")
//   }
// })
// var upload = multer({storage:storage})
const app = (0, express_1.default)();
const port = 8080;
const bodyParser = require('body-parser');
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());
// set the view engine to ejs
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.get('/', (req, res) => {
    res.render('hello');
});
app.use('/getxml', express_1.default.static(__dirname + '/public/me.xml'));
app.use('/getavatar', express_1.default.static(__dirname + '/public/avatar.jpg'));
app.use('/getmp3', express_1.default.static(__dirname + '/public/test.mp3'));
app.use('/someoneid/:id', (req, res) => {
    res.send('這是某人的某集podcast頁面, 單集id為:' + req.params.id);
});
app.post('/upload', (req, res) => {
    const uuid = shortuuid.generate();
    const bb = busboy({ headers: req.headers });
    let formData = new Map();
    req.pipe(bb);
    bb.on('file', (name, file, info) => {
        const saveTo = `dist/public/${uuid}.mp3`;
        file.pipe(fs.createWriteStream(saveTo));
    });
    bb.on('field', (name, val, info) => {
        formData.set(name, val);
    });
    bb.on('close', () => {
        const channelTitle = formData.get('channelTitle');
        const channelDescription = formData.get('channelDescription');
        const author = formData.get('author');
        const email = formData.get('email');
        const episodeTitle = formData.get('episodeTitle');
        const episodeDescription = formData.get('episodeDescription');
        const feed = new podcast_1.Podcast({
            title: channelTitle,
            description: channelDescription,
            feedUrl: 'https://podcast-feed-example-364516.de.r.appspot.com/getdexml',
            siteUrl: 'https://podcast-feed-example-364516.de.r.appspot.com',
            imageUrl: 'https://podcast-feed-example-364516.de.r.appspot.com/getavater',
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
        });
        feed.addItem({
            title: episodeTitle,
            description: episodeDescription,
            url: 'https://podcast-feed-example-364516.de.r.appspot.com/someoneid/fwfvwef',
            guid: uuid,
            author: author,
            date: new Date(),
            enclosure: { url: `https://podcast-feed-example-364516.de.r.appspot.com/getmp3/${uuid}` },
            itunesAuthor: author,
            itunesExplicit: false,
            itunesSubtitle: 'I am a sub title',
            itunesSummary: 'I am a summary',
            itunesDuration: 0.033,
        });
        const xml = feed.buildXml();
        fs.writeFile(`dist/public/${uuid}.xml`, xml);
        res.send(xml);
    });
});
app.listen(port, () => {
    return console.log(`Express is listening at http://localhost:${port}`);
});
//# sourceMappingURL=app.js.map