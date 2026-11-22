# Nettsiden til Gausdal Friidrettsklubb

Filene i dette repoet er nettsiden slik den ligger på gausdalfriidrett.no. Endringer publiseres av seg selv et par minutter etter at de er lagret her.

## Oppdatere innholdet

Åpne `innhold.js`, trykk blyanten, gjør endringen og trykk **Commit changes**. Der ligger treningstider, priser, nyheter, terminliste, sponsorer, styret og kontaktinfo.

Ny nyhet legges øverst i lista `nyheter`:

```js
{
  dato: "2027-01-31",
  tittel: "Tre perser på Norgeslekene",
  tekst: "Skriv to–tre setninger om hva som skjedde.",
  bilde: "bilder/norgeslekene-2027.jpg", alt: "Beskriv bildet med én setning", bredde: 1200, hoyde: 900
},
```

Bildet lastes opp i mappa `bilder/`. Hold det under 300 kB og rundt 1200 piksler bredt. Uten bilde skriver du `bilde: ""`.

Nytt stevne legges i `terminliste`. Passerte stevner forsvinner av seg selv:

```js
{ dato: "2027-08-28", tittel: "Klubbmesterskap", sted: "Linflåa idrettspark", hjemme: true },
```

Ny sponsor: last opp logoen i `bilder/sponsorer/` og legg en blokk i `sponsorer`:

```js
{
  navn: "Bedriften AS", bransje: "Elektriker", sted: "Follebu", orgnr: "123 456 789",
  nettside: "https://www.bedriften.no/",
  logo: "bilder/sponsorer/bedriften.svg", bredde: 300, hoyde: 100
},
```

Hver tekst skal stå i anførselstegn, og linjene skilles med komma. Blir siden tom etter en endring, mangler det som regel et komma eller et anførselstegn.

## Skjemaer og Spond

- `spond.kode` og `spond.lenke`: gruppekoden og lenken til Spond-gruppa. De vises under prisene på forsiden.
- `skjemaAdresse`: lim inn adressen fra en skjematjeneste som Formspree, så sendes henvendelsene rett til klubbens innboks. Står feltet tomt, åpner skjemaene en ferdig utfylt e-post hos avsenderen.

## Filene

| Fil | Innhold |
| --- | --- |
| `innhold.js` | Alt som endres ofte |
| `index.html` | Forsiden og faste tekster som «Om klubben» |
| `sponsorer.html` | Sponsorsiden |
| `stil.css` | Utseende. Fargene står øverst |
| `app.js` | Koden som fyller inn innholdet |
| `bilder/`, `fonter/` | Bilder, logoer og skrifttyper |
