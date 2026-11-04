/* ===== Ekaterina Tsar — site interactions ===== */
(function () {
  "use strict";

  /* ---------- Sticky header ---------- */
  var header = document.getElementById("siteHeader");
  function onScroll() {
    header.classList.toggle("scrolled", window.scrollY > 40);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile nav ---------- */
  var navToggle = document.getElementById("navToggle");
  var nav = document.getElementById("siteNav");
  navToggle.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    navToggle.classList.toggle("open", open);
    navToggle.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      nav.classList.remove("open");
      navToggle.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  /* ---------- Footer year ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();

  /* ---------- Gallery filtering ---------- */
  var filterBtns = document.querySelectorAll(".filter-btn");
  var items = Array.prototype.slice.call(document.querySelectorAll(".gallery-item"));
  var groups = document.querySelectorAll(".gallery-group");
  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterBtns.forEach(function (b) { b.classList.remove("is-active"); });
      btn.classList.add("is-active");
      var f = btn.dataset.filter;
      groups.forEach(function (g) {
        g.classList.toggle("hide", f !== "all" && g.dataset.group !== f);
      });
      items.forEach(function (it) {
        it.classList.toggle("hide", f !== "all" && it.dataset.category !== f);
      });
    });
  });

  /* ---------- Reveal on scroll ---------- */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("visible"); });
  }

  /* ---------- Lightbox ---------- */
  var lightbox = document.getElementById("lightbox");
  var lbImg = document.getElementById("lbImg");
  var lbTitle = document.getElementById("lbTitle");
  var lbCounter = document.getElementById("lbCounter");
  var lbClose = document.getElementById("lbClose");
  var lbPrev = document.getElementById("lbPrev");
  var lbNext = document.getElementById("lbNext");
  var current = 0;
  var lastFocus = null;

  function visibleItems() {
    return items.filter(function (it) { return !it.classList.contains("hide"); });
  }

  function titleOf(item) {
    var name = item.querySelector("figcaption");
    return name ? name.firstChild.textContent.trim() : "";
  }

  function render() {
    var list = visibleItems();
    var item = list[current];
    if (!item) return;
    var img = item.querySelector("img");
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    lbTitle.textContent = titleOf(item);
    lbCounter.textContent = (current + 1) + " / " + list.length;
  }

  function open(index) {
    lastFocus = document.activeElement;
    current = index;
    render();
    lightbox.hidden = false;
    document.body.classList.add("no-scroll");
    lbClose.focus();
  }

  function close() {
    lightbox.hidden = true;
    document.body.classList.remove("no-scroll");
    if (lastFocus) lastFocus.focus();
  }

  function step(dir) {
    var len = visibleItems().length;
    current = (current + dir + len) % len;
    render();
  }

  items.forEach(function (item) {
    item.addEventListener("click", function () {
      open(visibleItems().indexOf(item));
    });
    item.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        open(visibleItems().indexOf(item));
      }
    });
  });

  lbClose.addEventListener("click", close);
  lbPrev.addEventListener("click", function () { step(-1); });
  lbNext.addEventListener("click", function () { step(1); });
  lightbox.addEventListener("click", function (ev) {
    if (ev.target === lightbox) close();
  });
  document.addEventListener("keydown", function (ev) {
    if (lightbox.hidden) return;
    if (ev.key === "Escape") close();
    if (ev.key === "ArrowLeft") step(-1);
    if (ev.key === "ArrowRight") step(1);
  });

  /* ---------- Contact form (Web3Forms → inbox; endpoint in index.html) ---------- */
  var form = document.getElementById("contactForm");
  var formNote = document.getElementById("formNote");
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var btn = form.querySelector("button[type=submit]");
    btn.disabled = true;
    var data = new FormData(form);
    fetch(form.action, {
      method: "POST",
      headers: { "Accept": "application/json" },
      body: data
    }).then(function (r) {
      return r.json();
    }).then(function (json) {
      if (json.success) {
        form.reset();
        formNote.textContent = "Thank you! Your message has been sent.";
        formNote.classList.add("sent");
      } else {
        formNote.textContent = "Sorry, something went wrong. Please email photos@etsareg.com directly.";
      }
      btn.disabled = false;
    })["catch"](function () {
      formNote.textContent = "Network problem — please try again or email photos@etsareg.com.";
      btn.disabled = false;
    });
  });

  /* ---------- Hero slideshow (one photo per gallery, slides left every 20s) ---------- */
  var strip = document.querySelector(".hero-slides");
  var slides = document.querySelectorAll(".hero-slide");
  var slideName = document.getElementById("slideName");
  var slideLabel = slideName.querySelector(".slide-name-label");
  var slideTeaser = slideName.querySelector(".slide-name-teaser");

  /* pick one random photo per gallery for the hero */
  var galleryItems = Array.prototype.slice.call(document.querySelectorAll(".gallery-item"));
  Array.prototype.forEach.call(slides, function (s, i) {
    var img = s.querySelector("img");
    if (s.hasAttribute("data-clone")) {
      img.src = slides[0].querySelector("img").src;
      return;
    }
    var pool = galleryItems.filter(function (it) { return it.dataset.category === s.dataset.gallery; });
    if (pool.length) {
      img.src = pool[Math.floor(Math.random() * pool.length)].querySelector("img").src;
    }
  });
  slideLabel.textContent = slides[0].dataset.name;
  slideTeaser.textContent = slides[0].dataset.teaser;

  if (slides.length > 1) {
    var slide = 0, animating = false, last = slides.length - 1;
    function setPos(pct) {
      strip.style.transform = "translate3d(-" + pct + "%, 0, 0)";
    }
    function easeInOut(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    function goTo(from, to, done) {
      var dur = 1600, t0 = null;
      animating = true;
      function frame(ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1);
        setPos((from + (to - from) * easeInOut(p)) * 100);
        if (p < 1) {
          requestAnimationFrame(frame);
        } else {
          animating = false;
          if (done) done();
        }
      }
      requestAnimationFrame(frame);
    }
    setInterval(function () {
      if (animating) return;
      var next = slide + 1;
      slideName.style.opacity = "0";
      setTimeout(function () {
        slideLabel.textContent = slides[next].dataset.name;
        slideTeaser.textContent = slides[next].dataset.teaser;
        slideName.style.opacity = "1";
      }, 700);
      goTo(slide, next, function () {
        if (next === last) { slide = 0; setPos(0); }
        else { slide = next; }
      });
    }, 20000);
  }
})();
