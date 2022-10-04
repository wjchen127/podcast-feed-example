import express from 'express';
const app = express();
const port = 8080;

app.get('/', (req, res) => {
  res.send('Hello World!');
});
app.get('/rss/someoneid', (req, res)=>{
  res.setHeader('content-type', 'application/rss+xml')
  // res.send('xml')
})
app.use('/getavatar', express.static(__dirname + '/public/avatar.jpg'))

app.use('/getmp3', express.static(__dirname + '/public/test.mp3'))

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});