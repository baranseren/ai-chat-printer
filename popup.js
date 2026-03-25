// Popup script - AI konuşmasını çıkarıp yazdırma sayfasını açar

// Sayfa yüklendiğinde çalış
document.addEventListener('DOMContentLoaded', () => { // DOM hazır olduğunda
    const yazdirButonu = document.getElementById('yazdirButonu'); // yazdır butonu
    const durumAlani = document.getElementById('durumAlani'); // durum mesaj alanı

    // Yazdır butonuna tıklama olayı
    yazdirButonu.addEventListener('click', async () => { // tıklama dinleyici
        yazdirButonu.disabled = true; // butonu devre dışı bırak
        yazdirButonu.textContent = 'Cikariliyor...'; // buton metnini güncelle
        durumGoster('bilgi', 'Konusma icerigi cikariliyor...'); // bilgi mesajı göster

        try {
            // Aktif sekmeyi al
            const [aktifSekme] = await chrome.tabs.query({ active: true, currentWindow: true }); // aktif sekme bilgisi

            // Desteklenen site kontrolü
            const desteklenenSite = aktifSekme.url?.includes('gemini.google.com') || aktifSekme.url?.includes('claude.ai'); // URL kontrolü
            if (!desteklenenSite) { // desteklenmeyen site
                durumGoster('hata', 'Bu eklenti gemini.google.com ve claude.ai sayfalarinda calisir.'); // hata mesajı
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
                durumGoster('hata', 'Konusmada mesaj bulunamadi. Bir sohbet acik oldugundan emin olun.'); // uyarı
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

            durumGoster('basarili', yanit.mesajSayisi + ' mesaj cikarildi. Yazdirma sayfasi aciliyor...'); // başarı mesajı

            // Yazdırma sayfasını aç
            chrome.tabs.create({ url: chrome.runtime.getURL('yazdir.html') }); // yeni sekmede aç

        } catch (hata) { // hata yakalandıysa
            console.error('Gemini Printer hata:', hata); // konsola yaz
            durumGoster('hata', 'Bir hata olustu: ' + hata.message); // kullanıcıya göster
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
    yazdirButonu.textContent = 'Konusmayı Yazdir'; // orijinal metni geri yükle
}
