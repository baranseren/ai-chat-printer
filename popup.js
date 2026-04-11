// Popup script - AI konuşmasını çıkarıp yazdırma sayfasını açar

// Sayfa yüklendiğinde çalış
document.addEventListener('DOMContentLoaded', () => { // DOM hazır olduğunda
    const yazdirButonu = document.getElementById('yazdirButonu'); // yazdır butonu
    const durumAlani = document.getElementById('durumAlani'); // durum mesaj alanı

    // Yazdır butonuna tıklama olayı
    yazdirButonu.addEventListener('click', async () => { // tıklama dinleyici
        yazdirButonu.disabled = true; // butonu devre dışı bırak
        yazdirButonu.textContent = 'Çıkarılıyor...'; // buton metnini güncelle
        durumGoster('bilgi', 'Konuşma içeriği çıkarılıyor...'); // bilgi mesajı göster

        try {
            // Aktif sekmeyi al
            const [aktifSekme] = await chrome.tabs.query({ active: true, currentWindow: true }); // aktif sekme bilgisi

            // Desteklenen site kontrolü
            const desteklenenSite = aktifSekme.url?.includes('gemini.google.com') || aktifSekme.url?.includes('claude.ai') || aktifSekme.url?.includes('chatgpt.com'); // URL kontrolü
            if (!desteklenenSite) { // desteklenmeyen site
                durumGoster('hata', 'Bu eklenti gemini.google.com, claude.ai ve chatgpt.com sayfalarında çalışır.'); // hata mesajı
                butonuSifirla(); // butonu eski haline getir
                return;
            }

            // Content script'e mesaj gönder
            const yanit = await chrome.tabs.sendMessage(aktifSekme.id, { islem: 'konusmayiCikar' }); // konuşma çıkar isteği

            if (yanit.hata) { // hata varsa
                durumGoster('hata', yanit.hata); // hata mesajını göster
                butonuSifirla(); // butonu sıfırla
                return;
            }

            if (!yanit.mesajlar || yanit.mesajlar.length === 0) { // mesaj yoksa
                durumGoster('hata', 'Konuşmada mesaj bulunamadı. Bir sohbet açık olduğundan emin olun.'); // uyarı
                butonuSifirla(); // butonu sıfırla
                return;
            }

            // Ayarları oku
            const ayarlar = { // kullanıcı tercihleri
                kodBloklari: document.getElementById('kodBloklari').checked, // kod blokları dahil mi
                otomatikYazdir: document.getElementById('otomatikYazdir').checked, // otomatik yazdır mı
                yaziBoyutu: document.getElementById('yaziBoyutu').value // yazı boyutu
            };

            // Veriyi chrome.storage.local'a kaydet
            await chrome.storage.local.set({ // geçici veri kaydet
                konusmaVerisi: yanit, // konuşma içeriği
                yazdirAyarlari: ayarlar // yazdırma ayarları
            });

            durumGoster('basarili', yanit.mesajSayisi + ' mesaj çıkarıldı. Yazdırma sayfası açılıyor...'); // başarı mesajı

            // Yazdırma sayfasını aç
            chrome.tabs.create({ url: chrome.runtime.getURL('yazdir.html') }); // yeni sekmede aç

        } catch (hata) { // hata yakalandıysa
            console.error('AI Chat Printer hata:', hata); // konsola yaz
            durumGoster('hata', 'Bir hata oluştu: ' + hata.message); // kullanıcıya göster
            butonuSifirla(); // butonu sıfırla
        }
    });
});

// Durum mesajını gösterir
function durumGoster(tip, mesaj) { // tip: basarili, hata, bilgi
    const durumAlani = document.getElementById('durumAlani'); // durum alanı
    durumAlani.className = 'durum gorunur ' + tip; // CSS sınıflarını ayarla
    durumAlani.textContent = mesaj; // mesaj metnini yaz
}

// Butonu varsayılan haline döndürür
function butonuSifirla() {
    const yazdirButonu = document.getElementById('yazdirButonu'); // buton referansı
    yazdirButonu.disabled = false; // butonu aktif et
    yazdirButonu.textContent = 'Konuşmayı Yazdır'; // orijinal metni geri yükle
}
