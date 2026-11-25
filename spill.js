/* Gausdal Friidrettsklubb – Gausdalsprinten
   Et 100-meterløp i 3D. Spilleren løper for Gausdal FIK mot sju andre klubber.
   Styring: trykk venstre og høyre annenhver gang, i takt med stegene.
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
    rytme: finn("[data-spill-rytme]"),
    sone: finn("[data-spill-sone]"),
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
  var KLUBBER = [
    { navn: "Lillehammer IF", drakt: 0x1f5fbf, shorts: 0x10264d, tid: 10.75 },
    { navn: "Moelven IL", drakt: 0x1e9e5a, shorts: 0x0f3d26, tid: 11.25 },
    { navn: "IK Tjalve", drakt: 0xf2f2f2, shorts: 0x1a3c8c, tid: 10.6 },
    { navn: "IL Tyrving", drakt: 0x39a9e0, shorts: 0xffffff, tid: 10.9 },
    { navn: "Sandnes IL", drakt: 0xf2c230, shorts: 0x1b1b1b, tid: 11.05 },
    { navn: "Raufoss IL", drakt: 0xf07c1f, shorts: 0x23252b, tid: 11.5 },
    { navn: "IL Gular", drakt: 0x7a3fc4, shorts: 0xf2f2f2, tid: 11.8 }
  ];
  var NIVAA = {
    klubb: { navn: "Klubbstevne", faktor: 1.16, slakk: 0.14, gulv: 0.45 },
    krets: { navn: "Kretsmesterskap", faktor: 1.08, slakk: 0.105, gulv: 0.36 },
    nm: { navn: "NM", faktor: 1.0, slakk: 0.08, gulv: 0.3 }
  };
  var HUD = [0xf1c9a5, 0xd9a47a, 0x8d5a3b, 0xe6b98f, 0x6b4226, 0xf3d2b3, 0xc68c5e, 0xa66a43];
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

    // Publikum sitter i et rutenett, så ingen står oppi hverandre
    var klaer = [0xd8232a, 0xffffff, 0x1c1413, 0x2f6fb5, 0xf0c94b, 0x3e8f5a, 0x9aa0a6, 0xd8232a, 0xe9e2d6, 0xb0171e];
    var seter = [[], []];
    for (var rad = 0; rad < trinn; rad++) {
      for (var sx = midtX - 73; sx < midtX + 73; sx += 0.56) {
        if (Math.random() < 0.84) seter[Math.random() < 0.5 ? 0 : 1].push([sx + (Math.random() - 0.5) * 0.12, rad]);
      }
    }
    seter.forEach(function (liste) {
      var folk = new THREE.InstancedMesh(new THREE.BoxGeometry(0.38, 0.6, 0.3), new THREE.MeshLambertMaterial({ color: 0xffffff }), liste.length);
      var hoder = new THREE.InstancedMesh(new THREE.SphereGeometry(0.13, 7, 6), new THREE.MeshLambertMaterial({ color: 0xffffff }), liste.length);
      liste.forEach(function (sete, f) {
        var hoyde = 0.82 + Math.random() * 0.34, y0 = 0.55 + sete[1] * 0.55, z0 = start - sete[1] * 1.15 + (Math.random() - 0.5) * 0.3;
        dummy.position.set(sete[0], y0 + 0.3 * hoyde, z0);
        dummy.rotation.set(0, 0, 0); dummy.scale.set(1, hoyde, 1); dummy.updateMatrix();
        folk.setMatrixAt(f, dummy.matrix);
        folk.setColorAt(f, farge.setHex(klaer[Math.floor(Math.random() * klaer.length)]).convertSRGBToLinear());
        dummy.position.y = y0 + 0.6 * hoyde + 0.11; dummy.scale.set(1, 1, 1); dummy.updateMatrix();
        hoder.setMatrixAt(f, dummy.matrix);
        hoder.setColorAt(f, farge.setHex(HUD[Math.floor(Math.random() * HUD.length)]).convertSRGBToLinear());
      });
      var gruppe = new THREE.Group(); gruppe.add(folk); gruppe.add(hoder); scene.add(gruppe);
      publikum.push(gruppe);
    });

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

    // Åser og fjell i bakgrunnen
    var fjell = [
      [-60, -230, 150, 42, 0x7f9aa8], [40, -260, 210, 58, 0x6f8b9a], [150, -240, 170, 46, 0x86a0ad],
      [250, -280, 230, 70, 0x748f9d], [-170, -270, 200, 54, 0x8aa3af], [95, -190, 120, 26, 0x4f7d4c], [-10, -180, 130, 22, 0x5a8853], [200, -185, 140, 24, 0x53824f],
      [420, -120, 160, 40, 0x7f9aa8], [470, 40, 170, 52, 0x6f8b9a], [430, 190, 150, 36, 0x86a0ad], [330, -60, 90, 16, 0x53824f], [340, 90, 100, 18, 0x5a8853]
    ];
    fjell.forEach(function (f2) {
      var m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: lin(f2[4]), flatShading: true }));
      m.scale.set(f2[2], f2[3], f2[2] * 0.55); m.position.set(f2[0], -1, f2[1]); scene.add(m);
    });
    // Trær bak tribunen og ved enden av banen
    var tre = new THREE.InstancedMesh(new THREE.ConeGeometry(1.6, 6.5, 6), new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true }), 180);
    var gronn = [0x2f5d3a, 0x356b3f, 0x284f33];
    for (var q = 0; q < 180; q++) {
      var bak = q < 110;
      dummy.position.set(bak ? -60 + Math.random() * 260 : 150 + Math.random() * 80, 3.2, bak ? -34 - Math.random() * 40 : -45 + Math.random() * 90);
      var sk = 0.8 + Math.random() * 0.9; dummy.scale.set(sk, sk, sk); dummy.position.y = 3.2 * sk; dummy.updateMatrix();
      tre.setMatrixAt(q, dummy.matrix);
      tre.setColorAt(q, farge.setHex(gronn[q % 3]).convertSRGBToLinear());
    }
    scene.add(tre);
  }

  function baneZ(i) { return (i - (BANER - 1) / 2) * BANEBREDDE; }

  /* ---------- Løpere ---------- */
  function lagLoper(nr, farger, navn, erSpiller) {
    var hud = new THREE.MeshLambertMaterial({ color: lin(HUD[nr % HUD.length]) });
    var drakt = new THREE.MeshLambertMaterial({ color: lin(farger.drakt) });
    var shorts = new THREE.MeshLambertMaterial({ color: lin(farger.shorts) });
    var sko = new THREE.MeshLambertMaterial({ color: lin(erSpiller ? 0xffffff : 0x1d1f24) });
    var haar = new THREE.MeshLambertMaterial({ color: lin(HAAR[nr % HAAR.length]) });

    function del(geo, mat, forelder, x, y, z) {
      var m = new THREE.Mesh(geo, mat);
      m.position.set(x || 0, y || 0, z || 0);
      m.castShadow = true;
      forelder.add(m);
      return m;
    }
    function ledd(forelder, x, y, z) {
      var g = new THREE.Group(); g.position.set(x, y, z); forelder.add(g); return g;
    }
    function lem(forelder, lengde, r1, r2, mat) {
      return del(new THREE.CylinderGeometry(r1, r2, lengde, 10), mat, forelder, 0, -lengde / 2, 0);
    }

    var gruppe = new THREE.Group();
    var bekken = ledd(gruppe, 0, 0.95, 0);
    var hofte = del(new THREE.SphereGeometry(0.135, 12, 10), shorts, bekken, 0, 0, 0);
    hofte.scale.set(0.95, 0.82, 1.2);

    var overkropp = ledd(bekken, 0, 0.02, 0);
    var bryst = del(new THREE.CylinderGeometry(0.165, 0.125, OVERKROPP, 12), drakt, overkropp, 0, OVERKROPP / 2, 0);
    bryst.scale.set(0.8, 1, 1.28);
    del(new THREE.SphereGeometry(0.168, 12, 8), drakt, overkropp, 0, OVERKROPP, 0).scale.set(0.8, 0.5, 1.26);
    if (erSpiller) { // hvit stripe over brystet, som på klubbdrakta
      del(new THREE.CylinderGeometry(0.157, 0.15, 0.07, 12), new THREE.MeshLambertMaterial({ color: 0xffffff }), overkropp, 0, OVERKROPP * 0.72, 0).scale.set(0.82, 1, 1.3);
    }
    del(new THREE.CylinderGeometry(0.05, 0.055, 0.09, 8), hud, overkropp, 0.01, OVERKROPP + 0.09, 0);
    var hode = ledd(overkropp, 0.02, OVERKROPP + 0.23, 0);
    del(new THREE.SphereGeometry(0.115, 16, 12), hud, hode, 0, 0, 0).scale.set(1, 1.08, 0.94);
    var lugg = del(new THREE.SphereGeometry(0.121, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), haar, hode, -0.012, 0.012, 0);
    lugg.rotation.z = 0.35;

    function arm(side) {
      var skulder = ledd(overkropp, 0, OVERKROPP - 0.03, side * 0.215);
      del(new THREE.SphereGeometry(0.058, 8, 8), drakt, skulder, 0, 0, 0);
      lem(skulder, OVERARM, 0.052, 0.045, hud);
      var albue = ledd(skulder, 0, -OVERARM, 0);
      del(new THREE.SphereGeometry(0.045, 8, 8), hud, albue, 0, 0, 0);
      lem(albue, UNDERARM, 0.044, 0.035, hud);
      del(new THREE.SphereGeometry(0.042, 8, 6), hud, albue, 0, -UNDERARM - 0.03, 0).scale.set(1, 1.3, 0.7);
      return { skulder: skulder, albue: albue };
    }
    function bein(side) {
      var h = ledd(bekken, 0, -0.04, side * 0.095);
      lem(h, L1, 0.094, 0.064, hud);
      del(new THREE.CylinderGeometry(0.1, 0.09, 0.22, 10), shorts, h, 0, -0.11, 0);
      var kne = ledd(h, 0, -L1, 0);
      del(new THREE.SphereGeometry(0.064, 8, 8), hud, kne, 0, 0, 0);
      lem(kne, L2, 0.064, 0.04, hud);
      var fot = del(new THREE.BoxGeometry(0.27, 0.08, 0.1), sko, kne, 0.075, -L2 - 0.02, 0);
      fot.rotation.z = -0.12;
      return { hofte: h, kne: kne };
    }
    var aV = arm(-1), aH = arm(1), bV = bein(-1), bH = bein(1);

    // Navneskilt over hodet
    var skilt = new THREE.Sprite(new THREE.SpriteMaterial({
      map: lerretTekstur(512, 112, function (g, w, h) {
        g.clearRect(0, 0, w, h);
        g.fillStyle = erSpiller ? "rgba(176,23,30,0.95)" : "rgba(28,20,19,0.82)";
        var b = Math.min(w - 8, 60 + navn.length * 27);
        var x = (w - b) / 2, r = 18;
        g.beginPath(); g.moveTo(x + r, 8); g.arcTo(x + b, 8, x + b, h - 8, r); g.arcTo(x + b, h - 8, x, h - 8, r); g.arcTo(x, h - 8, x, 8, r); g.arcTo(x, 8, x + b, 8, r); g.fill();
        g.fillStyle = "#fff"; g.font = "700 58px 'Barlow Condensed', 'Arial Narrow', sans-serif";
        g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(navn.toUpperCase(), w / 2, h / 2 + 4);
      }), transparent: true, depthTest: false
    }));
    skilt.scale.set(1.9, 0.42, 1); skilt.position.set(0, 2.25, 0); skilt.renderOrder = 5;
    gruppe.add(skilt);
    scene.add(gruppe);

    return {
      nr: nr, navn: navn, spiller: !!erSpiller, farge: farger.drakt, gruppe: gruppe, bekken: bekken, overkropp: overkropp, hode: hode,
      aV: aV, aH: aH, bV: bV, bH: bH, skilt: skilt,
      x: STARTX, z: baneZ(nr), v: 0, fase: 0, malfase: 0, sett: 1, klar: 0, andel: 0, jubel: 0,
      ferdig: false, tid: null, reaksjon: null, startet: false
    };
  }

  // Setter alle ledd ut fra løperens tilstand. «sett» er 1 i startblokka og 0 i fullt løp.
  function pose(l) {
    var f = l.fase;
    var amp = 0.22 + 0.78 * l.andel;
    var thV = 0.1 + amp * (0.24 + 0.98 * Math.sin(f)), thH = 0.1 + amp * (0.24 + 0.98 * Math.sin(f + Math.PI));
    var knV = 0.14 + 2.15 * amp * Math.pow(Math.max(0, Math.cos(f - 0.35)), 1.15);
    var knH = 0.14 + 2.15 * amp * Math.pow(Math.max(0, Math.cos(f + Math.PI - 0.35)), 1.15);
    var skV = -1.05 * amp * Math.sin(f) + 0.05, skH = -1.05 * amp * Math.sin(f + Math.PI) + 0.05;
    var alV = 1.5 + 0.35 * amp * Math.max(0, -Math.sin(f)), alH = 1.5 + 0.35 * amp * Math.max(0, Math.sin(f));
    var lut = lerp(1.0, 0.2, myk(l.andel * 1.05));
    var hodeV = lerp(0.4, 0.05, myk(l.andel * 1.05));
    var vri = 0.16 * amp * Math.sin(f) * (1 - myk(l.sett));

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
      skV = lerp(skV, lutS, s); skH = lerp(skH, lutS, s);
      alV = lerp(alV, 0.06, s); alH = lerp(alH, 0.06, s);
      lut = lerp(lut, lutS, s); hodeV = lerp(hodeV, lerp(-0.2, -0.5, k), s);
    }

    l.bV.hofte.rotation.z = thV; l.bH.hofte.rotation.z = thH;
    l.bV.kne.rotation.z = -knV; l.bH.kne.rotation.z = -knH;
    l.aV.skulder.rotation.z = skV; l.aH.skulder.rotation.z = skH;
    l.aV.albue.rotation.z = alV; l.aH.albue.rotation.z = alH;
    l.overkropp.rotation.z = -lut;
    l.overkropp.rotation.y = l.jubel > 0 ? 0 : vri;
    l.hode.rotation.z = lut * 0.55 + hodeV * 0.4;

    // Hoftehøyden følger det beinet som rekker lengst ned, så en fot alltid er nær bakken
    var rekkV = L1 * Math.cos(thV) + L2 * Math.cos(thV - knV), rekkH = L1 * Math.cos(thH) + L2 * Math.cos(thH - knH);
    var svev = (1 - myk(l.sett)) * 0.05 * l.andel * Math.abs(Math.sin(f * 1.0 + 0.6));
    l.bekken.position.y = Math.max(rekkV, rekkH) + 0.09 + svev;
    l.gruppe.position.set(l.x, 0, l.z);
    l.skilt.visible = l.spiller || smal;
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
  var klokke = 0, fasetid = 0, klarVent = 0, tjuv = 0;
  var sisteTrykk = -1, sisteSide = "", kraft = 0, rytmeTekstTid = 0;
  var malTid = 0, resultatVist = false;
  var smal = false; // stående skjerm: kameraet følger bak løperen
  var kamPos = new THREE.Vector3(8, 1.6, 7), kamSe = new THREE.Vector3(0, 1, 0), kamFov = 32;
  var REKORD = "gfik-sprint-rekord";

  function hentRekord() { try { return JSON.parse(localStorage.getItem(REKORD) || "{}") || {}; } catch (e) { return {}; } }
  function lagreRekord(r) { try { localStorage.setItem(REKORD, JSON.stringify(r)); } catch (e) { /* privat modus */ } }

  function idealTid(v) { return 0.31 - 0.095 * klem(v / 11, 0, 1); } // sekunder mellom stegene

  function stillOpp() {
    var faktor = NIVAA[nivaa].faktor;
    var klubb = 0;
    lopere.forEach(function (l) {
      l.x = STARTX; l.v = 0; l.fase = 0; l.malfase = 0; l.sett = 1; l.klar = 0; l.andel = 0; l.jubel = 0;
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
    klokke = 0; kraft = 0; sisteTrykk = -1; sisteSide = ""; resultatVist = false; malTid = 0;
    el.tid.textContent = "0,00"; el.fart.textContent = "0"; el.plass.textContent = "–";
    el.rytme.style.left = "0%";
    tegnStripe();
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
    var na = klokke;
    if (!spiller.startet) {
      spiller.startet = true; spiller.reaksjon = na;
      kraft = 0.7; sisteTrykk = na; sisteSide = side; spiller.malfase += Math.PI;
      stoy(0.03, 0.12, 1800);
      return;
    }
    if (side === sisteSide) { // samme bein to ganger: ute av rytme
      kraft *= 0.62; spiller.v *= 0.94;
      melding("Annenhver gang!");
      return;
    }
    var dt = na - sisteTrykk, ideal = idealTid(spiller.v);
    var avvik = (dt - ideal) / NIVAA[nivaa].slakk; // hvor mye slingring nivået tåler
    var kval = Math.max(NIVAA[nivaa].gulv, Math.exp(-avvik * avvik));
    if (dt < ideal * 0.55) kval = 0.25;
    kraft += (kval - kraft) * 0.6;
    sisteTrykk = na; sisteSide = side;
    spiller.malfase += Math.PI;
    stoy(0.03, 0.1, 1500 + 900 * kval);
    melding(kval > 0.86 ? "Perfekt" : kval > 0.6 ? "Bra" : dt < ideal ? "For tidlig" : "For sent");
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
    var liste = lopere.slice().sort(function (a, b) { return (a.tid === null ? 99 : a.tid) - (b.tid === null ? 99 : b.tid); });
    while (el.liste.firstChild) el.liste.removeChild(el.liste.firstChild);
    liste.forEach(function (l, i) {
      var li = document.createElement("li");
      if (l.spiller) li.className = "er-spiller";
      var nr = document.createElement("span"); nr.className = "spill__nr"; nr.textContent = (i + 1) + ".";
      var navn = document.createElement("span"); navn.className = "spill__navn"; navn.textContent = l.navn;
      var tid = document.createElement("span"); tid.className = "spill__ltid"; tid.textContent = l.tid === null ? "ikke i mål" : tidTekst(l.tid);
      li.appendChild(nr); li.appendChild(navn); li.appendChild(tid);
      el.liste.appendChild(li);
    });
    var plass = liste.indexOf(spiller) + 1;
    var rekorder = hentRekord(), gammel = rekorder[nivaa], ny = spiller.tid !== null && (!gammel || spiller.tid < gammel);
    if (ny) { rekorder[nivaa] = Math.round(spiller.tid * 100) / 100; lagreRekord(rekorder); }
    el.resultatTittel.textContent = spiller.tid === null ? "Tiden gikk ut" : plass === 1 ? "Seier til Gausdal!" : plass + ". plass";
    var tekst = spiller.tid === null ? "Du kom ikke i mål innen tiden."
      : "Tiden din ble " + tidTekst(spiller.tid) + ", med reaksjonstid " + tidTekst(spiller.reaksjon || 0) + "." + (ny ? " Det er ny personlig rekord i " + NIVAA[nivaa].navn.toLowerCase() + "." : gammel ? " Rekorden din er " + tidTekst(gammel) + "." : "");
    el.resultatTekst.textContent = tekst;
    el.resultat.hidden = false; el.taster.hidden = true; el.hud.hidden = true;
    rot.classList.remove("er-i-gang");
    visRekord();
    if (plass === 1 && spiller.tid !== null) { tone(523, 0.18, 0.3); tone(659, 0.18, 0.3, 0.16); tone(784, 0.4, 0.3, 0.32); }
    window.setTimeout(function () { if (!el.resultat.hidden) el.igjen.focus({ preventScroll: true }); }, 60);
  }

  function visRekord() {
    if (!el.rekord) return;
    var r = hentRekord()[nivaa];
    el.rekord.textContent = r ? "Din rekord i " + NIVAA[nivaa].navn.toLowerCase() + ": " + tidTekst(r) : "";
    el.rekord.hidden = !r;
  }

  /* ---------- Oppdatering ---------- */
  function oppdaterLop(dt) {
    klokke += dt;
    // Spilleren: kraften fra rytmen bestemmer toppfarten
    if (spiller.startet && !spiller.ferdig) {
      // Kraften holder seg mellom stegene og faller først når neste steg uteblir
      if (klokke - sisteTrykk > idealTid(spiller.v) * 1.45) kraft *= Math.exp(-dt / 0.55);
      var slit = spiller.x > 65 ? 1 - 0.05 * Math.pow((spiller.x - 65) / 35, 2) * (1.3 - kraft) : 1;
      var mal = TOPPFART * kraft * slit;
      spiller.v += (mal - spiller.v) * dt / 1.22;
      if (klokke - sisteTrykk > 0.45) spiller.malfase += dt * spiller.v * 0.7;
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
        l.fase += dt * Math.PI * (2.0 + 2.7 * klem(l.v / 11, 0, 1));
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
      l.skilt.material.opacity = Math.max(l.spiller ? 0.85 : 0, l.skilt.material.opacity - dt * 1.4);
      pose(l);
    });

    if (!spiller.ferdig) {
      el.tid.textContent = tidTekst(klokke);
      el.fart.textContent = String(Math.round(spiller.v * 3.6));
      el.plass.textContent = plassering() + ". plass";
      var andel = sisteTrykk < 0 ? 0 : (klokke - sisteTrykk) / idealTid(spiller.v);
      el.rytme.style.left = klem(andel / 1.8, 0, 1) * 100 + "%";
      el.sone.style.left = (1 / 1.8) * 100 + "%";
    } else {
      el.tid.textContent = tidTekst(spiller.tid);
      el.plass.textContent = plassering() + ". plass";
    }
    tegnStripe();

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
      spiller = lagLoper(i, { drakt: 0xd8232a, shorts: 0x1c1413 }, "Gausdal FIK", true);
      lopere.push(spiller);
    } else {
      var k = KLUBBER[klubbNr++];
      lopere.push(lagLoper(i, k, k.navn, false));
    }
  }
  if (el.startliste) {
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
  stillOpp();
  tilpass();
  visRekord();
  if (window.ResizeObserver) new ResizeObserver(tilpass).observe(rot); else window.addEventListener("resize", tilpass);
  document.addEventListener("visibilitychange", function () { aktiv = !document.hidden; });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { /* skiltene bruker skriften når den er lastet */ });

  // Nivåvalg
  Array.prototype.forEach.call(rot.querySelectorAll("[data-spill-nivaa]"), function (knapp) {
    knapp.addEventListener("click", function () {
      nivaa = knapp.getAttribute("data-spill-nivaa");
      Array.prototype.forEach.call(rot.querySelectorAll("[data-spill-nivaa]"), function (b) { b.setAttribute("aria-pressed", b === knapp ? "true" : "false"); });
      visRekord();
    });
  });
  el.startknapp.addEventListener("click", startSekvens);
  el.igjen.addEventListener("click", startSekvens);
  var bytt = finn("[data-spill-bytt]");
  if (bytt) bytt.addEventListener("click", function () {
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
    tilstand: function () { return { tilstand: tilstand, klokke: klokke, x: spiller.x, v: spiller.v, kraft: kraft, tid: spiller.tid, plass: plassering() }; },
    trykk: trykk, start: startSekvens, ideal: function () { return idealTid(spiller.v); }
  };

  window.requestAnimationFrame(ramme);
})();
