/* ============================================================================
   INNHOLD – Gausdal Friidrettsklubb
   ----------------------------------------------------------------------------
   Dette er filen du endrer når nettsiden skal ha ny info: treningstider,
   priser, nyheter, terminliste, sponsorer og kontaktinfo.

   Regler:
   - Tekst står mellom "anførselstegn". Behold anførselstegnene og kommaene.
   - Datoer skrives ÅÅÅÅ-MM-DD, for eksempel "2027-05-02".
   - Lagre filen og publiser på nytt (se README.md).
   ========================================================================== */

window.GFIK = {

  /* --- Innmelding ------------------------------------------------------- */
  spond: {
    // Gruppekoden nye medlemmer taster inn i Spond-appen, og lenken som åpner gruppa.
    // Står begge tomme, viser siden bare interesseskjemaet.
    gruppe: "Gausdal Friidrett trening",
    kode: "FOEXN",
    lenke: "https://group.spond.com/FOEXN",
    // Adressen til Spond selv, for dem som skal laste ned appen eller logge inn.
    nettsted: "https://www.spond.com/no/"
  },

  /* --- Skjema ----------------------------------------------------------- */
  // Står feltet tomt, åpner skjemaene en ferdig utfylt e-post hos avsenderen.
  // E-posten går til adressen i kontakt.epost under.
  // Vil klubben heller ha en skjematjeneste, limes adressen til tjenesten inn her,
  // for eksempel "https://formsubmit.co/ajax/" + klubbens e-postadresse.
  skjemaAdresse: "",

  /* --- Kontakt ---------------------------------------------------------- */
  kontakt: {
    leder: "Harri Olkinuora",
    rolle: "Styreleder",
    epost: "gausdalfriidrettsklubb@gmail.com",
    telefon: "982 28 336",
    facebook: "https://www.facebook.com/groups/436427656385045/",
    instagram: "https://www.instagram.com/gausdal_friidrett/"
  },

  /* --- Treningstider ---------------------------------------------------- */
  treninger: [
    {
      dag: "Mandag",
      fra: "18.30",
      til: "20.00",
      type: "Ute",
      tittel: "Utetrening",
      sted: "Gausdal Arena og Linflåa idrettspark",
      merknad: "Oppmøtested står i Spond. Som regel møtes vi ved klubbhuset."
    },
    {
      dag: "Torsdag",
      fra: "18.30",
      til: "20.00",
      type: "Inne",
      tittel: "Innetrening",
      sted: "Gausdal Arena",
      merknad: "Vi trener i hallen."
    }
  ],

  /* --- Priser (kroner per år) ------------------------------------------- */
  priser: {
    medlemskontingent: 200,
    treningsavgift: [
      { gruppe: "14 år og yngre", belop: 400 },
      { gruppe: "15 år og eldre", belop: 900 }
    ],
    merknad: "Melder du deg inn etter 1. august, betaler du halv treningsavgift."
  },

  /* --- Terminliste ------------------------------------------------------
     Hentet fra terminlista til Innlandet friidrettskrets for 2027 og fra iSonen.
     Stevner som er passert, skjules av seg selv.
     - slutt brukes for stevner over flere dager.
     - hjemme: true markerer klubbens egne arrangementer.
     - merke: "Vårt løp" bytter ut teksten «Hjemmestevne» på merkelappen.
     - mesterskap: true markerer NM og UM.
     ---------------------------------------------------------------------- */
  terminliste: [
    { dato: "2026-12-12", tittel: "SLR AS-stevnet", sted: "Søndre Land-hallen", tekst: "Hopp uten tilløp." },
    { dato: "2027-01-16", slutt: "2027-01-17", tittel: "NM og UM i mangekamp", sted: "Oslo", mesterskap: true },
    { dato: "2027-01-30", slutt: "2027-01-31", tittel: "Norgeslekene", sted: "Nes Arena" },
    { dato: "2027-02-06", tittel: "Bassen Sprint", sted: "Bærum" },
    { dato: "2027-02-13", slutt: "2027-02-14", tittel: "Tyrvinglekene innendørs", sted: "Bærum" },
    { dato: "2027-02-19", slutt: "2027-02-21", tittel: "NM innendørs", sted: "Bergen", mesterskap: true },
    { dato: "2027-03-05", slutt: "2027-03-07", tittel: "UM innendørs", sted: "Ulsteinvik", mesterskap: true },
    { dato: "2027-03-06", slutt: "2027-03-07", tittel: "Bamselekene", sted: "Stangehallen" },
    { dato: "2027-04-18", tittel: "Veldrestafetten", sted: "Brumunddal" },
    { dato: "2027-04-24", tittel: "SpareBank 1 Østlandet-mila", sted: "Moelv" },
    { dato: "2027-04-24", tittel: "Sentrumsløpet", sted: "Oslo" },
    { dato: "2027-05-02", tittel: "Vårstevnet", sted: "Linflåa idrettspark", hjemme: true,
      tekst: "Vårt eget stevne, med kretsmesterskap i hopp for 11–19 år." },
    { dato: "2027-05-06", tittel: "Landstafetten", sted: "Søndre Land" },
    { dato: "2027-05-07", tittel: "Lambertsetersprinten", sted: "Lambertseter, Oslo" },
    { dato: "2027-05-08", tittel: "Holmenkollstafetten", sted: "Oslo" },
    { dato: "2027-05-11", tittel: "GD-stevnet", sted: "Lillehammer" },
    { dato: "2027-05-15", tittel: "Kaststevne Hamar IL", sted: "Hamar", tekst: "Med kretsmesterskap i kast for 11–19 år." },
    { dato: "2027-05-20", tittel: "Hamar Arbeiderblad-lekene", sted: "Moelv", tekst: "For 6–14 år, pluss 100 meter senior." },
    { dato: "2027-05-21", slutt: "2027-05-23", tittel: "Bore Galan", sted: "Torsby, Sverige", tekst: "Kretsens tur for 13–14 år." },
    { dato: "2027-05-22", tittel: "Skarpsno Games", sted: "Moelv" },
    { dato: "2027-05-22", tittel: "Gjøvik-Toten-lekene", sted: "Gjøvik" },
    { dato: "2027-05-25", tittel: "Nasjonalt stevne", sted: "Bislett, Oslo" },
    { dato: "2027-05-29", tittel: "Åpent Valdresmesterskap", sted: "Blåbærmyra, Fagernes" },
    { dato: "2027-06-01", tittel: "CC Strandtorget-stevnet", sted: "Lillehammer" },
    { dato: "2027-06-02", tittel: "Brandbustevnet, Mohagen Bil Cup 1", sted: "Brandbu" },
    { dato: "2027-06-04", slutt: "2027-06-06", tittel: "Tjalvelekene", sted: "Bislett, Oslo" },
    { dato: "2027-06-11", slutt: "2027-06-13", tittel: "Tyrvinglekene", sted: "Bærum" },
    { dato: "2027-06-18", slutt: "2027-06-20", tittel: "Lillehammer-lekene", sted: "Lillehammer" },
    { dato: "2027-06-23", tittel: "Brandbustevnet, Mohagen Bil Cup 2", sted: "Brandbu" },
    { dato: "2027-07-02", slutt: "2027-07-04", tittel: "Världsungdomsspelen", sted: "Göteborg, Sverige" },
    { dato: "2027-07-03", slutt: "2027-07-04", tittel: "NM i stafetter og mangekamp", sted: "Bislett, Oslo", mesterskap: true },
    { dato: "2027-07-30", slutt: "2027-08-01", tittel: "NM senior", sted: "Bærum", mesterskap: true },
    { dato: "2027-08-13", slutt: "2027-08-15", tittel: "Norgeslekene", sted: "Jessheim" },
    { dato: "2027-08-18", tittel: "Brandbustevnet, Mohagen Bil Cup 3", sted: "Brandbu" },
    { dato: "2027-08-19", tittel: "SpareBank 1-stevnet", sted: "Lillehammer", tekst: "Med kretsmesterskap i løp for 11–19 år." },
    { dato: "2027-08-20", slutt: "2027-08-22", tittel: "NM junior", sted: "Stjørdal", mesterskap: true },
    { dato: "2027-08-26", tittel: "Fønix-lekene", sted: "Brumunddal" },
    { dato: "2027-08-28", tittel: "Mjøslekene", sted: "Moelv", tekst: "For 11–15 år, med samling og overnatting." },
    { dato: "2027-08-28", tittel: "Aider Mjøssprinten", sted: "Lillehammer" },
    { dato: "2027-09-03", slutt: "2027-09-05", tittel: "UM", sted: "Sandnes", mesterskap: true },
    { dato: "2027-09-11", slutt: "2027-09-12", tittel: "Østlandsmesterskapet", sted: "Bislett, Oslo" },
    { dato: "2027-09-19", tittel: "Brandbustevnet, Mohagen Bil Cup 4", sted: "Brandbu" },
    { dato: "2027-09-19", tittel: "GK-stevnet", sted: "Lillehammer" },
    { dato: "2027-10-02", tittel: "Skeikampen Opp", sted: "Skeikampen", hjemme: true, merke: "Vårt løp",
      tekst: "Motbakkeløp på 2,8 kilometer og 340 høydemeter." }
  ],

  /* --- Aktuelt ----------------------------------------------------------
     Nyeste først. bilde er valgfritt og må ligge i mappen bilder/.
     Oppgi bildets bredde og høyde i piksler, så hopper ikke siden når det lastes.
     ---------------------------------------------------------------------- */
  nyheter: [
    {
      dato: "2026-10-03",
      tittel: "Skeikampen Opp for 13. gang",
      tekst: "Løypa er 2,8 kilometer og stiger 340 høydemeter fra foten av Skeikampen til steinbua på toppen. Vi arrangerte løpet sammen med Gausdal Skiklubb og Visit Skeikampen, og klubbens egne utøvere deltok gratis.",
      bilde: "", alt: "", bredde: 0, hoyde: 0
    },
    {
      dato: "2026-09-20",
      tittel: "Perser i Brandbu",
      tekst: "Flere av utøverne våre satte personlig rekord på et av årets siste utendørsstevner. Etterpå spiste store og små pizza sammen. Treningene på Linflåa fortsetter til snøen legger seg.",
      bilde: "bilder/lengde.jpg", alt: "Utøver i rød klubbjakke lander i lengdegropa", bredde: 897, hoyde: 1000
    },
    {
      dato: "2026-09-18",
      tittel: "Takk for klubbmesterskapet",
      tekst: "Takk til utøverne, funksjonærene og foreldrene som stilte opp på årets klubbmesterskap på Linflåa.",
      bilde: "bilder/kule.jpg", alt: "Kulestøter i klubbdrakt i ringen på Linflåa", bredde: 480, hoyde: 640
    },
    {
      dato: "2026-09-12",
      tittel: "Fem utøvere til UM i Bærum",
      tekst: "Ranveig, Erland og Trond deltok i sitt første mesterskap, og Erland og Trond satte begge pers på 200 meter. Sama var to hundredeler fra persen sin. Vegard gikk til semifinale på 200 meter etter et langt skadeavbrekk.",
      bilde: "bilder/sprint-um.jpg", alt: "Sprinter i Gausdal-drakt på vei ut av svingen under UM", bredde: 800, hoyde: 1000
    },
    {
      dato: "2026-03-08",
      tittel: "Bronse til Vegard i Ungdoms-NM",
      tekst: "Vegard Kyseth tok bronse på 200 meter i klassen U20 under Ungdoms-NM i Nes Arena. Det er hans første mesterskapsmedalje, og den avsluttet en kort innesesong.",
      bilde: "bilder/bronse-um.jpg", alt: "Vegard Kyseth i klubbdrakt med bronsemedaljen rundt halsen i Nes Arena", bredde: 880, hoyde: 1100
    }
  ],

  /* --- Sponsorer --------------------------------------------------------
     logo er valgfri. Uten logo vises bedriftsnavnet som tekst.
     hvitLogo: true brukes når logofilen er hvit og må vises i svart.
     ---------------------------------------------------------------------- */
  sponsorer: [
    {
      navn: "SpareBank 1 Østlandet", bransje: "Bank", sted: "Hamar", orgnr: "920 426 530",
      nettside: "https://www.sparebank1.no/nb/ostlandet/privat.html",
      logo: "bilder/sponsorer/sparebank1-ostlandet.svg", bredde: 263, hoyde: 78
    },
    {
      navn: "Løype Anleggsdrift AS", bransje: "Grunnarbeid", sted: "Østre Gausdal", orgnr: "933 283 607",
      nettside: "https://www.loype.no/",
      logo: "bilder/sponsorer/loype-anleggsdrift.png", bredde: 800, hoyde: 150
    },
    {
      navn: "Rekedal Pølsefabrikk AS", bransje: "Spekepølser og kjøttvarer", sted: "Follebu", orgnr: "955 027 167",
      nettside: "https://rekedal.no/",
      logo: "bilder/sponsorer/rekedal.svg", bredde: 423, hoyde: 134
    },
    {
      navn: "Arne Nyheim Rørleggerservice AS", bransje: "Rørlegger", sted: "Østre Gausdal", orgnr: "879 956 242",
      nettside: "https://www.bademiljo.no/rorleggere/arne-nyheim-rorleggerservice-as/om-oss",
      logo: "bilder/sponsorer/arne-nyheim.png", bredde: 987, hoyde: 363
    },
    {
      navn: "Meca Service AS", bransje: "Bilverksted", sted: "", orgnr: "",
      nettside: "",
      logo: "bilder/sponsorer/meca.svg", bredde: 410, hoyde: 140
    },
    {
      navn: "Gausdal Landhandleri AS", bransje: "Byggevarer og trelast", sted: "Lillehammer", orgnr: "933 735 842",
      nettside: "https://www.gaus.no/",
      logo: "bilder/sponsorer/gausdal-landhandleri-hvit.png", bredde: 240, hoyde: 71, hvitLogo: true
    }
  ],

  /* --- Styret (fra Enhetsregisteret, sist endret 8. april 2026) --------- */
  styret: [
    { navn: "Harri Olkinuora", rolle: "Styreleder" },
    { navn: "Hans Fjerdrumsmoen", rolle: "Styremedlem" },
    { navn: "Jørn Joakim Gundersen", rolle: "Styremedlem" },
    { navn: "Håkon Granum Haug", rolle: "Styremedlem" },
    { navn: "Lene Nicolaysen Sjue", rolle: "Styremedlem" }
  ],

  /* --- Klubbrekorder ---------------------------------------------------- */
  // Hentet fra klubbens rekordliste, med rettelsene som er ført inn for hånd
  // til og med 2019. Blir en rekord slått, bytter du navn, resultat og år
  // på linja for øvelsen. Tider skrives som 11,34 eller 1.54,8 (min.sek,tidel).
  klubbrekorder: {
    menn: [
      { ovelse: "100 m", navn: "Osazee Parkson", resultat: "11,20", aar: 2019 },
      { ovelse: "200 m", navn: "Vegard Kyseth", resultat: "22,15", aar: 2025 },
      { ovelse: "400 m", navn: "Erik Ring", resultat: "50,67", aar: 2016 },
      { ovelse: "800 m", navn: "Tor Åge Rønningen", resultat: "1.54,8", aar: 1964 },
      { ovelse: "1500 m", navn: "Torgeir Fjerdrumsmoen", resultat: "3.50,5", aar: 1977 },
      { ovelse: "3000 m", navn: "Torgeir Fjerdrumsmoen", resultat: "8.09,5", aar: 1978 },
      { ovelse: "5000 m", navn: "Torgeir Fjerdrumsmoen", resultat: "14.18,0", aar: 1978 },
      { ovelse: "10 000 m", navn: "Torgeir Fjerdrumsmoen", resultat: "31.18,3", aar: 1978 },
      { ovelse: "110 m hekk", navn: "Einar Bjørnhaug", resultat: "16,4", aar: 1972 },
      { ovelse: "400 m hekk", navn: "Tor Åge Rønningen", resultat: "59,2", aar: 1964 },
      { ovelse: "2000 m hinder", navn: "Hans Fjerdrumsmoen", resultat: "6.44,6", aar: 1971 },
      { ovelse: "3000 m hinder", navn: "Olav Volehaugen", resultat: "9.55,8", aar: 1971 },
      { ovelse: "1 engelsk mil", navn: "Torgeir Fjerdrumsmoen", resultat: "4.24,5", aar: 1980 },
      { ovelse: "Halvmaraton", navn: "Jon Hanestad", resultat: "1.08.22", aar: 1993 },
      { ovelse: "Maraton", navn: "Arne Flugstad", resultat: "2.32.31", aar: 1986 },
      { ovelse: "Høyde", navn: "Erik Ring", resultat: "1,85", aar: 2016 },
      { ovelse: "Stav", navn: "Einar Bjørnhaug", resultat: "3,60", aar: 1973 },
      { ovelse: "Lengde", navn: "Einar Bjørnhaug", resultat: "6,58", aar: 1972 },
      { ovelse: "Tresteg", navn: "Einar Bjørnhaug", resultat: "12,85", aar: 1971 },
      { ovelse: "Kule", navn: "Johnny Lien", resultat: "12,59", aar: 1977 },
      { ovelse: "Diskos", navn: "Johnny Lien", resultat: "45,68", aar: 1977 },
      { ovelse: "Slegge", navn: "Johnny Lien", resultat: "41,08", aar: 1977 },
      { ovelse: "Spyd", navn: "Einar Bjørnhaug", resultat: "47,66", aar: 1973 },
      { ovelse: "Tikamp", navn: "Einar Bjørnhaug", resultat: "5750 p", aar: 1973 }
    ],
    kvinner: [
      { ovelse: "60 m", navn: "Trine Rugsveen", resultat: "7,9", aar: 1982 },
      { ovelse: "100 m", navn: "Miriam Pedersen", resultat: "12,56", aar: 2019 },
      { ovelse: "200 m", navn: "Miriam Pedersen", resultat: "26,03", aar: 2019 },
      { ovelse: "400 m", navn: "Anne Jorunn Flaten", resultat: "57,3", aar: 1983 },
      { ovelse: "800 m", navn: "Anne Jorunn Flaten", resultat: "2.06,5", aar: 1984 },
      { ovelse: "1500 m", navn: "Marit Holtklimpen", resultat: "4.15,11", aar: 1983 },
      { ovelse: "3000 m", navn: "Marit Holtklimpen", resultat: "9.14,44", aar: 1983 },
      { ovelse: "10 000 m", navn: "Mette Møller", resultat: "37.57,0", aar: 1982 },
      { ovelse: "100 m hekk", navn: "Kari Kamstrup", resultat: "20,4", aar: 1971 },
      { ovelse: "Halvmaraton", navn: "Marthe Flugstad", resultat: "1.18.48", aar: 1989 },
      { ovelse: "Maraton", navn: "Marthe Flugstad", resultat: "2.46.35", aar: 1989 },
      { ovelse: "Høyde", navn: "Anne Jorunn Flaten", resultat: "1,55", aar: 1975 },
      { ovelse: "Stav", navn: "Ronja Thoresen", resultat: "2,00", aar: 2019 },
      { ovelse: "Lengde", navn: "Kari Kamstrup", resultat: "5,35", aar: 1972 },
      { ovelse: "Kule", navn: "Bente Langsveen", resultat: "9,25", aar: 1977 },
      { ovelse: "Diskos", navn: "Mona Haugen", resultat: "26,32", aar: 1973 },
      { ovelse: "Spyd", navn: "Marit Syversen", resultat: "33,16", aar: 1986 }
    ]
  },

  /* --- Kvalifiseringskrav ----------------------------------------------- */
  // Krav til UM, Junior-NM og hoved-NM utendørs, fra reglementene til
  // Norges Friidrettsforbund for 2026. Byttes når forbundet endrer kravene.
  // Hver rad: øvelse og så ett krav per klasse, i samme rekkefølge som i "klasser".
  //   ""      ingen krav oppført for klassen
  //   "*"     fri påmelding
  //   "a|b"   krav a med merknad b (hekkedistanse og hekkehøyde, eller vekt på redskapet)
  // En linje med bare tekst ("Løp") er en mellomtittel i tabellen.
  kvalifiseringskrav: {
    sesong: "2026",
    klasser: ["UM 15 år", "UM 16 år", "UM 17 år", "UM 18/19 år", "Junior U20", "Junior U23", "Hoved-NM"],
    jenter: [
      "Løp",
      ["100 m", "13,65", "13,45", "13,40", "13,35", "13,20 / 12,9", "12,99 / 12,6", "12,80"],
      ["200 m", "28,20", "27,80", "27,65", "27,50", "27,10 / 26,8", "26,80 / 26,5", "26,20"],
      ["400 m", "", "", "64,00", "63,00", "61,99 / 61,8", "60,99 / 60,8", "58,99"],
      ["800 m", "2.33,0", "2.31,0", "2.30,0", "2.30,0", "2.24,99", "2.21,99", "2.14,99"],
      ["1500 m", "", "", "", "", "5.04,99", "5.04,99", "4.44,99"],
      ["2000 m", "*", "", "", "", "", "", ""],
      ["3000 m", "", "*", "*", "*", "11.09,99", "10.59,99", "10.14,99"],
      ["5000 m", "", "", "", "", "", "", "17.59,99"],
      "Hekk",
      ["Kort hekk", "13,75|80 m, 76,2 cm", "13,50|80 m, 76,2 cm", "17,50|100 m, 76,2 cm", "17,50|100 m, 84,0 cm", "16,49 / 16,2", "16,49 / 16,2", "15,49"],
      ["Lang hekk", "53,00|300 m", "52,00|300 m", "51,00|300 m", "75,00|400 m", "69,99 / 69,8", "68,99 / 68,8", "66,99"],
      "Hopp",
      ["Høyde", "1,46", "1,48", "1,50", "1,50", "1,58", "1,58", "1,65"],
      ["Stav", "2,30", "2,50", "2,50", "2,50", "2,70", "2,70", "3,20"],
      ["Lengde", "4,85", "4,90", "4,95", "4,95", "5,10", "5,15", "5,35"],
      ["Tresteg", "9,80", "10,00", "10,10", "10,10", "10,40", "10,50", "11,25"],
      "Kast",
      ["Kule", "9,50|3 kg", "10,00|3 kg", "10,50|3 kg", "9,00|4 kg", "9,50", "10,00", "11,25"],
      ["Diskos", "26,00|0,75 kg", "26,00|1 kg", "27,00|1 kg", "28,00|1 kg", "29,00", "30,00", "36,00"],
      ["Slegge", "26,00|3 kg", "30,00|3 kg", "30,00|3 kg", "30,00|4 kg", "35,00", "35,00", "42,00"],
      ["Spyd", "27,00|500 g", "29,00|500 g", "30,00|500 g", "30,00|600 g", "35,00", "35,00", "40,00"]
    ],
    gutter: [
      "Løp",
      ["100 m", "12,40", "12,15", "12,00", "11,80", "11,75 / 11,5", "11,59 / 11,3", "11,30"],
      ["200 m", "25,35", "24,70", "24,20", "23,80", "23,75 / 23,5", "23,30 / 23,0", "22,80"],
      ["400 m", "", "", "54,25", "53,00", "52,80 / 52,6", "51,50 / 51,3", "49,99"],
      ["800 m", "2.12,0", "2.08,0", "2.05,0", "2.03,0", "2.00,49", "1.58,49", "1.56,99"],
      ["1500 m", "", "", "", "", "4.14,99", "4.07,99", "3.59,99"],
      ["2000 m", "6.35,0", "", "", "", "", "", ""],
      ["3000 m", "", "9.50,0", "9.38,0", "9.30,0", "9.14,99", "8.59,99", "8.34,99"],
      ["5000 m", "", "", "", "", "16.29,99", "16.09,99", "14.59,99"],
      "Hekk",
      ["Kort hekk", "16,50|100 m, 84,0 cm", "16,50|100 m, 91,4 cm", "18,00|110 m, 91,4 cm", "18,00|110 m, 100 cm", "17,99 / 17,7", "16,99 / 16,7", "15,99"],
      ["Lang hekk", "47,50|300 m", "46,00|300 m", "44,50|300 m", "63,00|400 m", "61,99 / 61,8", "59,99 / 59,8", "57,99"],
      "Hopp",
      ["Høyde", "1,65", "1,70", "1,75", "1,75", "1,83", "1,88", "1,90"],
      ["Stav", "2,80", "3,00", "3,00", "3,20", "3,50", "3,50", "4,20"],
      ["Lengde", "5,45", "5,65", "5,85", "6,00", "6,15", "6,40", "6,60"],
      ["Tresteg", "11,00", "11,50", "11,75", "12,25", "12,70", "13,00", "13,75"],
      "Kast",
      ["Kule", "12,00|4 kg", "11,50|5 kg", "12,50|5 kg", "12,00|6 kg", "12,00", "11,75", "14,00"],
      ["Diskos", "33,00|1 kg", "31,00|1,5 kg", "33,00|1,5 kg", "32,00|1,75 kg", "35,00", "37,00", "44,00"],
      ["Slegge", "30,00|4 kg", "30,00|5 kg", "33,00|5 kg", "32,00|6 kg", "40,00", "40,00", "50,00"],
      ["Spyd", "39,00|600 g", "39,00|700 g", "42,00|700 g", "43,00|800 g", "46,00", "50,00", "58,00"]
    ]
  }
};
