// Background service worker - content script'ten gelen mesajları ve klavye kısayolunu işler

importScripts('site-yardimcilari.js'); // popup ve background aynı tam-hostname sözleşmesini kullanır

const YAZDIRMA_OTURUM_AZAMI_YASI = 6 * 60 * 60 * 1000; // sahipsiz paketler en fazla altı saat tutulur

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
    if (mesaj.islem === 'yazdirmaSayfasiAc') { // yazdırma sayfası aç isteği
        if (!yazdirmaOturumKimligiGecerliMiArkaPlan(mesaj.oturumKimligi)) { // oturumsuz veya bozuk istek geçersizdir
            yanitGonder({ basari: false, hata: 'Yazdırma oturumu oluşturulamadı.' }); // içerik tarafına anlamlı hata dön
            return false; // senkron yanıt
        }
        kalintiYazdirmaOturumlariniTemizle(false); // yeni önizleme açılırken yalnız süresi dolmuş paketleri temizle
        const onizlemeAdresi = chrome.runtime.getURL('yazdir.html?oturum=' + encodeURIComponent(mesaj.oturumKimligi)); // doğru veriyi seçen önizleme adresi
        chrome.tabs.create({ url: onizlemeAdresi }) // yeni sekmede aç
            .then(() => yanitGonder({ basari: true })) // sekme açılınca başarı dön
            .catch((hata) => yanitGonder({ basari: false, hata: hata.message })); // hata mesajını içerik tarafına aktar
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
            await chrome.tabs.sendMessage(aktifSekme.id, { islem: 'klavyeKisayoluYazdir' }); // tetikle
        } catch (iletisimHata) { // content script hazır değilse — kullanıcıya badge ile bildir
            console.warn('AI Chat Printer [Shortcut]: Content script erişilemedi:', iletisimHata.message); // log
            chrome.action.setBadgeText({ text: 'F5', tabId: aktifSekme.id }); // sayfa yenileme önerisi
            chrome.action.setBadgeBackgroundColor({ color: '#f59e0b', tabId: aktifSekme.id }); // amber uyarı
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
});

// Background içinde ortak modüle bağımlı olmadan aynı oturum biçimini doğrular
function yazdirmaOturumKimligiGecerliMiArkaPlan(oturumKimligi) {
    return typeof oturumKimligi === 'string' && /^[a-z0-9-]{8,80}$/i.test(oturumKimligi); // UUID ve fallback biçimi
}

kalintiYazdirmaOturumlariniTemizle(false); // service worker her uyandığında süresi dolmuş paketleri toplar
