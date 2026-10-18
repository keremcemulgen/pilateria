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
print('ok', out)
