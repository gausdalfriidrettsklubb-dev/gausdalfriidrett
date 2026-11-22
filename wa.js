/* Gausdal Friidrettsklubb – kalkulator for World Athletics-poeng
   Regner et resultat om til poeng etter World Athletics Scoring Tables, 2025-utgaven.
   Tallene ligger i wa-data.js. Tabellen oppgir for hvert poeng det svakeste resultatet som gir
   poenget. Kalkulatoren regner ut de samme grensene og slår opp i dem, så svaret blir som i tabellen. */
(function () {
  "use strict";

  var T = window.WAPOENG;
  var skjema = document.querySelector("[data-wa]");
  if (!T || !skjema) return;

  var NBSP = " ";
  var GRUPPER = ["Løp", "Hekk og hinder", "Hopp", "Kast", "Innendørs", "Gateløp"];
  var MAKS = 1400;
  var fmtPoeng = new Intl.NumberFormat("nb-NO");

  function finn(sel) { return skjema.querySelector(sel) || document.querySelector(sel); }
  var elOvelse = finn("[name=ovelse]");
  var elResultat = finn("[name=resultat]");
  var elHint = finn("[data-wa-hint]");
  var elFeil = finn("[data-wa-feil]");
  var elPoeng = document.querySelector("[data-wa-poeng]");
  var elEnhet = document.querySelector("[data-wa-enhet]");
  var elNivaa = document.querySelector("[data-wa-nivaa]");
  var elNivaaTittel = document.querySelector("[data-wa-nivaatittel]");

  /* ---------- Hjelpere ---------- */
  function kjonn() {
    var valgt = skjema.querySelector("[name=kjonn]:checked");
    return valgt && valgt.value === "kvinner" ? "kvinner" : "menn";
  }

  function desimal(tall, antall) { return tall.toFixed(antall).replace(".", ","); }

  // Viser en tid ut fra hele enheter: hundredeler på bane, hele sekunder i gateløp.
  function visTid(enheter, u) {
    var s = Math.floor(enheter / u), brok = enheter % u;
    var t = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
    var hale = u === 100 ? "," + String(brok).padStart(2, "0") : "";
    if (t) return t + "." + String(m).padStart(2, "0") + "." + String(r).padStart(2, "0") + hale;
    if (m) return m + "." + String(r).padStart(2, "0") + hale;
    return r + hale;
  }

  function visMerke(o, enheter) {
    return o.t === "lop" ? visTid(enheter, o.u) : desimal(enheter / 100, 2) + NBSP + "m";
  }

  /* ---------- Tolke det som skrives inn ---------- */
  // modus «kort»: sekunder (7,85) · «lang»: min.sek,hundredel (1.52,30) · «vei»: timer.min.sek (1.12.05)
  function lesTid(tekst, modus) {
    var s = tekst.replace(/\s+/g, "");
    if (!/^\d[\d:.,]*$/.test(s)) return NaN;
    var des = "", hel;
    if (s.indexOf(",") !== -1) {
      var d = s.split(",");
      if (d.length !== 2) return NaN;
      des = d[1]; hel = d[0].split(/[:.]/);
    } else if (s.indexOf(":") !== -1) {
      var p = s.split(".");
      if (p.length > 2) return NaN;
      des = p[1] || ""; hel = p[0].split(":");
    } else {
      var ledd = s.split(".");
      if (modus === "vei" || ledd.length === 1) hel = ledd;
      else if (ledd.length === 2 && (modus === "kort" || ledd[1].length !== 2 || Number(ledd[1]) > 59)) { hel = [ledd[0]]; des = ledd[1]; }
      else if (ledd.length === 2) hel = ledd;
      else { des = ledd.pop(); hel = ledd; }
    }
    if (hel.length > 3 || hel.some(function (x) { return x === ""; })) return NaN;
    var sek = 0;
    hel.slice().reverse().forEach(function (x, i) { sek += parseInt(x, 10) * Math.pow(60, i); });
    if (des) sek += parseFloat("0." + des);
    return sek;
  }

  function lesMeter(tekst, hopp) {
    var s = tekst.replace(/\s+/g, "").replace(/m$/i, "");
    if (!/^\d+([.,]\d+)?$/.test(s)) return NaN;
    var m = parseFloat(s.replace(",", "."));
    if (hopp && m >= 25) m = m / 100; // 485 betyr 4,85 m
    return m;
  }

  /* ---------- Poeng ---------- */
  // Svakeste resultat som gir p poeng, i hele enheter. Samme regnemåte som tabellen er laget med.
  function merke(o, p) {
    if (o.x && o.x[p] !== undefined) return o.x[p];
    if (o.t === "lop") return Math.floor((o.b - Math.sqrt(p / o.a)) * o.u);
    return Math.ceil((Math.sqrt((p - (o.c || 0)) / o.a) - o.b) * o.u);
  }

  function poeng(o, enheter) {
    var x = enheter / o.u;
    var p;
    if (o.t === "lop") p = x >= o.b ? 0 : Math.floor(o.a * (o.b - x) * (o.b - x));
    else p = Math.floor(o.a * (x + o.b) * (x + o.b) + (o.c || 0));
    p = Math.max(0, Math.min(MAKS, p));
    if (o.t === "lop") {
      while (p < MAKS && merke(o, p + 1) >= enheter) p++;
      while (p > 0 && merke(o, p) < enheter) p--;
    } else {
      while (p < MAKS && merke(o, p + 1) <= enheter) p++;
      while (p > 0 && merke(o, p) > enheter) p--;
    }
    return p;
  }

  /* ---------- Skjema ---------- */
  function fyllOvelser(onsket) {
    var liste = T[kjonn()];
    var forrige = onsket || (elOvelse.selectedOptions[0] ? elOvelse.selectedOptions[0].getAttribute("data-nokkel") : "");
    while (elOvelse.firstChild) elOvelse.removeChild(elOvelse.firstChild);
    var valgt = null, liknende = null;
    GRUPPER.forEach(function (g) {
      var gruppe = document.createElement("optgroup");
      gruppe.label = g;
      liste.forEach(function (o, i) {
        if (o.g !== g) return;
        var valg = document.createElement("option");
        var nokkel = o.g + "/" + o.n;
        valg.value = String(i);
        valg.textContent = o.n;
        valg.setAttribute("data-nokkel", nokkel);
        gruppe.appendChild(valg);
        if (nokkel === forrige) valgt = valg;
        // 100 m hekk og 110 m hekk er samme øvelse for kvinner og menn
        else if (forrige && !liknende && /1[01]0 m hekk$/.test(nokkel) && /1[01]0 m hekk$/.test(forrige)) liknende = valg;
      });
      if (gruppe.children.length) elOvelse.appendChild(gruppe);
    });
    var bruk = valgt || liknende;
    if (bruk) bruk.selected = true;
  }

  function ovelse() { return T[kjonn()][parseInt(elOvelse.value, 10)] || null; }

  function settFeil(tekst) {
    elFeil.textContent = tekst || "";
    elFeil.hidden = !tekst;
    if (tekst) { elResultat.setAttribute("aria-invalid", "true"); elResultat.setAttribute("aria-describedby", elFeil.id + " " + elHint.id); }
    else { elResultat.removeAttribute("aria-invalid"); elResultat.setAttribute("aria-describedby", elHint.id); }
  }

  function modusFor(o) {
    if (o.u === 1) return "vei";
    return o.b < 120 ? "kort" : "lang"; // b er tiden som gir 0 poeng: under to minutter regnes som sprint
  }

  function oppdater() {
    var o = ovelse();
    if (!o) return;
    var lop = o.t === "lop";
    var modus = lop ? modusFor(o) : "";
    var eksempel = !lop ? "6,85" : modus === "kort" ? "11,85" : modus === "vei" ? "38.45" : "1.52,30";

    elHint.textContent = !lop ? "meter, for eksempel 6,85"
      : modus === "kort" ? "sekunder, for eksempel 11,85"
      : modus === "vei" ? "minutter.sekunder eller timer.minutter.sekunder, for eksempel 38.45"
      : "minutter.sekunder,hundredeler, for eksempel 1.52,30";
    elResultat.placeholder = eksempel + "…";

    // Tabell over hva som kreves
    var hvem = kjonn() === "kvinner" ? "kvinner" : "menn";
    elNivaaTittel.textContent = "Krav for " + hvem + ", " + o.n.charAt(0).toLowerCase() + o.n.slice(1) +
      (o.g === "Innendørs" ? " innendørs" : "");
    while (elNivaa.firstChild) elNivaa.removeChild(elNivaa.firstChild);
    [1200, 1100, 1000, 900, 800, 700, 600, 500].forEach(function (p) {
      var m = merke(o, p);
      if (!(m > 0)) return;
      var rad = document.createElement("tr");
      if (p === 1000) rad.className = "er-tusen";
      var th = document.createElement("th");
      th.scope = "row"; th.textContent = fmtPoeng.format(p).replace(/\s/g, NBSP) + NBSP + "poeng";
      var td = document.createElement("td");
      td.textContent = visMerke(o, m);
      rad.appendChild(th); rad.appendChild(td);
      elNivaa.appendChild(rad);
    });

    var tekst = elResultat.value.trim();
    if (!tekst) {
      settFeil("");
      elPoeng.textContent = "–";
      elEnhet.textContent = "Skriv inn et resultat";
      lagreAdresse();
      return;
    }
    var verdi = lop ? lesTid(tekst, modus) : lesMeter(tekst, o.g === "Hopp");
    if (!isFinite(verdi) || verdi <= 0) {
      settFeil(lop ? "Skriv tiden som " + eksempel + "." : "Skriv lengden eller høyden i meter, for eksempel 6,85.");
      elPoeng.textContent = "–";
      elEnhet.textContent = "Resultatet kan ikke leses";
      return;
    }
    settFeil("");
    // Tider rundes opp til nærmeste hundredel eller sekund, lengder ned til nærmeste centimeter
    var enheter = lop ? Math.ceil(verdi * o.u - 1e-6) : Math.floor(verdi * o.u + 1e-6);
    var sum = poeng(o, enheter);
    elPoeng.textContent = fmtPoeng.format(sum).replace(/\s/g, NBSP);
    var hale = sum >= MAKS ? ". Tabellen stopper på 1400 poeng" : sum === 0 ? ". Resultatet er svakere enn tabellen dekker" : "";
    elEnhet.textContent = "poeng for " + visMerke(o, enheter) + hale;
    lagreAdresse();
  }

  /* ---------- Adressen husker valgene, så utregningen kan deles ---------- */
  function lagreAdresse() {
    if (!window.history || !history.replaceState) return;
    var valg = elOvelse.selectedOptions[0];
    var q = new URLSearchParams();
    q.set("k", kjonn() === "kvinner" ? "k" : "m");
    if (valg) q.set("o", valg.getAttribute("data-nokkel"));
    if (elResultat.value.trim()) q.set("r", elResultat.value.trim());
    try { history.replaceState(null, "", location.pathname + "?" + q.toString() + location.hash); } catch (e) { /* fil:// */ }
  }

  function lesAdresse() {
    var q;
    try { q = new URLSearchParams(location.search); } catch (e) { return null; }
    if (q.get("k") === "k") { var k = skjema.querySelector("[name=kjonn][value=kvinner]"); if (k) k.checked = true; }
    if (q.get("r")) elResultat.value = q.get("r").slice(0, 16);
    return q.get("o");
  }

  var onsket = lesAdresse();
  fyllOvelser(onsket || "Løp/100 m");
  oppdater();

  skjema.addEventListener("submit", function (e) { e.preventDefault(); });
  skjema.addEventListener("change", function (e) {
    if (e.target.name === "kjonn") fyllOvelser();
    oppdater();
  });
  elResultat.addEventListener("input", oppdater);
})();
