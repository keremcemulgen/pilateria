# -*- coding: utf-8 -*-
# PILATERIA — v120 SURUM YUKSELTME
# pilateria.html YALNIZ bu tur betiklerle duzenlenir (anchor + assert count).
import io

P = 'pilateria.html'
s = io.open(P, encoding='utf-8').read()
before = len(s)
applied = []

def patch(label, old, new, count=1):
    global s
    n = s.count(old)
    assert n == count, 'CAPA HATASI [%s]: beklenen %d, bulunan %d' % (label, count, n)
    s = s.replace(old, new)
    applied.append('%s  (x%d)' % (label, count))

OLD = '2026.07.27.42'
NEW = '2026.07.27.43'

patch('1/meta app-version',
      '<meta name="app-version" content="%s">' % OLD,
      '<meta name="app-version" content="%s">' % NEW)

patch('2/const APP_VERSION',
      "const APP_VERSION = '%s';" % OLD,
      "const APP_VERSION = '%s';" % NEW)

assert s.count(OLD) == 0, 'ESKI SURUM ETIKETI KALDI: %d yerde' % s.count(OLD)
assert s.count(NEW) == 2, 'YENI SURUM ETIKETI 2 yerde olmali, %d bulundu' % s.count(NEW)

io.open(P, 'w', encoding='utf-8').write(s)
print('v120 SURUM YUKSELTMESI UYGULANDI')
for a in applied:
    print('  + ' + a)
print('  %s -> %s   boyut: %d -> %d' % (OLD, NEW, before, len(s)))
