/* Gausdal Friidrettsklubb – Gausdalsprinten
   Et 100-meterløp i 3D. Spilleren løper for Gausdal FIK mot sju andre klubber,
   eller mot sju klubbkamerater i klubbstevnet.
   To spillmåter: «takt», der trykkene skal treffe slagene, og «klassisk», der farten
   følger hvor fort det trykkes. Forsøket er en øvingsrunde før klubbstevnet.
   Bygger på three.js (r128), som lastes fra cdnjs i spill.html. */
(function () {
  "use strict";

  var rot = document.querySelector("[data-spill]");
  if (!rot) return;
  var THREE = window.THREE;

  function finn(sel) { return rot.querySelector(sel); }
  var el = {
    lerret: finn("[data-spill-lerret]"),
    hud: finn("[data-spill-hud]"),
    tid: finn("[data-spill-tid]"),
    fart: finn("[data-spill-fart]"),
    plass: finn("[data-spill-plass]"),
    stripe: finn("[data-spill-stripe]"),
    tastV: finn('[data-spill-tast="v"]'),
    tastH: finn('[data-spill-tast="h"]'),
    nivaatekst: finn("[data-spill-nivaatekst]"),
    modustekst: finn("[data-spill-modustekst]"),
    videre: finn("[data-spill-videre]"),
    bytt: finn("[data-spill-bytt]"),
    navnfelt: finn("[data-spill-navnfelt]"),
    navn: finn("[data-spill-navn]"),
    melding: finn("[data-spill-melding]"),
    signal: finn("[data-spill-signal]"),
    taster: finn("[data-spill-taster]"),
    start: finn("[data-spill-start]"),
    startknapp: finn("[data-spill-startknapp]"),
    resultat: finn("[data-spill-resultat]"),
    resultatTittel: finn("[data-spill-resultattittel]"),
    resultatTekst: finn("[data-spill-resultattekst]"),
    liste: finn("[data-spill-liste]"),
    igjen: finn("[data-spill-igjen]"),
    lyd: finn("[data-spill-lyd]"),
    rekord: finn("[data-spill-rekord]"),
    feil: finn("[data-spill-feil]"),
    startliste: finn("[data-spill-startliste]")
  };

  function harWebGL() {
    try {
      var c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
    } catch (e) { return false; }
  }
  if (!THREE || !harWebGL()) {
    if (el.feil) el.feil.hidden = false;
    if (el.start) el.start.hidden = true;
    return;
  }

  /* ---------- Faste tall ---------- */
  var BANEBREDDE = 1.22;
  var BANER = 8;
  var SPILLERBANE = 3; // bane 4
  var MAL = 100;
  var L1 = 0.46, L2 = 0.46, OVERKROPP = 0.52, OVERARM = 0.29, UNDERARM = 0.27;
  var TOPPFART = 11.5; // meter per sekund med perfekt rytme
  var STARTX = -0.55; // hoftene står bak streken når hendene er ved den

  // Motstanderne. Fargene er valgt for å skille løperne fra hverandre og er ikke klubbenes offisielle drakter.
  // Personnavnene brukes i klubbstevnet og er oppdiktet.
  // «navn» er klubben i NM. «krets» er klubben i kretsmesterskapet, og alle der hører til Innlandet friidrettskrets.
  var KLUBBER = [
    { navn: "Lillehammer IF", krets: "Lillehammer IF", person: "Jonas Bakken", drakt: 0x1f5fbf, shorts: 0x10264d, tid: 10.75 },
    { navn: "Moelven IL", krets: "Moelven IL", person: "Ingrid Haugen", lang: true, drakt: 0x1e9e5a, shorts: 0x0f3d26, tid: 11.25 },
    { navn: "IK Tjalve", krets: "Hamar IL", person: "Sander Lien", drakt: 0xf2f2f2, shorts: 0x1a3c8c, tid: 10.6 },
    { navn: "IL Tyrving", krets: "FIK Orion", person: "Nora Solberg", lang: true, drakt: 0x39a9e0, shorts: 0xffffff, tid: 10.9 },
    { navn: "Sandnes IL", krets: "Løten Friidrett", person: "Mathias Dahl", drakt: 0xf2c230, shorts: 0x1b1b1b, tid: 11.05 },
    { navn: "Raufoss IL", krets: "Raufoss IL", person: "Thea Moen", lang: true, drakt: 0xf07c1f, shorts: 0x23252b, tid: 11.5 },
    { navn: "IL Gular", krets: "Veldre Friidrett", person: "Emil Brenden", drakt: 0x7a3fc4, shorts: 0xf2f2f2, tid: 11.8 }
  ];
  // faktor: hvor mye tregere motstanderne er. slakk, gulv, bom og feil styrer hvor streng takten er.
  // mos: hvor mange trykk i sekundet som gir full fart i klassisk spillmåte.
  var NIVAA = {
    forsok: { navn: "Forsøk", faktor: 1.36, slakk: 0.2, gulv: 0.6, bom: 0.93, feil: 0.85, mos: 7.5, personer: true, forsok: true,
      tekst: "Øvingsrunde mot rolige motstandere. Takten tåler mye slingring, og de fire første går videre.",
      tekstK: "Øvingsrunde mot rolige motstandere. De fire første går videre." },
    klubb: { navn: "Klubbstevne", faktor: 1.16, slakk: 0.14, gulv: 0.45, mos: 8.5, personer: true,
      tekst: "Du løper mot sju klubbkamerater. Takten tåler litt slingring.",
      tekstK: "Du løper mot sju klubbkamerater. Her holder det med jevn og rask trykking." },
    krets: { navn: "Kretsmesterskap", faktor: 1.08, slakk: 0.105, gulv: 0.36, mos: 9.5, krets: true,
      tekst: "Du løper mot sju klubber i Innlandet friidrettskrets. Her må takten sitte.",
      tekstK: "Du løper mot sju klubber i Innlandet friidrettskrets. Her må du trykke fort hele veien." },
    nm: { navn: "NM", faktor: 1.0, slakk: 0.08, gulv: 0.3, mos: 10.5,
      tekst: "De raskeste motstanderne. Nesten hvert steg må treffe.",
      tekstK: "De raskeste motstanderne. Du må trykke så fort du klarer helt til mål." }
  };
  var MODUS = {
    takt: "Trykk venstre og høyre annenhver gang, akkurat når ringen treffer knappen.",
    klassisk: "Trykk venstre og høyre annenhver gang så fort du klarer. Jo raskere du trykker, jo fortere løper du."
  };
  var HUD = [0xe3b08a, 0xd9a47a, 0x8d5a3b, 0xdca57c, 0x6b4226, 0xe8b993, 0xc68c5e, 0xa66a43];
  var HAAR = [0x2b1d14, 0xd8b56a, 0x141414, 0x7a4a26, 0x1c1c1c, 0xb5651d, 0x3a2a1c, 0x0f0f0f];

  var rolig = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Små hjelpere ---------- */
  function lerp(a, b, t) { return a + (b - a) * t; }
  function klem(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function myk(t) { t = klem(t, 0, 1); return t * t * (3 - 2 * t); }
  function tidTekst(s) { return s.toFixed(2).replace(".", ","); }
  function tilfeldig(a, b) { return a + Math.random() * (b - a); }

  function lerretTekstur(b, h, tegn) {
    var c = document.createElement("canvas");
    c.width = b; c.height = h;
    tegn(c.getContext("2d"), b, h);
    var t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 8;
    return t;
  }

  /* ---------- Scene ---------- */
  var renderer = new THREE.WebGLRenderer({ canvas: el.lerret, antialias: true, powerPreference: "high-performance" });
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  var scene = new THREE.Scene();
  var HIMMEL = 0xcfe3f1;
  scene.fog = new THREE.Fog(HIMMEL, 70, 420);
  scene.background = lerretTekstur(8, 256, function (g, b, h) {
    var gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, "#3f86c9"); gr.addColorStop(0.55, "#9cc7e8"); gr.addColorStop(1, "#dcebf5");
    g.fillStyle = gr; g.fillRect(0, 0, b, h);
  });

  var kamera = new THREE.PerspectiveCamera(32, 16 / 9, 0.1, 900);
  kamera.position.set(8, 1.6, 7);

  // three.js r128 regner fargekoder som lineære. Denne gjør om fra vanlig sRGB, så fargene blir som i koden.
  function lin(hex) { return new THREE.Color(hex).convertSRGBToLinear(); }
  scene.fog.color.copy(lin(HIMMEL));

  scene.add(new THREE.HemisphereLight(lin(0xdfeeff), lin(0x8c9a6a), 0.95));
  var sol = new THREE.DirectionalLight(lin(0xfff1d6), 1.25);
  sol.position.set(-18, 34, 24);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  sol.shadow.camera.left = -17; sol.shadow.camera.right = 17;
  sol.shadow.camera.top = 10; sol.shadow.camera.bottom = -10;
  sol.shadow.camera.near = 1; sol.shadow.camera.far = 90;
  sol.shadow.bias = -0.0006;
  sol.shadow.camera.updateProjectionMatrix();
  scene.add(sol); scene.add(sol.target);

  function boks(b, h, d, farge, x, y, z, skygge) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(b, h, d), new THREE.MeshLambertMaterial({ color: lin(farge) }));
    m.position.set(x, y, z);
    if (skygge) m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
    return m;
  }

  var publikum = []; // to grupper som vipper i utakt mens løpet går
  function byggVerden() {
    var midtX = 55, lengde = 190;
    var bredde = BANER * BANEBREDDE;
    var dummy = new THREE.Object3D(), farge = new THREE.Color();

    // Gress med klippestriper på tvers av løpsretningen
    var gressbilde = lerretTekstur(256, 256, function (g, b, h) {
      g.fillStyle = "#4b8a3b"; g.fillRect(0, 0, b / 2, h);
      g.fillStyle = "#579a45"; g.fillRect(b / 2, 0, b / 2, h);
      for (var i = 0; i < 3000; i++) {
        g.fillStyle = Math.random() > 0.5 ? "rgba(255,255,190,0.06)" : "rgba(0,40,0,0.08)";
        g.fillRect(Math.random() * b, Math.random() * h, 2, 2);
      }
    });
    gressbilde.wrapS = gressbilde.wrapT = THREE.RepeatWrapping; gressbilde.repeat.set(900 / 12, 500 / 12);
    var gress = new THREE.Mesh(new THREE.PlaneGeometry(900, 500), new THREE.MeshLambertMaterial({ map: gressbilde }));
    gress.rotation.x = -Math.PI / 2; gress.position.set(midtX, -0.02, 0); gress.receiveShadow = true; scene.add(gress);

    // Banedekke med korn
    var korn = lerretTekstur(256, 256, function (g, b, h) {
      g.fillStyle = "#b9392c"; g.fillRect(0, 0, b, h);
      for (var i = 0; i < 5200; i++) {
        g.fillStyle = Math.random() > 0.5 ? "rgba(255,170,150,0.10)" : "rgba(70,10,5,0.14)";
        g.fillRect(Math.random() * b, Math.random() * h, 1.6, 1.6);
      }
    });
    korn.wrapS = korn.wrapT = THREE.RepeatWrapping; korn.repeat.set(lengde / 2.2, 6);
    var bane = new THREE.Mesh(new THREE.PlaneGeometry(lengde, bredde + 1.4), new THREE.MeshStandardMaterial({ map: korn, roughness: 0.94, metalness: 0 }));
    bane.rotation.x = -Math.PI / 2; bane.position.set(midtX, 0, 0); bane.receiveShadow = true; scene.add(bane);
    boks(lengde, 0.05, 0.07, 0xd5d8dc, midtX, 0.02, bredde / 2 + 0.72, false);

    var hvit = new THREE.MeshBasicMaterial({ color: lin(0xf4f1ec) });
    for (var i = 0; i <= BANER; i++) {
      var linje = new THREE.Mesh(new THREE.BoxGeometry(lengde, 0.006, 0.05), hvit);
      linje.position.set(midtX, 0.004, (i - BANER / 2) * BANEBREDDE); scene.add(linje);
    }
    [0, MAL].forEach(function (x) {
      var tverr = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.006, bredde), hvit);
      tverr.position.set(x, 0.005, 0); scene.add(tverr);
    });
    // Rutemønster rett etter målstreken
    for (var r = 0; r < 16; r++) {
      for (var k = 0; k < 2; k++) {
        if ((r + k) % 2) continue;
        var rute = new THREE.Mesh(new THREE.PlaneGeometry(0.3, bredde / 16), hvit);
        rute.rotation.x = -Math.PI / 2;
        rute.position.set(MAL + 0.2 + k * 0.3, 0.006, -bredde / 2 + (r + 0.5) * bredde / 16); scene.add(rute);
      }
    }
    // Banenummer bak startstreken
    for (var b = 0; b < BANER; b++) {
      (function (nr) {
        var t = lerretTekstur(128, 160, function (g, w, h) {
          g.clearRect(0, 0, w, h);
          g.fillStyle = "rgba(255,255,255,0.92)";
          g.font = "700 150px 'Barlow Condensed', 'Arial Narrow', sans-serif";
          g.textAlign = "center"; g.textBaseline = "middle";
          g.fillText(String(nr + 1), w / 2, h / 2 + 8);
        });
        var p = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.78), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
        p.rotation.x = -Math.PI / 2; p.rotation.z = -Math.PI / 2;
        p.position.set(-2.1, 0.008, baneZ(nr)); scene.add(p);
      })(b);
    }
    // Startblokker
    for (var s = 0; s < BANER; s++) {
      boks(0.5, 0.05, 0.1, 0x9aa0a6, -0.95, 0.03, baneZ(s), true);
      boks(0.16, 0.14, 0.12, 0x30343a, -0.82, 0.08, baneZ(s) - 0.1, true);
      boks(0.16, 0.14, 0.12, 0x30343a, -1.12, 0.08, baneZ(s) + 0.1, true);
    }

    var lampebilde = lerretTekstur(128, 64, function (g, w, h) {
      g.fillStyle = "#2c3138"; g.fillRect(0, 0, w, h);
      for (var ly = 0; ly < 3; ly++) for (var lx = 0; lx < 6; lx++) {
        g.fillStyle = "#fff7df"; g.beginPath(); g.arc(11 + lx * 21, 11 + ly * 21, 7.5, 0, Math.PI * 2); g.fill();
      }
    });
    // Reklameskilt langs bortre langside, med klubbens sponsorer
    var navn = ["GAUSDAL FRIIDRETTSKLUBB", "gausdalfriidrett.no"];
    var sponsorer = (window.GFIK && window.GFIK.sponsorer) || [];
    sponsorer.forEach(function (sp) { if (sp && sp.navn) navn.push(sp.navn.replace(/ AS$/, "")); });
    var skiltZ = -bredde / 2 - 1.5;
    for (var n = 0; n < 24; n++) {
      (function (nr) {
        var tekst = navn[nr % navn.length];
        var rod = nr % 2 === 0;
        var t = lerretTekstur(1024, 160, function (g, w, h) {
          g.fillStyle = rod ? "#b0171e" : "#fffcfa"; g.fillRect(0, 0, w, h);
          g.fillStyle = rod ? "#ffffff" : "#1c1413";
          var str = 86;
          g.font = "700 " + str + "px 'Barlow Condensed', 'Arial Narrow', sans-serif";
          while (g.measureText(tekst.toUpperCase()).width > w - 80 && str > 30) { str -= 4; g.font = "700 " + str + "px 'Barlow Condensed', 'Arial Narrow', sans-serif"; }
          g.textAlign = "center"; g.textBaseline = "middle";
          g.fillText(tekst.toUpperCase(), w / 2, h / 2 + 4);
        });
        var p = new THREE.Mesh(new THREE.PlaneGeometry(5.9, 0.92), new THREE.MeshBasicMaterial({ map: t }));
        p.position.set(-16 + nr * 6, 0.5, skiltZ); scene.add(p);
      })(n);
    }
    boks(lengde, 0.06, 0.5, 0x7d838b, midtX, 0.0, skiltZ - 0.3, false);

    // Åpen tribune, så åsene og himmelen synes bak
    var trinn = 7, start = skiltZ - 1.8;
    for (var t = 0; t < trinn; t++) {
      boks(150, 0.55, 1.15, t % 2 ? 0x9aa1ab : 0x8a919b, midtX, 0.28 + t * 0.55, start - t * 1.15, false);
    }
    var bakvegg = start - trinn * 1.15 - 0.1;
    boks(150, 5.1, 0.3, 0x3d434c, midtX, 2.55, bakvegg, false);
    boks(150, 0.12, 0.36, 0xb0171e, midtX, 5.16, bakvegg, false);
    [-20, 130].forEach(function (x) { boks(0.3, 5.1, trinn * 1.15 + 0.6, 0x4a5059, x, 2.55, start - trinn * 0.575 + 0.3, false); });
    // Lysmaster bak tribunen
    [-8, 38, 84, 128].forEach(function (x) {
      boks(0.45, 22, 0.45, 0x8d949d, x, 11, bakvegg - 2.2, false);
      var lys = boks(4.6, 2.2, 0.35, 0x2c3138, x, 22.4, bakvegg - 1.9, false);
      lys.rotation.x = 0.5;
      var lamper = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.8), new THREE.MeshBasicMaterial({ map: lampebilde }));
      lamper.rotation.x = 0.5; lamper.position.set(x, 22.3, bakvegg - 1.7); scene.add(lamper);
    });

    // Seterader i klubbfargen
    var setebilde = lerretTekstur(64, 64, function (g, w, h) {
      g.fillStyle = "#6c727b"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#a3161c"; g.fillRect(5, 6, 54, 54);
      g.fillStyle = "#c5282e"; g.fillRect(5, 6, 54, 12);
    });
    setebilde.wrapS = THREE.RepeatWrapping; setebilde.repeat.set(Math.round(146 / 0.56), 1);
    var setestoff = new THREE.MeshLambertMaterial({ map: setebilde });
    for (var sr = 0; sr < trinn; sr++) {
      var rygg = new THREE.Mesh(new THREE.PlaneGeometry(146, 0.42), setestoff);
      rygg.position.set(midtX, 0.55 * (sr + 1) + 0.21, start - sr * 1.15 - 0.32); scene.add(rygg);
    }

    // Publikum: tegnede tilskuere på flater som står vendt mot banen. De sitter i et rutenett.
    var klaer = ["#d8232a", "#f4f1ea", "#23262b", "#2f6fb5", "#f0c94b", "#3e8f5a", "#9aa0a6", "#b0171e", "#e88a2d", "#7a4fb0", "#3aa7c9", "#d8232a"];
    var hudtoner = ["#f1c9a5", "#d9a47a", "#8d5a3b", "#e6b98f", "#6b4226", "#f3d2b3"];
    var haartoner = ["#2b1d14", "#d8b56a", "#141414", "#7a4a26", "#b5651d", "#8a8a8a"];
    var VARIANTER = 12;
    function tilskuer(i) {
      var bilde = lerretTekstur(64, 128, function (g, w, h) {
        var skjorte = klaer[i % klaer.length], hud = hudtoner[(i * 5 + 1) % 6], haar = haartoner[(i * 7 + 2) % 6];
        var jubler = i % 4 === 3;
        g.clearRect(0, 0, w, h);
        g.lineCap = "round"; g.lineWidth = 11; g.strokeStyle = skjorte;
        g.beginPath();
        if (jubler) { g.moveTo(14, 74); g.lineTo(7, 34); g.moveTo(50, 74); g.lineTo(57, 34); }
        else { g.moveTo(12, 74); g.lineTo(10, 112); g.moveTo(52, 74); g.lineTo(54, 112); }
        g.stroke();
        if (jubler) { g.fillStyle = hud; g.beginPath(); g.arc(7, 28, 6, 0, Math.PI * 2); g.arc(57, 28, 6, 0, Math.PI * 2); g.fill(); }
        g.fillStyle = skjorte;
        g.beginPath(); g.moveTo(10, h); g.lineTo(10, 76); g.quadraticCurveTo(10, 62, 24, 62); g.lineTo(40, 62); g.quadraticCurveTo(54, 62, 54, 76); g.lineTo(54, h); g.fill();
        var skygge = g.createLinearGradient(0, 84, 0, h);
        skygge.addColorStop(0, "rgba(0,0,0,0)"); skygge.addColorStop(1, "rgba(0,0,0,0.28)");
        g.fillStyle = skygge; g.fillRect(10, 84, 44, h - 84);
        g.fillStyle = hud; g.fillRect(26, 50, 12, 14);
        g.beginPath(); g.arc(32, 40, 14, 0, Math.PI * 2); g.fill();
        g.fillStyle = i % 5 === 0 ? "#b0171e" : haar; // noen har caps i klubbfargen
        g.beginPath(); g.arc(32, 37, 14.5, Math.PI, 0); g.fill();
        if (i % 5 === 0) g.fillRect(30, 33, 20, 5);
      });
      return new THREE.MeshLambertMaterial({ map: bilde, alphaTest: 0.4 });
    }
    var tilskuerstoff = [];
    for (var tv = 0; tv < VARIANTER; tv++) tilskuerstoff.push(tilskuer(tv));
    var flate = new THREE.PlaneGeometry(0.52, 1.04);
    flate.translate(0, 0.52, 0);
    var seter = [];
    for (var sg = 0; sg < 2 * VARIANTER; sg++) seter.push([]);
    for (var rad = 0; rad < trinn; rad++) {
      for (var sx = midtX - 72.6; sx < midtX + 72.6; sx += 0.56) {
        if (Math.random() < 0.86) seter[Math.floor(Math.random() * 2 * VARIANTER)].push([sx, rad]);
      }
    }
    for (var pg = 0; pg < 2; pg++) {
      var gruppe = new THREE.Group();
      for (var pv = 0; pv < VARIANTER; pv++) {
        var liste = seter[pg * VARIANTER + pv];
        if (!liste.length) continue;
        var folk = new THREE.InstancedMesh(flate, tilskuerstoff[pv], liste.length);
        for (var pf = 0; pf < liste.length; pf++) {
          var st = 0.86 + Math.random() * 0.26;
          dummy.position.set(liste[pf][0] + (Math.random() - 0.5) * 0.1, 0.55 * (liste[pf][1] + 1), start - liste[pf][1] * 1.15 - 0.05 + Math.random() * 0.3);
          dummy.rotation.set(0, -0.12 - Math.random() * 0.62, 0); dummy.scale.set(st, st, 1); dummy.updateMatrix();
          folk.setMatrixAt(pf, dummy.matrix);
        }
        gruppe.add(folk);
      }
      scene.add(gruppe);
      publikum.push(gruppe);
    }

    // Målportal
    boks(0.18, 4.4, 0.18, 0x23262b, MAL + 0.1, 2.2, bredde / 2 + 0.9, true);
    boks(0.18, 4.4, 0.18, 0x23262b, MAL + 0.1, 2.2, -bredde / 2 - 0.9, true);
    boks(0.3, 0.7, bredde + 2.0, 0xb0171e, MAL + 0.1, 4.25, 0, true);
    var malTekst = lerretTekstur(1024, 96, function (g, w, h) {
      g.fillStyle = "#b0171e"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#fff"; g.font = "700 74px 'Barlow Condensed', 'Arial Narrow', sans-serif";
      g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("M Å L  ·  GAUSDAL FRIIDRETTSKLUBB  ·  M Å L", w / 2, h / 2 + 4);
    });
    var banner = new THREE.Mesh(new THREE.PlaneGeometry(bredde + 2.0, 0.7), new THREE.MeshBasicMaterial({ map: malTekst }));
    banner.rotation.y = -Math.PI / 2; banner.position.set(MAL - 0.06, 4.25, 0); scene.add(banner);

    // Flagg bak målområdet
    var flaggbilde = lerretTekstur(220, 160, function (g, w, h) {
      g.fillStyle = "#ba0c2f"; g.fillRect(0, 0, w, h);
      g.fillStyle = "#ffffff"; g.fillRect(60, 0, 40, h); g.fillRect(0, 60, w, 40);
      g.fillStyle = "#00205b"; g.fillRect(70, 0, 20, h); g.fillRect(0, 70, w, 20);
    });
    var flaggstoff = new THREE.MeshBasicMaterial({ map: flaggbilde, side: THREE.DoubleSide });
    for (var fl = 0; fl < 7; fl++) {
      var fz = -9 + fl * 3;
      boks(0.09, 8, 0.09, 0xe6e6e6, MAL + 40, 4, fz, false);
      var flagg = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.38), flaggstoff);
      flagg.rotation.y = -Math.PI / 2 + 0.25; flagg.position.set(MAL + 39.9, 7.2, fz + 1.0); scene.add(flagg);
    }

    // Skyer
    var skybilde = lerretTekstur(128, 128, function (g, w, h) {
      var gr2 = g.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2);
      gr2.addColorStop(0, "rgba(255,255,255,0.95)"); gr2.addColorStop(0.55, "rgba(255,255,255,0.55)"); gr2.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr2; g.fillRect(0, 0, w, h);
    });
    var skystoff = new THREE.SpriteMaterial({ map: skybilde, transparent: true, depthWrite: false, fog: false });
    var skyer = [[-120, 95, -330, 150], [-20, 120, -360, 210], [90, 88, -340, 130], [190, 110, -350, 190], [300, 92, -330, 160], [420, 118, -300, 200], [40, 150, -380, 240], [250, 150, -390, 220], [520, 100, -200, 180], [600, 130, -60, 220]];
    skyer.forEach(function (s2) {
      for (var d = 0; d < 3; d++) {
        var sky = new THREE.Sprite(skystoff);
        sky.position.set(s2[0] + (d - 1) * s2[3] * 0.34, s2[1] + (d === 1 ? 7 : 0), s2[2]);
        sky.scale.set(s2[3] * (d === 1 ? 0.75 : 0.6), s2[3] * (d === 1 ? 0.24 : 0.17), 1);
        scene.add(sky);
      }
    });

    // Åser og fjell som lag bak hverandre: skogkledd ås nærmest, blånende fjell bak
    function aaslag(langsX, fast, grunn, utslag, bolge, fase, fargekode, tagger, steg) {
      var form = new THREE.Shape(), fra = -720, til = 820;
      form.moveTo(fra, -2);
      for (var p = fra; p <= til; p += steg) {
        var y = grunn + utslag * (0.55 * Math.sin(p / bolge + fase) + 0.3 * Math.sin(p / (bolge * 0.37) + fase * 2.3) + 0.15 * Math.sin(p / (bolge * 0.13) + fase * 4.1));
        if (tagger) y += tagger * Math.abs(Math.sin(p * 1.9 + fase)); // grantopper
        form.lineTo(p, y);
      }
      form.lineTo(til, -2);
      var m = new THREE.Mesh(new THREE.ShapeGeometry(form), new THREE.MeshBasicMaterial({ color: lin(fargekode), fog: false, side: THREE.DoubleSide }));
      if (langsX) m.position.z = fast; else { m.rotation.y = -Math.PI / 2; m.position.x = fast; }
      scene.add(m);
    }
    aaslag(true, -430, 104, 44, 170, 0.4, 0xc3d1dd, 0, 8);
    aaslag(true, -340, 66, 26, 105, 1.9, 0x7f97a7, 0, 6);
    aaslag(true, -245, 34, 11, 64, 3.1, 0x35553f, 1.7, 2.5);
    aaslag(false, 590, 104, 44, 170, 2.2, 0xc3d1dd, 0, 8);
    aaslag(false, 490, 66, 26, 105, 0.7, 0x7f97a7, 0, 6);
    aaslag(false, 395, 34, 11, 64, 4.4, 0x35553f, 1.7, 2.5);

    // Grantrær bak tribunen og ved enden av banen
    var ANTALL = 320;
    var grantone = new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true });
    var nedre = new THREE.InstancedMesh(new THREE.ConeGeometry(2.0, 4.8, 7), grantone, ANTALL);
    var ovre = new THREE.InstancedMesh(new THREE.ConeGeometry(1.3, 4.2, 7), grantone, ANTALL);
    var stammer = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.2, 0.26, 1.6, 6), new THREE.MeshLambertMaterial({ color: lin(0x5a4332) }), ANTALL);
    var gronn = [0x1e4029, 0x25492f, 0x1a3623, 0x2b5235];
    for (var q = 0; q < ANTALL; q++) {
      var bak = q < 230;
      var tx = bak ? -110 + Math.random() * 370 : 165 + Math.random() * 110, tz = bak ? -42 - Math.random() * 100 : -70 + Math.random() * 140;
      var sk = 0.75 + Math.random() * 0.75;
      dummy.rotation.set(0, Math.random() * 3, 0); dummy.scale.set(sk, sk, sk);
      dummy.position.set(tx, 0.8 * sk, tz); dummy.updateMatrix(); stammer.setMatrixAt(q, dummy.matrix);
      dummy.position.y = 3.6 * sk; dummy.updateMatrix(); nedre.setMatrixAt(q, dummy.matrix);
      dummy.position.y = 6.3 * sk; dummy.updateMatrix(); ovre.setMatrixAt(q, dummy.matrix);
      farge.setHex(gronn[q % gronn.length]).convertSRGBToLinear();
      nedre.setColorAt(q, farge); ovre.setColorAt(q, farge);
    }
    scene.add(stammer); scene.add(nedre); scene.add(ovre);

    // Løpsklokke ved mål
    boks(2.9, 1.25, 0.16, 0x16181c, MAL + 4.2, 1.85, skiltZ + 0.75, true);
    boks(0.12, 1.3, 0.12, 0x16181c, MAL + 3.2, 0.65, skiltZ + 0.75, true);
    boks(0.12, 1.3, 0.12, 0x16181c, MAL + 5.2, 0.65, skiltZ + 0.75, true);
    klokkebilde = lerretTekstur(256, 96, function () {});
    var tavle = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 1.02), new THREE.MeshBasicMaterial({ map: klokkebilde }));
    tavle.position.set(MAL + 4.2, 1.85, skiltZ + 0.84); scene.add(tavle);
  }

  var klokkebilde = null, klokketekst = "";
  function tegnKlokke(tekst) {
    if (!klokkebilde || tekst === klokketekst) return;
    klokketekst = tekst;
    var g = klokkebilde.image.getContext("2d");
    g.fillStyle = "#0c0d10"; g.fillRect(0, 0, 256, 96);
    g.fillStyle = "#ffb52e"; g.font = "700 80px 'Barlow Condensed', 'Arial Narrow', sans-serif";
    g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(tekst, 128, 53);
    klokkebilde.needsUpdate = true;
  }

  function baneZ(i) { return (i - (BANER - 1) / 2) * BANEBREDDE; }

  /* ---------- Løpere ---------- */
  function dreid(punkter, deler) {
    return new THREE.LatheGeometry(punkter.map(function (p) { return new THREE.Vector2(p[0], p[1]); }), deler || 14);
  }
  // Felles former for alle løperne. Målene er i meter for en utøver på omtrent 1,80.
  var FORM = {
    kule: new THREE.SphereGeometry(1, 16, 12),
    hofte: dreid([[0, -0.1], [0.085, -0.09], [0.128, -0.04], [0.134, 0.02], [0.124, 0.09], [0, 0.1]]),
    kropp: dreid([[0, 0.02], [0.118, 0.04], [0.112, 0.15], [0.118, 0.26], [0.142, 0.38], [0.15, 0.45], [0.132, 0.505], [0.07, 0.535], [0, 0.54]]),
    stripe: dreid([[0.139, 0.345], [0.1465, 0.385], [0.152, 0.425]]),
    laar: dreid([[0, 0.03], [0.088, 0], [0.094, -0.09], [0.086, -0.22], [0.068, -0.36], [0.058, -L1], [0, -L1 - 0.01]]),
    tights: dreid([[0, 0.035], [0.092, 0], [0.098, -0.09], [0.093, -0.19], [0.089, -0.2]]),
    legg: dreid([[0, 0.01], [0.056, 0], [0.064, -0.09], [0.066, -0.15], [0.052, -0.29], [0.037, -0.41], [0.035, -L2], [0, -L2 - 0.005]]),
    overarm: dreid([[0, 0.01], [0.05, 0], [0.054, -0.08], [0.046, -0.2], [0.04, -OVERARM], [0, -OVERARM - 0.005]], 12),
    underarm: dreid([[0, 0.005], [0.041, 0], [0.043, -0.06], [0.034, -0.19], [0.028, -UNDERARM], [0, -UNDERARM - 0.005]], 12),
    hals: new THREE.CylinderGeometry(0.046, 0.054, 0.11, 12),
    sokk: new THREE.CylinderGeometry(0.04, 0.037, 0.07, 10),
    haar: new THREE.SphereGeometry(1, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56),
    lapp: new THREE.PlaneGeometry(0.19, 0.14)
  };
  var SKO = [0xf4f4f0, 0xd8f23a, 0xff6a3d, 0x35d0c8, 0xff4f9a, 0xf4f4f0, 0xffd23a, 0x7df07d];

  function stoff(hex, ruhet) {
    return new THREE.MeshStandardMaterial({ color: lin(hex), roughness: ruhet, metalness: 0, side: THREE.DoubleSide });
  }

  // Løperne bygges først av enkle former, så spillet virker med en gang. Når 3D-modellene
  // i assets/runners er lastet, bytter runners.js ut kroppen og beholder de samme leddene.
  function lagLoper(nr, farger, erSpiller) {
    var l = lagGrunnloper(nr, farger, erSpiller);
    if (window.GausdalRunners) {
      window.GausdalRunners.attach(l, farger, {
        skin: HUD[nr % HUD.length], hair: HAAR[nr % HAAR.length],
        shoe: erSpiller ? 0xffffff : SKO[nr % SKO.length]
      }).then(function () { pose(l); }, function (feil) { if (window.console) console.warn("Kunne ikke laste 3D-løper", feil); });
    }
    return l;
  }

  function lagGrunnloper(nr, farger, erSpiller) {
    var hud = stoff(HUD[nr % HUD.length], 0.62);
    var drakt = stoff(farger.drakt, 0.84), shorts = stoff(farger.shorts, 0.8);
    var sko = stoff(erSpiller ? 0xffffff : SKO[nr % SKO.length], 0.5), hvitt = stoff(0xf2f2f2, 0.75);
    var haar = stoff(HAAR[nr % HAAR.length], 0.92);
    var lapp = new THREE.MeshLambertMaterial({
      map: lerretTekstur(128, 96, function (g, w, h) {
        g.fillStyle = "#fffdf8"; g.fillRect(0, 0, w, h);
        g.fillStyle = "#1c1413"; g.font = "700 84px 'Barlow Condensed', 'Arial Narrow', sans-serif";
        g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(String(nr + 1), w / 2, h / 2 + 6);
      })
    });

    function del(geo, mat, forelder, x, y, z) {
      var m = new THREE.Mesh(geo, mat);
      m.position.set(x || 0, y || 0, z || 0);
      m.castShadow = true;
      forelder.add(m);
      return m;
    }
    function kule(mat, forelder, x, y, z, sx, sy, sz) {
      var m = del(FORM.kule, mat, forelder, x, y, z);
      m.scale.set(sx, sy, sz);
      return m;
    }
    function ledd(forelder, x, y, z) {
      var g = new THREE.Group(); g.position.set(x, y, z); forelder.add(g); return g;
    }

    var gruppe = new THREE.Group();
    var bekken = ledd(gruppe, 0, 0.98, 0);
    del(FORM.hofte, shorts, bekken).scale.set(0.78, 1, 1.16);

    var overkropp = ledd(bekken, 0, 0.02, 0);
    del(FORM.kropp, drakt, overkropp).scale.set(0.74, 1, 1.2);
    if (erSpiller) del(FORM.stripe, hvitt, overkropp).scale.set(0.746, 1, 1.206); // hvit stripe over brystet
    del(FORM.hals, hud, overkropp, 0.012, OVERKROPP + 0.06, 0);
    del(FORM.lapp, lapp, overkropp, 0.114, 0.29, 0).rotation.y = Math.PI / 2;
    del(FORM.lapp, lapp, overkropp, -0.114, 0.33, 0).rotation.y = -Math.PI / 2;

    var hode = ledd(overkropp, 0.02, OVERKROPP + 0.2, 0);
    kule(hud, hode, 0, 0, 0, 0.1, 0.118, 0.094);
    kule(hud, hode, 0.034, -0.046, 0, 0.074, 0.076, 0.078);
    kule(hud, hode, 0.1, -0.014, 0, 0.016, 0.02, 0.016);
    kule(hud, hode, 0, -0.006, 0.093, 0.014, 0.026, 0.01);
    kule(hud, hode, 0, -0.006, -0.093, 0.014, 0.026, 0.01);
    var lugg = del(FORM.haar, haar, hode, -0.008, 0.008, 0);
    lugg.scale.set(0.106, 0.124, 0.1); lugg.rotation.z = 0.42;
    if (farger.lang) { // hestehale
      kule(haar, hode, -0.108, 0.0, 0, 0.04, 0.05, 0.045);
      kule(haar, hode, -0.15, -0.085, 0, 0.03, 0.085, 0.032).rotation.z = -0.45;
    }

    function arm(side) {
      var skulder = ledd(overkropp, 0, OVERKROPP - 0.045, side * 0.19);
      kule(hud, skulder, 0, 0, 0, 0.058, 0.058, 0.058);
      del(FORM.overarm, hud, skulder);
      var albue = ledd(skulder, 0, -OVERARM, 0);
      kule(hud, albue, 0, 0, 0, 0.042, 0.042, 0.042);
      del(FORM.underarm, hud, albue);
      kule(hud, albue, 0, -UNDERARM - 0.04, 0, 0.03, 0.055, 0.022);
      return { skulder: skulder, albue: albue };
    }
    function bein(side) {
      var h = ledd(bekken, 0, -0.04, side * 0.088);
      del(FORM.laar, hud, h);
      del(FORM.tights, shorts, h);
      var kne = ledd(h, 0, -L1, 0);
      kule(hud, kne, 0.004, 0, 0, 0.06, 0.062, 0.058);
      del(FORM.legg, hud, kne);
      var ankel = ledd(kne, 0, -L2, 0);
      del(FORM.sokk, hvitt, ankel, 0, 0.005, 0);
      kule(sko, ankel, 0.07, -0.045, 0, 0.135, 0.05, 0.05);
      kule(sko, ankel, -0.015, -0.04, 0, 0.055, 0.052, 0.046);
      kule(hvitt, ankel, 0.065, -0.078, 0, 0.14, 0.018, 0.046);
      return { hofte: h, kne: kne, ankel: ankel };
    }
    var aV = arm(-1), aH = arm(1), bV = bein(-1), bH = bein(1);

    // Navneskilt over hodet. Teksten tegnes på nytt når nivået byttes.
    var skiltbilde = lerretTekstur(512, 112, function () {});
    var skilt = new THREE.Sprite(new THREE.SpriteMaterial({ map: skiltbilde, transparent: true, depthTest: false }));
    skilt.scale.set(1.9, 0.42, 1); skilt.position.set(0, 2.25, 0); skilt.renderOrder = 5;
    gruppe.add(skilt);
    scene.add(gruppe);

    return {
      nr: nr, navn: "", klubb: "", person: "", spiller: !!erSpiller, farge: farger.drakt, gruppe: gruppe, bekken: bekken, overkropp: overkropp, hode: hode,
      aV: aV, aH: aH, bV: bV, bH: bH, skilt: skilt, skiltbilde: skiltbilde,
      x: STARTX, z: baneZ(nr), v: 0, fase: 0, malfase: 0, sett: 1, klar: 0, andel: 0, jubel: 0, reist: 0,
      ferdig: false, tid: null, reaksjon: null, startet: false
    };
  }

  function tegnSkilt(l) {
    var c = l.skiltbilde.image, g = c.getContext("2d"), w = c.width, h = c.height, navn = l.navn;
    g.clearRect(0, 0, w, h);
    g.font = "700 58px 'Barlow Condensed', 'Arial Narrow', sans-serif";
    var b = Math.min(w - 8, g.measureText(navn.toUpperCase()).width + 64);
    var x = (w - b) / 2, r = 18;
    g.fillStyle = l.spiller ? "rgba(176,23,30,0.95)" : "rgba(28,20,19,0.82)";
    g.beginPath(); g.moveTo(x + r, 8); g.arcTo(x + b, 8, x + b, h - 8, r); g.arcTo(x + b, h - 8, x, h - 8, r); g.arcTo(x, h - 8, x, 8, r); g.arcTo(x, 8, x + b, 8, r); g.fill();
    g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(navn.toUpperCase(), w / 2, h / 2 + 4, w - 40);
    l.skiltbilde.needsUpdate = true;
  }

  // Setter alle ledd ut fra løperens tilstand. «sett» er 1 i startblokka og 0 i fullt løp.
  function pose(l) {
    var f = l.fase;
    var amp = 0.22 + 0.78 * l.andel;
    var thV = 0.1 + amp * (0.24 + 0.98 * Math.sin(f)), thH = 0.1 + amp * (0.24 + 0.98 * Math.sin(f + Math.PI));
    var knV = 0.14 + 2.15 * amp * Math.pow(Math.max(0, Math.cos(f - 0.35)), 1.15);
    var knH = 0.14 + 2.15 * amp * Math.pow(Math.max(0, Math.cos(f + Math.PI - 0.35)), 1.15);
    var anV = -0.3 + 0.3 * Math.max(0, Math.sin(f)), anH = -0.3 + 0.3 * Math.max(0, Math.sin(f + Math.PI));
    var skV = -1.05 * amp * Math.sin(f) + 0.05, skH = -1.05 * amp * Math.sin(f + Math.PI) + 0.05;
    var alV = 1.5 + 0.35 * amp * Math.max(0, -Math.sin(f)), alH = 1.5 + 0.35 * amp * Math.max(0, Math.sin(f));
    var lut = lerp(1.0, 0.2, myk(l.andel * 1.05));
    var hodeV = lerp(0.4, 0.05, myk(l.andel * 1.05));
    var vri = 0.16 * amp * Math.sin(f) * (1 - myk(l.sett));

    if (l.reist > 0) { // etter målstreken retter løperen seg opp mens farten faller
      var opp = myk(l.reist);
      lut = lerp(lut, 0.04, opp); hodeV = lerp(hodeV, 0, opp);
      alV = lerp(alV, 0.75, opp); alH = lerp(alH, 0.75, opp); // armene henger roligere ned
    }
    if (l.jubel > 0) { // armene i været etter seier
      var j = myk(l.jubel);
      skV = lerp(skV, 2.75, j); skH = lerp(skH, 2.75, j); alV = lerp(alV, 0.25, j); alH = lerp(alH, 0.25, j);
      lut = lerp(lut, -0.05, j);
    }
    if (l.sett > 0) {
      var s = myk(l.sett), k = l.klar;
      var lutS = lerp(1.32, 1.72, k);
      thV = lerp(thV, lerp(1.7, 1.5, k), s); knV = lerp(knV, lerp(2.2, 1.75, k), s);
      thH = lerp(thH, lerp(0.5, 0.8, k), s); knH = lerp(knH, lerp(1.9, 1.45, k), s);
      anV = lerp(anV, -0.55, s); anH = lerp(anH, -0.55, s);
      skV = lerp(skV, lutS, s); skH = lerp(skH, lutS, s);
      alV = lerp(alV, 0.06, s); alH = lerp(alH, 0.06, s);
      lut = lerp(lut, lutS, s); hodeV = lerp(hodeV, lerp(-0.2, -0.5, k), s);
    }

    l.bV.hofte.rotation.z = thV; l.bH.hofte.rotation.z = thH;
    l.bV.kne.rotation.z = -knV; l.bH.kne.rotation.z = -knH;
    l.bV.ankel.rotation.z = anV; l.bH.ankel.rotation.z = anH;
    l.aV.skulder.rotation.z = skV; l.aH.skulder.rotation.z = skH;
    l.aV.albue.rotation.z = alV; l.aH.albue.rotation.z = alH;
    l.overkropp.rotation.z = -lut;
    l.overkropp.rotation.y = l.jubel > 0 ? 0 : vri;
    l.hode.rotation.z = lut * 0.55 + hodeV * 0.4;

    // Hoftehøyden følger det beinet som rekker lengst ned, så en fot alltid er nær bakken
    var rekkV = L1 * Math.cos(thV) + L2 * Math.cos(thV - knV), rekkH = L1 * Math.cos(thH) + L2 * Math.cos(thH - knH);
    var svev = (1 - myk(l.sett)) * 0.05 * l.andel * Math.abs(Math.sin(f + 0.6));
    l.bekken.position.y = Math.max(rekkV, rekkH) + 0.095 + svev;
    l.gruppe.position.set(l.x, 0, l.z);
    l.skilt.visible = l.spiller || smal;
    l.skilt.position.y = 2.25 + 0.34 * myk(l.jubel); // over hendene når vinneren jubler
  }

  /* ---------- Lyd ---------- */
  var lydPaa = true, lydKtx = null;
  function lydStart() {
    if (lydKtx || !(window.AudioContext || window.webkitAudioContext)) return;
    try { lydKtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { lydKtx = null; }
  }
  function stoy(varighet, styrke, lavpass) {
    if (!lydPaa || !lydKtx) return;
    var n = Math.floor(lydKtx.sampleRate * varighet), buf = lydKtx.createBuffer(1, n, lydKtx.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.2);
    var kilde = lydKtx.createBufferSource(); kilde.buffer = buf;
    var filter = lydKtx.createBiquadFilter(); filter.type = "lowpass"; filter.frequency.value = lavpass;
    var gain = lydKtx.createGain(); gain.gain.value = styrke;
    kilde.connect(filter); filter.connect(gain); gain.connect(lydKtx.destination); kilde.start();
  }
  function tone(frekvens, varighet, styrke, forsinkelse) {
    if (!lydPaa || !lydKtx) return;
    var o = lydKtx.createOscillator(), g = lydKtx.createGain(), t0 = lydKtx.currentTime + (forsinkelse || 0);
    o.type = "triangle"; o.frequency.value = frekvens;
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(styrke, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t0 + varighet);
    o.connect(g); g.connect(lydKtx.destination); o.start(t0); o.stop(t0 + varighet + 0.05);
  }

  /* ---------- Spilltilstand ---------- */
  var lopere = [], spiller = null;
  var tilstand = "meny"; // meny | plass | klar | lop | mal
  var nivaa = "krets";
  var modus = "takt"; // takt: treff slagene. klassisk: trykk så fort du klarer.
  var frekv = 0; // klassisk: trykk i sekundet, glattet
  var klokke = 0, fasetid = 0, klarVent = 0, tjuv = 0;
  var sisteTrykk = -1, kraft = 0, rytmeTekstTid = 0;
  var nesteSlag = 0, nesteSide = "", forrigeSlag = -9, tikket = false, flyt = 0; // takten: ett slag per steg
  var spillernavn = "";
  var malTid = 0, resultatVist = false;
  var smal = false; // stående skjerm: kameraet følger bak løperen
  var kamPos = new THREE.Vector3(8, 1.6, 7), kamSe = new THREE.Vector3(0, 1, 0), kamFov = 32;
  var REKORD = "gfik-sprint-rekord", NAVN = "gfik-sprint-navn", VALG = "gfik-sprint-valg";

  function hentRekord() { try { return JSON.parse(localStorage.getItem(REKORD) || "{}") || {}; } catch (e) { return {}; } }
  function lagreRekord(r) { try { localStorage.setItem(REKORD, JSON.stringify(r)); } catch (e) { /* privat modus */ } }
  // Rekordene i takt ligger under nivånavnet, slik de gjorde før klassisk kom til
  function rekordnokkel() { return modus === "klassisk" ? "k-" + nivaa : nivaa; }
  function rekordnavn() { return NIVAA[nivaa].navn.toLowerCase() + (modus === "klassisk" ? " (klassisk)" : ""); }

  function idealTid(v) { return 0.36 - 0.1 * klem(v / 11, 0, 1); } // sekunder mellom slagene: roligst i starten

  function stillOpp() {
    var faktor = NIVAA[nivaa].faktor, personer = !!NIVAA[nivaa].personer, krets = !!NIVAA[nivaa].krets;
    var klubb = 0;
    lopere.forEach(function (l) {
      var navn = l.spiller ? (personer ? (spillernavn || "Du") : l.klubb) : (personer ? l.person : krets ? l.kretsklubb : l.klubb);
      if (navn !== l.navn) { l.navn = navn; tegnSkilt(l); }
      l.x = STARTX; l.v = 0; l.fase = 0; l.malfase = 0; l.sett = 1; l.klar = 0; l.andel = 0; l.jubel = 0; l.reist = 0;
      l.ferdig = false; l.tid = null; l.reaksjon = null; l.startet = false;
      l.skilt.material.opacity = 1;
      if (!l.spiller) {
        var k = KLUBBER[klubb++];
        var tid = k.tid * faktor * tilfeldig(0.985, 1.02);
        var tau = tilfeldig(1.15, 1.45), reak = tilfeldig(0.13, 0.24);
        l.ai = { tau: tau, reak: reak, vmaks: (MAL - STARTX) / (tid - reak - tau * 0.93), slit: tilfeldig(0.01, 0.045), puls: tilfeldig(0, 6) };
      }
      pose(l);
    });
    klokke = 0; kraft = 0; frekv = 0; sisteTrykk = -1; nesteSide = ""; nesteSlag = 0; forrigeSlag = -9; tikket = false; flyt = 0;
    resultatVist = false; malTid = 0;
    el.tid.textContent = "0,00"; el.fart.textContent = "0"; el.plass.textContent = "–";
    tegnStartliste();
    tegnKlokke("0,0");
    tegnStripe();
    tegnRytme();
  }

  function startSekvens() {
    lydStart();
    stillOpp();
    tilstand = "plass"; fasetid = 0; tjuv = 0;
    klarVent = tilfeldig(1.3, 2.4);
    el.start.hidden = true; el.resultat.hidden = true; el.hud.hidden = false; el.taster.hidden = false;
    signal("Innta plassene");
    melding("");
    if (el.startliste) el.startliste.hidden = false;
    rot.classList.add("er-i-gang");
    el.lerret.focus({ preventScroll: true });
  }

  function signal(tekst, klasse) {
    el.signal.textContent = tekst;
    el.signal.className = "spill__signal" + (klasse ? " " + klasse : "");
    el.signal.hidden = !tekst;
  }
  function melding(tekst) { el.melding.textContent = tekst; rytmeTekstTid = tekst ? 0.7 : 0; }

  function skudd() {
    tilstand = "lop"; klokke = 0;
    if (el.startliste) el.startliste.hidden = true;
    signal("Løp!", "er-skudd");
    stoy(0.28, 0.9, 2600); tone(90, 0.25, 0.5);
    window.setTimeout(function () { if (tilstand === "lop") signal(""); }, 700);
  }

  function tjuvstart() {
    tjuv = 1.6; tilstand = "plass"; fasetid = -1.6; klarVent = tilfeldig(1.3, 2.4);
    signal("Tjuvstart! Vent på skuddet", "er-feil");
    tone(220, 0.18, 0.4); tone(180, 0.3, 0.4, 0.18);
    lopere.forEach(function (l) { l.klar = 0; });
  }

  function trykk(side) {
    if (tilstand === "meny" || tilstand === "mal") return;
    if (tilstand === "plass" || tilstand === "klar") { if (tjuv <= 0 && fasetid > 0.25) tjuvstart(); return; }
    if (spiller.ferdig) return;
    var na = klokke, annen = side === "v" ? "h" : "v";
    if (!spiller.startet) { // første steg ut av blokka setter takten i gang
      spiller.startet = true; spiller.reaksjon = na;
      kraft = 0.7; sisteTrykk = na; spiller.malfase += Math.PI;
      nesteSlag = na + idealTid(0); nesteSide = annen; tikket = false;
      frekv = 5;
      stoy(0.03, 0.12, 1800);
      blink(side, 1);
      return;
    }
    if (modus === "klassisk") { // farten følger hvor fort det trykkes
      if (side !== nesteSide) { // samme knapp to ganger teller ikke
        frekv *= 0.85;
        blink(side, 0);
        melding("Annenhver gang!");
        return;
      }
      frekv += (Math.min(1 / Math.max(na - sisteTrykk, 0.04), 16) - frekv) * 0.3;
      sisteTrykk = na; nesteSide = annen;
      var styrke = frekv / NIVAA[nivaa].mos;
      stoy(0.03, 0.1, 1500 + 900 * klem(styrke, 0, 1));
      blink(side, 1);
      melding(styrke >= 1 ? "Toppfart!" : styrke > 0.82 ? "Bra fart" : "Fortere!");
      return;
    }
    if (side !== nesteSide) { // samme bein to ganger: ute av takt
      kraft *= NIVAA[nivaa].feil || 0.7; spiller.v *= 0.95; flyt = 0;
      blink(side, 0);
      melding("Annenhver gang!");
      return;
    }
    // Trykket måles mot slaget som kommer. Kom det rett etter at et slag glapp, regnes det som for sent.
    var ideal = idealTid(spiller.v);
    var avvik = na - nesteSlag, sen = false;
    if (avvik < 0 && na - forrigeSlag < ideal * 0.8) { avvik = na - forrigeSlag; sen = true; }
    var rel = avvik / NIVAA[nivaa].slakk; // hvor mye slingring nivået tåler
    var kval = Math.max(NIVAA[nivaa].gulv, Math.exp(-rel * rel));
    if (!sen && avvik < -ideal * 0.5) kval = 0.25;
    if (!sen) { kraft += (kval - kraft) * 0.6; nesteSlag += ideal; } // et for sent trykk er alt trukket for
    flyt = kval > 0.6 ? flyt + 1 : 0;
    sisteTrykk = na;
    spiller.malfase += Math.PI;
    if (nesteSlag > na + ideal * 1.6 || nesteSlag < na + ideal * 0.35) nesteSlag = na + ideal;
    nesteSide = annen; forrigeSlag = -9; tikket = false;
    stoy(0.03, 0.1, 1500 + 900 * kval);
    blink(side, kval);
    melding((kval > 0.86 ? "Perfekt" : kval > 0.6 ? "Bra" : avvik < 0 ? "For tidlig" : "For sent") + (flyt >= 4 ? " ×" + flyt : ""));
  }

  // Kort blink på knappen: grønn for treff, rød for bom
  function blink(side, kval) {
    var k = side === "v" ? el.tastV : el.tastH;
    if (!k) return;
    k.classList.remove("er-traff", "er-bom");
    void k.offsetWidth; // starter animasjonen på nytt
    k.classList.add(kval > 0.6 ? "er-traff" : "er-bom");
  }

  // Ringen krymper inn mot knappen og treffer kanten akkurat på slaget
  function tegnRytme() {
    var iLop = tilstand === "lop" && !spiller.ferdig;
    var neste = !iLop ? "" : !spiller.startet ? "vh" : nesteSide;
    var ideal = idealTid(spiller.v), takt = modus === "takt";
    var t = iLop && spiller.startet ? 1 - (nesteSlag - klokke) / ideal : 1;
    [["v", el.tastV], ["h", el.tastH]].forEach(function (par) {
      var k = par[1];
      if (!k) return;
      var er = neste.indexOf(par[0]) >= 0, ring = k.firstElementChild;
      k.classList.toggle("er-neste", er);
      k.classList.toggle("er-naa", takt && er && spiller.startet && Math.abs(nesteSlag - klokke) < NIVAA[nivaa].slakk * 0.7);
      if (!ring) return;
      ring.style.opacity = er && takt ? klem(0.2 + t * 0.8, 0, 1).toFixed(2) : "0"; // klassisk har ingen ring
      ring.style.transform = "scale(" + klem(1.75 - 0.75 * t, 0.8, 1.75).toFixed(3) + ")";
    });
  }

  function tegnStartliste() {
    if (!el.startliste) return;
    while (el.startliste.firstChild) el.startliste.removeChild(el.startliste.firstChild);
    lopere.forEach(function (l) {
      var li = document.createElement("li");
      if (l.spiller) li.className = "er-spiller";
      var nr = document.createElement("span"); nr.className = "spill__nr"; nr.textContent = String(l.nr + 1);
      var prikk = document.createElement("span"); prikk.className = "spill__drakt";
      prikk.style.backgroundColor = "#" + ("000000" + l.farge.toString(16)).slice(-6);
      var navn = document.createElement("span"); navn.textContent = l.navn;
      li.appendChild(nr); li.appendChild(prikk); li.appendChild(navn);
      el.startliste.appendChild(li);
    });
  }

  function plassering() {
    var foran = 0;
    lopere.forEach(function (l) { if (l !== spiller && (l.ferdig && (!spiller.ferdig || l.tid < spiller.tid) || (!l.ferdig && !spiller.ferdig && l.x > spiller.x))) foran++; });
    return foran + 1;
  }

  function tegnStripe() {
    if (!el.stripe.children.length) {
      lopere.forEach(function (l) {
        var p = document.createElement("span");
        p.className = "spill__prikk" + (l.spiller ? " er-spiller" : "");
        p.style.backgroundColor = "#" + ("000000" + l.farge.toString(16)).slice(-6);
        el.stripe.appendChild(p);
      });
    }
    lopere.forEach(function (l, i) { el.stripe.children[i].style.left = klem(l.x / MAL, 0, 1) * 100 + "%"; });
  }

  function visResultat() {
    resultatVist = true;
    // Motstandere som ikke har rukket i mål når lista vises, får tiden de ligger an til
    function slutt(l) { return l.tid !== null ? l.tid : (l.spiller || l.v < 1 ? null : klokke + (MAL - l.x) / l.v); }
    var liste = lopere.slice().sort(function (a, b) { var ta = slutt(a), tb = slutt(b); return (ta === null ? 99 : ta) - (tb === null ? 99 : tb); });
    while (el.liste.firstChild) el.liste.removeChild(el.liste.firstChild);
    liste.forEach(function (l, i) {
      var li = document.createElement("li");
      if (l.spiller) li.className = "er-spiller";
      var nr = document.createElement("span"); nr.className = "spill__nr"; nr.textContent = (i + 1) + ".";
      var navn = document.createElement("span"); navn.className = "spill__navn"; navn.textContent = l.navn;
      var tid = document.createElement("span"); tid.className = "spill__ltid"; tid.textContent = slutt(l) === null ? "ikke i mål" : tidTekst(slutt(l));
      li.appendChild(nr); li.appendChild(navn); li.appendChild(tid);
      el.liste.appendChild(li);
    });
    var plass = liste.indexOf(spiller) + 1;
    var nokkel = rekordnokkel(), forsok = !!NIVAA[nivaa].forsok;
    var rekorder = hentRekord(), gammel = rekorder[nokkel], ny = spiller.tid !== null && (!gammel || spiller.tid < gammel);
    if (ny) { rekorder[nokkel] = Math.round(spiller.tid * 100) / 100; lagreRekord(rekorder); }
    var videre = forsok && spiller.tid !== null && plass <= 4; // de fire første i forsøket går videre
    el.resultatTittel.textContent = spiller.tid === null ? "Tiden gikk ut"
      : forsok ? (videre ? "Du er videre!" : plass + ". plass")
      : plass === 1 ? (NIVAA[nivaa].personer ? "Du vant klubbstevnet!" : "Seier til Gausdal!") : plass + ". plass";
    var tekst = spiller.tid === null ? "Du kom ikke i mål innen tiden."
      : "Tiden din ble " + tidTekst(spiller.tid) + ", med reaksjonstid " + tidTekst(spiller.reaksjon || 0) + "." + (ny ? " Det er ny personlig rekord i " + rekordnavn() + "." : gammel ? " Rekorden din er " + tidTekst(gammel) + "." : "");
    if (forsok && spiller.tid !== null) tekst += videre ? " Du er klar for klubbstevnet." : " De fire første går videre. Prøv en gang til.";
    el.resultatTekst.textContent = tekst;
    // Etter et godkjent forsøk er klubbstevnet neste steg
    if (el.videre) el.videre.hidden = !videre;
    if (el.bytt) el.bytt.hidden = videre;
    el.igjen.classList.toggle("knapp--rod", !videre); el.igjen.classList.toggle("knapp--stille", videre);
    el.resultat.hidden = false; el.taster.hidden = true; el.hud.hidden = true;
    rot.classList.remove("er-i-gang");
    visRekord();
    if ((plass === 1 || videre) && spiller.tid !== null) { tone(523, 0.18, 0.3); tone(659, 0.18, 0.3, 0.16); tone(784, 0.4, 0.3, 0.32); }
    window.setTimeout(function () { if (!el.resultat.hidden) (videre && el.videre ? el.videre : el.igjen).focus({ preventScroll: true }); }, 60);
  }

  function visRekord() {
    if (!el.rekord) return;
    var r = hentRekord()[rekordnokkel()];
    el.rekord.textContent = r ? "Din rekord i " + rekordnavn() + ": " + tidTekst(r) : "";
    el.rekord.hidden = !r;
  }

  /* ---------- Oppdatering ---------- */
  function oppdaterLop(dt) {
    klokke += dt;
    // Spilleren: kraften fra rytmen bestemmer toppfarten
    if (spiller.startet && !spiller.ferdig) {
      var takt = idealTid(spiller.v);
      if (modus === "klassisk") {
        // Stopper trykkingen, faller frekvensen med en gang. Beina går i takt med farten, ikke med hvert trykk.
        var stille = klokke - sisteTrykk;
        if (stille * frekv > 1.25) frekv = Math.min(frekv, 1.25 / stille);
        kraft = Math.min(1.03, Math.pow(frekv / NIVAA[nivaa].mos, 0.85));
        spiller.malfase += dt * Math.PI / takt * klem(spiller.v / 2, 0.25, 1);
      } else {
        // Takten går videre selv om et slag glipper. Da faller kraften, og samme bein får neste slag.
        if (!tikket && klokke >= nesteSlag) { tikket = true; tone(1500, 0.04, 0.05); }
        if (klokke > nesteSlag + takt * 0.5) {
          kraft *= NIVAA[nivaa].bom || 0.84; flyt = 0;
          forrigeSlag = nesteSlag; nesteSlag += takt; tikket = false;
          melding("Bom");
        }
        if (klokke - sisteTrykk > 0.45) spiller.malfase += dt * spiller.v * 0.7;
      }
      var slit = spiller.x > 65 ? 1 - 0.05 * Math.pow((spiller.x - 65) / 35, 2) * (1.3 - kraft) : 1;
      var mal = TOPPFART * kraft * slit;
      spiller.v += (mal - spiller.v) * dt / 1.22;
    } else if (spiller.ferdig) {
      spiller.v = Math.max(1.4, spiller.v - dt * 3.2);
      spiller.malfase += dt * (2 + spiller.v * 1.1);
    }
    spiller.x += spiller.v * dt;
    spiller.fase += (spiller.malfase - spiller.fase) * Math.min(1, dt * 16);
    spiller.andel = klem(spiller.v / 10.5, 0, 1);
    if (spiller.startet) spiller.sett = Math.max(0, spiller.sett - dt / 0.42);

    lopere.forEach(function (l) {
      if (l.spiller) return;
      var a = l.ai, t = klokke - a.reak;
      if (t > 0) {
        if (!l.startet) { l.startet = true; l.reaksjon = a.reak; }
        if (!l.ferdig) {
          var slitA = l.x > 60 ? 1 - a.slit * Math.pow((l.x - 60) / 40, 2) : 1;
          var malA = a.vmaks * slitA * (1 + 0.012 * Math.sin(klokke * 2.1 + a.puls));
          l.v += (malA - l.v) * dt / a.tau;
        } else {
          l.v = Math.max(1.4, l.v - dt * 3.2);
        }
        l.x += l.v * dt;
        l.fase += dt * Math.PI / idealTid(l.v);
        l.sett = Math.max(0, l.sett - dt / 0.42);
      }
      l.andel = klem(l.v / 10.5, 0, 1);
    });

    lopere.forEach(function (l) {
      if (!l.ferdig && l.x >= MAL) {
        l.ferdig = true;
        l.tid = klokke - (l.x - MAL) / Math.max(l.v, 0.1);
        if (l.spiller) { malTid = 0; tone(880, 0.12, 0.25); }
      }
      if (l.ferdig) l.reist = Math.min(1, l.reist + dt * 2.2);
      l.skilt.material.opacity = Math.max(l.spiller ? 0.85 : 0, l.skilt.material.opacity - dt * 1.4);
      pose(l);
    });

    if (!spiller.ferdig) {
      el.tid.textContent = tidTekst(klokke);
      el.fart.textContent = String(Math.round(spiller.v * 3.6));
      el.plass.textContent = plassering() + ". plass";
    } else {
      el.tid.textContent = tidTekst(spiller.tid);
      el.plass.textContent = plassering() + ". plass";
    }
    tegnStripe();
    var beste = null;
    lopere.forEach(function (l) { if (l.tid !== null && (beste === null || l.tid < beste)) beste = l.tid; });
    tegnKlokke(beste !== null ? tidTekst(beste) : klokke.toFixed(1).replace(".", ","));

    if (rytmeTekstTid > 0) { rytmeTekstTid -= dt; if (rytmeTekstTid <= 0) el.melding.textContent = ""; }

    if (spiller.ferdig) {
      malTid += dt;
      if (plassering() === 1) spiller.jubel = Math.min(1, spiller.jubel + dt * 2.2);
      var alle = lopere.every(function (l) { return l.ferdig; });
      if (!resultatVist && (malTid > 4.2 || (alle && malTid > 1.8))) { tilstand = "mal"; visResultat(); }
    } else if (klokke > 28 && !resultatVist) {
      tilstand = "mal"; visResultat();
    }
  }

  function oppdater(dt) {
    if (tilstand === "plass" || tilstand === "klar") {
      fasetid += dt;
      if (tjuv > 0) { tjuv -= dt; if (tjuv <= 0) signal("Innta plassene"); }
      if (tilstand === "plass" && fasetid > 1.5) { tilstand = "klar"; fasetid = 0.26; signal("Klar"); tone(660, 0.12, 0.2); }
      if (tilstand === "klar") {
        lopere.forEach(function (l) { l.klar = Math.min(1, l.klar + dt * 3.2); pose(l); });
        if (fasetid > klarVent) skudd();
      } else {
        lopere.forEach(function (l) { l.klar = Math.max(0, l.klar - dt * 3); pose(l); });
      }
    } else if (tilstand === "lop") {
      oppdaterLop(dt);
    } else if (tilstand === "mal") {
      klokke += dt;
      lopere.forEach(function (l) {
        l.v = Math.max(0, l.v - dt * 2.4);
        l.x += l.v * dt;
        l.fase += dt * (1.2 + l.v * 1.1);
        l.andel = klem(l.v / 10.5, 0, 1);
        if (l.spiller && plassering() === 1) l.jubel = Math.min(1, l.jubel + dt * 2.2);
        pose(l);
      });
    }
    tegnRytme();
    oppdaterKamera(dt);
  }

  /* ---------- Kamera ---------- */
  var onskPos = new THREE.Vector3(), onskSe = new THREE.Vector3();
  function oppdaterKamera(dt) {
    var px = spiller.x, pz = spiller.z, fov;
    if (tilstand === "meny") {
      var t = performance.now() / 1000;
      if (smal) { onskPos.set(-10.5 + Math.sin(t * 0.25) * 0.6, 5.0, pz + 2.2); onskSe.set(8, 0.2, pz - 0.2); fov = 58; }
      else { onskPos.set(8.6 + Math.sin(t * 0.22) * 1.0, 1.5, 9.2); onskSe.set(0.9, 1.25, -2.0); fov = 36; }
    } else if (tilstand === "plass" || tilstand === "klar") {
      if (smal) { onskPos.set(-10.2, 4.8, pz + 1.4); onskSe.set(9, -0.5, pz - 0.1); fov = 58; }
      else { onskPos.set(6.2, 1.35, 8.2); onskSe.set(-0.4, 0.85, -0.6); fov = 33; }
    } else if (tilstand === "lop" && !spiller.ferdig) {
      var fartsandel = klem(spiller.v / 11, 0, 1);
      if (smal) {
        onskPos.set(px - 9.4, 4.6 + fartsandel * 0.3, pz + 1.2); onskSe.set(px + 12, -0.6, pz - 0.1); fov = 58 + fartsandel * 6;
      } else {
        var avstand = kamera.aspect < 1.5 ? 15.5 : 12.6;
        onskPos.set(px + 2.6, 2.3, avstand); onskSe.set(px + 1.4, 1.15, -0.8); fov = 31 + fartsandel * 4;
      }
    } else {
      if (smal) { onskPos.set(px + 5.5, 2.0, pz + 4.2); onskSe.set(px - 0.5, 1.15, pz); fov = 50; }
      else { onskPos.set(px + 7.0, 1.55, pz + 7.2); onskSe.set(px + 1.9, 1.2, pz - 3.0); fov = 34; }
    }
    var k = tilstand === "lop" ? 1 - Math.exp(-dt * 6) : 1 - Math.exp(-dt * 2.4);
    kamPos.lerp(onskPos, k); kamSe.lerp(onskSe, k);
    kamFov += (fov - kamFov) * (1 - Math.exp(-dt * 3));
    kamera.position.copy(kamPos);
    if (!rolig && tilstand === "lop" && !spiller.ferdig) kamera.position.y += Math.sin(spiller.fase) * 0.012 * spiller.andel;
    kamera.lookAt(kamSe);
    if (Math.abs(kamera.fov - kamFov) > 0.01) { kamera.fov = kamFov; kamera.updateProjectionMatrix(); }
    sol.position.set(px - 14, 34, 22); sol.target.position.set(px + 4, 0, 0); sol.target.updateMatrixWorld();
  }

  /* ---------- Størrelse og løkke ---------- */
  function tilpass() {
    var b = rot.clientWidth, h = rot.clientHeight;
    if (!b || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(b, h, false);
    kamera.aspect = b / h; kamera.updateProjectionMatrix();
    smal = kamera.aspect < 1.05;
    lopere.forEach(function (l) { l.skilt.scale.set(smal ? 1.16 : 1.9, smal ? 0.256 : 0.42, 1); l.skilt.position.y = smal ? 2.08 : 2.25; });
  }

  var forrige = 0, aktiv = true;
  function ramme(na) {
    window.requestAnimationFrame(ramme);
    if (!aktiv) { forrige = na; return; }
    var dt = Math.min(0.05, (na - forrige) / 1000 || 0.016);
    forrige = na;
    oppdater(dt);
    if (!rolig && publikum.length) {
      var liv = tilstand === "lop" || tilstand === "mal" ? 1 : 0.2;
      publikum[0].position.y = Math.abs(Math.sin(na / 1000 * 5.5)) * 0.07 * liv;
      publikum[1].position.y = Math.abs(Math.sin(na / 1000 * 5.5 + 1.3)) * 0.07 * liv;
    }
    renderer.render(scene, kamera);
  }

  /* ---------- Oppstart ---------- */
  byggVerden();
  var klubbNr = 0;
  for (var i = 0; i < BANER; i++) {
    if (i === SPILLERBANE) {
      spiller = lagLoper(i, { drakt: 0xd8232a, shorts: 0x1c1413 }, true);
      spiller.klubb = "Gausdal FIK";
      lopere.push(spiller);
    } else {
      var k = KLUBBER[klubbNr++], motstander = lagLoper(i, k, false);
      motstander.klubb = k.navn; motstander.kretsklubb = k.krets; motstander.person = k.person;
      lopere.push(motstander);
    }
  }
  try { spillernavn = (localStorage.getItem(NAVN) || "").slice(0, 16); } catch (e) { spillernavn = ""; }
  if (el.navn) el.navn.value = spillernavn;

  function visNivaa() {
    if (el.nivaatekst) el.nivaatekst.textContent = modus === "klassisk" ? NIVAA[nivaa].tekstK : NIVAA[nivaa].tekst;
    if (el.modustekst) el.modustekst.textContent = MODUS[modus];
    if (el.navnfelt) el.navnfelt.hidden = !NIVAA[nivaa].personer;
    visRekord();
    if (tilstand === "meny") stillOpp();
  }
  function merk(attributt, verdi) {
    Array.prototype.forEach.call(rot.querySelectorAll("[" + attributt + "]"), function (b) { b.setAttribute("aria-pressed", b.getAttribute(attributt) === verdi ? "true" : "false"); });
  }
  // Valgene huskes til neste besøk
  function velg(nyModus, nyttNivaa) {
    if (nyModus && MODUS[nyModus]) modus = nyModus;
    if (nyttNivaa && NIVAA[nyttNivaa]) nivaa = nyttNivaa;
    merk("data-spill-modus", modus); merk("data-spill-nivaa", nivaa);
    try { localStorage.setItem(VALG, JSON.stringify({ modus: modus, nivaa: nivaa })); } catch (e) { /* privat modus */ }
    visNivaa();
  }
  // Nye spillere begynner i forsøket. De som har rekorder fra før, begynner der de pleide.
  (function () {
    var lagret = null, harRekord = false, r = hentRekord();
    try { lagret = JSON.parse(localStorage.getItem(VALG) || "null"); } catch (e) { lagret = null; }
    for (var n in r) if (Object.prototype.hasOwnProperty.call(r, n)) harRekord = true;
    if (lagret && MODUS[lagret.modus] && NIVAA[lagret.nivaa]) { modus = lagret.modus; nivaa = lagret.nivaa; }
    else nivaa = harRekord ? "krets" : "forsok";
    merk("data-spill-modus", modus); merk("data-spill-nivaa", nivaa);
  })();
  stillOpp();
  tilpass();
  visNivaa();
  if (window.ResizeObserver) new ResizeObserver(tilpass).observe(rot); else window.addEventListener("resize", tilpass);
  document.addEventListener("visibilitychange", function () { aktiv = !document.hidden; });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { lopere.forEach(tegnSkilt); var kt = klokketekst; klokketekst = ""; tegnKlokke(kt || "0,0"); });

  // Nivåvalg
  Array.prototype.forEach.call(rot.querySelectorAll("[data-spill-nivaa]"), function (knapp) {
    knapp.addEventListener("click", function () { velg("", knapp.getAttribute("data-spill-nivaa")); });
  });
  Array.prototype.forEach.call(rot.querySelectorAll("[data-spill-modus]"), function (knapp) {
    knapp.addEventListener("click", function () { velg(knapp.getAttribute("data-spill-modus"), ""); });
  });
  if (el.navn) {
    el.navn.addEventListener("input", function () {
      spillernavn = el.navn.value.replace(/\s+/g, " ").trim().slice(0, 16);
      try { localStorage.setItem(NAVN, spillernavn); } catch (e) { /* privat modus */ }
      if (tilstand === "meny") stillOpp();
    });
    el.navn.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); startSekvens(); } });
  }
  el.startknapp.addEventListener("click", startSekvens);
  el.igjen.addEventListener("click", startSekvens);
  if (el.videre) el.videre.addEventListener("click", function () { velg("", "klubb"); startSekvens(); });
  if (el.bytt) el.bytt.addEventListener("click", function () {
    el.resultat.hidden = true; el.hud.hidden = true; el.start.hidden = false; if (el.startliste) el.startliste.hidden = true; tilstand = "meny"; stillOpp(); signal("");
    el.startknapp.focus({ preventScroll: true });
  });
  el.lyd.addEventListener("click", function () {
    lydPaa = !lydPaa; el.lyd.setAttribute("aria-pressed", lydPaa ? "true" : "false");
    el.lyd.textContent = lydPaa ? "Lyd på" : "Lyd av";
  });

  // Tastatur: piltaster eller A og D
  window.addEventListener("keydown", function (e) {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    var iGang = tilstand === "plass" || tilstand === "klar" || tilstand === "lop";
    var side = e.code === "ArrowLeft" || e.code === "KeyA" ? "v" : e.code === "ArrowRight" || e.code === "KeyD" ? "h" : "";
    if (side && iGang) { e.preventDefault(); trykk(side); }
    else if ((e.code === "Space" || e.code === "Enter") && iGang) e.preventDefault();
  });
  // Berøring og mus: knappene, eller venstre og høyre halvdel av banen
  Array.prototype.forEach.call(rot.querySelectorAll("[data-spill-tast]"), function (knapp) {
    knapp.addEventListener("pointerdown", function (e) { e.preventDefault(); trykk(knapp.getAttribute("data-spill-tast")); });
  });
  el.lerret.addEventListener("pointerdown", function (e) {
    if (tilstand !== "plass" && tilstand !== "klar" && tilstand !== "lop") return;
    var r = el.lerret.getBoundingClientRect();
    trykk(e.clientX - r.left < r.width / 2 ? "v" : "h");
  });

  // For testing: lar en automatisk løper trykke i en gitt takt
  window.GFIKSPILL = {
    tilstand: function () { return { tilstand: tilstand, modus: modus, nivaa: nivaa, klokke: klokke, x: spiller.x, v: spiller.v, kraft: kraft, frekv: frekv, tid: spiller.tid, plass: plassering() }; },
    trykk: trykk, start: startSekvens, velg: velg, ideal: function () { return idealTid(spiller.v); },
    slag: function () { return { tid: nesteSlag, side: nesteSide, startet: spiller.startet }; }
  };

  window.requestAnimationFrame(ramme);
})();
