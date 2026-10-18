# -*- coding: utf-8 -*-
# v196: kart ekstresi okuyucu denetimi için SAHTE ekstre PDF'leri (üç banka tarzı; biri şifreli: 12345678901). Gerçek veri YOK.
# Kullanım: python3 _dev/audit/make-fin-pdfs.py <çıktı-klasörü>  → ardından FIN_PDF_DIR=<klasör> node _dev/audit/finance-pdf-import-chromium.js
import sys, os, glob
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
out = sys.argv[1] if len(sys.argv) > 1 else '.'
os.makedirs(out, exist_ok=True)
font = None
for c in glob.glob('/usr/share/fonts/**/DejaVuSans.ttf', recursive=True) + glob.glob('/usr/share/fonts/**/*.ttf', recursive=True):
    try:
        pdfmetrics.registerFont(TTFont('TR', c)); font = 'TR'; break
    except Exception:
        pass
def make(name, lines, password=None):
    kw = {}
    if password:
        from reportlab.lib import pdfencrypt
        kw['encrypt'] = pdfencrypt.StandardEncryption(password, canPrint=1)
    c = canvas.Canvas(os.path.join(out, name), pagesize=A4, **kw)
    y = 800
    for ln in lines:
        c.setFont(font or 'Helvetica', 10)
        if isinstance(ln, tuple):
            for x, txt in ln: c.drawString(x, y, txt)
        else:
            c.drawString(40, y, ln)
        y -= 16
        if y < 60: c.showPage(); y = 800
    c.save()
G = ["GARANTİ BBVA BONUS KART HESAP ÖZETİ", "Hesap Kesim Tarihi: 15/10/2026   Son Ödeme Tarihi: 25/10/2026", "Dönem Borcu: 3.245,40 TL   Asgari Ödeme Tutarı: 1.298,16 TL", "İşlem Tarihi   Açıklama   Tutar",
     ((40,"02/10/2026"),(130,"MİGROS KADIKÖY İSTANBUL"),(420,"1.240,50 TL")), ((40,"05/10/2026"),(130,"DECATHLON ATAŞEHİR"),(420,"899,90 TL")), ((40,"07/10/2026"),(130,"İSKİ SU FATURASI OTOMATİK ÖDEME"),(420,"305,00 TL")),
     ((40,"09/10/2026"),(130,"STARBUCKS MODA"),(420,"120,00 TL")), ((40,"10/10/2026"),(130,"TRENDYOL İADE"),(420,"-120,00 TL")), ((40,"12/10/2026"),(130,"ÖDEME - TEŞEKKÜR EDERİZ"),(420,"-2.500,00 TL")), "Toplam: 3.245,40"]
make('garanti.pdf', G)
V = ["VAKIFBANK WORLD KART EKSTRESİ", "Son Ödeme Tarihi 20.10.2026", "Toplam Borç 2.000,00", ((40,"03.10.26"),(110,"AMAZON TR TAKSİT 2/6"),(400,"500,00")), ((40,"06.10.26"),(110,"KOÇTAŞ"),(400,"1.500,00"))]
make('vakif.pdf', V, password='12345678901')
T = ["TÜRKİYE FİNANS HAPPY KART", "Ekstre Borcu: 700,00  Son Ödeme Günü: 28/10/2026", ((40,"01/10"),(100,"BİM MAĞAZA"),(400,"200,00")), ((40,"03/10"),(100,"CANVA PTY LTD"),(400,"500,00")), ((40,"04/10"),(100,"BİM MAĞAZA"),(400,"(200,00)"))]
make('tf.pdf', T)
# v200: GERÇEK BİÇİMLERİ taklit eden anonim ekstreler (Kerem'in ekstrelerinden tek satır alınmadı; yapı aynı, isim/tutar uydurma)
GR = ["BONUS BUSINESS TROY Card Bilgileriniz   Son Ödeme Tarihi: 15 Ekim 2026", "Müşteri Numarası 12345678   Sayın AYŞE YILMAZ", "Kart Limiti 60.000,00 TL", "Hesap Kesim Tarihi 10/10/2026",
      "Ödeme Bilgileri", "Son Ödeme Tarihi 15/10/2026", "Toplam Borcunuz 5.733,59 TL", "Minimum Ödeme Tutarı 2.293,00 TL",
      ((40,"İşlem Tarihi"),(130,"Dönem İçi İşlemler"),(300,"Kalan Borç / Taksit"),(430,"Bonus (TL)"),(500,"Tutar (TL)")),
      ((130,"ÖNCEKİ DÖNEMDEN DEVİR EDİLEN TUTAR"),(500,"2.413,89")), ((130,"GEÇ ÖDEME FAİZİ"),(500,"53,77")),
      ((40,"15 Eylül 2026"),(130,"ÖDEMENİZ İÇİN TEŞEKKÜR EDERİZ"),(500,"2.413,89+")), ((40,"30 Eylül 2026"),(130,"FAIZ IADESI"),(500,"1,08+")),
      "BONUS PROGRAM ORTAKLARI'NDA YAPTIĞINIZ HARCAMALAR",
      ((40,"03 Ekim 2026"),(130,"GÖZLÜKÇÜ AVM"),(300,"1.260,00x6=7.560,00 5.Taksit"),(500,"1.260,00")), ((40,"22 Eylül 2026"),(130,"TRKCLL12345678901661"),(500,"377,00")),
      ((40,"08 Eylül 2026"),(130,"TRENDYOL.COM"),(300,"992,00x3=2.976,00 1.Taksit"),(430,"0,60"),(500,"992,00")),
      "MAIL / TELEFON ORDER", ((40,"11 Eylül 2026"),(130,"SUPERONLİNE İLETİŞİM HİZM"),(500,"950,00")),
      "DİĞER", ((40,"07 Eylül 2026"),(130,"MOKA U /YANDEX GO"),(500,"896,00")), ((40,"14 Eylül 2026"),(130,"BSKNTDOG1234567890126"),(500,"117,00")), ((40,"14 Eylül 2026"),(130,"OTOM. FATURA İŞLEM FAİZİ"),(500,"5,57")),
      ((40,"Toplam"),(430,"0,60"),(500,"5.725,90")),
      "Nakit Avans Ücreti   Yurtiçi Diğer Banka ATM'leri   %3,87 + 0,57 TL   Kartınızla yaptığınız her bir nakit", "T. Garanti Bankası A.Ş. Genel Müdürlük"]
make('garanti-real.pdf', GR)
VR = ["Kredi Kartı Hesap Özeti (TL)", "HESAP BİLGİLERİNİZ", "Dönem Borcunuz : 4,875.40 TL", "Asgari Ödeme Tutarı : 1,951.00 TL", "Son Ödeme Tarihi : 05.10.2026", "VB Müşteri No : 12345   Sayın AYŞE YILMAZ", "Limitiniz : 120,000.00 TL",
      "Hesap Kesim Tarihi : 30.09.2026", "Bir Sonraki Hesap Kesim Tarihi : 28.10.2026",
      ((40,"İŞLEM TARİHİ"),(130,"AÇIKLAMA"),(380,"TUTAR (TL)"),(450,"KALAN TAKSİT"),(530,"WORLDPUAN")),
      ((40,"28.08.2026"),(130,"ÖNCEKİ DÖNEM HESAP ÖZETİ BAKİYENİZ"),(380,"10,876.40")), ((40,"02.09.2026"),(130,"ÖDEMENİZ İÇİN TEŞEKKÜRLER"),(380,"+10,876.40")),
      "6509***6704 AYŞE YILMAZ",
      ((40,"30.07.2026"),(130,"SPOR OUTLET 2. Taksit"),(380,"1,924.50"),(450,"1x1,924.50")), ((40,"28.08.2026"),(130,"BEBEK MAĞAZASI"),(380,"599.94"),(530,"300")),
      ((40,"25.08.2026"),(130,"Vergi Th/12345678901/0015"),(380,"1,852.68")), ((40,"05.09.2026"),(130,"UBER EATS YEMEK"),(380,"365.00"),(530,"8")),
      ((40,"16.09.2026"),(130,"İADE/ UBER EATS YEMEK"),(380,"+69.70")), ((40,"18.09.2026"),(130,"KUŞ OTEL/HATAY"),(380,"202.98")),
      ((40,"6509***6704 Toplam Harcama Tutarı"),(380,"4,875.40")), "HESAP ÖZETİ", "Dönem Borcunuz 4,875.40"]
make('vakif-real.pdf', VR)
print('ok', out)
