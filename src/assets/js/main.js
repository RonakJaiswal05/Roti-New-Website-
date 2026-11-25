/* Roti Foundation Mumbai Website 2.0 — site script (demo build). No dependencies. */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const MEAL = 40;
  const inr = n => Math.round(n).toLocaleString("en-IN");
  const intl = n => Math.round(n).toLocaleString("en-US");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- toast ---------------- */
  const toastEl = $(".toast");
  let toastT;
  const toast = msg => {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove("show"), 3200);
  };
  window.rbToast = toast;

  /* ---------------- i18n ---------------- */
  const I = window.I18N || { en: {} };
  let lang = localStorage.getItem("rb-lang") || "en";
  const t = (key, vars = {}) => {
    let s = (I[lang] && I[lang][key]) || I.en[key] || key;
    for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
    return s;
  };
  const applyLang = l => {
    lang = I[l] ? l : "en";
    document.documentElement.lang = lang;
    $$("[data-i18n]").forEach(el => {
      if (el.dataset.en === undefined) el.dataset.en = el.textContent;
      const v = lang !== "en" && I[lang][el.dataset.i18n];
      el.textContent = v || el.dataset.en;
    });
    $$("[data-i18n-html]").forEach(el => {
      if (el.dataset.enHtml === undefined) el.dataset.enHtml = el.innerHTML;
      const v = lang !== "en" && I[lang][el.dataset.i18nHtml];
      el.innerHTML = v || el.dataset.enHtml;
    });
    $$(".lang button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    localStorage.setItem("rb-lang", lang);
    document.dispatchEvent(new CustomEvent("rb:lang"));
  };
  $$(".lang button").forEach(b => b.addEventListener("click", () => applyLang(b.dataset.lang)));
  applyLang(lang);

  /* ---------------- header + menu ---------------- */
  const header = $(".site-header");
  const onScroll = () => header && header.classList.toggle("scrolled", scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  const menuBtn = $(".menu-btn"), nav = $("#site-nav");
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", () => {
      const open = menuBtn.getAttribute("aria-expanded") !== "true";
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      nav.classList.toggle("open", open);
      document.body.classList.toggle("nav-open", open);
    });
    nav.addEventListener("click", e => { if (e.target.closest("a")) menuBtn.click(); });
  }

  /* ---------------- sticky mobile give ---------------- */
  const sticky = $(".sticky-give");
  if (sticky && !document.body.classList.contains("give")) {
    const band = $(".cta-band");
    const upd = () => {
      const past = scrollY > 520;
      const nearBand = band && band.getBoundingClientRect().top < innerHeight;
      sticky.classList.toggle("show", past && !nearBand);
    };
    addEventListener("scroll", upd, { passive: true });
    upd();
  } else if (sticky) document.body.classList.add("no-sticky");

  /* ---------------- reveal + counters ---------------- */
  const io = "IntersectionObserver" in window ? new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      if (el.classList.contains("reveal")) el.classList.add("in");
      if (el.dataset.count) countUp(el);
      io.unobserve(el);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: .12 }) : null;
  // Live meals counter: last published total + the recent daily average since that date.
  const liveVal = el => {
    const since = Date.parse(el.dataset.since), perDay = +el.dataset.perDay;
    return Math.floor(+el.dataset.live + Math.max(0, Date.now() - since) / 864e5 * perDay);
  };
  const keepTicking = el => { if (el.dataset.live !== undefined) setInterval(() => { el.textContent = intl(liveVal(el)); }, 1000); };
  const countUp = el => {
    const end = el.dataset.live !== undefined ? liveVal(el) : +el.dataset.count;
    if (reduced || !end) { el.textContent = intl(end); keepTicking(el); return; }
    const dur = 1800, t0 = performance.now();
    const tick = now => {
      const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = intl(end * e);
      if (p < 1) requestAnimationFrame(tick); else { el.textContent = intl(end); keepTicking(el); }
    };
    requestAnimationFrame(tick);
  };
  $$(".reveal, [data-count]").forEach(el => io ? io.observe(el) : (el.classList.add("in"), el.dataset.count && countUp(el)));

  /* ---------------- copy buttons + demo forms ---------------- */
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-copy]");
    if (!b) return;
    const txt = b.dataset.copy || (b.dataset.copyFrom && $(b.dataset.copyFrom)?.innerText) || "";
    navigator.clipboard?.writeText(txt.trim()).then(() => toast("Copied to clipboard"), () => toast("Press Ctrl+C to copy"));
  });
  $$("[data-demo-form]").forEach(f => f.addEventListener("submit", e => {
    e.preventDefault();
    toast(f.dataset.demoForm || "Sent (demo). In the live site this goes to the Roti Foundation Mumbai team.");
    f.reset();
  }));

  /* ---------------- ₹40 calculator ---------------- */
  const plates = (el, n, max) => {
    if (!el) return;
    const k = Math.min(n, max);
    el.innerHTML = "<i></i>".repeat(Math.max(k, 1));
    if (n === 0) el.firstChild.className = "off";
  };
  function Calc(root) {
    const input = $("input[name=amount]", root);
    const freqIn = $("input[name=freq]", root);
    const chips = $$("[data-amt]", root);
    const segs = $$("[data-freq]", root);
    const out = k => $(`[data-out="${k}"]`, root);
    const q = new URLSearchParams(location.search);
    const state = { amount: +(input?.value || 1000), freq: "once" };
    if (q.get("amount")) state.amount = Math.max(0, parseInt(q.get("amount"), 10) || 0);
    if (q.get("children")) state.amount = (parseInt(q.get("children"), 10) || 1) * MEAL;
    if (q.get("freq") === "monthly") state.freq = "monthly";

    const render = (fromInput) => {
      const kids = Math.floor(state.amount / MEAL);
      chips.forEach(c => c.setAttribute("aria-pressed", String(+c.dataset.amt === state.amount)));
      segs.forEach(s => s.setAttribute("aria-pressed", String(s.dataset.freq === state.freq)));
      if (input && !fromInput) input.value = state.amount ? inr(state.amount) : "";
      if (freqIn) freqIn.value = state.freq;
      const kidsTxt = `${inr(kids)} ${kids === 1 ? t("calc.child") : t("calc.children")}`;
      if (out("children")) out("children").textContent = kids ? kidsTxt : "—";
      if (out("line")) out("line").textContent = kids === 0 ? t("calc.min")
        : state.freq === "monthly" ? t("calc.line_monthly", { meals: inr(kids * 12) }) : t("calc.line_once");
      if (out("cta")) out("cta").textContent = t(state.freq === "monthly" ? "calc.give_m" : "calc.give", { amt: inr(state.amount) });
      plates($(".plates", root), kids, 20);
      root.dispatchEvent(new CustomEvent("calc:change", { bubbles: true, detail: { ...state, kids, kidsTxt } }));
    };
    chips.forEach(c => c.addEventListener("click", () => { state.amount = +c.dataset.amt; render(); }));
    segs.forEach(s => s.addEventListener("click", () => { state.freq = s.dataset.freq; render(); }));
    input?.addEventListener("input", () => {
      const digits = input.value.replace(/[^\d]/g, "").slice(0, 8);
      state.amount = +digits || 0;
      input.value = digits ? inr(+digits) : "";
      render(true);
    });
    root.addEventListener("submit", e => {
      if (state.amount < MEAL) { e.preventDefault(); toast(t("calc.min")); input?.focus(); return; }
      if (root.getAttribute("action")) {
        e.preventDefault();
        location.href = `${root.getAttribute("action")}?amount=${state.amount}&freq=${state.freq}`;
      }
    });
    document.addEventListener("rb:lang", () => render());
    root._calc = state;
    root._render = render;
    render();
  }
  $$("[data-calc]").forEach(r => new Calc(r));

  /* ================= GIVE PAGE ================= */
  const gf = $("#give-form");
  if (gf) {
    const sum = k => $(`[data-sum="${k}"]`);
    let last = { amount: 1000, freq: "once", kids: 25, kidsTxt: "25 children" };
    gf.addEventListener("calc:change", e => {
      last = e.detail;
      sum("kids").textContent = inr(last.kids);
      sum("kids-l").textContent = last.freq === "monthly"
        ? `${last.kids === 1 ? "child" : "children"} fed every month, ${inr(last.kids * 12)} meals a year`
        : `${last.kids === 1 ? "child" : "children"} get a fresh, nutritious meal today`;
      sum("amount").textContent = "₹" + inr(last.amount);
      sum("freq").textContent = last.freq === "monthly" ? "Monthly, UPI Autopay" : "One time";
      sum("total").textContent = "₹" + inr(last.amount) + (last.freq === "monthly" ? " / month" : "");
      plates(sum("plates"), last.kids, 60);
      $("#pay-amt").textContent = "₹" + inr(last.amount);
      const auto = $("#pm-autopay");
      if (auto) {
        if (last.freq === "monthly") { auto.checked = true; } else if (auto.checked) { $("#pm-upi").checked = true; }
        updPay();
      }
    });

    // occasion
    const occ = $("#occ-toggle");
    occ?.addEventListener("change", () => { $("#occ-fields").hidden = !occ.checked; });
    if (new URLSearchParams(location.search).get("occasion") && occ) { occ.checked = true; $("#occ-fields").hidden = false; }

    // field validation (every donation gets a receipt, so name, PAN and address are always required)
    const validate = (input, ok, msg) => {
      const f = input.closest(".field");
      const hint = $(".hint", f);
      if (hint && hint.dataset.base === undefined) hint.dataset.base = hint.textContent;
      const good = ok(input.value.trim());
      f.classList.toggle("invalid", !good && input.value !== "");
      f.classList.toggle("valid", good);
      if (hint) hint.textContent = !good && input.value !== "" ? msg : hint.dataset.base;
      return good;
    };
    const pan = $("#pan"), mob = $("#mobile"), email = $("#email"), nm = $("#name");
    pan?.addEventListener("input", () => { pan.value = pan.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10); validate(pan, v => /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v), "PAN looks like ABCDE1234F"); });
    mob?.addEventListener("input", () => { mob.value = mob.value.replace(/\D/g, "").slice(0, 10); validate(mob, v => /^[6-9]\d{9}$/.test(v), "Enter a 10-digit mobile number"); });
    email?.addEventListener("input", () => validate(email, v => /^\S+@\S+\.\S+$/.test(v), "Check the email address"));
    const pin = $("#pin");
    pin?.addEventListener("input", () => { pin.value = pin.value.replace(/\D/g, "").slice(0, 6); validate(pin, v => /^[1-9]\d{5}$/.test(v), "PIN code is 6 digits"); });

    // OTP (demo)
    const otpBtn = $("#otp-btn"), otpRow = $("#otp-row");
    let verified = false;
    otpBtn?.addEventListener("click", () => {
      if (!/^[6-9]\d{9}$/.test(mob.value)) { toast("Enter your 10-digit mobile number first"); mob.focus(); return; }
      otpRow.hidden = false; $("#otp").focus();
      toast("Demo OTP sent: type any 4 digits");
    });
    $("#otp")?.addEventListener("input", e => {
      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4);
      if (e.target.value.length === 4) {
        verified = true; otpRow.hidden = true;
        otpBtn.textContent = "Verified ✓"; otpBtn.disabled = true;
        mob.closest(".field").classList.add("valid");
        toast("Mobile verified. Your receipts will come to this number on WhatsApp.");
      }
    });

    // payment method
    const updPay = () => {
      const m = ($("input[name=pay]:checked") || {}).value;
      $("#upi-box").hidden = !(m === "upi" || m === "autopay");
      $("#autopay-note").hidden = m !== "autopay";
      $("#card-box").hidden = m !== "card";
    };
    $$("input[name=pay]").forEach(r => r.addEventListener("change", updPay));
    updPay();
    gf._render && gf._render();

    // submit → success
    gf.addEventListener("submit", e => {
      e.preventDefault();
      if (last.amount < MEAL) { toast("The smallest gift is ₹40, one meal"); return; }
      const need = (el, msg) => { if (el && !el.value.trim()) { toast(msg); el.focus(); return true; } return false; };
      if (nm.value.trim().split(/\s+/).length < 2) { toast("Please enter your full name, as on your PAN"); nm.focus(); return; }
      if (!/^[6-9]\d{9}$/.test(mob.value)) { toast("Please add a valid mobile number"); mob.focus(); return; }
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan.value)) { toast("Please add your PAN. Every donation receives an 80G receipt"); pan.focus(); return; }
      if (need($("#addr1"), "Please add your flat or house number and building")) return;
      if (need($("#addr2"), "Please add your street and area")) return;
      if (need($("#city"), "Please add your city")) return;
      if (need($("#state"), "Please choose your state")) return;
      if (!/^[1-9]\d{5}$/.test(pin.value)) { toast("Please add your 6-digit PIN code"); pin.focus(); return; }
      if (!$("#consent").checked) { toast("Please agree to the privacy notice"); return; }
      const btn = $("#pay-btn");
      btn.disabled = true; btn.innerHTML = "Processing payment (demo)…";
      setTimeout(() => {
        const first = nm.value.trim().split(/\s+/)[0];
        const kidsWord = `${inr(last.kids)} ${last.kids === 1 ? t("calc.child") : t("calc.children")}`;
        const msg = t(last.freq === "monthly" ? "give.thanks_monthly" : "give.thanks_once", { kids: kidsWord });
        $("[data-r=thanks]").innerHTML = `${first}, ` + (lang === "en" ? msg.charAt(0).toLowerCase() + msg.slice(1) : msg);
        $("[data-r=name]").textContent = nm.value.trim();
        $("[data-r=pan]").textContent = pan.value.replace(/^(\w{2})\w{6}(\w{2})$/, "$1••••••$2");
        $("[data-r=addr]").textContent = `${$("#city").value.trim()}, ${$("#state").value} ${pin.value}`;
        $("[data-r=amount]").textContent = "₹" + inr(last.amount) + (last.freq === "monthly" ? " (monthly)" : "");
        $("[data-r=meals]").textContent = inr(last.kids) + " meals";
        $("[data-r=date]").textContent = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
        $("[data-r=no]").textContent = "RB/2026-27/DEMO-" + String(Math.floor(Math.random() * 9000) + 1000);
        $("[data-r=mob]").textContent = "+91 ••••• " + mob.value.slice(-5);
        $("[data-r=wa-kids]").textContent = inr(last.kids);
        $("[data-r=wa-name]").textContent = first;
        $("#give-flow").hidden = true;
        $("#success").hidden = false;
        scrollTo({ top: $("#success").offsetTop - 90, behavior: reduced ? "auto" : "smooth" });
      }, 1300);
    });
    $("#again")?.addEventListener("click", () => location.reload());
  }

  /* ================= HUNGER WATCH tickers ================= */
  const tickers = $$("[data-rate]");
  if (tickers.length) {
    const t0 = performance.now();
    const loop = now => {
      const s = (now - t0) / 1000;
      tickers.forEach(el => {
        const v = s * +el.dataset.rate;
        const d = +(el.dataset.dec || 0);
        el.textContent = d ? v.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d }) : inr(v);
      });
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    const since = $("#since");
    if (since) setInterval(() => {
      const s = Math.floor((performance.now() - t0) / 1000);
      since.textContent = s < 60 ? `${s} seconds` : `${Math.floor(s / 60)} min ${s % 60} s`;
    }, 1000);
  }

  /* ================= CSR proposal builder ================= */
  const bld = $("#builder");
  if (bld) {
    const DAYS = 209, SCHOOL = 340;
    const amt = $("#b-amount"), city = $("#b-city"), co = $("#b-company"), lbl = $("#b-amount-l");
    const P = k => $$(`[data-p="${k}"]`, bld);
    const set = (k, v) => P(k).forEach(el => el.textContent = v);
    const fmtCr = n => n >= 1e7 ? `₹${(n / 1e7).toFixed(n % 1e7 ? 2 : 0)} crore` : n >= 1e5 ? `₹${(n / 1e5).toFixed(1).replace(/\.0$/, "")} lakh` : "₹" + inr(n);
    const steps = [8360, 25000, 50000, 100000, 250000, 500000, 1000000, 1500000, 2842400, 5000000, 7500000, 10000000, 25000000, 50000000, 100000000];
    const upd = () => {
      const v = steps[+amt.value];
      const meals = Math.floor(v / MEAL), kids = Math.floor(meals / DAYS), schools = kids / SCHOOL;
      lbl.textContent = fmtCr(v);
      set("amount", fmtCr(v));
      set("meals", inr(meals));
      set("children", inr(kids));
      set("schools", schools >= 1 ? schools.toFixed(1).replace(/\.0$/, "") : "—");
      set("company", co.value.trim() || "Your company");
      set("city", city.value);
      set("date", new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }));
      $$("[data-preset]", bld).forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.preset === +amt.value)));
    };
    [amt, city, co].forEach(el => el.addEventListener("input", upd));
    $$("[data-preset]", bld).forEach(b => b.addEventListener("click", () => { amt.value = b.dataset.preset; upd(); }));
    $$("[data-tier]").forEach(b => b.addEventListener("click", () => { amt.value = b.dataset.tier; upd(); }));
    $("#b-print")?.addEventListener("click", () => {
      document.body.classList.add("printing-proposal");
      window.print();
      setTimeout(() => document.body.classList.remove("printing-proposal"), 500);
    });
    upd();
  }

  /* ================= Volunteer shifts ================= */
  const cal = $("#shift-cal");
  if (cal) {
    const list = $("#shift-list");
    const places = [
      ["New Sion Municipal School No. 2", "Sion", "School distribution", "11:30 am – 1:00 pm"],
      ["Hospital gate meals", "Central Mumbai", "Hospital meals", "12:00 – 1:30 pm"],
      ["Roti Foundation Mumbai kitchen", "Kitchen", "Kitchen and packing", "7:00 – 10:00 am"],
      ["Lokmanya Tilak English High School", "Sion", "School distribution", "11:30 am – 1:00 pm"],
      ["Cancer centre gate meals", "Central Mumbai", "Hospital meals", "12:30 – 2:00 pm"]
    ];
    const days = [];
    const d = new Date();
    while (days.length < 14) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0) days.push(new Date(d)); }
    const seed = n => { const x = Math.sin(n) * 10000; return x - Math.floor(x); };
    let sel = 0;
    const draw = () => {
      cal.innerHTML = days.map((x, i) => `<button type="button" aria-pressed="${i === sel}"><small>${x.toLocaleDateString("en-IN", { weekday: "short" })}</small><b>${x.getDate()}</b></button>`).join("");
      $$("button", cal).forEach((b, i) => b.addEventListener("click", () => { sel = i; draw(); }));
      const day = days[sel];
      list.innerHTML = places.filter((_, i) => seed(day.getDate() * 7 + i) > .25).map((p, i) => {
        const cap = 8 + Math.floor(seed(day.getDate() + i) * 8), left = Math.floor(seed(day.getDate() * 3 + i) * (cap + 1));
        const cls = left === 0 ? "full" : left <= 2 ? "low" : "";
        const txt = left === 0 ? "Full · join waitlist" : `${left} of ${cap} seats left`;
        return `<div class="shift"><div><b>${p[0]}</b><small>${p[2]} · ${p[1]} · ${p[3]}</small><br><span class="seats ${cls}">${txt}</span></div>
          <button type="button" class="btn btn-sm ${left ? "btn-primary" : "btn-ghost"}" data-book="${p[0]}|${p[3]}">${left ? "Book" : "Waitlist"}</button></div>`;
      }).join("") || `<p class="fine">No shifts on this day. Pick another date.</p>`;
      $$("[data-book]", list).forEach(b => b.addEventListener("click", () => {
        const [place, time] = b.dataset.book.split("|");
        const when = day.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
        $("#shift-confirm").hidden = false;
        $("#sc-text").innerHTML = `✅ You're booked: <b>${place}</b>, ${when}, ${time}.<br>📍 Location pin and dress code attached. We'll remind you the day before and 2 hours before. Reply CANCEL to free your seat.`;
        b.textContent = "Booked ✓"; b.disabled = true;
        toast("Shift booked (demo). Confirmation sent on WhatsApp.");
      }));
    };
    draw();
  }

  /* ================= Ration drive kit ================= */
  const df = $("#drive-form");
  if (df) {
    const P = k => $(`[data-d="${k}"]`);
    const upd = () => {
      const fd = new FormData(df);
      const kg = +(fd.get("kg") || 0);
      P("name").textContent = fd.get("name") || "Your society's ration drive";
      P("place").textContent = fd.get("place") || "Your building, Mumbai";
      P("kg").textContent = inr(kg);
      P("meals").textContent = inr(kg * 4);
      const end = fd.get("end");
      P("end").textContent = end ? new Date(end).toLocaleDateString("en-IN", { day: "numeric", month: "long" }) : "the closing date";
      const got = Math.round(kg * .38);
      P("got").textContent = inr(got);
      $("#drive-bar").style.width = kg ? "38%" : "0";
    };
    df.addEventListener("input", upd);
    df.addEventListener("submit", e => { e.preventDefault(); toast("Drive page created (demo). Share it on WhatsApp to start collecting."); });
    upd();
  }

  /* ================= Gallery filters ================= */
  const gal = $(".gallery");
  if (gal) {
    const btns = $$(".gal-filters [data-filter]");
    btns.forEach(b => b.addEventListener("click", () => {
      btns.forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      $$("figure", gal).forEach(f => { f.hidden = b.dataset.filter !== "all" && f.dataset.cat !== b.dataset.filter; });
    }));
  }

  /* ================= Samachar search ================= */
  const sq = $("#sam-q");
  if (sq) sq.addEventListener("input", () => {
    const q = sq.value.toLowerCase();
    $$(".issue").forEach(i => { i.hidden = q && !i.textContent.toLowerCase().includes(q); });
  });
})();
