# Wyniki weryfikacji

Data: 2026-11-07. Środowisko: Linux, Node.js v24.22.1, Python 3.12.14.

Polecenie: `node --test --test-isolation=none --test-reporter=spec tests/*.test.js` (również `npm test`).

**27 testów — 27 zaliczonych, 0 niezaliczonych, 0 pominiętych.**

- 20 testów logiki, bazy i zasobów PWA: 300 pytań i 50/kategorię, unikalność, dokładna treść względem załącznika (SHA-256), limity i nazwy graczy, czas, kategorie, własna liczba pytań, Fisher–Yates, brak powtórek, równe tury dla 1–10 graczy, blokady etapów i podwójnej oceny, punktacja, cofanie, remis, procenty, zakończenie, odzyskanie kolejki, przerwane odliczanie, odrzucanie uszkodzonych zapisów, zasoby cache i rozmiary ikon.
- 4 testy integracyjne kontrolera z atrapą DOM, localStorage i zegara: pytanie zakryte i start timera, odliczanie i timeout, punktacja oraz podwójny klik, cofanie, natychmiastowe zakończenie po ukryciu, kontynuacja po odświeżeniu, dalsza gra przy niedostępnym zapisie.
- 3 testy service workera z atrapą Cache API/sieci: pobranie zasobów, usuwanie tylko starego cache własnego zakresu, odczyt cache bez sieci, fallback nawigacji offline, pomijanie obcych domen i metod POST.

Weryfikacja składni: `node --check` dla modułów JS i service workera — poprawna.

Dodatkowa weryfikacja w rzeczywistym Chromium 156.0.8078.79 przez Playwright 1.57.0: **8/8 scenariuszy zaliczonych** (polecenie `npm run test:browser`, systemowy Chromium wskazany przez `CHROMIUM_PATH`).

- Układy 375, 390, 430 i 1280 px: konfiguracja, długa nazwa gracza, zakryte pytanie, odliczanie, ocena i wyniki bez poziomego przewijania; reduced-motion; brak błędów JavaScript w tych scenariuszach.
- Formularz: limity 1–10 osób, puste/duplikowane nazwy, kategorie, limit puli i własna liczba pytań.
- Rzeczywisty czas 5 sekund, ocena, cofnięcie po przekazaniu telefonu, blokada cofania po odkryciu, remis, zmiana ostatniej oceny, restart i potwierdzenie usunięcia.
- Odświeżenie zachowuje kolejkę i kończy przerwane odliczanie. Osobno sprawdzono handler `visibilitychange` ze zdarzeniem symulującym ukrycie.
- Rzeczywisty service worker: 10 zasobów w Cache API, start i odświeżenie w trybie offline, zachowanie kolejki i ocena bez sieci, aplikacja w podkatalogu `/5-sekund/`.

Przy pierwszym przebiegu 7 scenariuszy przeszło, a test offline miał błędne oczekiwanie liczby zasobów (11 zamiast 10). Poprawiono oczekiwanie testu; aplikacja nie wymagała zmiany.

Nie wykonano testów na fizycznym iPhonie ani w Safari/WebKit. Widoki mobilne Chromium nie są testem urządzenia iOS. Test instalacji PWA, rzeczywistej blokady ekranu i dźwięku na iPhonie pozostaje do sprawdzenia według README.

## Aktualizacja — czytanie przed startem czasu

Odkrycie pytania prowadzi do zapisywanego etapu `reading`. Dopiero osobny przycisk START CZASU uruchamia odliczanie. Dodano testy minuty czytania bez upływu czasu, ukrycia i odświeżenia podczas czytania, pełnego limitu po starcie oraz blokady podwójnego startu. Zaktualizowano scenariusze przeglądarkowe i wersję cache. Wynik: 29/29 testów Node oraz 8/8 scenariuszy Chromium.
