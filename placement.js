/* ============================================================
   placement.js — Түвшин тогтоох шалгалт (CEFR A1–C2)
   bolorgames.com · LinguaRush

   Бүтэц нь Oxford Placement Test-ийн зарчмыг баримтална:
     1. Use of English — богино харилцан ярианы завсрыг нөхөх
     2. Listening     — сонсоод утгыг ойлгох
     3. Writing       — богино бичвэр (заавал биш)
   Асуултууд түвшин тус бүрээр ангилагдсан ба хариултаас
   хамаарч дараагийн асуултын түвшин өөрчлөгдөнө (adaptive).

   АШИГЛАХ:
     Placement.mount(element, { onResult: fn, onExit: fn })
   ============================================================ */

(function () {
  "use strict";

  var LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

  // ── 1. USE OF ENGLISH ────────────────────────────────────
  // Богино яриа. Завсрыг зөв дүрэм / үгээр нөхнө.
  var USE = {
    A1: [
      ["A: Where ___ you from?  B: I'm from Mongolia.", ["are","is","do","be"], 0],
      ["A: Is this your bag?  B: Yes, it's ___.", ["my","mine","me","I"], 1],
      ["A: ___ you like coffee?  B: Yes, very much.", ["Do","Are","Is","Does"], 0],
      ["A: What time is it?  B: It's ___ o'clock.", ["at nine","nine","the nine","nine of"], 1],
      ["A: There ___ two chairs in the room.", ["is","be","are","am"], 2],
      ["A: She ___ to school every day.", ["go","goes","going","gone"], 1],
      ["A: How ___ brothers do you have?  B: Two.", ["much","many","long","old"], 1],
      ["A: I can't find my keys.  B: They're ___ the table.", ["in","at","on","to"], 2]
    ],
    A2: [
      ["A: What did you do yesterday?  B: I ___ to the cinema.", ["go","went","gone","was going"], 1],
      ["A: Would you like tea?  B: No thanks, I ___ had some.", ["already","yet","still","ever"], 0],
      ["A: This film is ___ than the other one.", ["good","better","best","more good"], 1],
      ["A: I'm sorry, I ___ hear you. Can you repeat that?", ["don't","didn't","haven't","wasn't"], 1],
      ["A: We're going to be late ___ we hurry.", ["if","unless","because","so"], 1],
      ["A: How long ___ you lived here?  B: Since 2019.", ["are","do","have","did"], 2],
      ["A: I'm looking forward ___ you again.", ["to see","seeing","to seeing","see"], 2],
      ["A: She's the woman ___ works at the bank.", ["which","who","whose","whom"], 1]
    ],
    B1: [
      ["A: If I ___ more time, I'd learn another language.", ["have","had","will have","would have"], 1],
      ["A: The meeting ___ because of the weather.", ["cancelled","was cancelled","has cancelling","is cancel"], 1],
      ["A: He suggested ___ a taxi instead of walking.", ["to take","take","taking","that take"], 2],
      ["A: I'd rather ___ at home tonight.", ["staying","to stay","stay","stayed"], 2],
      ["A: She's used to ___ early in the morning.", ["get up","getting up","got up","gets up"], 1],
      ["A: ___ the rain, the match continued.", ["Although","Despite","However","Even"], 1],
      ["A: I haven't seen him ___ he moved away.", ["for","since","during","while"], 1],
      ["A: You ___ have told me — I would have helped.", ["should","must","can","will"], 0]
    ],
    B2: [
      ["A: Had I known about the problem, I ___ something.", ["did","would do","had done","would have done"], 3],
      ["A: The report needs ___ before Friday.", ["to finish","finishing","finish","be finished"], 1],
      ["A: It's high time we ___ a decision.", ["make","made","making","will make"], 1],
      ["A: No sooner ___ she arrived than the phone rang.", ["has","had","did","was"], 1],
      ["A: I'd rather you ___ tell anyone about this.", ["don't","didn't","won't","not"], 1],
      ["A: The proposal was turned ___ by the committee.", ["off","down","over","up"], 1],
      ["A: She takes her work seriously, which ___ for her success.", ["accounts","counts","amounts","regards"], 0],
      ["A: Not only ___ late, but he also forgot the tickets.", ["he was","was he","he is","is he"], 1]
    ],
    C1: [
      ["A: Little ___ that the decision would change everything.", ["he knew","did he know","he did know","knew he"], 1],
      ["A: The evidence, ___ compelling, was ultimately circumstantial.", ["however","although","while","despite"], 0],
      ["A: Her argument was undermined by a ___ lack of evidence.", ["conspicuous","conspicuously","conspicuousness","conspicuity"], 0],
      ["A: Were it not for his support, the project ___ failed.", ["would","will have","would have","had"], 2],
      ["A: They went ahead with the plan ___ the obvious risks.", ["in spite","notwithstanding","nevertheless","albeit"], 1],
      ["A: The committee is ___ to reaching a consensus by Friday.", ["committed","dedicated","devoted","obliged"], 0],
      ["A: He spoke with an authority that ___ no contradiction.", ["allowed","brooked","let","gave"], 1],
      ["A: The findings call into ___ the whole theory.", ["doubt","question","dispute","query"], 1]
    ],
    C2: [
      ["A: Suffice it ___ say, the outcome was unexpected.", ["to","it","that","for"], 0],
      ["A: His remarks were, if anything, ___ understated.", ["somewhat","rather the","all the more","much of"], 0],
      ["A: The policy has been honoured more in the ___ than the observance.", ["breach","break","broken","breaking"], 0],
      ["A: She has a ___ for understatement that borders on the comic.", ["penchant","pension","pendant","pretence"], 0],
      ["A: ___ as it may seem, the simplest explanation was correct.", ["Strange","Strangely","As strange","Stranger"], 0],
      ["A: The report was damning, ___ in its restraint.", ["all the more so","much the more","far the more","so the more"], 0],
      ["A: He is not one to ___ his words.", ["mince","mind","mend","mint"], 0],
      ["A: The scheme was abandoned, having proved ___ unworkable.", ["hopelessly","hopeful","hopefully","hopeless"], 0]
    ]
  };

  // ── 2. LISTENING ─────────────────────────────────────────
  // Бичлэг байхгүй тул браузерын яриа үүсгэгчээр уншуулна.
  var LISTEN = {
    A1: [
      ["The shop opens at nine in the morning and closes at six.", "What time does the shop close?", ["Nine","Six","Ten","Five"], 1],
      ["My sister has two cats and a small brown dog.", "How many cats does she have?", ["One","Two","Three","None"], 1]
    ],
    A2: [
      ["I usually take the bus to work, but yesterday I walked because the weather was nice.", "How did the speaker get to work yesterday?", ["By bus","On foot","By car","By bike"], 1],
      ["The train leaves from platform four, not platform three as printed on your ticket.", "Which platform is correct?", ["Three","Four","Five","Either"], 1]
    ],
    B1: [
      ["I was going to join the gym, but when I saw the monthly fee I decided to run in the park instead.", "What did the speaker decide?", ["To join the gym","To run outside","To stop exercising","To pay monthly"], 1],
      ["The presentation went well overall, although I wish I'd spent more time on the final section.", "How does the speaker feel?", ["Completely satisfied","Mostly pleased but with one regret","Very disappointed","Indifferent"], 1]
    ],
    B2: [
      ["While the new policy has been broadly welcomed, several departments have raised concerns about how quickly it will be implemented.", "What is the main concern?", ["The policy itself","The timing of implementation","The cost involved","The staff reaction"], 1],
      ["I wouldn't say the restaurant was bad exactly, but for that price I'd expected considerably more.", "What is the speaker's opinion?", ["The food was terrible","It was good value","It did not justify the price","They will return soon"], 2]
    ],
    C1: [
      ["The research is undeniably thorough, yet its conclusions rest on a sample that many in the field would consider too narrow to generalise from.", "What is the speaker's criticism?", ["The research lacks detail","The sample size limits the conclusions","The topic is unimportant","The methods are outdated"], 1],
      ["Far from settling the debate, the latest findings have, if anything, complicated it further.", "What effect did the findings have?", ["They ended the debate","They made the debate more complex","They were ignored","They confirmed earlier work"], 1]
    ],
    C2: [
      ["To describe the reform as ambitious would be something of an understatement; whether it is workable is quite another matter.", "What does the speaker imply?", ["The reform is modest","The reform is very ambitious but perhaps impractical","The reform has already failed","The reform is unambitious but practical"], 1],
      ["He conceded the point with a grace that rather took the sting out of his opponent's victory.", "How did he respond?", ["Angrily","Graciously, diminishing the opponent's triumph","By refusing to concede","With indifference"], 1]
    ]
  };

  var CEFR_INFO = {
    A1: { name: "Beginner", mn: "Эхлэн суралцагч", desc: "Энгийн үг хэллэг, танил өдөр тутмын хэллэгийг ойлгоно." },
    A2: { name: "Elementary", mn: "Анхан шат", desc: "Энгийн харилцаа, танил сэдвээр богино ярианд оролцоно." },
    B1: { name: "Intermediate", mn: "Дунд шат", desc: "Танил сэдвээр ойлгомжтой ярианы гол утгыг ойлгоно." },
    B2: { name: "Upper Intermediate", mn: "Дунджаас дээгүүр", desc: "Хийсвэр сэдвээр ч чөлөөтэй ярьж, бичиж чадна. IELTS 5.5–6.5 орчим." },
    C1: { name: "Advanced", mn: "Ахисан шат", desc: "Урт, нарийн төвөгтэй текстийг ойлгож, уян хатан илэрхийлнэ. IELTS 7.0–8.0." },
    C2: { name: "Proficient", mn: "Төгс эзэмшсэн", desc: "Уншсан, сонссон бараг бүхнийг хялбархан ойлгоно. IELTS 8.5–9.0." }
  };

  var CSS = `
.pl{font:15px/1.6 'Inter',system-ui,-apple-system,sans-serif;color:#11161C;max-width:760px;margin:0 auto}
.pl *{box-sizing:border-box}
.pl-head{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:18px}
.pl-kind{font-family:'Oswald',sans-serif;font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#C8102E}
.pl-h{font-family:'Oswald',sans-serif;font-size:27px;font-weight:700;text-transform:uppercase;margin:4px 0 0;line-height:1.1}
.pl-sub{color:#6E7884;font-size:14px;margin:8px 0 0}
.pl-prog{height:4px;background:#E4E7EA;margin:18px 0 22px}
.pl-prog i{display:block;height:100%;background:#1552C4;transition:width .35s ease}
.pl-meta{display:flex;justify-content:space-between;font-family:'Oswald',sans-serif;font-size:11px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#98A0A9;margin-bottom:10px}
.pl-q{font-size:17px;line-height:1.65;margin:0 0 20px;white-space:pre-wrap}
.pl-opts{display:flex;flex-direction:column;gap:9px}
.pl-opt{display:block;width:100%;text-align:left;padding:14px 17px;border:1px solid #DCE0E5;background:#fff;font:inherit;cursor:pointer;transition:border-color .14s,background .14s}
.pl-opt:hover{border-color:#1552C4;background:#F5F8FD}
.pl-opt:focus-visible{outline:2px solid #1552C4;outline-offset:2px}
.pl-btn{background:#0B0E12;color:#fff;border:0;padding:13px 30px;border-radius:999px;font-family:'Oswald',sans-serif;font-size:13px;font-weight:600;letter-spacing:.07em;text-transform:uppercase;cursor:pointer;transition:background .16s}
.pl-btn:hover{background:#1552C4}
.pl-btn:disabled{opacity:.45;cursor:default}
.pl-btn-line{background:transparent;color:#6E7884;border:1px solid #DCE0E5;padding:11px 22px;border-radius:999px;font-family:'Oswald',sans-serif;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;cursor:pointer}
.pl-btn-line:hover{border-color:#0B0E12;color:#0B0E12}
.pl-acts{margin-top:22px;display:flex;gap:9px;flex-wrap:wrap;align-items:center}
.pl-play{display:flex;align-items:center;gap:13px;background:#0B0E12;color:#fff;padding:20px;margin-bottom:20px}
.pl-play-btn{width:50px;height:50px;border-radius:50%;background:#fff;color:#0B0E12;border:0;font-size:19px;cursor:pointer;flex:none;display:flex;align-items:center;justify-content:center}
.pl-play-btn:hover{background:#CED5DC}
.pl-play-txt{font-family:'Oswald',sans-serif;font-size:12.5px;letter-spacing:.07em;text-transform:uppercase}
.pl-play-sub{color:#98A0A9;font-size:12px;margin-top:3px;text-transform:none;letter-spacing:0;font-family:inherit}
.pl-ta{width:100%;min-height:190px;padding:13px;border:1px solid #DCE0E5;font:inherit;resize:vertical}
.pl-ta:focus{outline:2px solid #1552C4;outline-offset:-1px}
.pl-wc{font-size:13px;color:#6E7884;margin-top:8px}
.pl-res-level{font-family:'Oswald',sans-serif;font-size:86px;font-weight:700;line-height:1;color:#1552C4}
.pl-res-name{font-family:'Oswald',sans-serif;font-size:21px;font-weight:600;text-transform:uppercase;margin-top:2px}
.pl-res-mn{color:#6E7884;font-size:14px;margin-top:2px}
.pl-res-desc{font-size:15px;line-height:1.6;color:#3C444C;margin:16px 0 0;max-width:56ch}
.pl-res-score{font-family:'Oswald',sans-serif;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#98A0A9;margin-top:14px}
.pl-sec{border-top:1px solid #E6E8EB;padding-top:16px;margin-top:22px}
.pl-sec-row{display:flex;justify-content:space-between;align-items:baseline;padding:9px 0}
.pl-sec-n{font-family:'Oswald',sans-serif;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.05em}
.pl-sec-v{font-family:'Oswald',sans-serif;font-size:17px;font-weight:700}
.pl-bar{height:6px;background:#E7EAED;margin-top:5px}
.pl-bar i{display:block;height:100%;background:#1552C4}
.pl-note{background:#F4F5F6;padding:15px 17px;font-size:13.5px;line-height:1.6;color:#3C444C;margin-top:20px}
@media(max-width:700px){.pl-h{font-size:22px}.pl-res-level{font-size:62px}.pl-q{font-size:15.5px}}
`;

  function injectCss() {
    if (document.getElementById("pl-css")) return;
    var s = document.createElement("style");
    s.id = "pl-css"; s.textContent = CSS;
    document.head.appendChild(s);
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function countWords(t){ return String(t).trim().split(/\s+/).filter(Boolean).length; }
  function shuffle(a){ a=a.slice(); for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;} return a; }

  // Асуултыг түвшингээс сонгоно, давтахгүй
  function pick(bank, level, used) {
    var order = [level].concat(LEVELS.filter(function(l){return l!==level;}));
    for (var i = 0; i < order.length; i++) {
      var pool = (bank[order[i]] || []).filter(function (q, k) { return !used[order[i] + ":" + k]; });
      if (pool.length) {
        var all = bank[order[i]];
        var idx = all.indexOf(pool[Math.floor(Math.random() * pool.length)]);
        used[order[i] + ":" + idx] = true;
        return { level: order[i], q: all[idx] };
      }
    }
    return null;
  }

  function mount(target, opts) {
    injectCss();
    opts = opts || {};
    var el = typeof target === "string" ? document.querySelector(target) : target;
    if (!el) return console.error("Placement: элемент олдсонгүй");
    el.classList.add("pl");

    var USE_N = 16, LIS_N = 8;
    var state = {
      phase: "intro",
      level: 2,            // B1-ээс эхэлнэ
      usedUse: {}, usedLis: {},
      useAsked: [], lisAsked: [],
      useRight: 0, lisRight: 0,
      essay: "", started: 0
    };

    function levelName(){ return LEVELS[Math.max(0,Math.min(5,state.level))]; }

    // Зөв бол дээш, буруу бол доош (adaptive)
    function adapt(ok){
      state.level += ok ? 1 : -1;
      state.level = Math.max(0, Math.min(5, state.level));
    }

    // Оноо: хариулсан асуултын түвшин ба зөв эсэхээс 0–120
    function scoreOf(asked){
      if(!asked.length) return 0;
      var sum = 0;
      asked.forEach(function(a){
        var base = LEVELS.indexOf(a.level) * 20;      // A1=0 … C2=100
        sum += a.ok ? base + 20 : base;                // зөв бол тухайн түвшнийг давсан
      });
      return Math.round(sum / asked.length);
    }
    function scoreToCefr(sc){
      var i = Math.min(5, Math.max(0, Math.ceil(sc / 20) - 1));
      if (sc < 1) i = 0;
      return LEVELS[i];
    }

    // ── Дэлгэцүүд ──
    function intro(){
      el.innerHTML =
        '<div class="pl-kind">LinguaRush</div>' +
        '<h2 class="pl-h">Түвшин тогтоох шалгалт</h2>' +
        '<p class="pl-sub">Таны англи хэлний түвшинг Европын нэгдсэн жишиг (CEFR) A1–C2 хуваарьт тогтооно. 15–20 минут үргэлжилнэ.</p>' +
        '<div class="pl-note"><b>Гурван хэсэгтэй.</b><br>' +
        '1. <b>Use of English</b> — ' + USE_N + ' асуулт. Богино ярианы завсрыг зөв хувилбараар нөхнө.<br>' +
        '2. <b>Listening</b> — ' + LIS_N + ' асуулт. Богино бичвэрийг сонсоод утгыг нь ойлгоно.<br>' +
        '3. <b>Writing</b> — богино бичвэр. Заавал биш.<br><br>' +
        'Асуулт бүр таны өмнөх хариултаас хамаарч хүндрэх буюу хөнгөрнө. Тиймээс бүгдийг зөв хариулах шаардлагагүй — төвшингөө олох нь зорилго.</div>' +
        '<div class="pl-acts"><button class="pl-btn" id="plGo">Эхлэх</button>' +
        (opts.onExit ? '<button class="pl-btn-line" id="plX">Буцах</button>' : '') + '</div>';
      el.querySelector("#plGo").onclick = function(){ state.started = Date.now(); state.phase="use"; next(); };
      if (opts.onExit) el.querySelector("#plX").onclick = opts.onExit;
    }

    function askUse(){
      var got = pick(USE, levelName(), state.usedUse);
      if (!got) { state.phase="listen"; return next(); }
      var q = got.q, text = q[0], opts4 = q[1], right = q[2];
      var order = shuffle(opts4.map(function(o,i){return {o:o,i:i};}));
      var n = state.useAsked.length + 1;

      el.innerHTML =
        '<div class="pl-meta"><span>Хэсэг 1 · Use of English</span><span>' + n + ' / ' + USE_N + '</span></div>' +
        '<div class="pl-prog"><i style="width:' + (n/USE_N*100) + '%"></i></div>' +
        '<p class="pl-q">' + esc(text) + '</p>' +
        '<div class="pl-opts">' + order.map(function(x,k){
          return '<button class="pl-opt" data-i="' + x.i + '">' + esc(x.o) + '</button>';
        }).join('') + '</div>';

      Array.prototype.forEach.call(el.querySelectorAll(".pl-opt"), function(b){
        b.onclick = function(){
          var ok = Number(b.dataset.i) === right;
          state.useAsked.push({ level: got.level, ok: ok });
          if (ok) state.useRight++;
          adapt(ok);
          if (state.useAsked.length >= USE_N) { state.phase="listen"; state.level=2; }
          next();
        };
      });
    }

    function askListen(){
      var got = pick(LISTEN, levelName(), state.usedLis);
      if (!got) { state.phase="write"; return next(); }
      var q = got.q, script = q[0], question = q[1], opts4 = q[2], right = q[3];
      var order = shuffle(opts4.map(function(o,i){return {o:o,i:i};}));
      var n = state.lisAsked.length + 1;
      var plays = 0;

      el.innerHTML =
        '<div class="pl-meta"><span>Хэсэг 2 · Listening</span><span>' + n + ' / ' + LIS_N + '</span></div>' +
        '<div class="pl-prog"><i style="width:' + (n/LIS_N*100) + '%"></i></div>' +
        '<div class="pl-play"><button class="pl-play-btn" id="plPlay" aria-label="Сонсох">▶</button>' +
        '<div><div class="pl-play-txt">Товчийг дарж сонсоно уу' +
        '<div class="pl-play-sub">Хоёр удаа сонсож болно. Текст харагдахгүй.</div></div></div></div>' +
        '<p class="pl-q">' + esc(question) + '</p>' +
        '<div class="pl-opts">' + order.map(function(x){
          return '<button class="pl-opt" data-i="' + x.i + '">' + esc(x.o) + '</button>';
        }).join('') + '</div>';

      var btn = el.querySelector("#plPlay");
      var sub = el.querySelector(".pl-play-sub");
      btn.onclick = function(){
        if (!("speechSynthesis" in window)) {
          sub.textContent = "Энэ браузер дуу уншихыг дэмжихгүй байна. Текст: " + script;
          return;
        }
        if (plays >= 2) { sub.textContent = "Аль хэдийн хоёр удаа сонссон байна."; return; }
        plays++;
        window.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(script);
        u.lang = "en-GB"; u.rate = 0.92;
        u.onend = function(){ sub.textContent = plays >= 2 ? "Сонсох боломж дууслаа." : "Дахин нэг удаа сонсож болно."; };
        sub.textContent = "Тоглож байна...";
        window.speechSynthesis.speak(u);
      };

      Array.prototype.forEach.call(el.querySelectorAll(".pl-opt"), function(b){
        b.onclick = function(){
          if (window.speechSynthesis) window.speechSynthesis.cancel();
          var ok = Number(b.dataset.i) === right;
          state.lisAsked.push({ level: got.level, ok: ok });
          if (ok) state.lisRight++;
          adapt(ok);
          if (state.lisAsked.length >= LIS_N) state.phase = "write";
          next();
        };
      });
    }

    function askWrite(){
      el.innerHTML =
        '<div class="pl-meta"><span>Хэсэг 3 · Writing</span><span>Заавал биш</span></div>' +
        '<div class="pl-prog"><i style="width:100%"></i></div>' +
        '<h2 class="pl-h">Богино бичвэр</h2>' +
        '<p class="pl-sub">Доорх сэдвээр 60–120 үгээр бичнэ үү. Энэ нь IELTS эссэ биш — зүгээр л чөлөөтэй бичих дасгал.</p>' +
        '<p class="pl-q">Describe a place you enjoy going to. Where is it, what do you do there, and why do you like it?</p>' +
        '<textarea class="pl-ta" id="plTa" placeholder="Write here..."></textarea>' +
        '<div class="pl-wc" id="plWc">0 үг</div>' +
        '<div class="pl-acts"><button class="pl-btn" id="plDone">Дуусгах</button>' +
        '<button class="pl-btn-line" id="plSkip">Алгасах</button></div>';
      var ta = el.querySelector("#plTa"), wc = el.querySelector("#plWc");
      ta.addEventListener("input", function(){ wc.textContent = countWords(ta.value) + " үг"; });
      el.querySelector("#plDone").onclick = function(){ state.essay = ta.value.trim(); state.phase="done"; next(); };
      el.querySelector("#plSkip").onclick = function(){ state.essay=""; state.phase="done"; next(); };
    }

    function result(){
      var useScore = scoreOf(state.useAsked);
      var lisScore = scoreOf(state.lisAsked);
      var overall  = Math.round((useScore + lisScore) / 2);
      var cefr     = scoreToCefr(overall);
      var info     = CEFR_INFO[cefr];
      var mins     = Math.max(1, Math.round((Date.now() - state.started) / 60000));

      var weaker = useScore < lisScore ? "Use of English" : "Listening";
      var advice = useScore < lisScore
        ? "Дүрэм, үгийн сангийн хэсэг харьцангуй сул байна. Өгүүлбэрийн бүтэц, цагийн хэлбэр дээр анхаарч, шинэ үг цээжлэхдээ өгүүлбэр дотор нь сурах нь үр дүнтэй."
        : "Сонсголын хэсэг харьцангуй сул байна. Өдөр бүр 15 минут англи сонсох дасгал хий. Эхэндээ хадмалтай, дараа нь хадмалгүй үзэх нь сайн арга.";

      el.innerHTML =
        '<div class="pl-kind">Үр дүн</div>' +
        '<div class="pl-res-level">' + cefr + '</div>' +
        '<div class="pl-res-name">' + esc(info.name) + '</div>' +
        '<div class="pl-res-mn">' + esc(info.mn) + '</div>' +
        '<p class="pl-res-desc">' + esc(info.desc) + '</p>' +
        '<div class="pl-res-score">Нийт оноо ' + overall + ' / 120 · ' + mins + ' минут</div>' +
        '<div class="pl-sec">' +
          '<div class="pl-sec-row"><span class="pl-sec-n">Use of English</span><span class="pl-sec-v">' + useScore + '</span></div>' +
          '<div class="pl-bar"><i style="width:' + (useScore/120*100) + '%"></i></div>' +
          '<div class="pl-sec-row" style="margin-top:14px"><span class="pl-sec-n">Listening</span><span class="pl-sec-v">' + lisScore + '</span></div>' +
          '<div class="pl-bar"><i style="width:' + (lisScore/120*100) + '%"></i></div>' +
        '</div>' +
        '<div class="pl-note"><b>' + weaker + ' дээр анхаарна уу.</b><br>' + advice + '</div>' +
        (state.essay ? '<div class="pl-note"><b>Бичвэр хадгалагдлаа.</b><br>' + countWords(state.essay) + ' үг бичсэн байна. Багш нар үүнийг хараад тайлбар өгөх боломжтой.</div>' : '') +
        '<div class="pl-acts"><button class="pl-btn" id="plAgain">Дахин ажиллах</button>' +
        (opts.onExit ? '<button class="pl-btn-line" id="plX2">Тестүүд рүү буцах</button>' : '') + '</div>';

      el.querySelector("#plAgain").onclick = function(){
        state = { phase:"intro", level:2, usedUse:{}, usedLis:{}, useAsked:[], lisAsked:[],
                  useRight:0, lisRight:0, essay:"", started:0 };
        next();
      };
      if (opts.onExit) el.querySelector("#plX2").onclick = opts.onExit;

      if (typeof opts.onResult === "function") {
        opts.onResult({
          cefr: cefr, overall: overall,
          useOfEnglish: useScore, listening: lisScore,
          useCorrect: state.useRight, useTotal: state.useAsked.length,
          lisCorrect: state.lisRight, lisTotal: state.lisAsked.length,
          essay: state.essay, minutes: mins
        });
      }
    }

    function next(){
      if (state.phase === "intro")  return intro();
      if (state.phase === "use")    return askUse();
      if (state.phase === "listen") return askListen();
      if (state.phase === "write")  return askWrite();
      return result();
    }

    next();
  }

  window.Placement = { mount: mount, LEVELS: LEVELS, CEFR: CEFR_INFO };
})();
