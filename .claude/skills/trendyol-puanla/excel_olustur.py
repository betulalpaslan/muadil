"""kayitlar.json -> toplu yükleme şablonu biçiminde puan önerisi Excel'i

Kullanım:
  py -3.13 excel_olustur.py --girdi kayitlar.json --cikti D:/muadil/<marka>-puan-onerisi.xlsx --yontem yontem.txt

Sayfalar: Muadiller (iki puanı da olan, içe aktarılabilir satırlar), Eksik kanıt (en az bir puanı
"yetersiz" olanlar; içe aktarılamaz), Yöntem (--yontem dosyasının satırları; ilk satır başlık).
İlk 9 sütun içe aktarıcının okuduğu sütunlardır (9. sütun Cinsiyet; girdide yoksa "Unisex" yazılır);
gri başlıklı kanıt sütunları içe aktarmada yok sayılır.
"""
import argparse
import json
from copy import copy
from pathlib import Path

import openpyxl
from openpyxl.styles import Alignment, Font, PatternFill

REPO = Path(__file__).resolve().parents[3]
SABLON = REPO / "frontend/public/sablon/muadil-veri-sablonu.xlsx"
AZ_KANIT = 8  # bundan az ilgili yoruma dayanan puanın dayanağına "az kanıt" yazılır

ap = argparse.ArgumentParser()
ap.add_argument("--girdi", required=True)
ap.add_argument("--cikti", required=True)
ap.add_argument("--yontem", required=True)
a = ap.parse_args()

kayitlar = json.loads(Path(a.girdi).read_text(encoding="utf-8"))
wb = openpyxl.load_workbook(SABLON)
ws = wb["Muadiller"]

KANIT_BASLIK = [
    ("Trendyol ★", 11), ("Değerlendirme", 13), ("Yazılı yorum", 12), ("Okunan yorum", 22),
    ("Kalıcılık olumlu", 10), ("Kalıcılık orta", 10), ("Kalıcılık olumsuz", 10), ("Kalıcılık dayanağı", 60),
    ("Benzerlik olumlu", 10), ("Benzerlik orta", 10), ("Benzerlik olumsuz", 10), ("Benzerlik dayanağı", 60),
    ("Trendyol konu analizi: Kalıcılık (+/−)", 16), ("İlan / satıcı", 30), ("Durum", 14), ("Not", 50),
]
gri = PatternFill("solid", fgColor="5B5B5B")
beyaz_kalin = Font(bold=True, color="FFFFFF")
sar = Alignment(wrap_text=True, vertical="top")


def basliklari_yaz(sayfa):
    for i, (ad, gen) in enumerate(KANIT_BASLIK, start=10):
        c = sayfa.cell(row=1, column=i, value=ad)
        c.font, c.fill, c.alignment = beyaz_kalin, gri, Alignment(wrap_text=True, vertical="center")
        sayfa.column_dimensions[openpyxl.utils.get_column_letter(i)].width = gen
    sayfa.row_dimensions[1].height = 45


def dayanak(tur, d, puan):
    p, o, n = d["pos"], d["orta"], d["neg"]
    tot = p + o + n
    if puan is None:
        return f"Yetersiz: yalnız {tot} ilgili yorum ({p} olumlu, {o} orta, {n} olumsuz)"
    oran = round(100 * (p + 0.5 * o) / tot)
    ex = d.get("ex", {})
    ornek = ""
    if ex.get("pos") or ex.get("neg"):
        ornek = " — " + " / ".join(f"“{ex[k]}”" for k in ("pos", "neg") if ex.get(k))
    az = "Az kanıt — " if tot < AZ_KANIT else ""
    return f"{az}{tot} {tur} yorumu: {p} olumlu, {o} orta, {n} olumsuz (olumluluk %{oran}){ornek}"


def satir(r):
    puan = r.get("score") or {}
    temel = [r["om"], r["op"], r["marka"], r["kod"], r["fiyat"], puan.get("k"), puan.get("b"), r.get("link"),
             r.get("cinsiyet") or "Unisex"]
    if r.get("cid"):
        okunan = r["okunan"] if r["okunan"] >= r["yorum"] else f"{r['okunan']} (en yeni; {r['ilk']} sonrası)"
        ty = r.get("ty") or {}
        kanit = [
            r["yildiz"], r["degerlendirme"], r["yorum"], okunan,
            r["k"]["pos"], r["k"]["orta"], r["k"]["neg"], dayanak("kalıcılık", r["k"], temel[5]),
            r["b"]["pos"], r["b"]["orta"], r["b"]["neg"], dayanak("benzerlik", r["b"], temel[6]),
            (f"{ty.get('positive', 0)} / {ty.get('negative', 0)}" if "positive" in ty or "negative" in ty
             else (f"{ty['count']} yorum (duygu verisi yok)" if ty.get("count") else "-")),
            r.get("ilan", ""), r.get("durum", ""), r.get("not") or None,
        ]
    else:
        kanit = [None] * 13 + [r.get("ilan", "Trendyol'da ilan yok"), r.get("durum", ""), r.get("not") or None]
    return temel, kanit


def yaz(sayfa, satir_no, temel, kanit, eksik=False):
    for i, v in enumerate(temel, start=1):
        if eksik and i in (6, 7) and v is None:
            v = "yetersiz"
        sayfa.cell(row=satir_no, column=i, value=v)
    sayfa.cell(row=satir_no, column=5).number_format = "#,##0.00"
    for i, v in enumerate(kanit, start=10):
        c = sayfa.cell(row=satir_no, column=i, value=v)
        if i in (17, 21, 25):
            c.alignment = sar


basliklari_yaz(ws)
eksik = wb.create_sheet("Eksik kanıt")
for i in range(1, 10):
    s, h = ws.cell(row=1, column=i), eksik.cell(row=1, column=i, value=ws.cell(row=1, column=i).value)
    h.font, h.fill, h.alignment = copy(s.font), copy(s.fill), copy(s.alignment)
    harf = openpyxl.utils.get_column_letter(i)
    eksik.column_dimensions[harf].width = ws.column_dimensions[harf].width
basliklari_yaz(eksik)
eksik.freeze_panes = "A2"

tam_no, eksik_no = 2, 2
for r in sorted(kayitlar, key=lambda x: (x["marka"], str(x["kod"]))):
    temel, kanit = satir(r)
    if temel[5] is not None and temel[6] is not None and temel[7]:
        yaz(ws, tam_no, temel, kanit)
        tam_no += 1
    else:
        yaz(eksik, eksik_no, temel, kanit, eksik=True)
        eksik_no += 1

yontem = wb.create_sheet("Yöntem")
yontem.column_dimensions["A"].width = 130
for i, t in enumerate(Path(a.yontem).read_text(encoding="utf-8").splitlines(), start=1):
    c = yontem.cell(row=i, column=1, value=t)
    c.alignment = Alignment(wrap_text=True, vertical="top")
    if i == 1:
        c.font = Font(bold=True, size=14)

wb.save(a.cikti)
print(f"Muadiller: {tam_no - 2} satır, Eksik kanıt: {eksik_no - 2} satır -> {a.cikti}")
