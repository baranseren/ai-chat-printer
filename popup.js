// Popup script - AI konuşmasını çıkarıp oturum-özel yazdırma sayfasını açar
// Site ve ayar sözleşmeleri popup.html'de önce yüklenen ortak dosyalardan gelir.

let durumGizlemeZamanlayicisi = null; // kısa bilgi mesajlarının tek zamanlayıcısı

// Formdaki tüm kullanıcı ayarlarını doğrulanmış nesne olarak döndürür
function ayarlariFormdanOku() {
    return ayarlariDogrula({ // ortak ayar doğrulayıcısını kullan
        kodBloklari: document.getElementById('kodBloklari').checked, // kod blokları
        otomatikYazdir: document.getElementById('otomatikYazdir').checked, // otomatik yazdır
        yaziBoyutu: document.getElementById('yaziBoyutu').value, // yazı boyutu
        footerGoster: document.getElementById('footerGoster').checked, // belge imzası
        kagitBoyutu: document.getElementById('kagitBoyutu').value, // kâğıt boyutu
        yonlendirme: document.getElementById('yonlendirme').value, // sayfa yönü
        kenarBosluk: document.getElementById('kenarBosluk').value, // kenar boşluğu
        linkAdresleriniGoster: document.getElementById('linkAdresleriniGoster').checked // baskıda link adresleri
    });
}

// Kayıtlı ayarları form kontrollerine yansıtır
function ayarlariFormaYansit(ayarlar) {
    const dogrulanmis = ayarlariDogrula(ayarlar); // eski sürüm kayıtlarını da tamamla
    document.getElementById('kodBloklari').checked = dogrulanmis.kodBloklari; // kod blokları
    document.getElementById('otomatikYazdir').checked = dogrulanmis.otomatikYazdir; // otomatik yazdır
    document.getElementById('yaziBoyutu').value = dogrulanmis.yaziBoyutu; // yazı boyutu
    document.getElementById('footerGoster').checked = dogrulanmis.footerGoster; // belge imzası
    document.getElementById('kagitBoyutu').value = dogrulanmis.kagitBoyutu; // kâğıt boyutu
    document.getElementById('yonlendirme').value = dogrulanmis.yonlendirme; // sayfa yönü
    document.getElementById('kenarBosluk').value = dogrulanmis.kenarBosluk; // kenar boşluğu
    document.getElementById('linkAdresleriniGoster').checked = dogrulanmis.linkAdresleriniGoster; // link adresleri
}

// Etkin sekmenin destek durumunu kullanıcıya açık biçimde gösterir
function siteDurumunuGoster(siteBilgisi) {
    const alan = document.getElementById('siteDurumu'); // durum satırı
    const metin = document.getElementById('siteDurumuMetni'); // durum metni
    alan.className = 'site-durumu ' + (siteBilgisi ? 'destekleniyor' : 'desteklenmiyor'); // renk durumu
    metin.textContent = siteBilgisi ? siteBilgisi.gorunenAd + ' konuşması hazır' : 'Bu sekme desteklenen bir AI konuşması değil'; // anlaşılır sonuç
}

// Durum mesajını erişilebilir canlı bölgede gösterir
function durumGoster(tip, mesaj, otomatikGizle) {
    const durumAlani = document.getElementById('durumAlani'); // durum alanı
    if (durumGizlemeZamanlayicisi) clearTimeout(durumGizlemeZamanlayicisi); // önceki gizleme yarışını iptal et
    durumAlani.className = 'durum gorunur ' + tip; // CSS durum sınıfları
    durumAlani.textContent = mesaj; // güvenli metin
    if (otomatikGizle) { // kısa bilgi mesajıysa
        durumGizlemeZamanlayicisi = setTimeout(() => durumAlani.classList.remove('gorunur'), otomatikGizle); // belirtilen sürede gizle
    }
}

// Ana butonun çalışma ve metin durumunu değiştirir
function yazdirButonuDurumunuAyarla(calisiyor) {
    const buton = document.getElementById('yazdirButonu'); // ana buton
    const metin = document.getElementById('yazdirButonMetni'); // buton metni
    buton.disabled = calisiyor; // paralel tıklamayı engelle
    buton.setAttribute('aria-busy', calisiyor ? 'true' : 'false'); // yardımcı teknolojiye işlem durumu
    metin.textContent = calisiyor ? 'Konuşma hazırlanıyor…' : 'Konuşmayı Önizle'; // görünür durum
}

// Popup açıldığında ayarları ve etkin sekmeyi hazırlar
document.addEventListener('DOMContentLoaded', async () => {
    const yazdirButonu = document.getElementById('yazdirButonu'); // ana işlem butonu
    const ayarKontrolleri = Array.from(document.querySelectorAll('.ayar-bolumu input, .ayar-bolumu select')); // kalıcı ayar kontrolleri
    let aktifSekme = null; // tıklamada yeniden doğrulanacak etkin sekme

    try { // sürüm bilgisini manifest'ten tek kaynaktan oku
        document.getElementById('surumBilgisi').textContent = 'v' + chrome.runtime.getManifest().version; // dinamik sürüm
    } catch (surumHata) {} // erişilemezse ürün adı korunur

    ayarlariFormaYansit(await ayarlariYukle()); // kayıtlı ayarları doğrulayıp forma yaz

    try { // etkin sekmeyi proaktif doğrula
        [aktifSekme] = await chrome.tabs.query({ active: true, currentWindow: true }); // etkin sekme
        const siteBilgisi = desteklenenSiteBilgisi(aktifSekme?.url || ''); // tam hostname kontrolü
        siteDurumunuGoster(siteBilgisi); // görünür durum
        yazdirButonu.disabled = !siteBilgisi; // desteklenmeyen sekmede işlemi kapat
        if (!siteBilgisi) durumGoster('bilgi', 'Gemini, Claude, ChatGPT veya Grok üzerinde açık bir konuşmaya geçildiğinde buton etkinleşir.'); // yol gösterici bilgi
    } catch (sekmeHata) { // sekme bilgisi alınamadıysa
        siteDurumunuGoster(null); // desteklenmiyor durumu
        yazdirButonu.disabled = true; // yanlış işlem başlatma
        durumGoster('hata', 'Etkin sekme bilgisi alınamadı.'); // açık hata
    }

    // Her ayar değişikliğini tek doğrulayıcı üzerinden kalıcı kaydeder
    ayarKontrolleri.forEach((kontrol) => kontrol.addEventListener('change', async () => {
        const basari = await ayarlariKaydet(ayarlariFormdanOku()); // ortak kalıcı kayıt
        durumGoster(basari ? 'bilgi' : 'hata', basari ? 'Ayar kaydedildi.' : 'Ayar kaydedilemedi.', basari ? 1400 : 0); // sonuç bildirimi
    }));

    // Konuşmayı çıkarır, benzersiz pakete yazar ve önizleme sekmesini açar
    yazdirButonu.addEventListener('click', async () => {
        yazdirButonuDurumunuAyarla(true); // çift tıklama kilidi
        durumGoster('bilgi', 'Konuşma içeriği ve görseller hazırlanıyor…'); // işlem durumu
        let oturumKimligi = ''; // hata hâlinde temizlenecek paket

        try { // uçtan uca çıkarma ve açma akışı
            [aktifSekme] = await chrome.tabs.query({ active: true, currentWindow: true }); // tıklama anındaki sekmeyi yeniden al
            const siteBilgisi = desteklenenSiteBilgisi(aktifSekme?.url || ''); // tam hostname doğrulaması
            if (!siteBilgisi) throw new Error('Bu sekme desteklenen bir AI konuşması değil.'); // kapsam dışı sekme

            let yanit; // content script yanıtı
            try { // sayfa bağlamıyla iletişim
                yanit = await chrome.tabs.sendMessage(aktifSekme.id, { islem: 'konusmayiCikar' }); // konuşmayı çıkar
            } catch (iletisimHata) { // eklenti güncellendikten sonra eski sayfa bağlamı
                throw new Error('Sayfadaki eklenti bağlantısı eski. Sekme yenilendiğinde yeni sürüm etkinleşir.'); // teknik jargonsuz açıklama
            }

            if (!yanit) throw new Error('Sayfadan konuşma verisi alınamadı.'); // boş yanıt
            if (yanit.hata) throw new Error(yanit.hata); // çıkarıcı hatası
            if (!Array.isArray(yanit.mesajlar) || yanit.mesajlar.length === 0) throw new Error('Açık konuşmada yazdırılabilir mesaj bulunamadı.'); // boş konuşma

            const quotaDurum = quotaKontrol(yanit); // gerçek storage sınırını denetle
            if (!quotaDurum.gecerli) throw new Error(quotaDurum.mesaj); // sınır aşıldı

            const ayarlar = ayarlariFormdanOku(); // işlem anındaki ayarlar
            await ayarlariKaydet(ayarlar); // popup ve önizleme ayarlarını senkron tut
            oturumKimligi = await yazdirmaOturumuOlustur(yanit, ayarlar); // yalnız bu önizlemeye ait paket

            const acilisYaniti = await chrome.runtime.sendMessage({ islem: 'yazdirmaSayfasiAc', oturumKimligi: oturumKimligi }); // arka plandan yeni sekme aç
            if (!acilisYaniti?.basari) throw new Error(acilisYaniti?.hata || 'Önizleme sekmesi açılamadı.'); // açılış hatası
            durumGoster('basarili', yanit.mesajSayisi + ' mesaj önizlemeye aktarıldı.'); // başarı sonucu
        } catch (hata) { // tüm hata yolları tek kullanıcı mesajında birleşir
            if (oturumKimligi) { // sahipsiz paket oluştuysa
                const anahtar = yazdirmaOturumAnahtari(oturumKimligi); // güvenli anahtar
                if (anahtar) chrome.storage.local.remove(anahtar).catch(() => {}); // paketi temizle
            }
            durumGoster('hata', hata.message || 'Konuşma hazırlanamadı.'); // somut hata
            yazdirButonuDurumunuAyarla(false); // yeniden denemeye izin ver
        }
    });
});
