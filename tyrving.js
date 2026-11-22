/* Gausdal Friidrettsklubb – Tyrvingkalkulator
   Regner et resultat om til poeng etter Tyrvingtabellen (2014-utgaven).
   Tallene ligger i tyrving-data.js. Reglene står i forbundets «Bruk av 2014-tabellen»:
   - Løp til og med 500 m: multiplikatoren gjelder per hundredel.
   - Lengre løp: per tidel, og hundredelene strykes.
   - Hopp og kast: per centimeter. Stav og kast har tre trinn.
   - Alle desimaler beholdes underveis, og poengsummen rundes ned. */
(function () {
  "use strict";

  var T = window.TYRVING;
  var skjema = document.querySelector("[data-tyrving]");
  if (!T || !skjema) return;

  var NBSP = " ";
  var GRUPPER = ["Løp", "Hekk og hinder", "Kappgang", "Hopp", "Kast"];
  var fmtPoeng = new Intl.NumberFormat("nb-NO");

  function finn(sel) { return skjema.querySelector(sel) || document.querySelector(sel); }
  var elAlder = finn("[name=alder]");
  var elOvelse = finn("[name=ovelse]");
  var elResultat = finn("[name=resultat]");
  var elManuell = finn("[name=manuell]");
  var elManuellLinje = finn("[data-tyrving-manuell]");
  var elManuellTekst = finn("[data-tyrving-manuelltekst]");
  var elHint = finn("[data-tyrving-hint]");
  var elFeil = finn("[data-tyrving-feil]");
  var elPoeng = document.querySelector("[data-tyrving-poeng]");
  var elEnhet = document.querySelector("[data-tyrving-enhet]");
  var elLinjer = document.querySelector("[data-tyrving-linjer]");
  var elNivaa = document.querySelector("[data-tyrving-nivaa]");
  var elNivaaTittel = document.querySelector("[data-tyrving-nivaatittel]");

  /* ---------- Hjelpere ---------- */
  function kjonn() {
    var valgt = skjema.querySelector("[name=kjonn]:checked");
    return valgt && valgt.value === "jenter" ? "jenter" : "gutter";
  }
  function alder() { return Math.min(19, Math.max(10, parseInt(elAlder.value, 10) || 10)); }
  function klasse() { return (kjonn() === "jenter" ? "J" : "G") + alder(); }

  // «Kule 4 kg» og «Kule 3 kg» er samme øvelse med ulikt redskap. Stammen brukes til å
  // beholde øvelsen når alder eller kjønn byttes.
  function stamme(navn) {
    return navn.replace(/ \(.*$/, "").replace(/ [\d,]+ (kg|g)$/, "");
  }

  function desimal(tall, antall) {
    return tall.toFixed(antall).replace(".", ",");
  }

  function visTid(sek, enhet) {
    var des = enhet < 0.05 ? 2 : 1;
    var faktor = des === 2 ? 100 : 10;
    var hele = Math.round(sek * faktor);
    var brok = hele % faktor;
    var s = Math.floor(hele / faktor);
    var t = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
    var hale = "," + String(brok).padStart(des, "0");
    if (t) return t + "." + String(m).padStart(2, "0") + "." + String(r).padStart(2, "0") + hale;
    if (m) return m + "." + String(r).padStart(2, "0") + hale;
    return r + hale;
  }

  function visMeter(m) { return desimal(m, 2) + NBSP + "m"; }
  function visTall(n) { return String(n).replace(".", ","); }

  /* ---------- Tolke det som skrives inn ---------- */
  // Godtar 7,85 · 7.85 · 1.52,3 · 1:52.3 · 1.52.30. Komma er alltid desimaltegn.
  function lesTid(tekst, kort) {
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
      if (ledd.length === 1) hel = ledd;
      else if (ledd.length === 2 && (kort || ledd[1].length !== 2 || Number(ledd[1]) > 59)) { hel = [ledd[0]]; des = ledd[1]; }
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
    if (hopp && m >= 20) m = m / 100; // 485 betyr 4,85 m
    return m;
  }

  /* ---------- Poeng ---------- */
  function gulv(p) { return Math.max(0, Math.floor(p + 1e-9)); }

  // Resultatet i hele enheter: hundredeler eller tideler for løp, centimeter ellers.
  function tilEnheter(o, verdi, manuell) {
    if (o.t === "lop") {
      if (o.e < 0.05) {
        var hundr = Math.ceil(verdi * 100 - 1e-6);
        if (manuell && o.h) hundr += Math.round(o.h * 100);
        return hundr;
      }
      return Math.floor(verdi * 10 + 1e-6);
    }
    return Math.floor(verdi * 100 + 1e-6);
  }

  function nivaaEnheter(o, verdi) {
    return Math.round(verdi * (o.t === "lop" ? (o.e < 0.05 ? 100 : 10) : 100));
  }

  function poeng(o, a, enheter) {
    var k = nivaaEnheter(o, o.k[a]);
    if (o.t === "lop") return gulv(1000 + (k - enheter) * o.m[0]);
    if (o.m.length === 1) return gulv(1000 + (enheter - k) * o.m[0]);
    var r = nivaaEnheter(o, o.r[a]);
    if (enheter >= k) return gulv(1000 + (enheter - k) * o.m[0]);
    if (enheter >= r) return gulv(1000 - (k - enheter) * o.m[1]);
    return gulv(1000 - (k - r) * o.m[1] - (r - enheter) * o.m[2]);
  }

  // Svakeste resultat som gir minst p poeng.
  function kravFor(o, a, p) {
    var k = nivaaEnheter(o, o.k[a]);
    var enheter;
    if (o.t === "lop") {
      enheter = k - Math.ceil((p - 1000) / o.m[0] - 1e-9);
    } else if (o.m.length === 1) {
      enheter = k + Math.ceil((p - 1000) / o.m[0] - 1e-9);
    } else {
      var r = nivaaEnheter(o, o.r[a]);
      if (p >= 1000) enheter = k + Math.ceil((p - 1000) / o.m[0] - 1e-9);
      else if (p >= 1000 - (k - r) * o.m[1]) enheter = k - Math.floor((1000 - p) / o.m[1] + 1e-9);
      else enheter = r - Math.floor((1000 - (k - r) * o.m[1] - p) / o.m[2] + 1e-9);
    }
    if (enheter <= 0) return null;
    return o.t === "lop" ? visTid(enheter * (o.e < 0.05 ? 0.01 : 0.1), o.e) : visMeter(enheter / 100);
  }

  function visNivaa(o, verdi) {
    return o.t === "lop" ? visTid(verdi, o.e) : visMeter(verdi);
  }

  /* ---------- Skjema ---------- */
  function fyllOvelser(onsket) {
    var liste = T[kjonn()];
    var a = alder() - 10;
    var forrige = onsket || (elOvelse.selectedOptions[0] ? elOvelse.selectedOptions[0].textContent : "");
    while (elOvelse.firstChild) elOvelse.removeChild(elOvelse.firstChild);
    var valgt = null, sammeStamme = null;
    GRUPPER.forEach(function (g) {
      var gruppe = document.createElement("optgroup");
      gruppe.label = g;
      liste.forEach(function (o, i) {
        if (o.g !== g || o.k[a] === null) return;
        var valg = document.createElement("option");
        valg.value = String(i);
        valg.textContent = o.n;
        gruppe.appendChild(valg);
        if (o.n === forrige) valgt = valg;
        else if (forrige && !sammeStamme && stamme(o.n) === stamme(forrige)) sammeStamme = valg;
      });
      if (gruppe.children.length) elOvelse.appendChild(gruppe);
    });
    var bruk = valgt || sammeStamme;
    if (bruk) bruk.selected = true;
  }

  function ovelse() { return T[kjonn()][parseInt(elOvelse.value, 10)] || null; }

  function linje(tekst) {
    var p = document.createElement("p");
    p.textContent = tekst;
    return p;
  }

  function settFeil(tekst) {
    elFeil.textContent = tekst || "";
    elFeil.hidden = !tekst;
    if (tekst) { elResultat.setAttribute("aria-invalid", "true"); elResultat.setAttribute("aria-describedby", elFeil.id + " " + elHint.id); }
    else { elResultat.removeAttribute("aria-invalid"); elResultat.setAttribute("aria-describedby", elHint.id); }
  }

  function oppdater() {
    var o = ovelse();
    if (!o) return;
    var a = alder() - 10;
    var lop = o.t === "lop";
    var kort = lop && o.e < 0.05;

    // Hjelpetekst og plassholder følger øvelsen
    if (lop) {
      elHint.textContent = kort ? "sekunder, for eksempel 7,85" : "minutter.sekunder,tidel, for eksempel 1.52,3";
      elResultat.placeholder = (kort ? "7,85" : "1.52,3") + "…";
    } else {
      elHint.textContent = "meter, for eksempel 4,85";
      elResultat.placeholder = "4,85…";
    }
    var kanManuell = !!o.h;
    elManuellLinje.hidden = !kanManuell;
    if (kanManuell) elManuellTekst.textContent = "legger til " + desimal(o.h, 2) + " s";
    var manuell = kanManuell && elManuell.checked;

    // Hva som teller
    while (elLinjer.firstChild) elLinjer.removeChild(elLinjer.firstChild);
    var enhetsnavn = lop ? (kort ? "Hvert hundredel" : "Hvert tidel") : "Hver centimeter";
    if (o.m.length === 1) {
      elLinjer.appendChild(linje(enhetsnavn + " teller " + visTall(o.m[0]) + " poeng."));
    } else {
      elLinjer.appendChild(linje("Hver centimeter teller " + visTall(o.m[0]) + " poeng over 1000 poeng, " +
        visTall(o.m[1]) + " ned til " + visMeter(o.r[a]) + " og " + visTall(o.m[2]) + " under det."));
    }
    if (lop && !kort) elLinjer.appendChild(linje("Hundredelene strykes før poengene regnes ut."));

    // Tabell over hva som kreves
    elNivaaTittel.textContent = "Krav i " + klasse() + ", " + o.n.charAt(0).toLowerCase() + o.n.slice(1);
    while (elNivaa.firstChild) elNivaa.removeChild(elNivaa.firstChild);
    [1100, 1000, 900, 800, 700, 600].forEach(function (p) {
      var krav = kravFor(o, a, p);
      if (!krav) return;
      var rad = document.createElement("tr");
      if (p === 1000) rad.className = "er-tusen";
      var th = document.createElement("th");
      th.scope = "row"; th.textContent = fmtPoeng.format(p).replace(/\s/g, NBSP) + NBSP + "poeng";
      var td = document.createElement("td");
      td.textContent = krav;
      rad.appendChild(th); rad.appendChild(td);
      elNivaa.appendChild(rad);
    });

    // Selve utregningen
    var tekst = elResultat.value.trim();
    if (!tekst) {
      settFeil("");
      elPoeng.textContent = "–";
      elEnhet.textContent = "Skriv inn et resultat";
      lagreAdresse();
      return;
    }
    var verdi = lop ? lesTid(tekst, kort) : lesMeter(tekst, o.g === "Hopp");
    if (!isFinite(verdi) || verdi <= 0) {
      settFeil(lop
        ? "Skriv tiden som " + (kort ? "7,85" : "1.52,3") + "."
        : "Skriv lengden eller høyden i meter, for eksempel 4,85.");
      elPoeng.textContent = "–";
      elEnhet.textContent = "Resultatet kan ikke leses";
      return;
    }
    settFeil("");
    var enheter = tilEnheter(o, verdi, manuell);
    var sum = poeng(o, a, enheter);
    elPoeng.textContent = fmtPoeng.format(sum).replace(/\s/g, NBSP);
    var brukt = lop ? visTid(enheter * (kort ? 0.01 : 0.1), o.e) : visMeter(enheter / 100);
    elEnhet.textContent = "poeng for " + brukt + (manuell ? " med tillegg for manuell tid" : "") + " i " + klasse();
    lagreAdresse();
  }

  /* ---------- Adressen husker valgene, så utregningen kan deles ---------- */
  function lagreAdresse() {
    if (!window.history || !history.replaceState) return;
    var o = ovelse();
    var q = new URLSearchParams();
    q.set("k", kjonn() === "jenter" ? "j" : "g");
    q.set("a", String(alder()));
    if (o) q.set("o", o.n);
    if (elResultat.value.trim()) q.set("r", elResultat.value.trim());
    if (elManuell.checked && o && o.h) q.set("m", "1");
    try { history.replaceState(null, "", location.pathname + "?" + q.toString() + location.hash); } catch (e) { /* fil:// */ }
  }

  function lesAdresse() {
    var q;
    try { q = new URLSearchParams(location.search); } catch (e) { return null; }
    if (q.get("k") === "j") { var j = skjema.querySelector("[name=kjonn][value=jenter]"); if (j) j.checked = true; }
    var a = parseInt(q.get("a"), 10);
    if (a >= 10 && a <= 19) elAlder.value = String(a);
    if (q.get("r")) elResultat.value = q.get("r").slice(0, 16);
    if (q.get("m") === "1") elManuell.checked = true;
    return q.get("o");
  }

  var onsket = lesAdresse();
  fyllOvelser(onsket || "60 m");
  oppdater();

  skjema.addEventListener("submit", function (e) { e.preventDefault(); });
  skjema.addEventListener("change", function (e) {
    if (e.target.name === "kjonn" || e.target.name === "alder") fyllOvelser();
    oppdater();
  });
  elResultat.addEventListener("input", oppdater);
})();
