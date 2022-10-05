"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
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
app.use('/upload1', (req, res) => {
    // const feed = new Podcast({
    //   title: '陳威捷的Podcast',
    //   description: '展示用途',
    //   feedUrl: 'https://podcast-feed-example-364516.de.r.appspot.com/getdexml',
    //   siteUrl: 'https://podcast-feed-example-364516.de.r.appspot.com',
    //   imageUrl: 'https://podcast-feed-example-364516.de.r.appspot.com/getavater',
    //   author: '陳威捷',
    //   copyright: '2022 陳威捷',
    //   language: 'zh',
    //   categories: ['Comedy'],
    //   pubDate: 'Oct 5, 2022 04:00:00 GMT',
    //   itunesAuthor: '陳威捷',
    //   itunesSubtitle: 'I am a sub title',
    //   itunesSummary: 'I am a summary',
    //   itunesOwner: { name: '陳威捷', email: 'wjchen127@gmail.com' },
    //   itunesExplicit: false,
    //   itunesCategory: [{
    //       text: 'Comedy'
    //   }],
    //   itunesImage: 'https://podcast-feed-example-364516.de.r.appspot.com/getavater'
    // })
    // feed.addItem({
    //   title:  'EP1-單集標題',
    //   description: 'EP1-的內容',
    //   url: 'https://podcast-feed-example-364516.de.r.appspot.com/someoneid/fwfvwef', // link to the item
    //   guid: 'fwfvwef', // optional - defaults to url
    //   author: '陳威捷', // optional - defaults to feed author property
    //   date: 'Oct 5, 2022', // any format that js Date can parse.
    //   enclosure : {url:'https://podcast-feed-example-364516.de.r.appspot.com/getmp3'}, // optional enclosure
    //   itunesAuthor: '陳威捷',
    //   itunesExplicit: false,
    //   itunesSubtitle: 'I am a sub title',
    //   itunesSummary: 'I am a summary',
    //   itunesDuration: 0.033,
    // })
    // const xml = feed.buildXml()
    // res.send(xml)
});
app.post('/upload', (req, res) => {
    console.log(req.body);
    res.send("good");
});
app.listen(port, () => {
    return console.log(`Express is listening at http://localhost:${port}`);
});
//# sourceMappingURL=app.js.map