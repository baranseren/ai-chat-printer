// AI Chat Printer - Ortak Yardımcılar
// Gemini, Claude, ChatGPT ve Grok content script'leri tarafından paylaşılır
// MV3 content script array'inde ikinci sırada yüklenir (resim-yardimcilari'ndan sonra)

// Tüm eklenti için tek varsayılan ayar kaynağı
const VARSAYILAN_AYARLAR = { // varsayılan kullanıcı ayarları
    kodBloklari: true, // kod blokları dahil
    otomatikYazdir: true, // otomatik yazdır
    yaziBoyutu: '13', // normal yazı boyutu (px)
    footerGoster: true, // eklenti imzasını göster (true = footer aktif)
    kagitBoyutu: 'A4', // varsayılan kâğıt boyutu
    yonlendirme: 'portrait', // varsayılan dikey sayfa
    kenarBosluk: 'normal', // varsayılan sayfa kenar boşluğu
    linkAdresleriniGoster: true // baskıda bağlantı adreslerini görünür yap
};

// chrome.storage.local quota — API'den dinamik oku (varsayılan 10MB)
// chrome.storage.local.QUOTA_BYTES = 10485760 (10MB) — bazı sürümlerde farklı olabilir
const STORAGE_LOCAL_LIMIT = (typeof chrome !== 'undefined' && chrome.storage?.local?.QUOTA_BYTES) || (10 * 1024 * 1024); // resmi quota veya fallback
const STORAGE_UYARI_ESIGI = Math.floor(STORAGE_LOCAL_LIMIT * 0.8); // %80 eşik (8 MB) — bu eşikten sonra uyar
const RESIM_TOPLAM_SURE_LIMIT = 90 * 1000; // 90 saniye — tüm resim dönüşümleri için toplam limit
const YAZDIRMA_OTURUM_ANAHTAR_ON_EKI = 'aiChatPrinterOturum:'; // her yazdırma isteğini benzersiz storage anahtarında tutar
const ARKA_PLAN_YENIDEN_DENEME_GECIKMELERI = [0, 150, 500]; // service worker uyanma yarışında üç kontrollü deneme
const ARKA_PLAN_MESAJ_ZAMAN_ASIMI = 1500; // yanıtsız kalan MV3 mesaj kanalı yazdırma akışını sonsuza kadar kilitleyemez
const BAGLANTI_KURTARMA_ANAHTARI = 'aiChatPrinterBaglantiKurtarmaV1'; // otomatik sayfa yenileme ve tek seferlik devam kaydı
const BAGLANTI_KURTARMA_AZAMI_YASI = 60 * 1000; // eski kurtarma kaydı bir dakika sonra geçersizdir

// Belirtilen süre kadar asenkron bekler
function ortakBekle(sure) {
    return new Promise((coz) => setTimeout(coz, sure)); // zamanlayıcı tamamlanınca çöz
}

// Bir Promise işlemini belirlenen sürede yanıt gelmezse anlamlı hatayla sonlandırır
function zamanAsimliIslem(promise, sure, hataMesaji) {
    let zamanlayici; // başarı veya hata sonrası temizlenecek sayaç
    const zamanAsimi = new Promise((coz, reddet) => { // dış API'nin yanıtsız kalmasını sınırlayan yarışmacı
        zamanlayici = setTimeout(() => reddet(new Error(hataMesaji)), sure); // süre dolunca bağlantı hatası üret
    });
    return Promise.race([promise, zamanAsimi]).finally(() => clearTimeout(zamanlayici)); // ilk sonucu döndür ve sayacı bırakma
}

// Bir hatanın eklenti bağlamı veya mesaj kanalı kopmasından kaynaklanıp kaynaklanmadığını belirler
function eklentiBaglantiHatasiMi(hata) {
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id) return true; // uzantı bağlamı artık geçerli değil
    const mesaj = String(hata && hata.message ? hata.message : hata || ''); // farklı hata biçimlerini tek metne indir
    return /extension context invalidated|could not establish connection|receiving end does not exist|message port|message channel|context.*invalid|bağlantı.*koptu|arka plan.*yanıt vermedi/i.test(mesaj); // Chrome sürümleri arasındaki metin varyantları
}

// Service worker mesajını kısa uyanma yarışlarına dayanıklı biçimde gönderir
async function arkaPlanMesajiGonder(mesaj) {
    let sonHata = null; // son denemenin tanı bilgisi
    for (let deneme = 0; deneme < ARKA_PLAN_YENIDEN_DENEME_GECIKMELERI.length; deneme++) { // sınırlı yeniden deneme
        const gecikme = ARKA_PLAN_YENIDEN_DENEME_GECIKMELERI[deneme]; // bu denemenin bekleme süresi
        if (gecikme > 0) await ortakBekle(gecikme); // service worker'ın yeniden doğmasına zaman tanı
        try { // runtime erişimi ve mesaj yanıtı
            if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.id || typeof chrome.runtime.sendMessage !== 'function') {
                throw new Error('Extension context invalidated.'); // ortak bağlantı sınıflandırıcısına açık sinyal
            }
            const yanit = await zamanAsimliIslem(chrome.runtime.sendMessage(mesaj), ARKA_PLAN_MESAJ_ZAMAN_ASIMI, 'Arka plan yanıt vermedi.'); // yanıtsız MV3 kanalını sınırlı tut
            if (!yanit) throw new Error('Arka plan yanıt vermedi.'); // yanıtsız portu başarı sayma
            return yanit; // ilk geçerli yanıt
        } catch (hata) { // uyanma veya bağlam hatası
            sonHata = hata; // son hatayı sakla
        }
    }
    throw sonHata || new Error('Arka plan bağlantısı kurulamadı.'); // tüm denemeler tükendi
}

// Otomatik bağlantı kurtarma kaydını güvenli biçimde okur
function baglantiKurtarmaKaydiniOku() {
    try { // host sayfanın sessionStorage erişimi engellenebilir
        const ham = sessionStorage.getItem(BAGLANTI_KURTARMA_ANAHTARI); // sekmeye özel kayıt
        return ham ? JSON.parse(ham) : null; // doğrulanacak nesne veya null
    } catch (hata) { // kapalı storage
        return null; // kurtarma kaydı yok kabul et
    }
}

// Otomatik bağlantı kurtarma kaydını siler
function baglantiKurtarmaKaydiniTemizle() {
    try { sessionStorage.removeItem(BAGLANTI_KURTARMA_ANAHTARI); } catch (hata) {} // host storage kapalıysa ana akışı engelleme
}

// Kopan eklenti bağlamında sayfayı bir kez otomatik yeniler ve işlem devam işaretini bırakır
function baglantiKurtarmayiBaslat(uyariBalonuGoster, hata) {
    const simdi = Date.now(); // tek zaman değeri
    const onceki = baglantiKurtarmaKaydiniOku(); // aynı sekmedeki önceki deneme
    const oncekiGecerli = onceki && Number(onceki.zaman || 0) > simdi - BAGLANTI_KURTARMA_AZAMI_YASI; // bir dakikalık pencere
    const deneme = oncekiGecerli ? Number(onceki.deneme || 0) : 0; // güncel deneme sayısı
    if (deneme >= 1) { // arka plan gerçek anlamda bozuksa yenileme döngüsü oluşturma
        baglantiKurtarmaKaydiniTemizle(); // kilidi bırak
        uyariBalonuGoster('Eklenti arka planı otomatik olarak yeniden başlatılamadı.', 'hata'); // F5 buyurmadan somut sonuç
        console.log('AI Chat Printer: Otomatik bağlantı kurtarma tamamlanamadı:', hata && hata.message ? hata.message : hata); // tanı izi
        return false; // ikinci yenileme yok
    }
    try { // otomatik devam kaydını yaz
        sessionStorage.setItem(BAGLANTI_KURTARMA_ANAHTARI, JSON.stringify({ zaman: simdi, deneme: 1, otomatikDevam: true })); // reload sonrası tek seferlik devam
    } catch (storageHata) { // host storage kapalıysa yine sayfa yenilenebilir
        console.log('AI Chat Printer: Bağlantı kurtarma kaydı yazılamadı:', storageHata.message); // tanı izi
    }
    uyariBalonuGoster('Eklenti bağlantısı otomatik yenileniyor. İşlem kaldığı yerden sürecek...', 'basari'); // kullanıcıya otomatik akışı bildir
    setTimeout(() => window.location.reload(), 600); // eski content script bağlamını yeni sürümle değiştir
    return true; // yenileme başlatıldı
}

// Sayfa otomatik yenilendiyse bekleyen yazdırma işlemini yalnız bir kez sürdürür
function bekleyenYazdirmayiDevamEttir(yazdirmaFonksiyonu) {
    const kayit = baglantiKurtarmaKaydiniOku(); // sekmeye özel işaret
    if (!kayit || kayit.otomatikDevam !== true || Number(kayit.zaman || 0) <= Date.now() - BAGLANTI_KURTARMA_AZAMI_YASI) {
        if (kayit) baglantiKurtarmaKaydiniTemizle(); // eski/bozuk kaydı temizle
        return; // devam edecek işlem yok
    }
    try { // aynı reload'da ikinci tetiklemeyi önle
        sessionStorage.setItem(BAGLANTI_KURTARMA_ANAHTARI, JSON.stringify({ zaman: Number(kayit.zaman), deneme: 1, otomatikDevam: false })); // başarısızlıkta döngü koruması kalır
    } catch (hata) {} // storage kapalıysa fonksiyon yine bir kez çağrılır
    setTimeout(() => Promise.resolve(yazdirmaFonksiyonu()).catch((hata) => console.log('AI Chat Printer: Otomatik yazdırma devamı başarısız:', hata.message)), 900); // SPA DOM'unun yerleşmesini bekleyip sürdür
}

// Kayıtlı ayarları izinli değerlerle sınırlar ve eksik alanları varsayılanla tamamlar
function ayarlariDogrula(ayarlar) {
    const ham = ayarlar && typeof ayarlar === 'object' ? ayarlar : {}; // yanlış tipte kaydı boş kabul et
    const yaziBoyutlari = ['11', '13', '15', '17']; // desteklenen yazı boyutları
    const kagitBoyutlari = ['A4', 'A3', 'Letter']; // desteklenen kâğıt boyutları
    const yonlendirmeler = ['portrait', 'landscape']; // desteklenen sayfa yönleri
    const kenarBosluklari = ['dar', 'normal', 'genis']; // desteklenen kenar boşlukları
    return { // yalnız tanımlı alanları döndür
        kodBloklari: ham.kodBloklari !== false, // varsayılan açık
        otomatikYazdir: ham.otomatikYazdir !== false, // varsayılan açık
        yaziBoyutu: yaziBoyutlari.includes(String(ham.yaziBoyutu)) ? String(ham.yaziBoyutu) : VARSAYILAN_AYARLAR.yaziBoyutu, // izinli boyut
        footerGoster: ham.footerGoster !== false, // varsayılan açık
        kagitBoyutu: kagitBoyutlari.includes(ham.kagitBoyutu) ? ham.kagitBoyutu : VARSAYILAN_AYARLAR.kagitBoyutu, // izinli kâğıt
        yonlendirme: yonlendirmeler.includes(ham.yonlendirme) ? ham.yonlendirme : VARSAYILAN_AYARLAR.yonlendirme, // izinli yön
        kenarBosluk: kenarBosluklari.includes(ham.kenarBosluk) ? ham.kenarBosluk : VARSAYILAN_AYARLAR.kenarBosluk, // izinli boşluk
        linkAdresleriniGoster: ham.linkAdresleriniGoster !== false // varsayılan açık
    };
}

// URL/storage üzerinden gelen oturum kimliğinin güvenli biçimde olup olmadığını denetler
function yazdirmaOturumKimligiGecerliMi(oturumKimligi) {
    return typeof oturumKimligi === 'string' && /^[a-z0-9-]{8,80}$/i.test(oturumKimligi); // UUID ve fallback kimlikleri kabul et
}

// Yazdırma oturumunun storage anahtarını üretir
function yazdirmaOturumAnahtari(oturumKimligi) {
    if (!yazdirmaOturumKimligiGecerliMi(oturumKimligi)) return ''; // geçersiz kimliği storage anahtarına taşıma
    return YAZDIRMA_OTURUM_ANAHTAR_ON_EKI + oturumKimligi; // oturum kimliği ile çakışmasız anahtar üret
}

// Her yazdırma isteği için benzersiz bir kimlik üretir
function yazdirmaOturumKimligiOlustur() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID(); // modern ve çakışmasız kimlik
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2); // eski tarayıcılar için fallback
}

// Konuşma verisini yalnızca ilgili yazdırma sekmesinin okuyacağı oturumda saklar
async function yazdirmaOturumuOlustur(veri, ayarlar, veriBoyutu) {
    if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
        throw new Error('Eklenti bağlantısı koptu. Sayfayı yenileyip (F5) tekrar deneyin.'); // storage yoksa anlamlı hata
    }
    const oturumKimligi = yazdirmaOturumKimligiOlustur(); // her yazdırma akışına ayrı kimlik ver
    const anahtar = yazdirmaOturumAnahtari(oturumKimligi); // oturuma özel storage anahtarı
    await chrome.storage.local.set({
        [anahtar]: { // global anahtar çakışmasını önleyen paket
            konusmaVerisi: veri, // çıkarılmış konuşma içeriği
            yazdirAyarlari: ayarlariDogrula(ayarlar), // o akışta geçerli ve doğrulanmış ayarlar
            olusturmaZamani: Date.now(), // bakım temizliği için zaman damgası
            veriBoyutu: Number(veriBoyutu) || 0 // önizlemenin uygun F5 yedeğini seçmesi için boyut
        }
    });
    return oturumKimligi; // yazdırma sayfasına aktarılacak kimlik
}

// Ayarları chrome.storage.sync'ten yükler — kalıcı senkronize ayarlar
async function ayarlariYukle() {
    try { // storage erişimi başarısız olabilir (context invalidation)
        if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.sync) {
            return { ...VARSAYILAN_AYARLAR }; // chrome.storage erişilemez — sessizce varsayılan dön
        }
        const kayit = await chrome.storage.sync.get(['kullaniciAyarlari']); // sync storage'dan oku
        const kayitli = kayit.kullaniciAyarlari || {}; // kayıtlı ayarlar veya boş obje
        return ayarlariDogrula(kayitli); // kayıtlı değerleri doğrula ve varsayılanları tamamla
    } catch (hata) { // erişim başarısızsa varsayılanı dön
        console.log('AI Chat Printer: Ayar yükleme başarısız, varsayılan kullanılıyor:', hata.message); // sessiz log (warn değil — extension errors'ta görünmesin)
        return { ...VARSAYILAN_AYARLAR }; // varsayılan ayarları döndür
    }
}

// Ayarları chrome.storage.sync'e kaydeder — popup tarafından çağrılır
async function ayarlariKaydet(ayarlar) {
    try { // storage erişim denemesi
        if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.sync) {
            return false; // chrome.storage erişilemez
        }
        await chrome.storage.sync.set({ kullaniciAyarlari: ayarlariDogrula(ayarlar) }); // yalnız doğrulanmış ayarları sync storage'a yaz
        return true; // başarılı
    } catch (hata) { // erişim başarısızsa
        console.log('AI Chat Printer: Ayar kaydetme başarısız:', hata.message); // sessiz log
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
        // data-assistant-content-started tamamlanmış mesajlarda da kalıcıdır; streaming sinyali olarak kullanılırsa tüm konuşmalar kilitlenir
        const yazanEl = document.querySelector('.result-streaming, [data-message-status="in_progress"]'); // yalnız açık ilerleme durumları
        const yazanElAktif = yazanEl && yazanEl.offsetParent !== null; // gizli/kalıntı göstergeyi reddet
        return !!(yazanElAktif || (stopButon && stopButon.offsetParent !== null)); // yalnız gerçek aktif gösterge
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
    const limitMb = (STORAGE_LOCAL_LIMIT / (1024 * 1024)).toFixed(0); // gerçek limit MB (dinamik — sabit "10" yazmak yanlış bilgi olur)
    const sinirsizDepolama = typeof chrome !== 'undefined' && chrome.runtime?.getManifest?.().permissions?.includes('unlimitedStorage'); // izin varsa 10 MB kotası geçerli değil
    if (!sinirsizDepolama && boyut > STORAGE_LOCAL_LIMIT) { // izin yokken gerçek kota aşıldı
        return { gecerli: false, boyut: boyut, mbBoyut: mbBoyut, mesaj: 'Konuşma çok büyük (' + mbBoyut + ' MB). Storage sınırı ' + limitMb + ' MB. Lütfen daha kısa bir konuşma seçin.' };
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

    let oturumKimligi; // yalnız ilgili önizleme sekmesinin okuyacağı veri paketi
    try { // storage erişim denemesi
        oturumKimligi = await yazdirmaOturumuOlustur(veri, ayarlar, quotaDurum.boyut); // konuşmayı boyutuyla birlikte sakla
    } catch (storageHata) { // extension context kaybolmuşsa veya quota aşıldıysa
        const mesaj = storageHata.message || ''; // hata mesajı
        if (/quota/i.test(mesaj)) { // quota hatası
            uyariBalonuGoster('Konuşma verisi tarayıcı depolamasına sığmadı: ' + mesaj, 'hata'); // gerçek depolama hatasını bildir
        } else if (eklentiBaglantiHatasiMi(storageHata)) { // context invalidation
            baglantiKurtarmayiBaslat(uyariBalonuGoster, storageHata); // sayfayı ve işlemi otomatik kurtar
        } else { // gerçek storage/veri hatası
            uyariBalonuGoster('Konuşma verisi kaydedilemedi: ' + mesaj, 'hata'); // hatayı yanlış bağlantı etiketiyle gizleme
        }
        console.log('AI Chat Printer: chrome.storage erişim hatası:', mesaj); // sessiz log (error değil — extension errors'ta görünmesin)
        return false; // iptal
    }

    uyariBalonuGoster(veri.mesajSayisi + ' mesaj çıkarıldı. Yazdırma sayfası açılıyor...', 'basari'); // başarı mesajı

    // Yazdırma sayfasını aç
    try { // runtime erişim denemesi
        const yanit = await arkaPlanMesajiGonder({ islem: 'yazdirmaSayfasiAc', oturumKimligi: oturumKimligi }); // service worker uyanma yarışına dayanıklı açılış
        if (!yanit.basari) { // arka plan çalıştı ancak işlem reddedildi
            if (oturumKimligi) await chrome.storage.local.remove(yazdirmaOturumAnahtari(oturumKimligi)).catch(() => {}); // reddedilen paketi bırakma
            uyariBalonuGoster(yanit.hata || 'Yazdırma sayfası açılamadı.', 'hata'); // gerçek iş hatasını göster
            return false; // bağlantı kurtarma tetikleme
        }
    } catch (iletisimHata) { // runtime veya mesaj kanalı kaybolmuşsa
        if (oturumKimligi) chrome.storage.local.remove(yazdirmaOturumAnahtari(oturumKimligi)).catch(() => {}); // açılamayan önizlemenin paketini bırakma
        if (eklentiBaglantiHatasiMi(iletisimHata)) baglantiKurtarmayiBaslat(uyariBalonuGoster, iletisimHata); // F5 yerine otomatik reload + devam
        else uyariBalonuGoster('Yazdırma sayfası açılamadı: ' + (iletisimHata.message || iletisimHata), 'hata'); // bağlantı dışı gerçek hata
        return false;
    }
    baglantiKurtarmaKaydiniTemizle(); // başarılı açılışta döngü korumasını bırak
    return true; // başarılı
}

// İçerikteki backtick dizilerinden daha uzun bir Markdown fence üretir (fence kaçışı önleme)
// Örn. markdown öğreten bir cevapta ``` geçiyorsa fence ```` olur — blok erken kapanmaz
function mdFenceUret(icerik) {
    const diziler = (icerik || '').match(/`{3,}/g); // içerikteki 3+ backtick dizileri
    const enUzun = diziler ? diziler.reduce((enBuyuk, dizi) => Math.max(enBuyuk, dizi.length), 0) : 0; // en uzun dizi (reduce — spread dev dizide stack overflow yapar)
    return '`'.repeat(Math.max(3, enUzun + 1)); // içeriktekinden en az 1 fazla, min 3
}

// HTML string'ini gerçek Markdown'a dönüştürür (başlık, kod, liste, tablo, link korunur)
function htmlToMarkdown(htmlString) {
    if (!htmlString) return ''; // boş girdi kontrolü

    const parser = new DOMParser(); // güvenli parse (script çalışmaz)
    const doc = parser.parseFromString(htmlString, 'text/html'); // HTML belge

    // PRE içindeki code'un class'ından dil adını çıkarır (language-python → python)
    function preDilBul(preElement) {
        const kodEl = preElement.querySelector('code'); // code çocuğu
        const sinif = (kodEl && typeof kodEl.className === 'string' ? kodEl.className : '') + ' ' + (typeof preElement.className === 'string' ? preElement.className : ''); // iki class birleşimi
        const eslesme = sinif.match(/language-([\w+-]+)/); // language-xxx kalıbı
        return eslesme ? eslesme[1] : ''; // dil adı veya boş
    }

    // Tablo elementini Markdown pipe tablosuna çevirir
    function tabloyuCevir(tablo) {
        const satirlar = Array.from(tablo.querySelectorAll('tr')); // tüm satırlar
        if (satirlar.length === 0) return ''; // boş tablo
        const hucreMetni = (hucre) => dugumleriCevir(hucre, false).replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim(); // pipe escape + tek satıra indir
        const satirMd = (tr) => '| ' + Array.from(tr.querySelectorAll('th, td')).map(hucreMetni).join(' | ') + ' |'; // satırı pipe formatla
        const kolonSayisi = satirlar[0].querySelectorAll('th, td').length; // ilk satır kolon sayısı
        let md = satirMd(satirlar[0]) + '\n'; // ilk satır = header varsay
        md += '|' + ' --- |'.repeat(kolonSayisi) + '\n'; // ayırıcı satır
        for (let i = 1; i < satirlar.length; i++) md += satirMd(satirlar[i]) + '\n'; // veri satırları
        return '\n\n' + md + '\n'; // blok olarak döndür
    }

    // Liste elementini (UL/OL) girintili Markdown listesine çevirir
    function listeyiCevir(liste, derinlik) {
        const sirali = liste.tagName === 'OL'; // numaralı mı
        const girinti = '  '.repeat(derinlik); // 2 boşluk/derinlik girinti
        let sayac = parseInt(liste.getAttribute('start') || '1', 10) || 1; // başlangıç numarası
        let md = ''; // birikecek markdown
        for (const li of liste.children) { // her liste öğesi
            if (li.tagName !== 'LI') continue; // LI dışını atla
            let icerik = ''; // öğe içeriği
            for (const cocuk of li.childNodes) { // LI çocuklarını işle
                if (cocuk.nodeType === Node.ELEMENT_NODE && (cocuk.tagName === 'UL' || cocuk.tagName === 'OL')) {
                    icerik += '\n' + listeyiCevir(cocuk, derinlik + 1); // iç içe liste — alt satıra girintili
                } else {
                    icerik += dugumCevir(cocuk, false); // normal içerik
                }
            }
            icerik = icerik.replace(/\n{2,}/g, '\n').replace(/\n(?!\s*$)/g, '\n' + girinti + '  ').trim(); // çok satırlıyı marker hizasına girintile
            md += girinti + (sirali ? (sayac++) + '. ' : '- ') + icerik + '\n'; // marker + içerik
        }
        return md; // liste markdown'ı
    }

    // Tek bir DOM düğümünü Markdown'a çevirir (preIcinde = ham metin korunur)
    function dugumCevir(dugum, preIcinde) {
        if (dugum.nodeType === Node.TEXT_NODE) { // metin düğümü
            return preIcinde ? dugum.textContent : dugum.textContent.replace(/\s+/g, ' '); // pre'de ham, dışında boşluk normalize
        }
        if (dugum.nodeType !== Node.ELEMENT_NODE) return ''; // diğer düğüm tipleri atlanır

        const etiket = dugum.tagName.toUpperCase(); // normalize tag adı (SVG namespace lowercase dönebilir)
        const ic = () => dugumleriCevir(dugum, preIcinde); // çocukları işleyen kısayol

        switch (etiket) {
            case 'SCRIPT': case 'STYLE': case 'NOSCRIPT': case 'TEMPLATE': case 'IFRAME':
            case 'BUTTON': case 'SELECT': case 'TEXTAREA': case 'SVG': case 'CANVAS':
            case 'AUDIO': case 'VIDEO': case 'MAT-ICON':
                return ''; // UI/aktif içerik — metni markdown çıktısına SIZDIRMA ("Kodu kopyala", ikon ligature, CSS kuralı vb.)
            case 'H1': case 'H2': case 'H3': case 'H4': case 'H5': case 'H6':
                return '\n\n' + '#'.repeat(parseInt(etiket[1], 10)) + ' ' + ic().trim() + '\n\n'; // başlık seviyesi
            case 'P': case 'FIGURE': case 'FIGCAPTION':
                return '\n\n' + ic().trim() + '\n\n'; // paragraf bloğu
            case 'BR':
                return '\n'; // satır kırma
            case 'HR':
                return '\n\n---\n\n'; // yatay çizgi
            case 'STRONG': case 'B': {
                const kalin = ic().trim(); // iç metin
                return kalin ? '**' + kalin + '**' : ''; // kalın
            }
            case 'EM': case 'I': {
                const italik = ic().trim(); // iç metin
                return italik ? '*' + italik + '*' : ''; // italik
            }
            case 'DEL': case 'S': {
                const ustu = ic().trim(); // iç metin
                return ustu ? '~~' + ustu + '~~' : ''; // üstü çizili
            }
            case 'CODE': { // inline kod (pre içindeki code dugumleriCevir'de ham işlenir)
                const kod = dugum.textContent; // ham içerik
                return kod.includes('`') ? '`` ' + kod + ' ``' : '`' + kod + '`'; // backtick çakışmasına çift sargı
            }
            case 'PRE': {
                const dil = preDilBul(dugum); // dil tahmini
                const ham = dugum.textContent.replace(/\n$/, ''); // sondaki newline'ı kırp
                const fence = mdFenceUret(ham); // içerikteki ``` ile çakışmayan fence uzunluğu
                return '\n\n' + fence + dil + '\n' + ham + '\n' + fence + '\n\n'; // çitli kod bloğu
            }
            case 'A': {
                const href = dugum.getAttribute('href') || ''; // ham href
                const ham = ic().trim() || href; // işlenmiş iç içerik (element çocuklarda markdown üretmiş olabilir)
                const metin = dugum.children.length === 0 ? ham.replace(/([\[\]])/g, '\\$1') : ham; // [] escape SADECE düz metinli linkte — linkli resmin ![alt](src) sözdizimi bozulmasın
                if (!/^https?:\/\//.test(href)) return metin; // güvensiz şema → düz metin
                const guvenliHref = /[()\s]/.test(href) ? '<' + href + '>' : href; // parantezli/boşluklu URL → <> sargısı (Wikipedia linkleri linki erken kapatmasın)
                return '[' + metin + '](' + guvenliHref + ')'; // markdown link
            }
            case 'IMG': {
                const alt = (dugum.getAttribute('alt') || 'Görsel').replace(/([\[\]])/g, '\\$1'); // alt metin — köşeli parantez escape
                const src = dugum.getAttribute('src') || ''; // kaynak
                if (!src.startsWith('https://')) return '*[Görsel: ' + alt + ']*'; // base64 → placeholder (MB şişmesin)
                const guvenliSrc = /[()\s]/.test(src) ? '<' + src + '>' : src; // parantezli/boşluklu URL → <> sargısı
                return '![' + alt + '](' + guvenliSrc + ')'; // gömülü görsel
            }
            case 'UL': case 'OL':
                return '\n\n' + listeyiCevir(dugum, 0) + '\n'; // liste bloğu
            case 'BLOCKQUOTE':
                return '\n\n' + ic().trim().split('\n').map((satir) => '> ' + satir).join('\n') + '\n\n'; // her satıra alıntı işareti
            case 'TABLE':
                return tabloyuCevir(dugum); // pipe tablo
            case 'DIV': case 'SECTION': case 'ARTICLE': {
                const blok = ic(); // içerik
                return blok.trim() ? '\n' + blok + '\n' : ''; // div = yumuşak blok sınırı
            }
            default:
                return ic(); // SPAN, SUP, SUB vb. şeffaf — sadece içeriği geçir
        }
    }

    // Bir düğümün tüm çocuklarını sırayla Markdown'a çevirir
    function dugumleriCevir(ebeveyn, preIcinde) {
        let sonuc = ''; // birikecek markdown
        for (const cocuk of ebeveyn.childNodes) sonuc += dugumCevir(cocuk, preIcinde); // her çocuğu işle
        return sonuc; // birleşik metin
    }

    return dugumleriCevir(doc.body, false)
        .replace(/[ \t]+\n/g, '\n') // satır sonu boşluklarını kırp
        .replace(/\n{3,}/g, '\n\n') // 3+ boş satırı 2'ye indir
        .trim(); // kenarları temizle
}

// Mesajın en zengin Markdown temsilini döndürür — HTML varsa dönüştür, yoksa düz metin
function mesajMarkdownIcerigi(mesaj) {
    if (mesaj.html) { // HTML içerik mevcutsa
        const md = htmlToMarkdown(mesaj.html); // gerçek markdown dönüşümü
        if (md) return md; // dönüşüm başarılıysa kullan
    }
    // Fallback: düz metin — satır başı # işaretlerini escape et (sahte başlık önleme)
    return (mesaj.metin || '').trim().replace(/^(#{1,6})\s/gm, '\\$1 '); // escape'li düz metin
}

// Konuşma verisini Markdown formatına dönüştürür (clipboard ve dosya export için)
function konusmayiMarkdowneDonustur(veri, footerGoster) {
    if (!veri || !veri.mesajlar) return ''; // veri yoksa boş

    const yapayZekaAdi = veri.kaynak === 'claude' ? 'Claude' : veri.kaynak === 'chatgpt' ? 'ChatGPT' : veri.kaynak === 'grok' ? 'Grok' : 'Gemini'; // kaynak adı
    let md = '# ' + (veri.baslik || (yapayZekaAdi + ' Konuşması')) + '\n\n'; // başlık
    md += '**Tarih:** ' + (veri.tarih || '') + ' ' + (veri.saat || '') + '  \n'; // tarih
    md += '**Mesaj sayısı:** ' + (veri.mesajSayisi || 0) + '  \n'; // mesaj sayısı
    md += '**Kaynak:** ' + yapayZekaAdi + '\n\n'; // kaynak
    md += '---\n\n'; // ayırıcı

    veri.mesajlar.forEach((mesaj, idx) => { // her mesaj
        const rolAdi = mesaj.rol === 'kullanici' ? 'Kullanıcı' : yapayZekaAdi; // rol etiketi
        md += '## #' + (idx + 1) + ' — ' + rolAdi + '\n\n'; // mesaj başlığı
        const metin = mesajMarkdownIcerigi(mesaj); // HTML'den gerçek markdown (başlık/kod/liste/tablo korunur)
        md += metin ? metin + '\n\n' : '_(boş mesaj)_\n\n'; // metin veya placeholder

        // Artifact'ları kod bloğu olarak ekle
        if (mesaj.artifactlar && mesaj.artifactlar.length > 0) { // artifact varsa
            mesaj.artifactlar.forEach((artifact) => { // her artifact
                md += '### ' + (artifact.baslik || 'Dosya') + (artifact.tur ? ' (' + artifact.tur + ')' : '') + '\n\n'; // artifact başlığı
                const fence = mdFenceUret(artifact.icerik || ''); // artifact içindeki ``` ile çakışmayan fence (örn. README.md artifact'ı)
                md += fence + '\n' + (artifact.icerik || '(içerik çıkarılamadı)') + '\n' + fence + '\n\n'; // kod bloğu
            });
        }

        // Ekstra resim sayısını belirt (base64 çok uzun olur)
        if (mesaj.resimler && mesaj.resimler.length > 0) { // resim varsa
            md += '_(Bu mesajda ' + mesaj.resimler.length + ' resim var - Markdown çıktısında görsel yok.)_\n\n'; // not
        }

        md += '---\n\n'; // mesaj ayırıcı
    });

    if (footerGoster !== false) md += '\n> Bu çıktı AI Chat Printer eklentisi ile oluşturulmuştur.\n'; // kullanıcı isterse footer ekle
    return md; // markdown string
}

// Elementin UI çöplerinden (buton, ikon, form, script/style) arındırılmış klonunu döndürür
function uiTemizKlon(element) {
    const klon = element.cloneNode(true); // orijinal DOM'a dokunma
    klon.querySelectorAll('button, [role="button"], mat-icon, svg, script, style, noscript, template, select, textarea').forEach((el) => el.remove()); // UI elementlerini içerikleriyle at
    return klon; // temiz klon
}

// Elementin UI metni sızıntısız düz metnini döndürür ("Kodu kopyala", content_copy vb. dahil edilmez)
function temizMetinCikar(element) {
    if (!element) return ''; // element yoksa boş
    return (uiTemizKlon(element).textContent || '').trim(); // temiz klondan metin
}

// İçeriği dosya olarak indirir — Blob + gizli <a download> pattern'i (tüm context'lerde çalışır)
function dosyayaIndir(icerik, dosyaAdi, mimeType) {
    const blob = new Blob([icerik], { type: mimeType }); // içerik blob'u
    const url = URL.createObjectURL(blob); // geçici URL
    const link = document.createElement('a'); // gizli indirme linki
    link.href = url; // blob URL
    link.download = dosyaAdi; // indirilecek dosya adı
    document.body.appendChild(link); // DOM'a ekle (Firefox uyumu)
    link.click(); // indirmeyi tetikle
    document.body.removeChild(link); // hemen kaldır
    setTimeout(() => URL.revokeObjectURL(url), 1000); // 1sn sonra URL'i serbest bırak
}
