# Domina

Absürt ama gerçek bilgi yarışması. Cevabın kendisi değil, cevabın yarattığı "yok artık!" anı ürün.

Üç soru formatı üzerine kurulu:

| Format | Soru | Puanlama |
|---|---|---|
| **Evet / Hayır** | "Bir hamamböceği kafası koptuktan sonra günlerce yaşar mı?" | Doğru/yanlış + hız bonusu |
| **Sayısal tahmin** | "Bir fil hortumunda kaç kas var?" | **Logaritmik** — büyüklük sırası doğruysa puan alırsın |
| **Kıyaslama** | "Hangisi daha ağır: bir kümülüs bulutu mu, bir mavi balina mı?" | Doğru tarafı seç, seriyi koru |

Bu, [game-ideas #14 — Fun Facts Arena](https://github.com/Eren-Ozcan/game-ideas/blob/master/ideas/14-fun-facts-arena.tr.md)
fikrinin web uygulaması.

---

## Neden logaritmik puanlama?

Sayısal modun tamamı bu karar üzerine kurulu. Tam sayıyı bilmek ödüllendirilseydi
oyun ezber bilenlere kalırdı. Bunun yerine puan, tahminin **kaç basamak** saptığına
bakar:

```
isabet = max(0, 1 - |log10(tahmin / cevap)| / 2)
```

- Tam isabet → %100
- 10 kat sapma → %50
- 100 kat sapma → 0

Yani soru aslında "kaç?" değil, "kaç sıfırlı?". Bu Fermi tahmini oyunlaştırması
herkese adil bir zemin verir ve cevap ekranındaki logaritmik cetvel kuralı tek
bakışta öğretir.

## Kaynak politikası

Bu üründe pazarlık edilemeyen tek şey doğruluk: viral olan tek bir yanlış "gerçek"
markayı bitirir. Bu yüzden kural koda gömülü:

- `source` alanı tip sisteminde **zorunlu** — kaynaksız soru derlenmez.
- `npm run validate:questions` her soruyu kapıda denetler: iki dilin de dolu olması,
  https kaynak, benzersiz kimlik, yinelenen soru olmaması.
- Kıyaslama soruları en az **1.15 kat** farklı olmak zorunda. Daha yakını bilgi
  değil yazı-tura sayılır ve doğrulayıcı reddeder. (Bu kural geliştirme sırasında
  gerçekten bir soruyu eledi.)
- `npm run check:sources` tüm kaynak linklerini ağdan doğrular. Şu an **128/128**
  erişilebilir.
- Hızlı değişen veriler (servet, abone sayısı, uydu sayısı) havuza **kasıtlı olarak
  alınmadı** — bir sezon içinde çürürler.

Cevap ekranındaki kaynak linki her zaman görünür; oyuncu iddiayı anında
denetleyebilir.

## Modlar

- **Günün Beşlisi** — Herkese aynı 5 soru, tarihten türetilen tohumla seçilir
  (sunucu yok). Emoji-grid paylaşımı ve günlük seri takibi.
- **Arena** — Üç formatın karıştığı 10 soruluk serbest tur.
- **Kıyas Serisi** — Ani ölüm. Bir yanlış, seri biter.
- **Parti** — Aynı cihazda sırayla 2-8 oyuncu, aradaki "telefonu ver" ekranıyla.
  Sonunda skor tablosu ve "en saçma tahmin" ödülü.

## Kurulum

```bash
npm install
npm run dev        # http://localhost:5173
```

| Komut | İşlev |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Tip kontrolü + production build (`dist/`) |
| `npm run preview` | Build'i yerelde sun |
| `npm test` | Tüm testler (53) |
| `npm run typecheck` | Sadece tip kontrolü |
| `npm run validate:questions` | Soru havuzu bütünlük denetimi |
| `npm run check:sources` | Kaynak linklerini ağdan doğrula |

## Mimari

Framework yok — fikir dosyasının "teknik olarak çok hafif, motor gerekmez"
notuna sadık. Toplam paket **45 kB gzip**.

```
src/
  core/          Oyun mantığı, DOM'dan tamamen bağımsız
    types.ts       Soru şeması (source zorunlu)
    scoring.ts     Logaritmik puanlama, hız bonusu, notlandırma
    rng.ts         Tohumlanmış RNG — günlük modun sunucusuz çalışmasını sağlar
    daily.ts       Tarihten türeyen günlük soru seçimi
    session.ts     Tur durum makinesi (dört mod)
    storage.ts     localStorage: seri, rekor, format bazlı isabet
    share.ts       Emoji grid + native share / pano yedeği
    i18n.ts        TR/EN, dile duyarlı büyük sayı biçimlendirme
  data/          168+ soru, üç dosyada formatına göre
  ui/            Ekranlar; core'u okur, ona bağımlılık enjekte etmez
```

`core` katmanı tarayıcı API'lerine dokunmaz; testler oyunu Node'da uçtan uca
oynatabiliyor. `tests/app.integration.test.ts` jsdom üzerinde dört modu da gerçek
tıklamalarla oynayıp bitiriyor.

## Dil

TR ve EN baştan itibaren birinci sınıf: her soru veri şemasında `tr`/`en`
alanlarını taşır ve doğrulayıcı ikisinin de dolu olmasını şart koşar. Sayılar
etkin dile göre biçimlenir (`1,5 milyon` / `1.5 million`).

## Yol haritası

- [x] Faz 1 — Web prototipi: üç mod, logaritmik puanlama, paylaşım
- [x] Günlük mod + seri takibi + emoji-grid paylaşımı
- [x] Parti modu (pass-and-play)
- [x] İçerik doğrulama hattı (şema + kaynak denetimi)
- [ ] Havuzu 500+ soruya çıkar (fikir dosyasının lansman eşiği)
- [ ] Capacitor sarmalayıcı ile mobil
- [ ] Oda kodlu çevrimiçi çok oyunculu
- [ ] Kategori bazlı soru paketleri ve sezonluk temalar

## Katkı: soru eklemek

`src/data/` altındaki formatına uygun dosyaya ekle, sonra:

```bash
npm run validate:questions && npm run check:sources
```

Kaynağın gerçekten iddiayı desteklediğinden emin ol — doğrulayıcı linkin
*ulaşılabilir* olduğunu kontrol eder, *doğru* olduğunu değil. O kısım hâlâ insan işi.
