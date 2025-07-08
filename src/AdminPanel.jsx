import { useState, useEffect } from 'react';
import { useContent } from './utils/ContentContext';
import ParallaxBanner from './ParallaxBanner';
import Timeline from './Timeline';
import Gallery from './Gallery';
import MusicPlayer from './MusicPlayer';
import LoveQuiz from './LoveQuiz';
import LoveChatbot from './LoveChatbot';
import { uploadToCloudinary } from './utils/uploadToCloudinary';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { tr } from 'date-fns/locale';
import './AdminPanel.css';

const password = '1';

function AdminPanel() {
  const [step, setStep] = useState('login');
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [uploadStatus, setUploadStatus] = useState({});
  const { content, updateContent } = useContent();
  const [timelineDraft, setTimelineDraft] = useState([]);
  const [galleryDraft, setGalleryDraft] = useState([]);
  const [musicDraft, setMusicDraft] = useState([]);
  const [quizDraft, setQuizDraft] = useState([]);

  useEffect(() => {
    if (content) {
      setTimelineDraft(content.timeline || []);
      setGalleryDraft(content.gallery || []);
      setMusicDraft(content.music || []);
      setQuizDraft(content.quiz || [
        {
          question: '',
          options: ['', '', '', ''],
          answer: 0,
        },
      ]);
    }
  }, [content]);

  const handleLogin = () => {
    if (input === password) {
      setStep('panel');
      setError('');
    } else {
      setError('Şifre yanlış!');
    }
  };

  const handleLogout = () => {
    setStep('login');
    setInput('');
  };

  const handleEdit = (field, value) => {
    setEditingField(field);
    setEditValue(value);
  };

  const handleSave = async () => {
    if (editingField && content) {
      const newContent = { ...content };
      if (editingField.includes('.')) {
        const [parent, child] = editingField.split('.');
        newContent[parent] = { ...newContent[parent], [child]: editValue };
      } else {
        newContent[editingField] = editValue;
      }
      await updateContent(newContent);
      setEditingField(null);
      setEditValue('');
    }
  };

  // Cloudinary ile dosya yükleme
  const handleFileUpload = async (event, field, type = 'auto') => {
    if (event.preventDefault) event.preventDefault();
    const file = event.target.files[0];
    if (file) {
      try {
        setUploadStatus(prev => ({ ...prev, [field]: 'Yükleniyor...' }));
        const url = await uploadToCloudinary(file);
        if (content) {
          const fieldParts = field.split('.');
          if (fieldParts.length === 2 && fieldParts[0] === 'gallery') {
            // Galeri için dosya tipi otomatik güncelle
            const idx = Number(fieldParts[1]);
            const newGallery = [...galleryDraft];
            if (file.type.startsWith('video/')) {
              newGallery[idx] = { ...newGallery[idx], src: url, type: 'video' };
            } else if (file.type.startsWith('image/')) {
              newGallery[idx] = { ...newGallery[idx], src: url, type: 'image' };
            } else {
              newGallery[idx] = { ...newGallery[idx], src: url };
            }
            setGalleryDraft(newGallery);
          } else if (fieldParts.length === 3 && fieldParts[0] === 'timeline' && fieldParts[2] === 'media.src') {
            // Zaman tüneli için dosya tipi otomatik güncelle (galeri ve müzik ile aynı mantık)
            const idx = Number(fieldParts[1]);
            setTimelineDraft(prev => {
              const newTimeline = [...prev];
              newTimeline[idx] = {
                ...newTimeline[idx],
                media: { ...(newTimeline[idx].media || {}), src: url }
              };
              return newTimeline;
            });
          } else if (fieldParts.length === 2 && fieldParts[0] === 'music') {
            // Müzik için dosya yüklenince src alanını güncelle
            const idx = Number(fieldParts[1]);
            const newMusic = [...musicDraft];
            newMusic[idx] = { ...newMusic[idx], src: url };
            setMusicDraft(newMusic);
          } else if (fieldParts.length === 2 && fieldParts[0] !== 'gallery' && fieldParts[0] !== 'timeline') {
            const newContent = { ...content };
            newContent[field] = url;
            // updateContent(newContent); // Gerekirse
          } else if (fieldParts.length === 1) {
            const newContent = { ...content };
            newContent[field] = url;
            // updateContent(newContent); // Gerekirse
          }
          setUploadStatus(prev => ({ ...prev, [field]: 'Başarıyla yüklendi!' }));
          setTimeout(() => {
            setUploadStatus(prev => {
              const newStatus = { ...prev };
              delete newStatus[field];
              return newStatus;
            });
          }, 3000);
        }
      } catch (error) {
        setUploadStatus(prev => ({ ...prev, [field]: `Hata: ${error.message}` }));
        setTimeout(() => {
          setUploadStatus(prev => {
            const newStatus = { ...prev };
            delete newStatus[field];
            return newStatus;
          });
        }, 5000);
      } finally {
        event.target.value = '';
      }
    }
  };

  // Cloudinary ile zaman tüneli dosya yükleme (sade ve hatasız)
  const handleTimelineFileUpload = async (event, index) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      setUploadStatus(prev => ({ ...prev, [`timeline.${index}.media.src`]: 'Yükleniyor...' }));
      const url = await uploadToCloudinary(file);
      setTimelineDraft(prev => {
        const newTimeline = [...prev];
        newTimeline[index] = {
          ...newTimeline[index],
          media: { ...(newTimeline[index]?.media || {}), src: url }
        };
        return newTimeline;
      });
      setUploadStatus(prev => ({ ...prev, [`timeline.${index}.media.src`]: 'Başarıyla yüklendi!' }));
    } catch (error) {
      setUploadStatus(prev => ({ ...prev, [`timeline.${index}.media.src`]: `Hata: ${error.message}` }));
    } finally {
      event.target.value = '';
      setTimeout(() => {
        setUploadStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[`timeline.${index}.media.src`];
          return newStatus;
        });
      }, 3000);
    }
  };

  if (step === 'login') {
    return (
      <div className="admin-login-container">
        <h2>Yönetici Girişi</h2>
        <input
          type="password"
          placeholder="Şifre"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
        />
        <button onClick={handleLogin}>Giriş Yap</button>
        {error && <div className="admin-error">{error}</div>}
      </div>
    );
  }

  if (!content) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="main-bg">
      <div className="header-center">
        <center><div className="heart-animation">❤️</div></center>
        <center>
          <h1 className="main-title">
            {editingField === 'title' ? (
              <div className="edit-container">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  className="edit-input"
                />
              </div>
            ) : (
              <span onClick={() => handleEdit('title', content.title)}>
                {content.title}
              </span>
            )}
          </h1>
        </center>
        <center>
          <p className="subtitle">
            {editingField === 'description' ? (
              <div className="edit-container">
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  className="edit-textarea"
                />
              </div>
            ) : (
              <span onClick={() => handleEdit('description', content.description)}>
                {content.description}
              </span>
            )}
          </p>
        </center>
        <button onClick={handleLogout} className="delete-btn" style={{ float: 'right', margin: '10px' }}>Çıkış Yap</button>
      </div>
      
      <div className="welcome-message">
        <center>
          <p className="main-title">
            {editingField === 'welcomeMessage' ? (
              <div className="edit-container">
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  className="edit-textarea-large"
                />
              </div>
            ) : (
              <span onClick={() => handleEdit('welcomeMessage', content.welcomeMessage)}>
                {(content.welcomeMessage || "").split('\n').map((line, i) => (
                  <span key={i}>
                    {line}<br />
                  </span>
                ))}
              </span>
            )}
          </p>
        </center>
      </div>

      <ParallaxBanner />

      {/* Timeline Section with Admin Controls */}
      <div className="admin-section">
        <h2>Zaman Tüneli</h2>
        <Timeline />
        <div className="admin-controls">
          <h3>Zaman Tüneli Düzenle</h3>
          <div className="upload-info">
            <p>💡 <strong>Dosya Yükleme Bilgisi:</strong></p>
            <ul>
              <li>Desteklenen formatlar: JPG, PNG, GIF, WebP, MP4, WebM, OGG, MP3, WAV</li>
              <li>Maksimum dosya boyutu: 10MB</li>
              <li>Dosyalar Cloudinary'ye yüklenir ve kalıcı olarak saklanır</li>
              <li>Yükleme başarısız olursa dosya geçici olarak tarayıcıda saklanır</li>
            </ul>
          </div>
          <div className="admin-timeline-controls">
            {Array.isArray(timelineDraft) && timelineDraft.map((item, index) => (
              <div key={index} className="admin-timeline-item">
                <ReactDatePicker
                  selected={item.date ? new Date(item.date) : null}
                  onChange={date => {
                    const newTimeline = [...timelineDraft];
                    newTimeline[index] = { ...item, date: date ? date.toISOString().slice(0, 10) : '' };
                    setTimelineDraft(newTimeline);
                  }}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Tarih seç..."
                  locale={tr}
                  className="admin-datepicker"
                  calendarStartDay={1}
                  isClearable
                  showYearDropdown
                  scrollableYearDropdown
                  yearDropdownItemNumber={100}
                />
                <input
                  type="text"
                  placeholder="Başlık"
                  value={item.title}
                  onChange={e => {
                    const newTimeline = [...timelineDraft];
                    newTimeline[index] = { ...item, title: e.target.value };
                    setTimelineDraft(newTimeline);
                  }}
                />
                <textarea
                  placeholder="Açıklama"
                  value={item.description}
                  onChange={e => {
                    const newTimeline = [...timelineDraft];
                    newTimeline[index] = { ...item, description: e.target.value };
                    setTimelineDraft(newTimeline);
                  }}
                />
                <div className="media-upload">
                  <input
                    type="text"
                    placeholder="Medya URL"
                    value={item.media?.src || ''}
                    onChange={e => {
                      setTimelineDraft(prev => {
                        const newTimeline = [...prev];
                        newTimeline[index] = {
                          ...item,
                          media: { ...(item.media || {}), src: e.target.value }
                        };
                        return newTimeline;
                      });
                    }}
                  />
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={e => handleTimelineFileUpload(e, index)}
                  />
                  {uploadStatus[`timeline.${index}.media.src`] && (
                    <div className={`upload-status ${uploadStatus[`timeline.${index}.media.src`].startsWith('Hata') ? 'upload-error' : ''}`}>
                      {uploadStatus[`timeline.${index}.media.src`]}
                    </div>
                  )}
                </div>
                {item.media?.src && (
                  <img src={item.media.src} alt="" style={{ height: 80, borderRadius: 8, marginRight: 8 }} />
                )}
                <button
                  onClick={() => {
                    const newTimeline = timelineDraft.filter((_, i) => i !== index);
                    setTimelineDraft(newTimeline);
                  }}
                  className="delete-btn"
                >
                  Sil
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                const newTimeline = [...(timelineDraft || []), {
                  date: '',
                  title: '',
                  description: '',
                  media: { type: 'image', src: '', alt: '' }
                }];
                setTimelineDraft(newTimeline);
              }}
              className="add-btn"
            >
              Yeni Zaman Tüneli Ekle
            </button>
            <button
              onClick={() => updateContent({ ...content, timeline: timelineDraft })}
              className="add-btn"
              style={{ background: '#388e3c', marginTop: 10 }}
            >
              Kaydet
            </button>
          </div>
        </div>
      </div>

      {/* Gallery Section with Admin Controls */}
      <div className="admin-section">
        <h2>Galeri</h2>
        <Gallery />
        <div className="admin-controls">
          <h3>Galeri Düzenle</h3>
          <div className="upload-info">
            <p>💡 <strong>Dosya Yükleme Bilgisi:</strong></p>
            <ul>
              <li>Desteklenen formatlar: JPG, PNG, GIF, WebP, MP4, WebM, OGG</li>
              <li>Maksimum dosya boyutu: 10MB</li>
              <li>Dosyalar Cloudinary'ye yüklenir ve kalıcı olarak saklanır</li>
              <li>Yükleme başarısız olursa dosya geçici olarak tarayıcıda saklanır</li>
            </ul>
          </div>
          <div className="admin-gallery-controls">
            {Array.isArray(galleryDraft) && galleryDraft.map((item, index) => (
              <div key={index} className="admin-gallery-item">
                <select
                  value={item.type}
                  onChange={(e) => {
                    const newGallery = [...galleryDraft];
                    newGallery[index] = { ...item, type: e.target.value };
                    setGalleryDraft(newGallery);
                  }}
                >
                  <option value="image">Fotoğraf</option>
                  <option value="video">Video</option>
                </select>
                <input
                  type="text"
                  placeholder="Medya URL"
                  value={item.src}
                  onChange={(e) => {
                    const newGallery = [...galleryDraft];
                    newGallery[index] = { ...item, src: e.target.value };
                    setGalleryDraft(newGallery);
                  }}
                />
                <input
                  type="file"
                  accept={item.type === 'image' ? 'image/*' : 'video/*'}
                  onChange={async (e) => {
                    await handleFileUpload(e, `gallery.${index}`);
                    // Dosya yüklendikten sonra inputa odaklan
                    setTimeout(() => {
                      const input = document.querySelector(`.admin-gallery-item:nth-child(${index + 1}) input[placeholder='Medya URL']`);
                      if (input) input.focus();
                    }, 100);
                  }}
                />
                {uploadStatus[`gallery.${index}`] && (
                  <div className={`upload-status ${uploadStatus[`gallery.${index}`].startsWith('Hata') ? 'upload-error' : ''}`}>
                    {uploadStatus[`gallery.${index}`]}
                  </div>
                )}
                <input
                  type="text"
                  placeholder="Açıklama"
                  value={item.alt}
                  onChange={(e) => {
                    const newGallery = [...galleryDraft];
                    newGallery[index] = { ...item, alt: e.target.value };
                    setGalleryDraft(newGallery);
                  }}
                />
                <button
                  onClick={() => {
                    const newGallery = galleryDraft.filter((_, i) => i !== index);
                    setGalleryDraft(newGallery);
                  }}
                  className="delete-btn"
                >
                  Sil
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                const newGallery = [...(galleryDraft || []), {
                  type: 'image',
                  src: '',
                  alt: ''
                }];
                setGalleryDraft(newGallery);
              }}
              className="add-btn"
            >
              Yeni Galeri Öğesi Ekle
            </button>
            <button
              onClick={() => updateContent({ ...content, gallery: galleryDraft })}
              className="add-btn"
              style={{ background: '#388e3c', marginTop: 10 }}
            >
              Kaydet
            </button>
          </div>
        </div>
      </div>

      {/* Music Section with Admin Controls */}
      <div className="admin-section">
        <h2>Müzik</h2>
        <MusicPlayer />
        <div className="admin-controls">
          <h3>Müzik Düzenle</h3>
          <div className="upload-info">
            <p>💡 <strong>Dosya Yükleme Bilgisi:</strong></p>
            <ul>
              <li>Desteklenen formatlar: MP3, WAV, OGG</li>
              <li>Maksimum dosya boyutu: 10MB</li>
              <li>Dosyalar Cloudinary'ye yüklenir ve kalıcı olarak saklanır</li>
              <li>Yükleme başarısız olursa dosya geçici olarak tarayıcıda saklanır</li>
            </ul>
          </div>
          <div className="admin-music-controls">
            {Array.isArray(musicDraft) && musicDraft.map((item, index) => (
              <div key={index} className="admin-music-item">
                <input
                  type="text"
                  placeholder="Şarkı Adı"
                  value={item.title}
                  onChange={(e) => {
                    const newMusic = [...musicDraft];
                    newMusic[index] = { ...item, title: e.target.value };
                    setMusicDraft(newMusic);
                  }}
                />
                <input
                  type="text"
                  placeholder="Sanatçı"
                  value={item.artist}
                  onChange={(e) => {
                    const newMusic = [...musicDraft];
                    newMusic[index] = { ...item, artist: e.target.value };
                    setMusicDraft(newMusic);
                  }}
                />
                <input
                  type="text"
                  placeholder="Müzik URL"
                  value={item.src}
                  onChange={(e) => {
                    const newMusic = [...musicDraft];
                    newMusic[index] = { ...item, src: e.target.value };
                    setMusicDraft(newMusic);
                  }}
                />
                <input
                  type="text"
                  placeholder="YouTube URL (isteğe bağlı)"
                  value={item.youtubeUrl || ''}
                  onChange={(e) => {
                    const newMusic = [...musicDraft];
                    newMusic[index] = { ...item, youtubeUrl: e.target.value };
                    setMusicDraft(newMusic);
                  }}
                />
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => handleFileUpload(e, `music.${index}`)}
                />
                {uploadStatus[`music.${index}`] && (
                  <div className={`upload-status ${uploadStatus[`music.${index}`].startsWith('Hata') ? 'upload-error' : ''}`}>
                    {uploadStatus[`music.${index}`]}
                  </div>
                )}
                <button
                  onClick={() => {
                    const newMusic = musicDraft.filter((_, i) => i !== index);
                    setMusicDraft(newMusic);
                  }}
                  className="delete-btn"
                >
                  Sil
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                const newMusic = [...(musicDraft || []), {
                  title: '',
                  artist: '',
                  src: ''
                }];
                setMusicDraft(newMusic);
              }}
              className="add-btn"
            >
              Yeni Müzik Ekle
            </button>
            <button
              onClick={() => updateContent({ ...content, music: musicDraft })}
              className="add-btn"
              style={{ background: '#388e3c', marginTop: 10 }}
            >
              Kaydet
            </button>
          </div>
        </div>
      </div>

      {/* Quiz Section with Admin Controls */}
      <div className="admin-section">
        <h2>Aşk Testi</h2>
        <div className="admin-controls">
          <h3>Aşk Testi Düzenle</h3>
          <div className="admin-quiz-controls">
            {Array.isArray(quizDraft) && quizDraft.map((item, qIdx) => (
              <div key={qIdx} className="admin-quiz-item">
                <input
                  type="text"
                  placeholder="Soru"
                  value={item.question}
                  onChange={e => {
                    const newQuiz = [...quizDraft];
                    newQuiz[qIdx] = { ...item, question: e.target.value };
                    setQuizDraft(newQuiz);
                  }}
                />
                {item.options.map((opt, oIdx) => (
                  <div key={oIdx} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                    <input
                      type="text"
                      placeholder={`Seçenek ${oIdx + 1}`}
                      value={opt}
                      onChange={e => {
                        const newQuiz = [...quizDraft];
                        const newOptions = [...item.options];
                        newOptions[oIdx] = e.target.value;
                        newQuiz[qIdx] = { ...item, options: newOptions };
                        setQuizDraft(newQuiz);
                      }}
                      style={{ flex: 1 }}
                    />
                    <input
                      type="radio"
                      name={`answer-${qIdx}`}
                      checked={item.answer === oIdx}
                      onChange={() => {
                        const newQuiz = [...quizDraft];
                        newQuiz[qIdx] = { ...item, answer: oIdx };
                        setQuizDraft(newQuiz);
                      }}
                      style={{ marginLeft: 8 }}
                    />
                    <span style={{ marginLeft: 4, fontSize: 12 }}>Doğru</span>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newQuiz = quizDraft.filter((_, i) => i !== qIdx);
                    setQuizDraft(newQuiz);
                  }}
                  className="delete-btn"
                >
                  Sil
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                const newQuiz = [...(quizDraft || []), {
                  question: '',
                  options: ['', '', '', ''],
                  answer: 0
                }];
                setQuizDraft(newQuiz);
              }}
              className="add-btn"
            >
              Yeni Soru Ekle
            </button>
            <button
              onClick={() => updateContent({ ...content, quiz: quizDraft })}
              className="add-btn"
              style={{ background: '#388e3c', marginTop: 10 }}
            >
              Kaydet
            </button>
          </div>
        </div>
      </div>

      <LoveQuiz />
      <LoveChatbot />
    </div>
  );
}

export default AdminPanel; 