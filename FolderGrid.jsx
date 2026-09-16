import { useState } from "react";

/**
 * FolderGrid — сурах материалын фолдерын жагсаалт
 *
 * Зассан зүйл:
 *  1. Номын нүүр зураг тайрагдахгүй бүтнээрээ харагдана (object-fit: contain)
 *  2. Breadcrumb — аль ч түвшин рүү нэг дарж шилжинэ
 *  3. Буцах товч — нүүр хуудас руу үсрэхгүй, нэг алхам ухарна
 *
 * Хэрэглэх жишээ:
 *   <FolderGrid
 *     trail={[{ label: "Үндсэн", to: "/" }, { label: "IELTS 21" }]}
 *     folders={folders}
 *     onOpen={(f) => navigate(`/folder/${f.id}`)}
 *     onBack={() => navigate(-1)}
 *     onCrumb={(to) => navigate(to)}
 *   />
 *
 * folders = [
 *   { id: 21, title: "IELTS 21", subtitle: "Academic", cover: "/covers/21.jpg",
 *     subfolders: 8, tests: 8 },
 *   ...
 * ]
 */
export default function FolderGrid({
  trail = [],
  folders = [],
  onOpen,
  onBack,
  onCrumb,
  onCreate,
}) {
  return (
    <div style={S.shell}>
      <header style={S.bar}>
        {trail.length > 1 && (
          <button style={S.back} onClick={onBack}>← Буцах</button>
        )}

        <nav style={S.crumbs}>
          {trail.map((c, i) => {
            const last = i === trail.length - 1;
            return (
              <span key={i} style={S.crumbItem}>
                {last ? (
                  <span style={S.crumbNow}>{c.label}</span>
                ) : (
                  <>
                    <button style={S.crumbLink} onClick={() => onCrumb(c.to)}>
                      {c.label}
                    </button>
                    <span style={S.sep}>/</span>
                  </>
                )}
              </span>
            );
          })}
        </nav>
      </header>

      <main style={S.body}>
        {onCreate && (
          <button style={S.create} onClick={onCreate}>
            + Дэд фолдер үүсгэх
          </button>
        )}

        {folders.length === 0 ? (
          <p style={S.empty}>
            Энд материал алга. Дээрх товчоор шинэ фолдер үүсгээрэй.
          </p>
        ) : (
          <div style={S.grid}>
            {folders.map((f) => (
              <FolderCard key={f.id} folder={f} onOpen={() => onOpen(f)} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

/* ---------- Ганц карт ---------- */

function FolderCard({ folder, onOpen }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const meta = [
    folder.subfolders ? `${folder.subfolders} дэд фолдер` : null,
    folder.tests ? `${folder.tests} тест` : null,
  ].filter(Boolean);

  return (
    <button style={S.card} onClick={onOpen}>
      <div style={S.coverBox}>
        {/* Бүдэгрүүлсэн дэвсгэр — зургийн хажуугийн хоосон зайг дүүргэнэ */}
        {folder.cover && !failed && (
          <img
            src={folder.cover}
            alt=""
            aria-hidden="true"
            style={S.blurBg}
          />
        )}

        {failed || !folder.cover ? (
          <div style={S.fallback}>{folder.title?.[0] ?? "?"}</div>
        ) : (
          <img
            src={folder.cover}
            alt={folder.title}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            style={{ ...S.cover, opacity: loaded ? 1 : 0 }}
          />
        )}
      </div>

      <div style={S.meta}>
        <p style={S.title}>{folder.title}</p>
        {folder.subtitle && <p style={S.subtitle}>{folder.subtitle}</p>}
        {meta.length > 0 && <p style={S.count}>{meta.join(" · ")}</p>}
      </div>
    </button>
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
    padding: "14px 22px",
    background: "rgba(18,10,28,.88)",
    backdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(255,255,255,.08)",
  },
  back: {
    background: "rgba(255,255,255,.07)",
    border: "1px solid rgba(255,255,255,.14)",
    color: "#f3eef7",
    padding: "8px 16px",
    borderRadius: 999,
    cursor: "pointer",
    fontSize: 14,
    flexShrink: 0,
  },
  crumbs: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 2,
    fontSize: 14,
    minWidth: 0,
  },
  crumbItem: { display: "inline-flex", alignItems: "center", gap: 2 },
  crumbLink: {
    background: "none",
    border: "none",
    color: "#b9a8c9",
    cursor: "pointer",
    fontSize: 14,
    padding: "4px 6px",
    borderRadius: 6,
  },
  crumbNow: { color: "#f3eef7", padding: "4px 6px", fontWeight: 500 },
  sep: { opacity: .3 },

  body: { maxWidth: 1080, margin: "0 auto", padding: "28px 22px 64px" },

  create: {
    width: "100%",
    padding: "18px",
    marginBottom: 28,
    background: "transparent",
    border: "1.5px dashed rgba(224,35,74,.45)",
    borderRadius: 14,
    color: "#ff7a95",
    fontSize: 15,
    cursor: "pointer",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
    gap: 20,
  },

  card: {
    display: "flex",
    flexDirection: "column",
    padding: 0,
    background: "rgba(255,255,255,.04)",
    border: "1px solid rgba(255,255,255,.1)",
    borderRadius: 16,
    overflow: "hidden",
    cursor: "pointer",
    textAlign: "left",
    color: "inherit",
  },

  /* Номын нүүрний харьцаа — 3:4. Карт өөрөө зурагтаа тохирно. */
  coverBox: {
    position: "relative",
    width: "100%",
    aspectRatio: "3 / 4",
    overflow: "hidden",
    background: "#1d1229",
  },

  /* Бүдэгрүүлсэн дэвсгэр: хажуугийн хоосон зайг дүүргэнэ */
  blurBg: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    filter: "blur(22px) saturate(1.3)",
    transform: "scale(1.15)",
    opacity: .45,
  },

  /* Гол зураг: contain — тайрахгүй, бүтнээрээ багтана */
  cover: {
    position: "relative",
    width: "100%",
    height: "100%",
    objectFit: "contain",
    objectPosition: "center",
    transition: "opacity .3s ease",
  },

  fallback: {
    position: "absolute",
    inset: 0,
    display: "grid",
    placeItems: "center",
    fontSize: 40,
    fontWeight: 700,
    color: "rgba(255,255,255,.25)",
  },

  meta: { padding: "12px 14px 14px" },
  title: { margin: 0, fontSize: 15, fontWeight: 600 },
  subtitle: { margin: "3px 0 0", fontSize: 13, opacity: .65 },
  count: { margin: "8px 0 0", fontSize: 12, opacity: .5 },

  empty: { textAlign: "center", opacity: .55, padding: "60px 0" },
};
