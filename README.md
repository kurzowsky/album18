# 📸 18th Birthday Photo Album – Oliwka • 18

Nowoczesna, czysta galeria zdjęć z imprezy 18. urodzin z automatycznym pobieraniem całego folderu z Dysku Google w kolejności chronologicznej, odtwarzaczem teledysku (Aftermovie) oraz zabezpieczeniem hasłem.

---

## 🎬 Jak dodać Teledysk / Aftermovie z 18-stki (Odtwarzanie na telefonie)

Aby teledysk odtwarzał się **bezpośrednio na stronie na każdym telefonie (iPhone Safari, Android)** bez błędów i zacięć, masz 2 najlepsze metody:

### 🌟 Opcja 1 (Rekomendowana): YouTube jako film „Niepubliczny” (Unlisted)
1. Wrzuć plik wideo na YouTube i w ustawieniach widoczności wybierz: **Niepubliczny** (*Unlisted*).
   - *Dlaczego?* Nikt w internecie nie wyszuka tego filmu (nie ma go w wyszukiwarce ani na Twoim profilu), a na stronie otwiera się błyskawicznie w jakości do 4K.
   - Odtwarza się bezpośrednio w ramce na telefonie (`playsinline`) bez żadnych błędów ciasteczek.
2. Wklej link w [`config.js`](config.js):
   ```javascript
   videoUrl: "https://www.youtube.com/watch?v=TWÓJ_LINK_DO_FILMU",
   ```

### 📁 Opcja 2: Plik MP4 w folderze projektu
1. Wrzuć plik wideo bezpośrednio do folderu ze stroną (np. jako `teledysk.mp4`).
2. Wpisz w [`config.js`](config.js):
   ```javascript
   videoUrl: "teledysk.mp4",
   ```
   *Strona uruchomi wbudowany, nowoczesny odtwarzacz HTML5, który działa w 100% na każdym telefonie.*

### ⚠️ Opcja 3: Dysk Google (Uwaga na telefony iPhone / Safari)
- Możesz też wkleić link do pliku z Dysku Google (`https://drive.google.com/file/d/.../view`).
- **Ważne:** Przeglądarka Safari na iPhone (oraz inne przeglądarki na iOS) ma włączoną domyślnie ochronę przed śledzeniem (*Prevent Cross-Site Tracking*), która blokuje ciasteczka Google w ramkach `iframe`, przez co Dysk Google potrafi wyświetlać błąd odtwarzania. W takim wypadku użytkownik może użyć przycisku *"Otwórz w aplikacji"* lub skorzystać z Opcji 1 (YouTube).

---

## 🔒 Zabezpieczenie hasłem

- **Domyślne hasło:** `oliwka123`
- Zdjęcia i film są ukryte do momentu podania hasła.
- Hasło możesz zmienić w [**`config.js`**](config.js).

---

## 🌐 Publikacja na GitHub Pages (3 minuty)

1. Przeciągnij i upuść pliki (`index.html`, `style.css`, `script.js`, `config.js`) do swojego repozytorium na GitHubie.
2. Zapisz zmiany (**Commit changes**).
3. Wejdź w **Settings** ➔ **Pages** ➔ Branch: **main** ➔ **Save**.
