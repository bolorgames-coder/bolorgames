// ══════════════════════════════════════════════════════════════
// SIZE IT UP — бодит хэмжээг таах тоглоом (Bolor Games)
// Нууц объектын дүрсийг танил объектуудын хажууд жинхэнэ харьцаагаар
// томруулж/жижигрүүлээд таамгаа баталгаажуулна. Ойрхон таавал их оноо.
// ══════════════════════════════════════════════════════════════
import { collection, doc, getDoc, getDocs, query, where, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
// ── SIZE IT UP — вектор зургууд (бүгд анхны, өөрийн зурсан) ──
// Зураг бүр: [W, H, '<svg дотор>'] — доод ирмэг нь газар (y = H).
const P={sky:'#8EC5FF',ink:'#1F2A44',gold:'#E3A72F',gold2:'#C98A12',red:'#D9473A',blue:'#2F6FD6',teal:'#1FA79B',
  green:'#4BAE4F',dgreen:'#2E7D32',brown:'#8B5A2B',dbrown:'#5D3A1A',tan:'#D8B27A',sand:'#E9C46A',grey:'#9AA5B1',
  dgrey:'#5B6675',lgrey:'#D5DBE2',white:'#FFFFFF',cream:'#F6EBD9',glass:'#7FB3E6',glass2:'#4E8FD1',stone:'#CBB79A',
  pink:'#F2A7A0',orange:'#F08A24',black:'#262626',silver:'#C9D1DA'};

function win(x,y,w,h,cols,rows,gx,gy,c){ let s=''; const cw=(w-gx*(cols+1))/cols, ch=(h-gy*(rows+1))/rows;
  for(let r=0;r<rows;r++) for(let k=0;k<cols;k++) s+=`<rect x="${(x+gx+k*(cw+gx)).toFixed(1)}" y="${(y+gy+r*(ch+gy)).toFixed(1)}" width="${cw.toFixed(1)}" height="${ch.toFixed(1)}" fill="${c||P.glass}"/>`;
  return s; }
function tower(W,H,body,glass,opts={}){
  const {top=0,cols=4,rows=18,crown=''}=opts;
  return `<rect x="0" y="${top}" width="${W}" height="${H-top}" fill="${body}"/>${win(0,top,W,H-top,cols,rows,W*0.06,(H-top)*0.012,glass)}${crown}`;
}
const ART={
// ═══ МОНГОЛ ═══
turiin_ordon:[300,94,`
 <rect x="0" y="40" width="300" height="54" fill="${P.cream}"/>
 <rect x="0" y="34" width="300" height="8" fill="${P.stone}"/>
 ${win(6,46,90,40,6,2,4,5,P.glass2)}${win(204,46,90,40,6,2,4,5,P.glass2)}
 <rect x="96" y="22" width="108" height="72" fill="#EFE2CB"/>
 <rect x="90" y="16" width="120" height="8" fill="${P.stone}"/>
 <path d="M100 16 L150 2 L200 16 Z" fill="${P.stone}"/>
 ${Array.from({length:8},(_,i)=>`<rect x="${102+i*13.2}" y="26" width="5" height="62" fill="#FFF8EC"/>`).join('')}
 <rect x="96" y="88" width="108" height="6" fill="${P.stone}"/>
 <rect x="138" y="54" width="24" height="34" fill="${P.gold}"/>
 <circle cx="150" cy="42" r="7" fill="${P.gold}"/>`],
chinggis_horse:[100,100,`
 <g fill="#C7CFD8" stroke="#8C99A8" stroke-width="1">
 <path d="M8 60 Q4 42 20 34 L30 20 Q34 14 38 20 L36 30 Q52 28 70 32 Q86 30 92 42 Q98 52 90 58 L88 96 L80 96 L80 64 Q66 70 48 68 L44 96 L36 96 L36 66 Q22 70 22 96 L14 96 L16 66 Q10 64 8 60 Z"/>
 <path d="M44 32 Q42 16 52 8 Q58 4 62 10 Q66 18 62 28 Z"/>
 <circle cx="55" cy="8" r="6"/>
 <path d="M49 4 Q55 -2 61 4 L60 7 L50 7 Z" fill="#AEB9C5"/>
 <path d="M62 14 L84 10 L86 13 L64 18 Z"/>
 </g>`],
central_tower:[40,108,`${tower(40,108,P.glass2,'#A9CFF3',{top:6,cols:5,rows:22})}<path d="M0 6 L40 0 L40 6 Z" fill="${P.dgrey}"/>`],
blue_sky:[44,105,`<path d="M4 105 L4 14 Q22 -6 40 14 L40 105 Z" fill="#3B7FD8"/><path d="M8 105 L8 18 Q22 2 36 18 L36 105 Z" fill="#9CC7F4" opacity=".55"/>
 ${Array.from({length:22},(_,i)=>`<rect x="6" y="${20+i*3.8}" width="32" height=".8" fill="#2C5FA8"/>`).join('')}`],
shangrila:[46,136,`${tower(40,136,'#6C7C93','#B8D0EA',{top:4,cols:4,rows:28})}<rect x="40" y="30" width="6" height="106" fill="#4F5E73"/><rect x="0" y="0" width="40" height="5" fill="${P.dgrey}"/>`],
eco_tower:[50,243,`<path d="M6 243 L10 20 L25 0 L40 20 L44 243 Z" fill="#2F9E8F"/>${Array.from({length:48},(_,i)=>`<rect x="${11-i*0.07}" y="${24+i*4.5}" width="${28+i*0.14}" height="2.2" fill="#9FE3D7" opacity=".8"/>`).join('')}<rect x="24" y="0" width="2" height="12" fill="${P.dgrey}"/>`],
soyombo_tower:[42,120,`${tower(42,120,'#8A6E4B','#E8D3A8',{top:8,cols:5,rows:24})}<path d="M0 8 L21 0 L42 8 Z" fill="#6B5235"/>`],
khan_bank_tower:[40,112,`${tower(40,112,'#2E7D57','#A5D9BE',{top:6,cols:4,rows:22})}<rect x="0" y="0" width="40" height="6" fill="#1E5C3F"/>`],
megjid:[40,100,`
 <path d="M8 100 L12 60 Q10 40 20 34 Q30 40 28 60 L32 100 Z" fill="${P.gold}"/>
 <path d="M12 60 Q20 66 28 60 L30 76 Q20 82 10 76 Z" fill="${P.gold2}"/>
 <path d="M10 46 L2 30 L6 28 L14 42 Z M30 46 L38 30 L34 28 L26 42 Z" fill="${P.gold}"/>
 <circle cx="20" cy="26" r="8" fill="${P.gold}"/>
 <path d="M13 20 L16 10 L20 16 L24 10 L27 20 Z" fill="${P.gold2}"/>
 <rect x="18" y="4" width="4" height="7" fill="${P.gold2}"/>`],
ger:[100,40,`
 <path d="M2 40 L2 24 L50 24 L98 24 L98 40 Z" fill="#FBF7EF" stroke="#C9B89A" stroke-width=".8"/>
 <path d="M0 25 Q50 -8 100 25 Z" fill="#FFFFFF" stroke="#C9B89A" stroke-width=".8"/>
 <path d="M2 25 L98 25" stroke="#8E7AB5" stroke-width="2"/>
 <path d="M10 22 Q50 -2 90 22" fill="none" stroke="#8E7AB5" stroke-width="1"/>
 <path d="M0 32 L100 32" stroke="#8E7AB5" stroke-width="1.6"/>
 <rect x="42" y="28" width="16" height="12" fill="${P.orange}"/><rect x="44" y="30" width="5" height="10" fill="${P.red}"/><rect x="51" y="30" width="5" height="10" fill="${P.red}"/>
 <circle cx="50" cy="4" r="3" fill="#C9B89A"/>`],
mn_horse:[110,100,`
 <path d="M18 46 Q20 30 40 30 L74 30 Q80 14 90 6 Q96 2 100 6 L106 20 Q108 26 102 28 L94 26 Q92 40 86 46 L84 100 L77 100 L76 60 L44 62 L40 100 L33 100 L30 62 Q20 60 18 46 Z" fill="${P.brown}"/>
 <path d="M76 30 Q82 12 92 6 L88 22 Z" fill="${P.dbrown}"/>
 <path d="M18 46 Q8 50 4 70 Q10 62 18 56 Z" fill="${P.dbrown}"/>
 <rect x="33" y="94" width="7" height="6" fill="${P.ink}"/><rect x="77" y="94" width="7" height="6" fill="${P.ink}"/>`],
mn_cattle:[150,100,`
 <path d="M14 30 Q12 18 30 18 L104 18 Q118 14 126 22 L140 26 Q148 30 142 40 L132 44 Q126 52 116 50 L112 100 L104 100 L102 62 L44 62 L42 100 L34 100 L32 58 Q16 52 14 30 Z" fill="#7A4B2A"/>
 <path d="M60 18 Q76 26 92 18 Q90 44 70 46 Q56 40 60 18 Z" fill="#F4EDE4"/>
 <path d="M124 22 Q130 10 138 8 L136 14 Q132 16 130 22 Z" fill="#EDE3D3"/>
 <path d="M14 30 Q6 40 8 66 L12 66 Q12 46 18 38 Z" fill="#5A3720"/>`],
camel:[130,100,`
 <path d="M10 56 Q10 40 26 38 Q30 18 44 18 Q54 18 56 34 Q62 18 74 18 Q88 18 90 38 L104 40 Q110 24 112 12 Q114 4 120 6 L126 10 Q128 14 122 16 L118 18 Q116 38 108 52 Q104 58 96 58 L94 100 L87 100 L86 64 L36 64 L34 100 L27 100 L26 62 Q12 62 10 56 Z" fill="${P.tan}"/>
 <path d="M44 18 Q34 22 30 38 L58 38 Q56 22 44 18 Z M74 18 Q64 22 62 38 L90 38 Q88 22 74 18 Z" fill="#C99A5B"/>`],
takhi:[110,100,`
 <path d="M18 48 Q20 32 40 32 L74 32 Q80 16 90 8 Q96 4 100 8 L106 22 Q108 28 102 30 L94 28 Q92 42 86 48 L84 100 L77 100 L76 62 L44 64 L40 100 L33 100 L30 64 Q20 62 18 48 Z" fill="#C8A06A"/>
 <path d="M76 32 Q82 14 90 8 L90 16 Q86 22 84 32 Z" fill="#3A2A1A"/>
 <path d="M96 16 L106 22 Q108 28 102 30 L94 28 Z" fill="#F1E4CC"/>
 <path d="M30 64 L33 100 L40 100 L41 80 Z M77 76 L77 100 L84 100 L84 76 Z" fill="#3A2A1A"/>
 <path d="M18 48 Q8 52 6 74 L12 70 Q14 58 20 56 Z" fill="#3A2A1A"/>`],
bankhar:[110,75,`
 <path d="M14 30 Q14 18 30 18 L72 18 Q78 6 90 4 Q100 4 104 14 L108 22 Q106 28 98 28 Q92 36 86 38 L84 75 L77 75 L76 44 L36 46 L34 75 L27 75 L26 44 Q16 40 14 30 Z" fill="#2A2522"/>
 <path d="M98 22 Q104 22 106 26 Q100 30 94 28 Z" fill="#C88B4A"/>
 <circle cx="92" cy="14" r="2" fill="#C88B4A"/>
 <path d="M14 26 Q2 20 4 6 Q10 18 18 20 Z" fill="#2A2522"/>
 <path d="M80 4 L84 -2 L88 6 Z" fill="#2A2522"/>
 <rect x="26" y="66" width="8" height="9" fill="#C88B4A"/><rect x="77" y="66" width="7" height="9" fill="#C88B4A"/>`],
irves:[150,56,`
 <path d="M10 24 Q12 12 28 12 L88 12 Q96 2 108 2 Q118 4 120 14 Q118 22 110 22 Q106 30 100 30 L98 56 L91 56 L90 34 L44 34 L42 56 L35 56 L34 32 Q14 32 10 24 Z" fill="#E3E3DC"/>
 <path d="M10 24 Q0 30 2 46 Q4 54 12 52 Q8 44 12 34 Z" fill="#E3E3DC"/>
 ${[[30,18],[44,16],[58,20],[72,16],[84,22],[50,26],[66,28],[38,26],[100,10],[110,8]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="3" fill="none" stroke="#5A5A52" stroke-width="1.4"/>`).join('')}
 <circle cx="112" cy="10" r="1.6" fill="#6BAA4E"/>`],
argali:[120,110,`
 <path d="M16 54 Q18 38 36 38 L74 38 Q80 28 88 24 Q98 22 102 30 L106 40 Q102 46 94 44 Q90 52 84 54 L82 110 L75 110 L74 68 L40 68 L38 110 L31 110 L30 66 Q18 64 16 54 Z" fill="#A8845A"/>
 <path d="M86 26 Q72 8 86 2 Q104 -2 104 16 Q102 30 92 30 Q96 18 90 14 Q84 14 88 24 Z" fill="#D9C7A6" stroke="#9B8460" stroke-width="1"/>
 <path d="M36 38 L74 38 L74 46 Q56 52 36 46 Z" fill="#E8DCC6"/>`],
morin_khuur:[30,115,`
 <path d="M10 2 Q20 -2 22 8 Q26 14 20 18 L18 22 L12 22 Q6 14 10 2 Z" fill="${P.dbrown}"/>
 <rect x="13" y="20" width="4" height="58" fill="${P.brown}"/>
 <rect x="9" y="26" width="12" height="2" fill="${P.ink}"/><rect x="9" y="32" width="12" height="2" fill="${P.ink}"/>
 <path d="M3 76 L27 76 L25 110 L5 110 Z" fill="#9E6B3A"/>
 <path d="M7 80 L23 80 L22 106 L8 106 Z" fill="#B98250"/>
 <path d="M14 22 L14 104 M16 22 L16 104" stroke="#EDE3D3" stroke-width=".5"/>
 <rect x="11" y="110" width="8" height="5" fill="${P.dbrown}"/>`],
tugrik:[152,72,`
 <rect x="0" y="0" width="152" height="72" rx="3" fill="#B57EDC"/>
 <rect x="4" y="4" width="144" height="64" rx="2" fill="#E9C9F0"/>
 <circle cx="40" cy="36" r="22" fill="#D3A3E6"/><text x="40" y="44" text-anchor="middle" font-size="20" font-family="sans-serif" font-weight="700" fill="#5B2C83">₮</text>
 <text x="124" y="28" text-anchor="middle" font-size="18" font-family="sans-serif" font-weight="800" fill="#5B2C83">5000</text>
 <rect x="76" y="46" width="64" height="4" fill="#C79BDD"/><rect x="76" y="54" width="44" height="3" fill="#C79BDD"/>`],
khongor:[300,100,`
 <path d="M0 100 Q40 70 80 60 Q120 30 160 0 Q190 30 220 50 Q260 70 300 100 Z" fill="#E8B964"/>
 <path d="M160 0 Q190 30 220 50 Q260 70 300 100 L240 100 Q200 60 160 0 Z" fill="#D49A44"/>`],
khuiten:[300,100,`
 <path d="M0 100 L80 40 L110 56 L170 0 L210 34 L240 24 L300 100 Z" fill="#7C8794"/>
 <path d="M170 0 L196 22 L184 20 L176 30 L164 18 L152 18 Z M240 24 L256 44 L246 40 L236 34 Z M80 40 L94 50 L84 50 L76 46 Z" fill="#FFFFFF"/>`],
archery:[150,20,`
 <rect x="0" y="16" width="150" height="4" fill="#7CB66B"/>
 <path d="M4 16 L4 2 M2 4 Q12 9 2 14" stroke="${P.dbrown}" stroke-width="1.4" fill="none"/>
 <path d="M6 9 L24 9" stroke="${P.dbrown}" stroke-width="1"/><path d="M24 9 L21 7 L21 11 Z" fill="${P.ink}"/>
 ${Array.from({length:6},(_,i)=>`<rect x="${126+i*4}" y="10" width="3.6" height="6" fill="${i%2?'#C33':'#2E6BD6'}"/>`).join('')}`],
golden_eagle:[210,60,`
 <path d="M0 22 Q30 6 70 14 Q90 18 100 28 Q110 18 130 14 Q170 6 210 22 Q180 26 150 32 Q130 38 116 40 L112 54 L106 46 L100 60 L94 46 L88 54 L84 40 Q70 38 50 32 Q22 26 0 22 Z" fill="#6B4423"/>
 <path d="M98 28 Q104 20 110 26 L108 32 Z" fill="#E6C27A"/>
 <path d="M108 26 L114 28 L108 30 Z" fill="${P.gold}"/>`],
mn_man:[46,169,`
 <circle cx="23" cy="13" r="12" fill="#E2B48C"/>
 <path d="M11 12 Q12 0 23 0 Q35 0 35 12 Q30 6 23 6 Q16 6 11 12 Z" fill="#2A1E14"/>
 <path d="M6 32 Q8 26 23 26 Q38 26 40 32 L44 92 L36 92 L34 52 L34 100 L12 100 L12 52 L10 92 L2 92 Z" fill="#2F6FD6"/>
 <path d="M10 32 L36 32 L34 40 L12 40 Z" fill="${P.gold}"/>
 <rect x="12" y="100" width="22" height="6" fill="${P.gold}"/>
 <path d="M12 106 L22 106 L21 169 L12 169 Z M24 106 L34 106 L34 169 L25 169 Z" fill="#33363D"/>`],
// ═══ ДЭЛХИЙН БАРИЛГА ═══
eiffel:[110,330,`
 <path d="M0 330 Q30 250 44 160 L50 60 L54 0 L56 0 L60 60 L66 160 Q80 250 110 330 L84 330 Q72 270 55 250 Q38 270 26 330 Z" fill="#8A6A4A"/>
 <rect x="30" y="196" width="50" height="8" fill="#6E5236"/><rect x="40" y="110" width="30" height="6" fill="#6E5236"/>
 ${Array.from({length:12},(_,i)=>`<path d="M${14+i*1.5} ${320-i*10} L${96-i*1.5} ${320-i*10}" stroke="#A07E5A" stroke-width=".8"/>`).join('')}`],
burj:[90,828,`
 <path d="M10 828 L18 600 L28 420 L36 250 L42 120 L45 0 L48 120 L54 250 L62 420 L72 600 L80 828 Z" fill="#A9C4DE"/>
 <path d="M30 828 L34 520 L40 300 L45 0 L46 300 L52 520 L58 828 Z" fill="#D5E4F2"/>
 ${Array.from({length:30},(_,i)=>`<rect x="${12+i*0.9}" y="${800-i*24}" width="${66-i*1.8}" height="1.5" fill="#7FA3C6" opacity=".7"/>`).join('')}`],
liberty:[40,93,`
 <path d="M4 93 L6 60 L34 60 L36 93 Z" fill="#B9A78A"/><rect x="2" y="56" width="36" height="5" fill="#A8957A"/>
 <path d="M12 56 L14 30 Q14 22 20 22 Q26 22 26 30 L28 56 Z" fill="#6FB7A0"/>
 <circle cx="20" cy="18" r="4" fill="#6FB7A0"/><path d="M15 16 L13 11 L17 14 L20 9 L23 14 L27 11 L25 16 Z" fill="#5FA58E"/>
 <path d="M24 26 L30 6 L33 7 L28 28 Z" fill="#6FB7A0"/><path d="M29 6 Q31 0 34 4 Q34 7 31 7 Z" fill="${P.gold}"/>`],
pyramid:[230,138.5,`<path d="M0 138.5 L115 0 L230 138.5 Z" fill="${P.sand}"/><path d="M115 0 L230 138.5 L150 138.5 Z" fill="#CFA24E"/>
 ${Array.from({length:12},(_,i)=>`<path d="M${9.6*i+4} ${138.5-11.5*i-2} L${226-9.6*i} ${138.5-11.5*i-2}" stroke="#C3974A" stroke-width=".7"/>`).join('')}`],
bigben:[24,96,`
 <rect x="3" y="30" width="18" height="66" fill="#C9A86C"/>${win(3,40,18,52,2,10,2,1.4,'#8C6E3C')}
 <rect x="1" y="18" width="22" height="14" fill="#B8955A"/><circle cx="12" cy="25" r="5.5" fill="#F7F1E0" stroke="#5C4520" stroke-width="1"/>
 <path d="M12 25 L12 21 M12 25 L15 26" stroke="#222" stroke-width=".8"/>
 <path d="M2 18 L12 0 L22 18 Z" fill="#5E6B4E"/>`],
pisa:[30,56,`<g transform="rotate(4 15 56)">
 <rect x="4" y="4" width="22" height="52" fill="#F2EBDD" stroke="#CFC3AC" stroke-width=".8"/>
 ${Array.from({length:7},(_,i)=>`<rect x="4" y="${6+i*7}" width="22" height="1.2" fill="#CFC3AC"/>${[7,12,17,22].map(x=>`<rect x="${x}" y="${7.5+i*7}" width="2" height="5" fill="#D9CEB8"/>`).join('')}`).join('')}
 <rect x="7" y="0" width="16" height="5" fill="#E8DFCC"/></g>`],
redeemer:[30,30,`
 <rect x="13" y="10" width="4" height="20" fill="#E9E6DF"/>
 <path d="M1 8 L29 8 L29 11 L18 12 L17.5 30 L12.5 30 L12 12 L1 11 Z" fill="#E9E6DF"/>
 <circle cx="15" cy="5" r="3" fill="#E9E6DF"/>`],
taj:[110,73,`
 <rect x="20" y="40" width="70" height="33" fill="#F7F4EE"/>
 <path d="M34 40 Q34 14 55 10 Q76 14 76 40 Z" fill="#FFFFFF" stroke="#DDD6C8" stroke-width=".8"/>
 <path d="M55 10 L55 0" stroke="#D6B656" stroke-width="1.4"/>
 <rect x="46" y="50" width="18" height="23" rx="9" fill="#E3DCCB"/>
 <rect x="4" y="20" width="5" height="53" fill="#F7F4EE"/><rect x="101" y="20" width="5" height="53" fill="#F7F4EE"/>
 <circle cx="6.5" cy="19" r="3" fill="#FFFFFF"/><circle cx="103.5" cy="19" r="3" fill="#FFFFFF"/>`],
empire:[60,443,`
 <rect x="0" y="230" width="60" height="213" fill="#B8B1A5"/><rect x="8" y="140" width="44" height="92" fill="#C4BDB1"/>
 <rect x="16" y="90" width="28" height="52" fill="#CFC8BC"/><rect x="22" y="60" width="16" height="32" fill="#D8D2C7"/>
 <rect x="27" y="30" width="6" height="32" fill="#D8D2C7"/><rect x="29.4" y="0" width="1.2" height="32" fill="#8F877A"/>
 ${win(0,232,60,208,6,40,2.2,1.6,'#E7D9A8')}${win(8,142,44,88,4,18,2,1.4,'#E7D9A8')}`],
skytree:[60,634,`
 <path d="M10 634 L24 300 L27 100 L30 0 L33 100 L36 300 L50 634 Z" fill="#E6EEF5" stroke="#9FB3C6" stroke-width="1"/>
 <rect x="20" y="340" width="20" height="14" fill="#9FB3C6"/><rect x="23" y="440" width="14" height="10" fill="#9FB3C6"/>
 ${Array.from({length:40},(_,i)=>`<path d="M${11+i*0.35} ${630-i*13} L${49-i*0.35} ${622-i*13}" stroke="#B9C9D8" stroke-width=".7"/>`).join('')}`],
colosseum:[190,48,`
 <path d="M0 48 L0 8 Q95 -4 190 8 L190 48 Z" fill="#D9B98C"/>
 ${[10,22,34].map(y=>Array.from({length:16},(_,i)=>`<rect x="${5+i*11.5}" y="${y}" width="6" height="9" rx="3" fill="#8F6E45"/>`).join('')).join('')}
 <path d="M150 48 L150 14 Q172 10 190 8 L190 48 Z" fill="#C9A676"/>`],
opera:[180,65,`
 <rect x="0" y="54" width="180" height="11" fill="#D9C9AE"/>
 <path d="M20 54 Q30 6 60 0 Q50 30 52 54 Z M50 54 Q62 18 92 12 Q80 36 82 54 Z M86 54 Q100 22 130 18 Q118 40 120 54 Z M124 54 Q134 34 160 32 Q150 44 152 54 Z" fill="#FFFFFF" stroke="#C9C2B4" stroke-width="1"/>`],
petronas:[90,452,`
 ${[0,52].map(x=>`<path d="M${x+4} 452 L${x+4} 120 L${x+10} 60 L${x+19} 0 L${x+28} 60 L${x+34} 120 L${x+34} 452 Z" fill="#C3CCD6"/>${win(x+4,124,30,326,3,60,1.5,1.1,'#8DA2B8')}`).join('')}
 <rect x="34" y="250" width="22" height="6" fill="#8DA2B8"/>`],
golden_gate:[60,227,`
 <rect x="8" y="0" width="10" height="227" fill="#C0362C"/><rect x="42" y="0" width="10" height="227" fill="#C0362C"/>
 ${[30,90,150,200].map(y=>`<rect x="8" y="${y}" width="44" height="8" fill="#A92E25"/>`).join('')}
 <rect x="0" y="150" width="60" height="6" fill="#A92E25"/>`],
unity:[40,182,`
 <path d="M8 182 L10 100 Q8 60 14 46 L26 46 Q32 60 30 100 L32 182 Z" fill="#9A7B57"/>
 <path d="M10 60 L4 120 L8 120 L14 70 Z M30 60 L36 120 L32 120 L26 70 Z" fill="#8A6C4A"/>
 <circle cx="20" cy="38" r="8" fill="#9A7B57"/>`],
// ═══ БАЙГАЛЬ ═══
everest:[300,100,`
 <path d="M0 100 L60 60 L90 70 L150 0 L190 30 L220 22 L300 100 Z" fill="#6E7B8B"/>
 <path d="M150 0 L176 20 L166 22 L160 30 L148 20 L134 20 Z M220 22 L238 40 L228 38 L216 32 Z" fill="#FFFFFF"/>`],
redwood:[40,116,`
 <rect x="16" y="40" width="8" height="76" fill="#8B4A2B"/>
 <path d="M20 0 L36 40 L28 38 L38 70 L24 64 L20 72 L16 64 L2 70 L12 38 L4 40 Z" fill="#2E6B3A"/>`],
angel_falls:[120,979,`
 <path d="M0 979 L0 0 L48 0 L48 979 Z" fill="#7C6A55"/><path d="M72 979 L72 0 L120 0 L120 979 Z" fill="#6E5C48"/>
 <path d="M48 0 Q56 400 52 979 L68 979 Q64 400 72 0 Z" fill="#CFE8FA"/>
 <path d="M54 0 Q60 500 58 979" stroke="#FFFFFF" stroke-width="2" fill="none"/>`],
niagara:[200,57,`<rect x="0" y="0" width="200" height="10" fill="#4F8BC9"/><rect x="0" y="10" width="200" height="47" fill="#CFE8FA"/>
 ${Array.from({length:20},(_,i)=>`<path d="M${5+i*10} 10 L${5+i*10} 57" stroke="#FFFFFF" stroke-width="1.5" opacity=".8"/>`).join('')}`],
// ═══ АМЬТАН ═══
blue_whale:[300,50,`
 <path d="M0 28 Q20 6 80 8 Q180 10 250 22 L280 6 Q290 4 292 10 L284 26 L298 40 Q296 46 288 44 L262 32 Q180 44 80 44 Q20 44 0 28 Z" fill="#5A7FA8"/>
 <path d="M10 32 Q40 42 100 42 Q60 36 30 30 Z" fill="#A9C1DA"/><circle cx="26" cy="22" r="1.6" fill="#1F2A44"/>`],
giraffe:[80,140,`
 <path d="M14 70 Q14 58 28 58 L50 58 L58 18 Q60 8 66 6 L72 4 Q78 6 76 12 L72 14 L64 60 Q66 70 60 76 L58 140 L52 140 L50 84 L26 84 L24 140 L18 140 L16 82 Q12 78 14 70 Z" fill="#E7B04F"/>
 ${[[24,66],[36,64],[46,70],[30,76],[56,40],[60,28],[54,52],[42,78]].map(([x,y])=>`<rect x="${x}" y="${y}" width="6" height="5" rx="1.5" fill="#9C5B1F"/>`).join('')}
 <path d="M66 6 L66 0 M70 4 L71 -1" stroke="#9C5B1F" stroke-width="1.6"/>`],
elephant:[140,100,`
 <path d="M10 46 Q10 14 50 12 L96 12 Q110 6 120 14 Q132 22 130 44 L128 70 Q130 86 124 96 L118 96 Q122 82 120 64 Q116 56 112 62 L110 100 L98 100 L96 66 L50 66 L48 100 L36 100 L34 64 Q12 62 10 46 Z" fill="#9AA0A8"/>
 <path d="M96 16 Q82 22 86 42 Q96 50 104 40 Q106 24 96 16 Z" fill="#868C95"/>
 <path d="M118 44 L132 50 L120 52 Z" fill="#F4F0E6"/><circle cx="114" cy="28" r="1.8" fill="#1F2A44"/>`],
ostrich:[70,100,`
 <path d="M10 50 Q14 36 34 36 Q52 36 54 50 Q54 62 40 64 L38 100 L34 100 L33 66 L28 66 L27 100 L23 100 L24 62 Q10 60 10 50 Z" fill="#2A2522"/>
 <path d="M48 42 Q52 26 54 12 Q56 4 62 4 Q68 6 66 10 L60 12 Q58 26 54 44 Z" fill="#E6B8A2"/>
 <path d="M20 44 Q30 40 40 46 Q30 52 20 50 Z" fill="#F3F0EA"/>`],
trex:[300,100,`
 <path d="M0 40 Q40 30 100 34 Q130 20 170 22 L210 8 Q240 0 262 8 Q280 14 276 28 L250 34 L246 44 Q232 50 214 48 L208 60 L196 56 Q190 64 180 66 L178 100 L166 100 L164 70 L136 70 L132 100 L120 100 L118 64 Q60 56 0 40 Z" fill="#5C8A3C"/>
 <path d="M246 30 L272 28 L270 32 Z" fill="#FFFFFF"/><circle cx="244" cy="16" r="2.4" fill="#1F2A44"/>`],
lion:[150,120,`
 <path d="M14 56 Q16 44 32 44 L96 44 Q104 30 118 28 Q136 30 138 50 Q138 64 126 68 L124 120 L116 120 L114 76 L44 76 L42 120 L34 120 L32 72 Q16 70 14 56 Z" fill="#D9A24C"/>
 <circle cx="118" cy="50" r="22" fill="#9C5E22"/><circle cx="122" cy="52" r="13" fill="#E0AE5C"/><circle cx="126" cy="48" r="1.8" fill="#1F2A44"/>
 <path d="M14 56 Q2 62 2 80 Q8 78 6 70 Q10 64 16 64 Z" fill="#D9A24C"/><circle cx="4" cy="82" r="3" fill="#9C5E22"/>`],
cat:[60,25,`
 <path d="M6 12 Q8 6 16 6 L40 6 Q44 0 50 0 Q58 2 56 10 Q54 14 50 14 L48 25 L44 25 L43 16 L18 16 L17 25 L13 25 L12 15 Q6 15 6 12 Z" fill="#E08E45"/>
 <path d="M46 0 L47 -4 L50 0 Z M53 1 L56 -3 L56 3 Z" fill="#E08E45"/>
 <path d="M6 12 Q-2 8 2 0" stroke="#E08E45" stroke-width="3" fill="none"/>`],
gorilla:[60,170,`
 <path d="M10 50 Q8 30 30 26 Q52 30 50 50 L58 110 L50 112 L46 80 L46 120 L42 170 L32 170 L30 124 L28 170 L18 170 L14 120 L14 80 L10 112 L2 110 Z" fill="#2B2B2E"/>
 <circle cx="30" cy="18" r="13" fill="#2B2B2E"/><ellipse cx="30" cy="22" rx="7" ry="6" fill="#55525A"/>`],
shark:[300,70,`
 <path d="M0 40 Q40 18 120 20 L150 0 L170 22 Q230 26 262 34 L292 10 L298 14 L284 40 L298 64 L292 66 L262 46 Q200 58 120 56 Q40 56 0 40 Z" fill="#6E8299"/>
 <path d="M8 44 Q60 54 140 52 Q80 48 30 42 Z" fill="#E6ECF2"/><circle cx="26" cy="34" r="1.8" fill="#1F2A44"/>`],
penguin:[50,115,`
 <path d="M10 110 Q4 70 12 40 Q16 14 26 10 Q36 14 40 40 Q48 70 42 110 Z" fill="#232A33"/>
 <path d="M16 106 Q12 72 18 46 Q22 30 26 30 Q32 32 34 46 Q40 72 36 106 Z" fill="#F7F7F2"/>
 <path d="M18 18 Q22 24 20 32 L16 26 Z" fill="#F2B431"/><path d="M14 110 L22 110 L20 115 L12 115 Z M30 110 L38 110 L40 115 L32 115 Z" fill="#F2B431"/>`],
honeybee:[50,15,`<ellipse cx="26" cy="9" rx="16" ry="6" fill="#F2B431"/>${[20,26,32].map(x=>`<rect x="${x}" y="3" width="3" height="12" fill="#2A2522"/>`).join('')}
 <circle cx="9" cy="8" r="5" fill="#2A2522"/><ellipse cx="24" cy="2" rx="7" ry="3.5" fill="#D6ECFA" opacity=".9"/>`],
bee_hummingbird:[55,22,`
 <path d="M4 12 Q12 4 26 6 Q38 8 44 12 L54 10 L46 14 Q38 18 26 18 Q12 18 4 12 Z" fill="#2E9F6E"/><path d="M0 11 L6 11" stroke="#2A2522" stroke-width="1"/>
 <path d="M24 8 Q30 -6 40 0 Q34 6 30 10 Z" fill="#A9DCC5"/><circle cx="10" cy="10" r="1" fill="#1F2A44"/><path d="M12 14 Q16 18 22 16" fill="#D94F7A"/>`],
// ═══ ТЭЭВЭР ═══
a380:[300,80,`
 <path d="M10 50 Q4 40 20 34 L240 30 L272 4 L284 4 L276 32 Q298 36 298 44 Q296 52 280 52 L30 56 Q14 56 10 50 Z" fill="#F2F4F7" stroke="#B9C2CC" stroke-width="1"/>
 <path d="M120 46 L200 46 L150 78 L130 78 Z" fill="#DCE2E9"/>${Array.from({length:30},(_,i)=>`<rect x="${34+i*7}" y="38" width="3" height="3" fill="#6E8299"/>`).join('')}
 <path d="M14 42 L26 38 L26 44 Z" fill="#2A3A55"/>`],
b747:[300,85,`
 <path d="M8 52 Q2 42 14 34 Q30 22 60 26 L250 30 L276 4 L288 4 L280 34 Q298 38 298 46 Q296 54 280 54 L30 58 Q12 58 8 52 Z" fill="#FFFFFF" stroke="#B9C2CC" stroke-width="1"/>
 <path d="M120 48 L196 48 L148 82 L128 82 Z" fill="#DCE2E9"/>${Array.from({length:26},(_,i)=>`<rect x="${40+i*8}" y="40" width="3" height="3" fill="#6E8299"/>`).join('')}
 <path d="M8 50 L290 48" stroke="#2F6FD6" stroke-width="2"/>`],
titanic:[300,60,`
 <path d="M0 34 L300 34 L290 60 L12 60 Z" fill="#1F2A44"/><rect x="2" y="34" width="296" height="5" fill="#FFFFFF"/><path d="M12 56 L290 56 L288 60 L14 60 Z" fill="#B23A2E"/>
 <rect x="30" y="24" width="230" height="10" fill="#F6F1E6"/>${[70,110,150,190].map(x=>`<rect x="${x}" y="2" width="14" height="22" fill="#E6A63C"/><rect x="${x}" y="2" width="14" height="5" fill="#222"/>`).join('')}`],
saturnv:[30,110.6,`
 <rect x="6" y="40" width="18" height="66" fill="#FFFFFF" stroke="#C8CDD3" stroke-width=".8"/>
 ${[48,60,78].map(y=>`<rect x="6" y="${y}" width="18" height="3" fill="#262626"/>`).join('')}
 <path d="M8 40 L10 20 L20 20 L22 40 Z" fill="#FFFFFF" stroke="#C8CDD3" stroke-width=".8"/><path d="M12 20 L15 0 L18 20 Z" fill="#E6E8EB"/>
 <path d="M6 100 L0 110.6 L30 110.6 L24 100 Z" fill="#7C8794"/>`],
bus:[110,43.8,`
 <rect x="0" y="2" width="110" height="36" rx="5" fill="#D72E2E"/><rect x="0" y="18" width="110" height="2" fill="#B21F1F"/>
 ${win(4,4,102,12,7,1,3,1,'#CFE3F5')}${win(4,21,90,12,6,1,3,1,'#CFE3F5')}
 <circle cx="22" cy="38" r="5.8" fill="#262626"/><circle cx="88" cy="38" r="5.8" fill="#262626"/><circle cx="22" cy="38" r="2.4" fill="#9AA5B1"/><circle cx="88" cy="38" r="2.4" fill="#9AA5B1"/>`],
car:[150,48,`
 <path d="M4 36 Q4 24 20 22 L42 20 Q58 4 84 4 Q108 4 120 20 Q144 22 146 34 L146 40 L4 40 Z" fill="#2F6FD6"/>
 <path d="M50 20 Q62 8 82 8 Q100 8 110 20 Z" fill="#CFE3F5"/><rect x="78" y="8" width="3" height="12" fill="#2F6FD6"/>
 <circle cx="36" cy="40" r="8" fill="#262626"/><circle cx="116" cy="40" r="8" fill="#262626"/><circle cx="36" cy="40" r="3.4" fill="#C9D1DA"/><circle cx="116" cy="40" r="3.4" fill="#C9D1DA"/>`],
container_ship:[300,40,`
 <path d="M0 20 L300 20 L290 40 L10 40 Z" fill="#1E4F6E"/><rect x="0" y="34" width="300" height="6" fill="#B23A2E"/>
 ${Array.from({length:34},(_,i)=>`<rect x="${20+i*7.6}" y="${i%3?8:12}" width="7" height="${i%3?12:8}" fill="${['#E66A2E','#2F6FD6','#2E9F6E','#F2B431','#C0362C'][i%5]}"/>`).join('')}
 <rect x="270" y="2" width="16" height="18" fill="#F6F1E6"/>`],
iss:[110,40,`
 <rect x="0" y="18" width="110" height="4" fill="#9AA5B1"/>
 ${[2,16,80,94].map(x=>`<rect x="${x}" y="0" width="13" height="40" fill="#C99A2E" stroke="#7C5A12" stroke-width=".6"/>`).join('')}
 <rect x="42" y="14" width="26" height="12" rx="3" fill="#E6E8EB"/><rect x="50" y="10" width="10" height="20" rx="2" fill="#D5DBE2"/>`],
// ═══ САНСАР ═══
moon:[100,100,`<circle cx="50" cy="50" r="50" fill="#C9C6BE"/><circle cx="30" cy="34" r="10" fill="#B3AFA5"/><circle cx="64" cy="60" r="14" fill="#B3AFA5"/><circle cx="70" cy="26" r="6" fill="#B3AFA5"/><circle cx="34" cy="72" r="6" fill="#B3AFA5"/>`],
earth:[100,100,`<circle cx="50" cy="50" r="50" fill="#2F78C9"/><path d="M20 30 Q30 16 46 22 Q50 34 38 40 Q30 54 22 46 Q14 40 20 30 Z M56 50 Q70 44 80 56 Q84 72 70 80 Q60 76 62 66 Q54 60 56 50 Z M60 14 Q72 12 78 22 Q70 26 62 22 Z" fill="#5DAA4A"/><path d="M30 90 Q50 98 70 90 Q50 94 30 90 Z" fill="#FFFFFF"/>`],
mars:[100,100,`<circle cx="50" cy="50" r="50" fill="#C8583A"/><circle cx="34" cy="40" r="9" fill="#A9472D"/><circle cx="66" cy="64" r="12" fill="#B24E33"/><path d="M30 8 Q50 2 70 8 Q50 12 30 8 Z" fill="#F4ECE4"/>`],
jupiter:[100,100,`<circle cx="50" cy="50" r="50" fill="#D9B58A"/>${[18,30,44,58,72,84].map((y,i)=>`<path d="M${y<50?20-y/5:2} ${y} Q50 ${y+3} ${y<50?80+y/5:98} ${y}" stroke="${i%2?'#B9875A':'#E9D2B4'}" stroke-width="6" fill="none"/>`).join('')}<ellipse cx="66" cy="62" rx="9" ry="5" fill="#C0583A"/>`],
sun:[100,100,`<circle cx="50" cy="50" r="50" fill="#F7B733"/><circle cx="50" cy="50" r="42" fill="#FBCB4E"/><circle cx="36" cy="40" r="5" fill="#F09A2A" opacity=".6"/>`],
// ═══ СПОРТ ═══
basketball:[24,24,`<circle cx="12" cy="12" r="12" fill="#E8742A"/><path d="M0 12 L24 12 M12 0 L12 24 M3.5 3.5 Q12 12 3.5 20.5 M20.5 3.5 Q12 12 20.5 20.5" stroke="#3A2210" stroke-width=".8" fill="none"/>`],
soccer_ball:[22,22,`<circle cx="11" cy="11" r="11" fill="#FFFFFF" stroke="#262626" stroke-width=".6"/><path d="M11 6 L15 9 L13.5 14 L8.5 14 L7 9 Z" fill="#262626"/><path d="M11 6 L11 1 M15 9 L20 7.5 M13.5 14 L16.5 19 M8.5 14 L5.5 19 M7 9 L2 7.5" stroke="#262626" stroke-width=".7"/>`],
tennis_ball:[67,67,`<circle cx="33.5" cy="33.5" r="33.5" fill="#D7E84A"/><path d="M6 14 Q33 33 6 54 M61 14 Q34 33 61 54" stroke="#FFFFFF" stroke-width="3" fill="none"/>`],
golf_ball:[43,43,`<circle cx="21.5" cy="21.5" r="21.5" fill="#FAFAF7" stroke="#C9D1DA"/>${Array.from({length:14},(_,i)=>`<circle cx="${10+(i%4)*8+(i>7?4:0)}" cy="${10+Math.floor(i/4)*8}" r="1.6" fill="#DCE2E9"/>`).join('')}`],
soccer_goal:[732,244,`<path d="M6 244 L6 6 L726 6 L726 244" fill="none" stroke="#FFFFFF" stroke-width="12"/><path d="M6 6 L726 6" stroke="#E6E8EB" stroke-width="12"/>
 ${Array.from({length:30},(_,i)=>`<path d="M${30+i*24} 12 L${30+i*24} 244" stroke="#DCE2E9" stroke-width="1.5"/>`).join('')}${Array.from({length:9},(_,i)=>`<path d="M12 ${30+i*24} L720 ${30+i*24}" stroke="#DCE2E9" stroke-width="1.5"/>`).join('')}`],
tennis_court:[300,30,`<rect x="0" y="0" width="300" height="30" fill="#3F8FD2"/><path d="M0 1 L300 1 M0 29 L300 29 M0 4.5 L300 4.5 M0 25.5 L300 25.5 M70 4.5 L70 25.5 M230 4.5 L230 25.5 M70 15 L230 15 M150 0 L150 30" stroke="#FFFFFF" stroke-width="1.2"/>`],
pitch:[300,40,`<rect x="0" y="0" width="300" height="40" fill="#4BAE4F"/>${Array.from({length:10},(_,i)=>`<rect x="${i*30}" y="0" width="15" height="40" fill="#55B85A"/>`).join('')}
 <path d="M1 1 L299 1 L299 39 L1 39 Z M150 1 L150 39 M1 12 L24 12 L24 28 L1 28 M299 12 L276 12 L276 28 L299 28" fill="none" stroke="#FFFFFF" stroke-width="1"/><circle cx="150" cy="20" r="9" fill="none" stroke="#FFFFFF" stroke-width="1"/>`],
pool:[300,30,`<rect x="0" y="0" width="300" height="30" fill="#5BC0EB"/>${Array.from({length:7},(_,i)=>`<path d="M4 ${4+i*3.7} L296 ${4+i*3.7}" stroke="${i%2?'#F2B431':'#D9473A'}" stroke-width="1" stroke-dasharray="3 2"/>`).join('')}<rect x="0" y="0" width="300" height="30" fill="none" stroke="#E6E8EB" stroke-width="2"/>`],
// ═══ ӨДӨР ТУТАМ ═══
credit_card:[85.6,54,`<rect x="0" y="0" width="85.6" height="54" rx="3.2" fill="#2F6FD6"/><rect x="8" y="16" width="12" height="9" rx="1.5" fill="#E3C46A"/><rect x="8" y="34" width="52" height="3" fill="#BFD3F2"/><rect x="8" y="41" width="30" height="3" fill="#BFD3F2"/><circle cx="68" cy="44" r="5" fill="#E8742A" opacity=".85"/><circle cx="75" cy="44" r="5" fill="#F2B431" opacity=".85"/>`],
a4:[210,297,`<rect x="0" y="0" width="210" height="297" fill="#FFFFFF" stroke="#C9D1DA" stroke-width="2"/>${Array.from({length:18},(_,i)=>`<rect x="24" y="${40+i*13}" width="${150-(i%4)*18}" height="4" fill="#DCE2E9"/>`).join('')}<path d="M180 0 L210 0 L210 30 Z" fill="#E6E8EB"/>`],
phone:[71.6,147.6,`<rect x="0" y="0" width="71.6" height="147.6" rx="10" fill="#262626"/><rect x="3.5" y="3.5" width="64.6" height="140.6" rx="7.5" fill="#4E8FD1"/><rect x="26" y="7" width="20" height="5" rx="2.5" fill="#262626"/><path d="M3.5 100 Q36 80 68 100 L68 136 Q68 144 60 144 L11 144 Q3.5 144 3.5 136 Z" fill="#7FB3E6"/>`],
pencil:[190,8,`<rect x="10" y="0" width="160" height="8" fill="#F2B431"/><rect x="170" y="0" width="12" height="8" fill="#C9D1DA"/><rect x="182" y="0" width="8" height="8" rx="2" fill="#F2A7A0"/><path d="M10 0 L0 4 L10 8 Z" fill="#E9C9A0"/><path d="M3 2.8 L0 4 L3 5.2 Z" fill="#262626"/>`],
door:[90,203,`<rect x="0" y="0" width="90" height="203" fill="#8B5A2B"/><rect x="10" y="12" width="70" height="80" fill="#9E6B3A"/><rect x="10" y="104" width="70" height="88" fill="#9E6B3A"/><circle cx="76" cy="104" r="4" fill="${P.gold}"/>`],
rubik:[57,57,`<rect x="0" y="0" width="57" height="57" rx="4" fill="#262626"/>${Array.from({length:9},(_,i)=>`<rect x="${3+(i%3)*18}" y="${3+Math.floor(i/3)*18}" width="15" height="15" rx="2" fill="${['#D9473A','#2F6FD6','#F2B431','#2E9F6E','#FFFFFF','#F08A24'][(i*5+2)%6]}"/>`).join('')}`],
lego:[31.8,11.3,`<rect x="0" y="1.7" width="31.8" height="9.6" rx="1" fill="#D9473A"/>${[2.2,10.2,18.2,26.2].map(x=>`<rect x="${x}" y="0" width="4.8" height="2" rx="1" fill="#C73A2E"/>`).join('')}`],
battery:[14.5,50.5,`<rect x="0" y="2" width="14.5" height="48.5" rx="2" fill="#262626"/><rect x="0" y="2" width="14.5" height="14" rx="2" fill="#E3A72F"/><rect x="4.5" y="0" width="5.5" height="3" rx="1" fill="#9AA5B1"/>`],
can:[66,122,`<path d="M4 10 L62 10 L66 18 L66 108 L62 118 L4 118 L0 108 L0 18 Z" fill="#D9473A"/><rect x="6" y="4" width="54" height="7" rx="3" fill="#C9D1DA"/><rect x="6" y="117" width="54" height="5" rx="2" fill="#C9D1DA"/><path d="M0 60 Q33 44 66 60 L66 70 Q33 54 0 70 Z" fill="#FFFFFF"/>`],
container:[120,51,`<rect x="0" y="0" width="120" height="51" fill="#E66A2E"/>${Array.from({length:22},(_,i)=>`<rect x="${4+i*5.2}" y="4" width="2.4" height="43" fill="#C9541F"/>`).join('')}<rect x="0" y="0" width="120" height="3" fill="#B84414"/><rect x="0" y="48" width="120" height="3" fill="#B84414"/>`],
// ═══ ХҮН ═══
wadlow:[60,272,`<circle cx="30" cy="16" r="13" fill="#E2B48C"/><path d="M17 14 Q18 2 30 2 Q42 2 43 14 Q36 8 30 8 Q24 8 17 14 Z" fill="#3A2A1A"/>
 <path d="M10 36 Q12 30 30 30 Q48 30 50 36 L56 140 L48 140 L46 70 L46 150 L14 150 L14 70 L12 140 L4 140 Z" fill="#3B4252"/><path d="M14 150 L28 150 L27 272 L14 272 Z M32 150 L46 150 L46 272 L33 272 Z" fill="#262626"/><path d="M26 30 L34 30 L30 44 Z" fill="#FFFFFF"/>`],
newborn:[20,50,`<circle cx="10" cy="7" r="6.5" fill="#EFC6A4"/><path d="M2 16 Q2 12 10 12 Q18 12 18 16 L18 50 L2 50 Z" fill="#F2C6D6"/><path d="M4 22 Q10 26 16 22" stroke="#E3A7BE" fill="none"/>`],
person_ref:[46,170,`<circle cx="23" cy="13" r="12" fill="#5B6675"/><path d="M6 32 Q8 26 23 26 Q38 26 40 32 L44 94 L36 94 L34 54 L34 102 L12 102 L12 54 L10 94 L2 94 Z M12 102 L22 102 L21 170 L12 170 Z M24 102 L34 102 L34 170 L25 170 Z" fill="#5B6675"/>`],
};
// ── SIZE IT UP — объектуудын хэмжээ (метрээр) ба эх сурвалж ──
// dim: 'h' = өндөр, 'w' = урт/өргөн/диаметр.  mt: зураг дээрх хэмжилтийн дээд цэг (viewBox y)
// ref: харьцуулах «танил» объект болж болох эсэх
const SI_CATS=[
  {id:'mn',label:'Монгол',icon:'🇲🇳'},{id:'build',label:'Барилга',icon:'🏙️'},{id:'animal',label:'Амьтан',icon:'🐾'},
  {id:'nature',label:'Байгаль',icon:'⛰️'},{id:'trans',label:'Тээвэр',icon:'✈️'},{id:'space',label:'Сансар',icon:'🪐'},
  {id:'sport',label:'Спорт',icon:'⚽'},{id:'daily',label:'Өдөр тутам',icon:'📱'},{id:'human',label:'Хүн',icon:'🧍'},{id:'med',label:'Эмнэлэг',icon:'🩺'}];
const WIKI='https://en.wikipedia.org/wiki/';
const SI_ITEMS=[
// ═══ МОНГОЛ ═══
{id:'turiin_ordon',n:'Төрийн ордон',cat:'mn',mn:1,size:18.7,dim:'h',fact:'1951 онд баригдсан 4 давхар барилга. 2006 онд урдаа Чингис хааны хөшөөтэй асар нэмэгдсэн.',src:'Wikipedia — Government Palace (Mongolia)',url:WIKI+'Government_Palace_(Mongolia)',ref:1},
{id:'chinggis_horse',n:'Чингис хааны морьт хөшөө (Цонжин болдог)',cat:'mn',mn:1,size:40,dim:'h',fact:'Дэлхийн хамгийн том морьт хөшөө. 10 метр өндөр музейн барилгын орой дээр зогсдог.',src:'Genghis Khan Statue Complex',url:'https://genghiskhanstatue.com/',ref:1},
{id:'eco_tower',n:'Eco Tower One — Монголын хамгийн өндөр барилга',cat:'mn',mn:1,size:243,dim:'h',fact:'55 давхар. 2026 оны 9-р сард оройгоо хүрч, Монголын хамгийн өндөр барилга боллоо.',src:'Wikipedia — List of tallest buildings in Mongolia',url:WIKI+'List_of_tallest_buildings_in_Mongolia',ref:1},
{id:'shangrila',n:'Шангри-Ла цогцолборын C цамхаг',cat:'mn',mn:1,size:136,dim:'h',fact:'34 давхар, 2016 онд ашиглалтад орсон.',src:'Wikipedia — List of tallest buildings in Mongolia',url:WIKI+'List_of_tallest_buildings_in_Mongolia'},
{id:'soyombo_tower',n:'Соёмбо цамхаг',cat:'mn',mn:1,size:120,dim:'h',fact:'32 давхар, 2015 онд баригдсан.',src:'Wikipedia — List of tallest buildings in Mongolia',url:WIKI+'List_of_tallest_buildings_in_Mongolia'},
{id:'khan_bank_tower',n:'Хаан банкны цамхаг',cat:'mn',mn:1,size:112,dim:'h',fact:'24 давхар, 2017 онд баригдсан.',src:'Wikipedia — List of tallest buildings in Mongolia',url:WIKI+'List_of_tallest_buildings_in_Mongolia'},
{id:'central_tower',n:'Сентрал Тауэр',cat:'mn',mn:1,size:107.5,dim:'h',fact:'Сүхбаатарын талбайн зүүн урд буланд байрлах 17 давхар барилга (2009).',src:'CTBUH Skyscraper Center',url:'https://www.skyscrapercenter.com/ulaanbaatar/central-tower/15919',ref:1},
{id:'blue_sky',n:'Блю Скай цамхаг',cat:'mn',mn:1,size:105,dim:'h',fact:'Далбаа хэлбэртэй 25 давхар барилга (2010).',src:'Wikipedia — List of tallest buildings in Mongolia',url:WIKI+'List_of_tallest_buildings_in_Mongolia',ref:1},
{id:'megjid',n:'Мэгжид Жанрайсиг бурхан (Гандан)',cat:'mn',mn:1,size:26.5,dim:'h',fact:'1996 онд дахин бүтээгдсэн. Анхных нь 1913 онд босгогдож, 1937 онд устгагдсан.',src:'Horseback Mongolia — Gandan monastery',url:'https://www.mongolia-trips.com/guide-mongolia/attraction/gandan-monastery'},
{id:'ger',n:'Таван ханатай монгол гэр (диаметр)',cat:'mn',mn:1,size:6.1,dim:'w',fact:'Голын өндөр 2.3 м, ханын өндөр 1.6 м, шалны талбай 29 м².',src:'Mongolia Business — standard 5-wall ger',url:'https://mongoliabusiness.mn/?p=3407',ref:1},
{id:'mn_horse',n:'Монгол морь (сэрвээгээр)',cat:'mn',mn:1,size:1.28,dim:'h',mt:30,fact:'Азарга дунджаар 128 см, гүү 127 см. Жин нь 230–270 кг.',src:'Oklahoma State University — Breeds of Livestock',url:'https://breeds.okstate.edu/horses/mongolian-horses.html',ref:1},
{id:'mn_cattle',n:'Монгол үхэр (сэрвээгээр)',cat:'mn',mn:1,size:1.10,dim:'h',mt:18,fact:'Үнээ 280–400 кг, бух 550–600 кг жинтэй.',src:'The Cattle Site — Mongolian breed',url:'https://www.thecattlesite.com/breeds/beef/28/mongolian'},
{id:'camel',n:'Монгол хоёр бөхт тэмээ (бөхөөрөө)',cat:'mn',mn:1,size:2.1,dim:'h',mt:18,fact:'Бөхнийхөө оройгоор 2 метрээс өндөр, жин нь 800 орчим кг.',src:'National Geographic Kids — Bactrian camel',url:'https://kids.nationalgeographic.com/animals/mammals/facts/bactrian-camel'},
{id:'takhi',n:'Тахь (сэрвээгээр)',cat:'mn',mn:1,size:1.32,dim:'h',mt:32,fact:'122–142 см өндөр. Дэлхийн цорын ганц зэрлэг адуу.',src:'Britannica — Przewalski’s horse',url:'https://www.britannica.com/EBchecked/topic/481051'},
{id:'bankhar',n:'Банхар нохой',cat:'mn',mn:1,size:0.75,dim:'h',mt:18,fact:'75 см хүртэл өндөр, 50–60 кг жинтэй малчдын хоточ нохой.',src:'Wikipedia — Bankhar dog',url:WIKI+'Bankhar_dog'},
{id:'irves',n:'Ирвэс (мөрөөрөө)',cat:'mn',mn:1,size:0.56,dim:'h',mt:12,fact:'Мөрний өндөр 56 см орчим. Сүүл нь 80–105 см урт.',src:'Wikipedia — Snow leopard',url:WIKI+'Snow_leopard'},
{id:'argali',n:'Аргаль (мөрөөрөө)',cat:'mn',mn:1,size:1.1,dim:'h',mt:38,fact:'Мөрний өндөр 85–135 см. Эр аргалийн эвэр 190 см хүртэл урт.',src:'Wikipedia — Argali',url:WIKI+'Argali'},
{id:'golden_eagle',n:'Бүргэд (далавчны дэлгэц)',cat:'mn',mn:1,size:2.1,dim:'w',fact:'Далавчаа дэлгэхэд 1.8–2.3 м. Казах бүргэдчид ан хийхэд ашигладаг.',src:'Wikipedia — Golden eagle',url:WIKI+'Golden_eagle'},
{id:'morin_khuur',n:'Морин хуур',cat:'mn',mn:1,size:1.15,dim:'h',fact:'Орчин үеийн стандарт өндөр нь 1.15 м.',src:'Wikipedia — Morin khuur',url:WIKI+'Morin_khuur',ref:1},
{id:'tugrik',n:'5000 төгрөгийн дэвсгэрт (урт)',cat:'mn',mn:1,size:0.152,dim:'w',fact:'152 × 72 мм хэмжээтэй.',src:'RealBanknotes — Mongolia P80',url:'https://www.realbanknotes.com/banknote/85805-Mongolia-p80-5000-Tugrik-from-2024',ref:1},
{id:'khongor',n:'Хонгорын элсний хамгийн өндөр манхан',cat:'mn',mn:1,size:300,dim:'h',fact:'Манхнууд ихэвчлэн 80 м орчим, хамгийн өндөр нь 300 м. Элс нь 100 гаруй км урт.',src:'Wikipedia — Khongoryn Els',url:WIKI+'Khongoryn_Els'},
{id:'khuiten',n:'Хүйтэн оргил — Монголын хамгийн өндөр цэг',cat:'mn',mn:1,size:4374,dim:'h',fact:'Алтай Таван Богдын оргил, далайн түвшнээс 4374 м.',src:'Wikipedia — Khüiten Peak',url:WIKI+'Kh%C3%BCiten_Peak',ref:1},
{id:'archery',n:'Наадмын сур харвааны зай (эрэгтэй)',cat:'mn',mn:1,size:75,dim:'w',fact:'Эрэгтэй 75 м, эмэгтэй 60 м, хөвгүүд 40 м-ээс харвадаг.',src:'Austria-Forum — Archery at the Mongolian Naadam',url:'https://austria-forum.org/af/Geography/Asia/Mongolia/Special_Information/Archery_at_the_mongolian_Naadam_Festival'},
{id:'mn_man',n:'Монгол эрэгтэйн дундаж өндөр',cat:'mn',mn:1,size:1.691,dim:'h',fact:'Эмэгтэйчүүдийнх 158.2 см. 100 жилийн өмнөхөөс 10 см өндөр болжээ.',src:'NCD-RisC / Imperial College London (ikon.mn, 2016)',url:'https://ikon.mn/n/snp',ref:1},
// ═══ БАРИЛГА ═══
{id:'burj',n:'Бурж Халифа (Дубай)',cat:'build',size:828,dim:'h',fact:'Дэлхийн хамгийн өндөр барилга, 163 давхар.',src:'Wikipedia — Burj Khalifa',url:WIKI+'Burj_Khalifa',ref:1},
{id:'skytree',n:'Токио Скайтри',cat:'build',size:634,dim:'h',fact:'Дэлхийн хамгийн өндөр телевизийн цамхаг.',src:'Wikipedia — Tokyo Skytree',url:WIKI+'Tokyo_Skytree'},
{id:'petronas',n:'Петронас ихэр цамхаг',cat:'build',size:452,dim:'h',fact:'88 давхар. 41, 42 дугаар давхарт гүүрээр холбогддог.',src:'Wikipedia — Petronas Towers',url:WIKI+'Petronas_Towers'},
{id:'empire',n:'Эмпайр Стэйт Билдинг (оройн шонтой)',cat:'build',size:443,dim:'h',fact:'1931 онд баригдсан, 102 давхар.',src:'Wikipedia — Empire State Building',url:WIKI+'Empire_State_Building'},
{id:'eiffel',n:'Эйфелийн цамхаг',cat:'build',size:330,dim:'h',fact:'1889 онд баригдсан. Зун халуунд төмөр нь тэлж 15 см хүртэл өндөрсдөг.',src:'Wikipedia — Eiffel Tower',url:WIKI+'Eiffel_Tower',ref:1},
{id:'golden_gate',n:'Голден Гейт гүүрний багана',cat:'build',size:227,dim:'h',fact:'Гүүрний гол зай 1280 м.',src:'Wikipedia — Golden Gate Bridge',url:WIKI+'Golden_Gate_Bridge'},
{id:'unity',n:'Эв нэгдлийн хөшөө (Энэтхэг)',cat:'build',size:182,dim:'h',fact:'Дэлхийн хамгийн өндөр хөшөө (2018).',src:'Wikipedia — Statue of Unity',url:WIKI+'Statue_of_Unity'},
{id:'pyramid',n:'Гизийн их пирамид',cat:'build',size:138.5,dim:'h',fact:'Анх 146.6 м байсан. 3800 жил дэлхийн хамгийн өндөр барилга байжээ.',src:'Wikipedia — Great Pyramid of Giza',url:WIKI+'Great_Pyramid_of_Giza',ref:1},
{id:'colosseum',n:'Колизей (урт)',cat:'build',size:189,dim:'w',fact:'48 м өндөр, 50 000 үзэгчтэй байсан.',src:'Wikipedia — Colosseum',url:WIKI+'Colosseum'},
{id:'opera',n:'Сиднейн дуурийн театр (урт)',cat:'build',size:183,dim:'w',fact:'Хамгийн өндөр «далбаа» нь 65 м.',src:'Wikipedia — Sydney Opera House',url:WIKI+'Sydney_Opera_House'},
{id:'bigben',n:'Биг Бен (Элизабетын цамхаг)',cat:'build',size:96,dim:'h',fact:'Цагны нүүр бүр 7 м диаметртэй.',src:'Wikipedia — Big Ben',url:WIKI+'Big_Ben'},
{id:'liberty',n:'Эрх чөлөөний хөшөө (тавцантай)',cat:'build',size:93,dim:'h',fact:'Хөшөө өөрөө 46 м, тавцантайгаа 93 м.',src:'Wikipedia — Statue of Liberty',url:WIKI+'Statue_of_Liberty',ref:1},
{id:'taj',n:'Таж Махал',cat:'build',size:73,dim:'h',fact:'Цагаан гантигаар 1632–1653 онд баригдсан.',src:'Wikipedia — Taj Mahal',url:WIKI+'Taj_Mahal'},
{id:'pisa',n:'Пизагийн налуу цамхаг',cat:'build',size:56,dim:'h',fact:'4 градус орчим хазайсан.',src:'Wikipedia — Leaning Tower of Pisa',url:WIKI+'Leaning_Tower_of_Pisa'},
{id:'redeemer',n:'Аврагч Христийн хөшөө (тавцангүй)',cat:'build',size:30,dim:'h',fact:'Гар хоорондын зай 28 м. 8 м тавцан дээр зогсдог.',src:'Wikipedia — Christ the Redeemer',url:WIKI+'Christ_the_Redeemer_(statue)'},
// ═══ БАЙГАЛЬ ═══
{id:'everest',n:'Эверест уул',cat:'nature',size:8849,dim:'h',fact:'Дэлхийн хамгийн өндөр цэг (2020 оны хэмжилт).',src:'Wikipedia — Mount Everest',url:WIKI+'Mount_Everest',ref:1},
{id:'angel_falls',n:'Анхелын хүрхрээ',cat:'nature',size:979,dim:'h',fact:'Дэлхийн хамгийн өндөр тасралтгүй хүрхрээ (Венесуэл).',src:'Wikipedia — Angel Falls',url:WIKI+'Angel_Falls'},
{id:'redwood',n:'Хиперион — дэлхийн хамгийн өндөр мод',cat:'nature',size:116,dim:'h',fact:'Калифорнийн далайн хүрэн мод (секвойя).',src:'Wikipedia — Hyperion (tree)',url:WIKI+'Hyperion_(tree)',ref:1},
{id:'niagara',n:'Ниагара хүрхрээ (Тахан хүрхрээ)',cat:'nature',size:57,dim:'h',fact:'Өргөн нь 670 м орчим.',src:'Wikipedia — Horseshoe Falls',url:WIKI+'Horseshoe_Falls'},
// ═══ АМЬТАН ═══
{id:'blue_whale',n:'Цэнхэр халим',cat:'animal',size:29.9,dim:'w',fact:'Дэлхий дээр амьдарч байсан хамгийн том амьтан. Хамгийн урт нь 29.9 м.',src:'Wikipedia — Blue whale',url:WIKI+'Blue_whale',ref:1},
{id:'trex',n:'Тиранозавр (Сью, урт)',cat:'animal',size:12.3,dim:'w',fact:'Хамгийн бүрэн олдсон T. rex-ийн араг яс.',src:'Wikipedia — Sue (dinosaur)',url:WIKI+'Sue_(dinosaur)'},
{id:'shark',n:'Цагаан акул (том эм)',cat:'animal',size:6.1,dim:'w',fact:'Эм нь эрээсээ том, 6 м хүртэл ургадаг.',src:'Wikipedia — Great white shark',url:WIKI+'Great_white_shark'},
{id:'giraffe',n:'Анааш (эр)',cat:'animal',size:5.5,dim:'h',fact:'Хамгийн өндөр амьтан. Хүзүү нь л 2 м орчим.',src:'Wikipedia — Giraffe',url:WIKI+'Giraffe',ref:1},
{id:'elephant',n:'Африкийн заан (эр, мөрөөрөө)',cat:'animal',size:3.2,dim:'h',mt:12,fact:'Хуурай газрын хамгийн том амьтан, 6 тонн хүртэл.',src:'Wikipedia — African bush elephant',url:WIKI+'African_bush_elephant',ref:1},
{id:'ostrich',n:'Тэмээн хяруул',cat:'animal',size:2.5,dim:'h',fact:'Хамгийн том шувуу. Цагт 70 км хурдалдаг.',src:'Wikipedia — Common ostrich',url:WIKI+'Common_ostrich'},
{id:'gorilla',n:'Горилла (эр, босоогоороо)',cat:'animal',size:1.7,dim:'h',fact:'Эр горилла 200 кг хүртэл жинтэй.',src:'Wikipedia — Gorilla',url:WIKI+'Gorilla'},
{id:'lion',n:'Арслан (эр, мөрөөрөө)',cat:'animal',size:1.2,dim:'h',mt:44,fact:'Эр арслан 190 кг хүртэл жинтэй.',src:'Wikipedia — Lion',url:WIKI+'Lion'},
{id:'penguin',n:'Эзэн хаан оцон шувуу',cat:'animal',size:1.15,dim:'h',fact:'Хамгийн том оцон шувуу.',src:'Wikipedia — Emperor penguin',url:WIKI+'Emperor_penguin'},
{id:'cat',n:'Гэрийн муур (мөрөөрөө)',cat:'animal',size:0.25,dim:'h',mt:6,fact:'Дунджаар 23–25 см өндөр, 4–5 кг.',src:'Wikipedia — Cat',url:WIKI+'Cat',ref:1},
{id:'bee_hummingbird',n:'Зөгий хурдан шувуу',cat:'animal',size:0.055,dim:'w',fact:'Дэлхийн хамгийн жижиг шувуу (Куба), 2 г орчим.',src:'Wikipedia — Bee hummingbird',url:WIKI+'Bee_hummingbird'},
{id:'honeybee',n:'Зөгий (ажилчин)',cat:'animal',size:0.015,dim:'w',fact:'Ажилчин зөгий 1.5 см орчим урт.',src:'Wikipedia — Western honey bee',url:WIKI+'Western_honey_bee'},
// ═══ ТЭЭВЭР ═══
{id:'container_ship',n:'Эвер Гивен чингэлэг тээвэрлэгч хөлөг',cat:'trans',size:400,dim:'w',fact:'2021 онд Суэцийн сувгийг 6 хоног хаасан.',src:'Wikipedia — Ever Given',url:WIKI+'Ever_Given'},
{id:'titanic',n:'Титаник (урт)',cat:'trans',size:269.1,dim:'w',fact:'1912 онд анхны аялалдаа живсэн.',src:'Wikipedia — Titanic',url:WIKI+'Titanic',ref:1},
{id:'saturnv',n:'Сатурн V пуужин',cat:'trans',size:110.6,dim:'h',fact:'Хүнийг саран дээр хүргэсэн пуужин.',src:'Wikipedia — Saturn V',url:WIKI+'Saturn_V'},
{id:'iss',n:'Олон улсын сансрын станц (өргөн)',cat:'trans',size:109,dim:'w',fact:'Хөл бөмбөгийн талбай шиг том, 400 км өндөрт нисдэг.',src:'Wikipedia — International Space Station',url:WIKI+'International_Space_Station'},
{id:'b747',n:'Боинг 747-8 (урт)',cat:'trans',size:76.3,dim:'w',fact:'«Тэнгэрийн хатан» хэмээх хоёр давхар нисэх онгоц.',src:'Wikipedia — Boeing 747-8',url:WIKI+'Boeing_747-8'},
{id:'a380',n:'Эйрбас A380 (урт)',cat:'trans',size:72.7,dim:'w',fact:'Дэлхийн хамгийн том зорчигч тээврийн онгоц.',src:'Wikipedia — Airbus A380',url:WIKI+'Airbus_A380',ref:1},
{id:'bus',n:'Лондонгийн хоёр давхар автобус (өндөр)',cat:'trans',size:4.38,dim:'h',fact:'Routemaster загвар.',src:'Wikipedia — New Routemaster',url:WIKI+'New_Routemaster',ref:1},
{id:'car',n:'Toyota Corolla (урт)',cat:'trans',size:4.63,dim:'w',fact:'Дэлхийд хамгийн их зарагдсан машин.',src:'Wikipedia — Toyota Corolla (E210)',url:WIKI+'Toyota_Corolla_(E210)',ref:1},
// ═══ САНСАР ═══
{id:'sun',n:'Нар (диаметр)',cat:'space',size:1392700000,dim:'w',fact:'Дотор нь 1.3 сая Дэлхий багтана.',src:'Wikipedia — Sun',url:WIKI+'Sun',ref:1},
{id:'jupiter',n:'Бархасбадь гараг (диаметр)',cat:'space',size:139820000,dim:'w',fact:'Нарны аймгийн хамгийн том гараг.',src:'Wikipedia — Jupiter',url:WIKI+'Jupiter',ref:1},
{id:'earth',n:'Дэлхий (диаметр)',cat:'space',size:12742000,dim:'w',fact:'Тойрог нь 40 075 км.',src:'Wikipedia — Earth',url:WIKI+'Earth',ref:1},
{id:'mars',n:'Ангараг гараг (диаметр)',cat:'space',size:6779000,dim:'w',fact:'Дэлхийн бараг тал хэмжээтэй.',src:'Wikipedia — Mars',url:WIKI+'Mars'},
{id:'moon',n:'Сар (диаметр)',cat:'space',size:3474800,dim:'w',fact:'Дэлхийгээс 384 400 км зайтай.',src:'Wikipedia — Moon',url:WIKI+'Moon',ref:1},
// ═══ СПОРТ ═══
{id:'pitch',n:'Хөл бөмбөгийн талбай (урт)',cat:'sport',size:105,dim:'w',fact:'FIFA-гийн зөвлөмж: 105 × 68 м.',src:'Wikipedia — Football pitch',url:WIKI+'Football_pitch',ref:1},
{id:'pool',n:'Олимпын усан сан (урт)',cat:'sport',size:50,dim:'w',fact:'25 м өргөн, 10 замтай.',src:'Wikipedia — Olympic-size swimming pool',url:WIKI+'Olympic-size_swimming_pool'},
{id:'tennis_court',n:'Теннисний талбай (урт)',cat:'sport',size:23.77,dim:'w',fact:'Хосын тоглолтын өргөн 10.97 м.',src:'Wikipedia — Tennis court',url:WIKI+'Tennis_court'},
{id:'soccer_goal',n:'Хөл бөмбөгийн хаалга (өргөн)',cat:'sport',size:7.32,dim:'w',fact:'Өндөр нь 2.44 м.',src:'Wikipedia — Goal (sports)',url:WIKI+'Goal_(sports)',ref:1},
{id:'basketball',n:'Сагсан бөмбөг (7-р хэмжээ)',cat:'sport',size:0.24,dim:'w',fact:'Тойрог нь 75 см орчим.',src:'Wikipedia — Basketball (ball)',url:WIKI+'Basketball_(ball)',ref:1},
{id:'soccer_ball',n:'Хөл бөмбөг (5-р хэмжээ)',cat:'sport',size:0.22,dim:'w',fact:'Тойрог нь 68–70 см.',src:'Wikipedia — Ball (association football)',url:WIKI+'Ball_(association_football)'},
{id:'tennis_ball',n:'Теннисний бөмбөг',cat:'sport',size:0.067,dim:'w',fact:'6.54–6.86 см диаметртэй.',src:'Wikipedia — Tennis ball',url:WIKI+'Tennis_ball'},
{id:'golf_ball',n:'Гольфын бөмбөг',cat:'sport',size:0.0427,dim:'w',fact:'300–500 жижиг хонхорхойтой.',src:'Wikipedia — Golf ball',url:WIKI+'Golf_ball'},
// ═══ ӨДӨР ТУТАМ ═══
{id:'container',n:'20 футын чингэлэг (урт)',cat:'daily',size:6.06,dim:'w',fact:'Дэлхийн тээврийн стандарт хайрцаг.',src:'Wikipedia — Intermodal container',url:WIKI+'Intermodal_container',ref:1},
{id:'door',n:'Хаалга (стандарт өндөр)',cat:'daily',size:2.03,dim:'h',fact:'80 инч буюу 2.03 м нь нийтлэг стандарт.',src:'Wikipedia — Door',url:WIKI+'Door',ref:1},
{id:'a4',n:'A4 цаас (өндөр)',cat:'daily',size:0.297,dim:'h',fact:'210 × 297 мм. Хоёр хуваахад A5 болно.',src:'Wikipedia — ISO 216',url:WIKI+'ISO_216',ref:1},
{id:'pencil',n:'Харандаа (шинэ)',cat:'daily',size:0.19,dim:'w',fact:'Нэг харандаагаар 56 км урт зураас зурж болно гэдэг.',src:'Wikipedia — Pencil',url:WIKI+'Pencil'},
{id:'phone',n:'iPhone 15 (өндөр)',cat:'daily',size:0.1476,dim:'h',fact:'71.6 мм өргөн, 7.8 мм зузаан.',src:'Wikipedia — iPhone 15',url:WIKI+'IPhone_15',ref:1},
{id:'can',n:'Ундааны лааз (330 мл)',cat:'daily',size:0.122,dim:'h',fact:'66 мм диаметртэй.',src:'Wikipedia — Drink can',url:WIKI+'Drink_can'},
{id:'credit_card',n:'Банкны карт (урт)',cat:'daily',size:0.0856,dim:'w',fact:'ISO 7810 стандарт: 85.6 × 54 мм.',src:'Wikipedia — ISO/IEC 7810',url:WIKI+'ISO/IEC_7810',ref:1},
{id:'rubik',n:'Рубикийн шоо',cat:'daily',size:0.057,dim:'w',fact:'43 квинтиллион янзаар эргэлддэг.',src:'Wikipedia — Rubik’s Cube',url:WIKI+'Rubik%27s_Cube'},
{id:'battery',n:'AA батарей',cat:'daily',size:0.0505,dim:'h',fact:'14.5 мм диаметртэй.',src:'Wikipedia — AA battery',url:WIKI+'AA_battery'},
{id:'lego',n:'LEGO 2×4 тоосго (урт)',cat:'daily',size:0.0318,dim:'w',fact:'Зургаан ширхэгийг 915 сая янзаар нийлүүлж болно.',src:'Wikipedia — Lego',url:WIKI+'Lego'},
// ═══ ХҮН ═══
{id:'wadlow',n:'Роберт Уодлоу — түүхэн дэх хамгийн өндөр хүн',cat:'human',size:2.72,dim:'h',fact:'1918–1940. Гиннесийн дээд амжилт.',src:'Wikipedia — Robert Wadlow',url:WIKI+'Robert_Wadlow'},
{id:'newborn',n:'Шинэ төрсөн хүүхэд (урт)',cat:'human',size:0.499,dim:'h',fact:'ДЭМБ-ын медиан: хүү 49.9 см, охин 49.1 см.',src:'WHO Child Growth Standards',url:'https://www.who.int/tools/child-growth-standards/standards/length-height-for-age'},
];
// Зөвхөн харьцуулалтад хэрэглэх объект (тоглоомд асуугдахгүй)
const SI_REFS=[{id:'person_ref',n:'Хүн',size:1.70,dim:'h',ref:1,refOnly:1}];
function injectCSS(){ if(document.getElementById('siCSS')) return; const st=document.createElement('style'); st.id='siCSS'; st.textContent=`
#siScreen{background:#F6F1E7;min-height:100vh;color:#1F2A44}
body.si-on{background:#F6F1E7}
.si-wrap{max-width:1080px;margin:0 auto;padding:14px 18px 60px;font-family:'Nunito','Inter',system-ui,sans-serif;color:#1F2A44}
.si-head{display:flex;align-items:center;justify-content:space-between;padding:6px 0 14px;border-bottom:2px solid #1F2A44;margin-bottom:22px}
.si-logo{display:flex;align-items:center;gap:12px;background:none;border:0;cursor:pointer;color:inherit;padding:0;text-align:left}
.si-logo-r{width:44px;height:44px;border-radius:12px;background:#F2B431;display:grid;place-items:center;font-size:24px;box-shadow:3px 3px 0 #1F2A44}
.si-logo b{display:block;font:900 22px/1 'Exo 2','Nunito',sans-serif;letter-spacing:.06em}
.si-logo i{display:block;font-style:normal;font-size:13px;color:#5B6675;margin-top:3px}
.si-x{width:40px;height:40px;border-radius:50%;border:2px solid #1F2A44;background:#fff;font-size:16px;cursor:pointer}
.si-btn{font:800 15px 'Nunito',sans-serif;padding:12px 20px;border-radius:12px;border:2px solid #1F2A44;background:#fff;color:#1F2A44;cursor:pointer;box-shadow:3px 3px 0 #1F2A44;transition:transform .08s,box-shadow .08s}
.si-btn:active{transform:translate(3px,3px);box-shadow:0 0 0 #1F2A44}
.si-btn-main{background:#2F6FD6;color:#fff}
.si-btn-ghost{box-shadow:none;background:transparent}
.si-btn-danger{color:#B23A2E;border-color:#B23A2E;box-shadow:3px 3px 0 #B23A2E}
.si-btn-sm{padding:7px 12px;font-size:13px;box-shadow:2px 2px 0 #1F2A44}
.si-kicker{display:inline-block;font:800 12px 'Nunito';letter-spacing:.12em;text-transform:uppercase;color:#B5562A;background:#FBE3D3;padding:5px 10px;border-radius:999px}
.si-hero{display:grid;grid-template-columns:1.05fr 1fr;gap:28px;align-items:center;background:#fff;border:2px solid #1F2A44;border-radius:22px;padding:28px;box-shadow:6px 6px 0 #1F2A44}
.si-hero h1{font:900 34px/1.15 'Exo 2','Nunito',sans-serif;margin:14px 0 10px}
.si-hero h1 em{font-style:normal;color:#2F6FD6;display:block}
.si-hero p{font-size:16px;line-height:1.55;color:#3E4A60;margin:0 0 20px}
.si-hero-acts{display:flex;flex-wrap:wrap;align-items:center;gap:14px}
.si-hero-note{font-size:14px;color:#5B6675}
.si-hero-art{position:relative;height:250px;background:linear-gradient(#CDE6FF,#EAF4FF);border-radius:16px;overflow:hidden}
.si-hero-row{position:absolute;left:0;right:0;bottom:22px;display:flex;align-items:flex-end;justify-content:center;gap:12px}
.si-hero-obj svg,.si-hero-obj img{width:100%;height:100%;display:block}
.si-hero-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.si-hero-has .si-hero-ground{display:none}
.si-hero-edit{position:absolute;right:10px;top:10px;z-index:3;background:rgba(255,255,255,.95);border:1.5px solid #1F2A44;border-radius:10px;padding:6px 10px;font:800 13px 'Nunito';cursor:pointer;color:#1F2A44}.si-hero-edit input{display:none}.si-hero-del{right:auto;left:10px}
.si-hero-ground{position:absolute;left:0;right:0;bottom:0;height:22px;background:#8BC27A;border-top:3px solid #6CA45B}
.si-sec{margin-top:34px}
.si-sec h2{font:900 22px 'Exo 2','Nunito',sans-serif;margin:0 0 4px}
.si-sub{margin:0 0 14px;color:#5B6675}
.si-cats{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
.si-cat{display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:14px;border:2px solid #1F2A44;border-radius:14px;background:#fff;cursor:pointer;box-shadow:3px 3px 0 #1F2A44;text-align:left;color:#1F2A44}
.si-cat span{font-size:26px}.si-cat b{font-size:16px}.si-cat i{font-style:normal;font-size:12px;color:#5B6675}
.si-cat:hover{background:#FFF7E3}
.si-two{display:grid;grid-template-columns:1fr 1fr;gap:28px}
.si-board{background:#fff;border:2px solid #1F2A44;border-radius:14px;overflow:hidden}
.si-row{display:grid;grid-template-columns:34px 1fr auto 50px;gap:8px;align-items:center;padding:9px 14px;border-bottom:1px solid #EEE7D8;font-size:15px}
.si-row:last-child{border-bottom:0}.si-row span{font-weight:800;color:#8A93A3}.si-row i{font-style:normal;font-size:12px;letter-spacing:-1px}.si-row em{font-style:normal;font-weight:900;text-align:right}
.si-row.me{background:#FFF4D6}
.si-muted{color:#6B7484;padding:14px;font-size:14px}
.si-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.si-stats div{background:#fff;border:2px solid #1F2A44;border-radius:12px;padding:10px;text-align:center}
.si-stats b{display:block;font:900 24px 'Exo 2'}.si-stats i{font-style:normal;font-size:12px;color:#5B6675}
.si-how-h{font:900 16px 'Nunito';margin:18px 0 6px}
.si-how{margin:0;padding-left:20px;line-height:1.6;color:#3E4A60;font-size:14px}
.si-admin-bar{display:flex;gap:12px;flex-wrap:wrap}
.si-foot{margin-top:40px;font-size:12px;color:#8A93A3;text-align:center}
.si-loading{padding:60px;text-align:center;color:#5B6675}
/* ─ үе ─ */
.si-prog{display:flex;gap:8px;justify-content:center;margin-bottom:14px}
.si-prog span{width:34px;height:34px;border-radius:10px;border:2px solid #1F2A44;display:grid;place-items:center;font-weight:900;background:#fff;font-size:14px}
.si-prog span.on{background:#F2B431}.si-prog span.done{background:#fff;font-size:16px}
.si-prog-p{justify-content:space-between;font-weight:800;color:#5B6675;font-size:14px}.si-prog-p span,.si-prog-p b{width:auto;height:auto;border:0;background:none;display:inline}
.si-q{text-align:center;margin-bottom:12px}
.si-q h2{font:900 26px/1.2 'Exo 2','Nunito',sans-serif;margin:6px 0 2px}
.si-q p{margin:0;color:#5B6675;font-weight:700}
.si-tag{font-size:13px;font-weight:800;background:#fff;border:1.5px solid #1F2A44;border-radius:999px;padding:3px 10px}
.si-stage{position:relative;height:min(52vh,440px);min-height:280px;background:linear-gradient(#BFE0FF 0%,#E8F3FF 85%);border:2px solid #1F2A44;border-radius:18px;overflow:hidden;touch-action:none;cursor:ns-resize;user-select:none}
.si-stage.si-revealed{cursor:default}
.si-ground{position:absolute;left:0;right:0;bottom:0;height:26px;background:#8BC27A;border-top:3px solid #6CA45B}
.si-grid{position:absolute;inset:0;pointer-events:none}
.si-gl{position:absolute;left:0;right:0;border-top:1px dashed rgba(31,42,68,.16)}
.si-gl span{position:absolute;left:8px;top:-17px;font:700 11px 'Nunito';color:rgba(31,42,68,.45)}
.si-world{position:absolute;inset:0}
.si-obj{position:absolute;bottom:26px}
.si-anim .si-obj,.si-anim .si-ghost,.si-anim .si-meas{transition:all .9s cubic-bezier(.2,.8,.2,1)}
.si-obj-art{position:absolute;inset:0}
.si-art{width:100%;height:100%;display:block}
.si-mys .si-obj-art{filter:drop-shadow(0 0 0 transparent)}.si-mys:not(.x)::before{content:'';position:absolute;inset:-6px;border:2px dashed rgba(47,111,214,.55);border-radius:8px;pointer-events:none}.si-revealed .si-mys::before{display:none}

.si-drag .si-mys .si-obj-art{opacity:.75}
.si-lbl{position:absolute;left:50%;bottom:100%;transform:translateX(-50%);margin-bottom:6px;white-space:nowrap;text-align:center;background:rgba(255,255,255,.92);border:1.5px solid #1F2A44;border-radius:8px;padding:2px 8px;font-size:12px;line-height:1.25}
.si-lbl b{display:block;font-size:12px}.si-lbl i{font-style:normal;color:#2F6FD6;font-weight:800}
.si-lbl-me{background:#2F6FD6;border-color:#2F6FD6;color:#fff}.si-lbl-me b{font-size:12px}.si-revealed .si-lbl-me{display:none}
.si-tiny .si-lbl{margin-bottom:12px}
.si-tiny::after{content:'';position:absolute;left:50%;bottom:100%;width:2px;height:10px;background:#1F2A44;transform:translateX(-50%)}
.si-meas{position:absolute;left:100%;margin-left:8px;border-left:2px solid #1F2A44;pointer-events:none}
.si-meas::before,.si-meas::after{content:'';position:absolute;left:-6px;width:10px;border-top:2px solid #1F2A44}
.si-meas::before{top:0}.si-meas::after{bottom:0}
.si-meas b{position:absolute;left:8px;top:50%;transform:translateY(-50%);white-space:nowrap;font:900 14px 'Nunito';background:#F2B431;border:1.5px solid #1F2A44;border-radius:8px;padding:2px 8px}
.si-meas-w{left:0!important;right:0;top:auto!important;bottom:-22px!important;height:0!important;margin-left:0;border-left:0;border-top:2px solid #1F2A44;width:100%}
.si-meas-w::before,.si-meas-w::after{top:-6px;height:10px;width:0;border-top:0;border-left:2px solid #1F2A44}
.si-meas-w::before{left:0}.si-meas-w::after{left:auto;right:0;bottom:auto}
.si-meas-w b{left:50%;top:auto;bottom:4px;transform:translateX(-50%)}
.si-ghost{display:none;position:absolute;bottom:0;pointer-events:none;z-index:2}.si-ghost .si-art{filter:brightness(0) saturate(100%) invert(34%) sepia(87%) saturate(2400%) hue-rotate(345deg);opacity:.32}.si-ghost span{position:absolute;left:50%;bottom:100%;transform:translateX(-50%);white-space:nowrap;font:800 11px 'Nunito';color:#C0362C;margin-bottom:2px}
.si-ctrl{display:grid;grid-template-columns:auto 1fr auto;gap:18px;align-items:center;margin-top:16px;background:#fff;border:2px solid #1F2A44;border-radius:16px;padding:14px 18px;box-shadow:4px 4px 0 #1F2A44}
.si-guess span{display:block;font-size:12px;color:#5B6675;font-weight:800;text-transform:uppercase;letter-spacing:.08em}
.si-guess b{font:900 28px 'Exo 2','Nunito',sans-serif;min-width:150px;display:inline-block}
.si-slider{display:flex;align-items:center;gap:10px}
.si-slider input{flex:1;accent-color:#2F6FD6;height:28px}
.si-step{width:40px;height:40px;border-radius:50%;border:2px solid #1F2A44;background:#fff;font:900 20px 'Nunito';cursor:pointer}
.si-res-card{margin-top:16px;background:#fff;border:2px solid #1F2A44;border-radius:16px;padding:18px 20px;box-shadow:4px 4px 0 #1F2A44;animation:siUp .5s ease}
@keyframes siUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.si-res-top{display:flex;gap:18px;align-items:center}
.si-res-score{background:#F2B431;border:2px solid #1F2A44;border-radius:14px;padding:8px 14px;text-align:center;min-width:92px}
.si-res-score b{font:900 38px/1 'Exo 2'}.si-res-score i{font-style:normal;font-weight:800;color:#5B4612}
.si-res-v{font:900 22px 'Exo 2','Nunito'}
.si-res-nums{color:#3E4A60;margin-top:4px}
.si-res-nums span{font-weight:800;margin-left:6px}.si-res-nums .up{color:#B23A2E}.si-res-nums .down{color:#2F6FD6}
.si-fact{background:#F6F1E7;border-radius:10px;padding:10px 12px;margin:14px 0 8px;line-height:1.5}
.si-src{font-size:13px;color:#5B6675;margin-bottom:14px}.si-src a{color:#2F6FD6}
.si-res-card .si-btn{margin-right:10px}
/* ─ дүн ─ */
.si-final{max-width:560px;margin:0 auto;text-align:center;background:#fff;border:2px solid #1F2A44;border-radius:22px;padding:28px;box-shadow:6px 6px 0 #1F2A44}
.si-final-score b{font:900 72px/1 'Exo 2'}.si-final-score i{font-style:normal;font:900 24px 'Exo 2';color:#8A93A3}
.si-final-score{margin:14px 0 6px}
.si-final-tiles{font-size:30px;letter-spacing:4px;margin-bottom:16px}
.si-final-list{text-align:left;border-top:1px solid #EEE7D8}
.si-final-list div{display:grid;grid-template-columns:28px 1fr 44px;gap:2px 8px;padding:9px 0;border-bottom:1px solid #EEE7D8}
.si-final-list b{font-size:14px}.si-final-list i{grid-column:2;font-style:normal;font-size:12px;color:#5B6675}.si-final-list em{grid-row:1/3;grid-column:3;font-style:normal;font-weight:900;font-size:18px;align-self:center;text-align:right}
.si-final-list span{grid-row:1/3}
.si-final-acts{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:20px 0 12px}
.si-submit{display:flex;gap:8px;justify-content:center;margin-top:8px}
.si-submit input{padding:11px 12px;border:2px solid #1F2A44;border-radius:12px;font:700 15px 'Nunito';min-width:0;flex:1;max-width:260px}
/* ─ админ ─ */
.si-adm-list{display:flex;flex-direction:column;gap:8px}
.si-adm-row{display:grid;grid-template-columns:56px 1fr auto;gap:12px;align-items:center;background:#fff;border:1.5px solid #1F2A44;border-radius:12px;padding:8px 12px}
.si-adm-row.off{opacity:.5}
.si-adm-th{width:56px;height:48px;display:flex;align-items:flex-end;justify-content:center}
.si-adm-th .si-art{max-width:56px;max-height:48px;width:auto;height:48px}
.si-adm-main b{display:block}.si-adm-main i{font-style:normal;font-size:13px;color:#5B6675}.si-adm-main small{display:block;font-size:11px;color:#8A93A3}
.si-imp{background:#EEF4FF;border:1.5px solid #1F2A44;border-radius:12px;padding:14px 16px;margin:8px 0 18px}.si-imp h3{margin:0 0 4px;font-size:17px}.si-imp label.si-btn{cursor:pointer}.si-imp-tb{width:100%;border-collapse:collapse;margin:12px 0;font-size:14px;background:#fff;border-radius:8px;overflow:hidden}.si-imp-tb th,.si-imp-tb td{padding:6px 8px;border-bottom:1px solid #E4E0D6;text-align:left}.si-imp-tb th{background:#1F2A44;color:#fff;font-weight:600}.si-imp-tb tr.bad td{background:#FFF0EE;color:#A33}.si-imp-err{color:#A33;margin-top:10px}.si-adm-form{display:grid;grid-template-columns:1fr 1fr;gap:10px 14px;background:#FFFDF7;border:1.5px dashed #1F2A44;border-radius:12px;padding:14px;margin:6px 0 10px}
.si-adm-form label{display:flex;flex-direction:column;font-size:12px;font-weight:800;color:#5B6675;gap:4px}
.si-adm-form .w2{grid-column:1/3}
.si-adm-form .chk{flex-direction:row;align-items:center;gap:8px;font-size:13px;color:#1F2A44}
.si-adm-form input:not([type=checkbox]),.si-adm-form select{padding:9px 10px;border:1.5px solid #1F2A44;border-radius:9px;font:600 14px 'Nunito';background:#fff}
.si-adm-acts{display:flex;gap:10px;flex-wrap:wrap}

.si-mz-help{font-size:13px;color:#3E4A60;background:#EAF4FF;border-radius:10px;padding:8px 12px;margin-bottom:10px;line-height:1.45;font-weight:600}
.si-mz-box{position:relative;display:inline-block;max-width:100%;background:linear-gradient(45deg,#e8e8e8 25%,transparent 25%,transparent 75%,#e8e8e8 75%),linear-gradient(45deg,#e8e8e8 25%,#fff 25%,#fff 75%,#e8e8e8 75%);background-size:16px 16px;background-position:0 0,8px 8px;border:1.5px solid #1F2A44;border-radius:8px;touch-action:none;user-select:none}
.si-mz-box img{display:block;max-width:100%;max-height:420px}
.si-mz-h{position:absolute;left:-6px;right:-6px;height:0;border-top:3px solid #18A558;cursor:ns-resize;z-index:2}
.si-mz-h::before{content:'';position:absolute;left:0;right:0;top:-12px;height:24px}
.si-mz-h span{position:absolute;right:6px;top:-24px;background:#18A558;color:#fff;font:800 11px 'Nunito';padding:2px 8px;border-radius:6px;white-space:nowrap}
.si-mz-shade{position:absolute;left:0;right:0;top:0;background:rgba(31,42,68,.28);pointer-events:none}
.si-mz-v{position:absolute;top:-6px;bottom:-6px;width:0;border-left:3px solid #18A558;cursor:ew-resize;z-index:2;margin-left:-1.5px}
.si-mz-v::before{content:'';position:absolute;top:0;bottom:0;left:-12px;width:24px}
.si-mz-span{position:absolute;bottom:-14px;height:0;border-top:2px dashed #18A558}
@media (max-width:760px){
 .si-wrap{padding:10px 12px 50px}
 .si-hero{grid-template-columns:1fr;padding:18px;gap:16px}
 .si-hero h1{font-size:26px}.si-hero-art{height:190px}
 .si-two{grid-template-columns:1fr}
 .si-stats{grid-template-columns:repeat(2,1fr)}
 .si-q h2{font-size:21px}
 .si-stage{height:46vh;min-height:250px}
 .si-ctrl{grid-template-columns:1fr;gap:10px}
 .si-guess{text-align:center}.si-guess b{min-width:0}
 .si-lock{width:100%}
 .si-logo b{font-size:18px}.si-logo-r{width:38px;height:38px;font-size:20px}
 .si-adm-form{grid-template-columns:1fr}.si-adm-form .w2{grid-column:1}
 .si-res-top{gap:12px}.si-res-score b{font-size:32px}
}`; document.head.appendChild(st); }

let C=null, ROOT=null;               // ctx (app.js-ээс), үндсэн элемент
let ITEMS=[], OVR={}, loaded=false;
let G=null;                           // идэвхтэй тоглолт
const DAILY_N=5;

// ── туслах ──
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function fmt(m){ const a=Math.abs(m);
  const r=(v,d)=>{ let t=v.toFixed(d); if(t.includes('.')) t=t.replace(/0+$/,'').replace(/\.$/,''); const [i,f]=t.split('.'); return i.replace(/\B(?=(\d{3})+(?!\d))/g,' ')+(f?'.'+f:''); };
  if(a>=1e9) return r(m/1e9,2)+' сая км';
  if(a>=1e4) return r(m/1000,a>=1e5?0:1)+' км';
  if(a>=1000) return r(m,0)+' м';
  if(a>=10) return r(m,1)+' м';
  if(a>=1) return r(m,2)+' м';
  if(a>=0.01) return r(m*100,1)+' см';
  return r(m*1000,1)+' мм'; }
function todayUB(){ return new Date(Date.now()+8*3600e3).toISOString().slice(0,10); }
function hash(s){ let h=2166136261; for(const c of s){ h^=c.charCodeAt(0); h=Math.imul(h,16777619); } return h>>>0; }
function rng(seed){ let a=seed>>>0; return ()=>{ a=(a+0x6D2B79F5)>>>0; let t=a; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; }; }
function shuffle(arr,r){ const a=arr.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(r()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function scoreOf(g,a){ const e=Math.abs(Math.log(g/a)); return Math.max(0,Math.round(100*(1-e/Math.log(3)))); }
function verdict(s){ return s>=95?['Төгс!','🎯']:s>=85?['Гайхалтай','🔥']:s>=70?['Сайн','👍']:s>=50?['Ойрхон','🙂']:s>=25?['Хол байна','😬']:['Огт өөр','🙈']; }
function tile(s){ return s>=85?'🟩':s>=65?'🟨':s>=40?'🟧':'🟥'; }
function lsGet(k){ try{ return JSON.parse(localStorage.getItem(k)||'null'); }catch(e){ return null; } }
function lsSet(k,v){ try{ localStorage.setItem(k,JSON.stringify(v)); }catch(e){} }

// ── объектын геометр ──
function artOf(it){
  if(it.img && it.imgW && it.imgH) return {W:it.imgW,H:it.imgH,img:it.img,mt:(it.imgMt||0)*it.imgH,ml:it.imgMl||0,mr:it.imgMr||0};
  const a=ART[it.art||it.id]; if(!a){ const c=/^#[0-9a-f]{3,8}$/i.test(it.color||'')?it.color:'#9AA5B1';
    return it.cat==='space'?{W:100,H:100,svg:`<circle cx="50" cy="50" r="50" fill="${c}"/><circle cx="36" cy="36" r="30" fill="#fff" opacity=".12"/>`}:{W:100,H:100,svg:`<rect width="100" height="100" rx="12" fill="${c}"/>`}; }
  return {W:a[0],H:a[1],svg:a[2]};
}
// бодит өндөр/өргөн (метр) — size нь хэмжилтийн хэмжээ
function realBox(it,size){ const a=artOf(it), mt=(a.img?(a.mt||0):(it.mt||0));
  if(it.dim==='w'){ const f=Math.max(0.05,1-(a.ml||0)-(a.mr||0)), w=size/f, h=w*a.H/a.W; return {w,h,mt:0,ml:(a.ml||0),mr:(a.mr||0),a}; }
  const h=size*a.H/(a.H-mt), w=h*a.W/a.H; return {w,h,mt:mt*h/a.H,a}; }
function artEl(it,cls){ const a=artOf(it);
  if(a.img) return `<img class="${cls}" src="${esc(a.img)}" alt="" draggable="false" decoding="async">`;
  return `<svg class="${cls}" viewBox="0 0 ${a.W} ${a.H}" preserveAspectRatio="none" overflow="visible">${a.svg}</svg>`; }

// ── өгөгдөл ачаалах: суурь жагсаалт + админы өөрчлөлт (si_items) ──
async function loadItems(force){
  if(loaded&&!force) return;
  OVR={};
  try{ const s=await getDocs(collection(C.fsdb,'si_items')); s.forEach(d=>OVR[d.id]=d.data()); }catch(e){ console.warn('[SI] si_items',e); }
  const base=SI_ITEMS.map(it=>({...it,...(OVR[it.id]||{})}));
  const custom=Object.entries(OVR).filter(([id,v])=>v&&v.custom&&!SI_ITEMS.find(x=>x.id===id)).map(([id,v])=>({ref:0,...v,id}));
  ITEMS=[...base,...custom].filter(it=>it.size>0&&it.n);
  loaded=true;
}
const playable=()=>ITEMS.filter(it=>!it.hidden&&!it.refOnly);
function refPool(ex){ return [...ITEMS.filter(it=>it.ref&&!it.hidden&&it.id!==ex.id), ...SI_REFS]; }
function pickRefs(it,r){
  const pool=refPool(it), A=it.size;
  const near=pool.filter(p=>{ const k=p.size/A; return k>1/7&&k<7&&(k<0.8||k>1.25); });
  const lo=shuffle(near.filter(p=>p.size<A),r).sort((a,b)=>b.size-a.size).slice(0,3);
  const hi=shuffle(near.filter(p=>p.size>A),r).sort((a,b)=>a.size-b.size).slice(0,3);
  const out=[]; if(lo.length) out.push(lo[Math.floor(r()*lo.length)]); if(hi.length) out.push(hi[Math.floor(r()*hi.length)]);
  if(out.length<2){ const rest=pool.filter(p=>!out.includes(p)).sort((a,b)=>Math.abs(Math.log(a.size/A))-Math.abs(Math.log(b.size/A))); while(out.length<2&&rest.length) out.push(rest.shift()); }
  return out.sort((a,b)=>a.size-b.size);
}
function dailyItems(day){
  const r=rng(hash('si-'+day)), all=playable();
  const mn=shuffle(all.filter(x=>x.cat==='mn'),r), other=shuffle(all.filter(x=>x.cat!=='mn'),r);
  const pick=[], cats=new Set();
  for(const x of mn){ if(pick.length>=2) break; pick.push(x); }
  for(const x of other){ if(pick.length>=DAILY_N) break; if(cats.has(x.cat)) continue; cats.add(x.cat); pick.push(x); }
  for(const x of other){ if(pick.length>=DAILY_N) break; if(!pick.includes(x)) pick.push(x); }
  return shuffle(pick,r).map(it=>({it,refs:pickRefs(it,r)}));
}

// ══════════════════ ДЭЛГЭЦҮҮД ══════════════════
function shell(inner){ ROOT.innerHTML=`<div class="si-wrap">${inner}</div>`; }
function header(sub){ return `<header class="si-head"><button class="si-logo" onclick="siHome()"><span class="si-logo-r">📏</span><span><b>SIZE IT UP</b><i>Хэмжээг нүдээрээ таа</i></span></button>${sub||''}</header>`; }

async function home(){
  shell(header()+`<div class="si-loading">Ачаалж байна…</div>`);
  await loadItems();
  const day=todayUB(), done=lsGet('si_daily_'+day);
  const st=stats();
  shell(header()+`
   <section class="si-hero">
     <div class="si-hero-copy">
       <span class="si-kicker">Өдөр бүр шинэ 5 бодлого</span>
       <h1>Төрийн ордон хэр өндөр вэ? <em>Тэмээ хэр том вэ?</em></h1>
       <p>Объектын зургийг танил зүйлсийн хажууд жинхэнэ харьцаагаар нь томруулж, жижигрүүлж тааварла. Хэмжээ бүр албан ёсны эх сурвалжаас авсан.</p>
       <div class="si-hero-acts">
         <button class="si-btn si-btn-main" onclick="siStartDaily()">${done?'Өнөөдрийн дүн харах':'▶ Өдрийн сорил эхлэх'}</button>
         <span class="si-hero-note">${day} · ${done?`<b>${done.total}/500</b> оноо авсан`:'5 үе · 1 оролдлого'}</span>
       </div>
     </div>
     <div class="si-hero-art${OVR._hero&&OVR._hero.img?' si-hero-has':''}" aria-hidden="true">${OVR._hero&&OVR._hero.img?`<img class="si-hero-img" src="${esc(OVR._hero.img)}" alt="">`:heroArt()}
       ${C.isAdmin()?`<label class="si-hero-edit">🖼 Зураг солих<input type="file" accept="image/*" onchange="siHeroImg(this)"></label>${OVR._hero&&OVR._hero.img?'<button class="si-hero-edit si-hero-del" onclick="siHeroDel()">Анхных</button>':''}`:''}</div>
   </section>
   <section class="si-sec"><h2>Чөлөөт дасгал</h2><p class="si-sub">Ангиллаа сонгоод хязгааргүй тогло.</p>
     <div class="si-cats">${[{id:'all',label:'Бүгд',icon:'🎲'},...SI_CATS].map(c=>{ const n=c.id==='all'?playable().length:playable().filter(x=>x.cat===c.id).length;
       return n?`<button class="si-cat" onclick="siStartPractice('${c.id}')"><span>${c.icon}</span><b>${esc(c.label)}</b><i>${n} объект</i></button>`:''; }).join('')}</div>
   </section>
   <section class="si-sec si-two">
     <div><h2>Өнөөдрийн шилдэгүүд</h2><div id="siBoard" class="si-board"><div class="si-muted">Ачаалж байна…</div></div></div>
     <div><h2>Таны амжилт</h2><div class="si-stats">
       <div><b>${st.days}</b><i>өдөр тоглосон</i></div><div><b>${st.best||'—'}</b><i>шилдэг оноо</i></div><div><b>${st.avg||'—'}</b><i>дундаж</i></div><div><b>${st.streak}</b><i>дараалсан өдөр</i></div></div>
       <h3 class="si-how-h">Хэрхэн тоглох вэ?</h3>
       <ol class="si-how"><li>Объектыг танил зүйлсийн хажууд жинхэнэ харьцаагаар нь харна.</li><li>Гулсуурыг чирж, эсвэл дүрсийг дээш доош чирж хэмжээг нь тааруулна.</li><li>«Баталгаажуулах» дарахад жинхэнэ хэмжээ, эх сурвалж гарна.</li><li>Таамаг 3 дахин зөрвөл 0, яг таавал 100 оноо.</li></ol></div>
   </section>
   ${C.isAdmin()?`<section class="si-sec si-admin-bar"><button class="si-btn" onclick="siAdmin()">⚙ Объектууд удирдах</button><button class="si-btn si-btn-danger" onclick="siPurgeCountDash()">🗑 CountDash-ийн хуучин өгөгдлийг устгах</button></section>`:''}
   <footer class="si-foot">Зураг бүр Bolor Games-ийн зурсан хэв загварчилсан дүрс. Хэмжээ нь тухайн объектын албан ёсны / нийтлэгдсэн утга.</footer>`);
  loadBoard(day);
}
function heroArt(){ const ids=['morin_khuur','mn_man','mn_horse','camel','ger','bankhar'];
  const its=ids.map(id=>ITEMS.find(x=>x.id===id)||SI_ITEMS.find(x=>x.id===id)).filter(Boolean), bs=its.map(it=>realBox(it,it.size));
  const s=Math.min(190/Math.max(...bs.map(b=>b.h)), 430/bs.reduce((a,b)=>a+b.w,0));
  return `<div class="si-hero-row">${its.map((it,k)=>`<div class="si-hero-obj" style="height:${bs[k].h*s}px;width:${bs[k].w*s}px">${artEl(it,'si-art')}</div>`).join('')}</div><div class="si-hero-ground"></div>`; }
function stats(){ const h=lsGet('si_hist')||{}; const days=Object.keys(h).sort(); const vals=days.map(d=>h[d]);
  let streak=0; let d=new Date(todayUB()+'T00:00:00Z'); while(h[d.toISOString().slice(0,10)]!=null){ streak++; d=new Date(d-864e5); }
  return {days:days.length,best:vals.length?Math.max(...vals):0,avg:vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length):0,streak}; }
async function loadBoard(day){
  const el=document.getElementById('siBoard'); if(!el) return;
  try{ const s=await getDocs(query(collection(C.fsdb,'si_scores'),where('day','==',day)));
    const rows=[]; s.forEach(d=>rows.push(d.data())); rows.sort((a,b)=>b.score-a.score||a.at-b.at);
    const me=C.user()?.uid;
    el.innerHTML=rows.length?rows.slice(0,15).map((r,i)=>`<div class="si-row${r.uid===me?' me':''}"><span>${i+1}</span><b>${esc(r.name)}</b><i>${r.tiles||''}</i><em>${r.score}</em></div>`).join(''):'<div class="si-muted">Өнөөдөр хараахан хэн ч тоглоогүй байна. Эхний нь болоорой!</div>';
  }catch(e){ el.innerHTML='<div class="si-muted">Самбарыг ачаалж чадсангүй.</div>'; console.warn('[SI] board',e); }
}

// ── эрх шалгах ──
async function canPlay(){
  if(C.isAdmin()) return true;
  if(!C.user()){ C.notify('Size It Up тоглохын тулд эхлээд нэвтэрнэ үү.'); C.openLogin(); return false; }
  if(await C.isPaid()) return true;
  C.showSubRequired(); return false;
}
async function startDaily(){
  const day=todayUB(), done=lsGet('si_daily_'+day);
  if(done){ G={mode:'daily',day,rounds:done.rounds.map(r=>({it:ITEMS.find(x=>x.id===r.id)||SI_ITEMS.find(x=>x.id===r.id),guess:r.g,score:r.s})),i:DAILY_N}; return finish(true); }
  if(!(await canPlay())) return;
  G={mode:'daily',day,rounds:dailyItems(day),i:0}; round();
}
async function startPractice(cat){
  if(!(await canPlay())) return;
  G={mode:'practice',cat,rounds:[],i:0,seen:new Set(),r:rng(Date.now())};
  nextPractice();
}
function nextPractice(){ let pool=playable().filter(x=>G.cat==='all'||x.cat===G.cat);
  let fresh=pool.filter(x=>!G.seen.has(x.id)); if(!fresh.length){ G.seen.clear(); fresh=pool; }
  const it=fresh[Math.floor(G.r()*fresh.length)]; G.seen.add(it.id);
  G.rounds.push({it,refs:pickRefs(it,G.r)}); G.i=G.rounds.length-1; round(); }

// ══════════════ ҮЕ (ROUND) ══════════════
let R=null; // одоогийн үеийн төлөв
function round(){
  const rd=G.rounds[G.i], it=rd.it, refs=rd.refs;
  const sizes=refs.map(r=>r.size);
  const lo=Math.min(...sizes,it.size)/15, hi=Math.max(...sizes,it.size)*15;
  const r0=G.mode==='daily'?rng(hash(G.day+it.id)):Math.random;
  // Эхлэх хэмжээ: жинхэнэ хэмжээнээс хол (оноо ≤ 15) байхаар — шууд дарахад оноо өгөхгүй
  const up=r0()<0.5; let g0=up?Math.max(...sizes)*(2+1.5*r0()):Math.min(...sizes)/(2+1.5*r0());
  for(let k=0;k<12&&scoreOf(g0,it.size)>15;k++) g0*=up?1.35:1/1.35;
  R={it,refs,lo:Math.log(lo),hi:Math.log(hi),g:Math.min(hi,Math.max(lo,g0)),locked:false,scale:null};
  const prog=G.mode==='daily'?`<div class="si-prog">${Array.from({length:DAILY_N},(_,k)=>`<span class="${k<G.i?'done':k===G.i?'on':''}">${k<G.i?tile(G.rounds[k].score):k+1}</span>`).join('')}</div>`
    :`<div class="si-prog si-prog-p"><span>Дасгал · ${G.rounds.length}-р объект</span>${G.rounds.length>1?`<b>Дундаж ${Math.round(G.rounds.slice(0,-1).reduce((a,x)=>a+x.score,0)/(G.rounds.length-1))}</b>`:''}</div>`;
  const cat=SI_CATS.find(c=>c.id===it.cat);
  shell(header(`<button class="si-x" onclick="siHome()" title="Гарах">✕</button>`)+`
   ${prog}
   <div class="si-q"><span class="si-tag">${cat?cat.icon+' '+esc(cat.label):'❓'}</span><h2>${esc(it.n)}</h2><p>${it.dim==='w'?'Урт / өргөн нь хэд вэ?':'Өндөр нь хэд вэ?'}</p></div>
   <div class="si-stage" id="siStage"><div class="si-grid" id="siGrid"></div><div class="si-world" id="siWorld"></div><div class="si-ground"></div></div>
   <div class="si-ctrl" id="siCtrl">
     <div class="si-guess"><span>Таны таамаг</span><b id="siVal">${fmt(R.g)}</b></div>
     <div class="si-slider"><button class="si-step" onclick="siNudge(-1)" aria-label="Жижигрүүлэх">−</button>
       <input type="range" id="siRange" min="0" max="1000" step="1" value="${Math.round((Math.log(R.g)-R.lo)/(R.hi-R.lo)*1000)}" oninput="siSlide(this.value)">
       <button class="si-step" onclick="siNudge(1)" aria-label="Томруулах">+</button></div>
     <button class="si-btn si-btn-main si-lock" onclick="siLock()">Баталгаажуулах</button>
   </div>
   <div class="si-result" id="siResult"></div>`);
  buildWorld(); layout(false); bindDrag();
}
function buildWorld(){
  const w=document.getElementById('siWorld');
  const objs=[...R.refs.map(r=>({it:r,ref:1})),{it:R.it,mys:1}];
  // нууц объектыг голд нь байрлуулна
  if(objs.length===3) [objs[1],objs[2]]=[objs[2],objs[1]];
  R.objs=objs;
  w.innerHTML=objs.map((o,k)=>`<div class="si-obj${o.mys?' si-mys':''}" id="siO${k}">
     <div class="si-obj-art">${artEl(o.it,'si-art')}</div>
     ${o.mys?'<div class="si-ghost" id="siGhost">'+artEl(o.it,'si-art')+'<span>таны таамаг</span></div><div class="si-meas" id="siMeas"><i></i><b></b></div>'+'<div class="si-lbl si-lbl-me"><b>▼ '+esc(o.it.n.replace(/\s*\(.*\)$/,'').replace(/\s+—.*$/,''))+'</b></div>':`<div class="si-lbl"><b>${esc(o.it.n.replace(/\s*\(.*\)$/,''))}</b><i>${fmt(o.it.size)}</i></div>`}
   </div>`).join('');
}
function layout(anim){
  const st=document.getElementById('siStage'); if(!st) return;
  const SW=st.clientWidth, SH=st.clientHeight, gap=Math.max(14,SW*0.04), pad=18, top=SH*0.16;
  const size=o=>o.mys?(R.locked?R.it.size:R.g):o.it.size;
  const boxes=R.objs.map(o=>realBox(o.it,size(o)));
  if(R.locked) R.ghostBox=realBox(R.it,R.g);
  const maxH=Math.max(...boxes.map(b=>b.h),R.locked?R.ghostBox.h:0);
  const sumW=boxes.reduce((a,b)=>a+b.w,0)+(R.locked?0:0);
  // масштаб: бүх зүйл багтана; жижиг объект ч харагдахуйц (min 6px)
  let s=Math.min((SH-top-26)/maxH,(SW-pad*2-gap*(boxes.length-1))/sumW);
  R.scale=s;
  st.classList.toggle('si-anim',!!anim);
  let x=pad+Math.max(0,(SW-pad*2-gap*(boxes.length-1)-sumW*s)/2);
  R.objs.forEach((o,k)=>{ const b=boxes[k], el=document.getElementById('siO'+k);
    const wpx=Math.max(3,b.w*s), hpx=Math.max(3,b.h*s);
    el.style.left=x+'px'; el.style.width=wpx+'px'; el.style.height=hpx+'px';
    el.classList.toggle('si-tiny',hpx<26&&wpx<26);
    if(o.mys){ const meas=el.querySelector('.si-meas');
      const mtp=b.mt*s; meas.style.top=mtp+'px'; meas.style.height=Math.max(2,hpx-mtp)+'px';
      meas.classList.toggle('si-meas-w',o.it.dim==='w');
      if(o.it.dim==='w'){ meas.style.marginLeft=(b.ml||0)*wpx+'px'; meas.style.width=(1-(b.ml||0)-(b.mr||0))*wpx+'px'; } else { meas.style.marginLeft=''; meas.style.width=''; }
      meas.querySelector('b').textContent=fmt(R.locked?R.it.size:R.g);
      const gh=el.querySelector('.si-ghost');
      if(R.locked){ const gb=R.ghostBox, gw=gb.w*s, ghh=gb.h*s; gh.style.width=gw+'px'; gh.style.height=ghh+'px'; gh.style.left=((wpx-gw)/2)+'px'; gh.style.display='block'; }
      else gh.style.display='none'; }
    x+=wpx+gap; });
  grid(s,SH);
  requestAnimationFrame(()=>{ const sr=st.getBoundingClientRect(); st.querySelectorAll('.si-lbl').forEach(l=>{ l.style.marginLeft='0px';
    const b=l.getBoundingClientRect(); let dx=0; if(b.left<sr.left+6) dx=sr.left+6-b.left; else if(b.right>sr.right-6) dx=sr.right-6-b.right; if(dx) l.style.marginLeft=dx+'px'; }); });
}
// газрын шугамаас дээш хэмжүүрийн зураас (1, 2, 5 × 10ⁿ)
function grid(s,SH){ const g=document.getElementById('siGrid'); if(!g) return;
  const usable=SH-26, maxM=usable/s; let step=Math.pow(10,Math.floor(Math.log10(maxM/4)));
  for(const k of [1,2,5,10]){ if(maxM/(step*k)<=6){ step*=k; break; } }
  let h=''; for(let v=step; v*s<usable-8; v+=step){ h+=`<div class="si-gl" style="bottom:${26+v*s}px"><span>${fmt(v)}</span></div>`; }
  g.innerHTML=h; }
function setGuess(v,anim){ R.g=Math.exp(Math.min(R.hi,Math.max(R.lo,v)));
  const rg=document.getElementById('siRange'); if(rg) rg.value=Math.round((Math.log(R.g)-R.lo)/(R.hi-R.lo)*1000);
  document.getElementById('siVal').textContent=fmt(R.g); layout(anim); }
function slide(v){ if(R.locked) return; setGuess(R.lo+(R.hi-R.lo)*v/1000,false); }
function nudge(d){ if(R.locked) return; setGuess(Math.log(R.g)+d*0.04,true); }
function bindDrag(){
  const st=document.getElementById('siStage'); let y0=null, g0=0;
  const down=e=>{ if(R.locked) return; const p=e.touches?e.touches[0]:e; y0=p.clientY; g0=Math.log(R.g); st.classList.add('si-drag'); };
  const move=e=>{ if(y0==null) return; const p=e.touches?e.touches[0]:e; const dy=y0-p.clientY; setGuess(g0+dy*0.006,false); if(e.cancelable) e.preventDefault(); };
  const up=()=>{ y0=null; st.classList.remove('si-drag'); };
  st.addEventListener('pointerdown',down); window.addEventListener('pointermove',move); window.addEventListener('pointerup',up);
  st.addEventListener('touchmove',e=>{ if(y0!=null&&e.cancelable) e.preventDefault(); },{passive:false});
  st.addEventListener('wheel',e=>{ if(R.locked) return; e.preventDefault(); setGuess(Math.log(R.g)-Math.sign(e.deltaY)*0.03,false); },{passive:false});
  window.onresize=()=>R&&layout(false);
  document.onkeydown=e=>{ if(!R||!document.getElementById('siStage')) return;
    if(e.key==='ArrowUp'||e.key==='ArrowRight'){ nudge(1); e.preventDefault(); } else if(e.key==='ArrowDown'||e.key==='ArrowLeft'){ nudge(-1); e.preventDefault(); }
    else if(e.key==='Enter'){ R.locked?next():lock(); } };
}
function lock(){
  if(R.locked) return; R.locked=true;
  const s=scoreOf(R.g,R.it.size); G.rounds[G.i].guess=R.g; G.rounds[G.i].score=s;
  document.getElementById('siStage').classList.add('si-revealed');
  layout(true);
  const [vw,em]=verdict(s), it=R.it, ratio=R.g/it.size;
  const last=G.mode==='daily'&&G.i===DAILY_N-1;
  document.getElementById('siCtrl').style.display='none';
  const el=document.getElementById('siResult');
  el.innerHTML=`<div class="si-res-card">
     <div class="si-res-top"><div class="si-res-score"><b data-n="${s}">0</b><i>/100</i></div>
       <div><div class="si-res-v">${em} ${vw}</div><div class="si-res-nums">Жинхэнэ: <b>${fmt(it.size)}</b> · Таны: <b>${fmt(R.g)}</b> <span class="${ratio>1?'up':'down'}">${ratio>1?'▲':'▼'} ${ratio>1?ratio.toFixed(ratio<10?2:0)+'×':(1/ratio).toFixed(1/ratio<10?2:0)+'×'} ${ratio>1?'их':'бага'}</span></div></div></div>
     ${it.fact?`<p class="si-fact">💡 ${esc(it.fact)}</p>`:''}
     <div class="si-src">Эх сурвалж: ${it.url?`<a href="${esc(it.url)}" target="_blank" rel="noopener">${esc(it.src||it.url)}</a>`:esc(it.src||'—')}</div>
     <button class="si-btn si-btn-main" onclick="siNext()">${G.mode==='daily'?(last?'Дүнгээ харах →':'Дараагийнх →'):'Дараагийн объект →'}</button>
     ${G.mode==='practice'?'<button class="si-btn si-btn-ghost" onclick="siHome()">Дуусгах</button>':''}
   </div>`;
  countUp(el.querySelector('.si-res-score b'));
  el.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function countUp(b){ const n=+b.dataset.n; let t0=null; const f=t=>{ if(!t0) t0=t; const k=Math.min(1,(t-t0)/700); b.textContent=Math.round(n*(1-Math.pow(1-k,3))); if(k<1) requestAnimationFrame(f); }; requestAnimationFrame(f); }
function next(){ if(!R||!R.locked) return;
  if(G.mode==='practice') return nextPractice();
  G.i++; if(G.i>=DAILY_N) return finish(false); round(); }

// ── Өдрийн дүн ──
async function finish(already){
  R=null;
  const total=G.rounds.reduce((a,r)=>a+(r.score||0),0), tiles=G.rounds.map(r=>tile(r.score||0)).join('');
  if(!already){
    lsSet('si_daily_'+G.day,{total,rounds:G.rounds.map(r=>({id:r.it.id,g:r.guess,s:r.score}))});
    const h=lsGet('si_hist')||{}; h[G.day]=total; lsSet('si_hist',h);
  }
  const share=`Size It Up ${G.day}\n${tiles} ${total}/500\nbolorgames.com`;
  const u=C.user();
  shell(header()+`<section class="si-final">
    <span class="si-kicker">Өдрийн сорил · ${G.day}</span>
    <div class="si-final-score"><b data-n="${total}">0</b><i>/500</i></div>
    <div class="si-final-tiles">${tiles}</div>
    <div class="si-final-list">${G.rounds.map(r=>`<div><span>${tile(r.score||0)}</span><b>${esc(r.it?r.it.n:'')}</b><i>${r.it?fmt(r.it.size):''} · таны ${fmt(r.guess||0)}</i><em>${r.score||0}</em></div>`).join('')}</div>
    <div class="si-final-acts">
      <button class="si-btn si-btn-main" onclick="siShare()">📤 Хуваалцах</button>
      <button class="si-btn" onclick="siStartPractice('all')">🎲 Дасгал хийх</button>
      <button class="si-btn si-btn-ghost" onclick="siHome()">Нүүр</button></div>
    ${!already&&u?`<div class="si-submit"><input id="siName" maxlength="20" placeholder="Самбарт харагдах нэр" value="${esc((lsGet('si_name')||u.displayName||'').slice(0,20))}"><button class="si-btn" onclick="siSubmit()">Самбарт нэмэх</button></div>`:''}
    <p class="si-muted">Маргааш шинэ 5 объект гарна.</p>
  </section>`);
  countUp(ROOT.querySelector('.si-final-score b'));
  G.share=share; G.total=total; G.tiles=tiles;
}
async function submit(){
  const u=C.user(); if(!u) return; const name=(document.getElementById('siName').value||'').trim().slice(0,20);
  if(!name){ C.notify('Нэрээ бичнэ үү'); return; } lsSet('si_name',name);
  try{ await C.setDoc(doc(C.fsdb,'si_scores',G.day+'_'+u.uid),{day:G.day,uid:u.uid,name,score:G.total,tiles:G.tiles,at:Date.now()});
    C.notify('Самбарт нэмэгдлээ ✓'); const b=ROOT.querySelector('.si-submit'); if(b) b.innerHTML='<div class="si-muted">✓ Самбарт нэмэгдсэн</div>'; }
  catch(e){ console.warn(e); C.notify(e.code==='permission-denied'?'Өнөөдөр аль хэдийн нэмсэн эсвэл эрх хүрэлцэхгүй байна.':'Нэмэхэд алдаа гарлаа'); }
}
async function shareRes(){ try{ if(navigator.share){ await navigator.share({text:G.share}); return; } }catch(e){ if(e.name==='AbortError') return; }
  try{ await navigator.clipboard.writeText(G.share); C.notify('Хуулагдлаа ✓'); }catch(e){ prompt('Хуулна уу:',G.share); } }

// ══════════════ АДМИН ══════════════
async function admin(){
  if(!C.isAdmin()) return; await loadItems(true);
  shell(header(`<button class="si-x" onclick="siHome()">✕</button>`)+`<section class="si-sec"><h2>Объектууд (${ITEMS.length})</h2>
   <p class="si-sub">Хэмжээ, эх сурвалжийг засах, өөрийн зургийг (тунгалаг дэвсгэртэй PNG/WebP) оруулах, нуух боломжтой. Шинэ объект доор нэмнэ.</p>
   <div class="si-imp"><h3>📥 Олноор нь оруулах (JSON файл)</h3>
    <p class="si-sub">Claude-аас авсан <b>.json</b> файлыг сонгоход урьдчилан харуулна, дараа нь «Импорт хийх» дарна. Ижил <b>id</b> эсвэл ижил нэртэй объект байвал шинэчилнэ, байгаа зургийг нь хөндөхгүй. Зургийг дараа нь объект бүрийн «Засах» хэсгээс нэмнэ.</p>
    <div class="si-adm-acts"><label class="si-btn">📂 Файл сонгох<input type="file" accept=".json,application/json" hidden onchange="siImpFile(this)"></label><button class="si-btn si-btn-ghost" onclick="siImpTpl()">⬇ Загвар файл татах</button></div>
    <div id="siImpPrev"></div></div>
   <div class="si-adm-list">${ITEMS.map(it=>admRow(it)).join('')}</div>
   <h2 style="margin-top:28px">+ Шинэ объект</h2>${admForm(null)}</section>`);
}
function admRow(it){ return `<div class="si-adm-row${it.hidden?' off':''}"><div class="si-adm-th">${artEl(it,'si-art')}</div>
   <div class="si-adm-main"><b>${esc(it.n)}</b><i>${esc((SI_CATS.find(c=>c.id===it.cat)||{}).label||it.cat)} · ${it.dim==='w'?'урт':'өндөр'} ${fmt(it.size)}${it.ref?' · харьцуулалт':''}${OVR[it.id]?' · <u>засварласан</u>':''}</i><small>${esc(it.src||'')}</small></div>
   <button class="si-btn si-btn-sm" onclick="siAdmEdit('${it.id}')">Засах</button></div><div id="siAE_${it.id}"></div>`; }
function admForm(it){ const v=it||{n:'',cat:'mn',size:'',dim:'h',src:'',url:'',fact:'',ref:0};
  const id=it?it.id:'new';
  return `<div class="si-adm-form" data-id="${id}">
   <label>Нэр<input id="siF_n_${id}" value="${esc(v.n)}"></label>
   <label>Ангилал<select id="siF_cat_${id}">${SI_CATS.map(c=>`<option value="${c.id}"${c.id===v.cat?' selected':''}>${c.label}</option>`).join('')}</select></label>
   <label>Хэмжээ (метрээр)<input id="siF_size_${id}" type="number" step="any" value="${v.size}"></label>
   <label>Юуг хэмжсэн<select id="siF_dim_${id}"><option value="h"${v.dim!=='w'?' selected':''}>Өндөр</option><option value="w"${v.dim==='w'?' selected':''}>Урт / өргөн</option></select></label>
   <label class="w2">Сонирхолтой баримт<input id="siF_fact_${id}" value="${esc(v.fact||'')}"></label>
   <label>Эх сурвалжийн нэр<input id="siF_src_${id}" value="${esc(v.src||'')}"></label>
   <label>Эх сурвалжийн холбоос<input id="siF_url_${id}" value="${esc(v.url||'')}"></label>
   <label class="chk"><input type="checkbox" id="siF_ref_${id}"${v.ref?' checked':''}> Харьцуулах объект болгох</label>
   ${it?`<label class="chk"><input type="checkbox" id="siF_hid_${id}"${v.hidden?' checked':''}> Тоглоомоос нуух</label>`:''}
   <label class="w2">Зураг (PNG/JPG/WebP — дэвсгэртэй байсан ч болно)<input type="file" accept="image/*" id="siF_img_${id}" onchange="siAdmPick('${id}',this)"></label>
   <label class="chk w2"><input type="checkbox" id="siF_bg_${id}" checked onchange="siAdmPick('${id}',document.getElementById('siF_img_${id}'))"> Дэвсгэрийг автоматаар арилгах (цагаан, хар эсвэл нэг өнгийн дэвсгэртэй зурагт)</label>
   <div class="w2 si-mz" id="siMZ_${id}">${v.img?mzHTML(id,v.img,v.dim,v.imgMt||0,v.imgMl||0,v.imgMr||0):''}</div>
   <div class="w2 si-adm-acts"><button class="si-btn si-btn-main" onclick="siAdmSave('${id}')">Хадгалах</button>
   ${it&&OVR[it.id]?`<button class="si-btn si-btn-ghost" onclick="siAdmReset('${id}')">${it.custom?'Устгах':'Анхны утга руу буцаах'}</button>`:''}${it&&it.img?`<button class="si-btn si-btn-ghost" onclick="siAdmNoImg('${id}')">Зургийг авах</button>`:''}</div></div>`; }
function admEdit(id){ const box=document.getElementById('siAE_'+id); if(!box) return; if(box.innerHTML){ box.innerHTML=''; return; } box.innerHTML=admForm(ITEMS.find(x=>x.id===id)); const mb=box.querySelector('.si-mz-box'); if(mb) mzSync(mb); }
// ── Зураг боловсруулах: дэвсгэр арилгах (ирмэгээс үерлэх), хоосон захыг тайрах, 900px WebP ──
const PEND={};
function loadImg(src){ return new Promise((res,rej)=>{ const im=new Image(); im.onload=()=>res(im); im.onerror=rej; im.src=src; }); }
async function processImage(file,removeBg){
  const url=URL.createObjectURL(file); const im=await loadImg(url); URL.revokeObjectURL(url);
  let W=im.naturalWidth, H=im.naturalHeight; const k=Math.min(1,1400/Math.max(W,H)); W=Math.round(W*k); H=Math.round(H*k);
  const cv=document.createElement('canvas'); cv.width=W; cv.height=H; const cx=cv.getContext('2d',{willReadFrequently:true}); cx.drawImage(im,0,0,W,H);
  const D=cx.getImageData(0,0,W,H), d=D.data;
  // Зураг аль хэдийн тунгалаг дэвсгэртэй бол (захын ихэнх нь тунгалаг) дэвсгэр арилгахгүй — объектыг идчихээс сэргийлнэ
  if(removeBg){ let tr=0,tot=0; for(let x=0;x<W;x+=3){ for(const y of [0,H-1]){ tot++; if(d[(y*W+x)*4+3]<20) tr++; } } for(let y=0;y<H;y+=3){ for(const x of [0,W-1]){ tot++; if(d[(y*W+x)*4+3]<20) tr++; } } if(tr/tot>0.3) removeBg=false; }
  if(removeBg){
    // захын пикселүүдийн давамгай өнгө = дэвсгэр
    const edge=[]; for(let x=0;x<W;x+=4){ edge.push(x, (H-1)*W+x); } for(let y=0;y<H;y+=4){ edge.push(y*W, y*W+W-1); }
    const bins={}; for(const i of edge){ const o=i*4; if(d[o+3]<20) continue; const key=(d[o]>>4)+'_'+(d[o+1]>>4)+'_'+(d[o+2]>>4); bins[key]=(bins[key]||0)+1; }
    const top=Object.entries(bins).sort((a,b)=>b[1]-a[1])[0];
    if(top){ const [r0,g0,b0]=top[0].split('_').map(v=>v*16+8); const tol=46;
      const seen=new Uint8Array(W*H), st=[]; for(const i of edge) st.push(i);
      const near=o=>Math.abs(d[o]-r0)+Math.abs(d[o+1]-g0)+Math.abs(d[o+2]-b0)<tol*1.6||d[o+3]<20;
      while(st.length){ const i=st.pop(); if(seen[i]) continue; seen[i]=1; const o=i*4; if(!near(o)) continue; d[o+3]=0;
        const x=i%W, y=(i/W)|0; if(x>0) st.push(i-1); if(x<W-1) st.push(i+1); if(y>0) st.push(i-W); if(y<H-1) st.push(i+W); }
      // ирмэгийн хагас тунгалаг зөөлрүүлэлт
      for(let i=0;i<W*H;i++){ const o=i*4; if(d[o+3]===0) continue; const x=i%W,y=(i/W)|0; let z=0;
        if(x>0&&d[o-1]===0)z++; if(x<W-1&&d[o+7]===0)z++; if(y>0&&d[o-4*W+3]===0)z++; if(y<H-1&&d[o+4*W+3]===0)z++; if(z) d[o+3]=Math.min(d[o+3],255-z*45); }
    }
  }
  cx.putImageData(D,0,0);
  // хоосон захыг тайрах
  let x0=W,y0=H,x1=-1,y1=-1; for(let y=0;y<H;y++) for(let x=0;x<W;x++){ if(d[(y*W+x)*4+3]>24){ if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y; } }
  if(x1<0){ x0=0;y0=0;x1=W-1;y1=H-1; }
  const cw=x1-x0+1, ch=y1-y0+1, k2=Math.min(1,900/Math.max(cw,ch));
  const out=document.createElement('canvas'); out.width=Math.round(cw*k2); out.height=Math.round(ch*k2);
  const ox=out.getContext('2d'); ox.imageSmoothingQuality='high'; ox.drawImage(cv,x0,y0,cw,ch,0,0,out.width,out.height);
  let img=out.toDataURL('image/webp',0.86); if(!img.startsWith('data:image/webp')) img=out.toDataURL('image/png');
  return {img,w:out.width,h:out.height};
}
async function admPick(id,input){
  const f=input&&input.files&&input.files[0]; if(!f) return;
  const box=document.getElementById('siMZ_'+id); box.innerHTML='<div class="si-muted">Зураг боловсруулж байна…</div>';
  try{ const P=await processImage(f,document.getElementById('siF_bg_'+id).checked); PEND[id]=P;
    box.innerHTML=mzHTML(id,P.img,document.getElementById('siF_dim_'+id).value,0,0,0); mzSync(box.querySelector('.si-mz-box')); }
  catch(e){ console.error(e); box.innerHTML='<div class="si-muted">Зургийг уншиж чадсангүй.</div>'; }
}
// ── Хэмжилтийн шугам: аль хэсгийг «хэмжээ» гэж тооцохыг чирж заана ──
function mzHTML(id,img,dim,mt,ml,mr){
  const w=dim==='w';
  return `<div class="si-mz-help">${w?'Ногоон хоёр шугамыг объектын <b>хэмжсэн урт/өргөний</b> хоёр төгсгөл дээр чирж тавина. Шугамын гаднах хэсэг (туг, сүүдэр г.м.) хэмжээнд орохгүй.':'Ногоон шугамыг объектын <b>хэмжсэн өндрийн дээд цэг</b> дээр чирж тавина (жишээ нь дээврийн оройд). Түүнээс дээш хэсэг (туг, шон, бөмбөгөр) хэмжээнд орохгүй, доод тал нь газар.'}</div>
  <div class="si-mz-box" data-id="${id}" data-dim="${dim}"><img src="${esc(img)}" alt="" draggable="false">
   ${w?`<div class="si-mz-v" data-k="ml" style="left:${ml*100}%"></div><div class="si-mz-v" data-k="mr" style="left:${(1-mr)*100}%"></div><div class="si-mz-span" style="left:${ml*100}%;right:${mr*100}%"></div>`
      :`<div class="si-mz-h" data-k="mt" style="top:${mt*100}%"><span>хэмжилтийн дээд цэг</span></div><div class="si-mz-shade" style="height:${mt*100}%"></div>`}
  </div>`;
}
function mzSync(box){ const id=box.dataset.id, wrap=document.getElementById('siMZ_'+id); const g=k=>{ const el=box.querySelector(`[data-k="${k}"]`); return el?parseFloat(el.style[k==='mt'?'top':'left'])/100:0; };
  if(box.dataset.dim==='w'){ wrap.dataset.ml=g('ml').toFixed(4); wrap.dataset.mr=(1-g('mr')).toFixed(4); wrap.dataset.mt=0; const sp=box.querySelector('.si-mz-span'); if(sp){ sp.style.left=g('ml')*100+'%'; sp.style.right=(1-g('mr'))*100+'%'; } }
  else { wrap.dataset.mt=g('mt').toFixed(4); wrap.dataset.ml=0; wrap.dataset.mr=0; const sh=box.querySelector('.si-mz-shade'); if(sh) sh.style.height=g('mt')*100+'%'; } }
document.addEventListener('pointerdown',e=>{ const ln=e.target.closest&&e.target.closest('.si-mz-h,.si-mz-v'); if(!ln) return; e.preventDefault();
  const box=ln.parentElement, rc=box.getBoundingClientRect(), hz=ln.classList.contains('si-mz-h');
  const mv=ev=>{ let f=hz?(ev.clientY-rc.top)/rc.height:(ev.clientX-rc.left)/rc.width; f=Math.max(0,Math.min(hz?0.95:1,f));
    if(!hz){ const other=[...box.querySelectorAll('.si-mz-v')].find(x=>x!==ln), of=parseFloat(other.style.left)/100; if(ln.dataset.k==='ml') f=Math.min(f,of-0.03); else f=Math.max(f,of+0.03); }
    ln.style[hz?'top':'left']=(f*100)+'%'; mzSync(box); };
  const up=()=>{ window.removeEventListener('pointermove',mv); window.removeEventListener('pointerup',up); };
  window.addEventListener('pointermove',mv); window.addEventListener('pointerup',up); });
function imgDims(src){ return new Promise(res=>{ const im=new Image(); im.onload=()=>res([im.naturalWidth,im.naturalHeight]); im.onerror=()=>res([0,0]); im.src=src; }); }
async function admSave(id){
  const g=k=>document.getElementById(`siF_${k}_${id}`);
  const rec={n:g('n').value.trim(),cat:g('cat').value,size:parseFloat(g('size').value),dim:g('dim').value,fact:g('fact').value.trim(),src:g('src').value.trim(),url:g('url').value.trim(),ref:g('ref').checked?1:0,updatedAt:Date.now()};
  if(g('hid')) rec.hidden=g('hid').checked;
  if(!rec.n||!(rec.size>0)){ C.notify('Нэр, хэмжээг зөв бөглөнө үү'); return; }
  const f=g('img').files[0];
  try{
    const P=PEND[id];
    if(P){ rec.img=P.img; rec.imgW=P.w; rec.imgH=P.h; }
    const mz=document.getElementById('siMZ_'+id);
    if(mz&&mz.dataset.mt!=null){ rec.imgMt=+mz.dataset.mt||0; rec.imgMl=+mz.dataset.ml||0; rec.imgMr=+mz.dataset.mr||0; }
    if(f&&!P){ C.notify('Зураг боловсруулагдаж байна, түр хүлээгээд дахин дарна уу'); return; }
    const did=id==='new'?('c_'+Date.now().toString(36)):id;
    if(id==='new') rec.custom=true;
    await C.setDoc(doc(C.fsdb,'si_items',did),rec,{merge:true});
    delete PEND[id]; C.notify('Хадгаллаа ✓'); await admin();
  }catch(e){ console.error(e); C.notify('Хадгалахад алдаа гарлаа (Firestore дүрэмд si_items байгаа эсэхийг шалга)'); }
}
async function admReset(id){ if(!confirm('Энэ объектын өөрчлөлтийг устгах уу?')) return;
  try{ await deleteDoc(doc(C.fsdb,'si_items',id)); await admin(); }catch(e){ C.notify('Алдаа гарлаа'); } }
async function admNoImg(id){ try{ await C.setDoc(doc(C.fsdb,'si_items',id),{img:'',imgW:0,imgH:0},{merge:true}); await admin(); }catch(e){ C.notify('Алдаа гарлаа'); } }

// ── JSON импорт: олон объектыг нэг дор нэмэх/шинэчлэх (зурагнаас бусад бүх талбар) ──
let IMP=[];
const TR={а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'j',з:'z',и:'i',й:'i',к:'k',л:'l',м:'m',н:'n',о:'o',ө:'u',п:'p',р:'r',с:'s',т:'t',у:'u',ү:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'sh',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya'};
const slugOf=s=>String(s||'').toLowerCase().replace(/\(.*?\)/g,'').split('').map(c=>TR[c]!=null?TR[c]:c).join('').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,40);
function impNorm(raw){
  const arr=Array.isArray(raw)?raw:(raw&&Array.isArray(raw.items)?raw.items:null); if(!arr) throw new Error('items жагсаалт олдсонгүй');
  const used=new Set();
  return arr.map((x,i)=>{ const err=[]; x=x||{};
    const n=String(x.n||x.name||'').trim(); if(!n) err.push('нэр алга');
    const size=typeof x.size==='string'?parseFloat(x.size.replace(/[\s,]/g,'')):+x.size; if(!(size>0)) err.push('хэмжээ (метр) буруу');
    const dm=String(x.dim||'h').toLowerCase(); const dim=/^(w|width|length|урт|өргөн|диаметр)/.test(dm)?'w':'h';
    let cat=String(x.cat||'').trim(); const cf=SI_CATS.find(c=>c.id===cat||c.label.toLowerCase()===cat.toLowerCase()); if(cf) cat=cf.id; else err.push('ангилал «'+cat+'» алга');
    let id=String(x.id||'').trim().replace(/[^A-Za-z0-9_-]/g,'');
    const byName=ITEMS.find(it=>it.n.trim().toLowerCase()===n.toLowerCase());
    if(!id) id=byName?byName.id:('c_'+(slugOf(n)||Date.now().toString(36)+i));
    if(used.has(id)) err.push('id давхардсан'); used.add(id);
    const ex=ITEMS.find(it=>it.id===id);
    const rec={n,cat,size,dim,fact:String(x.fact||'').trim(),src:String(x.src||'').trim(),url:String(x.url||'').trim(),ref:x.ref?1:0,updatedAt:Date.now()};
    if(x.hidden!=null) rec.hidden=!!x.hidden;
    if(/^#[0-9a-f]{3,8}$/i.test(x.color||'')) rec.color=x.color;
    if(x.art&&ART[x.art]) rec.art=x.art;
    if(!SI_ITEMS.find(b=>b.id===id)) rec.custom=true;
    return {id,rec,ex,err}; });
}
async function impFile(input){ const f=input.files&&input.files[0]; if(!f) return; const box=document.getElementById('siImpPrev');
  try{ IMP=impNorm(JSON.parse(await f.text())); }catch(e){ IMP=[]; box.innerHTML=`<div class="si-imp-err">Файлыг уншиж чадсангүй: ${esc(e.message)}</div>`; return; }
  const ok=IMP.filter(x=>!x.err.length);
  box.innerHTML=`<table class="si-imp-tb"><tr><th></th><th>Нэр</th><th>Ангилал</th><th>Хэмжээ</th><th>Төлөв</th></tr>${IMP.map(x=>`<tr class="${x.err.length?'bad':''}"><td>${x.err.length?'⚠️':x.ex?'✏️':'🆕'}</td><td>${esc(x.rec.n||'—')}</td><td>${esc((SI_CATS.find(c=>c.id===x.rec.cat)||{}).label||x.rec.cat)}</td><td>${x.rec.size>0?(x.rec.dim==='w'?'урт ':'өндөр ')+fmt(x.rec.size):'—'}</td><td>${x.err.length?esc(x.err.join(', ')):x.ex?'шинэчилнэ':'шинээр нэмнэ'}</td></tr>`).join('')}</table>
   <div class="si-adm-acts"><button class="si-btn si-btn-main" ${ok.length?'':'disabled'} onclick="siImpRun()">Импорт хийх (${ok.length})</button>${IMP.length>ok.length?`<span class="si-muted">⚠️ мөрүүдийг алгасна</span>`:''}</div>`;
  input.value=''; }
async function impRun(){ const ok=IMP.filter(x=>!x.err.length); if(!ok.length) return; const box=document.getElementById('siImpPrev'); let n=0, bad=0;
  for(const x of ok){ try{ await C.setDoc(doc(C.fsdb,'si_items',x.id),x.rec,{merge:true}); n++; }catch(e){ console.error(e); bad++; } box.innerHTML=`<div class="si-muted">Оруулж байна… ${n+bad}/${ok.length}</div>`; }
  IMP=[]; C.notify(`${n} объект орлоо ✓`+(bad?` · ${bad} алдаа`:'')); await admin(); }
function impTpl(){ const t={format:'sizeitup-items',version:1,items:[{id:'saturn',n:'Санчир гараг (диаметр)',cat:'space',size:120536000,dim:'w',fact:'Нягт нь уснаас бага.',src:'NASA Planetary Fact Sheet',url:'https://nssdc.gsfc.nasa.gov/planetary/factsheet/',ref:0,color:'#E3C98F'}],
   _тайлбар:{cat:SI_CATS.map(c=>c.id+' = '+c.label).join(', '),size:'метрээр',dim:'h = өндөр, w = урт/өргөн/диаметр',ref:'1 бол бусад объектод харьцуулалт болж гарна',color:'зураггүй үеийн өнгө (#RRGGBB)'}};
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify(t,null,2)],{type:'application/json'})); a.download='sizeitup-zagvar.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),2000); }

// ── Нүүрний том зургийг админ солих (si_items/_hero) ──
async function heroImg(input){ const f=input.files&&input.files[0]; if(!f) return;
  try{ const d=await C.resizeImage(f,1400,1000,0.88); await C.setDoc(doc(C.fsdb,'si_items','_hero'),{img:d,updatedAt:Date.now()});
    C.notify('Нүүрний зураг солигдлоо ✓'); await loadItems(true); home(); }catch(e){ console.error(e); C.notify('Хадгалахад алдаа гарлаа'); } }
async function heroDel(){ if(!confirm('Анхны зураг руу буцаах уу?')) return; try{ await deleteDoc(doc(C.fsdb,'si_items','_hero')); await loadItems(true); home(); }catch(e){ C.notify('Алдаа гарлаа'); } }

// ── CountDash-ийн хуучин өгөгдлийг бүрмөсөн устгах (нэг удаагийн) ──
async function purgeCountDash(){
  if(!C.isAdmin()) return;
  if(!confirm('CountDash-ийн бүх асуулт, тоглолт, оноог Firestore-оос БҮРМӨСӨН устгах уу? Буцаах боломжгүй.')) return;
  let n=0, fail=0;
  const del=async ref=>{ try{ await deleteDoc(ref); n++; }catch(e){ fail++; } };
  try{
    const ss=await getDocs(collection(C.fsdb,'count_sessions'));
    for(const s of ss.docs){
      for(const sub of ['players','answers']){ try{ const q=await getDocs(collection(C.fsdb,'count_sessions',s.id,sub)); for(const d of q.docs) await del(d.ref); }catch(e){ fail++; } }
      await del(s.ref);
    }
    const qz=await getDocs(collection(C.fsdb,'count_quizzes')); for(const d of qz.docs) await del(d.ref);
    C.notify(`CountDash: ${n} бичлэг устгагдлаа${fail?`, ${fail} алдаа`:' ✓'}`,6000);
  }catch(e){ console.error(e); C.notify('Устгахад алдаа гарлаа: '+(e.code||e.message)); }
}

// ══════════════ ХОЛБОХ ══════════════
export async function siMount(el,ctx){
  C=ctx; ROOT=el; injectCSS();
  Object.assign(window,{siHome:home,siStartDaily:startDaily,siStartPractice:startPractice,siSlide:slide,siNudge:nudge,siLock:lock,siNext:next,
    siShare:shareRes,siSubmit:submit,siAdmin:admin,siAdmEdit:admEdit,siHeroImg:heroImg,siHeroDel:heroDel,siAdmPick:admPick,siAdmSave:admSave,siAdmReset:admReset,siAdmNoImg:admNoImg,siImpFile:impFile,siImpRun:impRun,siImpTpl:impTpl,siPurgeCountDash:purgeCountDash});
  await home();
}
