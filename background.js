// Background service worker - content script'ten gelen mesajları ve klavye kısayolunu işler

importScripts('site-yardimcilari.js'); // popup ve background aynı tam-hostname sözleşmesini kullanır

const YAZDIRMA_OTURUM_AZAMI_YASI = 6 * 60 * 60 * 1000; // sahipsiz paketler en fazla altı saat tutulur
const ONIZLEME_SEKME_ANAHTAR_ON_EKI = 'aiChatPrinterOnizlemeSekmesi:'; // aynı açma isteğinin iki önizleme üretmesini engeller
const ONIZLEME_SEKME_ESLEME_AZAMI_YASI = 30 * 1000; // eski tab kimliğinin sonradan başka sayfaya taşınma riskini sınırlar
const ICERIK_BETIGI_HAZIRLIK_DENEMESI = 40; // otomatik sekme yenilemesi sonrası en fazla 12 saniye bekle

// Kısa asenkron bekleme üretir
function arkaPlanBekle(sure) {
    return new Promise((coz) => setTimeout(coz, sure)); // belirtilen sürede tamamlan
}

// Eski veya süresi dolmuş yazdırma oturumlarını temizler
async function kalintiYazdirmaOturumlariniTemizle(tumunuSil) {
    try { // storage erişim denemesi
        const tumKayitlar = await chrome.storage.local.get(null); // tüm geçici kayıtları oku
        const simdi = Date.now(); // yaş hesabı için tek zaman değeri
        const silinecekAnahtarlar = Object.keys(tumKayitlar).filter((anahtar) => { // yalnız eklentinin taşıma paketlerini seç
            if (anahtar === 'konusmaVerisi' || anahtar === 'yazdirAyarlari') return true; // eski ortak anahtarlar her zaman temizlenir
            if (!anahtar.startsWith('aiChatPrinterOturum:')) return false; // eklenti dışı kayıtları koru
            if (tumunuSil) return true; // kurulum/güncellemede eski bağlam paketleri geçersizdir
            const paket = tumKayitlar[anahtar]; // oturum paketi
            const olusturmaZamani = Number(paket?.olusturmaZamani || 0); // güvenli zaman değeri
            return !olusturmaZamani || simdi - olusturmaZamani > YAZDIRMA_OTURUM_AZAMI_YASI; // bozuk veya altı saatten eski paketi sil
        });
        if (silinecekAnahtarlar.length > 0) await chrome.storage.local.remove(silinecekAnahtarlar); // yalnız seçilen kalıntıları sil
    } catch (hata) {} // bakım temizliği ana akışı engellemez
}

// Content script'ten gelen mesajları dinle
chrome.runtime.onMessage.addListener((mesaj, gonderen, yanitGonder) => { // mesaj dinleyici
    if (mesaj.islem === 'arkaPlanSaglik') { // bağlantı ön kontrolü
        yanitGonder({ basari: true, surum: chrome.runtime.getManifest().version }); // service worker ayakta
        return false; // senkron yanıt
    }
    if (mesaj.islem === 'yazdirmaSayfasiAc') { // yazdırma sayfası aç isteği
        yazdirmaSayfasiniAc(mesaj.oturumKimligi) // idempotent önizleme açma akışı
            .then((yanit) => yanitGonder(yanit)) // sonucu içerik tarafına aktar
            .catch((hata) => yanitGonder({ basari: false, hata: hata.message || 'Yazdırma sayfası açılamadı.' })); // beklenmeyen hatayı anlamlı yanıta çevir
        return true; // asenkron tabs.create yanıt kanalı açık kalmalı
    }
    return false; // bilinmeyen mesaj — yanıt yok
});

// Keyboard shortcut dinleyicisi — Ctrl+Shift+P / Cmd+Shift+P
chrome.commands.onCommand.addListener(async (komut) => { // komut tetiklendi
    if (komut !== 'yazdir-kisayol') return; // bizim komutumuz değilse atla

    try { // aktif sekmeyi al
        const [aktifSekme] = await chrome.tabs.query({ active: true, currentWindow: true }); // aktif sekme
        if (!aktifSekme || !aktifSekme.url) return; // sekme yoksa çık

        // Desteklenen site kontrolü
        const desteklenenSite = !!desteklenenSiteBilgisi(aktifSekme.url); // substring yerine tam hostname doğrulaması
        if (!desteklenenSite) { // desteklenmeyen site
            // Badge ile bildir — ekranda uyarı gösterilemez
            chrome.action.setBadgeText({ text: '!', tabId: aktifSekme.id }); // uyarı badge
            chrome.action.setBadgeBackgroundColor({ color: '#d93025', tabId: aktifSekme.id }); // kırmızı
            setTimeout(() => chrome.action.setBadgeText({ text: '', tabId: aktifSekme.id }).catch(() => {}), 3000); // sekme kapanmış olsa da sessizce temizle
            return;
        }

        // Content script'e yazdırma tetikle
        try { // mesaj gönderme denemesi
            await icerikBetigineMesajGonder(aktifSekme.id, { islem: 'klavyeKisayoluYazdir' }, true); // gerekirse sayfayı yenileyip otomatik tetikle
        } catch (iletisimHata) { // otomatik kurtarma da tamamlanamadıysa
            console.warn('AI Chat Printer [Shortcut]: İçerik bağlantısı yeniden kurulamadı:', iletisimHata.message); // tanı izi
            chrome.action.setBadgeText({ text: '!', tabId: aktifSekme.id }); // genel hata rozeti
            chrome.action.setBadgeBackgroundColor({ color: '#d93025', tabId: aktifSekme.id }); // kırmızı uyarı
            setTimeout(() => chrome.action.setBadgeText({ text: '', tabId: aktifSekme.id }).catch(() => {}), 4000); // sekme kapanmış olsa da sessizce temizle
        }
    } catch (hata) { // genel hata
        console.error('AI Chat Printer [Shortcut]: Komut işleme hatası:', hata.message); // hata
    }
});

// Extension kurulduğunda veya güncellendiğinde sekmelere bildir (opsiyonel bilgi amaçlı)
chrome.runtime.onInstalled.addListener((detaylar) => { // kurulum olayı
    if (detaylar.reason === 'install') { // ilk kurulum
        console.log('AI Chat Printer: İlk kurulum tamamlandı.'); // hoşgeldin mesajı
    } else if (detaylar.reason === 'update') { // güncelleme
        console.log('AI Chat Printer: v' + chrome.runtime.getManifest().version + ' sürümüne güncellendi.'); // sürüm bilgisi
    }
    kalintiYazdirmaOturumlariniTemizle(true); // yeni extension bağlamında eski taşıma verilerini temizle
    if (detaylar.reason === 'install' || detaylar.reason === 'update') { // eski içerik bağlamları yalnız kurulum/güncellemede tazelenir
        desteklenenSekmeleriYenile().catch((hata) => console.warn('AI Chat Printer: Desteklenen sekmeler yenilenemedi:', hata.message)); // dört hedef sitede yeni content script'i otomatik etkinleştir
    }
});

// Önizleme sekmesi kapatıldığında büyük konuşmanın kalıcı F5 paketini temizler
chrome.tabs.onRemoved.addListener(async (sekmeId) => {
    try { // sekme eşlemesi yalnız session alanında tutulur
        const eslemeler = await chrome.storage.session.get(null); // tüm küçük önizleme eşlemelerini oku
        const anahtarlar = Object.keys(eslemeler).filter((anahtar) => anahtar.startsWith(ONIZLEME_SEKME_ANAHTAR_ON_EKI) && eslemeler[anahtar]?.sekmeId === sekmeId); // kapanan sekmenin oturumları
        for (const anahtar of anahtarlar) { // ilgili paket ve eşlemeyi kaldır
            const oturumKimligi = anahtar.slice(ONIZLEME_SEKME_ANAHTAR_ON_EKI.length); // eşlemeden kimliği çıkar
            await chrome.storage.local.remove('aiChatPrinterOturum:' + oturumKimligi); // yalnız bu önizlemenin paketini sil
            await chrome.storage.session.remove(anahtar); // sekme eşlemesini de temizle
        }
    } catch (hata) { // kapanış hatası kullanıcı akışını etkilemez
        console.warn('AI Chat Printer: Kapanan önizleme temizlenemedi:', hata.message); // bakım tanısı
    }
});

// Aynı oturum için var olan önizlemeyi etkinleştirir veya tek yeni sekme açar
async function yazdirmaSayfasiniAc(oturumKimligi) {
    if (!yazdirmaOturumKimligiGecerliMiArkaPlan(oturumKimligi)) { // oturumsuz veya bozuk istek geçersizdir
        return { basari: false, hata: 'Yazdırma oturumu oluşturulamadı.' }; // anlamlı hata
    }
    await kalintiYazdirmaOturumlariniTemizle(false); // yalnız süresi dolmuş paketleri temizle
    const onizlemeAdresi = chrome.runtime.getURL('yazdir.html?oturum=' + encodeURIComponent(oturumKimligi)); // doğru veriyi seçen önizleme adresi
    const sekmeAnahtari = ONIZLEME_SEKME_ANAHTAR_ON_EKI + oturumKimligi; // idempotent açılış kaydı
    const mevcutKayit = await chrome.storage.session.get(sekmeAnahtari); // önceki açma isteğinin sekmesi
    const mevcutEsleme = mevcutKayit[sekmeAnahtari] || {}; // sekme kimliği + kısa ömürlü zaman damgası
    const mevcutSekmeId = Number(mevcutEsleme.sekmeId || 0); // güvenli sekme kimliği
    const eslemeTaze = Number(mevcutEsleme.olusturmaZamani || 0) > Date.now() - ONIZLEME_SEKME_ESLEME_AZAMI_YASI; // yalnız yakın yeniden deneme
    if (mevcutSekmeId > 0 && eslemeTaze) { // aynı oturum kısa süre önce açıldıysa
        try { // sekme hâlâ mevcut olabilir
            await chrome.tabs.get(mevcutSekmeId); // sekmenin yaşadığını doğrula
            await chrome.tabs.update(mevcutSekmeId, { active: true }); // yanıt kaybı sonrası ikinci sekme açma
            return { basari: true, sekmeId: mevcutSekmeId, yenidenKullanildi: true }; // mevcut önizlemeyi kullan
        } catch (sekmeHata) { // sekme kapatılmışsa kayıt geçersizdir
            await chrome.storage.session.remove(sekmeAnahtari); // ölü eşlemeyi temizle
        }
    }
    const yeniSekme = await chrome.tabs.create({ url: onizlemeAdresi }); // yeni sekmede aç
    if (!yeniSekme || typeof yeniSekme.id !== 'number') throw new Error('Önizleme sekmesi oluşturulamadı.'); // beklenmeyen API sonucu
    await chrome.storage.session.set({ [sekmeAnahtari]: { sekmeId: yeniSekme.id, olusturmaZamani: Date.now() } }); // yeniden denemeyi idempotent ve kısa ömürlü yap
    return { basari: true, sekmeId: yeniSekme.id, yenidenKullanildi: false }; // başarı sonucu
}

// İçerik betiğine mesaj yollar; eski bağlamda sayfayı yenileyip yeni betik hazır olunca aynı işlemi sürdürür
async function icerikBetigineMesajGonder(sekmeId, mesaj, yenilemeSerbest) {
    try { // mevcut içerik betiğini önce doğrudan dene
        return await chrome.tabs.sendMessage(sekmeId, mesaj); // hızlı yol
    } catch (ilkHata) { // eski veya eksik içerik bağlamı
        if (!yenilemeSerbest) throw ilkHata; // otomatik yenileme istenmiyorsa hatayı koru
        await chrome.tabs.reload(sekmeId); // F5 istemeden sayfayı kendimiz tazele
        let sonHata = ilkHata; // son iletişim hatası
        for (let deneme = 0; deneme < ICERIK_BETIGI_HAZIRLIK_DENEMESI; deneme++) { // content script hazır olana kadar
            await arkaPlanBekle(300); // DOM idle enjeksiyonu için kısa aralık
            try { // sağlık mesajı
                const saglik = await chrome.tabs.sendMessage(sekmeId, { islem: 'baglantiSaglik' }); // yeni içerik bağlamını doğrula
                if (saglik && saglik.basari) return await chrome.tabs.sendMessage(sekmeId, mesaj); // asıl komutu aynı sekmede sürdür
            } catch (hazirlikHatasi) { // sayfa hâlâ yükleniyor olabilir
                sonHata = hazirlikHatasi; // son hatayı sakla
            }
        }
        throw sonHata; // azami sürede içerik betiği kurulamadı
    }
}

// Kurulum veya güncellemede dört hedef sitedeki açık sekmeleri yeni içerik betiğiyle otomatik tazeler
async function desteklenenSekmeleriYenile() {
    const adresKaliplari = Object.keys(DESTEKLENEN_SITELER).map((hostname) => 'https://' + hostname + '/*'); // yalnız dört izinli host
    const sekmeler = await chrome.tabs.query({ url: adresKaliplari }); // host izinleriyle hedef sekmeleri bul
    const yenilenecekler = sekmeler.filter((sekme) => typeof sekme.id === 'number' && !sekme.discarded && sekme.frozen !== true); // kapalı kaynak tüketmeyen sekmeleri uyandırma
    const sonuclar = await Promise.allSettled(yenilenecekler.map((sekme) => chrome.tabs.reload(sekme.id))); // tüm hedefleri bağımsız yenile
    return { bulunan: sekmeler.length, yenilenen: sonuclar.filter((sonuc) => sonuc.status === 'fulfilled').length }; // test ve tanı sonucu
}

// Background içinde ortak modüle bağımlı olmadan aynı oturum biçimini doğrular
function yazdirmaOturumKimligiGecerliMiArkaPlan(oturumKimligi) {
    return typeof oturumKimligi === 'string' && /^[a-z0-9-]{8,80}$/i.test(oturumKimligi); // UUID ve fallback biçimi
}

kalintiYazdirmaOturumlariniTemizle(false); // service worker her uyandığında süresi dolmuş paketleri toplar
