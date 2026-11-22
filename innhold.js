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
  // Tom = skjemaene åpner en ferdig utfylt e-post til klubben.
  // Lim inn adressen fra en skjematjeneste (se README.md), så kommer
  // henvendelsene rett i innboksen uten at avsenderen trenger e-postprogram.
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
     Stevner som er passert, skjules av seg selv. hjemme: true markerer
     klubbens egne arrangementer. slutt brukes for stevner over flere dager.
     ---------------------------------------------------------------------- */
  terminliste: [
    { dato: "2027-01-30", slutt: "2027-01-31", tittel: "Norgeslekene", sted: "Nes Arena" },
    { dato: "2027-03-05", slutt: "2027-03-07", tittel: "UM innendørs", sted: "Ulsteinvik" },
    { dato: "2027-03-06", slutt: "2027-03-07", tittel: "Bamselekene", sted: "Stangehallen" },
    { dato: "2027-05-02", tittel: "Vårstevnet", sted: "Linflåa idrettspark", hjemme: true,
      tekst: "Vårt eget stevne, med kretsmesterskap i hopp for 11–19 år." },
    { dato: "2027-05-11", tittel: "GD-stevnet", sted: "Lillehammer" },
    { dato: "2027-05-20", tittel: "Hamar Arbeiderblad-lekene", sted: "Moelv", tekst: "For 6–14 år." },
    { dato: "2027-06-01", tittel: "CC Strandtorget-stevnet", sted: "Lillehammer" },
    { dato: "2027-06-02", tittel: "Brandbustevnet", sted: "Brandbu" }
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
  ]
};
