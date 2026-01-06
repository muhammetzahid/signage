import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// --- CSS STİLLERİ ---
const globalStyles = `
  * { box-sizing: border-box; }
  body { margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #000; color: #fff; overflow: hidden; }
  
  @keyframes ticker { 0% { transform: translate3d(0, 0, 0); } 100% { transform: translate3d(-100%, 0, 0); } }
  .ticker-wrap { overflow: hidden; white-space: nowrap; }
  .ticker-content { display: inline-block; white-space: nowrap; padding-right: 100%; box-sizing: content-box; }
  
  .duyuru-content p { margin: 0 0 10px 0; }
  .duyuru-content ul, .duyuru-content ol { margin: 0 0 10px 0; padding-left: 20px; }
  
  /* ADMIN KATMANI */
  .admin-layer { 
    position: fixed; 
    top: 0; 
    left: 0; 
    width: 100%; 
    height: 100%; 
    background-color: #f4f4f4 !important; 
    color: #333 !important; 
    overflow-y: auto !important; 
    z-index: 999999; 
    padding: 20px;
    display: block;
  }
  .admin-layer h1, .admin-layer h2, .admin-layer h3, .admin-layer label, .admin-layer div, .admin-layer span, .admin-layer p { color: #333 !important; }
  .admin-layer input, .admin-layer select, .admin-layer textarea { 
    background: #fff !important; 
    border: 1px solid #ccc !important; 
    color: #333 !important; 
  }
  .loader {
    border: 8px solid #f3f3f3;
    border-top: 8px solid #3498db;
    border-radius: 50%;
    width: 60px;
    height: 60px;
    animation: spin 2s linear infinite;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  @keyframes spin { 0% { transform: translate(-50%, -50%) rotate(0deg); } 100% { transform: translate(-50%, -50%) rotate(360deg); } }
`;

const FALLBACK_IMAGE = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Trabzon_Montage.jpg/1200px-Trabzon_Montage.jpg";

// --- ORTAK BİLEŞENLER ---
const DateBadge = ({ dateStr }) => {
  const date = new Date(dateStr || new Date());
  const month = date.toLocaleDateString('tr-TR', { month: 'short' });
  const day = date.getDate();
  return (
    <div style={{ position: 'absolute', top: '20px', left: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 5px 15px rgba(0,0,0,0.4)', zIndex: 5, width: '70px', backgroundColor: 'white' }}>
      <div style={{ background: '#002855', color: '#fff', padding: '5px 0', fontSize: '1rem', fontWeight: 'bold', textTransform: 'uppercase', width: '100%', textAlign: 'center' }}>{month}</div>
      <div style={{ background: '#fff', color: '#002855', padding: '5px 0', fontSize: '1.8rem', fontWeight: '900', width: '100%', textAlign: 'center', lineHeight: '1' }}>{day}</div>
    </div>
  );
};

const Clock = ({ vertical }) => {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  
  if (vertical) {
    return (
      <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '15px', padding: '20px', textAlign: 'center', width: '80%', marginBottom: '20px', backdropFilter: 'blur(5px)' }}>
        <div style={{ fontSize: '3.5rem', fontWeight: 'bold', color: '#fff', lineHeight: '1' }}>{time.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
        <div style={{ fontSize: '1.2rem', color: '#ddd', marginTop: '5px' }}>{time.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
      </div>
    );
  }
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#000', lineHeight: '1' }}>{time.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
      <div style={{ fontSize: '1.1rem', color: '#A6192E', fontWeight: '600', textTransform: 'uppercase' }}>{time.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
    </div>
  );
};

const WeatherHeader = ({ city, vertical }) => {
  const [weather, setWeather] = useState(null);
  useEffect(() => {
    const targetCity = city || 'Trabzon';
    axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${targetCity}&count=1&language=tr&format=json`)
      .then(res => { if (res.data.results) return axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${res.data.results[0].latitude}&longitude=${res.data.results[0].longitude}&current_weather=true`); })
      .then(res => { if (res) setWeather(res.data.current_weather); }).catch(console.error);
  }, [city]);
  const getIcon = (code) => { if (code === 0) return '☀️'; if (code <= 3) return '⛅'; if (code <= 48) return '🌫️'; if (code <= 67) return '🌧️'; if (code >= 95) return '⛈️'; return '☁️'; };
  if (!weather) return <div>...</div>;

  if (vertical) {
    return (
      <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '15px', padding: '20px', textAlign: 'center', width: '80%', marginBottom: '20px', backdropFilter: 'blur(5px)' }}>
        <div style={{ fontSize: '1.2rem', color: '#ddd', textTransform: 'uppercase', marginBottom: '10px' }}>{city || 'TRABZON'}</div>
        <div style={{ fontSize: '4rem', lineHeight: '1' }}>{getIcon(weather.weathercode)}</div>
        <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#fff' }}>{Math.round(weather.temperature)}°C</div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#002855', borderLeft:'2px solid #eee', borderRight:'2px solid #eee', padding:'0 20px', height:'80%' }}>
      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom:'-5px' }}>{city || 'TRABZON'}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
         <div style={{ fontSize: '2.5rem' }}>{getIcon(weather.weathercode)}</div>
         <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{Math.round(weather.temperature)}°C</div>
      </div>
    </div>
  );
};

// --- YATAY OYNATICI ---
const PlayerHorizontal = () => {
  const [playlist, setPlaylist] = useState([]);
  const [news, setNews] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [config, setConfig] = useState({ weatherCity: 'Trabzon' });
  const [idx, setIdx] = useState(0);
  const [annoIdx, setAnnoIdx] = useState(0);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const lastRef = useRef("");
  const lastAnnoRef = useRef("");
  const videoRef = useRef(null);

  const fetchData = async () => {
    try {
      const resData = await axios.get('/api/data');
      const resNews = await axios.get('/api/news');
      setConfig(resData.data.config || {});
      setNews(resNews.data);
      
      const rawAnno = resData.data.announcements || [];
      let formattedAnno = rawAnno.length === 0 ? [{title: "Duyuru", detail: "...", image: null}] : rawAnno.map(a => (typeof a === 'string' ? { title: "Duyuru", detail: a, image: null } : a));
      if (JSON.stringify(formattedAnno) !== lastAnnoRef.current) { setAnnouncements(formattedAnno); lastAnnoRef.current = JSON.stringify(formattedAnno); }
      
      const manuals = resData.data.playlist || [];
      const newsItems = resNews.data.map(n => ({ type: 'news', url: n.image || FALLBACK_IMAGE, title: n.title, pubDate: n.pubDate, duration: 6 }));
      let final = [];
      if (manuals.length > 0 && newsItems.length > 0) {
        let m=0, n=0; const loopCount = Math.max(manuals.length, Math.ceil(newsItems.length / 2));
        for(let i=0; i < loopCount; i++) {
            if(newsItems.length > 0) final.push(newsItems[n++ % newsItems.length]);
            if(newsItems.length > 0) final.push(newsItems[n++ % newsItems.length]);
            if(manuals.length > 0) final.push(manuals[m++ % manuals.length]);
        }
      } else { final = manuals.length > 0 ? manuals : newsItems; }
      if(final.length===0) final = [{ type:'image', url:FALLBACK_IMAGE, duration:10 }];
      if(JSON.stringify(final) !== lastRef.current) { setPlaylist(final); lastRef.current = JSON.stringify(final); }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 5000); return () => clearInterval(t); }, []);
  
  useEffect(() => {
    if (playlist.length === 0) return;
    const item = playlist[idx];
    if (item.type === 'video') { setLoadingVideo(true); if((!item.duration || item.duration === 0)) return; } 
    else { setLoadingVideo(false); }
    const duration = (item.duration || 6) * 1000;
    const t = setTimeout(() => { setIdx((prev) => (prev + 1) % playlist.length); }, duration);
    return () => clearTimeout(t);
  }, [idx, playlist]);

  useEffect(() => { if(announcements.length===0) return; const t = setTimeout(() => setAnnoIdx((prev) => (prev+1)%announcements.length), 10000); return () => clearTimeout(t); }, [annoIdx, announcements]);

  const item = playlist[idx] || { type:'image', url:FALLBACK_IMAGE };
  const anno = announcements.length > 0 ? announcements[annoIdx] : {title:'', detail:'', image: null};
  const nextSlide = () => { setLoadingVideo(false); setIdx((prev) => (prev + 1) % playlist.length); };
  const handleVideoEnded = () => { if (!item.duration || item.duration === 0) nextSlide(); };
  const handleCanPlay = () => { setLoadingVideo(false); if(videoRef.current) videoRef.current.play().catch(e=>console.log(e)); };

  return (
    <div style={{ display: 'grid', gridTemplateRows: '110px 1fr 60px', height: '100vh', width: '100vw', overflow: 'hidden', background: '#fff' }}>
      <style>{globalStyles}</style>
      <header style={{ background: '#fff', display: 'grid', gridTemplateColumns: '120px 1fr auto 200px', alignItems: 'center', padding: '0 20px', borderBottom: '4px solid #002855', gap:'10px' }}>
        <img src="/image/webtv_logo.png" alt="Logo" style={{ height: '90px', objectFit: 'contain' }} onError={(e) => { e.target.onerror=null; e.target.src="https://upload.wikimedia.org/wikipedia/tr/0/02/Trabzon_B%C3%BCy%C3%BCk%C5%9Fehir_Belediyesi_logosu.png"; }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#002855', margin: 0, lineHeight: '1' }}>TRABZON BÜYÜKŞEHİR BELEDİYESİ</h1>
            <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#A6192E', margin: 0 }}>Basın Yayın ve Halkla İlişkiler Dairesi Başkanlığı</h2>
        </div>
        <WeatherHeader city={config.weatherCity} />
        <Clock />
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: '70% 30%', height: '100%', overflow: 'hidden', background: '#000' }}>
        <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000', borderRight: '4px solid #333', overflow: 'hidden' }}>
           {(item.type === 'image' || item.type === 'news') && ( <img src={item.url} alt="slide" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={(e)=>{e.target.src=FALLBACK_IMAGE}} /> )}
           
           {item.type === 'video' && ( 
             <div style={{width:'100%', height:'100%', position:'relative', background:'#000'}}>
                 {loadingVideo && <div className="loader"></div>}
                 <video ref={videoRef} key={item.url} style={{ width: '100%', height: '100%', objectFit: 'contain' }} muted playsInline preload="auto" onCanPlay={handleCanPlay} onEnded={handleVideoEnded} onError={nextSlide}>
                    <source src={item.url} type="video/mp4" />
                 </video>
             </div>
           )}
           {/* SON DAKİKA ETİKETİ KALDIRILDI */}
           {item.type === 'news' && ( <> <DateBadge dateStr={item.pubDate} /> <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#8B0000', color: '#fff', padding: '20px 30px', borderTop: '4px solid #fff' }}> <h2 style={{ margin: 0, fontSize: '2.4rem', fontWeight: 'bold' }}>{item.title}</h2> </div> </> )}
        </div>
        <div style={{ background: '#fff', height: '100%', display: 'flex', flexDirection: 'column', borderLeft:'2px solid #ccc' }}>
          <div style={{ background:'#A6192E', color:'#fff', padding:'10px', textAlign:'center', fontWeight:'bold', fontSize:'1.4rem' }}>DUYURULAR</div>
          <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', alignItems:'center' }}>
               {anno.image && ( <div style={{ width: '100%', maxHeight:'35%', marginBottom: '15px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, display:'flex', justifyContent:'center' }}><img src={anno.image} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /></div> )}
               <div style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'hidden' }}>
                  <div style={{ color: '#002855', fontWeight: '900', fontSize: anno.image ? '1.4rem' : '1.8rem', marginBottom: '10px', textAlign: 'center', textTransform: 'uppercase' }}>{anno.title}</div>
                  <div className="duyuru-content" style={{ color: '#333', fontSize: anno.image ? '1.1rem' : '1.4rem', fontWeight: '500', lineHeight: '1.4', textAlign: 'justify', overflowY: 'auto' }} dangerouslySetInnerHTML={{ __html: anno.detail }} />
               </div>
          </div>
        </div>
      </div>
      <footer className="ticker-wrap" style={{ background: '#111', borderTop: '4px solid #A6192E', display: 'flex', alignItems: 'center', height: '100%', overflow:'hidden' }}>
        <div style={{ background: '#A6192E', color: '#fff', padding: '0 40px', height: '100%', display: 'flex', alignItems: 'center', fontWeight: '900', fontSize: '1.5rem', zIndex: 5 }}>HABERLER</div>
        <div className="ticker-content" style={{ display: 'flex', animation: 'ticker 45s linear infinite', whiteSpace: 'nowrap', paddingLeft: '100%' }}>
          {news.map((item, i) => (<div key={i} style={{ marginRight: '80px', fontSize: '1.8rem', color: '#fff', fontWeight: '600' }}>• {item.title}</div>))}
        </div>
      </footer>
    </div>
  );
};

// --- DİKEY OYNATICI ---
const PlayerVertical = () => {
  const [playlist, setPlaylist] = useState([]);
  const [news, setNews] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [idx, setIdx] = useState(0);
  const [annoIdx, setAnnoIdx] = useState(0);
  const [config, setConfig] = useState({ weatherCity: 'Trabzon' });
  const [loadingVideo, setLoadingVideo] = useState(false);
  const lastRef = useRef("");
  const lastAnnoRef = useRef("");
  const videoRef = useRef(null);

  const fetchData = async () => {
    try {
      const resData = await axios.get('/api/data');
      const resNews = await axios.get('/api/news');
      setConfig(resData.data.config || {});
      setNews(resNews.data);
      const rawAnno = resData.data.announcements || [];
      let formattedAnno = rawAnno.length === 0 ? [{title: "Duyuru", detail: "...", image: null}] : rawAnno.map(a => (typeof a === 'string' ? { title: "Duyuru", detail: a, image: null } : a));
      if (JSON.stringify(formattedAnno) !== lastAnnoRef.current) { setAnnouncements(formattedAnno); lastAnnoRef.current = JSON.stringify(formattedAnno); }
      const manuals = resData.data.playlistVertical || []; 
      const rssItems = resNews.data.map(n => ({ type: 'news', url: n.image || FALLBACK_IMAGE, title: n.title, isRss: true, duration: 6 }));
      let final = [];
      if (manuals.length > 0 && rssItems.length > 0) {
          let m = 0, r = 0; const loopCount = Math.max(manuals.length, Math.ceil(rssItems.length / 2));
          for(let i=0; i < loopCount; i++) {
              if (rssItems.length > 0) final.push(rssItems[r++ % rssItems.length]);
              if (rssItems.length > 0) final.push(rssItems[r++ % rssItems.length]);
              if (manuals.length > 0) final.push(manuals[m++ % manuals.length]);
          }
      } else { final = manuals.length > 0 ? manuals : rssItems; }
      if(final.length===0) final = [{ type:'image', url:FALLBACK_IMAGE, duration:10, isRss: true }];
      if(JSON.stringify(final) !== lastRef.current) { setPlaylist(final); lastRef.current = JSON.stringify(final); }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 5000); return () => clearInterval(t); }, []);
  useEffect(() => {
    if (playlist.length === 0) return;
    const item = playlist[idx];
    if (item.type === 'video') { setLoadingVideo(true); if ((!item.duration || item.duration === 0)) return; }
    else { setLoadingVideo(false); }
    const duration = (item.duration || 6) * 1000;
    const t = setTimeout(() => { setIdx((prev) => (prev + 1) % playlist.length); }, duration);
    return () => clearTimeout(t);
  }, [idx, playlist]);
  useEffect(() => { if(announcements.length===0) return; const t = setTimeout(() => setAnnoIdx((prev) => (prev+1)%announcements.length), 10000); return () => clearTimeout(t); }, [annoIdx, announcements]);

  const item = playlist[idx] || { type:'image', url:FALLBACK_IMAGE };
  const currentAnno = announcements.length > 0 ? announcements[annoIdx] : {title:'Duyuru', detail:'...', image: null};
  const nextSlide = () => { setLoadingVideo(false); setIdx((prev) => (prev + 1) % playlist.length); };
  const handleVideoEnded = () => { if (!item.duration || item.duration === 0) nextSlide(); };
  const handleCanPlay = () => { setLoadingVideo(false); if(videoRef.current) videoRef.current.play().catch(e=>console.log(e)); };
  const isFullScreen = !item.isRss; 

  if (isFullScreen) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#000', position:'relative' }}>
        <style>{globalStyles}</style>
        {loadingVideo && <div className="loader"></div>}
        {item.type === 'video' ? 
          <video ref={videoRef} key={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline preload="auto" onCanPlay={handleCanPlay} onEnded={handleVideoEnded} onError={nextSlide} >
             <source src={item.url} type="video/mp4" />
          </video> :
          <img src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e)=>{e.target.src=FALLBACK_IMAGE}} />
        }
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', background: '#f0f0f0' }}>
      <style>{globalStyles}</style>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <div style={{ width: '320px', minWidth:'320px', background: 'linear-gradient(180deg, #1e3a8a 0%, #172554 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '40px', boxShadow: '5px 0 15px rgba(0,0,0,0.2)', zIndex: 10 }}>
            <img src="/image/webtv_logo.png" style={{ width: '180px', marginBottom: '40px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }} onError={(e) => { e.target.src="https://upload.wikimedia.org/wikipedia/tr/0/02/Trabzon_B%C3%BCy%C3%BCk%C5%9Fehir_Belediyesi_logosu.png"; }} />
            <Clock vertical={true} />
            <WeatherHeader city={config.weatherCity} vertical={true} />
            <div style={{ marginTop: 'auto', marginBottom: '40px', textAlign: 'center', color: '#fff', padding: '0 15px', width: '100%' }}>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.3)', paddingTop: '20px', width: '100%' }}>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: '900', margin: '0 0 8px 0', lineHeight: '1.1' }}>TRABZON BÜYÜKŞEHİR BELEDİYESİ</h3>
                    <div style={{ fontSize: '0.85rem', fontWeight: '400', color: '#ddd', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Basın Yayın ve Halkla İlişkiler Dairesi Başkanlığı</div>
                </div>
            </div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: '60%', position: 'relative', background: '#000', overflow: 'hidden' }}>
                <img src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e)=>{e.target.src=FALLBACK_IMAGE}} />
                {/* SON DAKİKA ETİKETİ KALDIRILDI */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', background: 'linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)', padding: '60px 30px 20px 30px' }}>
                    <h1 style={{ color: '#fff', fontSize: '2.5rem', fontWeight: '900', lineHeight: '1.2', textShadow: '2px 2px 4px rgba(0,0,0,0.8)', margin: 0 }}>{item.title}</h1>
                </div>
            </div>
            <div style={{ height: '40%', background: '#e5e5e5', padding: '20px' }}>
                <div style={{ background: '#fff', borderRadius: '15px', display: 'flex', flexDirection: 'column', height: '100%', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', borderLeft: '8px solid #A6192E', overflow: 'hidden' }}>
                    <div style={{ background: '#A6192E', color: '#fff', padding: '10px', textAlign: 'center', fontWeight: '900', fontSize: '1.4rem', letterSpacing: '1px' }}>DUYURULAR</div>
                    <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
                        <h3 style={{ color: '#002855', fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 15px 0', textAlign: 'center', textTransform: 'uppercase', lineHeight: '1.2' }}>{currentAnno.title}</h3>
                        {currentAnno.image && ( <div style={{ flexShrink: 0, maxHeight: '45%', marginBottom: '15px', width: '100%', display: 'flex', justifyContent: 'center' }}><img src={currentAnno.image} style={{ height: '100%', maxWidth: '100%', objectFit: 'contain' }} alt="Duyuru" /></div> )}
                        <div className="duyuru-content" style={{ width: '100%', overflowY: 'auto', fontSize: '1.2rem', color: '#333', lineHeight: '1.4', textAlign: 'justify' }} dangerouslySetInnerHTML={{ __html: currentAnno.detail }} />
                    </div>
                </div>
            </div>
          </div>
      </div>
      <footer className="ticker-wrap" style={{ height: '80px', background: '#A6192E', display: 'flex', alignItems: 'center', borderTop: '4px solid #fff', flexShrink: 0 }}>
        <div style={{ background: '#000', color: '#fff', height: '100%', padding: '0 40px', display: 'flex', alignItems: 'center', fontWeight: '900', fontSize: '1.8rem', zIndex: 5, whiteSpace:'nowrap' }}>HABERLER</div>
        <div className="ticker-content" style={{ display: 'flex', animation: 'ticker 45s linear infinite', whiteSpace: 'nowrap', paddingLeft: '100%', alignItems: 'center', height: '100%' }}>
            {news.map((item, i) => ( <div key={i} style={{ marginRight: '100px', fontSize: '2.2rem', color: '#fff', fontWeight: '600' }}>• {item.title}</div> ))}
        </div>
      </footer>
    </div>
  );
};

// --- LOGIN ---
const Login = ({ setToken }) => {
  const [password, setPassword] = useState('');
  const handleLogin = async (e) => { e.preventDefault(); try { const res = await axios.post('/api/login', { password }); setToken(res.data.token); localStorage.setItem('token', res.data.token); } catch (err) { alert('Hata'); } };
  return ( <div className="admin-layer" style={{display:'flex', justifyContent:'center', alignItems:'center'}}><style>{globalStyles}</style><form onSubmit={handleLogin} style={{padding:'40px', background:'#fff', borderRadius:'10px', boxShadow:'0 5px 15px rgba(0,0,0,0.1)'}}><h2 style={{color:'#002855', marginBottom:'20px'}}>Yönetici Girişi</h2><input type="password" onChange={e=>setPassword(e.target.value)} placeholder="Şifre" style={{padding:'10px', width:'200px', display:'block', marginBottom:'10px'}} /><button type="submit" style={{padding:'10px 20px', background:'#002855', color:'white', border:'none', cursor:'pointer', width:'100%'}}>GİRİŞ</button></form></div> );
};

// --- ADMIN ---
const Admin = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [data, setData] = useState({ playlist: [], playlistVertical: [], announcements: [], rssUrls: [] });
  const [inputs, setInputs] = useState({ url: '', duration: 10, useAutoDuration: false, type: 'image', annoTitle: '', annoDetail: '', annoImage: null, rss: '' });
  const [activeTab, setActiveTab] = useState('horizontal');
  const [newPassword, setNewPassword] = useState('');
  const fileInputRef = useRef(null);
  const [editIndex, setEditIndex] = useState(-1);

  const refresh = () => axios.get('/api/data').then(res => setData(res.data));
  useEffect(() => { refresh(); }, []);

  const save = async (key, val) => { try { await axios.post(`/api/${key}`, val, { headers: { 'Authorization': `Bearer ${token}` } }); refresh(); } catch (e) { if(e.response?.status===401) {setToken(null); localStorage.removeItem('token');} } };
  const handleUpload = async (e, type) => {
    const fd = new FormData(); fd.append('file', e.target.files[0]);
    const res = await axios.post('/api/upload', fd, { headers: { 'Authorization': `Bearer ${token}` } });
    if(type==='playlist') setInputs({...inputs, url: res.data.url});
    if(type==='announcement') setInputs({...inputs, annoImage: res.data.url});
    alert("Yüklendi!");
  };
  const handleChangePassword = async () => { if(newPassword.length<4) return alert("Min 4 karakter"); try { await axios.post('/api/change-password', { newPassword }, { headers: { 'Authorization': `Bearer ${token}` } }); alert("Şifre güncellendi!"); setNewPassword(''); } catch(err) { alert("Hata"); } };
  
  const addToPlaylist = () => {
    const dur = inputs.useAutoDuration ? 0 : Number(inputs.duration);
    const item = { type: inputs.type, url: inputs.url, duration: dur };
    if (activeTab === 'horizontal') save('playlist', [...(data.playlist || []), item]);
    else save('playlist-vertical', [...(data.playlistVertical || []), item]);
  };

  const removeFromPlaylist = async (index) => {
    const listKey = activeTab === 'horizontal' ? 'playlist' : 'playlist-vertical';
    const list = activeTab === 'horizontal' ? data.playlist : data.playlistVertical;
    const itemToDelete = list[index];
    try { await axios.post('/api/delete-file', { url: itemToDelete.url }, { headers: { 'Authorization': `Bearer ${token}` } }); } 
    catch (e) { console.error("Dosya silinemedi, devam ediliyor...", e); }
    const newList = list.filter((_, i) => i !== index);
    save(listKey, newList);
  };

  const updateItemDuration = (index, newDuration) => {
    const listKey = activeTab === 'horizontal' ? 'playlist' : 'playlistVertical';
    const list = activeTab === 'horizontal' ? [...data.playlist] : [...data.playlistVertical];
    list[index].duration = Number(newDuration);
    setData(prev => ({ ...prev, [listKey === 'playlist' ? 'playlist' : 'playlistVertical']: list }));
  };
  const saveItemDuration = () => {
    const listKey = activeTab === 'horizontal' ? 'playlist' : 'playlist-vertical';
    const list = activeTab === 'horizontal' ? data.playlist : data.playlistVertical;
    save(listKey, list);
  };

  const startEdit = (idx) => { const item = data.announcements[idx]; setInputs({...inputs, annoTitle: item.title, annoDetail: item.detail, annoImage: item.image}); setEditIndex(idx); window.scrollTo({top:0, behavior:'smooth'}); };
  const cancelEdit = () => { setInputs({...inputs, annoTitle:'', annoDetail:'', annoImage: null}); setEditIndex(-1); if(fileInputRef.current) fileInputRef.current.value=""; };
  const handleSaveAnno = () => {
    let arr = [...(data.announcements||[])]; const obj = {title:inputs.annoTitle, detail:inputs.annoDetail, image:inputs.annoImage};
    if(editIndex>=0) arr[editIndex]=obj; else arr.push(obj);
    save('announcements', arr); cancelEdit();
  };

  if (!token) return <Login setToken={setToken} />;
  const currentList = activeTab === 'horizontal' ? (data.playlist || []) : (data.playlistVertical || []);

  return (
    <div className="admin-layer">
      <style>{globalStyles}</style>
      <div style={{ maxWidth:'1200px', margin:'0 auto', paddingBottom:'50px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
             <h1 style={{margin:0}}>Yönetim Paneli</h1>
             <div>
                <Link to="/" target="_blank" style={{marginRight:'15px', color:'blue', textDecoration:'none', fontWeight:'bold'}}>Yatay Ekran ↗</Link>
                <Link to="/dikey" target="_blank" style={{marginRight:'15px', color:'green', textDecoration:'none', fontWeight:'bold'}}>Dikey Ekran ↗</Link>
                <button onClick={()=>{setToken(null); localStorage.removeItem('token')}} style={{background:'#c0392b', color:'white', border:'none', padding:'8px 15px', borderRadius:'4px', cursor:'pointer'}}>Çıkış</button>
             </div>
          </div>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', marginBottom: '30px', borderLeft:'5px solid #002855' }}>
            <h3 style={{marginTop:0}}>Admin Şifresi</h3>
            <div style={{ display:'flex', gap:'10px' }}><input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Yeni Şifre" style={{ padding:'10px', borderRadius:'4px', border:'1px solid #ddd', width:'200px' }} /><button onClick={handleChangePassword} style={{ padding:'10px 20px', background:'#002855', color:'white', border:'none', borderRadius:'4px', cursor:'pointer' }}>Güncelle</button></div>
          </div>
          <div style={{ display:'flex', marginBottom:'20px' }}>
            <button onClick={()=>setActiveTab('horizontal')} style={{ flex:1, padding:'15px', background: activeTab==='horizontal' ? '#002855' : '#e0e0e0', color: activeTab==='horizontal' ? '#fff' : '#333', border:'none', fontSize:'1.1rem', cursor:'pointer', fontWeight:'bold' }}>📺 YATAY EKRAN</button>
            <button onClick={()=>setActiveTab('vertical')} style={{ flex:1, padding:'15px', background: activeTab==='vertical' ? '#A6192E' : '#e0e0e0', color: activeTab==='vertical' ? '#fff' : '#333', border:'none', fontSize:'1.1rem', cursor:'pointer', fontWeight:'bold' }}>📱 DİKEY EKRAN</button>
          </div>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', marginBottom:'30px', borderTop: `5px solid ${activeTab==='horizontal' ? '#002855' : '#A6192E'}` }}>
            <h3 style={{marginTop:0}}>{activeTab === 'horizontal' ? 'Yatay Ekran İçerikleri' : 'Dikey Ekran İçerikleri'}</h3>
            <div style={{ display:'flex', gap:'10px', marginBottom:'15px', alignItems:'center', background:'#f9f9f9', padding:'10px' }}><input type="file" onChange={(e) => handleUpload(e, 'playlist')} /><span style={{fontSize:'0.8rem', color:'#999'}}>Önce dosya seçin</span></div>
            <div style={{ display:'flex', gap:'10px', marginBottom:'10px', alignItems:'center', flexWrap:'wrap' }}>
                <input value={inputs.url} onChange={e=>setInputs({...inputs, url:e.target.value})} placeholder="URL..." style={{ flex:2, padding:'10px' }} />
                <select value={inputs.type} onChange={e=>setInputs({...inputs, type:e.target.value})} style={{ padding:'10px' }}><option value="image">Resim</option><option value="video">Video</option></select>
                <div style={{display:'flex', alignItems:'center', gap:'5px', background:'#eee', padding:'5px', borderRadius:'4px'}}><input type="checkbox" id="autoDur" checked={inputs.useAutoDuration} onChange={e=>setInputs({...inputs, useAutoDuration:e.target.checked})} /><label htmlFor="autoDur" style={{fontSize:'0.9rem', cursor:'pointer'}}>Videonun Kendi Süresi (Oto)</label></div>
                {!inputs.useAutoDuration && (<input type="number" value={inputs.duration} onChange={e=>setInputs({...inputs, duration:e.target.value})} placeholder="Süre (sn)" style={{ width:'80px', padding:'10px' }} />)}
                <button onClick={addToPlaylist} style={{ padding:'10px 20px', background:'#2ecc71', color:'white', border:'none', cursor:'pointer', fontWeight:'bold' }}>EKLE</button>
            </div>
            <ul style={{listStyle:'none', padding:0}}>
                {currentList.map((item, i) => (
                    <li key={i} style={{ padding:'10px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center', background: i%2===0?'#fff':'#fcfcfc' }}>
                        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                            {item.type === 'image' ? <img src={item.url} style={{width:'60px', height:'40px', objectFit:'cover', borderRadius:'4px', border:'1px solid #ddd'}} /> : <video src={item.url} style={{width:'60px', height:'40px', objectFit:'cover', borderRadius:'4px', border:'1px solid #ddd'}} muted />}
                            <div style={{display:'flex', flexDirection:'column'}}>
                                <span><b>{item.type.toUpperCase()}</b> - {item.url.substring(0, 30)}...</span>
                                <div style={{fontSize:'0.9rem', color:'#666', display:'flex', alignItems:'center', marginTop:'5px'}}>Süre (sn): <input type="number" value={item.duration} onChange={(e) => updateItemDuration(i, e.target.value)} onBlur={saveItemDuration} style={{width:'50px', padding:'2px', marginLeft:'5px', border:'1px solid #999', textAlign:'center'}} />{item.duration === 0 && <span style={{marginLeft:'5px', color:'green', fontSize:'0.8rem'}}>(Oto)</span>}</div>
                            </div>
                        </div>
                        <button onClick={() => removeFromPlaylist(i)} style={{background:'#c0392b', color:'white', border:'none', padding:'5px 10px', borderRadius:'4px', cursor:'pointer'}}>Sil</button>
                    </li>
                ))}
            </ul>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow:'0 2px 5px rgba(0,0,0,0.1)' }}>
                <h3 style={{marginTop:0}}>Duyurular (Ortak) {editIndex > -1 && <span style={{color:'red', fontSize:'0.8rem'}}>(DÜZENLEME)</span>}</h3>
                <div style={{marginBottom:'10px'}}><label style={{display:'block', marginBottom:'5px', fontWeight:'bold'}}>Görsel:</label><input type="file" ref={fileInputRef} onChange={(e) => handleUpload(e, 'announcement')} /></div>
                <input value={inputs.annoTitle} onChange={e=>setInputs({...inputs, annoTitle:e.target.value})} placeholder="Başlık" style={{width:'100%', marginBottom:'10px', padding:'10px'}} />
                <div style={{height:'150px', marginBottom:'50px'}}><ReactQuill theme="snow" value={inputs.annoDetail} onChange={v=>setInputs({...inputs, annoDetail:v})} style={{height:'100px'}} /></div>
                <div style={{display:'flex', gap:'10px'}}><button onClick={handleSaveAnno} style={{flex:1, padding:'10px', background:'#2a5298', color:'white', border:'none', cursor:'pointer', fontWeight:'bold'}}>{editIndex>-1?'GÜNCELLE':'EKLE'}</button>{editIndex>-1 && <button onClick={cancelEdit} style={{padding:'10px', background:'gray', color:'white', border:'none', cursor:'pointer'}}>İPTAL</button>}</div>
                <ul style={{marginTop:'20px', listStyle:'none', padding:0}}>{data.announcements && data.announcements.map((a,i)=>(<li key={i} style={{borderBottom:'1px solid #eee', padding:'10px', display:'flex', justifyContent:'space-between', alignItems:'center'}}><span style={{fontWeight:'bold'}}>{a.title}</span><div><button onClick={()=>startEdit(i)} style={{marginRight:'5px', color:'blue', border:'none', background:'none', cursor:'pointer', textDecoration:'underline'}}>Düzenle</button><button onClick={()=>save('announcements', data.announcements.filter((_,x)=>x!==i))} style={{color:'red', border:'none', background:'none', cursor:'pointer', textDecoration:'underline'}}>Sil</button></div></li>))}</ul>
            </div>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow:'0 2px 5px rgba(0,0,0,0.1)' }}>
                <h3 style={{marginTop:0}}>RSS Kaynakları</h3>
                <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}><input value={inputs.rss} onChange={e=>setInputs({...inputs, rss:e.target.value})} placeholder="RSS URL..." style={{flex:1, padding:'10px'}} /><button onClick={()=>{save('rss', [...data.rssUrls, inputs.rss]); setInputs({...inputs, rss:''})}} style={{padding:'10px', background:'#2a5298', color:'white', border:'none', cursor:'pointer'}}>Ekle</button></div>
                <ul style={{listStyle:'none', padding:0}}>{data.rssUrls.map((u,i)=>(<li key={i} style={{padding:'10px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center', wordBreak:'break-all'}}><span style={{fontSize:'0.9rem'}}>{u}</span><button onClick={()=>save('rss', data.rssUrls.filter((_,x)=>x!==i))} style={{color:'red', border:'none', background:'none', cursor:'pointer'}}>Sil</button></li>))}</ul>
            </div>
          </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PlayerHorizontal />} />
        <Route path="/dikey" element={<PlayerVertical />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}
