# DERSLER — hatalardan çıkarılan kurallar
Format: `- [tarih] Hata → Kural` (tek satır). Aynı ders varsa yenisini ekleme, mevcudu güncelle. En fazla ~30 satır; eskiyi/geçersizi sil.

- [2026-10-25] Claude in Chrome sormadan kullanıldı (5 kez) → Tarayıcı aracını asla sormadan çağırma; curl/build ile doğrula.
- [2026-10-25] Tarayıcı `wait`'leri kuyruğa birikince kullanıcı interrupt'ı tab group'u kopardı → Art arda çok `wait` kuyruklama.
- [2026-10-25] Görsel konumu yalnız globals.css sınıfına bağlandı, tarayıcıda uygulanmadı (görsel doğal boyutta köşeye düştü) → Kritik hizalama (VS'ye oturan görsel) satır içi style ile verilsin; teslimden önce hizayı offline bindirme görüntüsüyle kontrol et.
