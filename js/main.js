/* Giulia Fumanti — interazioni del sito */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Anno nel footer ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Segnaposto elegante se una foto originale non è ancora stata caricata ---------- */
  document.querySelectorAll(".media img").forEach(function (img) {
    var markEmpty = function () { img.closest(".media").classList.add("is-empty"); };
    if (img.complete && img.naturalWidth === 0 && img.currentSrc) markEmpty();
    img.addEventListener("error", markEmpty);
  });

  /* ---------- Header: ombra allo scroll ---------- */
  var header = document.querySelector(".site-header");
  var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Menu mobile ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("main-nav");
  var toggleLabel = toggle.querySelector(".sr-only");

  function setMenu(open) {
    toggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
    toggleLabel.textContent = open ? "Chiudi il menu" : "Apri il menu";
    document.body.style.overflow = open ? "hidden" : "";
  }
  toggle.addEventListener("click", function () {
    setMenu(toggle.getAttribute("aria-expanded") !== "true");
  });
  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) setMenu(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("is-open")) { setMenu(false); toggle.focus(); }
  });
  window.matchMedia("(min-width: 1024px)").addEventListener("change", function (mq) {
    if (mq.matches) setMenu(false);
  });

  /* ---------- Link attivo nel menu ---------- */
  var links = Array.prototype.slice.call(nav.querySelectorAll("a[href^='#']"));
  var sections = links.map(function (a) { return document.querySelector(a.getAttribute("href")); }).filter(Boolean);
  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          var active = a.getAttribute("href") === "#" + entry.target.id;
          a.classList.toggle("is-active", active);
          if (active) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Fade-in allo scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-visible"); io.unobserve(entry.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Come funziona: linea che si "disegna" allo scroll e tappe che si accendono ---------- */
  var journey = document.getElementById("journey");
  if (journey) {
    var steps = Array.prototype.slice.call(journey.querySelectorAll(".step"));
    if (reduceMotion) {
      journey.style.setProperty("--p", 1);
      steps.forEach(function (s) { s.classList.add("is-active"); });
    } else {
      journey.classList.add("is-animated");
      var ticking = false;
      var update = function () {
        ticking = false;
        var r = journey.getBoundingClientRect();
        var vh = window.innerHeight;
        var start = vh * 0.85;            // la linea parte quando il percorso entra nella parte bassa dello schermo
        var end = vh * 0.62;              // ed è completa quando la fine del percorso è ben visibile
        var p = (start - r.top) / Math.max(1, r.height + start - end);
        p = Math.min(1, Math.max(0, p));
        journey.style.setProperty("--p", p.toFixed(4));
        var n = steps.length;
        steps.forEach(function (s, i) {
          s.classList.toggle("is-active", p >= (i / (n - 1)) - 0.02 && p > 0);
        });
      };
      var req = function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
      window.addEventListener("scroll", req, { passive: true });
      window.addEventListener("resize", req);
      update();
    }
  }

  /* ---------- FAQ accordion e "Scopri di più" dei servizi ---------- */
  var moreToggles = Array.prototype.slice.call(document.querySelectorAll(".more-toggle"));
  moreToggles.forEach(function (btn) {
    btn.addEventListener("click", function () {
      btn.firstChild.textContent = btn.getAttribute("aria-expanded") === "true" ? "Scopri di più" : "Mostra meno";
    });
  });
  // Le box dei servizi partono sempre chiuse e si richiudono quando la sezione esce dallo schermo
  function closeServiceBoxes() {
    moreToggles.forEach(function (btn) {
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      btn.setAttribute("aria-expanded", "false");
      btn.firstChild.textContent = "Scopri di più";
      panel.hidden = true;
      panel.style.height = "";
    });
  }
  closeServiceBoxes();
  window.addEventListener("pageshow", closeServiceBoxes);
  var servizi = document.getElementById("servizi");
  if (servizi) {
    window.addEventListener("scroll", function () {
      if (!moreToggles.some(function (b) { return b.getAttribute("aria-expanded") === "true"; })) return;
      var r = servizi.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) closeServiceBoxes();
    }, { passive: true });
  }
  document.querySelectorAll(".acc-trigger, .more-toggle").forEach(function (btn) {
    var panel = document.getElementById(btn.getAttribute("aria-controls"));
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      if (reduceMotion) { panel.hidden = open; return; }
      if (open) {
        panel.style.height = panel.scrollHeight + "px";
        requestAnimationFrame(function () { panel.style.height = "0px"; });
        panel.addEventListener("transitionend", function done() {
          panel.hidden = true; panel.style.height = "";
          panel.removeEventListener("transitionend", done);
        });
      } else {
        panel.hidden = false;
        var h = panel.scrollHeight;
        panel.style.height = "0px";
        requestAnimationFrame(function () { panel.style.height = h + "px"; });
        panel.addEventListener("transitionend", function done() {
          panel.style.height = "";
          panel.removeEventListener("transitionend", done);
        });
      }
    });
  });

  /* ---------- Modulo contatti ---------- */
  var form = document.getElementById("contact-form");
  if (!form) return;
  var endpoint = (form.dataset.endpoint || "").trim();
  var mailto = form.dataset.mailto;
  var status = document.getElementById("form-status");

  var rules = {
    nome: function (v) { return v.trim().length >= 2 || "Inserisci il tuo nome."; },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || "Inserisci un indirizzo email valido."; },
    trattamento: function (v) { return v !== "" || "Seleziona il trattamento di interesse."; },
    messaggio: function (v) { return v.trim().length >= 5 || "Scrivi un breve messaggio."; },
    privacy: function (_, el) { return el.checked || "Per inviare la richiesta è necessario accettare l'informativa privacy."; }
  };

  function validateField(el) {
    var rule = rules[el.name];
    if (!rule) return true;
    var res = rule(el.value, el);
    var err = document.getElementById(el.id + "-err");
    if (res === true) {
      el.removeAttribute("aria-invalid");
      if (err) err.textContent = "";
      return true;
    }
    el.setAttribute("aria-invalid", "true");
    if (err) err.textContent = res;
    return false;
  }

  form.querySelectorAll("input, select, textarea").forEach(function (el) {
    el.addEventListener(el.type === "checkbox" || el.tagName === "SELECT" ? "change" : "blur", function () { validateField(el); });
  });

  function setStatus(msg, isError) {
    status.textContent = msg;
    status.classList.toggle("is-error", !!isError);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    setStatus("");
    var firstInvalid = null;
    form.querySelectorAll("input, select, textarea").forEach(function (el) {
      if (!validateField(el) && !firstInvalid) firstInvalid = el;
    });
    if (firstInvalid) { firstInvalid.focus(); return; }

    var d = {
      nome: form.nome.value.trim(),
      email: form.email.value.trim(),
      telefono: form.telefono.value.trim(),
      trattamento: form.trattamento.value,
      messaggio: form.messaggio.value.trim()
    };

    if (!endpoint) {
      var subject = "Richiesta consulenza — " + d.trattamento;
      var body =
        "Nome: " + d.nome + "\n" +
        "Email: " + d.email + "\n" +
        (d.telefono ? "Telefono: " + d.telefono + "\n" : "") +
        "Trattamento di interesse: " + d.trattamento + "\n\n" +
        d.messaggio + "\n\n" +
        "— Ho letto l'informativa privacy e acconsento al trattamento dei dati per ricevere risposta.";
      window.location.href = "mailto:" + mailto + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      setStatus("Abbiamo aperto il tuo programma di posta con la richiesta già compilata. La richiesta sarà inviata solo quando premerai «Invia» nella tua email. Se non si è aperto nulla, scrivimi a " + mailto + " oppure chiamami al 334 708 6261.");
      return;
    }

    var btn = form.querySelector("button[type='submit']");
    var label = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Invio in corso…";
    fetch(endpoint, {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(Object.assign({ _subject: "Richiesta consulenza — " + d.trattamento, privacy: "accettata" }, d))
    }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      form.reset();
      setStatus("Grazie, la tua richiesta è stata inviata. Ti risponderò il prima possibile.");
    }).catch(function () {
      setStatus("Non è stato possibile inviare la richiesta. Riprova tra qualche istante oppure scrivimi a " + mailto + " o chiamami al 334 708 6261.", true);
    }).finally(function () {
      btn.disabled = false;
      btn.textContent = label;
    });
  });
})();
