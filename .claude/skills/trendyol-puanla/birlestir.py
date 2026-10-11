"""Tarayıcıdan alınan sayımları eşleştirme bilgisiyle birleştirir -> kayitlar.json

Kullanım:
  py -3.13 birlestir.py --sayimlar sayimlar.json --eslestirme eslestirme.json --cikti kayitlar.json [--esik 5]

Puanlar sayımlardan yeniden hesaplanır (tarayıcıdaki eşik farklı olsa bile tüm markalarda aynı kural geçerli olsun diye):
  puan = 1 + 9 × (olumlu + 0,5 × orta) / ilgili yorum, en yakın tam sayı; ilgili yorum --esik'ten azsa puan yok.

sayimlar.json  : window.__export(...) çıktısı (JSON metinleri ya da nesneler listesi); her birinde "id" var.
eslestirme.json: her muadil için bir nesne listesi:
  {"id": "Mad W191", "marka": "Mad", "kod": "W191", "om": "Dior", "op": "Sauvage",
   "fiyat": 599.99, "link": "https://...", "durum": "mevcut|yeni", "ilan": "p-354098882 · Mad Parfüm",
   "not": "isteğe bağlı açıklama", "cinsiyet": "Kadın|Erkek (isteğe bağlı; yoksa Unisex sayılır)"}
  "om"/"op" veritabanındaki orijinal marka ve parfüm adıyla birebir aynı olmalı.
  "cinsiyet" yalnız markanın aynı kodu kadın/erkekte ayrı ayrı kullandığı satırlarda gerekir (ör. Mad A114).
  Sayımı olmayan (Trendyol'da ilanı bulunamayan) satırlar da eklenir; Excel'de "Eksik kanıt" sayfasına düşer.
"""
import argparse
import json
import re
from pathlib import Path

ap = argparse.ArgumentParser()
ap.add_argument("--sayimlar", required=True)
ap.add_argument("--eslestirme", required=True)
ap.add_argument("--cikti", required=True)
ap.add_argument("--esik", type=int, default=5, help="puan için gereken en az ilgili yorum sayısı")
a = ap.parse_args()


def puan(d):
    tot = d["pos"] + d["orta"] + d["neg"]
    return None if tot < a.esik else int(1 + 9 * (d["pos"] + 0.5 * d["orta"]) / tot + 0.5)

sayimlar = {}
for x in json.loads(Path(a.sayimlar).read_text(encoding="utf-8")):
    x = json.loads(x) if isinstance(x, str) else x
    sayimlar[x["id"]] = x

yarim_vekil = re.compile(r"[\ud800-\udfff]")  # kesilmiş emoji parçaları Excel'e yazılamaz

kayitlar = []
for m in json.loads(Path(a.eslestirme).read_text(encoding="utf-8")):
    s = sayimlar.get(m["id"])
    r = dict(s) if s else {"score": {"k": None, "b": None}}
    if not s:
        r["ilan"] = "Trendyol'da ilan yok"
    notlar = [(r.get("not") or "").strip(), (m.get("not") or "").strip()]
    r.update({k: v for k, v in m.items() if k != "not"})
    r["not"] = " ".join(x for x in notlar if x)
    if s:
        r["score"] = {"k": puan(r["k"]), "b": puan(r["b"])}
    for k in ("k", "b"):
        for t in ("pos", "neg"):
            v = r.get(k, {}).get("ex", {}).get(t)
            if v:
                r[k]["ex"][t] = yarim_vekil.sub("", v)
    kayitlar.append(r)

eksik = [i for i in sayimlar if i not in {m["id"] for m in kayitlar}]
Path(a.cikti).write_text(json.dumps(kayitlar, ensure_ascii=False, indent=0), encoding="utf-8")
print(f"{len(kayitlar)} kayıt -> {a.cikti}")
if eksik:
    print("UYARI: eşleştirmede olmayan sayımlar atlandı:", ", ".join(eksik))
