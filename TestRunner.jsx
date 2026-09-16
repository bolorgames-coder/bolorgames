import { useState, useMemo } from "react";

/**
 * TestRunner — IELTS тестийн дасгал ажиллуулагч
 *
 * Гол боломж:
 *  - Дундаас нь дуусгах ("Дуусгах" товч)
 *  - Дуусгахын өмнө хэдэн асуулт үлдсэнийг сануулах
 *  - Дүнг зөвхөн хариулсан асуултаар бодох
 *
 * Хэрэглэх жишээ:
 *   <TestRunner
 *     title="IELTS 21 — Academic Test 4"
 *     questions={questions}
 *     onExit={() => navigate(-1)}
 *   />
 *
 * questions = [
 *   { id: 1, prompt: "...", options: ["A","B","C","D"], answer: 2 },
 *   ...
 * ]
 */
export default function TestRunner({ title, questions = [], onExit }) {
  const [answers, setAnswers] = useState({});   // { [questionId]: optionIndex }
  const [current, setCurrent] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [finished, setFinished] = useState(false);

  const answeredIds = useMemo(
    () => questions.filter((q) => answers[q.id] !== undefined),
    [questions, answers]
  );

  const skipped = questions.length - answeredIds.length;

  const result = useMemo(() => {
    const correct = answeredIds.filter((q) => answers[q.id] === q.answer).length;
    return {
      attempted: answeredIds.length,
      correct,
      wrong: answeredIds.length - correct,
      skipped,
      total: questions.length,
      // Дүн нь зөвхөн хариулсан асуултаас тооцогдоно
      percent: answeredIds.length
        ? Math.round((correct / answeredIds.length) * 100)
        : 0,
    };
  }, [answeredIds, answers, skipped, questions.length]);

  const pick = (qid, idx) => setAnswers((a) => ({ ...a, [qid]: idx }));

  const requestFinish = () => {
    if (skipped === 0) return finish();   // бүгд хариулсан бол шууд
    setConfirming(true);
  };

  const finish = () => {
    setConfirming(false);
    setFinished(true);
  };

  if (finished) {
    return (
      <Results
        title={title}
        result={result}
        questions={answeredIds}
        answers={answers}
        onExit={onExit}
      />
    );
  }

  const q = questions[current];
  if (!q) return null;

  return (
    <div style={S.shell}>
      <header style={S.bar}>
        <button style={S.ghost} onClick={onExit}>← Буцах</button>

        <div style={S.progressWrap}>
          <div style={S.progressLabel}>
            {current + 1} / {questions.length} · хариулсан {answeredIds.length}
          </div>
          <div style={S.track}>
            <div
              style={{
                ...S.fill,
                width: `${(answeredIds.length / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <button style={S.finish} onClick={requestFinish}>Дуусгах</button>
      </header>

      <main style={S.body}>
        <p style={S.qnum}>Асуулт {current + 1}</p>
        <h2 style={S.prompt}>{q.prompt}</h2>

        <div style={S.options}>
          {q.options.map((opt, i) => {
            const chosen = answers[q.id] === i;
            return (
              <button
                key={i}
                onClick={() => pick(q.id, i)}
                style={{ ...S.option, ...(chosen ? S.optionOn : null) }}
              >
                <span style={{ ...S.letter, ...(chosen ? S.letterOn : null) }}>
                  {"ABCDEFGH"[i]}
                </span>
                {opt}
              </button>
            );
          })}
        </div>

        <div style={S.nav}>
          <button
            style={S.ghost}
            disabled={current === 0}
            onClick={() => setCurrent((c) => c - 1)}
          >
            Өмнөх
          </button>
          <button
            style={S.ghost}
            disabled={current === questions.length - 1}
            onClick={() => setCurrent((c) => c + 1)}
          >
            Дараах
          </button>
        </div>

        {/* Асуултын шууд шилжих самбар */}
        <div style={S.grid}>
          {questions.map((item, i) => {
            const done = answers[item.id] !== undefined;
            const here = i === current;
            return (
              <button
                key={item.id}
                onClick={() => setCurrent(i)}
                style={{
                  ...S.dot,
                  ...(done ? S.dotDone : null),
                  ...(here ? S.dotHere : null),
                }}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </main>

      {confirming && (
        <div style={S.overlay} onClick={() => setConfirming(false)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={S.modalTitle}>Тестийг одоо дуусгах уу?</h3>
            <p style={S.modalText}>
              {skipped} асуулт хариулаагүй байна. Дүн зөвхөн хариулсан{" "}
              {answeredIds.length} асуултаар тооцогдоно.
            </p>
            <div style={S.modalRow}>
              <button style={S.ghost} onClick={() => setConfirming(false)}>
                Үргэлжлүүлэх
              </button>
              <button style={S.finish} onClick={finish}>
                Дуусгаад дүн харах
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Дүнгийн дэлгэц ---------- */

function Results({ title, result, questions, answers, onExit }) {
  return (
    <div style={S.shell}>
      <header style={S.bar}>
        <button style={S.ghost} onClick={onExit}>← Буцах</button>
        <div style={S.progressLabel}>{title}</div>
        <span style={{ width: 90 }} />
      </header>

      <main style={S.body}>
        <div style={S.scoreCard}>
          <div style={S.scoreBig}>
            {result.correct}
            <span style={S.scoreOf}>/{result.attempted}</span>
          </div>
          <p style={S.scoreNote}>
            Хариулсан асуултын {result.percent}% зөв
          </p>
          {result.skipped > 0 && (
            <p style={S.scoreSkip}>
              {result.skipped} асуулт хариулаагүй — дүнд ороогүй
            </p>
          )}
        </div>

        {result.attempted === 0 ? (
          <p style={S.empty}>
            Нэг ч асуулт хариулаагүй байна. Тестээ дахин эхлүүлж үзээрэй.
          </p>
        ) : (
          <div style={S.review}>
            {questions.map((q, i) => {
              const mine = answers[q.id];
              const ok = mine === q.answer;
              return (
                <div key={q.id} style={S.reviewRow}>
                  <span style={{ ...S.mark, ...(ok ? S.markOk : S.markNo) }}>
                    {ok ? "✓" : "✕"}
                  </span>
                  <div>
                    <p style={S.reviewQ}>{q.prompt}</p>
                    <p style={S.reviewA}>
                      Таны хариулт: {q.options[mine]}
                    </p>
                    {!ok && (
                      <p style={{ ...S.reviewA, color: "#6ee7a8" }}>
                        Зөв хариулт: {q.options[q.answer]}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button style={{ ...S.finish, width: "100%" }} onClick={onExit}>
          Фолдер руу буцах
        </button>
      </main>
    </div>
  );
}

/* ---------- Загвар ---------- */

const S = {
  shell: {
    minHeight: "100vh",
    background: "#120a1c",
    color: "#f3eef7",
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  bar: {
    position: "sticky",
    top: 0,
    zIndex: 40,
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "12px 20px",
    background: "rgba(18,10,28,.85)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(255,255,255,.08)",
  },
  ghost: {
    background: "rgba(255,255,255,.07)",
    border: "1px solid rgba(255,255,255,.14)",
    color: "#f3eef7",
    padding: "8px 16px",
    borderRadius: 999,
    cursor: "pointer",
    fontSize: 14,
  },
  finish: {
    background: "#e0234a",
    border: "none",
    color: "#fff",
    padding: "9px 20px",
    borderRadius: 999,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  },
  progressWrap: { flex: 1 },
  progressLabel: { fontSize: 13, opacity: .7, marginBottom: 6 },
  track: { height: 4, background: "rgba(255,255,255,.1)", borderRadius: 4 },
  fill: {
    height: "100%",
    background: "#e0234a",
    borderRadius: 4,
    transition: "width .25s ease",
  },
  body: { maxWidth: 720, margin: "0 auto", padding: "32px 20px 64px" },
  qnum: { fontSize: 13, opacity: .55, margin: 0 },
  prompt: { fontSize: 22, lineHeight: 1.45, margin: "8px 0 28px", fontWeight: 500 },
  options: { display: "grid", gap: 10 },
  option: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    textAlign: "left",
    padding: "14px 18px",
    background: "rgba(255,255,255,.04)",
    border: "1px solid rgba(255,255,255,.1)",
    borderRadius: 12,
    color: "#f3eef7",
    fontSize: 15,
    cursor: "pointer",
  },
  optionOn: { background: "rgba(224,35,74,.15)", borderColor: "#e0234a" },
  letter: {
    width: 26, height: 26, flexShrink: 0,
    display: "grid", placeItems: "center",
    borderRadius: 7, fontSize: 13,
    background: "rgba(255,255,255,.09)",
  },
  letterOn: { background: "#e0234a", color: "#fff" },
  nav: { display: "flex", justifyContent: "space-between", marginTop: 24 },
  grid: {
    display: "flex", flexWrap: "wrap", gap: 7,
    marginTop: 32, paddingTop: 24,
    borderTop: "1px solid rgba(255,255,255,.08)",
  },
  dot: {
    width: 34, height: 34,
    borderRadius: 9,
    background: "rgba(255,255,255,.05)",
    border: "1px solid rgba(255,255,255,.1)",
    color: "#f3eef7", fontSize: 13, cursor: "pointer",
  },
  dotDone: { background: "rgba(224,35,74,.25)", borderColor: "rgba(224,35,74,.5)" },
  dotHere: { outline: "2px solid #f3eef7", outlineOffset: 1 },

  overlay: {
    position: "fixed", inset: 0, zIndex: 100,
    background: "rgba(5,2,10,.7)",
    display: "grid", placeItems: "center", padding: 20,
  },
  modal: {
    background: "#1d1229",
    border: "1px solid rgba(255,255,255,.12)",
    borderRadius: 18, padding: 28, maxWidth: 420,
  },
  modalTitle: { margin: "0 0 10px", fontSize: 19 },
  modalText: { margin: "0 0 24px", fontSize: 15, lineHeight: 1.6, opacity: .8 },
  modalRow: { display: "flex", gap: 10, justifyContent: "flex-end" },

  scoreCard: {
    textAlign: "center",
    padding: "36px 24px",
    background: "linear-gradient(160deg, rgba(224,35,74,.18), rgba(224,35,74,.04))",
    border: "1px solid rgba(224,35,74,.3)",
    borderRadius: 20,
    marginBottom: 28,
  },
  scoreBig: { fontSize: 56, fontWeight: 700, lineHeight: 1 },
  scoreOf: { fontSize: 26, opacity: .5, fontWeight: 400 },
  scoreNote: { margin: "12px 0 0", fontSize: 15 },
  scoreSkip: { margin: "6px 0 0", fontSize: 13, opacity: .6 },
  empty: { textAlign: "center", opacity: .6, padding: "40px 0" },
  review: { display: "grid", gap: 16, marginBottom: 28 },
  reviewRow: {
    display: "flex", gap: 14,
    padding: 16,
    background: "rgba(255,255,255,.04)",
    borderRadius: 12,
  },
  mark: {
    width: 24, height: 24, flexShrink: 0,
    display: "grid", placeItems: "center",
    borderRadius: "50%", fontSize: 13, fontWeight: 700,
  },
  markOk: { background: "rgba(110,231,168,.18)", color: "#6ee7a8" },
  markNo: { background: "rgba(224,35,74,.2)", color: "#ff7a95" },
  reviewQ: { margin: "0 0 6px", fontSize: 15, lineHeight: 1.5 },
  reviewA: { margin: 0, fontSize: 13, opacity: .7 },
};
