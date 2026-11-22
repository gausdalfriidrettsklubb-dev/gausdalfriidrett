/* Gausdal Friidrettsklubb – tabellen «Redskap etter alder» på siden om øvelsene.
   Vektene leses ut av Tyrvingtabellen (tyrving-data.js), så de følger samme kilde som kalkulatoren. */
(function () {
  "use strict";

  var T = window.TYRVING;
  var rot = document.querySelector("[data-redskap]");
  if (!T || !rot) return;

  var KAST = ["Kule", "Diskos", "Slegge", "Spyd"];

  function lag(tag, tekst, attr) {
    var el = document.createElement(tag);
    if (tekst !== undefined && tekst !== null) el.textContent = tekst;
    Object.keys(attr || {}).forEach(function (k) { el.setAttribute(k, attr[k]); });
    return el;
  }

  // «Slegge 4 kg (119,5 cm)» -> «4 kg»
  function vekt(navn, ovelse) {
    return navn.slice(ovelse.length + 1).replace(/ \(.*$/, "").replace(/ /g, " ");
  }

  function tabell(kjonn, tittel) {
    var liste = T[kjonn];
    var t = lag("table", null, { "class": "redskap" });
    t.appendChild(lag("caption", tittel, { "class": "skjult-visuelt" }));
    var hode = lag("tr");
    hode.appendChild(lag("th", "Alder", { scope: "col" }));
    KAST.forEach(function (k) { hode.appendChild(lag("th", k, { scope: "col" })); });
    var thead = lag("thead"); thead.appendChild(hode); t.appendChild(thead);
    var kropp = lag("tbody");
    for (var a = 0; a < 10; a++) {
      var rad = lag("tr");
      rad.appendChild(lag("th", (a + 10) + " år", { scope: "row" }));
      KAST.forEach(function (k) {
        var funn = liste.filter(function (o) { return o.n.indexOf(k + " ") === 0 && o.k[a] !== null; })[0];
        rad.appendChild(lag("td", funn ? vekt(funn.n, k) : "–"));
      });
      kropp.appendChild(rad);
    }
    t.appendChild(kropp);
    return t;
  }

  var grupper = [["jenter", "Jenter"], ["gutter", "Gutter"]];
  var valg = lag("div", null, { "class": "kravvalg", role: "group", "aria-label": "Velg kjønn" });
  var paneler = [];
  grupper.forEach(function (g, nr) {
    var panel = lag("div", null, { "class": "kravrulle", id: "redskap-" + g[0], tabindex: "0", role: "region", "aria-label": "Redskap etter alder, " + g[1].toLowerCase() });
    panel.hidden = nr > 0;
    panel.appendChild(tabell(g[0], "Redskap etter alder, " + g[1].toLowerCase()));
    paneler.push(panel);
    var knapp = lag("button", g[1], { type: "button", "class": "kravvalg__knapp", "aria-pressed": nr === 0 ? "true" : "false", "aria-controls": panel.id });
    knapp.addEventListener("click", function () {
      paneler.forEach(function (p) { p.hidden = p !== panel; });
      Array.prototype.forEach.call(valg.querySelectorAll("button"), function (b) { b.setAttribute("aria-pressed", b === knapp ? "true" : "false"); });
    });
    valg.appendChild(knapp);
  });
  while (rot.firstChild) rot.removeChild(rot.firstChild);
  rot.appendChild(valg);
  paneler.forEach(function (p) { rot.appendChild(p); });
})();
