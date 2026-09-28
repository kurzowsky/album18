/**
 * ==============================================================================
 * KONFIGURACJA ALBUMU (OLIWKA • 18)
 * ==============================================================================
 */

const ALBUM_CONFIG = {
  // Hasło zabezpieczające dostęp do albumu
  password: "oliwka123",

  // Dane solenizanta i imprezy
  birthdayPerson: "Oliwka",
  age: "18",
  date: "25 lipca 2026",
  location: "Mniewo",

  /**
   * ============================================================================
   * TELEDYSK / AFTERMOVIE Z IMPREZY (YOUTUBE / PLIK MP4 / DYSK GOOGLE)
   * ============================================================================
   * NAJLEPSZA OPCJA NA TELEFON (IPHONE & ANDROID) BEZ ŻADNYCH BŁĘDÓW:
   * 1. YouTube jako film "Niepubliczny" (Unlisted):
   *    -> Wrzucasz film na YouTube i zaznaczasz widoczność "Niepubliczny".
   *    -> Nikt w internecie go nie znajdzie (brak w wyszukiwarce YouTube).
   *    -> Na telefonie odtwarza się w 100% bezpośrednio na stronie w najwyższej jakości (do 4K)!
   *    -> Wklejasz tutaj link: np. "https://www.youtube.com/watch?v=..." lub "https://youtu.be/..."
   *
   * 2. Plik wideo MP4 w folderze:
   *    -> Wrzucasz plik wideo bezpośrednio do folderu ze stroną i wpisujesz: "teledysk.mp4"
   *
   * 3. Dysk Google:
   *    -> Możesz wkleić link z Dysku, jednak telefony (zwłaszcza iPhone / Safari)
   *       domyślnie blokują odtwarzanie z Dysku Google przez blokadę plików cookie ITP.
   */
  videoUrl: "https://www.youtube.com/watch?v=okM6r9N6CjY",

  /**
   * ============================================================================
   * W 100% AUTOMATYCZNY CAŁY FOLDER ZDJĘĆ Z GOOGLE DRIVE
   * ============================================================================
   * Strona SAMA pobiera i sortuje wszystkie zdjęcia z Twojego folderu!
   * Kiedy dorzucisz nowe zdjęcia do folderu na dysku, pojawią się tu same.
   */
  folderScriptUrl: "https://script.google.com/macros/s/AKfycbyAYamptz5Z2QyWcgYJI7DzRhxH14RVRetUHVlvHqYdSeWqpQIqDPgiDvddvKgnskOj/exec",

  /**
   * Zapasowa lista zdjęć (pusta, bo korzystasz z automatycznego folderu wyżej)
   */
  photoIds: []
};
