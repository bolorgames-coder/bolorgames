/* ============================================================
   ielts-writing.js — IELTS Writing үнэлгээний виджет
   bolorgames.com дээр ашиглана.

   АШИГЛАХ:
     <div id="writing"></div>
     <script src="ielts-writing.js"></script>
     <script>
       IeltsWriting.mount("#writing", essayBlock);
     </script>

   essayBlock нь writing_test_3.json доторх "essay" төрлийн блок:
     { task: 1, question: "...", visual: "...", minWords: 150 }
   ============================================================ */

(function () {
  "use strict";

  var API = "https://ielts-ai-4pfg.onrender.com";

  // Хуудас нээгдэхэд серверийг сэрээнэ (үнэгүй эрхэд 50 сек унтардаг)
  var warmed = false;
  function warmUp() {
    if (warmed) return;
    warmed = true;
    fetch(API + "/api/health").catch(function () {});
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", warmUp);
  } else {
    warmUp();
  }

  var CSS = `
.iw{font:15px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif;color:#1a1d21;max-width:820px}
.iw *{box-sizing:border-box}
.iw-card{background:#fff;border:1px solid #e3e6ea;border-radius:10px;padding:18px;margin-bottom:16px}
.iw-task{font-weight:600;margin-bottom:8px}
.iw-q{white-space:pre-wrap;background:#f6f7f9;border-radius:8px;padding:12px;font-size:14px;margin-bottom:14px}
.iw textarea{width:100%;min-height:240px;padding:12px;border:1px solid #e3e6ea;border-radius:8px;font:inherit;resize:vertical}
.iw textarea:focus{outline:2px solid #2563eb;outline-offset:-1px;border-color:#2563eb}
.iw-bar{display:flex;align-items:center;justify-content:space-between;margin-top:10px;gap:12px;flex-wrap:wrap}
.iw-wc{font-size:13px;color:#6b7280}
.iw-wc.ok{color:#15803d}
.iw-btn{background:#2563eb;color:#fff;border:0;border-radius:8px;padding:11px 24px;font:inherit;font-weight:600;cursor:pointer}
.iw-btn:disabled{opacity:.5;cursor:default}
.iw-band{font-size:44px;font-weight:700;line-height:1}
.iw-sub{color:#6b7280;font-size:13px;margin-top:2px}
.iw-row{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #e3e6ea}
.iw-row:last-child{border:0}
.iw-name{flex:1;font-size:14px}
.iw-track{height:6px;background:#e3e6ea;border-radius:3px;overflow:hidden;margin-top:5px}
.iw-fill{display:block;height:100%;background:#2563eb;border-radius:3px}
.iw-score{font-weight:700;margin-left:16px;min-width:34px;text-align:right}
.iw-calc{color:#6b7280;font-size:12px;margin-top:10px}
.iw-fix{padding:12px 0;border-bottom:1px solid #e3e6ea}
.iw-fix:last-child{border:0}
.iw-bad{color:#b91c1c;text-decoration:line-through}
.iw-good{color:#15803d;font-weight:600}
.iw-note{color:#6b7280;font-size:13px;margin-top:4px}
.iw-h{font-weight:700;margin-bottom:6px}
.iw ul{margin:6px 0 0;padding-left:20px}
.iw-err{background:#fef2f2;border-color:#fecaca;color:#b91c1c}
.iw-wait{color:#6b7280;font-size:14px}
`;

  function injectCss() {
    if (document.getElementById("iw-css")) return;
    var s = document.createElement("style");
    s.id = "iw-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function countWords(t) {
    return String(t).trim().split(/\s+/).filter(Boolean).length;
  }

  var NAMES = {
    task: "Task Achievement / Response",
    coherence: "Coherence &amp; Cohesion",
    lexical: "Lexical Resource",
    grammar: "Grammatical Range &amp; Accuracy",
  };

  function renderResult(d) {
    var h = '<div class="iw-card"><div class="iw-band">' + d.overall.toFixed(1) + "</div>";
    h += '<div class="iw-sub">' + d.wordCount + " үг" + (d.meetsWordLimit ? "" : " — доод хязгаараас бага") + "</div></div>";

    h += '<div class="iw-card">';
    ["task", "coherence", "lexical", "grammar"].forEach(function (k) {
      var s = d.criteria[k].score;
      h += '<div class="iw-row"><div class="iw-name">' + NAMES[k] +
           '<div class="iw-track"><i class="iw-fill" style="width:' + (s / 9 * 100) + '%"></i></div></div>' +
           '<div class="iw-score">' + s.toFixed(1) + "</div></div>";
    });
    h += '<div class="iw-calc">' + esc(d.calculation) + "</div></div>";

    if (d.corrections && d.corrections.length) {
      h += '<div class="iw-card"><div class="iw-h">Алдаа ба засвар</div>';
      d.corrections.forEach(function (c) {
        h += '<div class="iw-fix"><span class="iw-bad">' + esc(c.original) + "</span> &rarr; " +
             '<span class="iw-good">' + esc(c.corrected) + "</span>";
        if (c.explanation) h += '<div class="iw-note">' + esc(c.explanation) + "</div>";
        h += "</div>";
      });
      h += "</div>";
    }

    if (d.strengths && d.strengths.length) {
      h += '<div class="iw-card"><div class="iw-h">Давуу тал</div><ul>' +
           d.strengths.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ul></div>";
    }
    if (d.weaknesses && d.weaknesses.length) {
      h += '<div class="iw-card"><div class="iw-h">Юуг засах вэ</div><ul>' +
           d.weaknesses.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ul></div>";
    }
    return h;
  }

  async function evaluate(payload) {
    var res = await fetch(API + "/api/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    var data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || "Сервертэй холбогдож чадсангүй.");
    return data;
  }

  function mount(target, block, opts) {
    injectCss();
    opts = opts || {};

    var el = typeof target === "string" ? document.querySelector(target) : target;
    if (!el) return console.error("IeltsWriting: элемент олдсонгүй", target);

    var task = Number(block.task) === 2 ? 2 : 1;
    var minWords = Number(block.minWords) || (task === 1 ? 150 : 250);
    var storeKey = "iw-draft-" + (block.qnum || "W" + task);

    el.classList.add("iw");
    el.innerHTML =
      '<div class="iw-card">' +
        '<div class="iw-task">WRITING TASK ' + task + " — хамгийн багадаа " + minWords + " үг</div>" +
        '<div class="iw-q">' + esc(block.question || "") + "</div>" +
        "<textarea placeholder=\"Эссэгээ энд бичнэ үү...\"></textarea>" +
        '<div class="iw-bar">' +
          '<span class="iw-wc">0 үг</span>' +
          '<button class="iw-btn">Үнэлүүлэх</button>' +
        "</div>" +
      "</div>" +
      '<div class="iw-out"></div>';

    var ta = el.querySelector("textarea");
    var wc = el.querySelector(".iw-wc");
    var btn = el.querySelector(".iw-btn");
    var out = el.querySelector(".iw-out");

    // Бичсэнийг браузерт хадгална — хуудас сэргээхэд алдагдахгүй
    try {
      var saved = localStorage.getItem(storeKey);
      if (saved) ta.value = saved;
    } catch (e) {}

    function updateCount() {
      var n = countWords(ta.value);
      wc.textContent = n + " үг";
      wc.className = "iw-wc" + (n >= minWords ? " ok" : "");
      try { localStorage.setItem(storeKey, ta.value); } catch (e) {}
    }
    ta.addEventListener("input", updateCount);
    updateCount();

    btn.addEventListener("click", async function () {
      var essay = ta.value.trim();
      if (countWords(essay) < 20) {
        out.innerHTML = '<div class="iw-card iw-err">Эссэ хэт богино байна.</div>';
        return;
      }

      btn.disabled = true;
      btn.textContent = "Үнэлж байна...";
      out.innerHTML = '<div class="iw-card iw-wait">Үнэлгээ хийгдэж байна. 10-60 секунд үргэлжилнэ...</div>';

      try {
        var data = await evaluate({
          task: task,
          question: block.question || "",
          visual: block.visual || "",
          essay: essay,
        });
        out.innerHTML = renderResult(data);
        out.scrollIntoView({ behavior: "smooth", block: "start" });
        if (typeof opts.onResult === "function") opts.onResult(data, essay);
      } catch (e) {
        out.innerHTML = '<div class="iw-card iw-err">' + esc(e.message) + "</div>";
      } finally {
        btn.disabled = false;
        btn.textContent = "Үнэлүүлэх";
      }
    });
  }

  window.IeltsWriting = {
    API: API,
    mount: mount,
    evaluate: evaluate,
    renderResult: renderResult,
    warmUp: warmUp,
  };
})();
