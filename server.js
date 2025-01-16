const express = require('express');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

ffmpeg.setFfmpegPath(ffmpegPath);

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/download', async (req, res) => {
  const videoUrl = req.body.url;
  if (!ytdl.validateURL(videoUrl)) {
    return res.render('index', { error: 'Invalid YouTube URL' });
  }

  const info = await ytdl.getInfo(videoUrl);
  const format = ytdl.chooseFormat(info.formats, { quality: 'highestvideo' });
  const videoStream = ytdl(videoUrl, { format });

  const outputPath = path.join(__dirname, 'public', 'videos', `output_${Date.now()}.mp4`);

  ffmpeg(videoStream)
    .videoCodec('libx264')
    .size('3840x2160') // 4K resolution
    .save(outputPath)
    .on('end', () => {
      res.render('index', { downloadLink: `/videos/${path.basename(outputPath)}` });
    })
    .on('error', err => {
      console.error(err);
      res.render('index', { error: 'Error processing video' });
    });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
