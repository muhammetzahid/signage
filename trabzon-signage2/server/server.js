const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const Parser = require('rss-parser');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const multer = require('multer');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;
const SECRET_KEY = "trabzon_gizli_anahtar_61";

app.use(cors());
app.use(express.json());

const uploadsDir = path.join(__dirname, 'data/uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

const dbFile = path.join(__dirname, 'data/db.json');
const dbDir = path.dirname(dbFile);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const adapter = new FileSync(dbFile);
const db = low(adapter);

const defaultHash = bcrypt.hashSync("trabzon61", 10);

db.defaults({ 
  admin: { password: defaultHash },
  rssUrls: ["https://www.trabzon.bel.tr/haberler.rss"],
  playlist: [],          // Yatay
  playlistVertical: [],  // Dikey
  announcements: [
    {
      title: "ÖĞRENCİLERE MÜJDE",
      detail: "Trabzon Büyükşehir Belediyesi sosyal tesislerde %20 indirim başlattı.",
      image: null
    }
  ], 
  config: { weatherCity: 'Trabzon' }
}).write();

const upload = multer({ 
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
  })
});

// --- GÜVENLİK ---
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  const admin = db.get('admin').value();
  if (!admin || !bcrypt.compareSync(password, admin.password)) return res.status(401).json({ error: "Hatalı şifre!" });
  const token = jwt.sign({ role: 'admin' }, SECRET_KEY, { expiresIn: '24h' });
  res.json({ token });
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.post('/api/change-password', authenticateToken, (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 4) return res.status(400).json({ error: "Kısa şifre" });
  const hashed = bcrypt.hashSync(newPassword, 10);
  db.set('admin.password', hashed).write();
  res.json({ success: true });
});

// --- RSS ---
const rssParser = new Parser();
const getCachedRSS = async () => {
  const urls = db.get('rssUrls').value();
  let allNews = [];
  for (const url of urls) {
    try {
      const feed = await rssParser.parseURL(url);
      feed.items.forEach(item => {
        let imageUrl = null;
        if (item.enclosure && item.enclosure.url) imageUrl = item.enclosure.url;
        else if (item['media:content'] && item['media:content'].$.url) imageUrl = item['media:content'].$.url;
        else if (item.content && item.content.match(/src="([^"]+)"/)) imageUrl = item.content.match(/src="([^"]+)"/)[1];

        if (imageUrl && !imageUrl.startsWith('http')) {
            if (imageUrl.startsWith('/')) imageUrl = "https://www.trabzon.bel.tr" + imageUrl;
        }
        if (!imageUrl) imageUrl = "https://upload.wikimedia.org/wikipedia/commons/2/23/Trabzon_Montage.jpg";

        allNews.push({
          id: crypto.createHash('md5').update(item.title || Math.random().toString()).digest('hex'),
          title: item.title,
          source: feed.title || 'Haber', // Kaynak belirteci
          image: imageUrl, 
          pubDate: item.pubDate,
          isRss: true // RSS olduğunu belirtelim
        });
      });
    } catch (e) { console.error(`RSS Hatası (${url}):`, e.message); }
  }
  return allNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
};

app.get('/api/data', (req, res) => res.json(db.getState()));
app.get('/api/news', async (req, res) => res.json(await getCachedRSS()));

app.post('/api/config', authenticateToken, (req, res) => { db.set('config', req.body).write(); res.json({success:true}); });
app.post('/api/playlist', authenticateToken, (req, res) => { db.set('playlist', req.body).write(); res.json({success:true}); });
app.post('/api/playlist-vertical', authenticateToken, (req, res) => { db.set('playlistVertical', req.body).write(); res.json({success:true}); });
app.post('/api/rss', authenticateToken, (req, res) => { db.set('rssUrls', req.body).write(); res.json({success:true}); });
app.post('/api/announcements', authenticateToken, (req, res) => { db.set('announcements', req.body).write(); res.json({success:true}); });
app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
  if(req.file) res.json({ url: `/uploads/${req.file.filename}` });
  else res.status(400).send('Hata');
});

const path1 = path.join(__dirname, '../client/build');
const path2 = path.join(__dirname, 'client/build');
const buildPath = fs.existsSync(path2) ? path2 : path1;
app.use(express.static(buildPath));
app.get('*', (req, res) => {
  const indexPath = path.join(buildPath, 'index.html');
  if (fs.existsSync(indexPath)) res.sendFile(indexPath);
  else res.send('Yükleniyor...');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
