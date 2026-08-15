# -*- coding: utf-8 -*-
"""AI Chat Printer için Web Store uyumlu 16, 48 ve 128 piksel PNG ikonlarını üretir."""

from pathlib import Path

from PIL import Image, ImageDraw


ANA_BOYUT = 512
MUREKKEP = (24, 36, 45, 255)
KAGIT = (255, 253, 248, 255)
VURGU = (189, 73, 56, 255)
VURGU_ACIK = (232, 155, 90, 255)


# Dört uçlu küçük vurgu yıldızı çizer; kullanım: yildizCiz(cizim, 390, 116, 30).
def yildizCiz(cizim: ImageDraw.ImageDraw, merkezX: int, merkezY: int, yaricap: int) -> None:
    """Belirtilen merkezde dört uçlu yıldız oluşturur."""

    dar = max(3, yaricap // 4)
    noktalar = [
        (merkezX, merkezY - yaricap),
        (merkezX + dar, merkezY - dar),
        (merkezX + yaricap, merkezY),
        (merkezX + dar, merkezY + dar),
        (merkezX, merkezY + yaricap),
        (merkezX - dar, merkezY + dar),
        (merkezX - yaricap, merkezY),
        (merkezX - dar, merkezY - dar),
    ]
    cizim.polygon(noktalar, fill=VURGU_ACIK)


# Şeffaf dolgulu 512 px ana ikonu çizer; kullanım: goruntu = anaIkonOlustur().
def anaIkonOlustur() -> Image.Image:
    """Baskı Stüdyosu görsel diliyle yüksek çözünürlüklü ana ikonu döndürür."""

    goruntu = Image.new("RGBA", (ANA_BOYUT, ANA_BOYUT), (0, 0, 0, 0))
    cizim = ImageDraw.Draw(goruntu)

    cizim.rounded_rectangle((82, 82, 444, 444), radius=58, fill=VURGU)
    cizim.rounded_rectangle((64, 64, 430, 430), radius=58, fill=MUREKKEP)

    cizim.rounded_rectangle((166, 106, 346, 222), radius=8, fill=KAGIT)
    for satirY, satirSag in ((140, 318), (164, 294), (188, 326)):
        cizim.rounded_rectangle((194, satirY, satirSag, satirY + 9), radius=4, fill=VURGU)

    cizim.rounded_rectangle((116, 198, 380, 322), radius=28, fill=KAGIT)
    cizim.rounded_rectangle((146, 230, 350, 249), radius=7, fill=MUREKKEP)
    cizim.ellipse((334, 268, 354, 288), fill=VURGU)

    cizim.rounded_rectangle((164, 292, 348, 402), radius=7, fill=KAGIT)
    for satirY, satirSag in ((326, 316), (350, 292), (374, 326)):
        cizim.rounded_rectangle((194, satirY, satirSag, satirY + 9), radius=4, fill=VURGU)

    yildizCiz(cizim, 390, 116, 29)
    return goruntu


# Ana ikonu hedef boyuta kaliteli küçültür; kullanım: ikonOlustur(128).
def ikonOlustur(boyut: int) -> Image.Image:
    """Ana ikonu belirtilen kare piksel boyutuna küçültür."""

    return anaIkonOlustur().resize((boyut, boyut), Image.Resampling.LANCZOS)


# Manifestin kullandığı üç PNG dosyasını üretir; kullanım: ikonlariOlustur().
def ikonlariOlustur() -> None:
    """16, 48 ve 128 piksel ikonlarını betik klasörüne yazar."""

    dizin = Path(__file__).resolve().parent
    for boyut in (16, 48, 128):
        dosyaYolu = dizin / f"icon{boyut}.png"
        ikonOlustur(boyut).save(dosyaYolu, "PNG", optimize=True)
        print(f"{dosyaYolu.name} oluşturuldu ({boyut}x{boyut})")


if __name__ == "__main__":
    ikonlariOlustur()
