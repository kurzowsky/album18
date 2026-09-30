/**
 * ==============================================================================
 * KONFIGURACJA ALBUMU (OLIWKA • 18)
 * ==============================================================================
 */

const ALBUM_CONFIG = {
  // Dane solenizanta i imprezy
  birthdayPerson: "Oliwka",
  age: "18",
  date: "25 lipca 2026",
  location: "Mniewo",

  /**
   * ============================================================================
   * PROFILE DOSTĘPU: DWA HASŁA = DWA RÓŻNE TELEDYSKI
   * ============================================================================
   * Zdjęcia z folderu Google Drive są identyczne dla obu grup.
   * W zależności od tego, które hasło wpisze gość, strona wyświetla inny film!
   */
  accessProfiles: {
    // 1. PROFIL DLA ZNAJOMYCH
    friends: {
      password: "oliwka123", // Hasło dla znajomych (wpisz jakie chcesz)
      videoTitle: "Film z Osiemnastki",
      videoSubtitle: "To była niezapomniana noc pełna energii i tańca!",
      videoUrl: "https://www.youtube.com/watch?v=DdWRmEKqw1I" // Link do filmu dla znajomych (YouTube Unlisted / MP4)
    },

    // 2. PROFIL DLA RODZINY
    family: {
      password: "oliwka18", // Hasło dla rodziny (wpisz jakie chcesz)
      videoTitle: "Film z Osiemnastki",
      videoSubtitle: "To była niezapomniana noc pełna energii i tańca!",
      videoUrl: "https://www.youtube.com/watch?v=qzTLU5eov2s" // Link do filmu dla rodziny (YouTube Unlisted / MP4)
    }
  },

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
