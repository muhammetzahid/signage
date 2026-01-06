const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const Parser = require('rss-parser');

const app = express();
const parser = new Parser();
const PORT = 5000;
const SECRET_KEY = "trabzon_secret_key";

app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Veritabanı (JSON Dosyası)
const DATA_FILE = path.join(__dirname, 'data.json');

// İlk Kurulum
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ 
        playlist: [], 
        playlistVertical: [],
        announcements: [], 
        rssUrls: ["https://www.trabzon.bel.tr/rss"],
        config: { weatherCity: 'Trabzon' },
        adminPassword: 'admin' 
    }));
}

if (!fs.existsSync(path.join(__dirname, 'public/uploads'))) {
    fs.mkdirSync(path.join(__dirname, 'public/uploads'), { recursive: true });
}

// Okuma Yardımcısı
const readData = () => JSON.parse(fs.readFileSync(DATA_FILE));
const writeData = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

// Upload Ayarları
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Middleware
const verifyToken = (req, res, next) => {
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !== 'undefined') {
        const token = bearerHeader.split(' ')[1];
        jwt.verify(token, SECRET_KEY, (err, authData) => {
            if (err) res.sendStatus(403);
            else { req.authData = authData; next(); }
        });
    } else { res.sendStatus(403); }
};

// --- ROUTES ---

// Login
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    const data = readData();
    if (password === data.adminPassword) {
        const token = jwt.sign({ user: 'admin' }, SECRET_KEY);
        res.json({ token });
    } else {
        res.sendStatus(403);
    }
});

// Şifre Değiştir
app.post('/api/change-password', verifyToken, (req, res) => {
    const { newPassword } = req.body;
    const data = readData();
    data.adminPassword = newPassword;
    writeData(data);
    res.json({ success: true });
});

// Veri Çekme
app.get('/api/data', (req, res) => {
    res.json(readData());
});

// Dosya Yükleme
app.post('/api/upload', verifyToken, upload.single('file'), (req, res) => {
    const fileUrl = `http://${req.headers.host}/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
});

// --- YENİ EKLENEN: DOSYA SİLME ---
app.post('/api/delete-file', verifyToken, (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).send("URL yok");

    // Sadece kendi sunucumuzdaki dosyaları silelim
    if (url.includes('/uploads/')) {
        const filename = url.split('/').pop();
        const filePath = path.join(__dirname, 'public/uploads', filename);

        // Dosya varsa sil
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err) console.error("Silme hatası:", err);
                else console.log("Dosya silindi:", filename);
            });
        }
    }
    res.json({ success: true });
});

// Playlist Güncelleme (Yatay)
app.post('/api/playlist', verifyToken, (req, res) => {
    const data = readData();
    data.playlist = req.body;
    writeData(data);
    res.json({ success: true });
});

// Playlist Güncelleme (Dikey)
app.post('/api/playlist-vertical', verifyToken, (req, res) => {
    const data = readData();
    data.playlistVertical = req.body;
    writeData(data);
    res.json({ success: true });
});

// Duyuru Güncelleme
app.post('/api/announcements', verifyToken, (req, res) => {
    const data = readData();
    data.announcements = req.body;
    writeData(data);
    res.json({ success: true });
});

// RSS Kaydetme
app.post('/api/rss', verifyToken, (req, res) => {
    const data = readData();
    data.rssUrls = req.body;
    writeData(data);
    res.json({ success: true });
});

// Haberleri Çekme (RSS Parser)
app.get('/api/news', async (req, res) => {
    const data = readData();
    let allNews = [];
    
    for (const url of data.rssUrls) {
        try {
            const feed = await parser.parseURL(url);
            feed.items.forEach(item => {
                // Görsel bulma (Enclosure veya content içinden)
                let img = null;
                if (item.enclosure && item.enclosure.url) img = item.enclosure.url;
                else if (item['media:content']) img = item['media:content']['$'].url;
                else if (item.content) {
                    const match = item.content.match(/src="([^"]*)"/);
                    if (match) img = match[1];
                }
                
                allNews.push({
                    title: item.title,
                    pubDate: item.pubDate,
                    image: img
                });
            });
        } catch (err) {
            console.error("RSS Hatası:", url);
        }
    }
    
    // Tarihe göre sırala (En yeni en üstte)
    allNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    res.json(allNews.slice(0, 20)); // Son 20 haber
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
