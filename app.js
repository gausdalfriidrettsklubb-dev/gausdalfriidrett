/* Gausdal Friidrettsklubb – skript
   Leser innholdet fra innhold.js og fyller det inn på siden.
   Du trenger normalt ikke å endre noe her. */
(function () {
  "use strict";

  var data = window.GFIK || {};
  var kontakt = data.kontakt || {};
  var NBSP = " ";

  /* ---------- Hjelpere ---------- */
  function finn(sel, rot) { return (rot || document).querySelector(sel); }
  function finnAlle(sel, rot) { return Array.prototype.slice.call((rot || document).querySelectorAll(sel)); }

  function lag(tag, attrs, barn) {
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else el.setAttribute(k, v === true ? "" : v);
    });
    (barn || []).forEach(function (b) {
      if (b === null || b === undefined) return;
      el.appendChild(typeof b === "string" ? document.createTextNode(b) : b);
    });
    return el;
  }

  function tom(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  function dato(iso) {
    var d = String(iso || "").split("-");
    return new Date(Number(d[0]), Number(d[1]) - 1, Number(d[2]));
  }

  var fmtLang = new Intl.DateTimeFormat("nb-NO", { day: "numeric", month: "long", year: "numeric" });
  var fmtMnd = new Intl.DateTimeFormat("nb-NO", { month: "short" });
  var fmtMndAar = new Intl.DateTimeFormat("nb-NO", { month: "short", year: "numeric" });
  var fmtUkedag = new Intl.DateTimeFormat("nb-NO", { weekday: "long" });
  var fmtTall = new Intl.NumberFormat("nb-NO");

  function kroner(n) { return fmtTall.format(n).replace(/\s/g, NBSP) + NBSP + "kr"; }
  function storForbokstav(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function pil() { return lag("span", { class: "pil", "aria-hidden": "true", text: "→" }); }

  /* ---------- Treningstider ---------- */
  function visTreninger() {
    var liste = finn("[data-treninger]");
    if (!liste) return;
    tom(liste);
    var okter = data.treninger || [];
    if (!okter.length) {
      liste.appendChild(lag("li", { class: "tomt", text: "Treningstidene er ikke lagt ut ennå. Ta kontakt, så får du vite når neste trening er." }));
      return;
    }
    okter.forEach(function (o) {
      var inne = String(o.type || "").toLowerCase() === "inne";
      liste.appendChild(lag("li", { class: "okt" }, [
        lag("div", { class: "okt__nar" }, [
          lag("span", { class: "okt__dag", text: o.dag }),
          lag("span", { class: "okt__tid tall", text: "kl." + NBSP + o.fra + "–" + o.til })
        ]),
        lag("div", { class: "okt__topp" }, [
          lag("h3", { text: o.tittel }),
          o.type ? lag("span", { class: "merke" + (inne ? " merke--inne" : ""), text: o.type }) : null
        ]),
        lag("p", { class: "okt__tekst" }, [
          lag("strong", { text: o.sted }),
          o.merknad ? document.createTextNode(". " + o.merknad) : null
        ])
      ]));
    });
  }

  /* ---------- Priser ---------- */
  function visPriser() {
    var kropp = finn("[data-priser]");
    var p = data.priser;
    if (!kropp || !p) return;
    tom(kropp);
    kropp.appendChild(lag("tr", {}, [
      lag("th", { scope: "row" }, ["Medlemskontingent", lag("small", { text: "Alle medlemmer" })]),
      lag("td", { text: kroner(p.medlemskontingent) })
    ]));
    (p.treningsavgift || []).forEach(function (t) {
      kropp.appendChild(lag("tr", {}, [
        lag("th", { scope: "row" }, ["Treningsavgift", lag("small", { text: t.gruppe })]),
        lag("td", { text: kroner(t.belop) })
      ]));
    });
    var note = finn("[data-prisnote]");
    if (note && p.merknad) { note.textContent = p.merknad; note.hidden = false; }
  }

  /* ---------- Terminliste ---------- */
  function visTerminliste() {
    var boks = finn("[data-terminliste]");
    if (!boks) return;
    tom(boks);
    var idag = new Date(); idag.setHours(0, 0, 0, 0);
    var kommende = (data.terminliste || [])
      .filter(function (s) { return dato(s.slutt || s.dato) >= idag; })
      .sort(function (a, b) { return dato(a.dato) - dato(b.dato); });

    if (!kommende.length) {
      boks.appendChild(lag("p", { class: "tomt" }, [
        "Ingen stevner er lagt inn akkurat nå. Nye stevner og påmelding legger vi ut i ",
        lag("a", { href: kontakt.facebook || "#kontakt", text: "Facebook-gruppa" }),
        " og i Spond."
      ]));
      return;
    }

    var fmtMaaned = new Intl.DateTimeFormat("nb-NO", { month: "long", year: "numeric" });
    var fmtKortDag = new Intl.DateTimeFormat("nb-NO", { weekday: "short" });
    var kropp = lag("tbody");
    var forrige = "";

    kommende.forEach(function (s) {
      var start = dato(s.dato);
      var slutt = s.slutt ? dato(s.slutt) : null;
      var maaned = storForbokstav(fmtMaaned.format(start));
      if (maaned !== forrige) {
        kropp.appendChild(lag("tr", { class: "terminliste__mnd" }, [lag("th", { colspan: "3", scope: "colgroup", text: maaned })]));
        forrige = maaned;
      }
      var dagtekst = slutt && slutt.getMonth() === start.getMonth()
        ? start.getDate() + ".–" + slutt.getDate() + "."
        : fmtKortDag.format(start).replace(/\.$/, "") + ". " + start.getDate() + ".";
      var lesbar = slutt
        ? fmtLang.format(start) + " til " + fmtLang.format(slutt)
        : storForbokstav(fmtUkedag.format(start)) + " " + fmtLang.format(start);

      kropp.appendChild(lag("tr", { class: s.hjemme ? "er-hjemme" : null }, [
        lag("td", { class: "terminliste__dato tall" }, [
          lag("time", { datetime: s.dato, "aria-label": lesbar }, [lag("span", { "aria-hidden": "true", text: dagtekst })])
        ]),
        lag("td", { class: "terminliste__stevne" }, [
          lag("strong", { text: s.tittel }),
          s.hjemme ? lag("span", { class: "merke merke--hjemme", text: "Hjemmestevne" }) : null,
          s.tekst ? lag("small", { text: s.tekst }) : null,
          lag("span", { class: "terminliste__sted-smal", text: s.sted })
        ]),
        lag("td", { class: "terminliste__sted", text: s.sted })
      ]));
    });

    boks.appendChild(lag("table", { class: "terminliste" }, [
      lag("caption", { class: "skjult-visuelt", text: "Kommende stevner" }),
      lag("thead", {}, [lag("tr", {}, [
        lag("th", { scope: "col", text: "Dato" }),
        lag("th", { scope: "col", text: "Stevne" }),
        lag("th", { scope: "col", class: "terminliste__sted", text: "Sted" })
      ])]),
      kropp
    ]));
  }

  /* ---------- Aktuelt ---------- */
  function visNyheter() {
    var boks = finn("[data-nyheter]");
    if (!boks) return;
    tom(boks);
    var nyheter = (data.nyheter || []).slice().sort(function (a, b) { return dato(b.dato) - dato(a.dato); });
    if (!nyheter.length) {
      boks.appendChild(lag("p", { class: "tomt" }, [
        "Det er ikke lagt ut nyheter her ennå. Følg med i ",
        lag("a", { href: kontakt.facebook || "#kontakt", text: "Facebook-gruppa" }), "."
      ]));
      return;
    }
    nyheter.forEach(function (n, i) {
      var deler = [];
      var klasse = "nyhet" + (i === 0 ? " nyhet--topp" : "") + (n.bilde ? "" : " nyhet--uten-bilde");
      if (n.bilde) {
        deler.push(lag("div", { class: "nyhet__bilde" }, [
          lag("img", { src: n.bilde, alt: n.alt || "", width: n.bredde || null, height: n.hoyde || null, loading: "lazy", decoding: "async" })
        ]));
      }
      deler.push(lag("div", { class: "nyhet__tekst" }, [
        lag("time", { datetime: n.dato, text: fmtLang.format(dato(n.dato)) }),
        lag("h3", { text: n.tittel }),
        lag("p", { text: n.tekst })
      ]));
      boks.appendChild(lag("article", { class: klasse }, deler));
    });
  }

  /* ---------- Styret ---------- */
  function visStyret() {
    var liste = finn("[data-styret]");
    if (!liste) return;
    tom(liste);
    (data.styret || []).forEach(function (s) {
      liste.appendChild(lag("li", {}, [lag("span", { text: s.navn }), lag("span", { text: s.rolle })]));
    });
  }

  /* ---------- Sponsorer ---------- */
  function sponsorLogo(s) {
    if (!s.logo) return lag("span", { class: "sponsor__navn", translate: "no", text: s.navn });
    return lag("img", {
      src: s.logo, alt: s.navn, width: s.bredde || null, height: s.hoyde || null,
      loading: "lazy", decoding: "async", class: s.hvitLogo ? "hvit-logo" : null
    });
  }

  function visSponsorer() {
    var stripe = finn("[data-sponsorstripe]");
    if (stripe) {
      tom(stripe);
      (data.sponsorer || []).forEach(function (s) {
        var inn = s.nettside
          ? lag("a", { class: "sponsor", href: s.nettside, rel: "noopener" }, [sponsorLogo(s)])
          : lag("div", { class: "sponsor" }, [sponsorLogo(s)]);
        stripe.appendChild(lag("li", {}, [inn]));
      });
    }

    var liste = finn("[data-sponsorliste]");
    if (liste) {
      tom(liste);
      var alle = data.sponsorer || [];
      if (!alle.length) {
        liste.appendChild(lag("li", { class: "tomt", text: "Sponsorlista oppdateres. Ta kontakt hvis bedriften din vil stå her." }));
      }
      alle.forEach(function (s) {
        var linje = [s.bransje, s.sted].filter(Boolean).join(" · ");
        var vert = "";
        try { vert = s.nettside ? new URL(s.nettside).hostname.replace(/^www\./, "") : ""; } catch (e) { vert = ""; }
        liste.appendChild(lag("li", { class: "sponsorkort" }, [
          lag("div", { class: "sponsorkort__logo" }, [sponsorLogo(s)]),
          lag("div", { class: "sponsorkort__tekst" }, [
            lag("h3", { translate: "no", text: s.navn }),
            linje ? lag("p", { text: linje }) : null,
            s.orgnr ? lag("p", { class: "tall", text: "Org.nr. " + s.orgnr.replace(/\s/g, NBSP) }) : null,
            s.nettside ? lag("a", { class: "lenke-pil", href: s.nettside, rel: "noopener" }, [vert + " ", pil()]) : null
          ])
        ]));
      });
    }
  }

  /* ---------- Kontaktinfo og lenker ---------- */
  function visKontakt() {
    finnAlle("[data-leder]").forEach(function (el) { if (kontakt.leder) el.textContent = kontakt.leder; });
    finnAlle("[data-rolle]").forEach(function (el) { if (kontakt.rolle) el.textContent = kontakt.rolle; });
    finnAlle("[data-telefon]").forEach(function (el) {
      if (!kontakt.telefon) { el.hidden = true; return; }
      var siffer = kontakt.telefon.replace(/\D/g, "");
      el.href = "tel:" + (siffer.length === 8 ? "+47" + siffer : siffer);
      el.textContent = kontakt.telefon.replace(/\s/g, NBSP);
    });
    finnAlle("[data-epost]").forEach(function (el) {
      if (!kontakt.epost) { el.hidden = true; return; }
      el.href = "mailto:" + kontakt.epost;
      // Lange adresser får lov til å dele seg foran @, ikke midt i et ord.
      var deler = kontakt.epost.split("@");
      tom(el);
      el.appendChild(document.createTextNode(deler[0]));
      if (deler[1]) { el.appendChild(document.createElement("wbr")); el.appendChild(document.createTextNode("@" + deler[1])); }
      el.setAttribute("translate", "no");
    });
    finnAlle("[data-epostlenke]").forEach(function (el) {
      if (!kontakt.epost) { el.hidden = true; return; }
      el.href = "mailto:" + kontakt.epost + "?subject=" + encodeURIComponent(el.getAttribute("data-emne") || "");
    });
    finnAlle("[data-facebook]").forEach(function (el) { if (kontakt.facebook) el.href = kontakt.facebook; });
    finnAlle("[data-instagram]").forEach(function (el) { if (kontakt.instagram) el.href = kontakt.instagram; });
    finnAlle("[data-aar]").forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

    var spond = data.spond || {};
    if (spond.kode || spond.lenke) {
      finnAlle("[data-spondboks]").forEach(function (boks) { boks.hidden = false; });
      finnAlle("[data-spond]").forEach(function (a) {
        if (spond.lenke) { a.href = spond.lenke; a.hidden = false; }
      });
      finnAlle("[data-spondgruppe]").forEach(function (el) { if (spond.gruppe) el.textContent = spond.gruppe; });
    }
    if (spond.kode) {
      finnAlle("[data-spondkode]").forEach(function (el) { el.textContent = spond.kode; });
      finnAlle("[data-spondkodelinje]").forEach(function (el) { el.hidden = false; });
      finnAlle("[data-spondtekst]").forEach(function (el) {
        tom(el);
        el.appendChild(document.createTextNode("Last ned appen og bli med i gruppa med koden "));
        el.appendChild(lag("strong", { class: "tall", translate: "no", text: spond.kode }));
        el.appendChild(document.createTextNode("."));
      });
    }
  }

  /* ---------- Meny på små skjermer ---------- */
  function settOppMeny() {
    var knapp = finn(".menyknapp");
    var meny = finn("#meny");
    if (!knapp || !meny) return;

    function sett(apen) {
      knapp.setAttribute("aria-expanded", apen ? "true" : "false");
      meny.classList.toggle("er-apen", apen);
    }
    knapp.addEventListener("click", function () { sett(knapp.getAttribute("aria-expanded") !== "true"); });
    meny.addEventListener("click", function (e) { if (e.target.closest("a")) sett(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && knapp.getAttribute("aria-expanded") === "true") { sett(false); knapp.focus(); }
    });
  }

  /* ---------- Skjema ---------- */
  var EPOST = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function nokkel() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  function settOppSkjema(skjema) {
    var status = finn(".skjema__status", skjema);
    var knapp = finn("button[type=submit]", skjema);
    var spinner = finn(".spinner", skjema);
    var knappetekst = finn("[data-knappetekst]", skjema);
    var nokkelfelt = finn("input[name=nokkel]", skjema);
    var adresse = data.skjemaAdresse || "";
    var endret = false;
    var sender = false;

    if (nokkelfelt) nokkelfelt.value = nokkel();
    if (!adresse && knappetekst) knappetekst.textContent = "Lag e-post til klubben";

    function felter() {
      return finnAlle("input, textarea", skjema).filter(function (f) {
        return f.type !== "hidden" && f.name !== "nettsted";
      });
    }

    function feilmelding(felt) {
      var verdi = felt.value.trim();
      if (felt.required && !verdi) return felt.getAttribute("data-feil") || "Fyll ut dette feltet.";
      if (felt.type === "email" && verdi && !EPOST.test(verdi)) return felt.getAttribute("data-feil") || "Sjekk e-postadressen.";
      return "";
    }

    function visFeil(felt, tekst) {
      var id = felt.id + "-feil";
      var el = document.getElementById(id);
      if (!el) {
        el = lag("p", { class: "felt__feil", id: id });
        felt.parentNode.appendChild(el);
      }
      if (tekst) {
        el.textContent = tekst; el.hidden = false;
        felt.setAttribute("aria-invalid", "true");
        felt.setAttribute("aria-describedby", id);
      } else {
        el.hidden = true; el.textContent = "";
        felt.removeAttribute("aria-invalid");
        felt.removeAttribute("aria-describedby");
      }
    }

    function settStatus(type, tittel, innhold) {
      tom(status);
      if (type) status.setAttribute("data-type", type); else status.removeAttribute("data-type");
      if (tittel) status.appendChild(lag("strong", { text: tittel }));
      (innhold || []).forEach(function (b) {
        status.appendChild(typeof b === "string" ? document.createTextNode(b) : b);
      });
    }

    function kontaktLenker() {
      var deler = [];
      if (kontakt.epost) deler.push(lag("a", { href: "mailto:" + kontakt.epost, text: kontakt.epost }));
      if (kontakt.epost && kontakt.telefon) deler.push(" eller ring ");
      else if (kontakt.telefon) deler.push("ring ");
      if (kontakt.telefon) deler.push(lag("a", { href: "tel:+47" + kontakt.telefon.replace(/\D/g, ""), text: kontakt.telefon.replace(/\s/g, NBSP) }));
      return deler;
    }

    function verdier() {
      var ut = {};
      felter().forEach(function (f) { ut[f.name] = f.value.trim(); });
      return ut;
    }

    function tilEpost(v) {
      var linjer = [];
      felter().forEach(function (f) {
        if (!v[f.name]) return;
        var etikett = finn('label[for="' + f.id + '"]', skjema);
        var navn = etikett ? etikett.firstChild.textContent.trim() : f.name;
        linjer.push(navn + ": " + v[f.name]);
      });
      var emne = skjema.getAttribute("data-emne") || "Henvendelse fra nettsiden";
      return "mailto:" + encodeURIComponent(kontakt.epost || "") +
        "?subject=" + encodeURIComponent(emne) +
        "&body=" + encodeURIComponent(linjer.join("\n") + "\n\nSendt fra skjemaet på nettsiden.");
    }

    function lasting(paa) {
      sender = paa;
      knapp.disabled = paa;
      knapp.setAttribute("aria-busy", paa ? "true" : "false");
    }

    skjema.addEventListener("input", function (e) {
      endret = true;
      if (e.target.getAttribute && e.target.getAttribute("aria-invalid") === "true" && !feilmelding(e.target)) visFeil(e.target, "");
    });

    // Cmd/Ctrl + Enter sender fra meldingsfeltet. Enter alene gir linjeskift.
    skjema.addEventListener("keydown", function (e) {
      if (e.target.tagName === "TEXTAREA" && e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (skjema.requestSubmit) skjema.requestSubmit(); else knapp.click();
      }
    });

    window.addEventListener("beforeunload", function (e) {
      if (endret && !sender) { e.preventDefault(); e.returnValue = ""; }
    });

    skjema.addEventListener("submit", function (e) {
      e.preventDefault();
      if (sender) return;

      var forsteFeil = null;
      felter().forEach(function (f) {
        f.value = f.value.trim();
        var feil = feilmelding(f);
        visFeil(f, feil);
        if (feil && !forsteFeil) forsteFeil = f;
      });
      if (forsteFeil) {
        settStatus("feil", "Skjemaet er ikke sendt.", ["Rett feltene som er markert, og prøv igjen."]);
        forsteFeil.focus();
        return;
      }

      var v = verdier();
      var honning = finn("input[name=nettsted]", skjema);
      if (honning && honning.value) return;

      if (!adresse) {
        endret = false;
        window.location.href = tilEpost(v);
        settStatus("", "E-posten er klar i e-postprogrammet ditt.",
          ["Trykk send der, så svarer vi deg. Skjedde det ingenting? Skriv til "].concat(kontaktLenker(), ["."]));
        return;
      }

      lasting(true);
      settStatus("", "", ["Sender…"]);
      var visSpinner = window.setTimeout(function () { spinner.hidden = false; }, 200);
      var startet = Date.now();

      function ferdig(fn) {
        window.clearTimeout(visSpinner);
        var synlig = !spinner.hidden;
        var vent = synlig ? Math.max(0, 500 - (Date.now() - startet)) : 0;
        window.setTimeout(function () { spinner.hidden = true; lasting(false); fn(); }, vent);
      }

      var last = { _subject: skjema.getAttribute("data-emne") || "Henvendelse fra nettsiden", nokkel: nokkelfelt ? nokkelfelt.value : "" };
      Object.keys(v).forEach(function (k) { last[k] = v[k]; });

      fetch(adresse, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(last)
      }).then(function (svar) {
        if (!svar.ok) throw new Error("Status " + svar.status);
        ferdig(function () {
          endret = false;
          skjema.reset();
          if (nokkelfelt) nokkelfelt.value = nokkel();
          settStatus("", "Takk, meldingen er sendt.", ["Vi svarer deg på e-post så snart vi kan."]);
          status.focus();
        });
      }).catch(function () {
        ferdig(function () {
          settStatus("feil", "Meldingen kom ikke fram.",
            ["Det du skrev, står fortsatt i skjemaet. Prøv en gang til, eller skriv til "].concat(kontaktLenker(), ["."]));
          status.focus();
        });
      });
    });
  }

  /* ---------- Start ---------- */
  visTreninger();
  visPriser();
  visTerminliste();
  visNyheter();
  visStyret();
  visSponsorer();
  visKontakt();
  settOppMeny();
  finnAlle("form[data-skjema]").forEach(settOppSkjema);
})();
