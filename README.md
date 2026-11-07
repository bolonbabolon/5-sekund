# 5-sekund

## 5 sekund — Totalny Chaos

Działająca polska gra imprezowa dla 1–10 osób na jednym telefonie. HTML, CSS i moduły JavaScript, bez backendu, bibliotek aplikacji ani procesu budowania. Dokładnie 300 pytań z dostarczonego pliku: 6 kategorii po 50 pytań, oryginalne teksty i identyfikatory 001–300. Dźwięk jest generowany lokalnie przez Web Audio. Żadne fonty, skrypty ani grafiki nie wymagają zewnętrznych usług.

## Pliki

```text
5-sekund/
├── dist/                       # gotowa strona — publikuj zawartość tego katalogu
│   ├── index.html
│   ├── style.css
│   ├── app.js                  # interfejs, timer, dźwięk i zapis
│   ├── logic.js                # walidacja i reguły gry
│   ├── questions.js            # cała oryginalna baza 300 pytań
│   ├── manifest.webmanifest
│   ├── sw.js
│   └── icons/
│       ├── icon-192.png
│       ├── icon-512.png
│       └── apple-touch-icon.png
├── tests/
│   ├── logic.test.js
│   ├── app.test.js             # kontroler z atrapą DOM i zegara
│   ├── sw.test.js              # zdarzenia SW z atrapą cache i sieci
│   └── browser.mjs             # testy w rzeczywistym Chromium
├── .github/workflows/pages.yml
├── package.json
├── TEST-RESULTS.md
└── README.md
```

## Uruchomienie lokalne

Wymagany Python 3. Nie trzeba instalować pakietów npm.

```sh
cd 5-sekund
python3 -m http.server 8080 --directory dist
```

Otwórz **http://localhost:8080**. Alternatywnie `npm run dev`. Do testów wymagany Node.js 22.8+ (sprawdzono na 24.22.1): `npm test`.

Nie uruchamiaj gry przez dwuklik w `index.html`: moduły ES oraz service worker wymagają serwera. Nie obiecujemy działania offline dla `file://`. Serwer lokalny HTTP działa z service workerem na localhost; adres komputera w sieci LAN otwarty na iPhonie wymaga HTTPS, aby działało offline.

## Zasady i obsługa

1. Wybierz 1–10 osób, unikalne imiona, 5–10 sekund i co najmniej jedną kategorię. Kategoria „18+” jest oznaczona. „Totalny chaos” również zawiera dorosły humor. Kategorie te są początkowo odznaczone.
2. Ustaw liczbę pytań **na gracza**: preset albo własna liczba całkowita. Limit wynosi `floor(pula wybranych kategorii / liczba graczy)`. Podsumowanie pokazuje pełną liczbę tur i dostępną pulę; nieprawidłowa konfiguracja blokuje start.
3. Przekaż telefon osobie wskazanej na ekranie. Pytanie jest zakryte. „Odkryj pytanie” ujawnia je bez uruchamiania zegara. Przeczytaj je spokojnie, a potem naciśnij **START CZASU**. Dopiero ten przycisk rozpoczyna pełny limit odpowiedzi.
4. Wymień trzy odpowiedzi w limicie. Po końcu czasu pozostali gracze wybierają „Zaliczone” (+1) lub „Niezaliczone” (0). Nie ma częściowych punktów ani automatycznej oceny. Solo oceniasz się samodzielnie.
5. Ocenę można cofnąć także na następnym ekranie przekazania telefonu, ale tylko do odkrycia kolejnego pytania. Można też cofnąć ostatnią ocenę w wynikach.
6. Każdy gra po jednej turze w kolejności. Po równej liczbie tur pojawia się ranking, procent poprawnych i zwycięzca lub wszyscy współzwycięzcy.

Timer korzysta z `performance.now()` oraz pomocniczo czasu ściennego, żeby nie przedłużać gry po uśpieniu. Ukrycie strony/opuszczenie jej kończy aktywne odliczanie. Po odświeżeniu zapis z etapem `running` również wraca do oceny po końcu czasu. Odliczanie nie startuje ponownie.

Dźwięk uruchamia się po interakcji, można go wyciszyć. Wibracje są opcjonalne i zależą od przeglądarki; iOS może ich nie obsługiwać. Animacje respektują `prefers-reduced-motion`. Interfejs ma polskie etykiety, focus klawiatury, duże przyciski i safe-area.

## Zapis i prywatność

`localStorage` przechowuje ustawienia, graczy, wyniki wyliczane z historii ocen, całą ustaloną kolejkę, indeks i etap rozgrywki. Odświeżenie pokazuje propozycję kontynuacji. Gra nie przetasowuje kolejki przy wczytywaniu i nie pokazuje przyszłych pytań w interfejsie. Plik bazy i zapis w narzędziach deweloperskich są dostępne lokalnie — nie jest to mechanizm ochrony przed celowym podglądaniem.

Dane pozostają w tej przeglądarce i pod tym adresem strony. Nie ma kont graczy ani wysyłania wyników. Safari, Chrome i aplikacja z ekranu początkowego mogą mieć osobne magazyny danych. Tryb prywatny, brak miejsca, wyczyszczenie danych strony lub usunięcie PWA mogą utracić zapis. Błędy pamięci pokazują ostrzeżenie; można dalej grać w pamięci. Stare/uszkodzone dane są odrzucane bez automatycznego kasowania. Usunięcie istniejącej gry wymaga potwierdzenia.

## Publikacja na GitHub Pages — bolonbabolon/5-sekund

Repozytorium docelowe: https://github.com/bolonbabolon/5-sekund, gałąź `main`. Oryginalny nagłówek README i początkowy commit pozostają zachowane; aplikacja została dodana jako kolejny commit. Nie wykonywano resetów, usuwania danych ani force-push.

1. Otwórz https://github.com/bolonbabolon/5-sekund/settings/pages.
2. W **Build and deployment → Source** wybierz **GitHub Actions**.
3. Repozytorium jest obecnie **prywatne**. Pages dla prywatnego repozytorium wymaga odpowiedniego płatnego planu GitHub. Jeżeli ustawienie Pages nie jest dostępne, właściciel może zdecydować o zmianie widoczności na publiczną albo zmianie planu. Nie zmieniono widoczności automatycznie.
4. Otwórz **Actions → GitHub Pages → Run workflow → main → Run workflow** (albo ponów początkowy run po włączeniu Pages).
5. Workflow najpierw uruchamia testy Node i Chromium, a potem publikuje wyłącznie `dist/`.
6. Po zielonym kroku **Deploy** otwórz adres zwrócony przez akcję. Standardowy adres tego repozytorium to **https://bolonbabolon.github.io/5-sekund/**. Ten adres będzie działać dopiero po poprawnej publikacji — sama obecność plików na GitHubie nie oznacza aktywnej strony.

Wszystkie ścieżki są względne. Test przeglądarkowy uruchamia aplikację w podkatalogu `/5-sekund/`, tak jak GitHub Pages. Nie wymaga backendu ani kompilacji. Kolejne push na `main` ponawiają testy i publikację.

Aby pobrać projekt lokalnie:

```sh
git clone https://github.com/bolonbabolon/5-sekund.git
cd 5-sekund
npm test
npm run dev
```

Klonowanie prywatnego repozytorium wymaga zalogowanego konta z dostępem. Python 3 obsługuje serwer lokalny; Node.js 22.8+ uruchamia testy.

## iPhone: ekran początkowy i offline

1. Otwórz opublikowany adres **HTTPS w Safari**, połączony z internetem.
2. Poczekaj na napis **GOTOWE OFFLINE** u dołu strony. Oznacza ukończone pobranie zasobów przez service worker.
3. W Safari wybierz **Udostępnij → Do ekranu początkowego → Dodaj**. Nazwy pozycji zależą od wersji iOS. Safari jest zalecaną ścieżką instalacji na iPhonie.
4. Otwórz ikonę przynajmniej raz z internetem i również poczekaj na gotowość offline.
5. Włącz tryb samolotowy, zamknij i ponownie otwórz aplikację. Sprawdź nową grę, odświeżenie i kontynuację. Na desktopie możesz użyć narzędzi deweloperskich → Application → Service Workers → Offline, a następnie odświeżyć stronę.

Offline działa dzięki wstępnemu cache HTML/CSS/JS, manifestu i ikon. Nie wymaga zewnętrznych fontów ani obrazów. Pamięć offline może zostać usunięta przez system, dlatego warto ponownie sprawdzić gotowość przed imprezą.

## Aktualizowanie pytań i cache

Treści w tej wersji są niezmienione. Jeżeli w przyszłości celowo aktualizujesz bazę lub inne zasoby, **zmień `VERSION` w `dist/sw.js`**. Stary cache jest usuwany tylko w zakresie tej aplikacji. Nowy service worker czeka na zamknięcie wszystkich starych kart; nie przejmuje trwającej gry. Po zamknięciu i ponownym otwarciu pobierana jest nowa wersja. Obecny format zapisu ma wersję 1; zmiany niekompatybilne wymagają podniesienia wersji zapisu i obsługi migracji lub odrzucenia starego stanu.

## Testy i ograniczenia odbioru

- `npm test`: 29 testów Node (baza, reguły, kontroler oraz service worker z atrapami).
- `npm run test:browser`: 8 scenariuszy w rzeczywistym Chromium: 375/390/430/1280 px, brak przewijania poziomego, długie imiona, formularz, prawdziwe 5 sekund, punktacja, cofanie, remis, restart, kontynuacja, reduced-motion i rzeczywisty cache/start offline w podkatalogu.

Testy przeglądarkowe wymagają narzędzia developerskiego Playwright; sama gra nie ma zależności npm:

```sh
npm install --no-save --package-lock=false playwright@1.57.0
npx playwright install chromium
npm run test:browser
```

Na Linuxie mogą być wymagane biblioteki systemowe: `npx playwright install --with-deps chromium`. Własną instalację Chromium można wskazać przez `CHROMIUM_PATH`; opcjonalnie `PLAYWRIGHT_MODULE` wskazuje moduł Playwright. Test uruchamia i zamyka własny lokalny serwer HTTP.

Wzorzec SHA-256 w teście bazy obliczono z oryginalnego załącznika, niezależnie od wygenerowanego modułu. Szczegółowy wynik jest w `TEST-RESULTS.md`.

Nie wykonano testu na fizycznym iPhonie ani w Safari/WebKit. Chromium z mobilnymi rozmiarami ekranu nie zastępuje Safari. Przed imprezą sprawdź na swoim iPhonie dźwięk, blokadę ekranu, safe-area, instalację i ponowne uruchomienie offline według instrukcji powyżej.

Etap czytania jest zapisywany. Odświeżenie lub ukrycie strony podczas czytania nie uruchamia odliczania. Przerwanie już uruchomionego timera nadal kończy czas. Aktualizacja PWA czeka na zamknięcie wszystkich kart gry: po publikacji zamknij grę i otwórz ją ponownie z internetem; jeśli nadal widzisz poprzednią wersję, zamknij i otwórz ją jeszcze raz. Nie kasuj danych strony — zapis rozgrywki zostaje zachowany.
