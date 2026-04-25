// AI Chat Printer - Ortak Yardımcılar
// Gemini, Claude ve ChatGPT content script'leri tarafından paylaşılır
// MV3 content script array'inde ikinci sırada yüklenir (resim-yardimcilari'ndan sonra)

// Tüm eklenti için tek varsayılan ayar kaynağı
const VARSAYILAN_AYARLAR = { // varsayılan kullanıcı ayarları
    kodBloklari: true, // kod blokları dahil
    otomatikYazdir: true, // otomatik yazdır
    yaziBoyutu: '13', // normal yazı boyutu (px)
    footerGoster: true // eklenti imzasını göster (true = footer aktif)
};

// chrome.storage.local quota — API'den dinamik oku (varsayılan 10MB)
// chrome.storage.local.QUOTA_BYTES = 10485760 (10MB) — bazı sürümlerde farklı olabilir
const STORAGE_LOCAL_LIMIT = (typeof chrome !== 'undefined' && chrome.storage?.local?.QUOTA_BYTES) || (10 * 1024 * 1024); // resmi quota veya fallback
const STORAGE_UYARI_ESIGI = Math.floor(STORAGE_LOCAL_LIMIT * 0.8); // %80 eşik (8 MB) — bu eşikten sonra uyar
const RESIM_TOPLAM_SURE_LIMIT = 90 * 1000; // 90 saniye — tüm resim dönüşümleri için toplam limit

// Ayarları chrome.storage.sync'ten yükler — kalıcı senkronize ayarlar
async function ayarlariYukle() {
    try { // storage erişimi başarısız olabilir (context invalidation)
        const kayit = await chrome.storage.sync.get(['kullaniciAyarlari']); // sync storage'dan oku
        const kayitli = kayit.kullaniciAyarlari || {}; // kayıtlı ayarlar veya boş obje
        return { ...VARSAYILAN_AYARLAR, ...kayitli }; // varsayılanları override et
    } catch (hata) { // erişim başarısızsa varsayılanı dön
        console.warn('AI Chat Printer: Ayar yükleme başarısız, varsayılan kullanılıyor:', hata.message); // uyarı
        return { ...VARSAYILAN_AYARLAR }; // varsayılan ayarları döndür
    }
}

// Ayarları chrome.storage.sync'e kaydeder — popup tarafından çağrılır
async function ayarlariKaydet(ayarlar) {
    try { // storage erişim denemesi
        await chrome.storage.sync.set({ kullaniciAyarlari: ayarlar }); // sync storage'a yaz
        return true; // başarılı
    } catch (hata) { // erişim başarısızsa
        console.warn('AI Chat Printer: Ayar kaydetme başarısız:', hata.message); // uyarı
        return false; // başarısız
    }
}

// Debounce - fonksiyonu belirtilen süre boyunca tek çağrıya indirir
function debounce(fonksiyon, gecikme) {
    let zamanlayici = null; // aktif timeout id
    return function(...argumanlar) { // wrapper fonksiyon
        if (zamanlayici) clearTimeout(zamanlayici); // önceki timer'ı iptal et
        zamanlayici = setTimeout(() => { // yeni timer başlat
            fonksiyon.apply(this, argumanlar); // süresi dolunca çağır
        }, gecikme);
    };
}

// Streaming durumda mı kontrol eder — AI yanıt yazıyorsa true
function streamingMiKontrol(kaynak) {
    if (kaynak === 'gemini') { // Gemini streaming göstergeleri
        // data-is-complete attribute'u Gemini DOM'unda artık güvenilir değil — false positive üretiyordu
        // Tek güvenilir gösterge: aktif "Stop"/"Durdur" butonu görünür mü
        const stopButon = document.querySelector('button[aria-label*="Stop" i], button[aria-label*="Durdur" i], button[aria-label*="stop generating" i], button[aria-label*="yanıt vermeyi" i]'); // durdur butonu varyantları
        const streamingEl = document.querySelector('[data-is-streaming="true"]'); // alternatif streaming attribute
        return !!(streamingEl || (stopButon && stopButon.offsetParent !== null)); // görünür durdur butonu veya streaming attribute
    }
    if (kaynak === 'claude') { // Claude streaming göstergeleri
        const stopButon = document.querySelector('button[aria-label*="Stop" i]'); // durdur butonu
        const streamingEl = document.querySelector('[data-is-streaming="true"]'); // streaming attribute
        return !!(streamingEl || (stopButon && stopButon.offsetParent !== null)); // herhangi biri varsa streaming
    }
    if (kaynak === 'chatgpt') { // ChatGPT streaming göstergeleri
        const stopButon = document.querySelector('button[data-testid="stop-button"], button[aria-label*="Durdur" i], button[aria-label*="Stop" i]'); // durdur butonu
        const yazanEl = document.querySelector('.result-streaming, [data-message-status="in_progress"]'); // yazan göstergesi
        return !!(yazanEl || (stopButon && stopButon.offsetParent !== null)); // herhangi biri varsa streaming
    }
    if (kaynak === 'grok') { // Grok streaming göstergeleri
        const stopButon = document.querySelector('button[aria-label*="Stop" i], button[aria-label*="Durdur" i], button[data-testid*="stop" i]'); // durdur butonu
        const yazanEl = document.querySelector('[data-streaming="true"], [aria-live="polite"][aria-busy="true"], .streaming-indicator'); // yazma göstergesi
        return !!(yazanEl || (stopButon && stopButon.offsetParent !== null)); // herhangi biri varsa streaming
    }
    return false; // bilinmeyen kaynak
}

// Sayfa başlığını yaygın suffix'lerden temizler (çok dilli)
function basligiTemizle(hamBaslik, kaynak) {
    if (!hamBaslik) return ''; // boş kontrol
    let baslik = hamBaslik.trim(); // kenar boşlukları temizle

    // Tüm kaynaklar için ortak suffix temizleme
    const ortakSuffixler = [ // yaygın site suffix'leri
        ' - Google Gemini', ' – Google Gemini', ' | Google Gemini', 'Google Gemini',
        ' - Gemini', ' – Gemini', ' | Gemini',
        ' - Claude', ' – Claude', ' | Claude', 'Claude',
        ' - ChatGPT', ' – ChatGPT', ' | ChatGPT', 'ChatGPT',
        ' - OpenAI', ' – OpenAI',
        ' - Grok', ' – Grok', ' | Grok', 'Grok',
        ' - xAI', ' – xAI', ' | xAI'
    ];
    for (const suffix of ortakSuffixler) { // her suffix'i dene
        if (baslik.endsWith(suffix)) { // suffix ile bitiyorsa
            baslik = baslik.substring(0, baslik.length - suffix.length).trim(); // kaldır
        }
    }

    // Gemini'ye özgü sidebar suffix'leri (TR + EN)
    if (kaynak === 'gemini') { // Gemini için
        const geminiSuffixler = [/Sabitlenmiş sohbet$/, /Pinned chat$/, /Pinned$/, /Sabitlenmiş$/]; // sabitlenmiş suffix'leri
        for (const kalip of geminiSuffixler) { // her deseni dene
            baslik = baslik.replace(kalip, '').trim(); // kaldır
        }
    }

    // Windows/macOS dosya adı için tehlikeli karakterleri kaldır (PDF export için)
    // Boşluk ve tire KORUNUR — sadece FS için yasaklı karakterleri sil
    baslik = baslik.replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, ' ').trim(); // yasaklıları sil + fazla boşlukları normalize et
    if (baslik.length > 150) baslik = baslik.substring(0, 150).trim(); // çok uzun başlıkları kes

    return baslik; // temizlenmiş başlık
}

// Veriyi JSON string olarak boyut hesaplar (quota kontrolü için)
function veriBoyutuHesapla(veri) {
    try { // JSON stringify edilir
        const str = JSON.stringify(veri); // string'e çevir
        return new Blob([str]).size; // byte boyutu (Unicode-safe)
    } catch (hata) { // stringify hatası
        return 0; // hesaplanamadı
    }
}

// Konuşma verisinin storage quota'sını kontrol eder
function quotaKontrol(veri) {
    const boyut = veriBoyutuHesapla(veri); // byte cinsinden boyut
    const mbBoyut = (boyut / (1024 * 1024)).toFixed(2); // MB cinsinden
    if (boyut > STORAGE_LOCAL_LIMIT) { // hard limit aşıldı
        return { gecerli: false, boyut: boyut, mbBoyut: mbBoyut, mesaj: 'Konuşma çok büyük (' + mbBoyut + ' MB). Storage sınırı 10 MB. Lütfen daha kısa bir konuşma seçin.' };
    }
    if (boyut > STORAGE_UYARI_ESIGI) { // uyarı eşiği aşıldı ama hala geçerli
        return { gecerli: true, uyari: true, boyut: boyut, mbBoyut: mbBoyut, mesaj: 'Konuşma büyük (' + mbBoyut + ' MB). Yazdırma biraz yavaş olabilir.' };
    }
    return { gecerli: true, uyari: false, boyut: boyut, mbBoyut: mbBoyut }; // normal
}

// Varsayılan yazdırma başlatma — tüm content script'ler tarafından kullanılır
async function yazdirmayaBasla(veri, uyariBalonuGoster) {
    if (veri.hata) { // hata varsa
        uyariBalonuGoster('Hata: ' + veri.hata, 'hata'); // hata mesajı
        return false; // iptal
    }

    if (!veri.mesajlar || veri.mesajlar.length === 0) { // mesaj yoksa
        uyariBalonuGoster('Konuşmada mesaj bulunamadı.', 'hata'); // uyarı
        return false; // iptal
    }

    // Kullanıcının kaydettiği ayarları yükle (varsa)
    const ayarlar = await ayarlariYukle(); // kalıcı ayarları çek

    // Storage quota kontrolü — veri çok büyükse kullanıcıyı uyar
    const quotaDurum = quotaKontrol(veri); // quota kontrolü
    if (!quotaDurum.gecerli) { // hard limit aşılmışsa
        uyariBalonuGoster(quotaDurum.mesaj, 'hata'); // hata mesajı
        return false; // iptal
    }
    if (quotaDurum.uyari) { // uyarı seviyesindeyse bilgi ver ama devam et
        console.log('AI Chat Printer [DEBUG]: Büyük konuşma tespit edildi:', quotaDurum.mbBoyut, 'MB'); // debug
    }

    // Veriyi chrome.storage.local'a kaydet
    try { // storage erişim denemesi
        await chrome.storage.local.set({ // geçici veri kaydet
            konusmaVerisi: veri, // konuşma içeriği
            yazdirAyarlari: ayarlar // yazdırma ayarları
        });
    } catch (storageHata) { // extension context kaybolmuşsa veya quota aşıldıysa
        const mesaj = storageHata.message || ''; // hata mesajı
        if (/quota/i.test(mesaj)) { // quota hatası
            uyariBalonuGoster('Storage sınırı doldu. Lütfen daha kısa bir konuşma seçin veya resimleri atlayın.', 'hata'); // quota uyarısı
        } else { // context invalidation
            uyariBalonuGoster('Eklenti bağlantısı koptu. Sayfayı yenileyip (F5) tekrar deneyin.', 'hata'); // hata mesajı
        }
        console.error('AI Chat Printer: chrome.storage erişim hatası:', mesaj); // debug
        return false; // iptal
    }

    uyariBalonuGoster(veri.mesajSayisi + ' mesaj çıkarıldı. Yazdırma sayfası açılıyor...', 'basari'); // başarı mesajı

    // Yazdırma sayfasını aç
    try { // runtime erişim denemesi
        chrome.runtime.sendMessage({ islem: 'yazdirmaSayfasiAc' }); // background'a mesaj gönder
    } catch (iletisimHata) { // runtime kaybolmuşsa
        uyariBalonuGoster('Arka plan bağlantısı koptu. Sayfayı yenileyin (F5).', 'hata'); // uyarı
        return false;
    }
    return true; // başarılı
}

// Konuşma verisini Markdown formatına dönüştürür (clipboard export için)
function konusmayiMarkdowneDonustur(veri) {
    if (!veri || !veri.mesajlar) return ''; // veri yoksa boş

    // Markdown başlık escape — "#" ile başlayan kullanıcı metni başlık gibi görünmesin
    const mdBaslikEscape = (str) => (str || '').replace(/^(#{1,6})\s/gm, '\\$1 '); // satır başı # escape

    const yapayZekaAdi = veri.kaynak === 'claude' ? 'Claude' : veri.kaynak === 'chatgpt' ? 'ChatGPT' : veri.kaynak === 'grok' ? 'Grok' : 'Gemini'; // kaynak adı
    let md = '# ' + (veri.baslik || (yapayZekaAdi + ' Konuşması')) + '\n\n'; // başlık
    md += '**Tarih:** ' + (veri.tarih || '') + ' ' + (veri.saat || '') + '  \n'; // tarih
    md += '**Mesaj sayısı:** ' + (veri.mesajSayisi || 0) + '  \n'; // mesaj sayısı
    md += '**Kaynak:** ' + yapayZekaAdi + '\n\n'; // kaynak
    md += '---\n\n'; // ayırıcı

    veri.mesajlar.forEach((mesaj, idx) => { // her mesaj
        const rolAdi = mesaj.rol === 'kullanici' ? 'Kullanıcı' : yapayZekaAdi; // rol etiketi
        md += '## #' + (idx + 1) + ' — ' + rolAdi + '\n\n'; // mesaj başlığı
        const metin = mdBaslikEscape((mesaj.metin || '').trim()); // başlık escape uygulanan metin
        md += metin ? metin + '\n\n' : '_(boş mesaj)_\n\n'; // metin veya placeholder

        // Artifact'ları kod bloğu olarak ekle
        if (mesaj.artifactlar && mesaj.artifactlar.length > 0) { // artifact varsa
            mesaj.artifactlar.forEach((artifact) => { // her artifact
                md += '### ' + (artifact.baslik || 'Dosya') + (artifact.tur ? ' (' + artifact.tur + ')' : '') + '\n\n'; // artifact başlığı
                md += '```\n' + (artifact.icerik || '(içerik çıkarılamadı)') + '\n```\n\n'; // kod bloğu
            });
        }

        // Ekstra resim sayısını belirt (base64 çok uzun olur)
        if (mesaj.resimler && mesaj.resimler.length > 0) { // resim varsa
            md += '_(Bu mesajda ' + mesaj.resimler.length + ' resim var - Markdown çıktısında görsel yok.)_\n\n'; // not
        }

        md += '---\n\n'; // mesaj ayırıcı
    });

    md += '\n> Bu çıktı AI Chat Printer eklentisi ile oluşturulmuştur.\n'; // footer
    return md; // markdown string
}
