import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { initializeFirestore, collection, doc, setDoc, getDoc, getDocs, deleteDoc, query, orderBy, limit, onSnapshot, where, increment } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";


const firebaseConfig = {
  apiKey:"AIzaSyAFTav3b2M7hzbeUIQtp8q8D-3b2GERzCU",
  authDomain:"bolorgames-21a1a.firebaseapp.com",
  projectId:"bolorgames-21a1a",
  storageBucket:"bolorgames-21a1a.firebasestorage.app",
  messagingSenderId:"246162362500",
  appId:"1:246162362500:web:ffa315df51607395b1b2d1",measurementId:"G-WKK1BH2F9Z"
};
const app=initializeApp(firebaseConfig);
// Хатуу wifi/router/сургуулийн сүлжээн дээр WebSocket холболт хаагддаг тохиолдол их тул
// SDK өөрөө автоматаар илрүүлээд HTTP long-polling руу шилждэг болгоно — Kahoot зэрэг
// сайт яг ийм найдвартай fallback механизмтай тул хатуу сүлжээн дээр ч ажилладаг.
const fsdb=initializeFirestore(app,{experimentalAutoDetectLongPolling:true});
const auth=getAuth(app);
const fstorage=getStorage(app);
const ADMIN_EMAIL='bolorgames@gmail.com';
const CLOUDINARY_CLOUD='bfyky0uk';
const CLOUDINARY_PRESET='bolorgames_upload';

// ── TOAST NOTIFY (alert-ийн оронд, сайтын дизайнтай нийцнэ) ──
function notify(msg, ms=3500){
  let wrap=document.getElementById('toastWrap');
  if(!wrap){wrap=document.createElement('div');wrap.id='toastWrap';document.body.appendChild(wrap);}
  const t=document.createElement('div');
  t.className='toast';
  t.textContent=String(msg);
  wrap.appendChild(t);
  setTimeout(()=>{t.classList.add('out');setTimeout(()=>t.remove(),320);},ms);
}
window.notify=notify;

// ── STATE ──
let currentUser=null, isAdmin=false;
let pendingGame=null, pendingRoundId=null; // 'mq' or 'qq'
let mcPendingStart=false;
let activeGame=null; // 'mq' or 'qq'

// Shared players
let players=[], selectedPC=2;
// MQ state
let mqRounds=[], mqCurRound=null, mqCurId=null, mqUsedCells=new Set(), mqCurCell=null, mqCurAudio=null, mqPIcons={};
// QQ state
let qqRounds=[], qqCurRound=null, qqCurId=null, qqUsedCells=new Set(), qqCurCell=null;

// ── MEMORY CARDS STATE ──

// ── FLAG QUIZ DATA ──
const FLAG_COUNTRIES=[{"name": "Afghanistan", "code": "af"}, {"name": "Albania", "code": "al"}, {"name": "Algeria", "code": "dz"}, {"name": "Andorra", "code": "ad"}, {"name": "Angola", "code": "ao"}, {"name": "Antigua and Barbuda", "code": "ag"}, {"name": "Argentina", "code": "ar"}, {"name": "Armenia", "code": "am"}, {"name": "Australia", "code": "au"}, {"name": "Austria", "code": "at"}, {"name": "Azerbaijan", "code": "az"}, {"name": "Bahamas", "code": "bs"}, {"name": "Bahrain", "code": "bh"}, {"name": "Bangladesh", "code": "bd"}, {"name": "Barbados", "code": "bb"}, {"name": "Belarus", "code": "by"}, {"name": "Belgium", "code": "be"}, {"name": "Belize", "code": "bz"}, {"name": "Benin", "code": "bj"}, {"name": "Bhutan", "code": "bt"}, {"name": "Bolivia", "code": "bo"}, {"name": "Bosnia and Herzegovina", "code": "ba"}, {"name": "Botswana", "code": "bw"}, {"name": "Brazil", "code": "br"}, {"name": "Brunei", "code": "bn"}, {"name": "Bulgaria", "code": "bg"}, {"name": "Burkina Faso", "code": "bf"}, {"name": "Burundi", "code": "bi"}, {"name": "Cambodia", "code": "kh"}, {"name": "Cameroon", "code": "cm"}, {"name": "Canada", "code": "ca"}, {"name": "Cape Verde", "code": "cv"}, {"name": "Central African Republic", "code": "cf"}, {"name": "Chad", "code": "td"}, {"name": "Chile", "code": "cl"}, {"name": "China", "code": "cn"}, {"name": "Colombia", "code": "co"}, {"name": "Comoros", "code": "km"}, {"name": "Costa Rica", "code": "cr"}, {"name": "Croatia", "code": "hr"}, {"name": "Cuba", "code": "cu"}, {"name": "Cyprus", "code": "cy"}, {"name": "Czech Republic", "code": "cz"}, {"name": "DR Congo", "code": "cd"}, {"name": "Denmark", "code": "dk"}, {"name": "Djibouti", "code": "dj"}, {"name": "Dominica", "code": "dm"}, {"name": "Dominican Republic", "code": "do"}, {"name": "East Timor", "code": "tl"}, {"name": "Ecuador", "code": "ec"}, {"name": "Egypt", "code": "eg"}, {"name": "El Salvador", "code": "sv"}, {"name": "Equatorial Guinea", "code": "gq"}, {"name": "Eritrea", "code": "er"}, {"name": "Estonia", "code": "ee"}, {"name": "Eswatini", "code": "sz"}, {"name": "Ethiopia", "code": "et"}, {"name": "Fiji", "code": "fj"}, {"name": "Finland", "code": "fi"}, {"name": "France", "code": "fr"}, {"name": "Gabon", "code": "ga"}, {"name": "Gambia", "code": "gm"}, {"name": "Georgia", "code": "ge"}, {"name": "Germany", "code": "de"}, {"name": "Ghana", "code": "gh"}, {"name": "Greece", "code": "gr"}, {"name": "Grenada", "code": "gd"}, {"name": "Guatemala", "code": "gt"}, {"name": "Guinea", "code": "gn"}, {"name": "Guinea-Bissau", "code": "gw"}, {"name": "Guyana", "code": "gy"}, {"name": "Haiti", "code": "ht"}, {"name": "Honduras", "code": "hn"}, {"name": "Hungary", "code": "hu"}, {"name": "Iceland", "code": "is"}, {"name": "India", "code": "in"}, {"name": "Indonesia", "code": "id"}, {"name": "Iran", "code": "ir"}, {"name": "Iraq", "code": "iq"}, {"name": "Ireland", "code": "ie"}, {"name": "Israel", "code": "il"}, {"name": "Italy", "code": "it"}, {"name": "Ivory Coast", "code": "ci"}, {"name": "Jamaica", "code": "jm"}, {"name": "Japan", "code": "jp"}, {"name": "Jordan", "code": "jo"}, {"name": "Kazakhstan", "code": "kz"}, {"name": "Kenya", "code": "ke"}, {"name": "Kiribati", "code": "ki"}, {"name": "Kuwait", "code": "kw"}, {"name": "Kyrgyzstan", "code": "kg"}, {"name": "Laos", "code": "la"}, {"name": "Latvia", "code": "lv"}, {"name": "Lebanon", "code": "lb"}, {"name": "Lesotho", "code": "ls"}, {"name": "Liberia", "code": "lr"}, {"name": "Libya", "code": "ly"}, {"name": "Liechtenstein", "code": "li"}, {"name": "Lithuania", "code": "lt"}, {"name": "Luxembourg", "code": "lu"}, {"name": "Madagascar", "code": "mg"}, {"name": "Malawi", "code": "mw"}, {"name": "Malaysia", "code": "my"}, {"name": "Maldives", "code": "mv"}, {"name": "Mali", "code": "ml"}, {"name": "Malta", "code": "mt"}, {"name": "Marshall Islands", "code": "mh"}, {"name": "Mauritania", "code": "mr"}, {"name": "Mauritius", "code": "mu"}, {"name": "Mexico", "code": "mx"}, {"name": "Micronesia", "code": "fm"}, {"name": "Moldova", "code": "md"}, {"name": "Monaco", "code": "mc"}, {"name": "Mongolia", "code": "mn"}, {"name": "Montenegro", "code": "me"}, {"name": "Morocco", "code": "ma"}, {"name": "Mozambique", "code": "mz"}, {"name": "Myanmar", "code": "mm"}, {"name": "Namibia", "code": "na"}, {"name": "Nauru", "code": "nr"}, {"name": "Nepal", "code": "np"}, {"name": "Netherlands", "code": "nl"}, {"name": "New Zealand", "code": "nz"}, {"name": "Nicaragua", "code": "ni"}, {"name": "Niger", "code": "ne"}, {"name": "Nigeria", "code": "ng"}, {"name": "North Korea", "code": "kp"}, {"name": "North Macedonia", "code": "mk"}, {"name": "Norway", "code": "no"}, {"name": "Oman", "code": "om"}, {"name": "Pakistan", "code": "pk"}, {"name": "Palau", "code": "pw"}, {"name": "Palestine", "code": "ps"}, {"name": "Panama", "code": "pa"}, {"name": "Papua New Guinea", "code": "pg"}, {"name": "Paraguay", "code": "py"}, {"name": "Peru", "code": "pe"}, {"name": "Philippines", "code": "ph"}, {"name": "Poland", "code": "pl"}, {"name": "Portugal", "code": "pt"}, {"name": "Qatar", "code": "qa"}, {"name": "Republic of the Congo", "code": "cg"}, {"name": "Romania", "code": "ro"}, {"name": "Russia", "code": "ru"}, {"name": "Rwanda", "code": "rw"}, {"name": "Saint Kitts and Nevis", "code": "kn"}, {"name": "Saint Lucia", "code": "lc"}, {"name": "Saint Vincent and the Grenadines", "code": "vc"}, {"name": "Samoa", "code": "ws"}, {"name": "San Marino", "code": "sm"}, {"name": "Sao Tome and Principe", "code": "st"}, {"name": "Saudi Arabia", "code": "sa"}, {"name": "Senegal", "code": "sn"}, {"name": "Serbia", "code": "rs"}, {"name": "Seychelles", "code": "sc"}, {"name": "Sierra Leone", "code": "sl"}, {"name": "Singapore", "code": "sg"}, {"name": "Slovakia", "code": "sk"}, {"name": "Slovenia", "code": "si"}, {"name": "Solomon Islands", "code": "sb"}, {"name": "Somalia", "code": "so"}, {"name": "South Africa", "code": "za"}, {"name": "South Korea", "code": "kr"}, {"name": "South Sudan", "code": "ss"}, {"name": "Spain", "code": "es"}, {"name": "Sri Lanka", "code": "lk"}, {"name": "Sudan", "code": "sd"}, {"name": "Suriname", "code": "sr"}, {"name": "Sweden", "code": "se"}, {"name": "Switzerland", "code": "ch"}, {"name": "Syria", "code": "sy"}, {"name": "Tajikistan", "code": "tj"}, {"name": "Tanzania", "code": "tz"}, {"name": "Thailand", "code": "th"}, {"name": "Togo", "code": "tg"}, {"name": "Tonga", "code": "to"}, {"name": "Trinidad and Tobago", "code": "tt"}, {"name": "Tunisia", "code": "tn"}, {"name": "Turkey", "code": "tr"}, {"name": "Turkmenistan", "code": "tm"}, {"name": "Tuvalu", "code": "tv"}, {"name": "Uganda", "code": "ug"}, {"name": "Ukraine", "code": "ua"}, {"name": "United Arab Emirates", "code": "ae"}, {"name": "United Kingdom", "code": "gb"}, {"name": "United States", "code": "us"}, {"name": "Uruguay", "code": "uy"}, {"name": "Uzbekistan", "code": "uz"}, {"name": "Vanuatu", "code": "vu"}, {"name": "Vatican City", "code": "va"}, {"name": "Venezuela", "code": "ve"}, {"name": "Vietnam", "code": "vn"}, {"name": "Yemen", "code": "ye"}, {"name": "Zambia", "code": "zm"}, {"name": "Zimbabwe", "code": "zw"}];

const MC_SUITS=[{s:'♠',c:'black'},{s:'♥',c:'red'},{s:'♦',c:'red'},{s:'♣',c:'black'}];
const MC_RANKS=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
function mcFullDeck(){
  const deck=[];
  MC_SUITS.forEach(su=>MC_RANKS.forEach(rk=>deck.push({rank:rk,suit:su.s,color:su.c})));
  return deck;
}
let mcSelectedCount=10;
let mcPlayerName='';
let mcSequence=[];   // тухайн тоглолтын зөв дараалал
let mcPicked=[];     // тоглогчийн сонгосон картуудын дараалал (зөв/буруу хамаагүй)
let mcPhase='setup'; // setup -> memorize -> recall -> done
let mcStartTs=0, mcMemorizedTs=0, mcEndTs=0;
let mcTimerInterval=null;
let mcCorrectCount=0;
let mcScores=[]; // Firestore-ээс ачаалсан бүх оноо
let mcRevealMode='all'; // 'all' эсвэл 'sequential'
const MC_REVEAL_SEC=3;
let mcSeqRevealIdx=0, mcSeqRevealTimer=null, mcSeqCountdownInterval=null, mcSeqCardStart=0;

const PTS=[100,200,300,400,500];
const PCOLORS=['#e74c3c','#3498db','#2ecc71','#9b59b6','#e67e22'];
const SCI_SYMBOLS=['⚛','∑','∫','∇','π','Δ','Ω','λ','φ','∞','℃','∂','√','≈','∝','ψ','β','γ','θ','μ'];

const MQ_DCATS=[
  {id:'c1',label:'АНГИЛАЛ 1',icon:'🎤',iconImg:null},
  {id:'c2',label:'АНГИЛАЛ 2',icon:'🌟',iconImg:null},
  {id:'c3',label:'АНГИЛАЛ 3',icon:'🎬',iconImg:null},
  {id:'c4',label:'АНГИЛАЛ 4',icon:'📻',iconImg:null},
  {id:'c5',label:'АНГИЛАЛ 5',icon:'🏔️',iconImg:null},
];
const QQ_DCATS=[
  {id:'c1',label:'ФИЗИК',icon:'⚡',iconImg:null},
  {id:'c2',label:'ХИМИ',icon:'⚗️',iconImg:null},
  {id:'c3',label:'МАТЕМАТИК',icon:'∑',iconImg:null},
  {id:'c4',label:'БИОЛОГИ',icon:'🧬',iconImg:null},
  {id:'c5',label:'ОДОН ОРД',icon:'🌌',iconImg:null},
];

function mkMQRound(name){
  const cats=MQ_DCATS.map(c=>({...c}));
  const qs={};
  cats.forEach(c=>{qs[c.id]=PTS.map(p=>({hint:'',answer:'Хариулт',audioData:null,audioName:null}));});
  return{id:'r'+Date.now(),name:name||'Шинэ тоглолт',categories:cats,questions:qs,ownerId:currentUser?currentUser.uid:null};
}
function mkQQRound(name){
  const cats=QQ_DCATS.map(c=>({...c}));
  const qs={};
  cats.forEach(c=>{qs[c.id]=PTS.map(p=>({hint:'',answer:'Хариулт',imageData:null,imageName:null}));});
  return{id:'q'+Date.now(),name:name||'Шинэ тоглолт',categories:cats,questions:qs,ownerId:currentUser?currentUser.uid:null};
}

// ── AUTH ──
// ══════════════════════════════════════════════════════════════
// НЭГ ЭРХ = НЭГ ИДЭВХТЭЙ SESSION
// Шинээр өөр төхөөрөмж дээр нэвтэрвэл өмнөх төхөөрөмж дээрх нэвтрэлт
// автоматаар, тодорхой мэдэгдэлтэйгээр цуцлагдана (Netflix/Spotify-ийн
// нэг-төхөөрөмж горимтой адилхан зарчим). Админд хамаарахгүй.
// ══════════════════════════════════════════════════════════════
let mySessionId=null, sessionUnsub=null, _justLoggedInExplicitly=false;

async function checkAndAttachSession(uid){
  const localKey='bg_session_'+uid;
  if(_justLoggedInExplicitly){
    _justLoggedInExplicitly=false;
    // Жинхэнэ, шинэ нэвтрэлт — шинэ session ID үүсгэж, өмнөх бусад бүх төхөөрөмжийг хүчингүй болгоно
    mySessionId=Date.now()+'_'+Math.random().toString(36).slice(2,10);
    localStorage.setItem(localKey, mySessionId);
    try{ await setDoc(doc(fsdb,'users',uid),{activeSessionId:mySessionId,activeSessionAt:Date.now()},{merge:true}); }
    catch(e){ console.error('[SESSION] write err',e); }
    watchSessionValidity(uid);
    return;
  }
  // Хуудас дахин ачаалагдсан / өмнөх session сэргэсэн тохиолдол — зөвхөн шалгаад watcher холбоно
  const savedSessionId=localStorage.getItem(localKey);
  try{
    const uSnap=await getDoc(doc(fsdb,'users',uid));
    const remoteSessionId=uSnap.exists()?uSnap.data().activeSessionId:null;
    if(remoteSessionId && savedSessionId && remoteSessionId!==savedSessionId){
      // Энэ хооронд өөр төхөөрөмж дээрээс шинээр нэвтэрсэн байна — энэ session-ийг цуцална
      stopSessionWatch();
      await signOut(auth);
      setTimeout(()=>notify('⚠️ Таны эрхээр өөр төхөөрөмж дээр шинээр нэвтэрсэн тул энд автоматаар гарлаа.',8000),300);
      return;
    }
    mySessionId=savedSessionId||remoteSessionId||null;
    if(!savedSessionId && remoteSessionId) localStorage.setItem(localKey, remoteSessionId);
    watchSessionValidity(uid);
  }catch(e){ console.error('[SESSION] check err',e); }
}
function watchSessionValidity(uid){
  if(sessionUnsub) sessionUnsub();
  sessionUnsub=onSnapshot(doc(fsdb,'users',uid), snap=>{
    if(!snap.exists()) return;
    const data=snap.data();
    if(data.activeSessionId && mySessionId && data.activeSessionId!==mySessionId){
      // Өөр төхөөрөмж дээр яг одоо шинээр нэвтэрсэн байна — энэ session-ийг шууд цуцална
      stopSessionWatch();
      signOut(auth).then(()=>{
        notify('⚠️ Таны эрхээр өөр төхөөрөмж дээр нэвтэрсэн тул энд автоматаар гарлаа.',8000);
        showLanding();
      }).catch(()=>{});
    }
  }, err=>{ console.error('[SESSION] watch err',err); });
}
function stopSessionWatch(){
  if(sessionUnsub){ sessionUnsub(); sessionUnsub=null; }
  mySessionId=null;
}

// ── PWA: Service worker бүртгэх (апп болгож суулгах боломж) ──
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('/service-worker.js').catch(err=>console.warn('[PWA] SW бүртгэл амжилтгүй',err));
  });
}

onAuthStateChanged(auth,async(user)=>{
  currentUser=user;
  if(user){
    // Хэрэглэгчийн Firestore профайл (бүртгэлийн үед сүлжээ тасарсан гэх мэт шалтгаанаар)
    // байхгүй бол автоматаар үүсгэж "эмчилнэ" — админы жагсаалтад харагдахгүй байх
    // асуудлыг шийдэж, аль хэдийн нөлөөлсөн хэрэглэгчдийг дараагийн нэвтрэлтэд нь сэргээнэ.
    try{
      const uSnap=await getDoc(doc(fsdb,'users',user.uid));
      if(!uSnap.exists()){
        await setDoc(doc(fsdb,'users',user.uid),{
          email:user.email||'',
          name:user.displayName||(user.email?user.email.split('@')[0]:'Хэрэглэгч'),
          phone:'',
          createdAt:Date.now(),
          subscriptionActive:false,
          subscriptionPlan:null,
          subscriptionExpiry:null
        });
        console.log('[USER PROFILE HEAL] Дутуу профайл үүсгэлээ:', user.uid);
      }
      // Нэр/зургийг нийтэд нээлттэй (лидерборд гэх мэт газарт ашиглагддаг) хувилбартай
      // тогтмол синхрончилно — ингэснээр "Миний бүртгэл" хуудсанд орж үзээгүй хэрэглэгчийн
      // зураг/нэр ч лидерборд дээр зөв харагдана.
      const ud=uSnap.exists()?uSnap.data():null;
      const pubName=(ud&&ud.name)||user.displayName||(user.email?user.email.split('@')[0]:'Хэрэглэгч');
      const pubPhoto=(ud&&ud.photoURL)||null;
      setDoc(doc(fsdb,'user_public',user.uid),{name:pubName,photoURL:pubPhoto},{merge:true}).catch(e=>console.error('[user_public sync]',e));
    }catch(e){ console.error('[USER PROFILE HEAL] err', e); }
  }
  // Төлөгдсөн ч идэвхжээгүй эрхийг сервер талаас нөхөн идэвхжүүлнэ (чимээгүй)
  if(user){
    try{
      const t=await user.getIdToken();
      fetch('https://us-central1-bolorgames-21a1a.cloudfunctions.net/recheckMyPayments',{method:'POST',headers:{'Authorization':'Bearer '+t}})
        .then(r=>r.json()).then(d=>{if(d&&d.activated>0){notify('Таны төлбөр баталгаажиж, эрх идэвхжлээ! 🎉',5000);}}).catch(()=>{});
    }catch(e){}
  } isAdmin=user&&user.email===ADMIN_EMAIL;
  if(user && !isAdmin){
    checkAndAttachSession(user.uid); // "await" хийхгүй — блоклохгүйгээр арын дэвсгэрт ажиллана
  }else{
    stopSessionWatch();
  }
  ensureBGLogo();
  updateLoginBtn(); mqRenderHome(); qqRenderHome();
  if(user) setTimeout(checkSubExpiry, 1500);
  if(typeof mcScores!=='undefined'&&mcScores.length) mcRenderLeaderboard(mcSelectedCount);
});

function loginBtnClick(){
  if(currentUser){ stopSessionWatch(); signOut(auth).then(()=>{currentUser=null;isAdmin=false;updateLoginBtn();mqRenderHome();qqRenderHome();if(typeof mcScores!=='undefined'&&mcScores.length) mcRenderLeaderboard(mcSelectedCount);}); }
  else openLogin();
}
function openLogin(){
  document.getElementById('loginEmail').value='';
  document.getElementById('loginPass').value='';
  document.getElementById('loginPassConfirm').value='';
  document.getElementById('regName').value='';
  document.getElementById('regPhone').value='';
  document.getElementById('loginErr').textContent='';
  document.getElementById('loginErr').style.color='';
  switchAuthMode('login');
  document.getElementById('loginOverlay').classList.add('open');
  setTimeout(()=>document.getElementById('loginEmail').focus(),300);
}
function closeLogin(){ document.getElementById('loginOverlay').classList.remove('open'); }
let authMode='login';
function switchAuthMode(mode){
  authMode=mode;
  document.getElementById('tabLoginBtn').classList.toggle('active',mode==='login');
  document.getElementById('tabRegisterBtn').classList.toggle('active',mode==='register');
  document.getElementById('regConfirmWrap').style.display=mode==='register'?'block':'none';
  document.getElementById('regExtraFields').style.display=mode==='register'?'block':'none';
  document.getElementById('forgotPassWrap').style.display=mode==='register'?'none':'block';
  document.getElementById('authSubmitBtn').textContent=mode==='register'?'→ БҮРТГҮҮЛЭХ':'→ НЭВТРЭХ';
  document.getElementById('loginSub').textContent=mode==='register'?'Шинэ бүртгэл үүсгэнэ үү':'Тоглолт тоглохын тулд нэвтэрнэ үү';
  document.getElementById('loginErr').textContent='';
  document.getElementById('loginErr').style.color='';
}
function handleAuthSubmit(){
  if(authMode==='login')doLogin(); else doRegister();
}
async function doRegister(){
  const email=document.getElementById('loginEmail').value.trim();
  const pass=document.getElementById('loginPass').value;
  const pass2=document.getElementById('loginPassConfirm').value;
  const name=document.getElementById('regName').value.trim();
  const phone=document.getElementById('regPhone').value.trim();
  const errEl=document.getElementById('loginErr');
  errEl.style.color='';
  if(!email||!pass){errEl.textContent='Email болон нууц үгээ оруулна уу';return;}
  if(!name){errEl.textContent='Нэрээ оруулна уу';return;}
  if(!phone||phone.length<8){errEl.textContent='Утасны дугаараа зөв оруулна уу';return;}
  if(pass.length<6){errEl.textContent='Нууц үг хамгийн багадаа 6 тэмдэгттэй байх ёстой';return;}
  if(pass!==pass2){errEl.textContent='Нууц үг таарахгүй байна';return;}
  errEl.textContent='Бүртгэж байна...';
  try{
    const cred=await createUserWithEmailAndPassword(auth,email,pass);
    await sendEmailVerification(cred.user);
    try{
      await setDoc(doc(fsdb,'users',cred.user.uid),{
        email:email,
        name:name,
        phone:phone,
        createdAt:Date.now(),
        subscriptionActive:false,
        subscriptionPlan:null,
        subscriptionExpiry:null
      });
    }catch(profileErr){
      // Профайл бичихэд алдаа гарсан ч акаунт нь бүтсэн тул бүртгэлийг "амжилттай" гэж
      // үзнэ — дараагийн удаа нэвтрэхэд нь профайл автоматаар үүсэж "эмчлэгдэнэ".
      console.error('[REGISTER] profile write err', profileErr);
    }
    await signOut(auth);
    errEl.style.color='var(--green)';
    errEl.textContent='✓ Бүртгэл амжилттай! Имэйлээ шалгаад баталгаажуулах линк дээр дарна уу, дараа нь нэвтэрнэ үү.';
    setTimeout(()=>switchAuthMode('login'),2500);
  }catch(e){
    errEl.style.color='';
    if(e.code==='auth/email-already-in-use')errEl.textContent='Энэ имэйл хаягаар аль хэдийн бүртгүүлсэн байна';
    else if(e.code==='auth/invalid-email')errEl.textContent='Имэйл хаяг буруу байна';
    else if(e.code==='auth/weak-password')errEl.textContent='Нууц үг хэт энгийн байна';
    else errEl.textContent='Алдаа гарлаа: '+String(e.message||e).slice(0,80);
  }
}
async function doForgotPassword(){
  const email=document.getElementById('loginEmail').value.trim();
  const errEl=document.getElementById('loginErr');
  errEl.style.color='';
  if(!email){errEl.textContent='Имэйл хаягаа эхлээд оруулна уу';return;}
  try{
    await sendPasswordResetEmail(auth,email);
    errEl.style.color='var(--green)';
    errEl.textContent='✓ Нууц үг сэргээх линк имэйл рүү чинь илгээгдлээ.';
  }catch(e){
    errEl.style.color='';
    errEl.textContent='Алдаа гарлаа: '+String(e.message||e).slice(0,80);
  }
}
async function doLogin(){
  const email=document.getElementById('loginEmail').value.trim();
  const pass=document.getElementById('loginPass').value;
  const errEl=document.getElementById('loginErr');
  errEl.style.color='';
  errEl.textContent='Нэвтэрч байна...';
  try{
    _justLoggedInExplicitly=true; // Энэ бол жинхэнэ, шинэ нэвтрэлт гэдгийг onAuthStateChanged-д мэдэгдэнэ
    const cred=await signInWithEmailAndPassword(auth,email,pass);
    const notVerified = email!==ADMIN_EMAIL && !cred.user.emailVerified;
    closeLogin(); errEl.textContent='';
    if(notVerified){
      // Заавал хориглохгүй, зөвхөн сануулга харуулна — имэйл хүрэхгүй байх (spam г.м.)
      // тохиолдолд хэрэглэгч бүрмөсөн гацахаас сэргийлнэ.
      setTimeout(()=>{
        notify('⚠️ Имэйл хаягаа баталгаажуулаагүй байна. Спам хавтсаа шалгах эсвэл "Дахин илгээх" дарна уу.',7000);
      },600);
    }
    if(pendingGame&&pendingRoundId){
      const g=pendingGame,rid=pendingRoundId; pendingGame=null; pendingRoundId=null;
      setTimeout(()=>openPlayerSetup(g,rid),200);
    }
    if(mcPendingStart){
      mcPendingStart=false;
      setTimeout(()=>mcStartGame(),200);
    }
    if(flPendingStart){
      flPendingStart=false;
      setTimeout(()=>flStartGame(),200);
    }
    if(lqPendingStart){
      lqPendingStart=false;
      setTimeout(()=>lqStartGame(),200);
    }
  }catch(e){ _justLoggedInExplicitly=false; errEl.textContent='Email эсвэл нууц үг буруу байна'; document.getElementById('loginPass').value=''; }
}
async function resendVerification(){
  const email=document.getElementById('loginEmail').value.trim();
  const pass=document.getElementById('loginPass').value;
  const errEl=document.getElementById('loginErr');
  try{
    const cred=await signInWithEmailAndPassword(auth,email,pass);
    await sendEmailVerification(cred.user);
    await signOut(auth);
    errEl.style.color='var(--green)';
    errEl.textContent='✓ Баталгаажуулах имэйл дахин илгээгдлээ. Имэйлээ шалгана уу.';
  }catch(e){ errEl.style.color=''; errEl.textContent='Алдаа гарлаа, дахин оролдоно уу.'; }
}
// ── NAV: "Games" dropdown цэс ──
function toggleGamesMenu(e){
  if(e) e.stopPropagation();
  const wrap=document.getElementById('navGamesBtn')?.closest('.nav-games-wrap');
  if(wrap) wrap.classList.toggle('open');
}
function closeGamesMenu(){
  const wrap=document.getElementById('navGamesBtn')?.closest('.nav-games-wrap');
  if(wrap) wrap.classList.remove('open');
}
document.addEventListener('DOMContentLoaded',()=>{
  const menu=document.getElementById('navGamesMenu');
  if(menu) menu.addEventListener('click', e=>{ if(e.target.closest('button')) closeGamesMenu(); });
  document.addEventListener('click', e=>{
    const wrap=document.getElementById('navGamesBtn')?.closest('.nav-games-wrap');
    if(wrap && wrap.classList.contains('open') && !wrap.contains(e.target)) wrap.classList.remove('open');
  });
});
window.toggleGamesMenu=toggleGamesMenu;window.closeGamesMenu=closeGamesMenu;

function updateLoginBtn(){
  const btn=document.getElementById('loginBtn'); if(!btn)return;
  if(currentUser){btn.textContent='✓ '+(currentUser.email.split('@')[0]);btn.classList.add('logged');}
  else{btn.textContent='🔐 Нэвтрэх';btn.classList.remove('logged');}
  const adBtn=document.getElementById('navAdminDash');
  if(adBtn) adBtn.style.display=isAdmin?'inline-block':'none';
  const laBtn=document.getElementById('navAdminLogos');
  if(laBtn) laBtn.style.display=isAdmin?'inline-block':'none';
  const waBtn=document.getElementById('navAdminWords');
  if(waBtn) waBtn.style.display=isAdmin?'inline-block':'none';
  const saBtn=document.getElementById('navAdminStars');
  if(saBtn) saBtn.style.display=isAdmin?'inline-block':'none';
  const twaBtn=document.getElementById('navAdminTW');
  if(twaBtn) twaBtn.style.display=isAdmin?'inline-block':'none';
  const subBtn=document.getElementById('navSubscribe');
  if(subBtn) subBtn.style.display=currentUser?'inline-block':'none';
  const myPlanBtn=document.getElementById('navMyPlan');
  if(myPlanBtn) myPlanBtn.style.display=currentUser?'inline-block':'none';
}

// ── ADMIN DASHBOARD ──
let adUsers=[];
function showAdminDash(){
  if(!isAdmin){notify('Зөвхөн admin хандах боломжтой');showLanding();return;}
  setAllInactive();
  document.getElementById('adminDashScreen').classList.add('active');
  document.getElementById('navAdminDash').classList.add('active');
  activeGame=null;
  adLoadUsers();
  adLoadUnverified();
}

// ══════════════════════════════════════════════════════════════
// АДМИН: K-type (олон-мэдэгдэлт, A-E хариулттай) асуултуудыг хурдан хянаж/засах хэрэгсэл.
// Тухайн фолдер (болон дэд фолдер)-ийн бүх асуултыг жагсааж, зөв хариулт нь олон
// индекс (array) байгаа (буруу байх магадлалтай) асуултыг улаанаар тэмдэглэнэ.
// Админ ганц А/Б/В/Г/Д товч дараад л зөв индексийг шууд тохируулна.
// ══════════════════════════════════════════════════════════════
let adKfixFolderId=null, adKfixItems=[];
async function showAdminKfix(){
  if(!isAdmin){notify('Зөвхөн admin хандах боломжтой');return;}
  setAllInactive();
  document.getElementById('adminKfixScreen').classList.add('active');
  document.getElementById('navAdminDash').classList.add('active');
  if(!qrFolders.length) await qrLoadFolders();
  if(!qrQuizzes.length) await qrLoadQuizzes();
  const sel=document.getElementById('adKfixFolderSelect');
  sel.innerHTML='<option value="">— Фолдер сонгох —</option>'+
    qrFolders.map(f=>`<option value="${f.id}">${escH(qrFolderPath(f.id))}</option>`).join('');
}
function adKfixLoadFolder(){
  const folderId=document.getElementById('adKfixFolderSelect').value;
  adKfixFolderId=folderId||null;
  const wrap=document.getElementById('adKfixList');
  if(!folderId){ wrap.innerHTML=''; return; }
  const quizzes=qrCollectQuizzesForFolder(folderId);
  adKfixItems=[];
  quizzes.forEach(qz=>{
    (qz.questions||[]).forEach((q,idx)=>{
      adKfixItems.push({quizId:qz.id, quizName:qz.name, qIndex:idx, q});
    });
  });
  adKfixRender();
}
function adKfixRender(){
  const wrap=document.getElementById('adKfixList');
  if(!adKfixItems.length){ wrap.innerHTML='<div class="qr-lb-loading">Энэ фолдерт асуулт алга.</div>'; return; }
  const suspiciousCount=adKfixItems.filter(it=>Array.isArray(it.q.correct)).length;
  document.getElementById('adKfixCount').textContent=`Нийт ${adKfixItems.length} асуулт · ⚠️ ${suspiciousCount} нь олон зөв индекстэй (магадгүй буруу)`;
  const onlySuspicious=document.getElementById('adKfixOnlySuspicious').checked;
  const displayList=adKfixItems.map((it,idx)=>({it,idx})).filter(({it})=>!onlySuspicious || Array.isArray(it.q.correct));
  if(!displayList.length){ wrap.innerHTML=`<div class="qr-lb-loading">✅ Сэжигтэй асуулт алга — бүгд цэвэрхэн байна!</div>`; return; }
  wrap.innerHTML=displayList.map(({it,idx})=>{
    const q=it.q;
    const isSuspicious=Array.isArray(q.correct);
    const curLabel = isSuspicious ? `[${q.correct.map(x=>QR_LETTERS[x]).join(',')}]` : (QR_LETTERS[q.correct]||'?');
    const letters=['A','B','C','D','E'];
    const rowsHtml=(q.opts||[]).map((o,oi)=>{
      const isCurrent=!isSuspicious && q.correct===oi;
      return `<button class="ad-kfix-opt-row ${isCurrent?'current':''}" onclick="adKfixSetCorrect(${idx},${oi})">
        <span class="ad-kfix-opt-letter">${letters[oi]||('#'+(oi+1))}</span>
        <span class="ad-kfix-opt-text">${escH(o)}</span>
        ${isCurrent?'<span class="ad-kfix-opt-check">✓ ЗӨВ</span>':''}
      </button>`;
    }).join('');
    return `<div class="ad-kfix-item ${isSuspicious?'suspicious':''}">
      <div class="ad-kfix-quiz-name">${escH(it.quizName)} — ${it.qIndex+1}-р асуулт ${isSuspicious?'⚠️':''}</div>
      <div class="ad-kfix-qtext">${escH(q.q)}</div>
      <div class="ad-kfix-cur">Одоогийн зөв хариулт: <b>${curLabel}</b></div>
      <div class="ad-kfix-opts">${rowsHtml}</div>
    </div>`;
  }).join('');
}
async function adKfixSetCorrect(itemIdx, optIndex){
  const it=adKfixItems[itemIdx];
  if(!it) return;
  try{
    const quiz=qrQuizzes.find(z=>z.id===it.quizId);
    if(!quiz){ notify('Тест олдсонгүй, дахин ачаална уу'); return; }
    const newQuestions=quiz.questions.map((q,i)=> i===it.qIndex ? {...q, correct:optIndex} : q);
    await setDoc(doc(fsdb,'live_quizzes',it.quizId),{questions:newQuestions},{merge:true});
    quiz.questions=newQuestions;
    it.q={...it.q, correct:optIndex};
    adKfixRender();
    notify('Хадгалагдлаа ✓',1200);
  }catch(e){ console.error(e); notify('Хадгалахад алдаа гарлаа'); }
}
async function adKfixBulkStandardizeOptions(){
  const STANDARD_OPTS=['1,2,3 зөв','1,2,3,4 зөв','2,4 зөв','Зөвхөн 4 зөв','Бүгд зөв'];
  const suspicious=adKfixItems.filter(it=>Array.isArray(it.q.correct));
  if(!suspicious.length){ notify('Сэжигтэй асуулт алга байна.'); return; }
  if(!confirm(`${suspicious.length} асуултын сонголтын текстийг стандарт (A=1,2,3 · B=1,2,3,4 · C=2,4 · D=4 · E=бүгд) болгож бүгдийг нэг дор солих уу?\n\nАнхаар: одоогийн сонголтын текст устаж, дээрх стандарт 5 сонголтоор солигдоно. Зөв хариултыг (аль үсэг үнэн болохыг) дараа нь тус бүрд нь заавал гараар сонгох шаардлагатай хэвээр байна.`)) return;
  notify('Хадгалж байна…',3000);
  const byQuiz={};
  suspicious.forEach(it=>{
    if(!byQuiz[it.quizId]) byQuiz[it.quizId]=new Set();
    byQuiz[it.quizId].add(it.qIndex);
  });
  try{
    for(const quizId of Object.keys(byQuiz)){
      const quiz=qrQuizzes.find(z=>z.id===quizId);
      if(!quiz) continue;
      const idxSet=byQuiz[quizId];
      const newQuestions=quiz.questions.map((q,i)=> idxSet.has(i) ? {...q, opts:[...STANDARD_OPTS]} : q);
      await setDoc(doc(fsdb,'live_quizzes',quizId),{questions:newQuestions},{merge:true});
      quiz.questions=newQuestions;
    }
    adKfixItems.forEach(it=>{
      if(Array.isArray(it.q.correct)) it.q={...it.q, opts:[...STANDARD_OPTS]};
    });
    adKfixRender();
    notify(`${suspicious.length} асуултын сонголт стандарт боллоо ✓ Одоо үсэг бүрийг тус тусад нь сонгоно уу.`,3500);
  }catch(e){ console.error(e); notify('Алдаа гарлаа, дахин оролдоно уу'); }
}
window.showAdminKfix=showAdminKfix;window.adKfixLoadFolder=adKfixLoadFolder;window.adKfixSetCorrect=adKfixSetCorrect;window.adKfixBulkStandardizeOptions=adKfixBulkStandardizeOptions;
async function adLoadUnverified(){
  const tableEl=document.getElementById('adUnverifiedTable'); if(!tableEl) return;
  tableEl.innerHTML='<div style="padding:20px;text-align:center;font-family:Share Tech Mono,monospace;font-size:12px;color:var(--muted);">Ачааллаж байна...</div>';
  if(!currentUser){ tableEl.innerHTML='<div style="padding:20px;text-align:center;color:var(--muted);">Эхлээд нэвтэрнэ үү</div>'; return; }
  try{
    const t=await currentUser.getIdToken();
    const r=await fetch('https://us-central1-bolorgames-21a1a.cloudfunctions.net/adminListUnverified',{
      method:'POST', headers:{'Authorization':'Bearer '+t}
    });
    const data=await r.json();
    if(!data.success){ tableEl.innerHTML=`<div style="padding:20px;text-align:center;color:#ff6b6b;">Алдаа: ${escH(data.error||'тодорхойгүй')}</div>`; return; }
    adUnverifiedUsers=data.users||[];
    adRenderUnverified();
  }catch(e){
    console.error(e);
    tableEl.innerHTML='<div style="padding:20px;text-align:center;color:#ff6b6b;">Cloud Function-той холбогдож чадсангүй. Функц deploy хийгдсэн эсэхийг шалгана уу.</div>';
  }
}
let adUnverifiedUsers=[];
function adRenderUnverified(){
  const tableEl=document.getElementById('adUnverifiedTable'); if(!tableEl) return;
  if(adUnverifiedUsers.length===0){
    tableEl.innerHTML='<div style="padding:20px;text-align:center;font-family:Share Tech Mono,monospace;font-size:12px;color:var(--muted);">✓ Бүх хэрэглэгч имэйлээ баталгаажуулсан байна</div>';
    return;
  }
  let html='';
  adUnverifiedUsers.forEach(u=>{
    const created=u.createdAt?new Date(u.createdAt).toLocaleDateString('mn-MN'):'?';
    html+=`<div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid rgba(255,176,32,.1);flex-wrap:wrap;">
      <div style="flex:1;min-width:180px;font-family:'Rajdhani',sans-serif;font-weight:600;font-size:14px;color:#fff;">${escH(u.email)}</div>
      <div style="font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--muted);">Бүртгүүлсэн: ${created}</div>
      <button onclick="adVerifyUser('${escA(u.email)}',this)" style="font-family:'Orbitron',monospace;font-size:10px;padding:8px 14px;border-radius:8px;border:1px solid rgba(57,255,20,.35);background:rgba(57,255,20,.08);color:#39ff14;cursor:pointer;">✓ Баталгаажуулах</button>
      <button onclick="adDeleteUser('${escA(u.email)}',this)" style="font-family:'Orbitron',monospace;font-size:10px;padding:8px 14px;border-radius:8px;border:1px solid rgba(255,68,68,.4);background:rgba(255,68,68,.08);color:#ff6b6b;cursor:pointer;">✕ Устгах</button>
    </div>`;
  });
  tableEl.innerHTML=html;
}
async function adVerifyUser(email, btnEl){
  if(btnEl){ btnEl.disabled=true; btnEl.textContent='⏳'; }
  try{
    const t=await currentUser.getIdToken();
    const r=await fetch('https://us-central1-bolorgames-21a1a.cloudfunctions.net/adminVerifyEmail',{
      method:'POST', headers:{'Authorization':'Bearer '+t,'Content-Type':'application/json'},
      body:JSON.stringify({email})
    });
    const data=await r.json();
    if(data.success){
      notify(`✅ ${email} баталгаажлаа! Одоо нэвтэрч чадна.`,5000);
      adUnverifiedUsers=adUnverifiedUsers.filter(u=>u.email!==email);
      adRenderUnverified();
    }else{
      notify('Алдаа: '+(data.error||'тодорхойгүй'),5000);
      if(btnEl){ btnEl.disabled=false; btnEl.textContent='✓ Баталгаажуулах'; }
    }
  }catch(e){
    console.error(e);
    notify('Cloud Function-той холбогдож чадсангүй',5000);
    if(btnEl){ btnEl.disabled=false; btnEl.textContent='✓ Баталгаажуулах'; }
  }
}
async function adDeleteUser(email, btnEl){
  if(!confirm(`${email} хэрэглэгчийг БҮРМӨСӨН устгах уу?\n\nЭнэ нь Auth акаунт болон бүх өгөгдлийг устгана — буцаах боломжгүй. Тухайн хүн дараа нь шинээр бүртгүүлж болно.`)) return;
  if(btnEl){ btnEl.disabled=true; btnEl.textContent='⏳'; }
  try{
    const t=await currentUser.getIdToken();
    const r=await fetch('https://us-central1-bolorgames-21a1a.cloudfunctions.net/adminDeleteUser',{
      method:'POST', headers:{'Authorization':'Bearer '+t,'Content-Type':'application/json'},
      body:JSON.stringify({email})
    });
    const data=await r.json();
    if(data.success){
      notify(`🗑️ ${email} бүрмөсөн устгагдлаа. Одоо шинээр бүртгүүлж болно.`,5000);
      adUnverifiedUsers=adUnverifiedUsers.filter(u=>u.email!==email);
      adRenderUnverified();
      adLoadUsers();
    }else{
      notify('Алдаа: '+(data.error||'тодорхойгүй'),5000);
      if(btnEl){ btnEl.disabled=false; btnEl.textContent='✕ Устгах'; }
    }
  }catch(e){
    console.error(e);
    notify('Cloud Function-той холбогдож чадсангүй',5000);
    if(btnEl){ btnEl.disabled=false; btnEl.textContent='✕ Устгах'; }
  }
}
async function adLoadUsers(){
  document.getElementById('adDashCount').textContent='Ачааллаж байна...';
  try{
    const snap=await getDocs(collection(fsdb,'users'));
    adUsers=[];
    snap.forEach(d=>adUsers.push({...d.data(),_id:d.id}));
    adUsers.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
    adRenderUsers();
  }catch(e){
    document.getElementById('adDashCount').textContent='Алдаа гарлаа';
    document.getElementById('adDashTable').innerHTML=`<div style="padding:30px;text-align:center;color:var(--pink);font-size:13px;">Хэрэглэгчдийг ачаалж чадсангүй: ${escH(String(e.message||e).slice(0,120))}</div>`;
  }
}
function adFmtDate(ts){
  if(!ts)return'—';
  const d=new Date(ts);
  return d.toLocaleDateString('mn-MN',{year:'numeric',month:'2-digit',day:'2-digit'});
}
function adRenderUsers(){
  const q=(document.getElementById('adDashSearch').value||'').toLowerCase().trim();
  const filtered=adUsers.filter(u=>!q||(u.name||'').toLowerCase().includes(q)||(u.email||'').toLowerCase().includes(q)||(u.phone||'').includes(q));
  document.getElementById('adDashCount').textContent=`Нийт ${adUsers.length} хэрэглэгч (${filtered.length} харагдаж байна) — хамгийн ШИНЭ хэрэглэгч ЭХЭНД (дээд мөрөнд) харагдана`;
  const tableEl=document.getElementById('adDashTable');
  if(!filtered.length){tableEl.innerHTML='<div style="padding:30px;text-align:center;color:var(--muted);font-size:13px;">Хэрэглэгч олдсонгүй</div>';return;}
  let html=`<div class="ad-user-row ad-header"><div>Нэр</div><div>Имэйл</div><div>Утас</div><div>Бүртгүүлсэн ▼</div><div>Эрх</div><div>Үйлдэл</div></div>`;
  const now=Date.now();
  filtered.forEach(u=>{
    const active=u.subscriptionActive&&u.subscriptionExpiry&&u.subscriptionExpiry>now;
    const badge=active?`<span class="ad-badge active">✓ ${escH(u.subscriptionPlan||'идэвхтэй')} · ${adFmtDate(u.subscriptionExpiry)} хүртэл</span>`:`<span class="ad-badge inactive">Идэвхгүй</span>`;
    const isNew=u.createdAt && (now-u.createdAt)<48*60*60*1000; // сүүлийн 48 цагт бүртгүүлсэн
    const newBadge=isNew?'<span class="ad-new-badge">🆕 ШИНЭ</span> ':'';
    html+=`<div class="ad-user-row">
      <div>${newBadge}${escH(u.name||'—')}</div>
      <div style="word-break:break-all;">${escH(u.email||'—')}</div>
      <div>${escH(u.phone||'—')}</div>
      <div>${adFmtDate(u.createdAt)}</div>
      <div>${badge}</div>
      <div>
        <button class="ad-btn" onclick="showMyAccount('${u._id}')" title="Энэ хэрэглэгчийн бүртгэл/статистикийг харах">👤 Бүртгэл харах</button>
        <button class="ad-btn" onclick="adSetSubscription('${u._id}',1)">+1 сар</button>
        <button class="ad-btn" onclick="adSetSubscription('${u._id}',3)">+3 сар</button>
        <button class="ad-btn" onclick="adSetSubscription('${u._id}',6)">+6 сар</button>
        <button class="ad-btn danger" onclick="adSetSubscription('${u._id}',0)">Идэвхгүй</button>
        <button class="ad-btn danger" onclick="adDeleteUser('${escA(u.email||'')}',this)" title="Хэрэглэгчийг бүрмөсөн устгах">✕ Устгах</button>
      </div>
    </div>`;
  });
  tableEl.innerHTML=html;
  const lqDelBtn=document.getElementById('lqDelAllBtn');if(lqDelBtn)lqDelBtn.style.display=isAdmin?'inline':'none';
}
async function adSetSubscription(uid,months){
  const u=adUsers.find(x=>x._id===uid); if(!u)return;
  const now=Date.now();
  let data;
  if(months===0){
    data={subscriptionActive:false,subscriptionPlan:null,subscriptionExpiry:null};
  }else{
    const base=(u.subscriptionActive&&u.subscriptionExpiry&&u.subscriptionExpiry>now)?u.subscriptionExpiry:now;
    const expiry=base+months*30*24*60*60*1000;
    data={subscriptionActive:true,subscriptionPlan:`${months} сар`,subscriptionExpiry:expiry,updatedAt:Date.now()};
  }
  try{
    await setDoc(doc(fsdb,'users',uid),data,{merge:true});
    Object.assign(u,data);
    adRenderUsers();
  }catch(e){notify('Алдаа гарлаа: '+String(e.message||e).slice(0,100));}
}

// ── CLOUDINARY UPLOAD (аудио болон зураг) ──
async function uploadCloud(dataUrl,publicId){
  try{
    const fd=new FormData(); const res=await fetch(dataUrl); const blob=await res.blob();
    fd.append('file',blob); fd.append('upload_preset',CLOUDINARY_PRESET); fd.append('public_id',publicId);
    const r=await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/auto/upload`,{method:'POST',body:fd});
    const d=await r.json(); return d.secure_url||null;
  }catch(e){return null;}
}

// ── FIRESTORE ──
async function mqSaveAll(){
  // Бүх round-уудыг хадгална (import, createRound-д ашиглана)
  for(const r of mqRounds){ await mqSaveOne(r).catch(e=>console.error('mqSaveOne err:',e)); }
}
async function mqSaveOne(r){
  // 1. Ангиллын зургуудыг upload
  const cats=await Promise.all(r.categories.map(async cat=>{
    let iu=cat.iconImg;
    if(iu&&iu.startsWith('data:')){
      iu=await uploadCloud(iu,`sonic/${r.id}/icon_${cat.id}`)||iu;
    }
    return{...cat,iconImg:iu||null};
  }));
  // 2. Дуунууд зөвхөн YouTube/Soundcloud URL хэлбэртэй — upload шаардлагагүй
  const questions={};
  for(const[cid,qs] of Object.entries(r.questions)){
    questions[cid]=qs.map(q=>({...q, audioData:null, audioRef:null, scUrl:q.scUrl||null}));
  }
  // 3. Firestore-д зөвхөн URL болон мэдээлэл хадгална
  try{
    await setDoc(doc(fsdb,'rounds',r.id),{...r,categories:cats,questions});
    // 4. Хадгалсны дараа mqCurRound шинэчилнэ
    if(mqCurRound&&mqCurRound.id===r.id) mqCurRound.questions=questions;
    const ri=mqRounds.findIndex(x=>x.id===r.id);
    if(ri>=0) mqRounds[ri].questions=questions;
  }catch(e){
    const msg=String(e);
    if(msg.includes('longer than')||msg.includes('INVALID_ARGUMENT')||msg.includes('exceeds')){
      throw new Error('Дуу Cloudinary-д upload амжилтгүй болов. Интернэт холболтоо шалгана уу.');
    }
    throw e;
  }
}
async function qqSaveAll(){
  for(const r of qqRounds){ await qqSaveOne(r).catch(e=>console.error('qqSaveOne err:',e)); }
}
async function qqSaveOne(r){
  const cats=await Promise.all(r.categories.map(async cat=>{
    let iu=cat.iconImg;
    if(iu&&iu.startsWith('data:')){
      iu=await uploadCloud(iu,`quantum/${r.id}/icon_${cat.id}`)||iu;
    }
    return{...cat,iconImg:iu||null};
  }));
  const questions={};
  for(const[cid,qs] of Object.entries(r.questions)){
    questions[cid]=await Promise.all(qs.map(async(q,qi)=>{
      let img=q.imageData;
      if(img&&img.startsWith('data:')){
        const up=await uploadCloud(img,`quantum/${r.id}/img_${cid}_${qi}`)||img;
        img=up;
      }
      return{...q,imageData:img||null};
    }));
  }
  await setDoc(doc(fsdb,'quantum_rounds',r.id),{...r,categories:cats,questions});
}
let _loadAllInFlight=null;
async function loadAll(){
  // Давхар дуудалтаас хамгаалах — нэг л удаа Firestore-с татна
  if(_loadAllInFlight) return _loadAllInFlight;
  _loadAllInFlight=(async()=>{
    try{
      const [mqSnap,qqSnap]=await Promise.all([
        getDocs(collection(fsdb,'rounds')),
        getDocs(collection(fsdb,'quantum_rounds'))
      ]);
      // Array-г бүрэн дахин үүсгэнэ — давхардал гарахгүй.
      // Эвдэрхий бүтэцтэй тоглолт бүх сайтыг унагахгүйн тулд шүүнэ.
      const isValidRound=(r)=>r && r.id && r.name
        && Array.isArray(r.categories) && r.categories.length>0
        && r.categories.every(c=>c && c.id)
        && r.questions && typeof r.questions==='object';
      const mqList=[]; const seenMq=new Set();
      for(const d of mqSnap.docs){
        const round=JSON.parse(JSON.stringify(d.data()));
        if(!isValidRound(round)){console.warn('Эвдэрхий MQ тоглолт алгаслаа:',d.id);continue;}
        if(!seenMq.has(round.id)){seenMq.add(round.id); mqList.push(round);}
      }
      const qqList=[]; const seenQq=new Set();
      qqSnap.forEach(d=>{
        const round=d.data();
        if(!isValidRound(round)){console.warn('Эвдэрхий QQ тоглолт алгаслаа:',d.id);return;}
        if(!seenQq.has(round.id)){seenQq.add(round.id); qqList.push(round);}
      });
      mqRounds.length=0; mqRounds.push(...mqList);
      qqRounds.length=0; qqRounds.push(...qqList);
    }catch(e){console.error(e);}
    finally{_loadAllInFlight=null;}
  })();
  return _loadAllInFlight;
}

// ── NAVIGATION ──
function setAllInactive(){
  document.body.classList.remove('movie-mode');
  ['navMQ','navMV','navQQ','navMC','navFL','navLQ','navWQ','navQR','navCD','navSQ','navKZ','navF1','navTW','navMM','navAdminDash','navAdminLogos','navAdminWords','navAdminStars','navAdminTW','navMyPlan'].forEach(id=>{const el=document.getElementById(id);if(el)el.classList.remove('active');});
  document.querySelectorAll('.screen').forEach(s=>{s.classList.remove('active');});
  // hide QQ bg
  document.getElementById('bgScientists').classList.remove('visible');
  const mvbg=document.getElementById('mvPosterBg'); if(mvbg)mvbg.classList.remove('visible');
  document.getElementById('qqGrid').classList.remove('visible');
  document.querySelectorAll('.formula').forEach(f=>f.classList.remove('visible'));
}
function showLanding(){
  setAllInactive();
  document.getElementById('landingScreen').classList.add('active');
  activeGame=null;
  setTheme('mq');
}
function showMQHome(){
  setAllInactive();
  document.getElementById('mqHomeScreen').classList.add('active');
  document.getElementById('navMQ').classList.add('active');
  activeGame='mq';
  // loadAll дуусаагүй байвал дахин татах
  if(mqRounds.length===0 && currentUser){
    loadAll().then(()=>mqRenderHome());
  } else {
    mqRenderHome();
  }
  setTheme('mq');
}
function showQQHome(){
  setAllInactive();
  document.getElementById('qqHomeScreen').classList.add('active');
  document.getElementById('navQQ').classList.add('active');
  // Show QQ bg
  document.getElementById('bgScientists').classList.add('visible');
  document.getElementById('qqGrid').classList.add('visible');
  document.querySelectorAll('.formula').forEach(f=>f.classList.add('visible'));
  activeGame='qq';
  if(qqRounds.length===0 && currentUser){loadAll().then(()=>qqRenderHome());}
  else{qqRenderHome();}
  setTheme('qq');
}
function showMVHome(){
  setAllInactive();
  document.getElementById('mvHomeScreen').classList.add('active');
  const nb=document.getElementById('navMV'); if(nb)nb.classList.add('active');
  document.body.classList.add('movie-mode');
  activeGame='mv';
  buildMoviePosterBG();
  const mvbg=document.getElementById('mvPosterBg'); if(mvbg)mvbg.classList.add('visible');
  if(mqRounds.length===0 && currentUser){ loadAll().then(()=>mvRenderHome()); }
  else { mvRenderHome(); }
}
const MOV_ACTORS=[
{name:"ALEXANDRA DADDARIO",flag:"🇺🇸",born:"1986",award:"White Lotus (2021)",img:"data:image/jpeg;base64,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"},
{name:"TIMOTHEE CHALAMET",flag:"🇺🇸",born:"1995",award:"Оскар номинант 2018",img:"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//gADR//bAEMACgcHCAcGCggICAsKCgsOGBAODQ0OHRUWERgjHyUkIh8iISYrNy8mKTQpISIwQTE0OTs+Pj4lLkRJQzxINz0+O//bAEMBCgsLDg0OHBAQHDsoIig7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O//AABEIAK8AjAMBIgACEQEDEQH/xAAcAAACAgMBAQAAAAAAAAAAAAAEBgMFAAEHAgj/xAA8EAACAQMDAgQDBgUDAgcAAAABAgMABBEFEiExQQYTUWEicYEHFDJCkcEVI1JzoSXR4TNyNUNjkrHw8f/EABkBAAMBAQEAAAAAAAAAAAAAAAECAwQABf/EACIRAAICAgIDAQEBAQAAAAAAAAABAhEDEiExBBNBIjNhcf/aAAwDAQACEQMRAD8ApMVmKIvLcWt5LADuEbFc1Diqmc1it4q/0Hww2t2zzC48rY23GM1Zt9n03a9X6rTasRzihNxWVba9oEmheX5syyCTpgYpYvtWht4j5ciF8cDOTSS/PY8f10HtJGhAd1UnoCcZrw08aDJYfrSNPK9xKZJXLux5JqaOdmykhJ4wPiNJsV9YxT61BG5AfP8A2LuH65oi31S3mX/qLn5/70oqzliwPCjpUkUu4/Gn6UNmHRDi13boVV5kUt0BPWpA6noaSZUDMdv/AOUVFql3bQLGArYPBcZxTKQrgNnXoazFL9v4hkSRVu0Vk/rQYx9KvIp4p4xJG4ZTyCKZOxGmj3WV6HIrWKIDzitY9q9YrK44stY41i6/uGgsUdrIxrF1/cNBUX2BdD94A/8ADJ/7lNMkgiQu3QClbwEwXTJ8n/zKVPtF+0JDv0fSZQ69J5k6E/0g+nrTOVIioOc6RWfaH4t/iuoLaae2Yoch5h0Y98H09656xJfk8+pNTm7eQEEZLdSTW41TGWUVmcm3bN0YqKpHmKHj4l+uakaGMA5dQe1aldFUj8I6BQOW9z7VGFaY4Rdox270ByaBYxkKjSMOTngGioCj53QqgHU7uR9KFt7Z2DHldv5lNT+RMoG+Qsp/NmgzjV2rmLzImDJ6gUFE7u4jPxZPQ0fbDydQ8iQEpIORnI6cGgJ1EV02xshW4NFAZJJE6H4VPTpjtUtjqL2UuduAeoHeop5XeQBiTjOO3FQGQjjA+tFAaHa0uY7iFZEYEN2qfFLuh3QQbA42n8p6g0xKciqp2RkqZmK1XrFaxRFLPWh/rN1/cNAnoTR+tj/Wbr+4aAdgqEnoBXPsC6Rf2eqfwzwHqs8b7JsFU45ycD965IyvLKS35j3q31XXZ7mEWkTFbYMTjPU+pqsEJ25DcmpzlZfHDW2b+6CEBnfPoAK9KwDrlNxP4V/c1tELtljwoyce1b0/a7yTyHgYxUygObV3u9h785NTzrFBGRHIQ69x2NXGjW8d5qcrSr8BbCnHA9M1ZyeEoJoprhnIRc4Yj/6KVzSfJRQbQlJPLubaT8XJAqVTciFl+IowIFPXg/wXbX/nyXKMY93wN6gU3xeCNNtojH5e8dt3ag8iRyxNnFY2eN1dyTsXj/aoY8vcAkZJbp610bxJ4PjidWhBICngDFJV5o09q5JXCjr7U0Zpiyg0QX8bCZNrB2Zfy9MetRtahozIOSOq5rcxkCBUXAPBY9ajGYk6lW+fWmEIopTFOsi8bSKc7G4WaIMrbgRkGknOGzTLoriNUjB+FhlT/wDIp0+RJK0XorVYDxW6oRLbxFC8GuXKuCNzbh8qqZxmF+3wmupa94bg1pQ+fLnUcOKRfE3h2fw9o0t/NIkoDCNF6Ak+vtRlH6JCadI5yltvlkReVXgEnGaEUOjsnYHGDyKkVmaUR5Kg17lQwOV3q/ocVmNxuNnjDq2AHGzHzrxco8Lx26fmAOB69KKQRSWJTcPPZgUA7Y71YeEtMl1jXUmlG6GCQGQnufShfFsbXmhx0Lwi91pqurmCdlAWQH065q2h8BRll+8vcTMGyVL/AAfpTfp8Ajt1CjbkdKNVdo6fX1rNs2zRVcFfp2mRafbLDGoUCpZIwSeaJbmoJCaDCip1C2EiFSFII70oappkUu6HywPfrj3p0u2G3rS9fbY1Zz1NCLDI5vrVgtvcqEGBg9flS/O+enIpv8RzIyFm/F2pN24kII49fStcejHLsiI54ozT7toLiNC2F3d+1RtEcq4KlVxnBqKV1kuGcjarNnjsKcQe4WDDipKqdHeGO2VInLr1yfWrLzKsnaINUzuFUHjbSpNZ8LXdpCm+UASIvqVOcfXmgrPx7ZyKBdRPE3cgZFFSeN9IVcrI7H0C1R00ZUpRd0cMmtopZtsTmNkQEAjndwCKDuLG5SdUdCSxwpHQ07+Krmx1XUhNZacsUjMSWAwZD7jpXv8Ag0M1vb31s0sotmjM27OBngnHQYNYcktJUetiW8LKaHwbeS26MrEORyegH1q80yz1bw5CiRLA0IJYhV5JPXPc08WsKSQhBgDHaqjUdGvZNRiJnaK36O8Kgv8ATPSsyyOTpmj1pco82f2krayeXqFt5aj8yZz+hpt0rxNp2sLm2mySM7WGDSLa+F2mvnW81dpLZM4Z8yFz2+Ej5Vb6d4bXTZYZ4fgUvhlUEKfcA9KaVIEbY7eYueTQ8s8eMFx8s0FrU38P0tp95yi5yO9cy1E65q0UlwXlWJcuRGpJC+9dFbHXXJ0G/uYVOPMHPSlvVLkGPg0kRW8UkuJdSlWTph0K5PtzipmW/gUeTcmaLPCkHGKfRC7tgXid2by1TJyKpYQ8HxO2zjG0Hk0x6qmbBi68hf0paSTMJDRkjHLVVdEZdmSMrZYMzsOzHpXi2jLzZYBgOua9NiV1IGCQB8/ep0jEWdvc06JsMtj5UgEeFGOcf4q1WUhRk1UW8ZfJo1XKjBNUiSkXlZWqymEAtRvjpghu1j3skike2DmupwrDrejJc2jHybq33IV7g9iPaubTwpPE0UqhkbqDRfh/xTeeFYGs41F3aqSY43bBj9gfSs2fG5K0a/HyqNpjrosm5FDdQcGr1IVkzkUq6BctdQrd7Nhm+MoDkLnnFNlnMGQevesNUzcnaMNhH12j96GulVVwvJHQVZyHK9aqJZDJPtUE88UZP4Fc9lV4wnf7jBBnAkK5Ge1etPDJbARHYxTa3o49x0PFDeLg7mB8cKcYorSsSW0bjo3INUi6QrXNFPqGkMbea2jgtxFL+LEfJ/U9qAh0dbSzwzs6qOA3ane4iwm7IHfHrSrrt0kUDAcDFFSbdCtKK4EfxHcKo8hWAaU7R7VXW0yafEVngVpE/CeNp71YTaNPqz+fuCopx8Q4561T3KQJI0KSedGjY8zGNx7/AErSl8MrbXJEhHLDknvUscZkbAqMDsKsbeLbH05NPFWRkyW3jCRAVIUBNbAwMVlWIlvWVlZQOMoS5ty+WTGaLrRoNWFOhr8JHOkQKx+JAVP0NM9u2xsZpJ8M3LQvMh/AMMfb3psinDOpBrzMsdZNHp4ZXFMud3wcmqqdpbOZrhGDIvO3bzivU9+1udzwStD/AFpzz8qCbxJpqP5comTI5Z0xikimXSlLpFPreuSarKIILZtuepUg5qx0JZYbLZMACDlRmvN3reiygLFeRhsfiIwM/OvFjqFtLIIop0lcckIc8VZu0TacXyF318FiO48gcc0k6xK0wJY/DnpV1qE4kupIw3wqeaWPEF15ds+wfERhQPWqQRLJIWrnxDeywfdLY+SilgWQ8sM/4qsjglYgHhc0VHEIkwRzXpVYnIFXMrYVBbAkZ60cFwAKEtFkMm5uBijKrEizKysrKYUt61WZrKBxusrXasrji78MEff3B7rTJJbtZsrrzAx/9h/2pY8NZ++uw6DjOe9PkQSaAowBBGCK87P/AEZ6OD+aIeTEFI3KRVbcLIgKfdlnT0PUVYwSG0mNvIc45Un8wo/71CqYJFRjaNUZOPQk3Fmbl8Lp8cQ9SAakhaLSrZwirvPUgY5pivpoQjE49qRdevi8os7UbpX5Y9lHvVo3LgTLkk+wS71ALuOdzsc8VQai8ruGl4J6L6VfwWC28e9/jlI5c/tVDr6srxOAfx44rRHujHNcWVe0u+BR0UCqBxXi1A6MhBPIOOCKJrQo12ZXKzAAKysrKYUyt1qsrji2rK1WZpQ1Zuhr29W1jOCu88AE961fX0VpHjzF81vwjrj50s3NyZGfMmTnknqTRT+jatPk6D4HBn+8XLKAxYJkd8D/AJp+tHPApF+ztd2kuf8A1Cevrj/anaHKkc4ry8rvI2ejiVQSCby0iniO9STnOQeQfb0qhu7DUonL2V7vT+mWPcRTMHBTmg50wSRwfWguBmI2pNrEh2S3sSDvsQ5/zQ1larAWOCc8s7HJY+pNN89nC5O5FYk5JxXqHTLUJlkyT2qymqEcRdS3MxzjCiqTXoVHl8hf5mM49jTrdxJGpCKFHpSfr6YeFmAwJd2CMg4BOMfSng7miWRVBgkVk+CrRonlFmwHBwuM/wDNAyxyWzKkz7oidwCt29au4pdtyBJKQrrt25+H55yOMHHFR39pG9uY3hcrktGxXGxfQk+nz7V6bjao8tOmVbW+5cRFXLDdGc43Dv8AWhGlVCVfKlThgR0+dSPbXVuu1gxCHesyDKKfY+h6Ghbi6gaYSP8ACz/C+RkAj1rz9ssJ6y5RsqElaCVIdN6fEvqKzNA3llJDGLiAtGvGCjfv6UGdTvV4Lhj3LKM1oUkyeo6pbvIBggZ7Hio7yzlso3up0YwqDg9qc20e0j4iMkLr1UAMWGaR/G2rs840oudkYEjqD37A8dcZ/wAU0oQcal2aMWV45bY6r/exVuZHlmkaZtjEZwcHjqMfSguC+Acj1qW42qcJkBucE5IHYV4jQlhipsRc8nUfs3dG0plBBIkIPr609eUTEGHauL+Fdck8M6jc/eLeRkZUd16Mqg4JH6j9K7Zpd1b6lYR3VrKs0Eq5V1OR8vn7Vgyx/VmuDpU+zcTZGOlQTsRkCjPK2S+xoeeIrPtx1pEUAisj/lqdoykeMYo2K2OASK3cwfCAB1onFLLD5mTilfxJo9xcxxvboZDATI6r124wTjv1roAtljiZn4AGTVLoWsWl/rOpQ2cgke2iHmSKQVBJPwr64xyavgjtNGXyZ6Y2znsUH8u2wixGGULhxkENjGPY89elNstnFfJtZmjmikyVUAnHQE5+eD6ihde06AXnnY+7wTYV3yBGuCCCRxjPI61ayJIupQyWyq0jgFD04A5Bx1BB4znmvWSceGeWpqa2RV6hplvEDA0zu7ZTL5c+wxg8fIY7+tJOueH2065QJHJtmGMNjr6D2966heWzXdqk0KM0hz/L8zacZ/wRjg44zzkVXXGkx30As5UJjlB2ll2tGQeD19wCPfIoOKfDDs48o5vZXRWCXT7lAQrfm6j1GaGv7CKG6KxyhkIDKRzwaPvrCbQtbliuFyVzg7OGB6EZ6CvIHn/E4QMvw9P9sVJJdMvf1HRZtZXT4mluP53lZbcXwQMds9PrXL9Uma4uzfXTq0905mkQE/AOyk9M9OPlTB4qhuFs02H+QhxI+7B46D5UmPu5yc85NQVpUzVkpy/PR5ZjLIXIHJ6DoPlTd4W8Ph411K5jO1WzGjDhvevHgjwkdfuWurjAsrdvjGeXbGdvy9TXTp9MQWEjLtGwZUKNqgDtgfKsnkZHWsez0fAww3U8nXw5L4lQQ+KyC2I50CsR6MCDUPhzxTqvhe6MllKDGT/Nt5OY5PmOx9xzU/jsH+NxDcf+lx7cmqm7xMyXIQJ56bmAP5xwx+p5+tUxU8aIeba8if8A07Hpf2oeHtUhVb120247iYZTPs4/fFXb6tpty8E1vqNrMh4yk6n96+ecEdK1gdSo/SueGPaILK1wz6bk1LTrWDfNfWsYHd5lH70t6x9o3hjTkO2/F5KOkdqu/wDz0H61wfC/0j9K3jNd6VfIfaxt8U/aJqfiBWtYM2NiesSN8cn/AHN+w4+dFfZ9r+neHtN1a4vCxkkMaxRxj4mwDnHYDnqaSMURbdJPlV4JRfBnyx9iqQz694+vtTlK2sMdtFk43KHcjGMHPH+K34X8Yy6a8UGogz20bbo5MZeH5eq9OO3alI/ir2p7VXdt2yaxQiqSO3rqa+cbyN4pLJslpw3w7cDByeB/wam057HV7hprK8jlgDbWCkFmI549BznOM+9cWSef7mbXz5PILbjHuO0n1xWobmeznSe2leKRSGVkOCKpuSlibVJnSPtP0cNaw6kmMxna/uD0/wA0oWVmmoW4m+6TNj4cxsSOPoaYJvGcvibRF02WziNyYyJMDAY5wrJ6H50n288kEZjMioQehz+woN82dhi1HVn/2Q=="},
{name:"TOM HANKS",flag:"🇺🇸",born:"1956",award:"🏆 Оскар ×2 (1994, 1995)",img:"data:image/jpeg;base64,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"},
{name:"TOM HARDY",flag:"🇬🇧",born:"1977",award:"🏆 BAFTA 2011",img:"data:image/jpeg;base64,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"},
{name:"LEONARDO DICAPRIO",flag:"🇺🇸",born:"1974",award:"🏆 Оскар 2016",img:"data:image/jpeg;base64,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"},
{name:"JAKE GYLLENHAAL",flag:"🇺🇸",born:"1980",award:"🏆 BAFTA 2006",img:"data:image/jpeg;base64,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"},
{name:"CILLIAN MURPHY",flag:"🇮🇪",born:"1976",award:"🏆 Оскар 2024",img:"data:image/jpeg;base64,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"},
{name:"MATT DAMON",flag:"🇺🇸",born:"1970",award:"🏆 Оскар 1998",img:"data:image/jpeg;base64,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"},
{name:"EMMA WATSON",flag:"🇬🇧",born:"1990",award:"Гарри Поттер (2001–2011)",img:"data:image/jpeg;base64,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"},
{name:"JESSICA ALBA",flag:"🇺🇸",born:"1981",award:"Алтан бөмбөрцөг номинант 2001",img:"data:image/jpeg;base64,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"},
{name:"JOSEPHINE LANGFORD",flag:"🇦🇺",born:"1997",award:"After цуврал (2019–2023)",img:"data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAoHBwgHBgoICAgLCgoLDhgQDg0NDh0VFhEYIx8lJCIfIiEmKzcvJik0KSEiMEExNDk7Pj4+JS5ESUM8SDc9Pjv/2wBDAQoLCw4NDhwQEBw7KCIoOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozv/wAARCACvAIwDASIAAhEBAxEB/8QAHAAAAwADAQEBAAAAAAAAAAAABAUGAgMHAQAI/8QAOhAAAgEDAgMGBQEFCAMAAAAAAQIDAAQRBSESMUEGEyJRYXEygZGhsRQjQtHh8AcVFiRScsHxM0Ni/8QAGQEAAwEBAQAAAAAAAAAAAAAAAgMEAQAF/8QAIhEAAgICAgIDAQEAAAAAAAAAAAECEQMhEjEEQRMiMlFh/9oADAMBAAIRAxEAPwCWIrEithrEimBmoitchCqSelb2GBmkur3mAYVOM/F/CuMA7y4NzLnOI12HrWpSxIVeZ8vxWheKRwBueQFGgpZry45scui1zRiYZaWURbNw4Axk5NHRi2ncpbxoehLuRj6VPPLLI2WYmm2hwNLcqAuTnzpclWxkZJuj3V7OaBwZrcKuPCytkEVo026ijk4ZImIO3EuDt7VXalbLOyQyjbgOcD02qKaDursquNj54rYvkjZLjK0W9jHbTovhdNv312PzpzAqQIUKAofLpSPQ1m7lSONfTj4h9KftEskIP7w6jYipZLZZB6EOs2FteP4cJLjwv5+hqVmhkglaORSrA4wapNTfu34XbfOzChbiNNStiQR38YyD/qA6U2EuOmIyQUtoRUXp9ml48okkkRY0Dfs0DMxLKoG5A5tQuCDg8xTzspZy3+ozW8HdGTulcCWTgVgsiMRn1AqgkoHk0m1RmjM10kvdu6rJEmDwqT0cnG2M0prpGu6Pd/oZrgWenWkFsk0hEFyrNgxsvCAFGdyK5wRWI6igIr7FZYrCRlVSWbAHM1wxg91MsMZY8gKmZBJeXBPVjTHU7gysERSF8z1pVLLhTGh5/E3n6Vqv0BKvZtaWK3ykG7Y8Un8Kwiidzxcs9T1rCCMO2cbU4mtHsdOW4dcNIwVR5bZrG6Oim9mzTNPu3fIjSRequuaptOW1tB4rPhkB2dDy+XMUi0XSrjUHVjIVHnV7pml9wgEjd5jq4yaly5PRdhxasWrA+JJuDvGcEKMchUvHo6yXpW4bucn96Mmupx2qNzAohNMt5SA8St7ikLK0UPDF9khp+mx2MIaPgcY3K8j/AF8q9ub1Iz+9E3njIPvV5/hy3MPHFmM+SnFT+q9neOJ0YDJ5ECt57tgqKeonOtXue+kOcfXINAW1y0UgGfY1lqkElncPFICCp59KWGbDDPKqlFOOiOU3GWxjeIok7xeT70Md6JLmS0BPvQ5pkHaE5FT0eYHkK9xXle0bFoomyKW3kvhB55+Ef80xmBMbAc8Gkl5Jw25lPNxhfQUNjhRdXDNIyg+5oUDPKvTksT51siXL+1GtIR2w2xRVu4VbkWGarO18IWwtFC4AlLZ9x/1UesjLeRleYYAfWugdq7fvdCjmHNJB+Knm6kivErhI0dmXCKFqzgbIFQ/Z8EOKtbYHhFR5Oz0cf5QwRtqMgbBFL1OCKOt98UsMcQzHhx0rC5iWZMEVhCDtW1zRN2ieqlo5/wBsezKvBLfRJ41GT61y6aKN3/ZrgnmM8jX6IuoEureSFwCHUg1xeLs1c3XambSrdCXVm58gmeZpuCVJoXnjypii3GI1iY8wdjWsjBxTntHoU/Z7UY7eeSOXvF445YzsRnBB9qUOMNVeN2SZY1owr6veGvsCmCR9dHCcI24jip7UW4xgHwgnhz5U8u2Es6Q9PiY+nlU/qspe6kAGFUgD6Vgxi5F33rcq8Kk9TWMQDMc8gMms9+HjPM8q5sFLRshj7y/gRd8yID9RXSO0EhTsmzFS7cSjA5n+sVEaDb97qVt4c+LjPy3qo7W3z2+jJDE4VpZVVT5ADekz+04xKcS445MV6Nr9tbygXMMkQ/1YzV1pupWt3GGt5lkHpXLom1VbkRklt8eIDH/VMbDWxbTqyhVbPC3ByNdm8drdBYfIvTZ055OAcR5Ulv8AtDqqymHS7PONjLINqpdChW901bhl4gVzvUZ2qv511JNOjk/T96d3wdh/xUcFboum9BFpNq00mdW15Isn/wAaNVbYQIVV49RnkOOZbIrnfZjS9VOsm3e5KWp+OVeHwjzPEpDdOtXuh6TdxcXHNBKhPhaKPu8jzK8s+1OzYnFJ6E4csZ2qaooI+Qyc+tI7Kwtk1q9unYLJNlBjmR7+9PeDulwelAtpayXkVwrBUB8WObNUm/Q2PH2cp7Tpxa4unk7WUIj9mxxN9zSCUYPrTm5ma71zUL10I7yaVsHplsD7UonILZFejh1o8/O3L7P2as15X1e1QTB1zOY4mm6sC31OB9hU7PIznJppqbMzCAZ+Lh+lL76MR8IXcedCEzRCfiXzomRRhEHNsD2oVDwup+tHwKJbiPrkislo6Ox/2ag4GluWHhjGB/XyrLXIZr68jixlYxkj1O5ovs/GbiDuRsCeN/XHT60ZOgiuBIR1wSftUnJqbkehGKcFH+icW5t7ch0ztjBO1T7x5uQQoVQc7CrXUlWS38GMkVJyxE3Ii5ZO5pkcjaF5MaTO9dlI0XQI1XdeBcUt7VdmTqLpPC3C6jGOWaZdlvBosUQOeFBv7CjNQn4FXPI8jUl0h6v5dElpWjm3cLOWOOjVZ2gjig8IApYjK5zRavhcCs5DMkbMp3GdyAOpoHV9VEFuEtJA5414yOi53FY6pOkFjLJKRw8JGD19KSNE6WPA+zEDPvQncVoR6zpUay3N3ACRc5k4fI9RULOpWQqeldXEa8XcS4CTnwMf3X/nyrnnaXT2sNUdChVW3Hp6VZ40ttMk8qPTEvWvq9NfYqshPbrCy+LBfjOfTNA6gwbhQbBdvc0wuQZLlSxADHJNJ5nLSuDuOIkUC2xj6MMZFM9HCyXca5wSQD9aXtg4Ir20mNvcq/8ApOa57Ri00dR0WwNjqMqFf2ZkJUnqCM0LqiNBPPbnOAcKfblR816lkLW4YlUkeOI5P73Bmse0Vv3srzqNiqsDUKf2f+nptVFV6EhnCw5O+1LTd20Ub95bcUrNkP6eVGrH3hbiIVR50A0toJOJ54ioOyg7mmQRkrbVHSuy+oT3GlBLPwuUwve5H/dPo4Lx7JUv5EeUc+BcCoXT+1mnwNC0duyPEvCAhJVh8hVfa9o472LP6Kf/AHKh/BFTyi76K5YppXRuijaJsGi03FD29x3/AMUbxnycYNFkrHGWY4CjJNALkxRrltHJNb3NxIwt7FXneNR8bYwM+2+3nikGj6+vaWCSYRGDupCBFnxcI6n1rZ2n16NXj0qNgbm8dTIOfAhOwPvj7VKdnWktdUkEThH+JM8iSdwfT+NHxfC2Li/vSLe4Uz6e45srHf1FS/a0/wB46XBfqOJsYkPXI61a2IS6s3mVSpJPGh5o3UVK61bFdMuIkGOJmZV8t9x+aLHKpJg5Y8otHP6+zXpBBIPMV9XqHkhtxABfxxE/EPCfxU9cKRO+3ImmxvXcRysSXibiU+nUf160LqMY/VyEDZjxj2O9ITpjntASDiPKttnaPdajHbIMmRgv1IryEeID1qo7KWKR6mb+f4Yz4B61k58U2bDHzaQ+/tBthZ6Dp0CNiU3Bl98Lj8EUztnF3okc8m/+VDe+x/hUv2i1dtf1/gQZjt17lB0Lc2P12+VVllD+m0BoSc91A0efPCHP3JqSWlFey+G3J+iRS6juIsowZWGc+dYx6fbyS8ZJjfoy0h0+aS3uGTBKDClD6VW2VutyiyRHI6jqKbJcOgcU+dP2N7ISFI41VpOHqgxmq3T0l4AWjZTjrSWxZYUXbGKobW8jMQyanbZbPLKSphPCAMnY0n1XVRHI8f8A6beMyzN54BOPt+K91TW0tVY42UZ9/SpjR3k1my1KKZ8z3IkB9MjAA+lAJ6RDaLfT6n2u/WTsWkmlLn0xuB8gMU606ZWWC/CeEMFlA5gHY0j0K2e07S26OCCJuFgenQ1RdmO7S6ltpBmJyUIPkau8hrtEXjJ9MurO4Fs/7RsrIoV288jwtQHalYo7SIIwRmjY5PTevpFe2sRbyjiktvD/AL4ydvpWEcR1CC0nlfKxjuCT6OD+Kjh+qK5/mznOoWkkExZl8Lbhgcg/OhK7pfdjtI12AsYRBKV/8ke2fcdakbj+yO5WYiLUAU6Ex16q6o8h9nNEHDEo885rffJiG2kAyShQn2/kaxjTMndncBc0YgF3proPjik4l9scqRLTHRVoW6dbG4uVjAPPFVcZFpFhT8P/ADQWm2qWFq85HFI4ONug5/wouGN5bQFhxSM2cHzpGR8mVYo8UZdm9Md7iS4lXHCOLcb+/wAzVjdRpaafJA2cJbuz482BoXTVt4LpbRPEUPeTt5t0H8qH12+47O9bPiaNiPbBA/NL/U0xv5g0c809HctKEJXOSQOVVGmMFIZGKn0NYdl4FiQbbY69aoX0CzujxwubWQ9VGVPy6fKqZrl0T4pKPYRZyl8B2Jpwk0cMRIwDjnSGLs7rMR/y88Ey9MSYP0NZXOidpp07sRIgP7xmXH2qd4p30VPJjq7Fmu6lGZHLSDA9a+7Jz/sZrwKQI5FY56odifx9Kx/we0M4bUbhZiNzGmcfM9a32t3Haa6sXCBDKvdMuNsGmPHUaE/LchRq9p+i7WPIq4WdgyH/AHEA/wDNBaferba5wS+ENNwg+oGKoNYg7+wEw8UmmTgN58GR/KoPVpGGqO4P/sLD3zRRXNUKk3jlaOw3bLc6fb3AwWGY5D5qRsfx9KW2IZtNmg+FllM0R8yOYrDRLwz2KROfjQZB+teyPJb3loUU8GGLDyJOR9qj2mW6aot+zF5+s0xXz4hsfemTyhWwWxU52UkW3W6gGwD5X570fcLLPMzqSByr1ISuKZ5U41Jo4Paxcd2R1K4rfp0bG4aJRgPjJPQ+dbxbNbXquV2/hRF1AbKZ2QbE+E+h5falzYyCMHm7zUxCm0SLwj2HM06tk7i0WThy4YhBjO/9b0r0yATXMzyADGE5dKoo0EtlHIqqsaMdz0G+Pn/GpJv0VwT2zTYcUHeScXE5yzN5sf5fmh9SHfxPEuxlcIPlvTG1iVoiccO4dgee/wDQou30zv5A7DKpuPc9ftW41cjcjSifWGjxJax90uMKKPhtWjbhNMrW2CxhcbYrKS3lT4MMPIivQUNbIHI3WlmcA8VFvblE570La3kiYV4hmmBueOPeMVoDJK/RlnbiqO1xTDqKsh3JDCrrVzxOTjFR2qRI90jdRSZaY+O0FWc5/wAQ3cMoHd3EasQf/pef1qAv7WT+/prZkPGJCuPI5qtv71bPUWuBuyokYHXIoqHRkuu1NzqIUGFoUmUnlxMN/wAGp4PhbGzjzpBul2zRujY8KqFA+1HXhbvGTgxluZ67Vr05ZHUgfE0oRR5dfx+aO1RBGy4GcDA9aXGNjpToI0h+B5MbE4H2xVdaxKLdeIbn0qR0WMyXMakepPrVi8qxngAzgVdjVRIcsrkcfuLZLmISKN8cQoeeDv7NAfjUD7Gnctt+mRWAHCD9j/Og7uD9POrfuMcGgkhkdH0VkY0VwMK6ch5j+VMdMhWQR27DADq33ouKFf0CK3Pjx8sUXFY8EUFwgwCCrehzkVI4u7KVJVQHPpbxaiyKrJHM3DGTyLbZ+W1OLW37qIjHX7U5YRzRo7IMlfoa0yRjJIG9WY8dOySeRvRphXrRSjIrSikHFFRjaqL0INRgVhnGCa2xrwx8JG/nWfCSMCsGbhG9BZpO60yxFs45VDzzK1xxMcAH61U9oBJNIwXOKSRab3hCsOZxSsmyjHXZP9orWaO2g1HhP7afOfTG1VHZpi+kLCd3kbBJ6Dyqok7PwXOlxQ3ESsiqMAjrS3TrFNP1lIgMJxA4pcsbaSCjkSbYz0Sytw1xJw/tOnp5n3oLVF7y4CL50VptyI9TvYieTtWVhB+suXmYeHipsYJKhTk7bDdGsRbESv0XNbZLws5K7jPOtt5IsFk+4HIUmTUG4f2YHD69aaqFdgN9a8WnzbcJVST6Unu8TWMP+o4q1lt1MDNjcD6ioi34TePaj4Y5vB6Kd8Vkl/Bidj64tGitrcdGxTzTbcXOntGR8SkihNaKxparjkM7e1MtCwbRPalcEc5Oj2NXSLu3+JDj5V8RxHair0YbiHXnQ8YzTFaVCzWFw2KIjrzArJRRNmM9UkNnpXkiB/nW54yEryMcS4PSuOEOpWirGWK7mldrApuFPkRT7WSO7ApRbriTPkayg1KkVyRBrQbDYVL6inBqsbgciM1U2rcdoMdRU9qUf+YyeYNatgp0TySka3d7/GTiqO0XudKiYbE71LlSurSN51TiQGwtk/8Ak/muSCkBareF0jgDZIHE3pnlWiCMNECXUe5oSdjcM0o5Oxx7DYfiioY1WIAoM1pno//Z"},
{name:"ANNE HATHAWAY",flag:"🇺🇸",born:"1982",award:"🏆 Оскар 2013",img:"data:image/jpeg;base64,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"},
{name:"PENELOPE CRUZ",flag:"🇪🇸",born:"1974",award:"🏆 Оскар 2009",img:"data:image/jpeg;base64,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"},
{name:"GAL GADOT",flag:"🇮🇱",born:"1985",award:"Wonder Woman (2017)",img:"data:image/jpeg;base64,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"},
{name:"ANGELINA JOLIE",flag:"🇺🇸",born:"1975",award:"🏆 Оскар 2000",img:"data:image/jpeg;base64,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"},
{name:"BRAD PITT",flag:"🇺🇸",born:"1963",award:"🏆 Оскар 2020",img:"data:image/jpeg;base64,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"}
];
function buildMoviePosterBG(){
  const wrap=document.getElementById('mvPosterBg'); if(!wrap||wrap.childElementCount)return;
  // Жүжигчдийн байрлал — дэлгэцийн захаар тойрч байрлана (голын контентоос зайлсхийнэ)
  const pos=[
    {t:3,l:1},{t:3,l:86},{t:20,l:0},{t:20,l:88},
    {t:38,l:2},{t:38,l:87},{t:56,l:0},{t:56,l:89},
    {t:74,l:2},{t:74,l:86},{t:88,l:12},{t:88,l:74},
    {t:8,l:16},{t:8,l:70},{t:90,l:36},{t:90,l:55}
  ];
  MOV_ACTORS.forEach((a,i)=>{
    const p=pos[i%pos.length];
    const d=document.createElement('div'); d.className='mv-actor';
    d.style.top=p.t+'%'; d.style.left=p.l+'%';
    d.style.animationDelay=(i*1.1)+'s'; d.style.animationDuration=(9+(i%5)*1.6)+'s';
    d.innerHTML='<img src="'+a.img+'" alt="'+a.name+'" loading="lazy" decoding="async">'
      +'<div class="mv-actor-name">'+a.name+'</div>'
      +'<div class="mv-actor-meta">'+a.flag+' '+a.born+'</div>'
      +'<div class="mv-actor-award">'+a.award+'</div>';
    wrap.appendChild(d);
  });
  // Хөвөгч кино дүрсүүд
  const icons=['🎬','🍿','🎥','⭐','🏆','🎞','🎭','📽'];
  icons.forEach((ic,i)=>{
    const s=document.createElement('div'); s.className='mov-float'; s.textContent=ic;
    s.style.top=(10+((i*41)%78))+'%'; s.style.left=(20+((i*23)%58))+'%';
    s.style.animationDelay=(i*0.9)+'s'; s.style.animationDuration=(9+(i%5)*2)+'s';
    s.style.fontSize=(20+(i%3)*8)+'px';
    wrap.appendChild(s);
  });
}
function mvRenderHome(){
  const g=document.getElementById('mvRoundsGrid'); if(!g)return; g.innerHTML='';
  if(currentUser){const nb=document.createElement('button');nb.className='btn-new-round mv';nb.textContent='+ Шинэ тоглолт үүсгэх';nb.onclick=async()=>{if(!await hasActiveSubscription()){showSubRequired();return;}openNR('mv');};g.appendChild(nb);}
  mqRounds.filter(r=>r.type==='movie').forEach(r=>{
    try{
      const d=document.createElement('div'); d.className='round-card mv';
      const lk=!currentUser?`<span style="position:absolute;top:50%;right:14px;transform:translateY(-50%);font-size:16px;opacity:.4">🔐</span>`:'';
      d.innerHTML=`<div class="round-card-name">${escH(r.name)}</div><div class="round-card-meta">${r.categories.length} ангилал${!currentUser?' · Нэвтрэнэ үү':''}</div>${canManageRound(r)?`<button class="round-card-del" onclick="delRound(event,'mq','${r.id}')">✕</button>`:''}${lk}`;
      d.addEventListener('click',()=>openPlayerSetup('mq',r.id)); g.appendChild(d);
    }catch(e){console.warn('MV карт зурахад алдаа:',r&&r.id,e);}
  });
  const iw=document.getElementById('mvImportWrap'); if(iw)iw.style.display=isAdmin?'block':'none';
}
function mvOnSearch(v){
  const el=document.getElementById('mvSearchRes'); if(!v.trim()){el.innerHTML='';return;}
  const q=v.toLowerCase(),hits=[];
  mqRounds.filter(r=>r.type==='movie').forEach(r=>{
    if(r.name.toLowerCase().includes(q))hits.push({roundId:r.id,label:r.name,meta:'Тоглолт'});
    r.categories.forEach(cat=>{
      if(cat.label.toLowerCase().includes(q))hits.push({roundId:r.id,label:cat.label,meta:r.name+' — ангилал'});
      (r.questions[cat.id]||[]).forEach((qq,qi)=>{
        if((qq.hint||'').toLowerCase().includes(q)||(qq.answer||'').toLowerCase().includes(q))
          hits.push({roundId:r.id,label:qq.hint||qq.answer,meta:r.name+' · '+cat.label+' · '+PTS[qi]+' оноо'});
      });
    });
  });
  if(!hits.length){el.innerHTML='<div class="search-empty">Олдсонгүй</div>';return;}
  window._mvHits=hits.slice(0,8);
  el.innerHTML=window._mvHits.map((h,i)=>`<div class="search-hit" onclick="mvSClick(${i})"><div class="hit-label">${escH(h.label)}</div><div class="hit-meta">${escH(h.meta)}</div></div>`).join('');
}
function mvSClick(i){const h=window._mvHits[i];if(!h)return;document.getElementById('mvSearchInput').value='';document.getElementById('mvSearchRes').innerHTML='';openPlayerSetup('mq',h.roundId);}
async function mvImportJSON(input){
  const file=input.files[0];if(!file)return;
  if(!currentUser){notify('Import хийхийн тулд эхлээд нэвтэрнэ үү!');input.value='';return;}
  try{const text=await file.text();const data=JSON.parse(text);if(!Array.isArray(data)){notify('Буруу формат');return;}
  const okStruct=(r)=>r&&r.id&&r.name&&Array.isArray(r.categories)&&r.categories.length>0&&r.categories.every(c=>c&&c.id)&&r.questions&&typeof r.questions==='object';
  const newOnes=[];
  for(const r of data){if(!okStruct(r))continue;if(!mqRounds.find(x=>x.id===r.id)){r.ownerId=currentUser.uid;r.type='movie';mqRounds.push(r);newOnes.push(r);}}
  if(newOnes.length>0){
    let failed=0;
    for(const r of newOnes){try{await mqSaveOne(r);}catch(e){console.error('import save err:',e);failed++;mqRounds=mqRounds.filter(x=>x.id!==r.id);}}
    mvRenderHome();
    if(failed>0)notify(`${newOnes.length-failed} тоглолт хадгалагдлаа, ${failed} нь хадгалагдсангүй!\nConsole (F12) дээрх алдааг шалгана уу.`,6000);
    else notify(`${newOnes.length} тоглолт import хийгдэж хадгалагдлаа!`);
  }else notify('Шинэ тоглолт олдсонгүй.');}
  catch(e){notify('Алдаа!');console.error(e);}input.value='';
}
function mqGoHome(){ stopAudio(); if(mqCurRound&&mqCurRound.type==='movie'){showMVHome();} else {showMQHome();} }
function qqGoHome(){ showQQHome(); }

// ══════════════════════════════════════════
// MEMORY CARDS GAME LOGIC
// ══════════════════════════════════════════
function showMCHome(){
  setAllInactive();
  document.getElementById('mcHomeScreen').classList.add('active');
  document.getElementById('navMC').classList.add('active');
  activeGame='mc';
  mcBuildCountGrid();
  mcLoadScores();
  setTheme('mc');
}
function mcGoHome(){ mcStopTimer(); showMCHome(); }
function mcBuildCountGrid(){
  const g=document.getElementById('mcCountGrid');
  const opts=[5,10,15,20,26,32,40,52];
  g.innerHTML=opts.map(n=>`<button class="mc-count-btn${n===mcSelectedCount?' active':''}" onclick="mcSetCount(${n})">${n}</button>`).join('');
}
function mcSetCount(n){
  mcSelectedCount=n;
  document.querySelectorAll('.mc-count-btn').forEach(b=>b.classList.toggle('active',parseInt(b.textContent)===n));
  const cEl=document.getElementById('mcCustomCount'); if(cEl)cEl.value='';
}
function mcSetCustomCount(val){
  const n=parseInt(val);
  if(!n||n<2||n>52)return;
  mcSelectedCount=n;
  document.querySelectorAll('.mc-count-btn').forEach(b=>b.classList.remove('active'));
}
function mcSetRevealMode(mode){
  mcRevealMode=mode;
  document.querySelectorAll('.mc-reveal-btn').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
}
async function mcStartGame(){
  if(!currentUser){mcPendingStart=true;openLogin();return;}
  if(!await hasActiveSubscription()){showSubRequired();return;}
  const nameEl=document.getElementById('mcPlayerName');
  mcPlayerName=nameEl.value.trim()||'Тоглогч';
  // Цэвэр тэмцлийг бүхэлд нь шинэчилнэ
  const deck=mcFullDeck();
  // Фишер-Йетс холих
  for(let i=deck.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [deck[i],deck[j]]=[deck[j],deck[i]];
  }
  mcSequence=deck.slice(0,mcSelectedCount);
  mcPicked=[];
  mcCorrectCount=0;
  mcPicked=[];
  mcPhase='memorize';
  mcClearSeqTimers();
  setAllInactive();
  document.getElementById('mcGameScreen').classList.add('active');
  document.getElementById('mcPlayerLabel').textContent=`👤 ${mcPlayerName} — ${mcSelectedCount} хөзөр`;
  document.getElementById('mcShuffleBtn').style.display='none';
  document.getElementById('mcRecallArea').style.display='none';
  const cdEl=document.getElementById('mcSeqCountdown');
  if(mcRevealMode==='sequential'){
    document.getElementById('mcPhaseBanner').textContent='— АНХААРНА УУ, ХӨЗӨР ДАРААЛАН ХАРАГДАНА —';
    document.getElementById('mcMemorizedBtn').style.display='none';
    if(cdEl)cdEl.style.display='block';
    mcRenderSequenceBoard(false);
    mcStartTs=Date.now();
    mcStartTimer();
    mcSeqRevealIdx=0;
    mcSeqRevealStep();
  }else{
    document.getElementById('mcPhaseBanner').textContent='— ДАРААЛЛАА ЦЭЭЖИЛНЭ ҮҮ —';
    document.getElementById('mcMemorizedBtn').style.display='inline-block';
    if(cdEl)cdEl.style.display='none';
    mcRenderSequenceBoard(true);
    mcStartTs=Date.now();
    mcStartTimer();
  }
}
function mcCardHTML(card,extraClass=''){
  const colorCls=card.color==='red'?'mc-red':'mc-black';
  const centerHTML=`<div class="mc-card-suit-center">${card.suit}</div>`;
  return `<div class="mc-card ${colorCls} ${extraClass}" data-rank="${card.rank}" data-suit="${card.suit}">
    <div class="mc-corner mc-corner-tl"><div class="mc-corner-rank">${card.rank}</div><div class="mc-corner-suit">${card.suit}</div></div>
    ${centerHTML}
    <div class="mc-corner mc-corner-br"><div class="mc-corner-rank">${card.rank}</div><div class="mc-corner-suit">${card.suit}</div></div>
  </div>`;
}
function mcRenderSequenceBoard(faceUp=true){
  const board=document.getElementById('mcBoard');
  board.innerHTML=mcSequence.map((c,i)=>`<div class="mc-seq-col">
    <div class="mc-seq-slot" id="mcSlot${i}" style="display:flex;flex-direction:column;align-items:center;gap:4px;">
      ${faceUp?mcCardHTML(c):'<div class="mc-card mc-back"></div>'}
      <div style="font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--muted);">${i+1}</div>
    </div>
    <div class="mc-pick-slot" id="mcPickSlot${i}"></div>
  </div>`).join('');
}
function mcClearSeqTimers(){
  if(mcSeqRevealTimer){clearTimeout(mcSeqRevealTimer);mcSeqRevealTimer=null;}
  if(mcSeqCountdownInterval){clearInterval(mcSeqCountdownInterval);mcSeqCountdownInterval=null;}
}
function mcSeqRevealStep(){
  if(mcPhase!=='memorize')return;
  if(mcSeqRevealIdx>=mcSequence.length){
    mcClearSeqTimers();
    const cdEl=document.getElementById('mcSeqCountdown'); if(cdEl)cdEl.style.display='none';
    document.getElementById('mcPhaseBanner').textContent='— ДУУСЛАА. БЭЛЭН БОЛВОЛ "ЦЭЭЖИЛСЭН" ДАРНА УУ —';
    document.getElementById('mcMemorizedBtn').style.display='inline-block';
    return;
  }
  const idx=mcSeqRevealIdx;
  const slot=document.getElementById(`mcSlot${idx}`);
  if(slot){
    slot.innerHTML=`${mcCardHTML(mcSequence[idx],'mc-pick-anim')}<div style="font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--muted);">${idx+1}</div>`;
  }
  document.getElementById('mcPhaseBanner').textContent=`— ${idx+1} / ${mcSequence.length} ХӨЗӨР ХАРАГДАЖ БАЙНА —`;
  mcSeqCardStart=Date.now();
  mcUpdateSeqCountdown();
  mcSeqRevealTimer=setTimeout(()=>{
    if(slot){
      slot.innerHTML=`<div class="mc-card mc-back"></div><div style="font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--muted);">${idx+1}</div>`;
    }
    mcSeqRevealIdx++;
    mcSeqRevealStep();
  },MC_REVEAL_SEC*1000);
}
function mcUpdateSeqCountdown(){
  if(mcSeqCountdownInterval)clearInterval(mcSeqCountdownInterval);
  const cdEl=document.getElementById('mcSeqCountdown');
  const tick=()=>{
    const remain=Math.max(0,MC_REVEAL_SEC-(Date.now()-mcSeqCardStart)/1000);
    if(cdEl)cdEl.textContent=remain.toFixed(1)+'s';
    if(remain<=0)clearInterval(mcSeqCountdownInterval);
  };
  tick();
  mcSeqCountdownInterval=setInterval(tick,100);
}
function mcShuffle(){
  // Эхний тохиргооны үед дахин холих сонголт (одоохондоо mcStartGame дотор шууд хийгддэг)
  mcStartGame();
}
function mcMemorized(){
  mcClearSeqTimers();
  const cdEl=document.getElementById('mcSeqCountdown'); if(cdEl)cdEl.style.display='none';
  mcMemorizedTs=Date.now();
  mcStartTs=Date.now(); // Цаг яг энд 0-с эхлэнэ
  mcStartTimer();
  mcPhase='recall';
  document.getElementById('mcPhaseBanner').textContent='— ЭХНЭЭСЭЭ ДАХИН ГАРГАНА УУ —';
  document.getElementById('mcMemorizedBtn').style.display='none';
  document.getElementById('mcRecallArea').style.display='block';
  document.getElementById('mcRecallTotal').textContent=mcSequence.length;
  document.getElementById('mcRecallStep').textContent='1';
  mcPicked=[]; // тоглогчийн сонгосон картуудын дараалал
  // Анхны дарааллыг бүхэлд нь нуух (дугаар л үлдээх) — тоглолт дуустал хэвээрээ үлдэнэ
  mcSequence.forEach((c,i)=>{
    const slot=document.getElementById(`mcSlot${i}`);
    if(slot){
      slot.innerHTML=`<div class="mc-card mc-hidden-slot"></div><div style="font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--muted);">${i+1}</div>`;
    }
  });
  mcRenderRecallDeck();
}
function mcRenderRecallDeck(){
  const deckArea=document.getElementById('mcRecallDeck');
  // Бүх 52 картыг харуулна — тоглогч хүссэн дарааллаараа чөлөөтэй сонгоно
  const allCards=mcFullDeck();
  deckArea.innerHTML=allCards.map(c=>{
    const used=mcPicked.some(pc=>pc.rank===c.rank&&pc.suit===c.suit);
    return `<div onclick="mcPickCard('${c.rank}','${c.suit}')" style="cursor:pointer;">${mcCardHTML(c,used?'mc-used':'')}</div>`;
  }).join('');
}
function mcPickCard(rank,suit){
  if(mcPhase!=='recall')return;
  if(mcPicked.some(pc=>pc.rank===rank&&pc.suit===suit))return; // аль хэдийн сонгогдсон
  const idx=mcPicked.length;
  const card={rank,suit,color:MC_SUITS.find(s=>s.s===suit).c};
  mcPicked.push(card);
  // Тоглогчийн энэ сонголтыг яг тэр баганын доод слот дотор харуулна
  const pickSlot=document.getElementById(`mcPickSlot${idx}`);
  if(pickSlot)pickSlot.innerHTML=mcCardHTML(card,'mc-pick-anim');
  document.getElementById('mcRecallStep').textContent=Math.min(mcPicked.length+1,mcSequence.length);
  mcRenderRecallDeck();
  if(mcPicked.length>=mcSequence.length){
    mcFinishGame();
  }
}
function mcStartTimer(){
  mcStopTimer();
  mcTimerInterval=setInterval(()=>{
    const elapsed=(Date.now()-mcStartTs)/1000;
    document.getElementById('mcTimer').textContent=mcFormatTime(elapsed);
  },100);
}
function mcStopTimer(){
  if(mcTimerInterval){clearInterval(mcTimerInterval);mcTimerInterval=null;}
  mcClearSeqTimers();
}
function mcFormatTime(sec){
  const m=Math.floor(sec/60);
  const s=(sec%60).toFixed(1);
  return `${m.toString().padStart(2,'0')}:${s.padStart(4,'0')}`;
}
async function mcFinishGame(){
  mcEndTs=Date.now();
  mcStopTimer();
  mcPhase='done';
  const totalSec=(mcEndTs-mcStartTs)/1000;
  const memSec=(mcMemorizedTs-mcStartTs)/1000;
  const recallSec=(mcEndTs-mcMemorizedTs)/1000;
  document.getElementById('mcTimer').textContent=mcFormatTime(totalSec);
  // Анхны дарааллыг бүгдийг харуулна, байр тус бүрийг тоглогчийн сонголттой харьцуулж тодруулна
  let correctCount=0;
  mcSequence.forEach((c,i)=>{
    const slot=document.getElementById(`mcSlot${i}`);
    if(!slot)return;
    const cardEl=slot.querySelector('.mc-card');
    if(!cardEl)return;
    cardEl.classList.remove('mc-hidden-slot');
    const pickedAtPos=mcPicked[i];
    const isMatch=pickedAtPos&&pickedAtPos.rank===c.rank&&pickedAtPos.suit===c.suit;
    if(isMatch){
      correctCount++;
      cardEl.classList.add('mc-revealed');
    } else {
      cardEl.classList.add('mc-missed');
    }
  });
  mcCorrectCount=correctCount;
  document.getElementById('mcPhaseBanner').textContent=`— ҮР ДҮН: ${correctCount} / ${mcSequence.length} ЗӨВ —`;
  document.getElementById('mcRecallArea').style.display='none';
  const pickedContainer=document.getElementById('mcPickedContainer');
  if(pickedContainer)pickedContainer.innerHTML='';
  // Үр дүнг хадгална
  const scoreEntry={
    name:mcPlayerName,
    count:mcSelectedCount,
    correct:mcCorrectCount,
    totalSec:Math.round(totalSec*10)/10,
    memSec:Math.round(memSec*10)/10,
    recallSec:Math.round(recallSec*10)/10,
    ts:Date.now()
  };
  try{
    const mcScoreId=`${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    await setDoc(doc(fsdb,'memory_scores',mcScoreId),scoreEntry);
  }catch(e){console.error('Memory score save error:',e);}
  // Тоглогч карт харьцуулалтыг 5 секунд харах боломжтой байлгана, дараа нь үр дүнгийн цонх гарна
  setTimeout(()=>mcShowResult(scoreEntry),5000);
}
function mcShowResult(entry){
  const stats=document.getElementById('mcResultStats');
  stats.innerHTML=`
    <div class="mc-stat-row mc-stat-highlight"><span class="mc-stat-lbl">Зөв цээжилсэн</span><span class="mc-stat-val">${entry.correct} / ${entry.count} ТААСАН</span></div>
    <div class="mc-stat-row"><span class="mc-stat-lbl">Нийт хугацаа</span><span class="mc-stat-val">${mcFormatTime(entry.totalSec)}</span></div>
    <div class="mc-stat-row"><span class="mc-stat-lbl">Цээжлэх хугацаа</span><span class="mc-stat-val">${mcFormatTime(entry.memSec)}</span></div>
    <div class="mc-stat-row"><span class="mc-stat-lbl">Сэргээх хугацаа</span><span class="mc-stat-val">${mcFormatTime(entry.recallSec)}</span></div>
  `;
  document.getElementById('mcResultOverlay').classList.add('open');
  document.body.style.overflow='hidden';
  confettiBurst();
}
function mcCloseResult(){
  document.getElementById('mcResultOverlay').classList.remove('open');
  document.body.style.overflow='';
  showMCHome();
}
function mcPlayAgain(){
  document.getElementById('mcResultOverlay').classList.remove('open');
  document.body.style.overflow='';
  mcStartGame();
}
// ── LEADERBOARD ──
async function mcLoadScores(){
  try{
    const q=query(collection(fsdb,'memory_scores'),orderBy('correct','desc'),limit(100));const snap=await getDocs(q);
    mcScores=[];
    snap.forEach(d=>mcScores.push({...d.data(),_id:d.id}));
  }catch(e){console.error('Memory scores load error:',e);}
  mcRenderLeaderboard(mcSelectedCount);
}
function mcRenderLeaderboard(filterCount){
  const tabsEl=document.getElementById('mcLbTabs');
  const counts=[...new Set(mcScores.map(s=>s.count))].sort((a,b)=>a-b);
  if(counts.length===0){
    tabsEl.innerHTML='';
    document.getElementById('mcLbTable').innerHTML='<div class="mc-lb-empty">Одоогоор тоглолт байхгүй байна. Анхны тоглогч нь та байгаарай!</div>';
    return;
  }
  const activeCount=counts.includes(filterCount)?filterCount:counts[0];
  tabsEl.innerHTML=counts.map(c=>`<button class="mc-lb-tab${c===activeCount?' active':''}" onclick="mcRenderLeaderboard(${c})">${c} хөзөр</button>`).join('');
  const filtered=mcScores.filter(s=>s.count===activeCount).sort((a,b)=>{
    // Эрэмбэ: илүү зөв цээжилсэн нь түрүүлж, тэнцвэл хугацаа богино нь түрүүлнэ
    if(b.correct!==a.correct)return b.correct-a.correct;
    return a.totalSec-b.totalSec;
  }).slice(0,50);
  const tableEl=document.getElementById('mcLbTable');
  let html=`<div class="mc-lb-row mc-lb-header"><div>#</div><div>Нэр</div><div>Зөв</div><div>Цээжлэх</div><div>Нийт</div><div></div></div>`;
  filtered.forEach((s,i)=>{
    const delBtn=isAdmin?`<button class="mc-lb-del" onclick="delMcScore('${s._id}')">✕</button>`:'';
    html+=`<div class="mc-lb-row"><div class="mc-lb-rank">${i+1}</div><div class="mc-lb-name">${escH(s.name)}</div><div>${s.correct}/${s.count}</div><div>${mcFormatTime(s.memSec)}</div><div>${mcFormatTime(s.totalSec)}</div><div>${delBtn}</div></div>`;
  });
  tableEl.innerHTML=html;
  const mcDelBtn=document.getElementById('mcDelAllBtn');if(mcDelBtn)mcDelBtn.style.display=isAdmin?'inline':'none';
}
function delMcScore(id){
  if(!isAdmin){notify('Зөвхөн admin устгах боломжтой');return;}
  if(!id||!confirm('Энэ бичлэгийг устгах уу?'))return;
  deleteDoc(doc(fsdb,'memory_scores',id)).then(()=>{
    mcScores=mcScores.filter(s=>s._id!==id);
    mcRenderLeaderboard(mcSelectedCount);
  }).catch(e=>{notify('Устгахад алдаа: '+String(e).slice(0,100));});
}

// ── PLAYER SETUP ──
let _pendingStartGame=null;
function openPlayerSetup(game,roundId){
  if(!currentUser){pendingGame=game;pendingRoundId=roundId;openLogin();return;}
  _pendingStartGame=game;
  if(game==='mq'){mqCurId=roundId;mqCurRound=mqRounds.find(r=>r.id===roundId);}
  else{qqCurId=roundId;qqCurRound=qqRounds.find(r=>r.id===roundId);}
  setPC(selectedPC);
  document.getElementById('psOverlay').classList.add('open');
}
function setPC(n){
  selectedPC=n;
  document.querySelectorAll('.pc-btn').forEach((b,i)=>b.classList.toggle('active',i+1===n));
  const wrap=document.getElementById('pNamesWrap'); wrap.innerHTML='';
  for(let i=0;i<n;i++){
    const c=PCOLORS[i];
    const en=players[i]&&players[i].name&&!players[i].name.match(/^Тоглогч \d+$/)?players[i].name:'';
    wrap.innerHTML+=`<div class="pname-row"><div class="pname-badge" style="background:${c}20;border:2px solid ${c};color:${c};">${i+1}</div><input class="pname-inp" id="pn${i}" type="text" value="${escA(en)}" placeholder="Нэр оруулна уу..."></div>`;
  }
}
async function startWithPlayers(){
  players=[];
  for(let i=0;i<selectedPC;i++){const inp=document.getElementById(`pn${i}`);players.push({name:inp?inp.value.trim()||`Тоглогч ${i+1}`:`Тоглогч ${i+1}`,score:0});}
  document.getElementById('psOverlay').classList.remove('open');
  if(!await hasActiveSubscription()){showSubRequired();return;}
  unlockAudioPlayback();
  if(_pendingStartGame==='mq') mqStartRound(mqCurId);
  else qqStartRound(qqCurId);
}
// Хэрэглэгчийн анхны click дээр audio системийг "тайлна" — autoplay block-ийг засна

// ══ SUBSCRIPTION WARNING ══
async function checkSubExpiry(){
  if(!currentUser) return;
  try{
    const snap=await getDoc(doc(fsdb,'users',currentUser.uid));
    if(!snap.exists()) return;
    const u=snap.data();
    if(!u.subscriptionActive||!u.subscriptionExpiry) return;
    const now=Date.now();
    const expiry=u.subscriptionExpiry;
    const daysLeft=Math.ceil((expiry-now)/(1000*60*60*24));
    const banner=document.getElementById('subWarnBanner');
    const text=document.getElementById('subWarnText');
    if(!banner||!text) return;
    if(daysLeft<=0){
      // Дууссан
      text.textContent='⚠ Таны subscription дууссан байна. Тоглоомыг үргэлжлүүлэн тоглохын тулд сунгана уу.';
      banner.className='sub-warn-banner warn-expired show';
    } else if(daysLeft<=3){
      // 3 хоног дотор дуусна
      text.textContent='⏰ Таны subscription '+daysLeft+' хоногийн дараа дуусна. Цаг алдалгүй сунгаарай!';
      banner.className='sub-warn-banner warn-3day show';
    }
  }catch(e){console.error(e);}
}


// ══ SUBSCRIPTION ACCESS CHECK ══
async function hasActiveSubscription(){
  if(!currentUser) return false;
  if(isAdmin) return true;
  try{
    const snap=await getDoc(doc(fsdb,'users',currentUser.uid));
    if(!snap.exists()) return false;
    const u=snap.data();
    const now=Date.now();
    const active=!!(u.subscriptionActive && u.subscriptionExpiry && u.subscriptionExpiry > now);
    console.log('[SUB CHECK] active:',u.subscriptionActive,'expiry:',u.subscriptionExpiry,'now:',now,'result:',active);
    return active;
  }catch(e){
    console.error('[SUB CHECK ERROR]',e.code, e.message);
    return false;
  }
}

let _subReqMonths=3, _subReqAmount=31500;
function showSubRequired(){
  _subReqMonths=3;_subReqAmount=31500;
  document.getElementById('subReqMainBtn').textContent='⭐ PREMIUM АВАХ — ₮31,500';
  // best class reset
  document.querySelectorAll('.sub-req-price').forEach((el,i)=>el.classList.toggle('best',i===1));
  document.getElementById('subReqOverlay').classList.add('show');
}
function hideSubReq(){
  document.getElementById('subReqOverlay').classList.remove('show');
}
function subReqSelect(months,amount,el){
  _subReqMonths=months;_subReqAmount=amount;
  document.querySelectorAll('.sub-req-price').forEach(e=>e.classList.remove('best'));
  el.classList.add('best');
  const labels={1:'₮12,600',3:'₮31,500',6:'₮63,000'};
  document.getElementById('subReqMainBtn').textContent='⭐ PREMIUM АВАХ — '+labels[months];
}
function subReqPay(){
  hideSubReq();
  // QPay-д сонгосон төлбөрийг дамжуулах
  qpaySelectedMonths=_subReqMonths;
  qpaySelectedAmount=_subReqAmount;
  openQPay();
  // QPay modal-д сонголтыг тохируулах
  setTimeout(()=>{
    const plans=document.querySelectorAll('.sub-plan');
    plans.forEach(p=>p.classList.remove('selected'));
    const idx={1:0,3:1,6:2}[_subReqMonths]??1;
    if(plans[idx]){
      plans[idx].classList.add('selected');
      const btn=document.getElementById('subPayBtn');
      const labels={1:'1 сарын эрх — ₮12,600 төлөх',3:'3 сарын эрх — ₮31,500 төлөх',6:'6 сарын эрх — ₮63,000 төлөх'};
      if(btn){btn.disabled=false;btn.textContent=labels[_subReqMonths];}
    }
  },300);
}


// ══ SALE COUNTDOWN ══
function updateSaleCountdown(){
  const end=new Date('2026-09-01T00:00:00+08:00').getTime();
  const now=Date.now();
  const diff=end-now;
  if(diff<=0){
    const el=document.getElementById('subSaleCountdown');
    if(el) el.textContent='';
    return;
  }
  const d=Math.floor(diff/(1000*60*60*24));
  const h=Math.floor((diff%(1000*60*60*24))/(1000*60*60));
  const m=Math.floor((diff%(1000*60*60))/(1000*60));
  const s=Math.floor((diff%60000)/1000);
  const el=document.getElementById('subSaleCountdown');
  if(el) el.textContent=d+'өдөр '+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')+' үлдсэн';
}
setInterval(updateSaleCountdown,1000);
updateSaleCountdown();


// ══ DELETE ALL SCORES ══
async function delAllScores(collection_name, reloadFn){
  if(!isAdmin) return;
  if(!confirm('⚠️ '+collection_name+' бүх оноог устгах уу? Энэ үйлдлийг буцаах боломжгүй!')) return;
  try{
    const snap=await getDocs(collection(fsdb,collection_name));
    const batch=[];
    snap.forEach(d=>batch.push(deleteDoc(doc(fsdb,collection_name,d.id))));
    await Promise.all(batch);
    notify('✅ Бүх оноо устгагдлаа');
    if(reloadFn) reloadFn();
  }catch(e){notify('Алдаа: '+e.message);}
}


// ══ SUBSCRIPTION INFO ══
async function showSubInfo(){
  if(!currentUser){openLogin();return;}
  try{
    const snap=await getDoc(doc(fsdb,'users',currentUser.uid));
    const u=snap.exists()?snap.data():{};
    const now=Date.now();
    const active=!!(u.subscriptionActive&&u.subscriptionExpiry&&u.subscriptionExpiry>now);
    const expiry=u.subscriptionExpiry||0;
    const daysLeft=active?Math.ceil((expiry-now)/(1000*60*60*24)):0;
    const totalDays=(u.subscriptionPlan||'').includes('6')?180:(u.subscriptionPlan||'').includes('3')?90:30;
    const startMs=expiry-(totalDays*24*60*60*1000);
    const fmt=ts=>new Date(ts).toLocaleDateString('mn-MN',{year:'numeric',month:'2-digit',day:'2-digit'});
    
    document.getElementById('subInfoIcon').textContent=active?'⭐':'😔';
    const statusEl=document.getElementById('subInfoStatus');
    statusEl.textContent=active?'ИДЭВХТЭЙ':'ИДЭВХГҮЙ';
    statusEl.className='sub-info-status '+(active?'active':'inactive');
    document.getElementById('subInfoDays').textContent=active?daysLeft:'0';
    document.getElementById('subInfoBar').style.width=active?Math.round((daysLeft/totalDays)*100)+'%':'0%';
    document.getElementById('subInfoStart').textContent=active?fmt(startMs):'—';
    document.getElementById('subInfoEnd').textContent=active?fmt(expiry):'—';
    document.getElementById('subInfoPlan').textContent=u.subscriptionPlan||'—';
    
    document.getElementById('subInfoOverlay').classList.add('show');
  }catch(e){console.error(e);}
}
function closeSubInfo(){
  document.getElementById('subInfoOverlay').classList.remove('show');
}

// ══════════════════════════════════════════════════════════════
// MY ACCOUNT (Миний бүртгэл) — профайл, зураг, "Миний эрх",
// "Шалгалтын бэлтгэл" статистик (qr_answer_log дээр суурилна).
// Зөвхөн currentUser өөрийнхөө профайлыг харна; админ хэнийг ч
// харж чадна (accViewUid параметрээр).
// ══════════════════════════════════════════════════════════════
let accViewUid=null;
async function showMyAccount(targetUid){
  if(!currentUser){openLogin();return;}
  accViewUid = (targetUid && isAdmin) ? targetUid : currentUser.uid;
  const viewingOther = accViewUid!==currentUser.uid;
  setAllInactive();
  document.getElementById('myAccountScreen').classList.add('active');
  document.getElementById('navMyPlan').classList.add('active');
  const banner=document.getElementById('accAdminBanner');
  const backBtn=document.getElementById('accBackBtn');
  if(viewingOther){
    banner.style.display='block';
    banner.textContent='👁 Та АДМИН горимоор өөр хэрэглэгчийн профайлыг харж байна (зөвхөн харах, засах боломжгүй)';
    backBtn.setAttribute('onclick','showAdminDash()');
  }else{
    banner.style.display='none';
    backBtn.setAttribute('onclick','showLanding()');
  }
  await accLoadProfile();
  await accLoadSubscription();
  await accLoadStats();
}
async function accLoadProfile(){
  try{
    const snap=await getDoc(doc(fsdb,'users',accViewUid));
    const u=snap.exists()?snap.data():{};
    document.getElementById('accNameInp').value=u.name||(accViewUid===currentUser.uid?(currentUser.displayName||''):'');
    document.getElementById('accEmailTxt').textContent=u.email||(accViewUid===currentUser.uid?currentUser.email:'—');
    const img=document.getElementById('accAvatarImg');
    const ph=document.getElementById('accAvatarPlaceholder');
    if(u.photoURL){ img.src=u.photoURL; img.style.display='block'; ph.style.display='none'; }
    else{ img.style.display='none'; ph.style.display='flex'; }
    // Зөвхөн өөрийн профайл дээр л засах боломжтой — өөр хэрэглэгчийг админ зөвхөн харна
    const canEdit=accViewUid===currentUser.uid;
    document.getElementById('accNameInp').disabled=!canEdit;
    document.querySelector('.acc-name-save').style.display=canEdit?'inline-block':'none';
    document.querySelector('.acc-avatar-edit').style.display=canEdit?'flex':'none';
    // Хуучин (user_public үүсэхээс өмнөх) хэрэглэгчдийн профайлыг энд орж ирэхэд нь автоматаар нийтэд нээлттэй хувилбартай синхрончилно
    if(canEdit && (u.name||u.photoURL)){
      setDoc(doc(fsdb,'user_public',currentUser.uid),{name:u.name||'',photoURL:u.photoURL||null},{merge:true}).catch(()=>{});
    }
  }catch(e){ console.error('[ACC] load profile err',e); }
}
async function accSaveName(){
  if(accViewUid!==currentUser.uid) return;
  const name=document.getElementById('accNameInp').value.trim();
  if(!name){ notify('Нэрээ оруулна уу'); return; }
  try{
    await setDoc(doc(fsdb,'users',currentUser.uid),{name},{merge:true});
    await setDoc(doc(fsdb,'user_public',currentUser.uid),{name},{merge:true});
    qrMyDisplayName=null;
    notify('Нэр хадгалагдлаа ✓',1800);
  }catch(e){ console.error(e); notify('Хадгалахад алдаа гарлаа'); }
}
// Зургийг HD боловч хурдан ачаалагдахаар canvas дээр 512x512 хүртэл resize хийж, өндөр чанараар (0.9) JPEG болгоно
function accResizeImageForAvatar(file){
  return new Promise((resolve, reject)=>{
    const img=new Image();
    const objUrl=URL.createObjectURL(file);
    img.onload=()=>{
      URL.revokeObjectURL(objUrl);
      const MAX=512;
      let {width:w, height:h}=img;
      // төвөөс нь квадрат тайрч авна (avatar-д зохимжтой)
      const side=Math.min(w,h);
      const sx=(w-side)/2, sy=(h-side)/2;
      const outSize=Math.min(MAX, side);
      const canvas=document.createElement('canvas');
      canvas.width=outSize; canvas.height=outSize;
      const ctx=canvas.getContext('2d');
      ctx.imageSmoothingQuality='high';
      ctx.drawImage(img, sx, sy, side, side, 0, 0, outSize, outSize);
      canvas.toBlob(blob=>{
        if(blob) resolve(blob); else reject(new Error('canvas toBlob failed'));
      }, 'image/jpeg', 0.92);
    };
    img.onerror=()=>{ URL.revokeObjectURL(objUrl); reject(new Error('image load failed')); };
    img.src=objUrl;
  });
}
async function accUploadAvatar(input){
  if(accViewUid!==currentUser.uid) return;
  const file=input.files&&input.files[0];
  if(!file) return;
  if(!file.type.startsWith('image/')){ notify('Зөвхөн зураг файл оруулна уу'); return; }
  if(file.size>5*1024*1024){ notify('Зургийн хэмжээ 5MB-ээс бага байх ёстой'); return; }
  notify('Зураг боловсруулж байна…',2500);
  try{
    const resizedBlob=await accResizeImageForAvatar(file);
    const path='avatars/'+currentUser.uid+'/'+Date.now()+'.jpg';
    const sRef=storageRef(fstorage, path);
    await uploadBytes(sRef, resizedBlob, {contentType:'image/jpeg'});
    const url=await getDownloadURL(sRef);
    await setDoc(doc(fsdb,'users',currentUser.uid),{photoURL:url},{merge:true});
    await setDoc(doc(fsdb,'user_public',currentUser.uid),{photoURL:url},{merge:true});
    qrMyPhotoURL=null;
    document.getElementById('accAvatarImg').src=url;
    document.getElementById('accAvatarImg').style.display='block';
    document.getElementById('accAvatarPlaceholder').style.display='none';
    notify('Зураг амжилттай солигдлоо ✓',1800);
  }catch(e){
    console.error('[ACC] avatar upload err',e);
    notify('Зураг оруулахад алдаа гарлаа');
  }
  input.value='';
}
async function accLoadSubscription(){
  const card=document.getElementById('accPlanCard');
  try{
    const snap=await getDoc(doc(fsdb,'users',accViewUid));
    const u=snap.exists()?snap.data():{};
    const now=Date.now();
    const active=!!(u.subscriptionActive&&u.subscriptionExpiry&&u.subscriptionExpiry>now);
    const daysLeft=active?Math.ceil((u.subscriptionExpiry-now)/(1000*60*60*24)):0;
    const fmt=ts=>new Date(ts).toLocaleDateString('mn-MN',{year:'numeric',month:'2-digit',day:'2-digit'});
    card.className='acc-plan-card '+(active?'acc-plan-active':'acc-plan-inactive');
    card.innerHTML = active
      ? `<div class="acc-plan-icon">⭐</div><div><div class="acc-plan-status">ИДЭВХТЭЙ · ${u.subscriptionPlan||''}</div><div class="acc-plan-detail">${daysLeft} өдөр үлдсэн · ${fmt(u.subscriptionExpiry)} хүртэл</div></div>${accViewUid===currentUser.uid?'<button class="acc-plan-btn" onclick="openQPay()">Сунгах</button>':''}`
      : `<div class="acc-plan-icon">😔</div><div><div class="acc-plan-status">ИДЭВХГҮЙ</div><div class="acc-plan-detail">Эрх идэвхжээгүй байна</div></div>${accViewUid===currentUser.uid?'<button class="acc-plan-btn" onclick="openQPay()">Эрх авах</button>':''}`;
  }catch(e){ console.error(e); card.textContent='Ачаалахад алдаа гарлаа'; }
}

// ── QuizRush хариултын лог (тест бүрийн явцыг хадгална) ──
// qid = "<эх quiz id>_<асуултын индекс>" — random-test дундуур ч тогтвортой identity
async function qrLogAnswer(o){
  if(!currentUser) return;
  try{
    const logId=currentUser.uid+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,6);
    await setDoc(doc(fsdb,'qr_answer_log',logId),{
      uid:currentUser.uid, qid:o.qid, quizId:o.quizId||null, quizName:o.quizName||'',
      folderId:o.folderId||null, qText:(o.qText||'').slice(0,300), correct:!!o.correct, ts:Date.now()
    });
  }catch(e){ console.error('[QR] log answer err',e); }
  if(o.folderId) qrBumpFolderStats(o.folderId, !!o.correct);
}
// Лидербордод зориулж хэрэглэгч бүрийн фолдер тус бүрийн нэгтгэсэн тоог өсгөнө (raw лог биш,
// зөвхөн тоолуур тул хурдан бөгөөд бусад хэрэглэгч ч уншиж чадна — quiz-ийн агуулга задрахгүй).
let qrMyDisplayName=null, qrMyPhotoURL=null;
async function qrRefreshMyProfileCache(){
  if(!currentUser) return;
  try{
    const snap=await getDoc(doc(fsdb,'users',currentUser.uid));
    const u=snap.exists()?snap.data():{};
    qrMyDisplayName=u.name||(currentUser.email?currentUser.email.split('@')[0]:'Тоглогч');
    qrMyPhotoURL=u.photoURL||null;
  }catch(e){ console.error(e); }
}
async function qrBumpFolderStats(folderId, correct){
  if(!currentUser) return;
  try{
    if(qrMyDisplayName===null) await qrRefreshMyProfileCache();
    const id=currentUser.uid+'_'+folderId;
    await setDoc(doc(fsdb,'qr_folder_stats',id),{
      uid:currentUser.uid, folderId, name:qrMyDisplayName||'Тоглогч', photoURL:qrMyPhotoURL||null,
      totalAttempts:increment(1), correctCount:increment(correct?1:0), updatedAt:Date.now()
    },{merge:true});
  }catch(e){ console.error('[QR] bump folder stats err',e); }
}
async function accFetchMyLogs(uid){
  try{
    const snap=await getDocs(query(collection(fsdb,'qr_answer_log'), where('uid','==',uid), limit(5000)));
    const logs=[]; snap.forEach(d=>logs.push(d.data()));
    logs.sort((a,b)=>b.ts-a.ts);
    return logs;
  }catch(e){ console.error('[ACC] fetch logs err',e); return []; }
}
async function accLoadStats(){
  const statusEl=document.getElementById('accStatsStatus');
  statusEl.textContent='Ачааллаж байна…';
  const logs=await accFetchMyLogs(accViewUid);
  if(!logs.length){
    statusEl.textContent='Одоогоор ямар нэгэн тест ажилласан түүх алга. QuizRush-ийн Random Test эсвэл энгийн тестүүдийг тоглоход энд статистик харагдана.';
    document.getElementById('accStatsGrid').style.display='none';
    document.getElementById('accWrongTitle').style.display='none';
    document.getElementById('accWrongTop').innerHTML='';
    document.getElementById('accFolderTitle').style.display='none';
    document.getElementById('accFolderList').innerHTML='';
    return;
  }
  statusEl.textContent = logs.length>=5000 ? `Сүүлийн ${logs.length}+ бичлэг дээр суурилсан статистик:` : '';
  if(logs.length<5000) statusEl.style.display='none'; else statusEl.style.display='block';

  const todayStart=new Date(); todayStart.setHours(0,0,0,0);
  const weekAgo=Date.now()-7*24*60*60*1000;
  let today=0, week=0, correctTotal=0;
  const wrongCounts={};
  const folderStats={};
  logs.forEach(l=>{
    if(l.ts>=todayStart.getTime()) today++;
    if(l.ts>=weekAgo) week++;
    if(l.correct) correctTotal++;
    else{
      if(!wrongCounts[l.qid]) wrongCounts[l.qid]={count:0, qText:l.qText};
      wrongCounts[l.qid].count++;
      if(l.qText) wrongCounts[l.qid].qText=l.qText;
    }
    const fid=l.folderId||'__none__';
    if(!folderStats[fid]) folderStats[fid]={attempts:0, qids:new Map()};
    folderStats[fid].attempts++;
    folderStats[fid].qids.set(l.qid,(folderStats[fid].qids.get(l.qid)||0)+1);
  });
  const total=logs.length;
  const accuracy=total>0?Math.round(correctTotal/total*100):0;

  document.getElementById('accStatsGrid').style.display='grid';
  document.getElementById('accStatToday').textContent=today;
  document.getElementById('accStatWeek').textContent=week;
  document.getElementById('accStatTotal').textContent=total;
  document.getElementById('accStatAccuracy').textContent=accuracy+'%';

  const topWrong=Object.entries(wrongCounts).map(([qid,v])=>({qid,...v})).sort((a,b)=>b.count-a.count).slice(0,10);
  const wrongTitle=document.getElementById('accWrongTitle');
  const wrongWrap=document.getElementById('accWrongTop');
  if(topWrong.length){
    wrongTitle.style.display='block';
    wrongWrap.innerHTML=topWrong.map((w,i)=>`<div class="acc-wrong-row"><span class="acc-wrong-rank">${i+1}</span><span class="acc-wrong-qtext">${escH(w.qText||'(текст алга)')}</span><span class="acc-wrong-count">${w.count} удаа алдсан</span></div>`).join('');
  }else{
    wrongTitle.style.display='none'; wrongWrap.innerHTML='';
  }

  // Фолдер бүрийн бүрэн нөөцийн хэмжээг тооцохын тулд сан/фолдерын мэдээллийг ачаална
  if(!qrQuizzes.length || !qrFolders.length){ await Promise.all([qrLoadQuizzes(), qrLoadFolders()]); }
  const folderEntries=Object.entries(folderStats).filter(([fid])=>fid!=='__none__');
  const folderTitle=document.getElementById('accFolderTitle');
  const folderWrap=document.getElementById('accFolderList');
  if(folderEntries.length){
    folderTitle.style.display='block';
    folderEntries.sort((a,b)=>b[1].attempts-a[1].attempts);
    folderWrap.innerHTML=folderEntries.map(([fid,fs])=>{
      const poolSize=qrCollectQuestionsForFolder(fid).length;
      const distinctAttempted=fs.qids.size;
      let repeatedCount=0, repeatedAttempts=0, onceCount=0;
      fs.qids.forEach(c=>{ if(c>1){repeatedCount++; repeatedAttempts+=c;} else onceCount++; });
      const remaining=Math.max(0, poolSize-distinctAttempted);
      const path=qrFolderPath(fid)||'Тодорхойгүй фолдер';
      return `<div class="acc-folder-card">
        <div class="acc-folder-path">📁 ${escH(path)}</div>
        <div class="acc-folder-stats">
          <span>Нийт санд: <b>${poolSize}</b></span>
          <span>Ажилласан (өвөрмөц): <b>${distinctAttempted}</b></span>
          <span>Давтагдсан: <b>${repeatedCount}</b> асуулт (${repeatedAttempts} удаа)</span>
          <span>1 удаа ажилласан: <b>${onceCount}</b></span>
          <span class="acc-folder-remaining">Үлдсэн (ажиллаагүй): <b>${remaining}</b></span>
        </div>
      </div>`;
    }).join('');
  }else{
    folderTitle.style.display='none'; folderWrap.innerHTML='';
  }
}


function canManageRound(r){
  if(isAdmin) return true;
  if(!currentUser || !r) return false;
  return r.ownerId === currentUser.uid;
}

function unlockAudioPlayback(){
  // 1. Silent audio тоглуулж browser-ийн autoplay block тайлна
  try{
    const silent=new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA==");
    silent.volume=0;
    const p=silent.play();
    if(p) p.catch(()=>{});
  }catch(e){}
  // 2. AudioContext resume
  try{
    if(!audioCtx) initAudio();
    if(audioCtx && audioCtx.state==='suspended') audioCtx.resume();
  }catch(e){}
  window._audioUnlocked=true;
}
// Хуудасны аливаа дарах үед unlock хийх
document.addEventListener('click', function onFirstClick(){
  unlockAudioPlayback();
  document.removeEventListener('click', onFirstClick);
}, {once:true, capture:true});

// ── NEW ROUND ──
let _nrGame=null;
function openNR(game){_nrGame=game;document.getElementById('nrInp').value='';document.getElementById('nrTitle').textContent=game==='mq'?'+ ШИНЭ MUSIC ТОГЛОЛТ':(game==='mv'?'🎬 ШИНЭ MOVIE ТОГЛОЛТ':'⚛ ШИНЭ QUANTUM ТОГЛОЛТ');document.getElementById('nrOv').classList.add('open');}
function closeNR(){document.getElementById('nrOv').classList.remove('open');}
function createRound(){
  const name=document.getElementById('nrInp').value.trim()||'Шинэ тоглолт';
  if(_nrGame==='mv'){const r=mkMQRound(name);r.type='movie';mqRounds.push(r);mqSaveOne(r).then(()=>{closeNR();mvRenderHome();openPlayerSetup('mq',r.id);}).catch(e=>{notify('Хадгалахад алдаа: '+String(e).slice(0,100));});}
  else if(_nrGame==='mq'){const r=mkMQRound(name);mqRounds.push(r);mqSaveOne(r).then(()=>{closeNR();mqRenderHome();openPlayerSetup('mq',r.id);}).catch(e=>{notify('Хадгалахад алдаа: '+String(e).slice(0,100));});}
  else{const r=mkQQRound(name);qqRounds.push(r);qqSaveOne(r).then(()=>{closeNR();qqRenderHome();openPlayerSetup('qq',r.id);}).catch(e=>{notify('Хадгалахад алдаа: '+String(e).slice(0,100));});}
}
function delRound(e,game,id){
  e.stopPropagation();
  const list=game==='mq'?mqRounds:qqRounds;
  const r=list.find(x=>x.id===id);
  if(!canManageRound(r)){notify('Зөвхөн өөрийн зохиосон тоглолтыг устгах боломжтой');return;}
  if(!confirm('Устгах уу?'))return;
  if(game==='mq'){mqRounds=mqRounds.filter(r=>r.id!==id);deleteDoc(doc(fsdb,'rounds',id)).then(()=>mqRenderHome());}
  else{qqRounds=qqRounds.filter(r=>r.id!==id);deleteDoc(doc(fsdb,'quantum_rounds',id)).then(()=>qqRenderHome());}
}

// ── MQ HOME ──
function mqRenderHome(){
  const g=document.getElementById('mqRoundsGrid'); if(!g)return; g.innerHTML='';
  if(currentUser){const nb=document.createElement('button');nb.className='btn-new-round';nb.textContent='+ Шинэ тоглолт үүсгэх';nb.onclick=async()=>{if(!await hasActiveSubscription()){showSubRequired();return;}openNR('mq');};g.appendChild(nb);}
  mqRounds.filter(r=>r.type!=='movie').forEach(r=>{
    const d=document.createElement('div'); d.className='round-card';
    const lk=!currentUser?`<span style="position:absolute;top:50%;right:14px;transform:translateY(-50%);font-size:16px;opacity:.4">🔐</span>`:'';
    d.innerHTML=`<div class="round-card-name">${escH(r.name)}</div><div class="round-card-meta">${r.categories.length} ангилал${!currentUser?' · Нэвтрэнэ үү':''}</div>${canManageRound(r)?`<button class="round-card-del" onclick="delRound(event,'mq','${r.id}')">✕</button>`:''}${lk}`;
    d.addEventListener('click',()=>openPlayerSetup('mq',r.id)); g.appendChild(d);
  });
  const iw=document.getElementById('mqImportWrap'); if(iw)iw.style.display=isAdmin?'block':'none';
}
function mqOnSearch(v){
  const el=document.getElementById('mqSearchRes'); if(!v.trim()){el.innerHTML='';return;}
  const q=v.toLowerCase(),hits=[];
  mqRounds.filter(r=>r.type!=='movie').forEach(r=>{
    if(r.name.toLowerCase().includes(q))hits.push({roundId:r.id,label:r.name,meta:'Тоглолт'});
    r.categories.forEach(cat=>{
      if(cat.label.toLowerCase().includes(q))hits.push({roundId:r.id,label:cat.label,meta:r.name+' — ангилал'});
      (r.questions[cat.id]||[]).forEach((qq,qi)=>{
        if((qq.hint||'').toLowerCase().includes(q)||(qq.answer||'').toLowerCase().includes(q))
          hits.push({roundId:r.id,label:qq.hint,meta:r.name+' · '+cat.label+' · '+PTS[qi]+' оноо',ans:qq.answer});
      });
    });
  });
  if(!hits.length){el.innerHTML='<div class="search-empty">Олдсонгүй</div>';return;}
  window._mqHits=hits.slice(0,8);
  el.innerHTML=window._mqHits.map((h,i)=>`<div class="search-item" onclick="mqSClick(${i})"><div><div class="search-item-name">${escH(h.label)}</div><div class="search-item-meta">${escH(h.meta)}</div></div><span style="color:var(--cyan);opacity:.4">▶</span></div>`).join('');
}
function mqSClick(i){const h=window._mqHits[i];if(!h)return;document.getElementById('mqSearchInput').value='';document.getElementById('mqSearchRes').innerHTML='';openPlayerSetup('mq',h.roundId);}
async function mqImportJSON(input){
  const file=input.files[0];if(!file)return;
  if(!currentUser){notify('Import хийхийн тулд эхлээд нэвтэрнэ үү!');input.value='';return;}
  try{const text=await file.text();const data=JSON.parse(text);if(!Array.isArray(data)){notify('Буруу формат');return;}
  const newOnes=[];
  const okStruct=(r)=>r&&r.id&&r.name&&Array.isArray(r.categories)&&r.categories.length>0&&r.categories.every(c=>c&&c.id)&&r.questions&&typeof r.questions==='object';
  for(const r of data){if(!okStruct(r))continue;if(!mqRounds.find(x=>x.id===r.id)){r.ownerId=currentUser.uid;mqRounds.push(r);newOnes.push(r);}}
  if(newOnes.length>0){
    let failed=0;
    for(const r of newOnes){try{await mqSaveOne(r);}catch(e){console.error('import save err:',e);failed++;mqRounds=mqRounds.filter(x=>x.id!==r.id);}}
    mqRenderHome();
    if(failed>0)notify(`${newOnes.length-failed} тоглолт хадгалагдлаа, ${failed} нь хадгалагдсангүй!\nConsole (F12) дээрх алдааг шалгана уу.`,6000);
    else notify(`${newOnes.length} тоглолт import хийгдэж хадгалагдлаа!`);
  }else notify('Шинэ тоглолт олдсонгүй.');}
  catch(e){notify('Алдаа!');console.error(e);}input.value='';
}

// ── MQ GAME ──
function mqStartRound(id){
  mqCurId=id; mqCurRound=mqRounds.find(r=>r.id===id); if(!mqCurRound)return;
  mqUsedCells.clear();
  document.getElementById('mqRoundName').textContent=mqCurRound.name;
  document.getElementById('mqBoard').style.gridTemplateColumns=`repeat(${mqCurRound.categories.length},1fr)`;
  const ab=document.getElementById('mqAdminBtns');
  if(ab){ab.style.display=canManageRound(mqCurRound)?'flex':'none';}
  mqBuildBoard(); renderPlayers('mq');
  setAllInactive();
  document.getElementById('mqGameScreen').classList.add('active');
  if(mqCurRound&&mqCurRound.type==='movie'){
    document.body.classList.add('movie-mode');
    buildMoviePosterBG();
    const mvbg2=document.getElementById('mvPosterBg'); if(mvbg2)mvbg2.classList.add('visible');
  }
  activeGame='mq';
}
function mqBuildBoard(){
  const bd=document.getElementById('mqBoard'); bd.innerHTML='';
  mqCurRound.categories.forEach(cat=>{
    const h=document.createElement('div'); h.className='cat-header';
    const ic=cat.iconImg?`<span class="cat-icon"><img src="${cat.iconImg}" alt=""></span>`:`<span class="cat-icon">${cat.icon}</span>`;
    h.innerHTML=ic+escH(cat.label); bd.appendChild(h);
  });
  PTS.forEach(pts=>{
    mqCurRound.categories.forEach(cat=>{
      const key=`${cat.id}-${pts}`,qi=PTS.indexOf(pts);
      const q=(mqCurRound.questions[cat.id]||[])[qi]||{};
      const cell=document.createElement('div'); cell.className='cell'+(mqUsedCells.has(key)?' used':''); cell.dataset.key=key;
      cell.innerHTML=`<span class="cell-pts">${pts}</span><button class="note-btn" onclick="openModal('mq','${cat.id}',${pts})">♪</button><div class="ans-tip" id="mtip-${key}">${escH(q.answer||'')}</div>`;
      bd.appendChild(cell);
    });
  });
  // Бүх аудиог board ачаалсны дараа урьдчилж татна (cache-д хадгалагдана)
  mqPreloadAudio();
}
function mqPreloadAudio(){
  if(!mqCurRound)return;
  // Өмнөх preload element-үүдийг цэвэрлэнэ
  document.querySelectorAll('.mq-preload-audio').forEach(el=>el.remove());
  const frag=document.createDocumentFragment();
  mqCurRound.categories.forEach(cat=>{
    PTS.forEach((_,qi)=>{
      const q=(mqCurRound.questions[cat.id]||[])[qi];
      if(q&&q.audioData){
        const a=document.createElement('audio');
        a.className='mq-preload-audio';
        a.preload='auto';
        a.src=q.audioData;
        a.style.display='none';
        frag.appendChild(a);
      }
    });
  });
  document.body.appendChild(frag);
}
function mqResetGame(){mqUsedCells.clear();players.forEach(p=>p.score=0);mqBuildBoard();renderPlayers('mq');}

// ── QQ HOME ──
function qqRenderHome(){
  const g=document.getElementById('qqRoundsGrid'); if(!g)return; g.innerHTML='';
  if(currentUser){const nb=document.createElement('button');nb.className='btn-new-round qq';nb.textContent='+ Шинэ тоглолт үүсгэх';nb.onclick=async()=>{if(!await hasActiveSubscription()){showSubRequired();return;}openNR('qq');};g.appendChild(nb);}
  qqRounds.forEach(r=>{
    const d=document.createElement('div'); d.className='round-card qq';
    const lk=!currentUser?`<span style="position:absolute;top:50%;right:14px;transform:translateY(-50%);font-size:16px;opacity:.4">🔐</span>`:'';
    d.innerHTML=`<div class="round-card-name">${escH(r.name)}</div><div class="round-card-meta">${r.categories.length} ангилал${!currentUser?' · Нэвтрэнэ үү':''}</div>${canManageRound(r)?`<button class="round-card-del" onclick="delRound(event,'qq','${r.id}')">✕</button>`:''}${lk}`;
    d.addEventListener('click',()=>openPlayerSetup('qq',r.id)); g.appendChild(d);
  });
  const iw=document.getElementById('qqImportWrap'); if(iw)iw.style.display=isAdmin?'block':'none';
}
function qqOnSearch(v){
  const el=document.getElementById('qqSearchRes'); if(!v.trim()){el.innerHTML='';return;}
  const q=v.toLowerCase(),hits=[];
  qqRounds.forEach(r=>{
    if(r.name.toLowerCase().includes(q))hits.push({roundId:r.id,label:r.name,meta:'Тоглолт'});
    r.categories.forEach(cat=>{
      if(cat.label.toLowerCase().includes(q))hits.push({roundId:r.id,label:cat.label,meta:r.name+' — ангилал'});
      (r.questions[cat.id]||[]).forEach((qq,qi)=>{
        if((qq.hint||'').toLowerCase().includes(q)||(qq.answer||'').toLowerCase().includes(q))
          hits.push({roundId:r.id,label:qq.hint,meta:r.name+' · '+cat.label+' · '+PTS[qi]+' оноо'});
      });
    });
  });
  if(!hits.length){el.innerHTML='<div class="search-empty">Олдсонгүй</div>';return;}
  window._qqHits=hits.slice(0,8);
  el.innerHTML=window._qqHits.map((h,i)=>`<div class="search-item" onclick="qqSClick(${i})"><div><div class="search-item-name">${escH(h.label)}</div><div class="search-item-meta">${escH(h.meta)}</div></div><span style="color:var(--q-cyan);opacity:.4">▶</span></div>`).join('');
}
function qqSClick(i){const h=window._qqHits[i];if(!h)return;document.getElementById('qqSearchInput').value='';document.getElementById('qqSearchRes').innerHTML='';openPlayerSetup('qq',h.roundId);}
async function qqImportJSON(input){
  const file=input.files[0];if(!file)return;
  if(!currentUser){notify('Import хийхийн тулд эхлээд нэвтэрнэ үү!');input.value='';return;}
  try{const text=await file.text();const data=JSON.parse(text);if(!Array.isArray(data)){notify('Буруу формат');return;}
  const newOnes=[];
  const okStruct=(r)=>r&&r.id&&r.name&&Array.isArray(r.categories)&&r.categories.length>0&&r.categories.every(c=>c&&c.id)&&r.questions&&typeof r.questions==='object';
  for(const r of data){if(!okStruct(r))continue;if(!qqRounds.find(x=>x.id===r.id)){r.ownerId=currentUser.uid;qqRounds.push(r);newOnes.push(r);}}
  if(newOnes.length>0){
    let failed=0;
    for(const r of newOnes){try{await qqSaveOne(r);}catch(e){console.error('import save err:',e);failed++;qqRounds=qqRounds.filter(x=>x.id!==r.id);}}
    qqRenderHome();
    if(failed>0)notify(`${newOnes.length-failed} тоглолт хадгалагдлаа, ${failed} нь хадгалагдсангүй!\nConsole (F12) дээрх алдааг шалгана уу.`,6000);
    else notify(`${newOnes.length} тоглолт import хийгдэж хадгалагдлаа!`);
  }else notify('Шинэ тоглолт олдсонгүй.');}
  catch(e){notify('Алдаа!');console.error(e);}input.value='';
}

// ── QQ GAME ──
function qqStartRound(id){
  qqCurId=id; qqCurRound=qqRounds.find(r=>r.id===id); if(!qqCurRound)return;
  qqUsedCells.clear();
  document.getElementById('qqRoundName').textContent=qqCurRound.name;
  document.getElementById('qqBoard').style.gridTemplateColumns=`repeat(${qqCurRound.categories.length},1fr)`;
  const eb=document.getElementById('qqAdminEditBtn');
  if(eb){eb.style.display=canManageRound(qqCurRound)?'block':'none';}
  qqBuildBoard(); renderPlayers('qq');
  setAllInactive();
  document.getElementById('qqGameScreen').classList.add('active');
  document.getElementById('bgScientists').classList.add('visible');
  document.getElementById('qqGrid').classList.add('visible');
  document.querySelectorAll('.formula').forEach(f=>f.classList.add('visible'));
  activeGame='qq';
}
function qqBuildBoard(){
  const bd=document.getElementById('qqBoard'); bd.innerHTML='';
  qqCurRound.categories.forEach(cat=>{
    const h=document.createElement('div'); h.className='qq-cat-header';
    const ic=cat.iconImg?`<span class="cat-icon"><img src="${cat.iconImg}" alt=""></span>`:`<span class="cat-icon">${cat.icon}</span>`;
    h.innerHTML=ic+escH(cat.label); bd.appendChild(h);
  });
  PTS.forEach((pts,pi)=>{
    qqCurRound.categories.forEach((cat,ci)=>{
      const key=`${cat.id}-${pts}`,qi=pi;
      const q=(qqCurRound.questions[cat.id]||[])[qi]||{};
      const sym=SCI_SYMBOLS[(pi*qqCurRound.categories.length+ci)%SCI_SYMBOLS.length];
      const cell=document.createElement('div'); cell.className='qq-cell'+(qqUsedCells.has(key)?' used':''); cell.dataset.key=key;
      cell.innerHTML=`<span class="qq-cell-pts">${pts}</span><button class="atom-btn" onclick="openModal('qq','${cat.id}',${pts})">${sym}</button><div class="qq-ans-tip" id="qtip-${key}">${escH(q.answer||'')}</div>`;
      bd.appendChild(cell);
    });
  });
}
function qqResetGame(){qqUsedCells.clear();players.forEach(p=>p.score=0);qqBuildBoard();renderPlayers('qq');}

// ── SHARED PLAYERS ──
function renderPlayers(game){
  const panelId=game==='mq'?'mqPlayersPanel':game==='qq'?'qqPlayersPanel':'movPlayersPanel';
  const panel=document.getElementById(panelId); if(!panel)return;
  panel.innerHTML='<div class="players-panel-title">— Тоглогчид —</div>';
  if(!players.length)return;
  const maxScore=Math.max(...players.map(p=>p.score));
  const sorted=[...players.map((p,i)=>({...p,idx:i}))].sort((a,b)=>b.score-a.score);
  sorted.forEach((p,rank)=>{
    const card=document.createElement('div');
    card.className=`player-card p${p.idx}${p.score===maxScore&&p.score>0?' leader':''}`;
    card.id=`pcard${p.idx}`;
    card.innerHTML=`<div class="player-rank">${rank===0&&p.score>0?'👑':'#'+(rank+1)}</div><div class="player-name">${escH(p.name)}</div><div class="player-score" id="pscore${p.idx}" style="color:${p.score<0?'var(--pink)':'var(--gold)'};text-shadow:${p.score<0?'var(--s-pink)':'var(--s-gold)'}">${p.score}</div>`;
    panel.appendChild(card);
  });
}
function updatePlayerScore(idx,pts){
  players[idx].score+=pts;
  const el=document.getElementById(`pscore${idx}`);
  if(el){el.textContent=players[idx].score;el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump');}
  setTimeout(()=>renderPlayers(activeGame),450);
}

// ── SHARED MODAL ──
function openModal(game,catId,pts){
  stopAudio();
  const round=game==='mq'?mqCurRound:qqCurRound;
  const qi=PTS.indexOf(pts),q=(round.questions[catId]||[])[qi]||{};
  const cat=round.categories.find(c=>c.id===catId);
  const key=`${catId}-${pts}`;
  const curCell={key,catId,pts,q,game};
  window._curCell=curCell;

  document.getElementById('mCat').textContent=`${cat.icon} ${cat.label}`;
  document.getElementById('mPts').textContent=`${pts} ОНОО`;
  document.getElementById('mHint').textContent=q.hint||'';
  document.getElementById('ansReveal').classList.remove('show');
  document.getElementById('ansTxt').textContent=q.answer||'';
  document.getElementById('awardSection').style.display='none';

  // MQ: audio
  const ma=document.getElementById('mediaArea');
  if(game==='mq'){
    if(q.audioData){
      ma.innerHTML=`<div class="audio-box"><div class="viz" id="viz">${Array.from({length:10},()=>'<div class="bar"></div>').join('')}</div><audio id="mAudio" controls preload="auto" playsinline webkit-playsinline></audio><div id="autoplayHint" style="display:none;margin-top:8px;text-align:center;font-size:11px;color:var(--gold);font-family:'Orbitron',monospace;">▶ Тоглуулахын тулд дээрх товчийг дарна уу</div></div>`;
      const ae=document.getElementById('mAudio'); mqCurAudio=ae;
      const bars=document.querySelectorAll('#viz .bar');
      ae.addEventListener('play',()=>bars.forEach(b=>b.classList.add('on')));
      ae.addEventListener('pause',()=>bars.forEach(b=>b.classList.remove('on')));
      ae.addEventListener('ended',()=>bars.forEach(b=>b.classList.remove('on')));
      ae.src=q.audioData;
      ae.load();
      ae.play().catch(()=>{
        // Autoplay блокдсон — тоглуулах товч харуулна
        const hint=document.getElementById('autoplayHint');
        if(hint){
          hint.style.display='block';
          const btn1=document.createElement('button');
          btn1.textContent='🔊 ДУУГАА НЭЭХ';
          btn1.style.cssText='padding:10px 24px;border-radius:10px;border:2px solid var(--cyan);background:rgba(0,245,255,.15);color:var(--cyan);font-family:Orbitron,monospace;font-size:12px;font-weight:700;cursor:pointer;letter-spacing:1px;';
          btn1.onclick=function(){document.getElementById('mAudio').play();hint.style.display='none';};
          hint.innerHTML='';hint.appendChild(btn1);
        }
      });
    } else if(q.scUrl){
      // YouTube эсвэл Soundcloud URL байвал YouTube Player API ашиглана
      const ytMatch=q.scUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if(ytMatch && round.type==='movie'){
        // ── MOVIE QUIZ: видео ил, гэхдээ НЭР ГАРЧИГ ДАЛДЛАГДСАН тоглуулагч ──
        const vid=ytMatch[1];
        const tMatch=q.scUrl.match(/[?&](?:t|start)=(\d+)/);
        const startSec=tMatch?parseInt(tMatch[1]):0;
        const pid='mvpl_'+Date.now();
        ma.innerHTML=`<div class="video-box">
          <div class="mv-shell">
            <div class="mv-crop"><div id="${pid}"></div></div>
            <div class="mv-cover" id="mvCover" onclick="mvPlayToggle()">
              <div class="mv-cover-btn" id="mvCoverBtn">▶</div>
              <div class="mv-cover-txt" id="mvCoverTxt">ТОГЛУУЛАХ</div>
            </div>
          </div>
          <div class="mv-controls">
            <button id="mvPlayBtn" onclick="mvPlayToggle()" aria-label="Тоглуулах/зогсоох">▶</button>
            <div class="mv-prog-track"><div id="mvProg"></div></div>
            <span id="mvTime">0:00</span>
            <button id="mvVolBtn" onclick="mvVolToggle()" aria-label="Дуу">🔊</button>
            <button id="mvFsBtn" onclick="mvFsToggle()" aria-label="Том дэлгэц">⛶</button>
          </div>
          <div class="mv-note">🎬 Видео нээгдэхгүй бол <a href="${escA(q.scUrl)}" target="_blank" rel="noopener" style="color:#ffd700;">YouTube дээр үзэх</a></div>
        </div>`;
        const _initMvPlayer=function(){
          window._ytPlayer=null; window._mvMuted=false; window._mvReady=false; window._mvWantPlay=false;
          if(window._mvProgTimer){clearInterval(window._mvProgTimer);window._mvProgTimer=null;}
          window._ytPlayer=new YT.Player(pid,{
            videoId:vid,
            playerVars:{autoplay:0,controls:0,rel:0,disablekb:1,iv_load_policy:3,fs:0,playsinline:1,start:startSec||0,cc_load_policy:0},
            events:{
              onReady:function(){
                window._mvReady=true;
                if(window._mvWantPlay){window._mvWantPlay=false;try{window._ytPlayer.playVideo();}catch(e){}}
              },
              onStateChange:function(ev){
                const cover=document.getElementById('mvCover');
                const btn=document.getElementById('mvPlayBtn');
                if(ev.data===YT.PlayerState.PLAYING){
                  if(cover)cover.classList.add('hidden');
                  if(btn)btn.textContent='⏸';
                  if(!window._mvProgTimer){
                    window._mvProgTimer=setInterval(function(){
                      try{
                        const p=window._ytPlayer;if(!p||!p.getDuration)return;
                        const d=p.getDuration()||1,c=p.getCurrentTime()||0;
                        const pr=document.getElementById('mvProg');if(pr)pr.style.width=(c/d*100)+'%';
                        const tm=document.getElementById('mvTime');if(tm)tm.textContent=Math.floor(c/60)+':'+String(Math.floor(c%60)).padStart(2,'0');
                      }catch(e){}
                    },500);
                  }
                }else{
                  // Зогссон/дууссан үед халхлагч буцаж гарна — нэр, холбоотой видео харагдахгүй
                  if(cover)cover.classList.remove('hidden');
                  if(btn)btn.textContent='▶';
                  if(ev.data===YT.PlayerState.ENDED||ev.data===YT.PlayerState.PAUSED){
                    if(window._mvProgTimer){clearInterval(window._mvProgTimer);window._mvProgTimer=null;}
                  }
                }
              },
              onError:function(){
                const shell=document.querySelector('.mv-shell');
                if(shell)shell.innerHTML='<div class="mv-err">⚠ Энэ видео embed-ээр нээгдэхгүй байна.<br>Доорх линкээр YouTube дээр үзнэ үү.</div>';
              }
            }
          });
        };
        if(window.YT&&window.YT.Player){_initMvPlayer();}
        else{var mtag=document.createElement('script');mtag.src='https://www.youtube.com/iframe_api';document.head.appendChild(mtag);window.onYouTubeIframeAPIReady=_initMvPlayer;}
      }
      else if(ytMatch){
        const vid=ytMatch[1];
        const pid='ytpl_'+Date.now();
        // YouTube: ДАЛДЛАГДСАН player — зөвхөн дуу тоглуулна, видео харагдахгүй
        ma.innerHTML=`<div class="audio-box">
          <div class="viz" id="viz">${Array.from({length:10},()=>'<div class="bar"></div>').join('')}</div>
          <div style="display:flex;align-items:center;gap:12px;margin-top:10px;background:rgba(0,0,0,0.4);border-radius:50px;padding:8px 16px;border:1px solid rgba(0,245,255,0.2);">
            <button id="ytPlayBtn" onclick="ytToggle()" aria-label="Тоглуулах/зогсоох" style="width:36px;height:36px;border-radius:50%;border:2px solid var(--cyan);background:rgba(0,245,255,0.1);color:var(--cyan);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;">⏸</button>
            <div style="flex:1;height:4px;background:rgba(255,255,255,0.1);border-radius:2px;position:relative;">
              <div id="ytProg" style="height:100%;background:var(--cyan);border-radius:2px;width:0%;transition:width 0.5s linear;"></div>
            </div>
            <span id="ytTime" style="font-family:'Share Tech Mono',monospace;font-size:11px;color:var(--muted);flex-shrink:0;">0:00</span>
            <button id="ytVolBtn" onclick="ytVolToggle()" aria-label="Дууны түвшин" style="width:32px;height:32px;border-radius:50%;border:1px solid rgba(0,245,255,0.3);background:transparent;color:var(--cyan);font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;">🔊</button>
            <input id="ytVolSlider" type="range" min="0" max="100" value="100" oninput="ytSetVol(this.value)" style="width:70px;accent-color:var(--cyan);cursor:pointer;">
          </div>
          <div id="autoplayHint" style="display:none;margin-top:8px;text-align:center;font-size:11px;color:var(--gold);font-family:'Orbitron',monospace;">▶ Тоглуулахын тулд товчийг дарна уу</div>
          <div style="position:fixed;opacity:0;pointer-events:none;width:1px;height:1px;overflow:hidden;top:-9999px;left:-9999px;"><div id="${pid}"></div></div>
        </div>`;
        window._ytPlayer=null; window._ytVid=vid; window._ytPid=pid; window._ytPlaying=true;
        const isIOS=/iPhone|iPad|iPod/i.test(navigator.userAgent);
        function _initYTPlayer(){
          // iOS дээр muted=1-ээр эхлүүлж тоглуулах товч харуулна
          window._ytPlayer=new YT.Player(pid,{
            videoId:vid,
            playerVars:{autoplay:1,mute:isIOS?1:0,controls:0,disablekb:1,fs:0,iv_load_policy:3,modestbranding:1,rel:0,showinfo:0,playsinline:1},
            events:{
              onReady:function(e){
                e.target.playVideo();
                if(isIOS){
                  // iOS: muted тоглуулж, unmute товч харуулна
                  var hint=document.getElementById('autoplayHint');
                  if(hint){
                    hint.style.display='block';
                  var btn2=document.createElement('button');
                  btn2.textContent='🔊 ДУУГАА НЭЭХ';
                  btn2.style.cssText='padding:10px 24px;border-radius:10px;border:2px solid var(--cyan);background:rgba(0,245,255,.15);color:var(--cyan);font-family:Orbitron,monospace;font-size:12px;font-weight:700;cursor:pointer;letter-spacing:1px;';
                  btn2.onclick=function(){if(window._ytPlayer){window._ytPlayer.unMute();window._ytPlayer.setVolume(100);}hint.style.display='none';};
                  hint.innerHTML='';hint.appendChild(btn2);
                  }
                } else {
                  e.target.setVolume(100);
                  ytStartTrack();
                  document.querySelectorAll('#viz .bar').forEach(function(b){b.classList.add('on');});
                }
              },
              onStateChange:function(e){
                if(e.data===1){
                  if(!isIOS) ytStartTrack();
                  document.querySelectorAll('#viz .bar').forEach(function(b){b.classList.add('on');});
                  var btn=document.getElementById('ytPlayBtn');if(btn)btn.textContent='⏸';
                  window._ytPlaying=true;
                }
                if(e.data===0||e.data===2){
                  document.querySelectorAll('#viz .bar').forEach(function(b){b.classList.remove('on');});
                  var btn=document.getElementById('ytPlayBtn');if(btn)btn.textContent='▶';
                  if(e.data===0) window._ytPlaying=false;
                }
              },
              onError:function(){
                var h=document.getElementById('autoplayHint');
                if(h){h.style.display='block';h.textContent='⚠ Дуу тоглуулахад алдаа гарлаа';}
              }
            }
          });
        }
        if(window.YT&&window.YT.Player){_initYTPlayer();}
        else{var tag=document.createElement('script');tag.src='https://www.youtube.com/iframe_api';document.head.appendChild(tag);window.onYouTubeIframeAPIReady=_initYTPlayer;}
      } else {
        // Soundcloud URL бол iframe далдлаж тоглуулна
        const scEmbedUrl='https://w.soundcloud.com/player/?url='+encodeURIComponent(q.scUrl)+'&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false&color=%2300f5ff';
        ma.innerHTML=`<div class="audio-box"><div class="viz" id="viz">${Array.from({length:10},()=>'<div class="bar on"></div>').join('')}</div><div style="position:relative;overflow:hidden;border-radius:8px;margin-top:8px;height:80px;background:#000;"><iframe id="scFrame" width="100%" height="80" scrolling="no" frameborder="no" allow="autoplay" src="${scEmbedUrl}" style="border-radius:8px;position:relative;z-index:1;"></iframe><div style="position:absolute;top:0;left:48px;right:0;height:80px;background:#000;z-index:2;pointer-events:none;"></div><div style="position:absolute;bottom:0;left:0;right:0;height:18px;background:#000;z-index:2;pointer-events:none;"></div></div></div>`;
      }
    } else {
      ma.innerHTML=`<div class="no-audio"><div style="font-size:30px;margin-bottom:6px;opacity:.3">🎵</div>Дуу оруулаагүй байна</div>`;
    }
  } else { ma.innerHTML=''; }

  // QQ: image — асуулттай хажуу тийш харуулна
  const contentRow=document.getElementById('qqContentRow');
  const imgWrap=document.getElementById('qImageWrap');
  const imgEl=document.getElementById('qImage');

  if(game==='qq' && q.imageData){
    imgEl.src=q.imageData;
    imgWrap.classList.add('show');
    contentRow.classList.add('has-image');
  } else {
    imgWrap.classList.remove('show');
    imgEl.src='';
    contentRow.classList.remove('has-image');
  }

  document.getElementById('mOverlay').classList.add('open');
  // Modal өнгө — тоглоомоос хамааран өөрчилнэ
  const modalEl=document.querySelector('.modal');
  if(game==='qq') { modalEl.classList.add('qq-modal'); }
  else { modalEl.classList.remove('qq-modal'); }
  document.body.style.overflow='hidden';
}
function stopAudio(){
  if(mqCurAudio){mqCurAudio.pause();mqCurAudio.currentTime=0;mqCurAudio=null;}
  const scFrame=document.getElementById('scFrame');
  if(scFrame){scFrame.src='';}
  if(window._mvProgTimer){clearInterval(window._mvProgTimer);window._mvProgTimer=null;}
  if(window._mvProgTimer){clearInterval(window._mvProgTimer);window._mvProgTimer=null;}
  document.querySelectorAll('.video-box.mv-fs').forEach(e=>e.classList.remove('mv-fs'));
  if(document.fullscreenElement){document.exitFullscreen().catch(()=>{});}
  if(window._ytPlayer&&window._ytPlayer.stopVideo){try{window._ytPlayer.stopVideo();}catch(e){}}
  if(window._ytInterval){clearInterval(window._ytInterval);window._ytInterval=null;}
  window._ytPlayer=null;
}
function ytToggle(){
  if(!window._ytPlayer)return;
  const btn=document.getElementById('ytPlayBtn');
  if(window._ytPlaying){window._ytPlayer.pauseVideo();if(btn)btn.textContent='▶';window._ytPlaying=false;document.querySelectorAll('#viz .bar').forEach(b=>b.classList.remove('on'));}
  else{window._ytPlayer.playVideo();if(btn)btn.textContent='⏸';window._ytPlaying=true;document.querySelectorAll('#viz .bar').forEach(b=>b.classList.add('on'));}
}
function ytVolToggle(){
  if(!window._ytPlayer)return;
  const btn=document.getElementById('ytVolBtn');
  const slider=document.getElementById('ytVolSlider');
  if(window._ytPlayer.isMuted()){
    window._ytPlayer.unMute();
    window._ytPlayer.setVolume(slider?parseInt(slider.value):100);
    if(btn)btn.textContent='🔊';
  } else {
    window._ytPlayer.mute();
    if(btn)btn.textContent='🔇';
  }
}
function ytSetVol(val){
  if(!window._ytPlayer)return;
  window._ytPlayer.setVolume(parseInt(val));
  const btn=document.getElementById('ytVolBtn');
  if(btn)btn.textContent=parseInt(val)===0?'🔇':'🔊';
  if(parseInt(val)>0&&window._ytPlayer.isMuted())window._ytPlayer.unMute();
}
function ytStartTrack(){
  if(window._ytInterval)clearInterval(window._ytInterval);
  window._ytInterval=setInterval(()=>{
    if(!window._ytPlayer||!window._ytPlayer.getCurrentTime)return;
    try{
      const cur=window._ytPlayer.getCurrentTime()||0;
      const dur=window._ytPlayer.getDuration()||1;
      const pct=(cur/dur*100).toFixed(1);
      const prog=document.getElementById('ytProg');
      const timeEl=document.getElementById('ytTime');
      if(prog)prog.style.width=pct+'%';
      if(timeEl){const m=Math.floor(cur/60),s=Math.floor(cur%60);timeEl.textContent=m+':'+(s<10?'0':'')+s;}
    }catch(e){}
  },500);
}
function closeModal(){stopAudio();document.getElementById('mOverlay').classList.remove('open');document.body.style.overflow='';setTimeout(()=>{document.getElementById('mediaArea').innerHTML='';},350);}
function mOvClick(e){if(e.target===document.getElementById('mOverlay'))closeModal();}
function revealAns(){
  document.getElementById('ansReveal').classList.add('show');
  const cc=window._curCell; if(!cc)return;
  const tipId=cc.game==='mq'?`mtip-${cc.key}`:`qtip-${cc.key}`;
  const t=document.getElementById(tipId); if(t)t.classList.add('show');
  if(players.length>0){document.getElementById('awardSection').style.display='block';buildAwardBtns();}
}
function buildAwardBtns(){
  const wrap=document.getElementById('awardPlayers'); wrap.innerHTML='';
  const cc=window._curCell;
  players.forEach((p,i)=>{
    const pts=cc?cc.pts:0;
    const row=document.createElement('div'); row.className=`award-row p${i}`;
    row.innerHTML=`<span class="abadge" style="background:${PCOLORS[i]}"></span><span class="award-name">${escH(p.name)}</span><span class="aw-pts-badge">±${pts}</span><button class="aw-minus" onclick="adjustScore(${i},-1)">−${pts}</button><span class="award-cur-score" id="aw-score-${i}">${p.score}</span><button class="aw-plus" onclick="adjustScore(${i},1)">+${pts}</button>`;
    wrap.appendChild(row);
  });
}
function adjustScore(idx,dir){
  const cc=window._curCell; if(!cc)return;
  const pts=cc.pts*dir; players[idx].score+=pts;
  const el=document.getElementById(`aw-score-${idx}`);
  if(el){el.textContent=players[idx].score;el.style.color=dir>0?'var(--green)':'var(--pink)';setTimeout(()=>{if(el)el.style.color='var(--gold)';},600);}
  const se=document.getElementById(`pscore${idx}`);
  if(se){se.textContent=players[idx].score;se.classList.remove('bump');void se.offsetWidth;se.classList.add('bump');}
  if(dir>0)confettiBurst();
  setTimeout(()=>renderPlayers(activeGame),450);
}
function doneQuestion(){
  const cc=window._curCell; if(!cc)return;
  const game=cc.game,key=cc.key;
  if(game==='mq'){
    mqUsedCells.add(key);
    const cell=document.querySelector(`#mqBoard .cell[data-key="${key}"]`);
    if(cell){cell.style.transition='all .1s';cell.style.boxShadow='0 0 40px rgba(0,245,255,.9)';cell.style.borderColor='var(--cyan)';cell.style.transform='scale(1.06)';setTimeout(()=>{cell.style.transition='all .5s ease';cell.style.boxShadow='';cell.style.borderColor='';cell.style.transform='';cell.classList.add('used');},200);}
  } else {
    qqUsedCells.add(key);
    const cell=document.querySelector(`#qqBoard .qq-cell[data-key="${key}"]`);
    if(cell)cell.classList.add('used');
  }
  confettiBurst(); closeModal(); renderPlayers(activeGame);
  checkGameComplete(game);
}
function confettiBurst(){
  const cls=['var(--cyan)','var(--pink)','var(--gold)','var(--green)','var(--purple)'];
  for(let i=0;i<18;i++){
    const el=document.createElement('div'); el.className='cfp';
    el.style.cssText=`left:${Math.random()*100}vw;top:${Math.random()*50+5}vh;background:${cls[Math.floor(Math.random()*cls.length)]};border-radius:${Math.random()>.5?'50%':'2px'};width:${Math.random()*10+5}px;height:${Math.random()*10+5}px;animation-duration:${Math.random()*.8+0.8}s;animation-delay:${Math.random()*.2}s;`;
    document.body.appendChild(el); setTimeout(()=>el.remove(),2000);
  }
}
function confettiBurstBig(){
  const cls=['var(--cyan)','var(--pink)','var(--gold)','var(--green)','var(--purple)'];
  for(let i=0;i<70;i++){
    const el=document.createElement('div'); el.className='cfp';
    el.style.cssText=`left:${Math.random()*100}vw;top:${Math.random()*40-10}vh;background:${cls[Math.floor(Math.random()*cls.length)]};border-radius:${Math.random()>.5?'50%':'2px'};width:${Math.random()*12+6}px;height:${Math.random()*12+6}px;animation-duration:${Math.random()*1.5+1.5}s;animation-delay:${Math.random()*.6}s;`;
    document.body.appendChild(el); setTimeout(()=>el.remove(),3500);
  }
}
function totalCellsFor(game){
  let r=game==='mq'?mqCurRound:qqCurRound;
  if(!r)return 0;
  return (r.categories?.length||0)*PTS.length;
}
function checkGameComplete(game){
  const used=game==='mq'?mqUsedCells:qqUsedCells;
  const total=totalCellsFor(game);
  if(total>0&&used.size>=total){
    setTimeout(()=>showPodium(),700);
  }
}
function showPodium(){
  if(!players.length)return;
  const sorted=[...players.map((p,i)=>({...p,idx:i}))].sort((a,b)=>b.score-a.score);
  const ov=document.createElement('div');
  ov.className='podium-overlay';
  ov.id='podiumOverlay';
  const medal=['🥇','🥈','🥉'];
  const heights=['170px','130px','100px'];
  const order=[1,0,2].filter(i=>sorted[i]); // 2-1-3 дараалал зурахдаа
  let podiumHtml='';
  order.forEach(rank=>{
    const p=sorted[rank]; if(!p)return;
    podiumHtml+=`<div class="podium-col rank-${rank+1}" style="animation-delay:${rank*0.15+0.2}s;">
      <div class="podium-medal">${medal[rank]}</div>
      <div class="podium-name">${escH(p.name)}</div>
      <div class="podium-score">${p.score} ОНОО</div>
      <div class="podium-block" style="height:${heights[rank]};">${rank+1}</div>
    </div>`;
  });
  const restHtml=sorted.slice(3).map((p,i)=>`<div class="podium-rest-row"><span>${i+4}. ${escH(p.name)}</span><span>${p.score} ОНОО</span></div>`).join('');
  ov.innerHTML=`<div class="podium-box">
    <div class="podium-title">🏆 ТОГЛОЛТ ДУУСЛАА 🏆</div>
    <div class="podium-stage">${podiumHtml}</div>
    ${restHtml?`<div class="podium-rest">${restHtml}</div>`:''}
    <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:4px;">
      <button onclick="mqSharePodium()" style="font-family:Orbitron,monospace;font-size:11px;font-weight:700;letter-spacing:1px;padding:12px 24px;border-radius:30px;border:2px solid var(--cyan);background:rgba(0,245,255,.08);color:var(--cyan);cursor:pointer;transition:.2s;">📤 ХУВААЛЦАХ</button>
      <button class="podium-close" onclick="closePodium()">✓ ХААХ</button>
    </div>
  </div>`;
  document.body.appendChild(ov);
  requestAnimationFrame(()=>ov.classList.add('show'));
  confettiBurstBig();
  setTimeout(confettiBurstBig,500);
  setTimeout(confettiBurstBig,1000);
}
function mqSharePodium(){
  const sorted=[...players].sort((a,b)=>b.score-a.score);
  const medal=['🥇','🥈','🥉'];
  let text='🎮 Bolor Games — Music Quiz\n🏆 ТОГЛОЛТ ДУУСЛАА\n\n';
  sorted.slice(0,3).forEach((p,i)=>{
    text+=medal[i]+' '+p.name+' — '+p.score+' оноо\n';
  });
  if(sorted.length>3){
    text+='\n'+(sorted.length-3)+' тоглогч нэмж оролцлоо';
  }
  showShare(text);
}
function closePodium(){
  const ov=document.getElementById('podiumOverlay');
  if(ov){ov.classList.remove('show');setTimeout(()=>ov.remove(),350);}
}

// ── MQ EDITOR ──
async function mqOpenEditor(){if(!canManageRound(mqCurRound)){notify('Зөвхөн өөрийн зохиосон тоглолтыг засах боломжтой');return;}document.getElementById('mqEdRName').value=mqCurRound.name;mqBuildEdUI();document.getElementById('mqEdOverlay').classList.add('open');document.body.style.overflow='hidden';}
function mqCloseEditor(){document.getElementById('mqEdOverlay').classList.remove('open');document.body.style.overflow='';}
function mqBuildEdUI(){
  if(!mqCurRound)return;
  const body=document.getElementById('mqEdBody'); body.innerHTML='';
  mqCurRound.categories.forEach(cat=>{
    const sec=document.createElement('div'); sec.className='ed-cat';
    let qh='';
    PTS.forEach((pts,qi)=>{
      const q=(mqCurRound.questions[cat.id]||[])[qi]||{hint:'',answer:'',audioData:null,audioName:null,scUrl:null};
      const hsc=!!q.scUrl;
      qh+=`<div class="ed-q"><div class="ed-qpts">▸ ${pts} ОНОО</div>
        <div class="ed-field"><div class="ed-lbl">Асуулт / Дохио</div><textarea class="ed-ta" id="mh_${cat.id}_${qi}">${escH(q.hint)}</textarea></div>
        <div class="ed-field"><div class="ed-lbl">Зөв хариулт</div><input class="ed-inp" id="ma_${cat.id}_${qi}" type="text" value="${escA(q.answer)}"></div>
        <div class="ed-field"><div class="ed-lbl" style="color:var(--gold);">🔗 YouTube / Soundcloud URL</div>
          <input class="ed-inp" id="msc_${cat.id}_${qi}" type="text" placeholder="https://youtube.com/watch?v=... эсвэл https://soundcloud.com/..." value="${escA(q.scUrl||'')}" style="border-color:rgba(255,215,0,.3);">
          ${hsc?`<div style="font-size:11px;color:var(--green);margin-top:4px;">✓ URL хадгалагдсан</div>`:''}
        </div>
      </div>`;
    });
    sec.innerHTML=`<div class="ed-cat-head">
      <div style="position:relative;width:50px;height:50px;flex-shrink:0;">
        <div id="mip_${cat.id}" style="width:50px;height:50px;border-radius:9px;border:2px dashed rgba(0,245,255,.3);display:flex;align-items:center;justify-content:center;font-size:22px;background:rgba(0,0,0,.3);overflow:hidden;cursor:pointer;">${cat.iconImg?`<img src="${cat.iconImg}" style="width:100%;height:100%;object-fit:cover;">`:escH(cat.icon)}</div>
        <input type="file" accept="image/*" style="position:absolute;inset:0;opacity:0;cursor:pointer;" onchange="mqHIc(event,'${cat.id}')">
      </div>
      <div style="flex:1;display:flex;flex-direction:column;gap:5px;min-width:0;">
        <input class="ed-inp" id="mci_${cat.id}" type="text" value="${escA(cat.icon)}" placeholder="🎵" style="font-size:17px;text-align:center;padding:4px 8px;">
        <input class="ed-inp" id="mcl_${cat.id}" type="text" value="${escA(cat.label)}" placeholder="Ангиллын нэр..." style="font-family:'Orbitron',monospace;font-size:12px;color:var(--cyan);">
      </div>
    </div><div class="ed-qs">${qh}</div>`;
    body.appendChild(sec);
  });
}
function mqHIc(e,cid){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{mqPIcons[cid]=ev.target.result;const p=document.getElementById(`mip_${cid}`);if(p)p.innerHTML=`<img src="${ev.target.result}" style="width:100%;height:100%;object-fit:cover;">`;};r.readAsDataURL(f);}
function mqSaveEd(){
  const r=mqCurRound;
  const nEl=document.getElementById('mqEdRName');if(nEl&&nEl.value.trim())r.name=nEl.value.trim();
  r.categories.forEach(cat=>{
    const ic=document.getElementById(`mci_${cat.id}`),lb=document.getElementById(`mcl_${cat.id}`);
    if(ic&&ic.value.trim())cat.icon=ic.value.trim();
    if(lb&&lb.value.trim())cat.label=lb.value.trim().toUpperCase();
    if(mqPIcons[cat.id])cat.iconImg=mqPIcons[cat.id];
    if(!r.questions[cat.id])r.questions[cat.id]=[];
    PTS.forEach((pts,qi)=>{
      if(!r.questions[cat.id][qi])r.questions[cat.id][qi]={hint:'',answer:'',audioData:null,audioName:null,scUrl:null};
      const h=document.getElementById(`mh_${cat.id}_${qi}`),a=document.getElementById(`ma_${cat.id}_${qi}`);
      const sc=document.getElementById(`msc_${cat.id}_${qi}`);
      if(h)r.questions[cat.id][qi].hint=h.value;if(a)r.questions[cat.id][qi].answer=a.value;
      if(sc){const scVal=sc.value.trim();r.questions[cat.id][qi].scUrl=scVal||null;}
    });
  });
  mqPIcons={};
  const idx=mqRounds.findIndex(x=>x.id===r.id);if(idx>=0)mqRounds[idx]=r;
  const s=document.getElementById('mqSaveSt');if(s){s.textContent='⏳ Хадгалж байна...';s.classList.add('show');}
  mqSaveOne(r).then(()=>{document.getElementById('mqRoundName').textContent=r.name;mqBuildBoard();if(s){s.textContent='✓ Хадгалагдлаа';setTimeout(()=>{s.classList.remove('show');},2500);}}).catch(e=>{console.error(e);if(s){s.textContent='❌ Алдаа: '+String(e).slice(0,60);setTimeout(()=>s.classList.remove('show'),4000);}});
}

// ── QQ EDITOR ──
async function qqOpenEditor(){if(!canManageRound(qqCurRound)){notify('Зөвхөн өөрийн зохиосон тоглолтыг засах боломжтой');return;}document.getElementById('qqEdRName').value=qqCurRound.name;qqBuildEdBody();document.getElementById('qqEdOverlay').classList.add('open');document.body.style.overflow='hidden';}
function qqCloseEditor(){document.getElementById('qqEdOverlay').classList.remove('open');document.body.style.overflow='';}
function qqBuildEdBody(){
  const body=document.getElementById('qqEdBody'); body.innerHTML='';
  qqCurRound.categories.forEach((cat,ci)=>{
    const sec=document.createElement('div'); sec.className='ed-cat';
    sec.innerHTML=`<div class="ed-cat-head">
      <span style="font-size:22px">${cat.iconImg?`<img src="${cat.iconImg}" style="width:28px;height:28px;object-fit:cover;border-radius:4px;">`:cat.icon}</span>
      <input class="ed-inp" style="flex:1;max-width:200px;" id="qcl${ci}" value="${escA(cat.label)}" placeholder="Ангилалын нэр">
      <input class="ed-inp" style="width:60px;" id="qci${ci}" value="${escA(cat.icon)}" placeholder="⚛">
      <div class="img-area" style="flex:0 0 auto;padding:6px 12px;" title="Зураг"><span style="font-size:11px;color:var(--muted);">🖼 Зураг</span><input type="file" accept="image/*" onchange="qqHCatImg(${ci},this)">${cat.iconImg?`<button class="img-clr" onclick="qqClrCatImg(${ci})">✕</button>`:''}</div>
    </div>`;
    const qs=document.createElement('div'); qs.className='ed-qs';
    (qqCurRound.questions[cat.id]||[]).forEach((q,qi)=>{
      const qd=document.createElement('div'); qd.className='ed-q';
      qd.innerHTML=`<div class="ed-qpts">⚡ ${PTS[qi]} ОНОО</div>
        <div class="ed-field"><div class="ed-lbl">Асуулт</div><textarea class="ed-ta" id="qq_h${ci}_${qi}" rows="2">${escH(q.hint||'')}</textarea></div>
        <div class="ed-field"><div class="ed-lbl">Хариулт</div><input class="ed-inp" id="qq_a${ci}_${qi}" value="${escA(q.answer||'')}"></div>
        <div class="ed-field"><div class="ed-lbl">Зураг (заавал биш)</div>
          <div class="img-area" ondragover="qqDOv(event)" ondragleave="qqDLv(event)" ondrop="qqDDp(${ci},${qi},event)">
            <span style="font-size:11px;color:var(--muted);">🖼 Зураг оруулах / чирж тавих</span>
            <input type="file" accept="image/*" onchange="qqHImg(${ci},${qi},this)">
            ${q.imageData?`<div><img class="img-preview" src="${q.imageData}"><button class="img-clr" onclick="qqClrImg(${ci},${qi})">✕ Арилгах</button></div>`:''}
          </div></div>`;
      qs.appendChild(qd);
    });
    sec.appendChild(qs); body.appendChild(sec);
  });
}
function qqHCatImg(ci,input){const f=input.files[0];if(!f)return;const r=new FileReader();r.onload=e=>{qqCurRound.categories[ci].iconImg=e.target.result;qqBuildEdBody();};r.readAsDataURL(f);}
function qqClrCatImg(ci){qqCurRound.categories[ci].iconImg=null;qqBuildEdBody();}
function qqHImg(ci,qi,input){const f=input.files[0];if(!f)return;const r=new FileReader();r.onload=e=>{const cat=qqCurRound.categories[ci];qqCurRound.questions[cat.id][qi].imageData=e.target.result;qqCurRound.questions[cat.id][qi].imageName=f.name;qqBuildEdBody();};r.readAsDataURL(f);}
function qqClrImg(ci,qi){const cat=qqCurRound.categories[ci];qqCurRound.questions[cat.id][qi].imageData=null;qqCurRound.questions[cat.id][qi].imageName=null;qqBuildEdBody();}
function qqDOv(e){e.preventDefault();e.currentTarget.classList.add('dov');}
function qqDLv(e){e.currentTarget.classList.remove('dov');}
function qqDDp(ci,qi,e){e.preventDefault();e.currentTarget.classList.remove('dov');const f=e.dataTransfer.files[0];if(!f||!f.type.startsWith('image/'))return;const r=new FileReader();r.onload=ev=>{const cat=qqCurRound.categories[ci];qqCurRound.questions[cat.id][qi].imageData=ev.target.result;qqCurRound.questions[cat.id][qi].imageName=f.name;qqBuildEdBody();};r.readAsDataURL(f);}
function qqSaveEd(){
  qqCurRound.name=document.getElementById('qqEdRName').value.trim()||qqCurRound.name;
  qqCurRound.categories.forEach((cat,ci)=>{
    cat.label=(document.getElementById(`qcl${ci}`)||{}).value||cat.label;
    cat.icon=(document.getElementById(`qci${ci}`)||{}).value||cat.icon;
    PTS.forEach((p,qi)=>{
      const hEl=document.getElementById(`qq_h${ci}_${qi}`),aEl=document.getElementById(`qq_a${ci}_${qi}`);
      if(hEl)qqCurRound.questions[cat.id][qi].hint=hEl.value;
      if(aEl)qqCurRound.questions[cat.id][qi].answer=aEl.value;
    });
  });
  document.getElementById('qqRoundName').textContent=qqCurRound.name;
  qqBuildBoard();
  const s=document.getElementById('qqSaveSt');if(s){s.textContent='⏳ Хадгалж байна...';s.classList.add('show');}
  qqSaveOne(qqCurRound).then(()=>{if(s){s.textContent='✓ Хадгалагдлаа';setTimeout(()=>s.classList.remove('show'),2500);}}).catch(e=>{console.error(e);if(s){s.textContent='❌ Алдаа';setTimeout(()=>s.classList.remove('show'),2500);}});
}

// ── SCIENTIST BG — бодит зураг (base64) ──
const SCI_IMGS = {
  newton: "data:image/jpeg;base64,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",
  tesla: "data:image/jpeg;base64,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",
  einstein: "data:image/jpeg;base64,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",
  darwin: "data:image/jpeg;base64,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",
  edison: "data:image/jpeg;base64,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",
  galileo: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAElANwDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD5iHSlpB0p2OKkoSnAUAUtABRRRQAUU5FLsFUZJrQj0yUxbyQB+tVGnKeyE5JGcKsSyM0QlNxukkYh05z25J6HP9KdNbtEDzk+/amXdtNaTCG7heGUqrhXGCVYZB+hBzRKLjuCaIWYsxZiWYnJJOSaltY4ZZgs8/kIQfn2FsHHHA9TxURGKAM1IySeRJWUpCkOFVSqkkEgcnnuetR49aXFGPekA3vTqMUtMGFFGKcOlIkAMVLa28t1MsUADSMCQNwHQZPJ9hUdJjPahjFzu5PekpRS0CDtjApKWigBOaMUtBx2OaAEopaKAKlOAxShDtDEHaTgHHFFMqwUUUCgAFLRRQBseH4UaTfLnH0zgV0lvLZxXMTXKNJaiQGRFO1mTPIHocVy+nTbIyAQCfetC+cJDZoqBXePczCUNvyeOP4T7V6FKajBIxlG71JvFUum3Gs3UuiW8lvp7N+6ikbcyjHc/XNY02m3klvdXKxForVUaVtw+VWOF7/y6VrWj2OnXl7FrdrJNIiFYkikG0SZGNxHVfpWBcTxySTN5ezccoqfdXnpz2rCq0ykiE8gUAYoX7v40tcxYfgKKKKBhQKXiloEFFFLSAKBRS0CCnADaeue1PlgljjieRGVJF3IxGAwzjj8qYOKAADFNPWnUmKABhg0lOxxSYoATtRg04D3ooA91+EHiPwlpfgUaT4p0/7Ukl+biQtGHAVl2qB+C549ak1T9n/+1Ynv/BmvWF7FLmRbYsBsBOdoI54zjn0ryJ7DUX2C3jV92ZF2sMHjt9APrSadq2saNexss1zaSBh86kqV964m5c14s6OXSzQ3xl4P1jwhqK2euWpgmZN6kcqwyRwfqDXPlTXu/hv42E2rWHinTbbWrUufnuR+9we26tObRfhH4yG60nuPDl8/Yn93n9R+gq1iHH40LkvsfOhFJXtOv/ALX4IWuvDl3Za5Z9VaBwGx/KvLtZ8Parosxi1XT7m0Yf8APWMgfn0raNaEtmQ4tGXG5Xp2qUzA89KiK4ppGTyOlbxm0rENXJopEMgVyFVvlLEH5M98Drj0qCRFzhSW5IJ7H0xS7V96Xp0FJybEJ9KWnwSeVJuKI/BG1xkcimUikFFKM0tIBAKWiigVwpRSUooELQBminUDHvJI6IruzKgwoJztHtTKKs39obK7aBpoJioU74JBIhyAeGH1wfegRWopfrS0ANpcUYrqvCXg671545GYW9sxwGY4LeuKTaW40m9jlcUceo/OvorSfhz4X0+L9+n2u7A5GC5B+nSr/wDYGnoSsWgQlB0LqAT/AOOmsnXijVUJPY+WhJIVwXfGc43Hr61qWWuXlvhZWF1CBxFcZZc9jWQvSn1rKEZbohSa2ZqJfW0wxeWnP/PSA7T+R4qzDbRSMP7O1BN3aOb92368H86wxS1m6S6OxXO+up2mleJfEXhiZZLee7tiOjIxAP8AQ16Ro/x3u7iEWvijTrHV7cjDedGFfH1FeHWmo3doMQXDqndD8yn8DxV5dSs7gf6dYLu/56WzbD/3yeKwlQfb7v8AItTi+p7fLp3wo8aLui+0eG79/TmPP4cfpWBrnwF1pIWuvDOoWet2o5HkuA2P8/SvNIreGUg6dqK7v+ec/wC7b9eD+dadh4g8QeHpllimurcjkPGxAP4jrWa54aRl8mU4p7ox9Z8P6rospj1TT7m2YHGZIyB+fSsrbXtmkfGy9miFt4jtLXVrcjDC5Qb8f7w5q3Na/DDxd8ypPoF6/wDEvMefw/qKtYqUf4kSfZJ7M8I20Yr1nWPgtqqxNc+HL+z1i16gxON35f8A6q851bRNR0iUx6lZz27D++nH59K6IV4VPhZDhKO6M1cqcg1Yvrua+u5bm6cPPIcswUDJ6dBxVeitSAopcUYoABS0UUEgOafSBadQAlAyDSnr60uMCgBKSl607FAFrSbY3N/FHgEFhx689K+lfh94Qb7NHd3+9UYApGDgsPU+i+gHWvJvgzoKaprq3Fwu6GI8qRwT/wDq/nX1NagKq4AxjsK5a0rvlOzDwsuZiWem20CgRQRoMcADFK9uFbBAFWTJtQn+QrFubhjMT85/AVi0kjdXZ8JDpTxUa1JXonnCilpKBQAtA96KKAHZ/GrdpqF3aDEE7qvdD8yn8DxVMCnVLipaMadtjT+3204xe2abv+ekB2H8ulPSCBzmwvRu/wCec3yH/Csmis3RXTQtVH1Oktdb1vRZVeKSeFhyHjYj9RXZ6b8XL+dBb69Ba6pAeCLmMFsf7w5ry+3uZoP9XIwH93qPyrX02zm1eC8lSzjaO0i86eVZFjCrnA6kAknoByewrCpQT3X3FxqJ7M9Y0yb4a6hBPc3dhJZyXDLbtCmHVS+cOOnC45781l6p8GppojP4U1e01mIfwo43j/gPX9K8wdZBBFHazIFfLlWYBs9Mfl/M1Pp+papYXUXlSyRSZ+Vw+3H41mqc4fBL7ynZ7o7Dwv4R0zTp9Rbx/bahCkSqlvbwN5ZdjnL7sdBgcep5rjvElha2Wo/8SySaXT5QWgaYDfgHBDY4JB7j1Feg6Z8T9bit1i1qKDVrMcYukEox7OOR+dXbu48CeLbUwssvh+9+/HIrGSDd346jP49Kca9SMr1Fp5FONOULRWpwHh7wZq3iA2q6b9ld7hioR7hUZAOrsDyF4PIz0NYNzby2lw8FwjRyocFHGCPwr0HVPA+u2Nu1xpklvrdqIxGk1nJkxAEddvPTI5FZ1hqOvxwva3sAvLa1wDBqUAmRPZWIyvTsRW0a6eqaZi6VjjM8UdK7C7bQtcmkur6S/wBOvJWJedf9Jhc9iQcMvHoTVGfwlfsrSaVJb6xCOd1i+9wPeI4cflWiqxe+hm4NHPZzTsDHrTkt5mufs6wyG4zt8rad+fTHWh43jYq6MrDqGGCK0uRYbjJpRjPNKRSY4pgfQXwUtI9P8MrfX8kdsJmJjZ+Nw3dfpx+lehr4ptnSeS2kWSG2IEsi9BmvnHQbu4v9FtrdrW/v5ImaJYrVtpC8HJ4PAz0HXNexfDzQP7L8JalLqkDJJeS7YYZiGI2jGeODz/KuCtF8zZ6mHtyJM1Lz4k6BEH8y7SVwPu5KjPp71Qb4k6BIdzFVPphv6VwreB9QsGnvIbSxuD5xIW5HyooGRn8T0HHqaz7nUdTRwt14d0pJgBuEMoVfywf51Ks0W46njC9KkqNaeK9I8mwopaQUtAwpc0lFAWH0UlLQAU5cYPrTaUGgVhalgl8pmOM5GPpUVFJq41oKBknGBnniuo12Kx/sTTtQ0q3MVu8a2s4aYktcKMu2D0yMdOOenNYekQR3Wp2sE7FYpJAHI67e/wCldnrxv/Fus2ltp1mrBIisNnbqMRqvU7RwFwAMn0rKo1dI1prRs4aO4KPmOVo39/lP5irEsV5IiTOCgP3XZdof/gWMGrYsQNWaOW12FGIa368jt9M13/w00K51e4e3R1S3RgsjN9wA9lXGGI9+BWMppbG9Kj7RXZ5/p+ralpUyzQSyxOvSSNiD+Yr0Ow+L+qwaVbwXv2a8aWR1l+0QKzNFgDBOM5yWIPtWX4j07T9U1S5g8MW8Vnb2run2l3O6fBxkj7oH0FchrWlTWcVvJMLaVJAdksUhJOOoI7dc5xg5qFThUeq1CpF01psbH/CM/bmMnhrUILpGyUt5JRHcAdgQcBjj+7nNY91YahpV0BfWtxa3C8jcpRh7g1SimEZ6tGfXGR+n+FdJp3i7VbW2EP2kXloP+WM6iaP8jnH4Yq37SOm5kknsW9N8Z6rBE81z5d+YQBBPdRq8kEmRtZXPOR6E49qr6rrFl4ouRPrdxNZansEfnx2yGF1GcEouCG5OWGc+lbGh6v4TvBcP4h0SQW4AAjtJ2RfMY8OAc4wFPGSK4+fThFETa3MV0ACziHcdqgA5OQPXB9MelTBRvfZhK6Xc3h4EvLjTIbnTL201OeWUqtvak7vLCkmQ7gMAFSCCOMiuSdCjsrAhgcEHtVhL6WN4vJJjWMMqhGI+91yaru7O7MxyzHJ9ya6Yc/2jGXL9k9q+CGmQ3eg3NzK8CubrbmZc7VVQBj0OWPWvRfEeqNFe2+n6UbCQwDh55gqqPWvO/hRpNxeeEbqyjjYQXRLyzc4jUYGcjuSOAOa5KLwPq+sa5cWi3LRmEkGQsQW6459fWuWcOabuelSqRhTj6HvPhbUE1eG4tbtlt76BskQyBsg9GVu4NM1HSYVum36rqOTz+7VAP5VyXhfwbdeG7d2iuJrnUeHMnP3QPuY7j+tVtR8USi5I9uc561jJcuh0RUZu6Z81jpTwaQjDEe9Or1TxAFLQBRigApcc0AGnUBcSlooxQADmlFC9KWgLhS0lKKBFvSJxa6pZzn7scqlvpnmtbUIrzSdSnFrK0e5VDKGxlc7gM4wRkZx0rn6625uUvNMuLwojSrbQfMy7trbyp61hV0szam04tFfwyzT6/axXcbYuPmyx6rywOe4OCD6V7bJqFv4csRNDtGAxVfcnP+FeZeDtN091s7y6kuDNG7GNN/7tT6hce9V/FGpyzyMrOeOCuehHB/z9K5ppTeh3Um6cNTltVmklml8qRlWRmZkU4HJyak13VZtSmhSXyQltGIYzHGEJUAAFsdTgAZ9qpyOC/oagweprppxW5xVp3FGfWm7F3BgMN6qcGnbsDAJpoOK1Ocfvl27WbPOcluv1x7VKJmGV2pgg8n72T1ORj8qhBzS5JpcqK52KAKdEnmyKg4ZjgU0D0rX8K2f2zxDp8ZIAM68YyTg56VRJ7brWs3XhfwXaWumAoqRLHtC4Jc9/1FchpqeM7Sb7RuuImlwQPs7HOAR6jjGfrXrdtp8JU6hdxed5RDxxsBhSBwTx1z+VN/tSG9ZGDjP32KknIU4xj06/1rkb1O6ltZI8/wDDfjLXrG/gtNXjeaGQ7/PZCG9Bg/pXZX2haPq1wbs3L2bv96OKNSCc/e56E8U+00FNSv8AzhFiFNx3leOSDSXEH2SVozk5JYdcjnoRS33By5Ze7ofJbbtxLdTW3oOitqG2WZjHb5xkdW/wHvWUyb5Ix/ewK7mws1NsiRMQpG0rnIIPUflXROdkc0Y3Zet/Dditv5kNpHMvsd7H65FZ+qeFoXSQwRfZZF6AMGDfhmu00R47SCHPECgfKqg5HuDz36im6pe21zIY4ZSDGeBt/nxwPauXnlF3ua2i1ax43dW8trcPDOu2RDg+/uKiro/Fqb2SbGGDFT9O3+feucrshLmVzBqzsFFL0GKAKsQClopaBCUoopaQrh2yOtdjoz6ZDoN0s0cEnm7FfzblkAOdw+70PFccDzXUadbmXwVqJQMT58R4+hrCu7JPzNaXUU6g0SRpZeSIhuKiORmI/E1kyySySZmYnHWrmlxMsaq6nlXPTrhhSPYXFwSyxGNNxw8g2r+Gev4ZqErvQ35nbVmS6kEOc4PQ+vrTM+1aGrQi1jtYdxY7XctjGckdvTiqJyAMjr0roitDlk7sYaMcUrUdKokBTh1pBRQA/qa6r4Z25ufFtooXJU7iQcYFcmDXqHwUgQ6pJPLnCDCn39vpUydkNbnvV06jSmiKgbVwK4rStPBv7iKQkQ5JznkgAEj8Tj8q6TUpfNt/3ZzgHgenH+Fc/pt1u1h04835QwHQnv8AzH5Vzmydjs0kkWwVYkUL94gDoOvNY7Mwd2mEDO7FiWP5AVpC9iiUxAqY0Xt2UdTn8656fUIZ5C7XCx9sEA596e5J8mglVib+6RXV6VqIypOCMfSuTHMB9QafbzmNhkkD1rWUboE7M9GGpAw4YghcDHSq1zexYO3auFyCMj9f6VyEeoEAbXOMcj+tRT37yHAY+lZKmU5FvWbxpiUJBGc5AxWXSZLE5OTS10RVlYzbClFA9aWqEFAoooFYWlpKmtYvOuI4z0ZsH6d6TdgSu9DprIw6XpscN7HGsl1A0ylpmQLkfKx2jk4xhTxzW/4Y8Ta9pmjQLpmhf2tbyBgLhrUyneGOVz2AGOK4vxDdSLarbo+RIeFPzEKOgBPIrvPA+u/2d4Zt7OOGORBIylzIRyTz29e9cc37nNa+p1KFpcph65dz/wDCXzf2mAEjkXzIMyJFFIUUlcR8gZzwtVbO4lvY2uD5rW2dkaPIX2MDyuTz3H1qr4ln+2634gJIWWVxKE5I+UDPNZ+izukckKMcspKZPAbHHFaR0SZDV7or6veedrZj3ZRE8semep/WkYhgBuzgYGaxC7Cbe2dwOefWtr5VKNGQRjPSulo5xpOKaKc53MTjk+lNpAOB4wKUAnAAzmkA5AFOZtsZCZDnj6UJAPSMfxMB616F8LLxLe7kjE2HCgDPAwew/wA9684d+VUevSrNjfyWb+ZCSGHUjv7U5RurDTsz6Av/ABAkilY5FVANhAUk4zyfyzisbTvEdva60Z5mASQFRnorY6+3/wBevLofFMrwo0kjb1OcjH4VQudaOwunzclgScfnWHsmXzI9obXYltLmFrgb2UYaMZOB1/H6etctP4knST920KqRnG7p2rzqPXpBGuFZ24AHXnsKo3GrMZSVz74I6/lTVJi5jPkcqcDrRHIyg9D25GaXAL89KXYPM4IUVqDLdlPIu50trZsA53xBh+VQ+aWkJ8qBfpGK6HwpBaPfMmoQTT27RuNsLqrBsfKQWOMA4z7Vi3cSQyOgIBUk8kdKzUvesU17pEKcMGminDmtTMWikHWloAKWkpRSEFaejRbnkkPYbQfc9f0/nWbWsp+xaaWP3gu7Huen9KzqvSy6mtFXld9DF1ad5r6QoeE+VeemK7XwqAugWSSEZMhbr0y54rhVTdbyMep5/Kux8NADQbLHeUn/AMfrOurQSRtRd5tmDr8nk+INSO7ALsuT+FRafMEZJBnGcimeKf8AkM6h7TGqumyZBQn7vI/Grcb00Re1RoNdgEOouyY2SfOv49f1qxaNm3jPtipdVjMunRyAZaFtpPt/nFUdPlAyh6EZ49a0g+aJlUjaRfBzx1oKMBkqcVG7KU5O33zVc/aogWRhJH6VdiC+zKnAHtmq4bnb6c1GtyrRgtwDx9DSE5lzkdKYCu+ZgKGb5HI9ahU5mNPY/ujQBHF8sBx1JxTJjhCPXg09eY1+tRTd6AK/Oc0hOTmpvKfyfNwNnHeosUAWc9x1oOW+9SOAWNSScOCPQGoLZNaqXR1bfgL0AJ5qAKWlHXaPWtPSNYubCUyQohcKRkqDgY96pSTvcSFzgAnOMdahXuW37ooFOApKXPFaGWotFFFAwpRSUtArk1rH5txGnYnn6d6m12cmOKEdWO4/0p+mJjfJ3+6P6/0rOlf7TqLuOVXhfoKxfvT9DaPuwv3ElGy3ZR024rqvDp26JY56eY3/AKHXK3X+q/Gum0E40axB/vn/ANDNKv8ACPD/ABXOf8T5Or6gT/z2NZdo+ydT2PBrV8S4/tO/IOf3xrEFa09Y2IqP37nZeH723stSgmvrOO+tlbdJbSZ2yY7H1Ht3xXqMHxZtniWHS9IsYwVx5dvCE/AKBmuK8CX3hO10g3Ou2L6hqJc4SR9sUYHT5QcsT78V1Ft8V/7PfytHsLW1j4Cxxxqv6KK5ZLodtPa+h0Nv441WaEvceGpXgA+99jbYfx21h3I8Ia4xjvNMGn3b9Zo28pg34DafxFbFt4v8aauiz2+h3zxdFfyWUZ9s4z+VWIdZ8RT3Qj1jw5dyE4AElmXH5kf1qPeT0NHyyWqPOtU+FGovE11oV5Z6hbMMhC3lvj8flP5ivPJrS4sLua1vYnhnhO1o3GCDX1XeaxdW2nM8+nRxRKvGwHj2x0FeZeKdHtPGNkb2z/c6hENqsVK8f3JAeg9D29xWtPEO9pbHPVwytzQPGlP704qU/wCr/Gn3dncWF9Nb3cTRTRnDKw6f/W96Z/AK7E7nDsN/5ZionBKmpiPkGaYV6enegCJ2dowhxge3Wo9p9Ku3TxSNH5MSptXDFOje/wBajEeRQBGQ2eA35VMkZcL2AHersd4SfmyRT/tKnnaM+4rFyOjk8zY8JWCS6g+SoBhZfmi8zqp7BTz74/KsW8tvKkaMA7kOB9PpWhpWpTWlwGtpZYSASWibB2gc1G4kuCZJIN7NySzMf6Vmm4yu2NwujK2sDgqc/Sl2N/dOPpWosTqOLcD6K1KYpT0hA/4Af8av2qF7JdzL+ox9aK1DDPj/AFGf+2Z/xpptpyf+PVf+/X/16PaxE6VzOoqzdQvCg82EJuPB24/rTLSMSTqD0HJ/Cq5la5m42fKWp3+y6eRyGVf/AB4/5/Ssq0TbFu7tVjWHLvHCp5J3H69qFUKoAIwPeppLS76lVX0IrlSYGx1HNdHohH9jWPHO4/8AoZrCHOASAPUngfX2rf01BHYWqI6OquRuQ5B/eHoamv8ACVQ+IwvEMUhu76Qqdnmn5u3WsKtvXyWvb1c8CViOPesStaXwk1Nzd8Mf2azTLqvmFQAyBWwD65x+Fdxpnj6HQl2aDptrbRoMFwgMh9y3WvL7dxFKpPTofpXRadqENiButkaZM4YgEH3NRUjrc0ozsrHZ3fxK1rUfmHnFgeCozj8Ktab4h8bTy+bb2+pyRt/zzgYCuTPje9ij8qNxCB8p2xCkTxlesw33rMg4CHI/lWfJ2Rt7Vdz1W/1rVotHLajHKZiMMkx3hPrgZFc1aarbFkSa8S1uSN0csEokQgclX74+vNcvc+Kb6eNY5UjMY6Ar0/Gn2esWbMfNgAduGJQEH8Kjk7luonszvdY0ax8V2qi78tbpRiK6tzuz9PUexrm5vg14qOj/ANpabBDqVqS21beT96QO+w4zn0BJrT0PVY4dkdlFIwdvm8o5XPbCmvpjSdun6TaWeRuiiUN7nv8ArmtKHMnboY4nlaT6nwhc281rK8NzFJDMh2vHIpVlPoQeRUPTn0r2L9oe/ivfiI1uNjra2kUT8Zy5Bc59wGAryx7SF8bHaP8ADIrqOMo7mYcjH0pQOKfJBLEfn+Zf7y8imigD1eH4I35A8/XrBeOiRO388VpWvwVs4zm9125cD7whtgv6kmvSvtEo2gOzYByq5P1qYfaQwXMm0DtxXnupJnUrI8O8beAH8MXMWo6a017ooYCUuP3kH+/jqp/vfn61Zhv9CVADfWwwOnlt/hXtaxlP9Y8RRhhlcghgeoI715Z448BSRiS/8KDfGMtJYLyV94vUf7PX09KTSqfEUpuOxlHWPDyD/j7U/wC7A5/pUZ13QxnYLh/922auCu766CRMNsR5VgFJOR65PX27VSa9uyGJuJBjr0FNYePcPbPseit4g0v+C0vWHtBj+tRvr9kfuaZdsffaP6155NLNvYfaZSoAP38dajiXe7CRnPyk8uTVfV4h7aZ2Ov38OqWiQrYtbsj7w7Sp0wQRWIkCQBtrht3frgCsVUBAO0Ennpk1o3kggsii44XYMfr/AFq+XlSiid3zMoRuJ7uWWSREA+7uPX0qxkZ4ZWHqvSpdOURWy5IBb5j8oJqOQlZXK+prWMk3ZGM1bUTArfsiF0+yC4XHpx/Ga58VvWh/0Oy/z/Gaiv8ACXh/iMLWAX1G8Ud5WH61jyRsjYdSDW1qX/IRuT/02b+dNcKwwwBHvWlN6E1dzFrSjbfFG/qNp+opJLKNj8hK/wAqIYJIldW5X7wIqp6omD1K16DuUnvVc+tXbpd0efxqkPQ04O6FNWZatL14cKxLJ6Ht9K2IrmKQfdDH8jXOkYIq0h+bNKUExxm0eg/DueNPE9pNcMy21s3nuM4HB+XPX+Ij8q+gNQ8SyXltM2nIJLk4UFG5VfUV4R4EtY7GyS4mlxc3mSFkwQqD7vHXJyT9MVbttfk0m7u5A7MAr7cHGDg1MVbQcnzanD+ItSn1LX9RvZ5TLLNMzF2/i5wP0ArO+0lT1z9aqpJnknnvTZOTkGtTM1I7jcM0GU5525+lZ8Em09atBg3PNAH1vuBJUOxwPmViQVHqc9vem71UDMisO65LfjVQ3JLL5Mauyt8qqMhvUZzwakvXEWHXKq3Y8FTjpXmHUOZV6xNlcZIIwR9KcgwwcOBj/arM/tCOKJMy52gAsxGSemfr/jUUupx5VowoDgle+MdQR6UAY/j7wRZeJopLqwMdprK/MGXiOc/7Y7E/3h+Oa+fdRguLK5uLW8heG5hbZJG4wUIPSvpdb0khtpIBz1/xFeY/Guxt54LTWYFAuQwt7j/aGDtJ9xgj6Eela0p68rE1oeXyEqXPYBc0JJumJ7BTVclpXJI59qsxWbOjPE+xRwd/U59MV0u3Ui5JpoEkydwg3EY79qTVWDTpEPuqMn6mrVhH9mgcsQSxySPQf5NZvE0skjdznFQtZX7FN2iSm6+YYOO1TBiwBPemLGmAdi/lT0AB7AVoopGLlcceDW5an/Q7Q+mP/QzWFmtm1P8Ao1n9B/6EayrbGlDcx9ROb+5/67N/6FS0zUP+P65P/TVv50/gmtIbCq7hSqcdelJzRVGRWkUjcB1U5FWkCSIrYByM4xUMw5DdjwaLRtoeM9jkfSpjpoaS1VycQxrkiNAcHtWVG21lPpWw33D9DWMOorRGZvW+uybyLlSSeS6cHP0rT1PWY5dEnJdJJT8ivt5JPXPfgZrkv4waru2Qf9o5pcqHckViBgCjOeoxTFYDoad1FUIcppwkI4FRij8aAPqVr+5k3ANCAwB2xKSQR0NF0b67hKxxT8kHPl4H610TbAzCJvlGDjGD+OPf8aco8w4dEBHYk/0ryrPudl12OPXSdQYgNHJ2ADOqg/lU8Wg38S7lMcS98bmNdS8zQjyxFGWYAjavX/IyabJtP+qHJ5w39PX6U+UObscwNIlb/WXb/wDAVA/mahv/AApp2o2xg1Dzp4SwYjzNuSOnTmumKbyAzIWPvzVaUFSQVAbvgcU0ktUJts4fUfhj4fuYSun/AGjT7jHysHMqE+6t2+hFeYeJfD+p+H7oWmowBVk4imj5jl56qfX2PIr6BBG47lGeecn9K5b4m6isHhF7RgjNdSLHGGXlMfMWHocDGfetIzfUmx4hqBWK02KfvfKPp/n+dZkTPGpAiDZ/vVeuonubwRRKzrGpZsDOAOST7e9W7eyVvv8AP4ZrWMuSOoOPMZsUhOAy8+3AFS1p3NiqWzuiEFRmsrOa0jNNGU4NPQdWxb5NrajPRR/6Eaxs1q2zYhtznoo/maiq00VSTTMq/wCby5/66N/M1Iajul330yjq0rD9afmtIbCqi5opM0oI9qoyEdcoR+NV1OyeN+x+U1aBUdWH51WlXIZRz3FQ9Hc0hqrF1h8jZ9DWKK0lnVoCWPzFcdO9ZtaIzJW4Un2qq3XHpxVknMR+lVTyTVAA609TzTKKAJs0lRqcU4NQB9mSq0bK4eTZxkk/db39jz+dOeRdoQNuZhwSMfr61yPhbxQzotnqzgv9yO4f+L/Zk/xrpyDGJCFEe05AK7lI9u9eWmdbVhI5rgXcnmiMW64VHTOQSATuB6fWpJIC7NjhuoJGKRRLGm1lLSYwxTnr3xTMuoCxxsUxyCpAXHoOlMRCBHI65ba33cdf0/ClZkdIVYvgjCtjk/r6VYhQTAFmXyz09c9v8arzQ/vlKSuDGTleVVs0ARSRQhQ6mWSMjhlIArxr4rags3iEW8WRDZR7SN2cu3zN+m0fhXsNzcJZWtxeTKyW8UbSTBhkEKM/geK+atav3upZ7mf/AF1xI0jfickf0qoLmY0d/wDBGxzJqOrzBct/ose4ZBzy/wCfyirnjjwZNmS98Olo06y2aryPUp/8T+XpWt4cvtD8P+GLCwl1OFp1jDzRw5kzI3zMOOM5OPwqO88c2iE/Zra+nx0ZwsY/WnJtyuho8emWQAh5pSRxgsRVUIPm56V1Xi7VLTWZ/tHlW1pcj7xjkLtL/vYGM+/WuXyBu+f8COtaxbtqJ2Ygi4zk8+laVsNsMWTnC/1rO3enNaVsA9vEcHOP60p7DirGXOQdTfnGZT/Oq4kZiewBxxT7omO+dsZxIT+tRrOIZArglM7j+PX9OK3ijKQrS7CBJwD26nFQPcYY7V47ZpjyF2dmGXY5ye1MdSpwwwaqxFx4uG/uirNtJ5i5OARxVHI7VNaPtkx/e4pSjdApWY+Yskm0MQhOcU0getTzqMBiM4qtnmqg7oU1qSJyhX8KheLDYU5+tSRn5sU9/WqIKpRh1U0lXAf4uoHtmlnlNy/mMq4wFyFAzj/PWgClRU5iU9MiozHg8EUAd74Y8UrJsttR+/8AdD46+3v9P/1V6t4f8TC1ijt75jNZEYjlB3NGP6r+orwxtDiOdl3En+9Kh/rW9o93eaYvlyXFtdQ+nnKG/nz/AD+tcE1B6xZ2Lm2ke/Sarp8CCaXUrBIjyGeVen0zWPqPj3wzCGSTUWuz3jtYy+fx6frXibKkkrSBbPex3ZmmDH+tWF3FQDqMESntCoH61HL3HY9FvPiPboD/AGfokzA/x3UgQflzWFefEvWsERPp1kvbZGXb9a5Q2Vk2TPfu5/2pBUiWOmpkpPHkd8rTVl0ZXL5jta8ValqttLHdanfXSsMFB8sZ9iBxXHSs090rCMhUIOGGQef1rtHgtzEVSdOeB8y1ROnjd/rwf+BrVxmo7Ilwv1M5bu8dcGZ41P8ADEgQUx4VY5lMkjf7ZJrbFh/02P8A30tRyWAb/lqT/wADWlzj5UYEykDaihR9MVCqkE7mXp9a35NNjH3pSD/10Wm/2aicrKDx3YVSmLlMExYOdy1rWeEtYx1wOtElqBwZov8AvsVSn3RsgSRioPISQdPzp259BO0dSG6i8yeUgZO49/eoGgB+VlB4zV5QjD/Whe53OM0s0BEPmKwZVPOGB61cW0yJxTTMz7EoPDsPwqG9jSIRhB1zknqa0Kpal1j/ABrdHMUwpIzSqNpBzyKeBhRTaLmnKkXgRIn1FQKm4e/epoxiOM/3lpG+WUjHDc1EdHYc9VcrsCjZqU8iknTK5FMhbjFamQqNt4p5fNRSfK1Rk56UASs4FQl8mmt1pKAJd3tSbj6UuKMVJpqJu9hS7vYUbRRj3oDUXf7Ck3+wox70YpBZiFuego3ewpdtG2mGomfYUbv9kUuKQigNRd6/3aTcD0Wkx7UoHPSgWoZ9hQDg5AGaUikxQFieOBpEDBlGaljt2V1YupAOcAU+0/1C1NQSxR0qnqP34x7VdHNZ984aYBedoxxQgRGTwKVV5yaEB6t19KfTsNyuPUAcjrTpsmMN3U1GDipEO5Cp6Hipno7lQ1VhVO5fY1UlBjcHtUkTlSQ3amvcK3BTI+tWZirIqukjKrgc7Wzg/XFRyHLFkXapJIHXApyFY8suGXtntSmbOeF/KgCDk07Y390/lSmRs9aTe3qaAH0GiioNgooooAKKKKYBRRRQAUUUUCCiiigAooooAuWn+oH1NT0UUjNkN3MY12KME989KpDjpRRVIQ5etOoopgKKcn3qKKmWxUNyOcYlyO4zVcDLYooprYT3LKIoULjr1NR7AGoopiJBECuT0Hajao4CCiigD//Z",
};
SCI_IMGS["fleming"] = "data:image/jpeg;base64,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";
SCI_IMGS["bohr"] = "data:image/jpeg;base64,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";
SCI_IMGS["franklin"] = "data:image/jpeg;base64,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";
SCI_IMGS["confucius"] = "data:image/jpeg;base64,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";
SCI_IMGS["curie"] = "data:image/jpeg;base64,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";




// ── QQ-д нэмэлт зургууд (жүжигчид + animation) ──
function buildQQExtraBG(){
  // Quantum Quiz-д зөвхөн эрдэмтэд — жүжигчид Movie Quiz-д байна
  // SCI_IMGS аль хэдийн buildScientistBG-д нэмэгдсэн тул энд нэмэлт хийхгүй
}

function buildScientistBG(){
  const wrap=document.getElementById('bgScientists');
  const scientists=[
    {key:'newton',name:'Isaac Newton',years:'1643–1727',desc:'Таталцлын хуулийг нээсэн физикч',delay:0,anim:'anim-a',top:3,left:0,w:145},
    {key:'tesla',name:'Nikola Tesla',years:'1856–1943',desc:'Хувьсах гүйдлийн систем',delay:5,anim:'anim-b',top:5,left:73,w:135},
    {key:'einstein',name:'Albert Einstein',years:'1879–1955',desc:'Харьцангуйн онол. Нобель (1921)',delay:2,anim:'anim-d',top:56,left:1,w:150},
    {key:'darwin',name:'Charles Darwin',years:'1809–1882',desc:'Хувьслын онолыг үндэслэгч',delay:6,anim:'anim-d',top:72,left:29,w:135},
    {key:'edison',name:'Thomas Edison',years:'1847–1931',desc:'Чийдэн, фонографыг зохион бүтээгч',delay:14,anim:'anim-a',top:24,left:43,w:130},
    {key:'galileo',name:'Galileo Galilei',years:'1564–1642',desc:'Орчин үеийн шинжлэх ухааны үндэслэгч',delay:7,anim:'anim-c',top:14,left:84,w:135},
    {key:'curie',name:'Marie Curie',years:'1867–1934',desc:'Радиоактивийн судлаач. 2 удаа Нобель',delay:10,anim:'anim-c',top:48,left:80,w:155,featured:true},
    {key:'fleming',name:'Alexander Fleming',years:'1881–1955',desc:'Пенициллиныг нээсэн эрдэмтэн',delay:12,anim:'anim-b',top:35,left:52,w:130},
    {key:'bohr',name:'Niels Bohr',years:'1885–1962',desc:'Атомын загварыг боловсруулсан физикч',delay:8,anim:'anim-a',top:68,left:62,w:130},
    {key:'franklin',name:'Benjamin Franklin',years:'1706–1790',desc:'Цахилгааны шинжлэх ухааны үндэслэгч',delay:16,anim:'anim-b',top:20,left:18,w:130},
    {key:'confucius',name:'Confucius',years:'МЭӨ 551–479',desc:'Дорнын агуу гүн ухаантан',delay:3,anim:'anim-c',top:82,left:8,w:130},
  ];
  scientists.forEach(s=>{
    const src=SCI_IMGS[s.key];
    if(!src) return;
    const div=document.createElement('div');
    div.className='scientist-portrait '+s.anim;
    div.style.cssText='top:'+s.top+'%;left:'+s.left+'%;animation-delay:'+s.delay+'s;width:'+s.w+'px;';
    const pw=document.createElement('div');
    pw.className='sci-photo-wrap';
    if(s.featured) pw.style.boxShadow='0 0 30px rgba(0,229,255,0.4)';
    const img=document.createElement('img');
    img.src=src; img.alt=s.name+' — '+s.desc;
    img.loading='lazy'; img.decoding='async';
    img.style.cssText='width:100%;display:block;border-radius:8px 8px 0 0;';
    pw.appendChild(img);
    const info=document.createElement('div');
    info.className='sci-info';
    info.innerHTML='<div class="sci-name">'+s.name+'</div><div class="sci-years">'+s.years+'</div><div class="sci-desc">'+s.desc+'</div>';
    div.appendChild(pw); div.appendChild(info);
    wrap.appendChild(div);
  });
  // Хөвөгч томъёо
  const formulas=['E=mc²','F=ma','∫∂x','PV=nRT','E=hf','v=λf','a²+b²=c²','F=GMm/r²','ΔS≥0','∇·E=ρ/ε₀','DNA→RNA','∑F=0','λ=h/mv','E=kT','Δx·Δp≥ℏ/2'];
  formulas.forEach(f=>{
    const el=document.createElement('div'); el.className='formula';
    el.style.cssText='left:'+Math.floor(Math.random()*95)+'%;font-size:'+(Math.floor(Math.random()*12)+10)+'px;animation-duration:'+(Math.floor(Math.random()*18)+14)+'s;animation-delay:'+(Math.floor(Math.random()*12))+'s;';
    el.textContent=f; document.body.appendChild(el);
  });
}



// ══════════════════════════════════════════
// MULTI-THEME AUDIO ENGINE
// ══════════════════════════════════════════
let audioCtx=null,musicPlaying=false,musicMuted=false,musicNodes=[],nextNoteTime=0,musicScheduler=null;
let currentTheme='mq';

async function ensureBGLogo(){
  try{
    const snap=await getDocs(collection(fsdb,'logo_items'));
    let found=false;
    snap.forEach(d=>{if(d.data().name==='BOLORGAMES') found=true;});
    if(!found){
      await setDoc(doc(fsdb,'logo_items','bolorgames_main'),{
        name:'BOLORGAMES',
        url:'https://res.cloudinary.com/bfyky0uk/image/upload/q_auto:best,f_auto,w_600/v1782560507/logos/bolor_games_1782560503127.png',
        diff:'easy',cat:'intl',createdAt:Date.now()
      });
      console.log('BOLORGAMES лого нэмэгдлээ');
    }
  }catch(e){console.error('BG logo err:',e);}
}

function initAudio(){
  if(audioCtx)return;
  audioCtx=new(window.AudioContext||window.webkitAudioContext)();
}

function playNote(freq,startTime,dur,gainVal,type,detune){
  type=type||'sine'; detune=detune||0;
  if(!audioCtx||!freq||musicMuted)return;
  const osc=audioCtx.createOscillator();
  const g=audioCtx.createGain();
  const m=audioCtx.createGain();
  m.gain.value=0.07;
  osc.connect(g);g.connect(m);m.connect(audioCtx.destination);
  osc.type=type; osc.frequency.value=freq; osc.detune.value=detune;
  g.gain.setValueAtTime(gainVal,startTime);
  g.gain.exponentialRampToValueAtTime(0.001,startTime+dur*0.92);
  osc.start(startTime);osc.stop(startTime+dur);
  musicNodes.push(osc);
}

// ── THEME 1: MUSIC QUIZ — Electronic Pop ──
var MQ_MEL=[523,659,784,1047,784,659,523,0,587,698,880,1047,880,698,587,0,523,659,784,880,784,659,523,440,494,587,740,988,880,740,659,523];
var MQ_BASS=[262,0,262,0,294,0,294,0,262,0,262,0,294,0,294,0,220,0,220,0,247,0,247,0,196,0,262,0,247,0,220,0];
var MQ_BEAT=60/112*0.5;
var mqMelIdx=0,mqBassIdx=0;
function scheduleMQ(){
  var la=0.1;
  while(nextNoteTime<audioCtx.currentTime+la){
    playNote(MQ_MEL[mqMelIdx%MQ_MEL.length],nextNoteTime,MQ_BEAT*.85,.9,'triangle');
    playNote(MQ_BASS[mqBassIdx%MQ_BASS.length],nextNoteTime,MQ_BEAT*1.8,.7,'sine');
    mqMelIdx++;mqBassIdx++;nextNoteTime+=MQ_BEAT;
    musicNodes=musicNodes.filter(function(n){try{return n.context.state!=='closed';}catch(e){return false;}});
  }
}

// ── THEME 2: QUANTUM QUIZ — Cosmic Sci-Fi ──
var QQ_ARP=[130.8,0,0,164.8,0,0,196,0,220,0,0,261.6,0,0,196,0,174.6,0,0,220,0,0,261.6,0,293.7,0,0,349.2,0,0,261.6,0];
var QQ_DRN=[65.4,0,65.4,0,73.4,0,73.4,0,87.3,0,87.3,0,82.4,0,82.4,0];
var QQ_BEAT=60/72*0.5;
var qqArpIdx=0,qqDrnIdx=0;
function scheduleQQ(){
  var la=0.12;
  while(nextNoteTime<audioCtx.currentTime+la){
    if(QQ_ARP[qqArpIdx%QQ_ARP.length]) playNote(QQ_ARP[qqArpIdx%QQ_ARP.length],nextNoteTime,QQ_BEAT*1.6,.55,'sine');
    if(QQ_DRN[qqDrnIdx%QQ_DRN.length]) playNote(QQ_DRN[qqDrnIdx%QQ_DRN.length],nextNoteTime,QQ_BEAT*3.5,.35,'sawtooth');
    if(QQ_ARP[qqArpIdx%QQ_ARP.length]) playNote(QQ_ARP[qqArpIdx%QQ_ARP.length]*2,nextNoteTime,QQ_BEAT*.9,.1,'sine',7);
    qqArpIdx++;qqDrnIdx++;nextNoteTime+=QQ_BEAT;
    musicNodes=musicNodes.filter(function(n){try{return n.context.state!=='closed';}catch(e){return false;}});
  }
}

// ── THEME 3: MEMORY CARDS — Cute Music-Box ──
var MC_MEL=[523,0,659,0,784,0,1047,0,784,0,659,0,587,0,659,0,
            523,0,587,0,659,0,784,0,880,0,784,0,659,587,523,0,494,0];
var MC_BASS=[131,0,0,0,196,0,0,0,131,0,0,0,165,0,0,0];
var MC_BEAT=60/138*0.5;
var mcMelIdx=0,mcBassIdx=0;
function scheduleMC(){
  var la=0.1;
  while(nextNoteTime<audioCtx.currentTime+la){
    var note=MC_MEL[mcMelIdx%MC_MEL.length];
    if(note){
      playNote(note,nextNoteTime,MC_BEAT*.8,.6,'triangle');
      playNote(note*2,nextNoteTime,MC_BEAT*.4,.1,'sine',5);
    }
    var bass=MC_BASS[mcBassIdx%MC_BASS.length];
    if(bass) playNote(bass,nextNoteTime,MC_BEAT*1.4,.35,'sine');
    mcMelIdx++;mcBassIdx++;nextNoteTime+=MC_BEAT;
    musicNodes=musicNodes.filter(function(n){try{return n.context.state!=='closed';}catch(e){return false;}});
  }
}

// ── THEME 4: FLAG QUIZ — Retro 8-bit Chiptune ──
var FL_MEL=[523,0,659,0,784,0,1047,784,
            659,0,784,0,988,0,1047,0,
            880,0,1047,0,1319,1047,880,784,
            659,587,523,0,659,784,659,523];
var FL_BASS=[131,0,131,0,196,0,196,0,
             165,0,165,0,220,0,220,0];
var FL_BEAT=60/160*0.5;

// ── THEME 6: F1 READY — Хурдтай, эрч хүчтэй "уралдааны" ая ──
// Давтагдсан бас (мотор донсолгох мэт), огцом хэмнэлтэй, 175bpm
var F1_MEL=[
  330,0,330,0,392,0,330,0, 294,0,294,0,349,0,294,0,
  330,0,392,0,440,0,392,0, 349,0,330,0,294,0,262,0
];
var F1_BASS=[
  110,110,0,110, 110,110,0,110, 98,98,0,98, 98,98,0,98,
  110,110,0,110, 130,130,0,130, 116,116,0,116, 98,0,98,0
];
var F1_BEAT=60/175*0.5;
var f1MelIdx=0, f1BassIdx=0;
function scheduleF1(){
  var la=0.1;
  while(nextNoteTime<audioCtx.currentTime+la){
    var note=F1_MEL[f1MelIdx%F1_MEL.length];
    if(note) playNote(note,nextNoteTime,F1_BEAT*.7,.22,'sawtooth');
    var bass=F1_BASS[f1BassIdx%F1_BASS.length];
    if(bass) playNote(bass,nextNoteTime,F1_BEAT*.85,.32,'square');
    f1MelIdx++;f1BassIdx++;nextNoteTime+=F1_BEAT;
    musicNodes=musicNodes.filter(function(n){try{return n.context.state!=='closed';}catch(e){return false;}});
  }
}
var flMelIdx=0,flBassIdx=0;
function scheduleFL(){
  var la=0.1;
  while(nextNoteTime<audioCtx.currentTime+la){
    var note=FL_MEL[flMelIdx%FL_MEL.length];
    if(note) playNote(note,nextNoteTime,FL_BEAT*.85,.45,'square');
    var bass=FL_BASS[flBassIdx%FL_BASS.length];
    if(bass) playNote(bass,nextNoteTime,FL_BEAT*1.8,.28,'square');
    flMelIdx++;flBassIdx++;nextNoteTime+=FL_BEAT;
    musicNodes=musicNodes.filter(function(n){try{return n.context.state!=='closed';}catch(e){return false;}});
  }
}


// ── THEME 5: LOGO QUIZ — Mario-style Upbeat Adventure ──
// C major pentatonic, bright, staccato, 160bpm
var LQ_MEL=[
  523,0,659,784,1047,784,659,523,
  587,0,698,880,1047,880,698,587,
  659,0,784,988,1319,988,784,659,
  523,659,784,1047,784,659,523,0,
  784,0,880,1047,1319,1047,880,784,
  659,0,784,988,1319,988,784,659,
  523,587,659,784,880,784,659,587,
  523,0,523,0,523,659,784,0
];
var LQ_BASS=[
  131,0,196,0,131,0,196,0,
  165,0,220,0,165,0,220,0,
  175,0,233,0,175,0,233,0,
  131,0,196,0,262,0,196,0
];
var LQ_CHORD=[0,0,330,0,0,0,330,0,0,0,349,0,0,0,349,0];
var LQ_BEAT=60/160*0.5;
var lqMelIdx=0,lqBassIdx=0,lqChordIdx=0;
function scheduleLQ(){
  var la=0.1;
  while(nextNoteTime<audioCtx.currentTime+la){
    var note=LQ_MEL[lqMelIdx%LQ_MEL.length];
    if(note){
      playNote(note,nextNoteTime,LQ_BEAT*.55,.75,'square');
      playNote(note*2,nextNoteTime,LQ_BEAT*.25,.08,'sine',4);
    }
    var bass=LQ_BASS[lqBassIdx%LQ_BASS.length];
    if(bass) playNote(bass,nextNoteTime,LQ_BEAT*1.2,.4,'triangle');
    var chord=LQ_CHORD[lqChordIdx%LQ_CHORD.length];
    if(chord) playNote(chord,nextNoteTime,LQ_BEAT*.9,.15,'sine');
    lqMelIdx++;lqBassIdx++;lqChordIdx++;nextNoteTime+=LQ_BEAT;
    musicNodes=musicNodes.filter(function(n){try{return n.context.state!=='closed';}catch(e){return false;}});
  }
}

// ── THEME 6: WORD QUIZ — Playful Puzzle / Word Game ──
// Bouncy, xylophone-like, G major, fun & light
var WQ_MEL=[
  392,0,494,0,587,0,659,0,
  784,659,587,0,494,0,392,0,
  440,0,523,0,659,0,784,0,
  880,784,659,0,523,0,440,0,
  494,587,659,784,880,784,659,587,
  523,0,659,0,784,0,880,0,
  988,880,784,659,587,523,494,0,
  392,494,587,659,784,0,392,0
];
var WQ_BASS=[
  196,0,0,0,247,0,0,0,
  220,0,0,0,262,0,0,0,
  196,0,0,0,220,0,0,0,
  175,0,0,0,196,0,0,0
];
var WQ_PERC=[0,0,0,0,600,0,0,0,0,0,0,0,600,0,0,0];
var WQ_BEAT=60/148*0.5;
var wqMelIdx2=0,wqBassIdx2=0,wqPercIdx=0;
function scheduleWQ(){
  var la=0.1;
  while(nextNoteTime<audioCtx.currentTime+la){
    var note=WQ_MEL[wqMelIdx2%WQ_MEL.length];
    if(note){
      playNote(note,nextNoteTime,WQ_BEAT*.5,.8,'triangle');
      playNote(note*2,nextNoteTime,WQ_BEAT*.25,.06,'sine',3);
    }
    var bass=WQ_BASS[wqBassIdx2%WQ_BASS.length];
    if(bass) playNote(bass,nextNoteTime,WQ_BEAT*.9,.35,'sine');
    var perc=WQ_PERC[wqPercIdx%WQ_PERC.length];
    if(perc) playNote(perc,nextNoteTime,WQ_BEAT*.1,.12,'sawtooth');
    wqMelIdx2++;wqBassIdx2++;wqPercIdx++;nextNoteTime+=WQ_BEAT;
    musicNodes=musicNodes.filter(function(n){try{return n.context.state!=='closed';}catch(e){return false;}});
  }
}

// ── THEME SWITCH ──
function setTheme(theme){
  stopMusic();
  currentTheme=theme;
  mqMelIdx=0;mqBassIdx=0;
  qqArpIdx=0;qqDrnIdx=0;
  mcMelIdx=0;mcBassIdx=0;
  flMelIdx=0;flBassIdx=0;
  lqMelIdx=0;lqBassIdx=0;lqChordIdx=0;
  wqMelIdx2=0;wqBassIdx2=0;wqPercIdx=0;
  f1MelIdx=0;f1BassIdx=0;
  if(!musicMuted) startMusic();
}

function scheduleNotes(){
  if(currentTheme==='mq') scheduleMQ();
  else if(currentTheme==='qq') scheduleQQ();
  else if(currentTheme==='mc') scheduleMC();
  else if(currentTheme==='fl') scheduleFL();
  else if(currentTheme==='lq') scheduleLQ();
  else if(currentTheme==='wq') scheduleWQ();
  else if(currentTheme==='f1') scheduleF1();
}

function startMusic(){
  initAudio();
  if(audioCtx.state==='suspended')audioCtx.resume();
  if(musicPlaying)return;
  musicPlaying=true;
  nextNoteTime=audioCtx.currentTime+.05;
  musicScheduler=setInterval(scheduleNotes,50);
  updateMusicBtn();
}
function stopMusic(){
  if(musicScheduler){clearInterval(musicScheduler);musicScheduler=null;}
  musicPlaying=false;
  musicNodes.forEach(function(n){try{n.stop();}catch(e){}});
  musicNodes=[];
  updateMusicBtn();
}
// ── Дизайн горим (Бараан/Цайвар) — localStorage-д хадгална ──
function applyTheme(mode){
  document.body.classList.toggle('light-mode', mode==='light');
  const icon=document.getElementById('themeToggleIcon');
  if(icon) icon.textContent = mode==='light' ? '🌙' : '☀️';
  try{ localStorage.setItem('bg_theme', mode); }catch(e){}
}
function toggleTheme(){
  const isLight=document.body.classList.contains('light-mode');
  applyTheme(isLight ? 'dark' : 'light');
}
(function initTheme(){
  let saved='dark';
  try{ saved=localStorage.getItem('bg_theme')||'dark'; }catch(e){}
  applyTheme(saved);
})();
window.toggleTheme=toggleTheme;

function toggleMusic(){
  musicMuted=!musicMuted;
  localStorage.setItem('ssMuted',musicMuted?'1':'0');
  if(musicMuted)stopMusic();else startMusic();
  updateMusicBtn();
}
function updateMusicBtn(){
  var btn=document.getElementById('musicBtn');
  var icon=document.getElementById('musicIcon');
  if(!btn||!icon)return;
  if(musicMuted){btn.classList.add('muted');icon.textContent='🔇';}
  else{btn.classList.remove('muted');icon.textContent='🎵';}
}
function tryStartMusic(){
  if(!musicMuted&&!musicPlaying)startMusic();
  document.removeEventListener('click',tryStartMusic);
  document.removeEventListener('keydown',tryStartMusic);
}

// ── HELPERS ──
function escH(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function escA(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}

document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeModal();mqCloseEditor();qqCloseEditor();closeNR();closeLogin();}
  if(e.key==='Enter'){
    if(document.getElementById('nrOv').classList.contains('open'))createRound();
    if(document.getElementById('loginOverlay').classList.contains('open'))doLogin();
  }
});

// ── INIT ──
(async()=>{
  buildScientistBG();
  buildQQExtraBG();
  await loadAll();
  mqRenderHome(); qqRenderHome();
  showLanding();
  try{
    const _qrUrlParams=new URLSearchParams(location.search);
    const _qrJoinCode=_qrUrlParams.get('join');
    if(_qrJoinCode && /^\d{6}$/.test(_qrJoinCode)) showQRJoin(_qrJoinCode);
    const _cdJoinCode=_qrUrlParams.get('cjoin');
    if(_cdJoinCode && /^\d{6}$/.test(_cdJoinCode)) showCDJoin(_cdJoinCode);
    const _sqJoinCode=_qrUrlParams.get('sjoin');
    if(_sqJoinCode && /^\d{6}$/.test(_sqJoinCode)) showSQJoin(_sqJoinCode);
    const _mtJoinCode=_qrUrlParams.get('mjoin');
    if(_mtJoinCode && /^\d{6}$/.test(_mtJoinCode)) showMultJoin(_mtJoinCode);
    const _f1JoinCode=_qrUrlParams.get('fjoin');
    if(_f1JoinCode && /^\d{6}$/.test(_f1JoinCode)) showF1Join(_f1JoinCode);
  }catch(e){}
  musicMuted=localStorage.getItem('ssMuted')==='1';
  updateMusicBtn();
  document.addEventListener('click',tryStartMusic);
  document.addEventListener('keydown',tryStartMusic);
})();

// ══════════════ FLAG QUIZ ══════════════
let flMode='count';
let flSelectedCount=25;
let flSelectedTime=60;
let flPlayerName='';
let flPool=[];
let flCurrentCountry=null;
let flCorrectCount=0;
let flWrongCount=0;
let flStartTs=0, flEndTs=0;
let flTimerInterval=null;
let flScores=[];
let flLbMode='count';
let flPendingStart=false;

function showFLHome(){
  setAllInactive();
  document.getElementById('flHomeScreen').classList.add('active');
  document.getElementById('navFL').classList.add('active');
  activeGame='fl';
  flBuildCountGrid();
  flBuildTimeGrid();
  flLoadScores();
  setTheme('fl');
}
function flSetMode(mode){
  flMode=mode;
  document.querySelectorAll('#flModeGrid .mc-reveal-btn').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
  document.getElementById('flCountField').style.display=mode==='count'?'block':'none';
  document.getElementById('flTimeField').style.display=mode==='time'?'block':'none';
}
function flBuildCountGrid(){
  const g=document.getElementById('flCountGrid');
  const opts=[10,25,50,100,150,195];
  g.innerHTML=opts.map(n=>`<button class="mc-count-btn${n===flSelectedCount?' active':''}" onclick="flSetCount(${n})">${n}</button>`).join('');
}
function flSetCount(n){
  flSelectedCount=n;
  document.querySelectorAll('#flCountGrid .mc-count-btn').forEach(b=>b.classList.toggle('active',parseInt(b.textContent)===n));
  const c=document.getElementById('flCountCustom'); if(c)c.value='';
}
function flSetCustomCount(val){
  const n=parseInt(val);
  if(!n||n<1||n>195)return;
  flSelectedCount=n;
  document.querySelectorAll('#flCountGrid .mc-count-btn').forEach(b=>b.classList.remove('active'));
}
function flBuildTimeGrid(){
  const g=document.getElementById('flTimeGrid');
  const opts=[15,30,60,120,180,300];
  g.innerHTML=opts.map(n=>`<button class="mc-count-btn${n===flSelectedTime?' active':''}" onclick="flSetTime(${n})">${n}с</button>`).join('');
}
function flSetTime(n){
  flSelectedTime=n;
  document.querySelectorAll('#flTimeGrid .mc-count-btn').forEach(b=>b.classList.toggle('active',parseInt(b.textContent)===n));
  const c=document.getElementById('flTimeCustom'); if(c)c.value='';
}
function flSetCustomTime(val){
  const n=parseInt(val);
  if(!n||n<1||n>300)return;
  flSelectedTime=n;
  document.querySelectorAll('#flTimeGrid .mc-count-btn').forEach(b=>b.classList.remove('active'));
}
async function flStartGame(){
  if(!currentUser){flPendingStart=true;openLogin();return;}
  if(!await hasActiveSubscription()){showSubRequired();return;}
  const nameEl=document.getElementById('flPlayerName');
  flPlayerName=nameEl.value.trim()||'Тоглогч';
  flPool=FLAG_COUNTRIES.slice();
  for(let i=flPool.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [flPool[i],flPool[j]]=[flPool[j],flPool[i]];
  }
  flCorrectCount=0; flWrongCount=0; flCurrentCountry=null; flGameOver=false;
  setAllInactive();
  document.getElementById('flGameScreen').classList.add('active');
  const modeLbl=flMode==='count'?`${flSelectedCount} туг`:`${flSelectedTime} секунд`;
  document.getElementById('flPlayerLabel').textContent=`👤 ${flPlayerName} — ${modeLbl}`;
  flRenderCountryGrid();
  flStartTs=Date.now();
  flStartTimer();
  flNextFlag();
}
function flRenderCountryGrid(){
  const grid=document.getElementById('flCountryGrid');
  grid.innerHTML=FLAG_COUNTRIES.map((c,i)=>`<button class="fl-country-chip" id="flChip-${c.code}" onclick="flPickCountry('${c.code}')"><span class="fl-num">${i+1}</span>${escH(c.name)}</button>`).join('');
}
function flFilterCountries(query){
  const q=query.trim().toLowerCase();
  document.querySelectorAll('.fl-country-chip').forEach(chip=>{
    const name=chip.textContent.trim().toLowerCase();
    chip.classList.toggle('fl-hidden', q.length>0 && !name.includes(q));
  });
}
function flSearchEnter(){
  const visible=[...document.querySelectorAll('.fl-country-chip')].filter(c=>!c.classList.contains('fl-hidden')&&!c.classList.contains('fl-correct')&&!c.classList.contains('fl-wrong'));
  if(visible.length===1)visible[0].click();
}
function flNextFlag(){
  if(flPool.length===0){flFinishGame();return;}
  const idx=Math.floor(Math.random()*flPool.length);
  flCurrentCountry=flPool.splice(idx,1)[0];
  document.getElementById('flFlagImg').src=`https://flagcdn.com/w320/${flCurrentCountry.code}.png`;
  flUpdateProgress();
  const searchEl=document.getElementById('flSearchInput');
  if(searchEl){searchEl.value='';flFilterCountries('');searchEl.focus();}
}
function flUpdateProgress(){
  const done=flCorrectCount+flWrongCount;
  if(flMode==='count'){
    document.getElementById('flProgress').textContent=`Зөв: ${flCorrectCount} · Алдаа: ${flWrongCount} · ${done} / ${flSelectedCount}`;
  }else{
    const elapsed=(Date.now()-flStartTs)/1000;
    const remain=Math.max(0,flSelectedTime-elapsed);
    document.getElementById('flProgress').textContent=`Зөв: ${flCorrectCount} · Алдаа: ${flWrongCount} · Үлдсэн: ${remain.toFixed(0)}с`;
  }
}
function flPickCountry(code){
  if(!flCurrentCountry)return;
  const correctCode=flCurrentCountry.code;
  const correctName=flCurrentCountry.name;
  const isCorrect=code===correctCode;
  if(isCorrect){
    flCorrectCount++;
    const el=document.getElementById(`flChip-${correctCode}`);
    if(el)el.classList.add('fl-correct');
  }else{
    flWrongCount++;
    const el=document.getElementById(`flChip-${correctCode}`);
    if(el)el.classList.add('fl-wrong');
  }
  const fb=document.getElementById('flFeedback');
  if(fb){
    fb.textContent=(isCorrect?'✓ ':'✗ ')+correctName;
    fb.classList.remove('fl-fb-correct','fl-fb-wrong');
    fb.classList.add(isCorrect?'fl-fb-correct':'fl-fb-wrong','show');
  }
  flCurrentCountry=null;
  flUpdateProgress();
  setTimeout(()=>{
    if(fb)fb.classList.remove('show');
    if(flMode==='count'&&(flCorrectCount+flWrongCount)>=flSelectedCount){flFinishGame();return;}
    if(flPool.length===0){flFinishGame();return;}
    flNextFlag();
  },900);
}
function flStartTimer(){
  flStopTimer();
  flTimerInterval=setInterval(()=>{
    const elapsed=(Date.now()-flStartTs)/1000;
    document.getElementById('flTimer').textContent=flFormatTime(elapsed);
    if(flMode==='time'){
      flUpdateProgress();
      if(elapsed>=flSelectedTime){flFinishGame();return;}
    }
  },100);
}
function flStopTimer(){
  if(flTimerInterval){clearInterval(flTimerInterval);flTimerInterval=null;}
}
function flFormatTime(sec){
  const m=Math.floor(sec/60);
  const s=(sec%60).toFixed(1);
  return `${m.toString().padStart(2,'0')}:${s.padStart(4,'0')}`;
}
function flGoHome(){ flStopTimer(); showFLHome(); }
let flGameOver=false;
async function flFinishGame(){
  if(flGameOver)return;
  flGameOver=true;
  flEndTs=Date.now();
  flStopTimer();
  const totalSec=(flEndTs-flStartTs)/1000;
  const scoreEntry={
    name:flPlayerName,
    mode:flMode,
    target: flMode==='count'?flSelectedCount:flSelectedTime,
    correct:flCorrectCount,
    wrong:flWrongCount,
    totalSec:Math.round(totalSec*10)/10,
    ts:Date.now()
  };
  try{
    const flScoreId=`${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    await setDoc(doc(fsdb,'flag_scores',flScoreId),scoreEntry);
  }catch(e){console.error('Flag score save error:',e);}
  flShowResult(scoreEntry);
}
function flShowResult(entry){
  const stats=document.getElementById('flResultStats');
  if(entry.mode==='count'){
    stats.innerHTML=`
      <div class="mc-stat-row mc-stat-highlight"><span class="mc-stat-lbl">Зөв таасан</span><span class="mc-stat-val">${entry.correct} / ${entry.target} ТУГ</span></div>
      <div class="mc-stat-row"><span class="mc-stat-lbl">Буруу</span><span class="mc-stat-val">${entry.wrong}</span></div>
      <div class="mc-stat-row"><span class="mc-stat-lbl">Хугацаа</span><span class="mc-stat-val">${flFormatTime(entry.totalSec)}</span></div>
    `;
  }else{
    stats.innerHTML=`
      <div class="mc-stat-row mc-stat-highlight"><span class="mc-stat-lbl">Зөв таасан</span><span class="mc-stat-val">${entry.correct} туг</span></div>
      <div class="mc-stat-row"><span class="mc-stat-lbl">Буруу</span><span class="mc-stat-val">${entry.wrong}</span></div>
      <div class="mc-stat-row"><span class="mc-stat-lbl">Хугацааны хязгаар</span><span class="mc-stat-val">${entry.target} секунд</span></div>
    `;
  }
  document.getElementById('flResultOverlay').classList.add('open');
  document.body.style.overflow='hidden';
  confettiBurst();
}
function flCloseResult(){
  document.getElementById('flResultOverlay').classList.remove('open');
  document.body.style.overflow='';
  showFLHome();
}
function flPlayAgain(){
  document.getElementById('flResultOverlay').classList.remove('open');
  document.body.style.overflow='';
  flStartGame();
}
async function flLoadScores(){
  try{
    const q=query(collection(fsdb,'flag_scores'),orderBy('correct','desc'),limit(100));const snap=await getDocs(q);
    flScores=[];
    snap.forEach(d=>flScores.push({...d.data(),_id:d.id}));
  }catch(e){console.error('Flag scores load error:',e);}
  flRenderLeaderboard();
}
function flSwitchLbMode(mode){
  flLbMode=mode;
  document.querySelectorAll('#flLbTabs .mc-lb-tab').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
  flRenderLeaderboard();
}
function flRenderLeaderboard(){
  const filtered=flScores.filter(s=>s.mode===flLbMode);
  filtered.sort((a,b)=> b.correct-a.correct || a.totalSec-b.totalSec);
  const tableEl=document.getElementById('flLbTable');
  if(!filtered.length){tableEl.innerHTML='<div class="mc-lb-empty">Бичлэг алга</div>';return;}
  let html=`<div class="mc-lb-row mc-lb-header"><div>#</div><div>Нэр</div><div>Зорилт</div><div>Зөв</div><div>Хугацаа</div><div></div></div>`;
  filtered.forEach((s,i)=>{
    const delBtn=isAdmin?`<button class="mc-lb-del" onclick="delFlScore('${s._id}')">✕</button>`:'';
    const targetTxt=s.mode==='count'?`${s.target} туг`:`${s.target} сек`;
    html+=`<div class="mc-lb-row"><div class="mc-lb-rank">${i+1}</div><div class="mc-lb-name">${escH(s.name)}</div><div>${targetTxt}</div><div>${s.correct}/${s.correct+s.wrong}</div><div>${flFormatTime(s.totalSec)}</div><div>${delBtn}</div></div>`;
  });
  tableEl.innerHTML=html;
  const flDelBtn=document.getElementById('flDelAllBtn');if(flDelBtn)flDelBtn.style.display=isAdmin?'inline':'none';
}
function delFlScore(id){
  if(!isAdmin){notify('Зөвхөн admin устгах боломжтой');return;}
  if(!id||!confirm('Энэ бичлэгийг устгах уу?'))return;
  deleteDoc(doc(fsdb,'flag_scores',id)).then(()=>{
    flScores=flScores.filter(s=>s._id!==id);
    flRenderLeaderboard();
  }).catch(e=>{notify('Устгахад алдаа: '+String(e).slice(0,100));});
}

// ══════════════════════════════════════════
// ── LOGO QUIZ JS ──
// ══════════════════════════════════════════
const LQ_SVG_DATA={
  "Apple":`<svg viewBox="0 0 814 1000" xmlns="http://www.w3.org/2000/svg"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.8 135.4-317.7 268.5-317.7 96 0 175.6 63.4 237.8 63.4 59.4 0 152.3-67.2 261.8-67.2zm-16.9-190.4c31.6-37.9 54.3-90.8 54.3-143.7 0-7.7-.6-15.4-1.9-21.8-51.6 1.9-112.3 34.2-149.2 76.8-28.5 32.3-56.4 83.8-56.4 137.4 0 8.3 1.3 16.6 1.9 19.2 3.2.6 8.4 1.3 13.6 1.3 46.1 0 101.8-31 137.7-69.2z" fill="#000"/></svg>`,
  "Google":`<svg viewBox="0 0 272 92" xmlns="http://www.w3.org/2000/svg"><path d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#EA4335"/><path d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z" fill="#FBBC05"/><path d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z" fill="#4285F4"/><path d="M225 3v65h-9.5V3h9.5z" fill="#34A853"/><path d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z" fill="#EA4335"/><path d="M35.29 41.41V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.49.01z" fill="#4285F4"/></svg>`,
  "Nike":`<svg viewBox="0 0 512 200" xmlns="http://www.w3.org/2000/svg"><path d="M512 47L129 171c-39 13-73 2-86-33C28 99 45 52 82 19L0 171l402-152c49-19 83-9 94 14 13 26-2 57-47 79L512 47z" fill="#000"/></svg>`,
  "McDonalds":`<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M256 32C128 32 128 224 128 320H160C160 224 192 96 256 96s96 128 96 224H384C384 224 384 32 256 32z" fill="#FFC72C"/><path d="M96 320C96 224 96 32 0 32v288h96z" fill="#FF6900"/><path d="M416 320C416 224 416 32 512 32v288h-96z" fill="#FF6900"/><rect x="0" y="320" width="512" height="160" rx="20" fill="#FF6900"/><text x="256" y="430" font-family="Arial Black" font-size="100" font-weight="900" fill="#FFC72C" text-anchor="middle">M</text></svg>`,
  "Amazon":`<svg viewBox="0 0 603 181" xmlns="http://www.w3.org/2000/svg"><path d="M372 130c-42 29-102 45-154 45-73 0-138-27-188-71-4-3 0-8 4-5 54 31 120 50 189 50 46 0 97-10 144-30 7-3 13 4 5 11z" fill="#FF9900"/><path d="M389 111c-5-7-34-3-47-2-4 0-5-3-1-5 23-16 60-11 65-6 4 5-1 43-22 60-3 3-6 1-5-2 5-12 15-38 10-45z" fill="#FF9900"/><path d="M350 18v-9h-47v9l29 32 3 3v52h-3l-29-6v10l47 10V18z" fill="#221F1F"/><path d="M186 86l-13 43h-1L159 86h-17l21 62-3 9c-2 6-6 10-12 10h-8v14h10c14 0 24-9 29-24l25-71h-18z" fill="#221F1F"/><path d="M234 83c-21 0-36 15-36 38s15 38 36 38 36-15 36-38-15-38-36-38zm0 62c-11 0-19-10-19-24s8-24 19-24 19 10 19 24-8 24-19 24z" fill="#221F1F"/><path d="M66 83c-11 0-19 4-25 12v-9H25v108h16V149c6 7 14 11 25 11 21 0 36-17 36-38S87 83 66 83zm-3 63c-12 0-21-10-21-25s9-25 21-25 21 10 21 25-9 25-21 25z" fill="#221F1F"/><path d="M130 83c-9 0-17 4-22 10v-7h-16v72h16v-39c0-14 8-22 20-22 11 0 16 7 16 20v41h16v-44c0-20-11-31-30-31z" fill="#221F1F"/><path d="M299 83c-21 0-35 15-35 38s14 38 36 38c13 0 24-5 31-14l-10-9c-5 6-12 9-20 9-11 0-19-7-21-19h54v-6c0-22-13-37-35-37zm-19 31c2-10 9-17 19-17s17 7 18 17h-37z" fill="#221F1F"/></svg>`,
  "Microsoft":`<svg viewBox="0 0 88 88" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="40" height="40" fill="#F25022"/><rect x="47" y="1" width="40" height="40" fill="#7FBA00"/><rect x="1" y="47" width="40" height="40" fill="#00A4EF"/><rect x="47" y="47" width="40" height="40" fill="#FFB900"/></svg>`,
  "Samsung":`<svg viewBox="0 0 300 60" xmlns="http://www.w3.org/2000/svg"><text x="150" y="48" font-family="Arial" font-size="52" font-weight="bold" fill="#1428A0" text-anchor="middle" letter-spacing="-1">SAMSUNG</text></svg>`,
  "Toyota":`<svg viewBox="0 0 206 200" xmlns="http://www.w3.org/2000/svg"><ellipse cx="103" cy="100" rx="100" ry="97" fill="none" stroke="#EB0A1E" stroke-width="10"/><ellipse cx="103" cy="120" rx="65" ry="45" fill="none" stroke="#EB0A1E" stroke-width="10"/><ellipse cx="103" cy="65" rx="40" ry="28" fill="none" stroke="#EB0A1E" stroke-width="10"/><line x1="3" y1="70" x2="203" y2="70" stroke="#EB0A1E" stroke-width="10"/></svg>`,
  "BMW":`<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="95" fill="#fff" stroke="#000" stroke-width="6"/><circle cx="100" cy="100" r="78" fill="#000"/><path d="M100 22 L100 100 L178 100 A78 78 0 0 0 100 22z" fill="#0066CC"/><path d="M22 100 L100 100 L100 178 A78 78 0 0 1 22 100z" fill="#0066CC"/><circle cx="100" cy="100" r="28" fill="#fff" stroke="#000" stroke-width="4"/><text x="100" y="108" font-family="Arial" font-size="16" font-weight="bold" fill="#000" text-anchor="middle">BMW</text></svg>`,
  "Mercedes":`<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="95" fill="#fff" stroke="#999" stroke-width="4"/><circle cx="100" cy="100" r="75" fill="none" stroke="#999" stroke-width="3"/><line x1="100" y1="25" x2="100" y2="100" stroke="#000" stroke-width="5"/><line x1="100" y1="100" x2="34" y2="157" stroke="#000" stroke-width="5"/><line x1="100" y1="100" x2="166" y2="157" stroke="#000" stroke-width="5"/></svg>`,
  "Adidas":`<svg viewBox="0 0 200 180" xmlns="http://www.w3.org/2000/svg"><polygon points="100,10 190,170 10,170" fill="none" stroke="#000" stroke-width="18"/><line x1="65" y1="115" x2="135" y2="115" stroke="#000" stroke-width="18"/><line x1="80" y1="143" x2="120" y2="143" stroke="#000" stroke-width="18"/></svg>`,
  "Tesla":`<svg viewBox="0 0 342 512" xmlns="http://www.w3.org/2000/svg"><path d="M0 68c47-23 97-36 171-36s124 13 171 36c0 0-14 30-28 38C268 74 224 63 171 63s-97 11-143 43C14 98 0 68 0 68z" fill="#CC0000"/><path d="M171 110L86 512h85V110z" fill="#CC0000"/><path d="M171 110l85 402h-85V110z" fill="#CC0000"/></svg>`,
  "YouTube":`<svg viewBox="0 0 229 160" xmlns="http://www.w3.org/2000/svg"><rect width="229" height="160" rx="40" fill="#FF0000"/><polygon points="91,40 91,120 163,80" fill="#fff"/></svg>`,
  "Netflix":`<svg viewBox="0 0 111 190" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h30l40 120V0h30v190l-30-1-40-119V190H0z" fill="#E50914"/></svg>`,
  "Spotify":`<svg viewBox="0 0 167.5 167.5" xmlns="http://www.w3.org/2000/svg"><circle cx="83.8" cy="83.8" r="83.8" fill="#1DB954"/><path d="M120.1 117.3c-1.7 2.7-5.2 3.6-7.9 1.9C89.9 105 61.4 102 27.8 109.9c-3.1.7-6.2-1.2-6.9-4.3-.7-3.1 1.2-6.2 4.3-6.9 36.9-8.5 68.6-4.8 94.2 10.6 2.7 1.7 3.6 5.3 1.9 8h-1.2zM131 90.9c-2.1 3.4-6.6 4.5-10 2.3-26.7-16.4-67.4-21.2-99-11.6-4 1.2-8.2-1.1-9.4-5.1-1.2-4 1.1-8.2 5.1-9.4C52.9 56.2 97.2 61.7 127.4 80.7c3.4 2.1 4.5 6.6 2.3 10h1.3zm1.1-27c-32-19-84.8-20.8-115.3-11.5-4.8 1.4-9.9-1.3-11.3-6.1-1.4-4.8 1.3-9.9 6.1-11.3 35.2-10.7 93.8-8.6 130.8 13.3 4.3 2.6 5.8 8.1 3.2 12.4-2.6 4.3-8.1 5.7-12.4 3.2h-1.1z" fill="#fff"/></svg>`,
  "Audi":`<svg viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg"><circle cx="60" cy="60" r="50" fill="none" stroke="#BB0A21" stroke-width="10"/><circle cx="160" cy="60" r="50" fill="none" stroke="#BB0A21" stroke-width="10"/><circle cx="240" cy="60" r="50" fill="none" stroke="#BB0A21" stroke-width="10"/><circle cx="340" cy="60" r="50" fill="none" stroke="#BB0A21" stroke-width="10"/></svg>`,
  "Volkswagen":`<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="95" fill="#001F5F"/><circle cx="100" cy="100" r="73" fill="none" stroke="#fff" stroke-width="4"/><path d="M100 30 L70 100 H130 Z" fill="#fff"/><path d="M100 170 L130 100 H160 L100 170 L40 100 H70 Z" fill="#fff"/></svg>`,
  "Honda":`<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="160" rx="10" fill="#CC0000"/><text x="100" y="115" font-family="Arial" font-size="120" font-weight="900" fill="#fff" text-anchor="middle">H</text></svg>`,
  "Ford":`<svg viewBox="0 0 400 160" xmlns="http://www.w3.org/2000/svg"><ellipse cx="200" cy="80" rx="195" ry="75" fill="#003478"/><text x="200" y="110" font-family="Times New Roman" font-size="100" font-style="italic" font-weight="bold" fill="#fff" text-anchor="middle">Ford</text></svg>`,
  "Pepsi":`<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><circle cx="100" cy="100" r="95" fill="#fff" stroke="#ddd" stroke-width="2"/><path d="M5 100 A95 95 0 0 1 195 100 C150 85 50 115 5 100z" fill="#E32934"/><path d="M5 100 A95 95 0 0 0 195 100 C150 115 50 85 5 100z" fill="#005EBF"/></svg>`,
  "Intel":`<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg"><text x="100" y="80" font-family="Arial" font-size="80" font-weight="900" fill="#0071C5" text-anchor="middle">intel</text></svg>`,
  "Sony":`<svg viewBox="0 0 300 100" xmlns="http://www.w3.org/2000/svg"><text x="150" y="82" font-family="Arial" font-size="90" font-weight="900" fill="#000" text-anchor="middle" letter-spacing="-3">SONY</text></svg>`,
  "Hyundai":`<svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg"><ellipse cx="150" cy="100" rx="145" ry="95" fill="#002C5F"/><text x="150" y="130" font-family="Arial" font-size="80" font-weight="900" font-style="italic" fill="#fff" text-anchor="middle">H</text></svg>`,
  "Ferrari":`<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="180" height="220" rx="8" fill="#FFCC00" stroke="#000" stroke-width="4"/><rect x="10" y="10" width="180" height="100" rx="8" fill="#CE1126"/><text x="100" y="190" font-family="Arial" font-size="28" font-weight="900" fill="#000" text-anchor="middle">FERRARI</text><text x="100" y="85" font-size="60" text-anchor="middle">🐎</text></svg>`,
  "Porsche":`<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="5" width="190" height="230" rx="5" fill="#000" stroke="#C00" stroke-width="4"/><text x="100" y="40" font-family="Arial" font-size="16" font-weight="bold" fill="#C00" text-anchor="middle">PORSCHE</text><rect x="40" y="50" width="120" height="140" fill="#C00"/><rect x="40" y="50" width="60" height="70" fill="#000"/><rect x="100" y="120" width="60" height="70" fill="#000"/><text x="100" y="220" font-family="Arial" font-size="14" fill="#C00" text-anchor="middle">STUTTGART</text></svg>`,
  "Rolex":`<svg viewBox="0 0 300 120" xmlns="http://www.w3.org/2000/svg"><text x="150" y="90" font-family="Times New Roman" font-size="72" font-weight="bold" fill="#127749" text-anchor="middle" letter-spacing="4">ROLEX</text><path d="M50 100 L250 100" stroke="#127749" stroke-width="3"/><path d="M50 25 L250 25" stroke="#127749" stroke-width="3"/></svg>`,
  "Chanel":`<svg viewBox="0 0 300 120" xmlns="http://www.w3.org/2000/svg"><text x="150" y="88" font-family="Times New Roman" font-size="64" font-weight="bold" fill="#000" text-anchor="middle" letter-spacing="6">CHANEL</text></svg>`,
  "Gucci":`<svg viewBox="0 0 300 120" xmlns="http://www.w3.org/2000/svg"><text x="150" y="88" font-family="Times New Roman" font-size="72" fill="#000" text-anchor="middle" letter-spacing="4">Gucci</text></svg>`,
  "Lexus":`<svg viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg"><ellipse cx="150" cy="100" rx="140" ry="90" fill="#5B0010"/><text x="150" y="115" font-family="Times New Roman" font-size="100" font-weight="bold" font-style="italic" fill="#fff" text-anchor="middle">L</text></svg>`,
  "Huawei":`<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><g transform="translate(100,100)"><path d="M0,-80 L20,-20 L80,-60 Z" fill="#CF0A2C" opacity="0.9"/><path d="M80,-60 L20,-20 L80,20 Z" fill="#CF0A2C" opacity="0.7"/><path d="M80,20 L20,-20 L60,70 Z" fill="#CF0A2C" opacity="0.85"/><path d="M60,70 L20,-20 L-20,70 Z" fill="#CF0A2C" opacity="0.6"/><path d="M-20,70 L20,-20 L-60,70 Z" fill="#CF0A2C" opacity="0.75"/><path d="M-60,70 L20,-20 L-80,20 Z" fill="#CF0A2C" opacity="0.65"/><path d="M-80,20 L20,-20 L-80,-60 Z" fill="#CF0A2C" opacity="0.9"/><path d="M-80,-60 L20,-20 L0,-80 Z" fill="#CF0A2C" opacity="0.8"/></g></svg>`,
  "Maserati":`<svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg"><rect x="10" y="10" width="180" height="260" rx="5" fill="#fff" stroke="#003DA5" stroke-width="4"/><line x1="100" y1="30" x2="100" y2="200" stroke="#003DA5" stroke-width="8"/><line x1="40" y1="30" x2="100" y2="200" stroke="#003DA5" stroke-width="6"/><line x1="160" y1="30" x2="100" y2="200" stroke="#003DA5" stroke-width="6"/><path d="M60 220 Q100 240 140 220" stroke="#CE1126" stroke-width="5" fill="none"/><text x="100" y="265" font-family="Times New Roman" font-size="20" fill="#003DA5" text-anchor="middle">MASERATI</text></svg>`,
  "Jaguar":`<svg viewBox="0 0 300 120" xmlns="http://www.w3.org/2000/svg"><text x="150" y="88" font-family="Times New Roman" font-size="72" font-weight="bold" font-style="italic" fill="#000" text-anchor="middle" letter-spacing="2">JAGUAR</text></svg>`,
};
const LOGO_DATA=[
  {name:'Apple',diff:'easy',cat:'intl'},
  {name:'Google',diff:'easy',cat:'intl'},
  {name:'Nike',diff:'easy',cat:'intl'},
  {name:"McDonald's",diff:'easy',cat:'intl'},
  {name:'Amazon',diff:'easy',cat:'intl'},
  {name:'Microsoft',diff:'easy',cat:'intl'},
  {name:'Samsung',diff:'easy',cat:'intl'},
  {name:'Toyota',diff:'easy',cat:'intl'},
  {name:'BMW',diff:'easy',cat:'intl'},
  {name:'Mercedes-Benz',diff:'easy',cat:'intl'},
  {name:'Adidas',diff:'easy',cat:'intl'},
  {name:'Tesla',diff:'easy',cat:'intl'},
  {name:'YouTube',diff:'easy',cat:'intl'},
  {name:'Netflix',diff:'easy',cat:'intl'},
  {name:'Spotify',diff:'easy',cat:'intl'},
  {name:'Audi',diff:'medium',cat:'intl'},
  {name:'Volkswagen',diff:'medium',cat:'intl'},
  {name:'Honda',diff:'medium',cat:'intl'},
  {name:'Ford',diff:'medium',cat:'intl'},
  {name:'Pepsi',diff:'medium',cat:'intl'},
  {name:'Intel',diff:'medium',cat:'intl'},
  {name:'Sony',diff:'medium',cat:'intl'},
  {name:'Hyundai',diff:'medium',cat:'intl'},
  {name:'Ferrari',diff:'medium',cat:'intl'},
  {name:'Porsche',diff:'medium',cat:'intl'},
  {name:'Rolex',diff:'hard',cat:'intl'},
  {name:'Chanel',diff:'hard',cat:'intl'},
  {name:'Gucci',diff:'hard',cat:'intl'},
  {name:'Lexus',diff:'hard',cat:'intl'},
  {name:'Huawei',diff:'hard',cat:'intl'},
  {name:'Maserati',diff:'expert',cat:'intl'},
  {name:'Jaguar',diff:'expert',cat:'intl'},
];
let lqMode='count',lqSelectedCount=20,lqSelectedTime=60,lqPlayerName='Тоглогч';
let lqPool=[],lqCurrentLogo=null,lqCorrectCount=0,lqWrongCount=0;
let lqGameOver=false,lqStartTs=0,lqEndTs=0,lqTimerInterval=null;
let lqScores=[],lqLbMode='count',lqPendingStart=false,lqSelectedCat='all',lqSelectedDiff='easy';

function showLQHome(){setTheme('lq');setAllInactive();document.getElementById('lqHomeScreen').classList.add('active');document.getElementById('navLQ').classList.add('active');activeGame='lq';lqBuildCountGrid();lqBuildTimeGrid();lqLoadScores();}
function lqSetCat(cat){lqSelectedCat=cat;document.querySelectorAll('#lqCatGrid .mc-reveal-btn').forEach(b=>b.classList.toggle('active',b.dataset.cat===cat));}
function lqSetDiff(diff){lqSelectedDiff=diff;document.querySelectorAll('#lqDiffGrid .mc-reveal-btn').forEach(b=>b.classList.toggle('active',b.dataset.diff===diff));}
function lqSetMode(mode){lqMode=mode;document.querySelectorAll('#lqModeGrid .mc-reveal-btn').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));document.getElementById('lqCountField').style.display=mode==='count'?'block':'none';document.getElementById('lqTimeField').style.display=mode==='time'?'block':'none';}
function lqBuildCountGrid(){const g=document.getElementById('lqCountGrid');const opts=[10,20,30,50];g.innerHTML=opts.map(n=>`<button class="mc-count-btn${n===lqSelectedCount?' active':''}" onclick="lqSetCount(${n})">${n}</button>`).join('');}
function lqSetCount(n){lqSelectedCount=n;document.querySelectorAll('#lqCountGrid .mc-count-btn').forEach(b=>b.classList.toggle('active',parseInt(b.textContent)===n));const c=document.getElementById('lqCountCustom');if(c)c.value='';}
function lqSetCustomCount(val){const n=parseInt(val);if(!n||n<1||n>100)return;lqSelectedCount=n;document.querySelectorAll('#lqCountGrid .mc-count-btn').forEach(b=>b.classList.remove('active'));}
function lqBuildTimeGrid(){const g=document.getElementById('lqTimeGrid');const opts=[30,60,90,120];g.innerHTML=opts.map(n=>`<button class="mc-count-btn${n===lqSelectedTime?' active':''}" onclick="lqSetTime(${n})">${n}с</button>`).join('');}
function lqSetTime(n){lqSelectedTime=n;document.querySelectorAll('#lqTimeGrid .mc-count-btn').forEach(b=>b.classList.toggle('active',parseInt(b.textContent)===n));const c=document.getElementById('lqTimeCustom');if(c)c.value='';}
function lqSetCustomTime(val){const n=parseInt(val);if(!n||n<1||n>300)return;lqSelectedTime=n;document.querySelectorAll('#lqTimeGrid .mc-count-btn').forEach(b=>b.classList.remove('active'));}
async function lqStartGame(){
  if(!currentUser){lqPendingStart=true;openLogin();return;}
  if(!await hasActiveSubscription()){showSubRequired();return;}
  let pool=[];
  try{
    const snap=await getDocs(collection(fsdb,'logo_items'));
    snap.forEach(d=>pool.push({...d.data(),_id:d.id}));
  }catch(e){
    showError('Лого ачааллахад алдаа','Интернэт холболтоо шалгаад дахин оролдоно уу.',()=>lqStartGame());
    return;
  }
  const filtered=pool.filter(l=>(lqSelectedCat==='all'||l.cat===lqSelectedCat)&&l.diff===lqSelectedDiff);
  if(!filtered.length){notify('Энэ түвшинд лого байхгүй байна! Админ лого нэмэх хэрэгтэй.');return;}
  // BOLORGAMES логог бусад pool-с тусад нь авах
  const bgLogo=pool.find(l=>l.name&&l.name.toUpperCase()==='BOLORGAMES');
  lqPool=filtered.filter(l=>l.name&&l.name.toUpperCase()!=='BOLORGAMES');
  // Limit to selected count if count mode
  if(lqMode==='count') lqPool=lqPool.slice(0,lqSelectedCount);
  for(let i=lqPool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[lqPool[i],lqPool[j]]=[lqPool[j],lqPool[i]];}
  // BOLORGAMES-г хамгийн эхэнд нэмэх
  if(bgLogo) lqPool.unshift(bgLogo);
  lqCorrectCount=0;lqWrongCount=0;lqCurrentLogo=null;lqGameOver=false;
  lqPlayerName=document.getElementById('lqPlayerName').value.trim()||'Тоглогч';
  setAllInactive();document.getElementById('lqGameScreen').classList.add('active');
  document.getElementById('lqPlayerLabel').textContent=`👤 ${lqPlayerName}`;
  lqStartTs=Date.now();lqStartTimer();lqNextLogo();
}
function lqNextLogo(){
  if(lqPool.length===0){lqFinishGame();return;}
  // Pool-с дараалан авах (BOLORGAMES аль хэдийн эхэнд байна)
  lqCurrentLogo=lqPool.shift();
  window._lqCurrentName=lqCurrentLogo.name;
  const wrap=document.getElementById('lqLogoWrap');
  if(lqCurrentLogo.url){
    wrap.innerHTML='<img src="'+lqCurrentLogo.url+'" style="max-width:100%;max-height:100%;object-fit:contain;" onerror="this.parentElement.innerHTML=\'<div style=display:flex;align-items:center;justify-content:center;height:100%;font-family:Orbitron,monospace;font-size:18px;color:#ff9500;text-align:center;padding:10px>'+lqCurrentLogo.name+'</div>\'">';
  } else {
    wrap.style.background='#fff';
    wrap.innerHTML='<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:Orbitron,monospace;font-size:18px;color:#ff9500;text-align:center;padding:10px">'+lqCurrentLogo.name+'</div>';
  }
  lqUpdateProgress();
  const inp=document.getElementById('lqAnswerInput');
  if(inp){inp.value='';lqFilterSuggestions('');inp.focus();}
  document.getElementById('lqSuggestGrid').innerHTML='';
}
function lqFilterSuggestions(query){
  const q=query.trim().toLowerCase();
  if(q.length<1){document.getElementById('lqSuggestGrid').innerHTML='';return;}
  const matches=lqPool.concat(lqPool).filter((l,i,a)=>a.findIndex(x=>x.name===l.name)===i).filter(l=>l.name.toLowerCase().includes(q)).slice(0,8);
  document.getElementById('lqSuggestGrid').innerHTML=matches.map(l=>`<button class="lq-suggest-chip" onclick="lqPickSuggestion('${escA(l.name)}')">${escH(l.name)}</button>`).join('');
}
function lqPickSuggestion(name){const inp=document.getElementById('lqAnswerInput');if(inp)inp.value=name;lqSubmitAnswer();}
function lqSubmitAnswer(){
  if(!lqCurrentLogo)return;
  const inp=document.getElementById('lqAnswerInput');
  const answer=(inp?inp.value.trim():'').toLowerCase();
  const correct=lqCurrentLogo.name.toLowerCase();
  const isCorrect=answer===correct||(correct.includes(answer)&&answer.length>3);
  if(isCorrect)lqCorrectCount++;else lqWrongCount++;
  const fb=document.getElementById('lqFeedback');
  if(fb){fb.textContent=(isCorrect?'✓ ':'✗ ')+lqCurrentLogo.name;fb.classList.remove('fl-fb-correct','fl-fb-wrong');fb.classList.add(isCorrect?'fl-fb-correct':'fl-fb-wrong','show');}
  lqCurrentLogo=null;lqUpdateProgress();
  document.getElementById('lqSuggestGrid').innerHTML='';
  setTimeout(()=>{
    if(fb)fb.classList.remove('show');
    if(lqMode==='count'&&(lqCorrectCount+lqWrongCount)>=lqSelectedCount){lqFinishGame();return;}
    if(lqPool.length===0){lqFinishGame();return;}
    lqNextLogo();
  },900);
}
function lqUpdateProgress(){
  const done=lqCorrectCount+lqWrongCount;
  if(lqMode==='count'){document.getElementById('lqProgress').textContent=`Зөв: ${lqCorrectCount} · Алдаа: ${lqWrongCount} · ${done} / ${lqSelectedCount}`;}
  else{const r=Math.max(0,lqSelectedTime-(Date.now()-lqStartTs)/1000);document.getElementById('lqProgress').textContent=`Зөв: ${lqCorrectCount} · Алдаа: ${lqWrongCount} · Үлдсэн: ${r.toFixed(0)}с`;}
}
function lqStartTimer(){lqStopTimer();lqTimerInterval=setInterval(()=>{const e=(Date.now()-lqStartTs)/1000;document.getElementById('lqTimer').textContent=flFormatTime(e);if(lqMode==='time'){lqUpdateProgress();if(e>=lqSelectedTime){lqFinishGame();}}},100);}
function lqStopTimer(){if(lqTimerInterval){clearInterval(lqTimerInterval);lqTimerInterval=null;}}
function lqGoHome(){lqStopTimer();showLQHome();}
async function lqFinishGame(){
  if(lqGameOver)return;lqGameOver=true;lqEndTs=Date.now();lqStopTimer();
  const totalSec=(lqEndTs-lqStartTs)/1000;
  const entry={name:lqPlayerName,mode:lqMode,diff:lqSelectedDiff,target:lqMode==='count'?lqSelectedCount:lqSelectedTime,correct:lqCorrectCount,wrong:lqWrongCount,totalSec:Math.round(totalSec*10)/10,ts:Date.now()};
  try{await setDoc(doc(fsdb,'logo_scores',`${Date.now()}_${Math.random().toString(36).slice(2,8)}`),entry);}catch(e){console.error(e);}
  const stats=document.getElementById('lqResultStats');
  stats.innerHTML=`<div class="mc-stat-row mc-stat-highlight"><span class="mc-stat-lbl">Зөв таасан</span><span class="mc-stat-val">${entry.correct}/${entry.target}</span></div><div class="mc-stat-row"><span class="mc-stat-lbl">Буруу</span><span class="mc-stat-val">${entry.wrong}</span></div><div class="mc-stat-row"><span class="mc-stat-lbl">Хугацаа</span><span class="mc-stat-val">${flFormatTime(entry.totalSec)}</span></div>`;
  document.getElementById('lqResultOverlay').classList.add('open');document.body.style.overflow='hidden';confettiBurst();
}
function lqCloseResult(){document.getElementById('lqResultOverlay').classList.remove('open');document.body.style.overflow='';showLQHome();}
function lqPlayAgain(){document.getElementById('lqResultOverlay').classList.remove('open');document.body.style.overflow='';lqStartGame();}
async function lqLoadScores(){try{const q=query(collection(fsdb,'logo_scores'),orderBy('correct','desc'),limit(100));const snap=await getDocs(q);lqScores=[];snap.forEach(d=>lqScores.push({...d.data(),_id:d.id}));}catch(e){try{const snap=await getDocs(collection(fsdb,'logo_scores'));lqScores=[];snap.forEach(d=>lqScores.push({...d.data(),_id:d.id}));}catch(e2){}}lqRenderLeaderboard();}
function lqSwitchLbMode(mode){lqLbMode=mode;document.querySelectorAll('#lqLbTabs .mc-lb-tab').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));lqRenderLeaderboard();}
function lqRenderLeaderboard(){
  const filtered=lqScores.filter(s=>s.mode===lqLbMode);filtered.sort((a,b)=>b.correct-a.correct||a.totalSec-b.totalSec);
  const tableEl=document.getElementById('lqLbTable');
  if(!filtered.length){tableEl.innerHTML='<div class="mc-lb-empty">Бичлэг алга</div>';return;}
  let html=`<div class="mc-lb-row mc-lb-header"><div>#</div><div>Нэр</div><div>Зөв</div><div>Хугацаа</div><div></div></div>`;
  filtered.forEach((s,i)=>{const del=isAdmin?`<button class="mc-lb-del" onclick="delLqScore('${s._id}')">✕</button>`:'';html+=`<div class="mc-lb-row"><div class="mc-lb-rank">${i+1}</div><div class="mc-lb-name">${escH(s.name)}</div><div>${s.correct}/${s.correct+s.wrong}</div><div>${flFormatTime(s.totalSec)}</div><div>${del}</div></div>`;});
  tableEl.innerHTML=html;
}
function delLqScore(id){if(!isAdmin)return;if(!confirm('Устгах уу?'))return;deleteDoc(doc(fsdb,'logo_scores',id)).then(()=>{lqScores=lqScores.filter(s=>s._id!==id);lqRenderLeaderboard();});}

// ══ QPAY ══
const QPAY_INVOICE_URL='https://createqpayinvoice-i4rf6d4a5a-uc.a.run.app';
const QPAY_CHECK_URL='https://checkqpaypayment-i4rf6d4a5a-uc.a.run.app';
let qpayInvoiceId=null,qpayCheckInterval=null,qpaySelectedMonths=1,qpaySelectedAmount=12600;
let _subSelectedEl=null;

function subSelectPlan(el,months,amount){
  if(_subSelectedEl) _subSelectedEl.classList.remove('selected');
  el.classList.add('selected');
  _subSelectedEl=el;
  qpaySelectedMonths=months;qpaySelectedAmount=amount;
  const btn=document.getElementById('subPayBtn');
  const labels={1:'1 сарын эрх — ₮12,600 төлөх',3:'3 сарын эрх — ₮31,500 төлөх',6:'6 сарын эрх — ₮63,000 төлөх'};
  btn.textContent=labels[months]||'ТӨЛӨХ';
  btn.disabled=false;
  btn.style.background=months===1?'linear-gradient(135deg,#818cf8,#6366f1)':months===3?'linear-gradient(135deg,#a78bfa,#7c3aed)':'linear-gradient(135deg,#34d399,#059669)';
  btn.style.color='#fff';
}

function subProceedPay(){
  initQPay(qpaySelectedMonths,qpaySelectedAmount);
}
function openQPay(){if(!currentUser){openLogin();return;}
  document.getElementById('qpayOverlay').classList.add('open');
  document.getElementById('qpayStep1').style.display='block';
  document.getElementById('qpayStep2').style.display='none';
  document.getElementById('qpayStep3').style.display='none';
  document.getElementById('qpayLoading').style.display='none';
  const errEl0=document.getElementById('qpayError');if(errEl0){errEl0.style.display='none';errEl0.textContent='';}
  // Plan reset
  if(_subSelectedEl){_subSelectedEl.classList.remove('selected');_subSelectedEl=null;}
  const btn=document.getElementById('subPayBtn');
  if(btn){btn.disabled=true;btn.textContent='Эхлэхийн тулд тариф сонгоно уу';btn.style.background='linear-gradient(135deg,#818cf8,#a78bfa)';btn.style.color='#fff';}
  document.body.style.overflow='hidden';
}
function qpayOpenApp(bank){
  const isMob=/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  const deepLink=window['_qpayLink_'+bank];
  const web={
    qpay:'https://qpay.mn',
    khan:'https://khanbank.com',
    state:'https://statebank.mn',
    xac:'https://xacbank.mn',
    tdb:'https://tdbm.mn',
    golomt:'https://golomtbank.com',
    most:'https://mostmoney.mn'
  };
  if(isMob && deepLink){
    // Утсанд: deep link дарж апп нээхийг оролдох, 1.5 сек дотор нээгдэхгүй бол web руу
    const t=Date.now();
    window.location.href=deepLink;
    setTimeout(()=>{if(Date.now()-t<2000 && web[bank]) window.location.href=web[bank];},1500);
  } else {
    // Компьютерт: шууд банкны сайт руу
    if(web[bank]) window.open(web[bank],'_blank');
  }
}
function closeQPay(){document.getElementById('qpayOverlay').classList.remove('open');document.body.style.overflow='';if(qpayCheckInterval){clearInterval(qpayCheckInterval);qpayCheckInterval=null;}}
function qpayBack(){document.getElementById('qpayStep1').style.display='block';document.getElementById('qpayStep2').style.display='none';document.getElementById('qpayError').style.display='none';if(qpayCheckInterval){clearInterval(qpayCheckInterval);qpayCheckInterval=null;}}
async function initQPay(months,amount){
  if(!currentUser)return;qpaySelectedMonths=months;
  const planEl=document.getElementById('qpayPlanLabel');
  if(planEl) planEl.textContent={1:'1 сар — ₮12,600',3:'3 сар — ₮31,500',6:'6 сар — ₮63,000'}[months]||'';
  document.getElementById('qpayLoading').style.display='block';document.getElementById('qpayStep1').style.display='none';document.getElementById('qpayError').style.display='none';
  try{
    const idToken=await currentUser.getIdToken();
    const res=await fetch(`${QPAY_INVOICE_URL}`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+idToken},body:JSON.stringify({amount,months,description:`Bolor Games ${months} сар`})});
    const data=await res.json();
    if(!data.success)throw new Error(data.error||'Invoice үүсгэхэд алдаа');
    qpayInvoiceId=data.invoice_id;
    document.getElementById('qpayLoading').style.display='none';document.getElementById('qpayStep2').style.display='block';
    const errEl2=document.getElementById('qpayError');if(errEl2){errEl2.style.display='none';errEl2.textContent='';}
    // Device шалгах
    const isMobile=/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    const titleEl=document.getElementById('qp2AppTitle');
    const noteEl=document.getElementById('qp2DeviceNote');
    const noteText=document.getElementById('qp2DeviceText');
    const bankGrid=document.querySelector('.qp2-bank-grid');
    if(isMobile){
      if(titleEl) titleEl.textContent='Апп-аар төлөх боломжтой';
      if(noteEl) noteEl.style.display='none';
      if(bankGrid) bankGrid.style.display='grid';
    } else {
      if(titleEl) titleEl.textContent='Гар утасны аппаар төлөх';
      if(noteText) noteText.innerHTML='Та компьютер эсвэл таблетаас орж байгаа бол <b>QPay QR</b> кодыг гар утасны банкны аппаараа уншуулж төлнө үү.';
      // bankGrid харагдах хэвээр байна
    }
    const qrDiv=document.getElementById('qpayQR');
    qrDiv.innerHTML=data.qr_image?`<img src="data:image/png;base64,${data.qr_image}" style="width:220px;height:220px;border-radius:6px;display:block;">`:`<div style="color:#999;font-size:12px;padding:20px;">${data.qr_text||'QR код ачаалагдсангүй'}</div>`;
    // QPay deep link-үүдийг банкны grid дотор тохируулах
    if(data.urls && data.urls.length){
      window._qpayUrls = data.urls;
      // Bank name → deep link тохируулах
      const bankMap = {
        'Khan': 'khan', 'Хаан': 'khan',
        'Golomt': 'golomt', 'Голомт': 'golomt',
        'State': 'state', 'Төрийн': 'state',
        'Xac': 'xac', 'Хас': 'xac',
        'TDB': 'tdb', 'Trade': 'tdb',
        'qPay': 'qpay', 'QPay': 'qpay',
        'Most': 'most', 'MOST': 'most',
      };
      data.urls.forEach(u => {
        const key = Object.entries(bankMap).find(([k]) => u.name && u.name.includes(k));
        if(key) window['_qpayLink_'+key[1]] = u.link;
      });
    }
    let secs=300;const timerEl=document.getElementById('qpayTimer');if(timerEl)timerEl.textContent='5:00';
    let autoCheckCount=0;
    qpayCheckInterval=setInterval(async()=>{
      secs--;
      const m=Math.floor(secs/60),s=secs%60;
      if(timerEl)timerEl.textContent=`${m}:${s.toString().padStart(2,'0')}`;
      // 5 секунд тутамд автоматаар шалгах
      if(secs%5===0 && secs>0){
        autoCheckCount++;
        try{
          const tok=await currentUser.getIdToken();
          const r=await fetch(QPAY_CHECK_URL,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+tok},body:JSON.stringify({invoice_id:qpayInvoiceId})});
          const d=await r.json();
          if(d.paid || d.payment_status==='PAID' || (d.rows && d.rows.length>0)){
            clearInterval(qpayCheckInterval);qpayCheckInterval=null;
            const expiry=Date.now()+(qpaySelectedMonths*30*24*60*60*1000);
            let activated=true;
            try{
              await setDoc(doc(fsdb,'users',currentUser.uid),{subscriptionActive:true,subscriptionPlan:`${qpaySelectedMonths} сар`,subscriptionExpiry:expiry},{merge:true});
            }catch(werr){activated=false;console.warn('Subscription бичихэд эрхийн алдаа (сервер талаас идэвхжинэ):',werr);}
            document.getElementById('qpayStep2').style.display='none';
            const sd=document.getElementById('qpaySuccessDesc');
            if(sd) sd.innerHTML=activated
              ?`Таны <b style="color:#00ff8c">${qpaySelectedMonths} сарын</b> subscription идэвхжлээ!<br>Одоо бүх тоглоомыг хязгааргүй тоглоорой.`
              :`Таны <b style="color:#00ff8c">${qpaySelectedMonths} сарын</b> төлбөр амжилттай хийгдлээ!<br>Эрх тань хэдхэн минутын дотор идэвхжинэ. Идэвхжээгүй бол бидэнтэй холбогдоно уу.`;
            document.getElementById('qpayStep3').style.display='block';
          }
        }catch(e){}
      }
      if(secs<=0){
        clearInterval(qpayCheckInterval);qpayCheckInterval=null;
        const e=document.getElementById('qpayError');
        if(e){e.style.display='block';e.textContent='QR кодны хугацаа дуусчээ. Шинэ QR үүсгэхийн тулд тариф дахин сонгоно уу.';}
        document.getElementById('qpayStep2').style.display='none';
        document.getElementById('qpayStep1').style.display='block';
        document.getElementById('qpayError').style.display='none';
      }
    },1000);
  }catch(e){document.getElementById('qpayLoading').style.display='none';document.getElementById('qpayStep1').style.display='block';const err=document.getElementById('qpayError');err.textContent='Алдаа: '+e.message;err.style.display='block';}
}
async function checkQPayStatus(){
  if(!qpayInvoiceId||!currentUser)return;
  const errEl=document.getElementById('qpayError');errEl.style.display='none';
  try{
    const idToken2=await currentUser.getIdToken();
    const res=await fetch(`${QPAY_CHECK_URL}`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+idToken2},body:JSON.stringify({invoice_id:qpayInvoiceId})});
    const data=await res.json();
    if(data.paid || data.payment_status==='PAID' || data.status==='PAID' || (data.rows && data.rows.length>0)){
      const expiry=Date.now()+(qpaySelectedMonths*30*24*60*60*1000);
      let activated=true;
      try{
        await setDoc(doc(fsdb,'users',currentUser.uid),{subscriptionActive:true,subscriptionPlan:`${qpaySelectedMonths} сар`,subscriptionExpiry:expiry},{merge:true});
      }catch(werr){activated=false;console.warn('Subscription бичихэд эрхийн алдаа (сервер талаас идэвхжинэ):',werr);}
      if(qpayCheckInterval){clearInterval(qpayCheckInterval);qpayCheckInterval=null;}
      document.getElementById('qpayStep2').style.display='none';const sd=document.getElementById('qpaySuccessDesc');
      if(sd) sd.innerHTML=activated
        ?`Таны <b style="color:#00ff8c">${qpaySelectedMonths} сарын</b> subscription идэвхжлээ!<br>Одоо бүх тоглоомыг хязгааргүй тоглоорой.`
        :`Таны <b style="color:#00ff8c">${qpaySelectedMonths} сарын</b> төлбөр амжилттай хийгдлээ!<br>Эрх тань хэдхэн минутын дотор идэвхжинэ. Идэвхжээгүй бол бидэнтэй холбогдоно уу.`;
      document.getElementById('qpayStep3').style.display='block';
      return;
    }
    if(data.error==='CHECK_FAILED'){
      errEl.textContent='Төлбөрийн системтэй холбогдоход алдаа гарлаа. 5-10 секундын дараа дахин дарна уу.';
      errEl.style.display='block';
      return;
    }
    errEl.textContent='Төлбөр хараахан хийгдээгүй байна. Төлбөрөө хийгээд дахин шалгана уу.';
    errEl.style.display='block';
  }catch(e){errEl.textContent='Шалгахад алдаа гарлаа. Дахин оролдоно уу.';errEl.style.display='block';}
}

// ── GLOBAL EXPORTS ──
window.loginBtnClick=loginBtnClick;window.openLogin=openLogin;window.closeLogin=closeLogin;window.doLogin=doLogin;window.switchAuthMode=switchAuthMode;window.handleAuthSubmit=handleAuthSubmit;window.doRegister=doRegister;window.doForgotPassword=doForgotPassword;window.resendVerification=resendVerification;window.showAdminDash=showAdminDash;window.adLoadUsers=adLoadUsers;window.adRenderUsers=adRenderUsers;window.adSetSubscription=adSetSubscription;
window.adLoadUnverified=adLoadUnverified;window.adVerifyUser=adVerifyUser;window.adDeleteUser=adDeleteUser;
window.showLanding=showLanding;window.showMQHome=showMQHome;window.showQQHome=showQQHome;
window.showMCHome=showMCHome;window.mcGoHome=mcGoHome;window.mcSetCount=mcSetCount;window.mcSetCustomCount=mcSetCustomCount;window.mcStartGame=mcStartGame;
window.mcShuffle=mcShuffle;window.mcMemorized=mcMemorized;window.mcPickCard=mcPickCard;window.mcSetRevealMode=mcSetRevealMode;
window.mcCloseResult=mcCloseResult;window.mcPlayAgain=mcPlayAgain;window.mcRenderLeaderboard=mcRenderLeaderboard;window.delMcScore=delMcScore;
window.showFLHome=showFLHome;window.flSetMode=flSetMode;window.flSetCount=flSetCount;window.flSetCustomCount=flSetCustomCount;window.flSetTime=flSetTime;window.flSetCustomTime=flSetCustomTime;window.flStartGame=flStartGame;window.flPickCountry=flPickCountry;window.flGoHome=flGoHome;window.flCloseResult=flCloseResult;window.flPlayAgain=flPlayAgain;window.flSwitchLbMode=flSwitchLbMode;window.delFlScore=delFlScore;window.flFilterCountries=flFilterCountries;window.flSearchEnter=flSearchEnter;

// ══ LOGO ADMIN ══
let laSelectedDiff='easy', laSelectedCat='intl', laLogos=[], laFile=null;

function showLogoAdmin(){
  if(!isAdmin){notify('Зөвхөн admin');return;}
  setAllInactive();
  document.getElementById('logoAdminScreen').classList.add('active');
  document.getElementById('navAdminLogos').classList.add('active');
  laLoadLogos();
}

function laSetDiff(d){
  laSelectedDiff=d;
  document.querySelectorAll('#laDiffGrid .mc-reveal-btn').forEach(b=>b.classList.toggle('active',b.dataset.diff===d));
}
function laSetCat(c){
  laSelectedCat=c;
  document.querySelectorAll('#laCatGrid .mc-reveal-btn').forEach(b=>b.classList.toggle('active',b.dataset.cat===c));
}

function laPreview(input){
  const file=input.files[0]; if(!file) return;
  laFile=file;
  const url=URL.createObjectURL(file);
  document.getElementById('laPreviewImg').src=url;
  document.getElementById('laPreviewWrap').style.display='block';
  document.getElementById('laDropText').textContent='✅ '+file.name;
}

async function laUpload(){
  const name=document.getElementById('laName').value.trim();
  if(!name){laShowMsg('Нэр оруулна уу!','#ff4444');return;}
  if(!laFile){laShowMsg('Зураг сонгоно уу!','#ff4444');return;}
  const btn=document.getElementById('laUploadText');
  btn.textContent='⏳ Ачааллаж байна...';
  try{
    // Upload to Cloudinary
    const fd=new FormData();
    fd.append('file',laFile);
    fd.append('upload_preset',CLOUDINARY_PRESET);
    fd.append('public_id','logos/'+name.toLowerCase().replace(/[^a-z0-9]/g,'_')+'_'+Date.now());
    const r=await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,{method:'POST',body:fd});
    const data=await r.json();
    if(!data.secure_url) throw new Error('Upload failed');
    // Save to Firestore
    const docId=Date.now()+'_'+Math.random().toString(36).slice(2,6);
    await setDoc(doc(fsdb,'logo_items',docId),{
      name, url:data.secure_url, diff:laSelectedDiff, cat:laSelectedCat,
      createdAt:Date.now()
    });
    laShowMsg('✅ Амжилттай нэмэгдлээ!','#39ff14');
    document.getElementById('laName').value='';
    document.getElementById('laPreviewWrap').style.display='none';
    document.getElementById('laDropText').textContent='📁 Зураг сонгох эсвэл чирж оруулах';
    document.getElementById('laFile').value='';
    laFile=null;
    laLoadLogos();
  }catch(e){
    laShowMsg('❌ Алдаа: '+e.message,'#ff4444');
  }
  btn.textContent='⬆ ЛОГО НЭМЭХ';
}

function laShowMsg(txt,color){
  const el=document.getElementById('laMsg');
  el.textContent=txt; el.style.color=color;
  setTimeout(()=>el.textContent='',4000);
}

async function laLoadLogos(){
  try{
    const snap=await getDocs(collection(fsdb,'logo_items'));
    laLogos=[];
    snap.forEach(d=>laLogos.push({...d.data(),_id:d.id}));
    laLogos.sort((a,b)=>a.name.localeCompare(b.name));
  }catch(e){console.error(e);}
  laRenderList();
}

function laRenderList(){
  const q=(document.getElementById('laSearch')?.value||'').toLowerCase();
  const filtered=laLogos.filter(l=>l.name.toLowerCase().includes(q));
  const grid=document.getElementById('laLogoGrid');
  const empty=document.getElementById('laEmpty');
  if(!filtered.length){grid.innerHTML='';empty.style.display='block';return;}
  empty.style.display='none';
  grid.innerHTML=filtered.map(l=>`
    <div style="background:linear-gradient(145deg,#1a1200,#100e00);border:1px solid rgba(255,149,0,.2);border-radius:12px;padding:14px;text-align:center;">
      <div style="background:#fff;border-radius:8px;padding:10px;margin-bottom:10px;height:90px;display:flex;align-items:center;justify-content:center;overflow:hidden;">
        <img src="${l.url}" style="max-width:100%;max-height:70px;object-fit:contain;" onerror="this.parentElement.innerHTML='<span style=color:#999;font-size:11px>No image</span>'">
      </div>
      <div style="font-family:Orbitron,monospace;font-size:11px;color:#ff9500;margin-bottom:4px;word-break:break-word;">${l.name}</div>
      <div style="font-family:Share Tech Mono,monospace;font-size:10px;color:rgba(255,255,255,.5);margin-bottom:10px;">${l.diff} · ${l.cat}</div>
      <button onclick="laDelete('${l._id}','${l.name.replace(/'/g,"\'")}');event.stopPropagation()" style="font-family:Orbitron,monospace;font-size:9px;padding:5px 12px;border-radius:6px;border:1px solid rgba(255,68,68,.4);background:rgba(255,68,68,.08);color:#ff4444;cursor:pointer;">✕ Устгах</button>
    </div>
  `).join('');
}

async function laDelete(id, name){
  if(!confirm(name+' устгах уу?')) return;
  try{
    await deleteDoc(doc(fsdb,'logo_items',id));
    laLogos=laLogos.filter(l=>l._id!==id);
    laRenderList();
  }catch(e){notify('Алдаа: '+e.message);}
}


// ══════════════════════ STARQUIZ — ADMIN (Од удирдах) ══════════════════════
let saItems=[], saFile=null;
function showStarAdmin(){
  if(!isAdmin){notify('Зөвхөн admin');return;}
  setAllInactive();
  document.getElementById('starAdminScreen').classList.add('active');
  document.getElementById('navAdminStars').classList.add('active');
  saLoadItems();
}
function saPreview(input){
  const file=input.files[0]; if(!file) return;
  saFile=file;
  const url=URL.createObjectURL(file);
  document.getElementById('saPreviewImg').src=url;
  document.getElementById('saPreviewWrap').style.display='block';
  document.getElementById('saDropText').textContent='✅ '+file.name;
}
async function saUpload(){
  const name=document.getElementById('saName').value.trim();
  const cat=document.getElementById('saCat').value.trim();
  const hint=document.getElementById('saHint').value.trim();
  if(!name){saShowMsg('Нэр оруулна уу!','#ff4444');return;}
  if(!cat){saShowMsg('Ангилал оруулна уу!','#ff4444');return;}
  if(!saFile){saShowMsg('Зураг сонгоно уу!','#ff4444');return;}
  const btn=document.getElementById('saUploadText');
  btn.textContent='⏳ Ачааллаж байна...';
  try{
    const fd=new FormData();
    fd.append('file',saFile);
    fd.append('upload_preset',CLOUDINARY_PRESET);
    fd.append('public_id','stars/'+name.toLowerCase().replace(/[^a-z0-9]/g,'_')+'_'+Date.now());
    const r=await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,{method:'POST',body:fd});
    const data=await r.json();
    if(!data.secure_url) throw new Error('Upload failed');
    const docId=Date.now()+'_'+Math.random().toString(36).slice(2,6);
    await setDoc(doc(fsdb,'star_items',docId),{name, url:data.secure_url, cat, hint, createdAt:Date.now()});
    saShowMsg('✅ Амжилттай нэмэгдлээ!','#39ff14');
    document.getElementById('saName').value='';
    document.getElementById('saHint').value='';
    document.getElementById('saPreviewWrap').style.display='none';
    document.getElementById('saDropText').textContent='📁 Зураг сонгох эсвэл чирж оруулах';
    document.getElementById('saFile').value='';
    saFile=null;
    saLoadItems();
  }catch(e){
    saShowMsg('❌ Алдаа: '+e.message,'#ff4444');
  }
  btn.textContent='⬆ ХҮН НЭМЭХ';
}
function saShowMsg(txt,color){
  const el=document.getElementById('saMsg');
  el.textContent=txt; el.style.color=color;
  setTimeout(()=>el.textContent='',4000);
}
async function saLoadItems(){
  try{
    const snap=await getDocs(collection(fsdb,'star_items'));
    saItems=[];
    snap.forEach(d=>saItems.push({...d.data(),_id:d.id}));
    saItems.sort((a,b)=>a.name.localeCompare(b.name));
  }catch(e){console.error(e);}
  saRenderList();
  saRenderCatList();
}
function saRenderCatList(){
  const dl=document.getElementById('saCatList'); if(!dl)return;
  const cats=[...new Set(saItems.map(i=>i.cat).filter(Boolean))].sort();
  dl.innerHTML=cats.map(c=>`<option value="${escA(c)}">`).join('');
}
function saRenderList(){
  const q=(document.getElementById('saSearch')?.value||'').toLowerCase();
  const filtered=saItems.filter(l=>l.name.toLowerCase().includes(q)||(l.cat||'').toLowerCase().includes(q));
  const grid=document.getElementById('saItemGrid');
  const empty=document.getElementById('saEmpty');
  if(!filtered.length){grid.innerHTML='';empty.style.display='block';return;}
  empty.style.display='none';
  grid.innerHTML=filtered.map(l=>`
    <div style="background:linear-gradient(145deg,#1a1200,#100e00);border:1px solid rgba(250,204,21,.25);border-radius:12px;padding:14px;text-align:center;">
      <div style="border-radius:8px;margin-bottom:10px;height:110px;display:flex;align-items:center;justify-content:center;overflow:hidden;">
        <img src="${l.url}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;" onerror="this.parentElement.innerHTML='<span style=color:#999;font-size:11px>No image</span>'">
      </div>
      <div style="font-family:Orbitron,monospace;font-size:11px;color:#facc15;margin-bottom:4px;word-break:break-word;">${escH(l.name)}</div>
      <div style="font-family:Share Tech Mono,monospace;font-size:10px;color:rgba(255,255,255,.5);margin-bottom:10px;">${escH(l.cat||'')}</div>
      <button onclick="saDelete('${l._id}','${l.name.replace(/'/g,"\\'")}');event.stopPropagation()" style="font-family:Orbitron,monospace;font-size:9px;padding:5px 12px;border-radius:6px;border:1px solid rgba(255,68,68,.4);background:rgba(255,68,68,.08);color:#ff4444;cursor:pointer;">✕ Устгах</button>
    </div>
  `).join('');
}
async function saDelete(id, name){
  if(!confirm(name+' устгах уу?')) return;
  try{
    await deleteDoc(doc(fsdb,'star_items',id));
    saItems=saItems.filter(l=>l._id!==id);
    saRenderList(); saRenderCatList();
  }catch(e){notify('Алдаа: '+e.message);}
}

// ══ WORD QUIZ ══
const RU_EXTRA_DATA=[
  {word:'АКТ',hint:'акт',diff:'easy',cat:'general',lang:'ru'},
  {word:'АЛИ',hint:'эсвэл',diff:'easy',cat:'general',lang:'ru'},
  {word:'АНИ',hint:'нэг',diff:'easy',cat:'general',lang:'ru'},
  {word:'АРК',hint:'нум',diff:'easy',cat:'general',lang:'ru'},
  {word:'АСС',hint:'хүлэр',diff:'easy',cat:'general',lang:'ru'},
  {word:'БАЛ',hint:'бал',diff:'easy',cat:'general',lang:'ru'},
  {word:'БАН',hint:'хориг',diff:'easy',cat:'general',lang:'ru'},
  {word:'БАР',hint:'бар',diff:'easy',cat:'general',lang:'ru'},
  {word:'БАС',hint:'бас',diff:'easy',cat:'general',lang:'ru'},
  {word:'БАХ',hint:'Бах',diff:'easy',cat:'general',lang:'ru'},
  {word:'БЕЗ',hint:'байхгүйгээр',diff:'easy',cat:'general',lang:'ru'},
  {word:'БЕС',hint:'чөтгөр',diff:'easy',cat:'general',lang:'ru'},
  {word:'БОГ',hint:'бурхан',diff:'easy',cat:'general',lang:'ru'},
  {word:'БОД',hint:'бодол',diff:'easy',cat:'general',lang:'ru'},
  {word:'БОЙ',hint:'зодоон',diff:'easy',cat:'general',lang:'ru'},
  {word:'БОК',hint:'хажуу',diff:'easy',cat:'general',lang:'ru'},
  {word:'БОЛ',hint:'өвдөлт',diff:'easy',cat:'general',lang:'ru'},
  {word:'БОН',hint:'бон',diff:'easy',cat:'general',lang:'ru'},
  {word:'БОР',hint:'бор',diff:'easy',cat:'general',lang:'ru'},
  {word:'БОТ',hint:'бот',diff:'easy',cat:'general',lang:'ru'},
  {word:'БОЧ',hint:'хонгор',diff:'easy',cat:'general',lang:'ru'},
  {word:'БРЕ',hint:'гүрэн',diff:'easy',cat:'general',lang:'ru'},
  {word:'БУД',hint:'өдөөх',diff:'easy',cat:'general',lang:'ru'},
  {word:'БУЙ',hint:'буй',diff:'easy',cat:'general',lang:'ru'},
  {word:'БУМ',hint:'бум',diff:'easy',cat:'general',lang:'ru'},
  {word:'БУН',hint:'хувилбар',diff:'easy',cat:'general',lang:'ru'},
  {word:'БУР',hint:'хар',diff:'easy',cat:'general',lang:'ru'},
  {word:'БУС',hint:'бус',diff:'easy',cat:'general',lang:'ru'},
  {word:'БУХ',hint:'бух',diff:'easy',cat:'general',lang:'ru'},
  {word:'БЫЛ',hint:'байсан',diff:'easy',cat:'general',lang:'ru'},
  {word:'БЫТ',hint:'амьдрал',diff:'easy',cat:'general',lang:'ru'},
  {word:'ВАЗ',hint:'ваз',diff:'easy',cat:'general',lang:'ru'},
  {word:'ВАМ',hint:'танд',diff:'easy',cat:'general',lang:'ru'},
  {word:'ВАР',hint:'чанах',diff:'easy',cat:'general',lang:'ru'},
  {word:'ВАШ',hint:'таны',diff:'easy',cat:'general',lang:'ru'},
  {word:'ВЕС',hint:'жин',diff:'easy',cat:'general',lang:'ru'},
  {word:'ВИД',hint:'харагдах байдал',diff:'easy',cat:'general',lang:'ru'},
  {word:'ВИЛ',hint:'сэрээ',diff:'easy',cat:'general',lang:'ru'},
  {word:'ВИН',hint:'гэм буруу',diff:'easy',cat:'general',lang:'ru'},
  {word:'ВИС',hint:'өлгөх',diff:'easy',cat:'general',lang:'ru'},
  {word:'ВОЗ',hint:'тэрэг',diff:'easy',cat:'general',lang:'ru'},
  {word:'ВОЙ',hint:'ульгэр',diff:'easy',cat:'general',lang:'ru'},
  {word:'ВОН',hint:'тэнд',diff:'easy',cat:'general',lang:'ru'},
  {word:'ВОР',hint:'хулгайч',diff:'easy',cat:'general',lang:'ru'},
  {word:'ВОТ',hint:'ийм',diff:'easy',cat:'general',lang:'ru'},
  {word:'ВСЕ',hint:'бүгд',diff:'easy',cat:'general',lang:'ru'},
  {word:'ВСЮ',hint:'хаа сайгүй',diff:'easy',cat:'general',lang:'ru'},
  {word:'ВУЗ',hint:'их сургууль',diff:'easy',cat:'general',lang:'ru'},
  {word:'ВЫЛ',hint:'гарсан',diff:'easy',cat:'general',lang:'ru'},
  {word:'ГАЙ',hint:'гай',diff:'easy',cat:'general',lang:'ru'},
  {word:'ГАЛ',hint:'зал',diff:'easy',cat:'general',lang:'ru'},
  {word:'ГАМ',hint:'шуугиан',diff:'easy',cat:'general',lang:'ru'},
  {word:'ГАП',hint:'зай',diff:'easy',cat:'general',lang:'ru'},
  {word:'ГАС',hint:'унтрах',diff:'easy',cat:'general',lang:'ru'},
  {word:'ГДЕ',hint:'хаана',diff:'easy',cat:'general',lang:'ru'},
  {word:'ГЕЛ',hint:'гель',diff:'easy',cat:'general',lang:'ru'},
  {word:'ГЕМ',hint:'гем',diff:'easy',cat:'general',lang:'ru'},
  {word:'ГЕН',hint:'ген',diff:'easy',cat:'general',lang:'ru'},
  {word:'ГЕР',hint:'баатар',diff:'easy',cat:'general',lang:'ru'},
  {word:'ГИБ',hint:'нугалах',diff:'easy',cat:'general',lang:'ru'},
  {word:'ГИД',hint:'хөтөч',diff:'easy',cat:'general',lang:'ru'},
  {word:'ГИЛ',hint:'гильдия',diff:'easy',cat:'general',lang:'ru'},
  {word:'ГИН',hint:'жин',diff:'easy',cat:'general',lang:'ru'},
  {word:'ГОД',hint:'жил',diff:'easy',cat:'general',lang:'ru'},
  {word:'ГОЛ',hint:'гол',diff:'easy',cat:'general',lang:'ru'},
  {word:'ГОН',hint:'хөөх',diff:'easy',cat:'general',lang:'ru'},
  {word:'ГОР',hint:'уул',diff:'easy',cat:'general',lang:'ru'},
  {word:'ГОС',hint:'төр',diff:'easy',cat:'general',lang:'ru'},
  {word:'ГОЧ',hint:'гоч',diff:'easy',cat:'general',lang:'ru'},
  {word:'ГРИ',hint:'мөөг',diff:'easy',cat:'general',lang:'ru'},
  {word:'ГУЛ',hint:'гул',diff:'easy',cat:'general',lang:'ru'},
  {word:'ГУН',hint:'гун',diff:'easy',cat:'general',lang:'ru'},
  {word:'ГУС',hint:'гусь',diff:'easy',cat:'general',lang:'ru'},
  {word:'ДАЙ',hint:'өгөх',diff:'easy',cat:'general',lang:'ru'},
  {word:'ДАЛ',hint:'цааш',diff:'easy',cat:'general',lang:'ru'},
  {word:'ДАМ',hint:'далан',diff:'easy',cat:'general',lang:'ru'},
  {word:'ДАН',hint:'өгсөн',diff:'easy',cat:'general',lang:'ru'},
  {word:'ДАР',hint:'бэлэг',diff:'easy',cat:'general',lang:'ru'},
  {word:'ДАТ',hint:'огноо',diff:'easy',cat:'general',lang:'ru'},
  {word:'ДАЧ',hint:'дача',diff:'easy',cat:'general',lang:'ru'},
  {word:'ДВА',hint:'хоёр',diff:'easy',cat:'general',lang:'ru'},
  {word:'ДЕД',hint:'өвөө',diff:'easy',cat:'general',lang:'ru'},
  {word:'ДЕЛ',hint:'хэрэг',diff:'easy',cat:'general',lang:'ru'},
  {word:'ДЕН',hint:'мөнгө',diff:'easy',cat:'general',lang:'ru'},
  {word:'ДЕР',hint:'мод',diff:'easy',cat:'general',lang:'ru'},
  {word:'ДНО',hint:'ёроол',diff:'easy',cat:'general',lang:'ru'},
  {word:'ДОЖ',hint:'бороо',diff:'easy',cat:'general',lang:'ru'},
  {word:'ДОК',hint:'баримт бичиг',diff:'easy',cat:'general',lang:'ru'},
  {word:'ДОЛ',hint:'хөндий',diff:'easy',cat:'general',lang:'ru'},
  {word:'ДОП',hint:'нэмэлт',diff:'easy',cat:'general',lang:'ru'},
  {word:'ДОТ',hint:'цэг',diff:'easy',cat:'general',lang:'ru'},
  {word:'ДОХ',hint:'дохио',diff:'easy',cat:'general',lang:'ru'},
  {word:'ДУБ',hint:'үнэгч мод',diff:'easy',cat:'general',lang:'ru'},
  {word:'ДУГ',hint:'нум',diff:'easy',cat:'general',lang:'ru'},
  {word:'ДУЛ',hint:'тал',diff:'easy',cat:'general',lang:'ru'},
  {word:'ДУМ',hint:'дум',diff:'easy',cat:'general',lang:'ru'},
  {word:'ДУП',hint:'хуулбар',diff:'easy',cat:'general',lang:'ru'},
  {word:'ДУХ',hint:'сүнс',diff:'easy',cat:'general',lang:'ru'},
  {word:'ДЫМ',hint:'утаа',diff:'easy',cat:'general',lang:'ru'},
  {word:'ДЫР',hint:'нүх',diff:'easy',cat:'general',lang:'ru'},
  {word:'АВГУСТ',hint:'наймдугаар сар',diff:'medium',cat:'general',lang:'ru'},
  {word:'АВАНС',hint:'урьдчилгаа',diff:'medium',cat:'general',lang:'ru'},
  {word:'АВИЦИЯ',hint:'нисэх хүч',diff:'medium',cat:'general',lang:'ru'},
  {word:'АГЕНТ',hint:'агент',diff:'medium',cat:'general',lang:'ru'},
  {word:'АДРЕС',hint:'хаяг',diff:'medium',cat:'general',lang:'ru'},
  {word:'АЗАРТ',hint:'хурц сэтгэл',diff:'medium',cat:'general',lang:'ru'},
  {word:'АККОРД',hint:'аккорд',diff:'medium',cat:'general',lang:'ru'},
  {word:'АКТЁР',hint:'жүжигчин',diff:'medium',cat:'general',lang:'ru'},
  {word:'АКЦИЯ',hint:'хувьцаа',diff:'medium',cat:'general',lang:'ru'},
  {word:'АЛМАЗ',hint:'алмаз',diff:'medium',cat:'general',lang:'ru'},
  {word:'АЛТАРЬ',hint:'тахилын ширээ',diff:'medium',cat:'general',lang:'ru'},
  {word:'АЛЬБОМ',hint:'цомог',diff:'medium',cat:'general',lang:'ru'},
  {word:'АМБАР',hint:'агуулах',diff:'medium',cat:'general',lang:'ru'},
  {word:'АНАЛИЗ',hint:'шинжилгээ',diff:'medium',cat:'general',lang:'ru'},
  {word:'АНГЕЛ',hint:'тэнгэр элч',diff:'medium',cat:'general',lang:'ru'},
  {word:'АПРЕЛЬ',hint:'дөрөвдүгээр сар',diff:'medium',cat:'general',lang:'ru'},
  {word:'АРЕНДА',hint:'түрээс',diff:'medium',cat:'general',lang:'ru'},
  {word:'АРМИЯ',hint:'арми',diff:'medium',cat:'general',lang:'ru'},
  {word:'АРОМАТ',hint:'үнэр',diff:'medium',cat:'general',lang:'ru'},
  {word:'АРТИСТ',hint:'жүжигчин',diff:'medium',cat:'general',lang:'ru'},
  {word:'АРХИВ',hint:'архив',diff:'medium',cat:'general',lang:'ru'},
  {word:'АСПЕКТ',hint:'тал',diff:'medium',cat:'general',lang:'ru'},
  {word:'АТАКА',hint:'дайралт',diff:'medium',cat:'general',lang:'ru'},
  {word:'АТЛАС',hint:'атлас',diff:'medium',cat:'general',lang:'ru'},
  {word:'АТОМ',hint:'атом',diff:'easy',cat:'general',lang:'ru'},
  {word:'БАБОЧКА',hint:'эрвээхий',diff:'hard',cat:'general',lang:'ru'},
  {word:'БАНКЕТ',hint:'зоог',diff:'medium',cat:'general',lang:'ru'},
  {word:'БАСКЕТ',hint:'сагсан бөмбөг',diff:'medium',cat:'general',lang:'ru'},
  {word:'БАТАРЕЯ',hint:'батарей',diff:'hard',cat:'general',lang:'ru'},
  {word:'БЕЗОПАС',hint:'аюулгүй',diff:'hard',cat:'general',lang:'ru'},
  {word:'БЕСЕДА',hint:'яриа',diff:'medium',cat:'general',lang:'ru'},
  {word:'БИЗНЕС',hint:'бизнес',diff:'medium',cat:'general',lang:'ru'},
  {word:'БИЛЕТ',hint:'тийз',diff:'medium',cat:'general',lang:'ru'},
  {word:'БЛАГО',hint:'сайн',diff:'medium',cat:'general',lang:'ru'},
  {word:'БЛОКНОТ',hint:'тэмдэглэлийн дэвтэр',diff:'hard',cat:'general',lang:'ru'},
  {word:'БЛЮДО',hint:'хоол',diff:'medium',cat:'general',lang:'ru'},
  {word:'БОГАТ',hint:'баян',diff:'medium',cat:'general',lang:'ru'},
  {word:'БОРЬБА',hint:'тэмцэл',diff:'medium',cat:'general',lang:'ru'},
  {word:'БРАТ',hint:'ах',diff:'easy',cat:'general',lang:'ru'},
  {word:'БРОНЗА',hint:'хүрэл',diff:'medium',cat:'general',lang:'ru'},
  {word:'БУДУЩЕЕ',hint:'ирээдүй',diff:'hard',cat:'general',lang:'ru'},
  {word:'БУКВА',hint:'үсэг',diff:'medium',cat:'general',lang:'ru'},
  {word:'БУМАГА',hint:'цаас',diff:'medium',cat:'general',lang:'ru'},
  {word:'БУТЫЛКА',hint:'лонх',diff:'hard',cat:'general',lang:'ru'},
  {word:'ВАГОН',hint:'вагон',diff:'medium',cat:'general',lang:'ru'},
  {word:'ВАРИАНТ',hint:'хувилбар',diff:'hard',cat:'general',lang:'ru'},
  {word:'ВЕЛИК',hint:'агуу',diff:'medium',cat:'general',lang:'ru'},
  {word:'ВЕРСИЯ',hint:'хувилбар',diff:'medium',cat:'general',lang:'ru'},
  {word:'ВЗГЛЯД',hint:'харц',diff:'medium',cat:'general',lang:'ru'},
  {word:'ВИЗИТ',hint:'айлчлал',diff:'medium',cat:'general',lang:'ru'},
  {word:'ВИНОГРАД',hint:'усан үзэм',diff:'hard',cat:'general',lang:'ru'},
  {word:'ВОЗРАСТ',hint:'нас',diff:'hard',cat:'general',lang:'ru'},
  {word:'ВОЗДУХ',hint:'агаар',diff:'medium',cat:'general',lang:'ru'},
  {word:'ВОЛОСЫ',hint:'үс',diff:'medium',cat:'general',lang:'ru'},
  {word:'ВОПРОС',hint:'асуулт',diff:'medium',cat:'general',lang:'ru'},
  {word:'ВОСТОК',hint:'зүүн',diff:'medium',cat:'general',lang:'ru'},
  {word:'ВЫВОД',hint:'дүгнэлт',diff:'medium',cat:'general',lang:'ru'},
  {word:'ВЫБОР',hint:'сонголт',diff:'medium',cat:'general',lang:'ru'},
  {word:'ВЫХОД',hint:'гарц',diff:'medium',cat:'general',lang:'ru'},
  {word:'ВЯЗАНИЕ',hint:'нэхмэл',diff:'hard',cat:'general',lang:'ru'},
  {word:'ГАРАЖ',hint:'гараж',diff:'medium',cat:'general',lang:'ru'},
  {word:'ГЕРОЙСТВО',hint:'баатарлаг',diff:'expert',cat:'general',lang:'ru'},
  {word:'ГИБКИЙ',hint:'уян',diff:'medium',cat:'general',lang:'ru'},
  {word:'ГИТАРА',hint:'гитар',diff:'medium',cat:'general',lang:'ru'},
  {word:'ГОЛОВА',hint:'толгой',diff:'medium',cat:'general',lang:'ru'},
  {word:'ГОЛУБЬ',hint:'тагтаа',diff:'medium',cat:'general',lang:'ru'},
  {word:'ГОРДОСТЬ',hint:'бахархал',diff:'hard',cat:'general',lang:'ru'},
  {word:'ГОСТИНАЯ',hint:'зочны өрөө',diff:'hard',cat:'general',lang:'ru'},
  {word:'ГРАНИЦА',hint:'хил',diff:'hard',cat:'general',lang:'ru'},
  {word:'ГРЕЧКА',hint:'хэнтүүн',diff:'medium',cat:'general',lang:'ru'},
  {word:'ГРУППА',hint:'бүлэг',diff:'medium',cat:'general',lang:'ru'},
  {word:'ДАВЛЕНИЕ',hint:'даралт',diff:'hard',cat:'general',lang:'ru'},
  {word:'ДВИЖЕНИЕ',hint:'хөдөлгөөн',diff:'hard',cat:'general',lang:'ru'},
  {word:'ДЕКАБРЬ',hint:'арванхоёрдугаар сар',diff:'hard',cat:'general',lang:'ru'},
  {word:'ДЕЛЕНИЕ',hint:'хуваалт',diff:'hard',cat:'general',lang:'ru'},
  {word:'ДЕНЬГИ',hint:'мөнгө',diff:'medium',cat:'general',lang:'ru'},
  {word:'ДЕТСТВО',hint:'хүүхэд нас',diff:'hard',cat:'general',lang:'ru'},
  {word:'ДИАЛОГ',hint:'харилцан яриа',diff:'medium',cat:'general',lang:'ru'},
  {word:'ДИВАН',hint:'диван',diff:'medium',cat:'general',lang:'ru'},
  {word:'ДИПЛОМАТ',hint:'дипломатч',diff:'hard',cat:'general',lang:'ru'},
  {word:'ДОБАВКА',hint:'нэмэлт',diff:'hard',cat:'general',lang:'ru'},
  {word:'ДОБЫЧА',hint:'олдвор',diff:'medium',cat:'general',lang:'ru'},
  {word:'ДОВЕРИЕ',hint:'итгэл',diff:'hard',cat:'general',lang:'ru'},
  {word:'ДОГОВОР',hint:'гэрээ',diff:'hard',cat:'general',lang:'ru'},
  {word:'ДОЛЖНИК',hint:'өртэй хүн',diff:'hard',cat:'general',lang:'ru'},
  {word:'ДОРОЖКА',hint:'зам',diff:'hard',cat:'general',lang:'ru'},
  {word:'ДОСТУП',hint:'хандалт',diff:'medium',cat:'general',lang:'ru'},
  {word:'ДОХОД',hint:'орлого',diff:'medium',cat:'general',lang:'ru'},
  {word:'ДРУЖБА',hint:'найрамдал',diff:'medium',cat:'general',lang:'ru'},
  {word:'ДУХОВНОСТЬ',hint:'сүнслэг байдал',diff:'expert',cat:'general',lang:'ru'},
  {word:'ЕДИНИЦА',hint:'нэгж',diff:'hard',cat:'general',lang:'ru'},
  {word:'ЖУРНАЛ',hint:'сэтгүүл',diff:'medium',cat:'general',lang:'ru'},
  {word:'ЗАНЯТИЕ',hint:'хичээл',diff:'hard',cat:'general',lang:'ru'},
  {word:'ЗАПИСЬ',hint:'бичлэг',diff:'medium',cat:'general',lang:'ru'},
  {word:'ЗАЩИТА',hint:'хамгаалалт',diff:'medium',cat:'general',lang:'ru'},
  {word:'ЗДРАВИЕ',hint:'эрүүл мэнд',diff:'hard',cat:'general',lang:'ru'},
  {word:'ЗЕЛЕНЫЙ',hint:'ногоон',diff:'hard',cat:'general',lang:'ru'},
  {word:'ЗНАЧЕНИЕ',hint:'утга',diff:'hard',cat:'general',lang:'ru'},
  {word:'ЗОНТИК',hint:'шүхэр',diff:'medium',cat:'general',lang:'ru'},
  {word:'ЗРЕНИЕ',hint:'харааны чадвар',diff:'medium',cat:'general',lang:'ru'},
  {word:'ИГРУШКА',hint:'тоглоом',diff:'hard',cat:'general',lang:'ru'},
  {word:'ИНТЕРЕС',hint:'сонирхол',diff:'hard',cat:'general',lang:'ru'},
  {word:'ИСКУССТВО',hint:'урлаг',diff:'expert',cat:'general',lang:'ru'},
  {word:'ИСПЫТАНИЕ',hint:'туршилт',diff:'expert',cat:'general',lang:'ru'},
  {word:'КАРМАН',hint:'халаас',diff:'medium',cat:'general',lang:'ru'},
  {word:'КАЧЕСТВО',hint:'чанар',diff:'hard',cat:'general',lang:'ru'},
  {word:'КЛЕТКА',hint:'нүд',diff:'medium',cat:'general',lang:'ru'},
  {word:'КОЛЛЕГА',hint:'хамтран ажилладаг хүн',diff:'hard',cat:'general',lang:'ru'},
  {word:'КОМНАТА',hint:'өрөө',diff:'hard',cat:'general',lang:'ru'},
  {word:'КРАСОТА',hint:'үзэсгэлэн',diff:'hard',cat:'general',lang:'ru'},
  {word:'КРОВАТЬ',hint:'ор',diff:'hard',cat:'general',lang:'ru'},
  {word:'ЛЕСТНИЦА',hint:'шат',diff:'hard',cat:'general',lang:'ru'},
  {word:'ЛИЧНОСТЬ',hint:'хувь хүн',diff:'hard',cat:'general',lang:'ru'},
  {word:'МАГАЗИН',hint:'дэлгүүр',diff:'hard',cat:'general',lang:'ru'},
  {word:'МАРШРУТ',hint:'чиглэл',diff:'hard',cat:'general',lang:'ru'},
  {word:'АВТОР',hint:'зохиогч',diff:'medium',cat:'general',lang:'ru'},
  {word:'АГРЕССИЯ',hint:'түрэмгийлэл',diff:'hard',cat:'general',lang:'ru'},
  {word:'АКАДЕМИК',hint:'академич',diff:'hard',cat:'general',lang:'ru'},
  {word:'АКТИВНОСТЬ',hint:'идэвхтэй байдал',diff:'expert',cat:'general',lang:'ru'},
  {word:'АНАЛИТИК',hint:'аналитикч',diff:'hard',cat:'general',lang:'ru'},
  {word:'АНКЕТА',hint:'маягт',diff:'medium',cat:'general',lang:'ru'},
  {word:'АНТЕННА',hint:'антен',diff:'hard',cat:'general',lang:'ru'},
  {word:'АРХИТЕКТУ',hint:'архитектур',diff:'expert',cat:'general',lang:'ru'},
  {word:'АТТЕСТАТ',hint:'гэрчилгээ',diff:'hard',cat:'general',lang:'ru'},
  {word:'АУДИТОРИЯ',hint:'үзэгч',diff:'expert',cat:'general',lang:'ru'},
  {word:'АВТОРИТЕТ',hint:'эрх мэдэл',diff:'expert',cat:'general',lang:'ru'},
  {word:'БЕЗОПАСНОСТЬ',hint:'аюулгүй байдал',diff:'expert',cat:'general',lang:'ru'},
  {word:'БИБЛИОТЕКА',hint:'номын сан',diff:'expert',cat:'general',lang:'ru'},
  {word:'БЛАГОДАРНОСТЬ',hint:'талархал',diff:'expert',cat:'general',lang:'ru'},
  {word:'ВЗАИМОДЕЙСТВИЕ',hint:'харилцан үйлчлэл',diff:'expert',cat:'general',lang:'ru'},
  {word:'ВОЗНАГРАЖДЕНИЕ',hint:'шагнал',diff:'expert',cat:'general',lang:'ru'},
  {word:'ВОЛОНТЁР',hint:'сайн дурынхан',diff:'hard',cat:'general',lang:'ru'},
  {word:'ВЫЖИВАЕМОСТЬ',hint:'тэвчих чадвар',diff:'expert',cat:'general',lang:'ru'},
  {word:'ГРАЖДАНСТВО',hint:'иргэншил',diff:'expert',cat:'general',lang:'ru'},
  {word:'ДЕМОКРАТИЯ',hint:'ардчилал',diff:'expert',cat:'general',lang:'ru'},
  {word:'ДОСТОИНСТВО',hint:'нэр төр',diff:'expert',cat:'general',lang:'ru'},
  {word:'ДУХОВНОСТЬ',hint:'сүнслэг байдал',diff:'expert',cat:'general',lang:'ru'},
  {word:'ЕДИНОМЫШЛЕННИК',hint:'нэг үзэлтэн',diff:'expert',cat:'general',lang:'ru'},
  {word:'ЖЕРТВОПРИНОШЕНИЕ',hint:'тахил',diff:'expert',cat:'general',lang:'ru'},
  {word:'ЗАКОНОДАТЕЛЬСТВО',hint:'хууль тогтоомж',diff:'expert',cat:'general',lang:'ru'},
  {word:'ЗАЩИТНИК',hint:'хамгаалагч',diff:'hard',cat:'general',lang:'ru'},
  {word:'ЗДРАВООХРАНЕНИЕ',hint:'эрүүл мэнд',diff:'expert',cat:'general',lang:'ru'},
  {word:'ЗНАЧИМОСТЬ',hint:'чухал байдал',diff:'expert',cat:'general',lang:'ru'},
  {word:'ИССЛЕДОВАТЕЛЬ',hint:'судлаач',diff:'expert',cat:'general',lang:'ru'},
  {word:'КВАЛИФИКАЦИЯ',hint:'мэргэшил',diff:'expert',cat:'general',lang:'ru'},
  {word:'КОНКУРЕНТОСПОСОБНОСТЬ',hint:'өрсөлдөх чадвар',diff:'expert',cat:'general',lang:'ru'},
  {word:'КООРДИНАЦИЯ',hint:'зохицуулалт',diff:'expert',cat:'general',lang:'ru'},
  {word:'ЛИДЕРСТВО',hint:'удирдлага',diff:'expert',cat:'general',lang:'ru'},
  {word:'МЕЖДУНАРОДНЫЙ',hint:'олон улсын',diff:'expert',cat:'general',lang:'ru'},
  {word:'МЕТОДОЛОГИЯ',hint:'арга зүй',diff:'expert',cat:'general',lang:'ru'},
  {word:'МОДЕРНИЗАЦИЯ',hint:'орчинчлол',diff:'expert',cat:'general',lang:'ru'},
  {word:'НАБЛЮДЕНИЕ',hint:'ажиглалт',diff:'expert',cat:'general',lang:'ru'},
  {word:'НАПРАВЛЕННОСТЬ',hint:'чиглэл',diff:'expert',cat:'general',lang:'ru'},
  {word:'НАЦИОНАЛЬНОСТЬ',hint:'үндэс',diff:'expert',cat:'general',lang:'ru'},
  {word:'ОБРАЗОВАНИЕ',hint:'боловсрол',diff:'expert',cat:'general',lang:'ru'},
  {word:'ОГРАНИЧЕНИЕ',hint:'хязгаарлалт',diff:'expert',cat:'general',lang:'ru'},
  {word:'ОРГАНИЗОВАННОСТЬ',hint:'зохион байгуулалт',diff:'expert',cat:'general',lang:'ru'},
  {word:'ОТВЕТСТВЕННОСТЬ',hint:'хариуцлага',diff:'expert',cat:'general',lang:'ru'},
  {word:'ПЕРСПЕКТИВА',hint:'ирээдүй',diff:'expert',cat:'general',lang:'ru'},
  {word:'ПЛАНИРОВАНИЕ',hint:'төлөвлөлт',diff:'expert',cat:'general',lang:'ru'},
  {word:'ПОДГОТОВКА',hint:'бэлтгэл',diff:'expert',cat:'general',lang:'ru'},
  {word:'ПОЛИТИКА',hint:'улс төр',diff:'hard',cat:'general',lang:'ru'},
  {word:'ПРАКТИКА',hint:'дадлага',diff:'hard',cat:'general',lang:'ru'},
  {word:'ПРЕДПРИНИМАТЕЛЬСТВО',hint:'аж ахуй эрхлэх',diff:'expert',cat:'general',lang:'ru'},
  {word:'ПРИОРИТЕТ',hint:'тэргүүлэх чиглэл',diff:'expert',cat:'general',lang:'ru'},
  {word:'ПРОФЕССИОНАЛИЗМ',hint:'мэргэжлийн байдал',diff:'expert',cat:'general',lang:'ru'},
  {word:'РАЗВИТИЕ',hint:'хөгжил',diff:'hard',cat:'general',lang:'ru'},
  {word:'РЕАЛИЗАЦИЯ',hint:'хэрэгжүүлэлт',diff:'expert',cat:'general',lang:'ru'},
  {word:'РЕЗУЛЬТАТИВНОСТЬ',hint:'үр дүнтэй байдал',diff:'expert',cat:'general',lang:'ru'},
  {word:'САМОРЕАЛИЗАЦИЯ',hint:'өөрийгөө илэрхийлэх',diff:'expert',cat:'general',lang:'ru'},
  {word:'САМОСТОЯТЕЛЬНОСТЬ',hint:'бие даасан байдал',diff:'expert',cat:'general',lang:'ru'},
  {word:'СОЦИАЛЬНОСТЬ',hint:'нийгмийн байдал',diff:'expert',cat:'general',lang:'ru'},
  {word:'СТАБИЛЬНОСТЬ',hint:'тогтвортой байдал',diff:'expert',cat:'general',lang:'ru'},
  {word:'СТРАТЕГИЯ',hint:'стратеги',diff:'expert',cat:'general',lang:'ru'},
  {word:'ТВОРЧЕСТВО',hint:'бүтээлч байдал',diff:'expert',cat:'general',lang:'ru'},
  {word:'ТЕХНОЛОГИЯ',hint:'технологи',diff:'expert',cat:'general',lang:'ru'},
  {word:'УВАЖЕНИЕ',hint:'хүндэтгэл',diff:'hard',cat:'general',lang:'ru'},
  {word:'УПРАВЛЕНИЕ',hint:'удирдлага',diff:'expert',cat:'general',lang:'ru'},
  {word:'УСТОЙЧИВОСТЬ',hint:'тогтвортой байдал',diff:'expert',cat:'general',lang:'ru'},
  {word:'ФИНАНСИРОВАНИЕ',hint:'санхүүжилт',diff:'expert',cat:'general',lang:'ru'},
  {word:'ХАРАКТЕРИСТИКА',hint:'шинж чанар',diff:'expert',cat:'general',lang:'ru'},
  {word:'ЦЕЛЕНАПРАВЛЕННОСТЬ',hint:'зорилготой байдал',diff:'expert',cat:'general',lang:'ru'},
  {word:'ЭФФЕКТИВНОСТЬ',hint:'үр ашигтай байдал',diff:'expert',cat:'general',lang:'ru'}
];

const RU_WORD_DATA=[
  {word:'КОТ',hint:'муур',diff:'easy',cat:'general',lang:'ru'},
  {word:'ПЁС',hint:'нохой',diff:'easy',cat:'general',lang:'ru'},
  {word:'ДОМ',hint:'байшин',diff:'easy',cat:'general',lang:'ru'},
  {word:'СОН',hint:'зүүд',diff:'easy',cat:'general',lang:'ru'},
  {word:'РОТ',hint:'ам',diff:'easy',cat:'general',lang:'ru'},
  {word:'НОС',hint:'хамар',diff:'easy',cat:'general',lang:'ru'},
  {word:'УХО',hint:'чих',diff:'easy',cat:'general',lang:'ru'},
  {word:'ВЕК',hint:'зуун',diff:'easy',cat:'general',lang:'ru'},
  {word:'БОГ',hint:'бурхан',diff:'easy',cat:'general',lang:'ru'},
  {word:'ЛЁД',hint:'мөс',diff:'easy',cat:'general',lang:'ru'},
  {word:'МЕЧ',hint:'сэлэм',diff:'easy',cat:'general',lang:'ru'},
  {word:'ЛУК',hint:'сонгино',diff:'easy',cat:'general',lang:'ru'},
  {word:'РАК',hint:'хавч',diff:'easy',cat:'general',lang:'ru'},
  {word:'ВОЛ',hint:'үхэр',diff:'easy',cat:'general',lang:'ru'},
  {word:'ЛЕС',hint:'ой',diff:'easy',cat:'general',lang:'ru'},
  {word:'МОХ',hint:'хаг',diff:'easy',cat:'general',lang:'ru'},
  {word:'РОЙ',hint:'сүрэг',diff:'easy',cat:'general',lang:'ru'},
  {word:'СОК',hint:'шүүс',diff:'easy',cat:'general',lang:'ru'},
  {word:'ТОК',hint:'гүйдэл',diff:'easy',cat:'general',lang:'ru'},
  {word:'ЧАЙ',hint:'цай',diff:'easy',cat:'general',lang:'ru'},
  {word:'ШАГ',hint:'алхам',diff:'easy',cat:'general',lang:'ru'},
  {word:'ЮГ',hint:'өмнөд',diff:'easy',cat:'general',lang:'ru'},
  {word:'ЯД',hint:'хор',diff:'easy',cat:'general',lang:'ru'},
  {word:'БАЛ',hint:'зөгийн бал',diff:'easy',cat:'general',lang:'ru'},
  {word:'ВАЛ',hint:'далан',diff:'easy',cat:'general',lang:'ru'},
  {word:'ГАЗ',hint:'хий',diff:'easy',cat:'general',lang:'ru'},
  {word:'ДАЧ',hint:'дача',diff:'easy',cat:'general',lang:'ru'},
  {word:'ЕЛЬ',hint:'гацуур',diff:'easy',cat:'general',lang:'ru'},
  {word:'ЖАР',hint:'халуун',diff:'easy',cat:'general',lang:'ru'},
  {word:'ЗАЛ',hint:'танхим',diff:'easy',cat:'general',lang:'ru'},
  {word:'КАЛ',hint:'бохир',diff:'easy',cat:'general',lang:'ru'},
  {word:'МАЛ',hint:'жижиг',diff:'easy',cat:'general',lang:'ru'},
  {word:'НАЛ',hint:'татвар',diff:'easy',cat:'general',lang:'ru'},
  {word:'ПАЛ',hint:'шатах',diff:'easy',cat:'general',lang:'ru'},
  {word:'САД',hint:'цэцэрлэг',diff:'easy',cat:'general',lang:'ru'},
  {word:'ТАЗ',hint:'аарц',diff:'easy',cat:'general',lang:'ru'},
  {word:'УАЗ',hint:'авто',diff:'easy',cat:'general',lang:'ru'},
  {word:'ФАЗ',hint:'фаз',diff:'easy',cat:'general',lang:'ru'},
  {word:'ХАН',hint:'хаан',diff:'easy',cat:'general',lang:'ru'},
  {word:'ЦАП',hint:'гахай',diff:'easy',cat:'general',lang:'ru'},
  {word:'ГОРА',hint:'уул',diff:'easy',cat:'general',lang:'ru'},
  {word:'ДОЧЬ',hint:'охин',diff:'easy',cat:'general',lang:'ru'},
  {word:'ЖИЗНЬ',hint:'амьдрал',diff:'medium',cat:'general',lang:'ru'},
  {word:'ЗИМА',hint:'өвөл',diff:'easy',cat:'general',lang:'ru'},
  {word:'КИНО',hint:'кино',diff:'easy',cat:'general',lang:'ru'},
  {word:'ЛЕТО',hint:'зун',diff:'easy',cat:'general',lang:'ru'},
  {word:'ЛУНА',hint:'сар',diff:'easy',cat:'general',lang:'ru'},
  {word:'МАТЬ',hint:'эх',diff:'easy',cat:'general',lang:'ru'},
  {word:'НЕБО',hint:'тэнгэр',diff:'easy',cat:'general',lang:'ru'},
  {word:'НОГА',hint:'хөл',diff:'easy',cat:'general',lang:'ru'},
  {word:'НОЧЬ',hint:'шөнө',diff:'easy',cat:'general',lang:'ru'},
  {word:'ОГОНЬ',hint:'гал',diff:'medium',cat:'general',lang:'ru'},
  {word:'ОСЕНЬ',hint:'намар',diff:'medium',cat:'general',lang:'ru'},
  {word:'ОТЕЦ',hint:'эцэг',diff:'easy',cat:'general',lang:'ru'},
  {word:'ПИТЬ',hint:'уух',diff:'easy',cat:'general',lang:'ru'},
  {word:'РУКА',hint:'гар',diff:'easy',cat:'general',lang:'ru'},
  {word:'РЫБА',hint:'загас',diff:'easy',cat:'general',lang:'ru'},
  {word:'СВЕТ',hint:'гэрэл',diff:'easy',cat:'general',lang:'ru'},
  {word:'СНЕГ',hint:'цас',diff:'easy',cat:'general',lang:'ru'},
  {word:'СОЛЬ',hint:'давс',diff:'easy',cat:'general',lang:'ru'},
  {word:'СТОЛ',hint:'ширээ',diff:'easy',cat:'general',lang:'ru'},
  {word:'СТУЛ',hint:'сандал',diff:'easy',cat:'general',lang:'ru'},
  {word:'СЫТЬ',hint:'цатгах',diff:'easy',cat:'general',lang:'ru'},
  {word:'ХЛЕБ',hint:'талх',diff:'easy',cat:'general',lang:'ru'},
  {word:'ЦВЕТ',hint:'өнгө',diff:'easy',cat:'general',lang:'ru'},
  {word:'ЯЙЦО',hint:'өндөг',diff:'easy',cat:'general',lang:'ru'},
  {word:'ЗЕМЛЯ',hint:'газар',diff:'medium',cat:'general',lang:'ru'},
  {word:'КОШКА',hint:'муур',diff:'medium',cat:'general',lang:'ru'},
  {word:'СОБАКА',hint:'нохой',diff:'medium',cat:'general',lang:'ru'},
  {word:'ВОДА',hint:'ус',diff:'easy',cat:'general',lang:'ru'},
  {word:'МЯСО',hint:'мах',diff:'easy',cat:'general',lang:'ru'},
  {word:'МОЛОКО',hint:'сүү',diff:'medium',cat:'general',lang:'ru'},
  {word:'МАСЛО',hint:'тос',diff:'medium',cat:'general',lang:'ru'},
  {word:'САХАР',hint:'элсэн чихэр',diff:'medium',cat:'general',lang:'ru'},
  {word:'КОФЕ',hint:'кофе',diff:'easy',cat:'general',lang:'ru'},
  {word:'ОКНО',hint:'цонх',diff:'easy',cat:'general',lang:'ru'},
  {word:'ДВЕРЬ',hint:'хаалга',diff:'medium',cat:'general',lang:'ru'},
  {word:'КНИГА',hint:'ном',diff:'medium',cat:'general',lang:'ru'},
  {word:'РУЧКА',hint:'үзэг',diff:'medium',cat:'general',lang:'ru'},
  {word:'ШКОЛА',hint:'сургууль',diff:'medium',cat:'general',lang:'ru'},
  {word:'БЕРЕГ',hint:'эрэг',diff:'medium',cat:'general',lang:'ru'},
  {word:'ВЕСНА',hint:'хавар',diff:'medium',cat:'general',lang:'ru'},
  {word:'ВЕТЕР',hint:'салхи',diff:'medium',cat:'general',lang:'ru'},
  {word:'ВЕЧЕР',hint:'орой',diff:'medium',cat:'general',lang:'ru'},
  {word:'ВЛАСТЬ',hint:'эрх мэдэл',diff:'medium',cat:'general',lang:'ru'},
  {word:'ВОЛНА',hint:'долгион',diff:'medium',cat:'general',lang:'ru'},
  {word:'ВРЕМЯ',hint:'цаг хугацаа',diff:'medium',cat:'general',lang:'ru'},
  {word:'ГОЛОС',hint:'дуу хоолой',diff:'medium',cat:'general',lang:'ru'},
  {word:'ГОРОД',hint:'хот',diff:'medium',cat:'general',lang:'ru'},
  {word:'ГОСТЬ',hint:'зочин',diff:'medium',cat:'general',lang:'ru'},
  {word:'ДОРОГА',hint:'зам',diff:'medium',cat:'general',lang:'ru'},
  {word:'ДРУГОЙ',hint:'өөр',diff:'medium',cat:'general',lang:'ru'},
  {word:'ЕДИНЫЙ',hint:'нэгдсэн',diff:'medium',cat:'general',lang:'ru'},
  {word:'ЖИЗНЬ',hint:'амьдрал',diff:'medium',cat:'general',lang:'ru'},
  {word:'ЗАВТРА',hint:'маргааш',diff:'medium',cat:'general',lang:'ru'},
  {word:'ЗДАНИЕ',hint:'барилга',diff:'medium',cat:'general',lang:'ru'},
  {word:'ЗЕРКАЛО',hint:'толь',diff:'hard',cat:'general',lang:'ru'},
  {word:'ЗЕМЛЯ',hint:'дэлхий',diff:'medium',cat:'general',lang:'ru'},
  {word:'ЗОЛОТО',hint:'алт',diff:'medium',cat:'general',lang:'ru'},
  {word:'ЗУБЫ',hint:'шүд',diff:'easy',cat:'general',lang:'ru'},
  {word:'ИГРАТЬ',hint:'тоглох',diff:'medium',cat:'general',lang:'ru'},
  {word:'ИМЯ',hint:'нэр',diff:'easy',cat:'general',lang:'ru'},
  {word:'ИМЕТЬ',hint:'байх',diff:'medium',cat:'general',lang:'ru'},
  {word:'ИСКАТЬ',hint:'хайх',diff:'medium',cat:'general',lang:'ru'},
  {word:'ИСТОРИЯ',hint:'түүх',diff:'hard',cat:'general',lang:'ru'},
  {word:'КИНО',hint:'кино',diff:'easy',cat:'general',lang:'ru'},
  {word:'КЛУБ',hint:'клуб',diff:'easy',cat:'general',lang:'ru'},
  {word:'КНИГА',hint:'ном',diff:'medium',cat:'general',lang:'ru'},
  {word:'КОНЕЦ',hint:'төгсгөл',diff:'medium',cat:'general',lang:'ru'},
  {word:'КРОВЬ',hint:'цус',diff:'medium',cat:'general',lang:'ru'},
  {word:'КУЛАК',hint:'нударга',diff:'medium',cat:'general',lang:'ru'},
  {word:'ЛИЦО',hint:'нүүр',diff:'easy',cat:'general',lang:'ru'},
  {word:'ЛОДКА',hint:'завь',diff:'medium',cat:'general',lang:'ru'},
  {word:'МЕЧТА',hint:'мөрөөдөл',diff:'medium',cat:'general',lang:'ru'},
  {word:'МИНУТА',hint:'минут',diff:'medium',cat:'general',lang:'ru'},
  {word:'МИРНЫЙ',hint:'энхтайван',diff:'medium',cat:'general',lang:'ru'},
  {word:'МНОГО',hint:'олон',diff:'medium',cat:'general',lang:'ru'},
  {word:'МОСТ',hint:'гүүр',diff:'easy',cat:'general',lang:'ru'},
  {word:'МУЗЫКА',hint:'хөгжим',diff:'medium',cat:'general',lang:'ru'},
  {word:'НАРОД',hint:'ард түмэн',diff:'medium',cat:'general',lang:'ru'},
  {word:'НАЧАЛО',hint:'эхлэл',diff:'medium',cat:'general',lang:'ru'},
  {word:'НЕБЕСНЫЙ',hint:'тэнгэрийн',diff:'hard',cat:'general',lang:'ru'},
  {word:'НОВЫЙ',hint:'шинэ',diff:'medium',cat:'general',lang:'ru'},
  {word:'ОБЛАКО',hint:'үүл',diff:'medium',cat:'general',lang:'ru'},
  {word:'ОБРАЗ',hint:'дүр',diff:'medium',cat:'general',lang:'ru'},
  {word:'ОБУВЬ',hint:'гутал',diff:'medium',cat:'general',lang:'ru'},
  {word:'ОГОРОД',hint:'хүрээлэн',diff:'medium',cat:'general',lang:'ru'},
  {word:'ОЗЕРО',hint:'нуур',diff:'medium',cat:'general',lang:'ru'},
  {word:'ОПЫТ',hint:'туршлага',diff:'easy',cat:'general',lang:'ru'},
  {word:'ОРЁЛ',hint:'бүргэд',diff:'easy',cat:'general',lang:'ru'},
  {word:'ОСТРОВ',hint:'арал',diff:'medium',cat:'general',lang:'ru'},
  {word:'ОТДЫХ',hint:'амралт',diff:'medium',cat:'general',lang:'ru'},
  {word:'ОЦЕНКА',hint:'үнэлгээ',diff:'medium',cat:'general',lang:'ru'},
  {word:'ПАМЯТЬ',hint:'ой санамж',diff:'medium',cat:'general',lang:'ru'},
  {word:'ПЕСНЯ',hint:'дуу',diff:'medium',cat:'general',lang:'ru'},
  {word:'ПИСЬМО',hint:'захидал',diff:'medium',cat:'general',lang:'ru'},
  {word:'ПОБЕДА',hint:'ялалт',diff:'medium',cat:'general',lang:'ru'},
  {word:'ПОГОДА',hint:'цаг агаар',diff:'medium',cat:'general',lang:'ru'},
  {word:'ПОЕЗД',hint:'галт тэрэг',diff:'medium',cat:'general',lang:'ru'},
  {word:'ПОМОЩЬ',hint:'тусламж',diff:'medium',cat:'general',lang:'ru'},
  {word:'ПРАВДА',hint:'үнэн',diff:'medium',cat:'general',lang:'ru'},
  {word:'ПРАЗДНИК',hint:'баяр',diff:'hard',cat:'general',lang:'ru'},
  {word:'ПРИВЕТ',hint:'сайн уу',diff:'medium',cat:'general',lang:'ru'},
  {word:'ПРИРОДА',hint:'байгаль',diff:'hard',cat:'general',lang:'ru'},
  {word:'РАБОТА',hint:'ажил',diff:'medium',cat:'general',lang:'ru'},
  {word:'РАДОСТЬ',hint:'баяр хөөр',diff:'hard',cat:'general',lang:'ru'},
  {word:'РЕКА',hint:'гол',diff:'easy',cat:'general',lang:'ru'},
  {word:'РЕБЁНОК',hint:'хүүхэд',diff:'hard',cat:'general',lang:'ru'},
  {word:'РОДИНА',hint:'эх орон',diff:'medium',cat:'general',lang:'ru'},
  {word:'РОССИЯ',hint:'Орос',diff:'medium',cat:'general',lang:'ru'},
  {word:'РЫНОК',hint:'зах',diff:'medium',cat:'general',lang:'ru'},
  {word:'СВОБОДА',hint:'эрх чөлөө',diff:'hard',cat:'general',lang:'ru'},
  {word:'СЕРДЦЕ',hint:'зүрх',diff:'medium',cat:'general',lang:'ru'},
  {word:'СЕМЬЯ',hint:'гэр бүл',diff:'medium',cat:'general',lang:'ru'},
  {word:'СЛОВО',hint:'үг',diff:'medium',cat:'general',lang:'ru'},
  {word:'СМЕРТЬ',hint:'үхэл',diff:'medium',cat:'general',lang:'ru'},
  {word:'СОЛНЦЕ',hint:'нар',diff:'medium',cat:'general',lang:'ru'},
  {word:'СОСЕД',hint:'хөрш',diff:'medium',cat:'general',lang:'ru'},
  {word:'СПОРТ',hint:'спорт',diff:'medium',cat:'general',lang:'ru'},
  {word:'СТРАНА',hint:'улс',diff:'medium',cat:'general',lang:'ru'},
  {word:'СТРОИТЬ',hint:'барих',diff:'hard',cat:'general',lang:'ru'},
  {word:'СУДЬБА',hint:'хувь тавилан',diff:'medium',cat:'general',lang:'ru'},
  {word:'СЧАСТЬЕ',hint:'аз жаргал',diff:'hard',cat:'general',lang:'ru'},
  {word:'ТЕАТР',hint:'театр',diff:'medium',cat:'general',lang:'ru'},
  {word:'ТЕЛЕФОН',hint:'утас',diff:'hard',cat:'general',lang:'ru'},
  {word:'ТЕПЛО',hint:'дулаан',diff:'medium',cat:'general',lang:'ru'},
  {word:'ТИХИЙ',hint:'чимээгүй',diff:'medium',cat:'general',lang:'ru'},
  {word:'ТОВАР',hint:'бараа',diff:'medium',cat:'general',lang:'ru'},
  {word:'ТРУД',hint:'хөдөлмөр',diff:'easy',cat:'general',lang:'ru'},
  {word:'ТУЧИ',hint:'үүл',diff:'easy',cat:'general',lang:'ru'},
  {word:'УТРОМ',hint:'өглөө',diff:'medium',cat:'general',lang:'ru'},
  {word:'УЧЁБА',hint:'суралцах',diff:'medium',cat:'general',lang:'ru'},
  {word:'ЦВЕТ',hint:'өнгө',diff:'easy',cat:'general',lang:'ru'},
  {word:'ЦЕЛЬ',hint:'зорилго',diff:'easy',cat:'general',lang:'ru'},
  {word:'ЧАСТЬ',hint:'хэсэг',diff:'medium',cat:'general',lang:'ru'},
  {word:'АВТОБУС',hint:'автобус',diff:'hard',cat:'general',lang:'ru'},
  {word:'АКАДЕМИЯ',hint:'академи',diff:'hard',cat:'general',lang:'ru'},
  {word:'АРМИЯ',hint:'арми',diff:'medium',cat:'general',lang:'ru'},
  {word:'АЭРОПОРТ',hint:'нисэх онгоцны буудал',diff:'hard',cat:'general',lang:'ru'},
  {word:'БИБЛИОТЕКА',hint:'номын сан',diff:'expert',cat:'general',lang:'ru'},
  {word:'БОЛЬНИЦА',hint:'эмнэлэг',diff:'hard',cat:'general',lang:'ru'},
  {word:'БРАТ',hint:'ах',diff:'easy',cat:'general',lang:'ru'},
  {word:'ВОЙНА',hint:'дайн',diff:'medium',cat:'general',lang:'ru'},
  {word:'ВОПРОС',hint:'асуулт',diff:'medium',cat:'general',lang:'ru'},
  {word:'ВОСТОК',hint:'зүүн',diff:'medium',cat:'general',lang:'ru'},
  {word:'ГАРАНТИЯ',hint:'баталгаа',diff:'hard',cat:'general',lang:'ru'},
  {word:'ГРАНИЦА',hint:'хил',diff:'hard',cat:'general',lang:'ru'},
  {word:'ДВИЖЕНИЕ',hint:'хөдөлгөөн',diff:'hard',cat:'general',lang:'ru'},
  {word:'ДЕРЕВНЯ',hint:'тосгон',diff:'hard',cat:'general',lang:'ru'},
  {word:'ДОГОВОР',hint:'гэрээ',diff:'hard',cat:'general',lang:'ru'},
  {word:'ДОЛЖНОСТЬ',hint:'албан тушаал',diff:'expert',cat:'general',lang:'ru'},
  {word:'ЖИВОТНОЕ',hint:'амьтан',diff:'hard',cat:'general',lang:'ru'},
  {word:'ЗДОРОВЬЕ',hint:'эрүүл мэнд',diff:'hard',cat:'general',lang:'ru'},
  {word:'ЗНАНИЕ',hint:'мэдлэг',diff:'medium',cat:'general',lang:'ru'},
  {word:'ЗООПАРК',hint:'амьтны хүрээлэн',diff:'hard',cat:'general',lang:'ru'},
  {word:'ИНТЕРНЕТ',hint:'интернет',diff:'hard',cat:'general',lang:'ru'},
  {word:'ИСТОРИЯ',hint:'түүх',diff:'hard',cat:'general',lang:'ru'},
  {word:'КАПИТАН',hint:'ахлагч',diff:'hard',cat:'general',lang:'ru'},
  {word:'КАРАНДАШ',hint:'харандаа',diff:'hard',cat:'general',lang:'ru'},
  {word:'КОМАНДА',hint:'баг',diff:'hard',cat:'general',lang:'ru'},
  {word:'КОМПАНИЯ',hint:'компани',diff:'hard',cat:'general',lang:'ru'},
  {word:'КОНКУРС',hint:'тэмцээн',diff:'hard',cat:'general',lang:'ru'},
  {word:'КОНТРАКТ',hint:'гэрээ',diff:'hard',cat:'general',lang:'ru'},
  {word:'КУЛЬТУРА',hint:'соёл',diff:'hard',cat:'general',lang:'ru'},
  {word:'ЛАУРЕАТ',hint:'лауреат',diff:'hard',cat:'general',lang:'ru'},
  {word:'МАГАЗИН',hint:'дэлгүүр',diff:'hard',cat:'general',lang:'ru'},
  {word:'МАРШРУТ',hint:'чиглэл',diff:'hard',cat:'general',lang:'ru'},
  {word:'МАШИНА',hint:'машин',diff:'medium',cat:'general',lang:'ru'},
  {word:'МЕДИЦИНА',hint:'анагаах ухаан',diff:'hard',cat:'general',lang:'ru'},
  {word:'МИНИСТР',hint:'сайд',diff:'hard',cat:'general',lang:'ru'},
  {word:'МУЗЕЙ',hint:'музей',diff:'medium',cat:'general',lang:'ru'},
  {word:'НАСЕЛЕНИЕ',hint:'хүн ам',diff:'expert',cat:'general',lang:'ru'},
  {word:'НАУКА',hint:'шинжлэх ухаан',diff:'medium',cat:'general',lang:'ru'},
  {word:'ОБРАЗОВАНИЕ',hint:'боловсрол',diff:'expert',cat:'general',lang:'ru'},
  {word:'ОБЩЕСТВО',hint:'нийгэм',diff:'hard',cat:'general',lang:'ru'},
  {word:'ОТКРЫТИЕ',hint:'нээлт',diff:'hard',cat:'general',lang:'ru'},
  {word:'ОТНОШЕНИЕ',hint:'харилцаа',diff:'expert',cat:'general',lang:'ru'},
  {word:'ПАМЯТНИК',hint:'дурсгал',diff:'hard',cat:'general',lang:'ru'},
  {word:'ПЕНСИЯ',hint:'тэтгэвэр',diff:'medium',cat:'general',lang:'ru'},
  {word:'ПОГОДА',hint:'цаг агаар',diff:'medium',cat:'general',lang:'ru'},
  {word:'ПОЛИТИКА',hint:'улс төр',diff:'hard',cat:'general',lang:'ru'},
  {word:'ПОСОЛЬСТВО',hint:'элчин сайдын яам',diff:'expert',cat:'general',lang:'ru'},
  {word:'ПРАВИЛО',hint:'дүрэм',diff:'hard',cat:'general',lang:'ru'},
  {word:'ПРЕЗИДЕНТ',hint:'ерөнхийлөгч',diff:'expert',cat:'general',lang:'ru'},
  {word:'ПРИРОДА',hint:'байгаль',diff:'hard',cat:'general',lang:'ru'},
  {word:'ПРОБЛЕМА',hint:'асуудал',diff:'hard',cat:'general',lang:'ru'},
  {word:'ПРОГРАММА',hint:'хөтөлбөр',diff:'expert',cat:'general',lang:'ru'},
  {word:'ПРОФЕССИЯ',hint:'мэргэжил',diff:'expert',cat:'general',lang:'ru'},
  {word:'РАЗВИТИЕ',hint:'хөгжил',diff:'hard',cat:'general',lang:'ru'},
  {word:'РЕШЕНИЕ',hint:'шийдвэр',diff:'hard',cat:'general',lang:'ru'},
  {word:'РОДИТЕЛИ',hint:'эцэг эх',diff:'hard',cat:'general',lang:'ru'},
  {word:'РОССИЯНИН',hint:'орос хүн',diff:'expert',cat:'general',lang:'ru'},
  {word:'РЫБОЛОВ',hint:'загасчин',diff:'hard',cat:'general',lang:'ru'},
  {word:'САМОЛЁТ',hint:'онгоц',diff:'hard',cat:'general',lang:'ru'},
  {word:'СВИДАНИЕ',hint:'уулзалт',diff:'hard',cat:'general',lang:'ru'},
  {word:'СИСТЕМА',hint:'систем',diff:'hard',cat:'general',lang:'ru'},
  {word:'СЛОВАРЬ',hint:'толь бичиг',diff:'hard',cat:'general',lang:'ru'},
  {word:'СОБЫТИЕ',hint:'үйл явдал',diff:'hard',cat:'general',lang:'ru'},
  {word:'СОЛДАТ',hint:'цэрэг',diff:'medium',cat:'general',lang:'ru'},
  {word:'СОТРУДНИК',hint:'ажилтан',diff:'expert',cat:'general',lang:'ru'},
  {word:'СПЕЦИАЛИСТ',hint:'мэргэжилтэн',diff:'expert',cat:'general',lang:'ru'},
  {word:'СТАДИОН',hint:'стадион',diff:'hard',cat:'general',lang:'ru'},
  {word:'СТРОИТЕЛЬ',hint:'барилгачин',diff:'expert',cat:'general',lang:'ru'},
  {word:'СТУДЕНТ',hint:'оюутан',diff:'hard',cat:'general',lang:'ru'},
  {word:'ТАБЛЕТКА',hint:'эм',diff:'hard',cat:'general',lang:'ru'},
  {word:'ТЕЛЕВИЗОР',hint:'телевиз',diff:'expert',cat:'general',lang:'ru'},
  {word:'ТЕРРИТОРИЯ',hint:'нутаг дэвсгэр',diff:'expert',cat:'general',lang:'ru'},
  {word:'ТУРИЗМ',hint:'аялал жуулчлал',diff:'medium',cat:'general',lang:'ru'},
  {word:'УЧИТЕЛЬ',hint:'багш',diff:'hard',cat:'general',lang:'ru'},
  {word:'ФАБРИКА',hint:'үйлдвэр',diff:'hard',cat:'general',lang:'ru'},
  {word:'ФОТОГРАФ',hint:'гэрэл зурагчин',diff:'hard',cat:'general',lang:'ru'},
  {word:'АВТОМОБИЛЬ',hint:'автомашин',diff:'expert',cat:'general',lang:'ru'},
  {word:'АДМИНИСТРАЦИЯ',hint:'захиргаа',diff:'expert',cat:'general',lang:'ru'},
  {word:'АРХИТЕКТУРА',hint:'архитектур',diff:'expert',cat:'general',lang:'ru'},
  {word:'БЕЗОПАСНОСТЬ',hint:'аюулгүй байдал',diff:'expert',cat:'general',lang:'ru'},
  {word:'БЛАГОДАРИТЬ',hint:'талархах',diff:'expert',cat:'general',lang:'ru'},
  {word:'ВЫЖИВАНИЕ',hint:'амьд үлдэх',diff:'expert',cat:'general',lang:'ru'},
  {word:'ГОСУДАРСТВО',hint:'төр',diff:'expert',cat:'general',lang:'ru'},
  {word:'ДЕМОКРАТИЯ',hint:'ардчилал',diff:'expert',cat:'general',lang:'ru'},
  {word:'ДЕЯТЕЛЬНОСТЬ',hint:'үйл ажиллагаа',diff:'expert',cat:'general',lang:'ru'},
  {word:'ДОСТИЖЕНИЕ',hint:'амжилт',diff:'expert',cat:'general',lang:'ru'},
  {word:'ЗАМЕСТИТЕЛЬ',hint:'орлогч',diff:'expert',cat:'general',lang:'ru'},
  {word:'ЗДРАВООХРАНЕНИЕ',hint:'эрүүл мэндийн тусламж',diff:'expert',cat:'general',lang:'ru'},
  {word:'ЗНАЧИТЕЛЬНЫЙ',hint:'чухал',diff:'expert',cat:'general',lang:'ru'},
  {word:'ИНДИВИДУАЛЬНЫЙ',hint:'хувь хүний',diff:'expert',cat:'general',lang:'ru'},
  {word:'ИССЛЕДОВАНИЕ',hint:'судалгаа',diff:'expert',cat:'general',lang:'ru'},
  {word:'КОММУНИКАЦИЯ',hint:'харилцаа холбоо',diff:'expert',cat:'general',lang:'ru'},
  {word:'КОНСТИТУЦИЯ',hint:'үндсэн хууль',diff:'expert',cat:'general',lang:'ru'},
  {word:'КУЛЬТУРНЫЙ',hint:'соёлтой',diff:'expert',cat:'general',lang:'ru'},
  {word:'МЕЖДУНАРОДНЫЙ',hint:'олон улсын',diff:'expert',cat:'general',lang:'ru'},
  {word:'МИНИСТЕРСТВО',hint:'яам',diff:'expert',cat:'general',lang:'ru'},
  {word:'НАПРАВЛЕНИЕ',hint:'чиглэл',diff:'expert',cat:'general',lang:'ru'},
  {word:'НЕЗАВИСИМОСТЬ',hint:'тусгаар тогтнол',diff:'expert',cat:'general',lang:'ru'},
  {word:'ОБЕСПЕЧЕНИЕ',hint:'хангамж',diff:'expert',cat:'general',lang:'ru'},
  {word:'ОБРАЗОВАНИЕ',hint:'боловсрол',diff:'expert',cat:'general',lang:'ru'},
  {word:'ОРГАНИЗАЦИЯ',hint:'байгууллага',diff:'expert',cat:'general',lang:'ru'},
  {word:'ОТВЕТСТВЕННОСТЬ',hint:'хариуцлага',diff:'expert',cat:'general',lang:'ru'},
  {word:'ОТНОШЕНИЕ',hint:'харилцаа',diff:'expert',cat:'general',lang:'ru'},
  {word:'ПАРЛАМЕНТ',hint:'парламент',diff:'expert',cat:'general',lang:'ru'},
  {word:'ПАТРИОТИЗМ',hint:'эх оронч үзэл',diff:'expert',cat:'general',lang:'ru'},
  {word:'ПЛАНИРОВАНИЕ',hint:'төлөвлөлт',diff:'expert',cat:'general',lang:'ru'},
  {word:'ПРАВИТЕЛЬСТВО',hint:'засгийн газар',diff:'expert',cat:'general',lang:'ru'},
  {word:'ПРЕДПРИЯТИЕ',hint:'аж ахуйн нэгж',diff:'expert',cat:'general',lang:'ru'},
  {word:'ПРЕЗИДЕНТСТВО',hint:'ерөнхийлөгчийн засаглал',diff:'expert',cat:'general',lang:'ru'},
  {word:'ПРОИЗВОДСТВО',hint:'үйлдвэрлэл',diff:'expert',cat:'general',lang:'ru'},
  {word:'ПРОФЕССИОНАЛ',hint:'мэргэжлийн',diff:'expert',cat:'general',lang:'ru'},
  {word:'РАЗВЛЕЧЕНИЕ',hint:'цэнгээн',diff:'expert',cat:'general',lang:'ru'},
  {word:'РЕКОМЕНДАЦИЯ',hint:'зөвлөмж',diff:'expert',cat:'general',lang:'ru'},
  {word:'РЕЛИГИОЗНЫЙ',hint:'шашны',diff:'expert',cat:'general',lang:'ru'},
  {word:'САМОСТОЯТЕЛЬНЫЙ',hint:'бие даасан',diff:'expert',cat:'general',lang:'ru'},
  {word:'СВИДЕТЕЛЬСТВО',hint:'гэрчилгээ',diff:'expert',cat:'general',lang:'ru'},
  {word:'СОТРУДНИЧЕСТВО',hint:'хамтын ажиллагаа',diff:'expert',cat:'general',lang:'ru'},
  {word:'СПРАВЕДЛИВОСТЬ',hint:'шударга ёс',diff:'expert',cat:'general',lang:'ru'},
  {word:'СТРОИТЕЛЬСТВО',hint:'барилга байгууламж',diff:'expert',cat:'general',lang:'ru'},
  {word:'ТЕРРИТОРИАЛЬНЫЙ',hint:'нутаг дэвсгэрийн',diff:'expert',cat:'general',lang:'ru'},
  {word:'ТЕХНОЛОГИЯ',hint:'технологи',diff:'expert',cat:'general',lang:'ru'},
  {word:'ТРАДИЦИОННЫЙ',hint:'уламжлалт',diff:'expert',cat:'general',lang:'ru'},
  {word:'УНИВЕРСИТЕТ',hint:'их сургууль',diff:'expert',cat:'general',lang:'ru'},
  {word:'УПРАВЛЕНИЕ',hint:'удирдлага',diff:'expert',cat:'general',lang:'ru'},
  {word:'ХАРАКТЕРИСТИКА',hint:'шинж чанар',diff:'expert',cat:'general',lang:'ru'},
  {word:'ЭКОНОМИКА',hint:'эдийн засаг',diff:'expert',cat:'general',lang:'ru'}
];

const EN_EXTRA_DATA=[
  {word:'ABLE',hint:'чадвартай',diff:'easy',cat:'general',lang:'en'},
  {word:'ACID',hint:'хүчил',diff:'easy',cat:'general',lang:'en'},
  {word:'AGED',hint:'насжсан',diff:'easy',cat:'general',lang:'en'},
  {word:'ALSO',hint:'мөн',diff:'easy',cat:'general',lang:'en'},
  {word:'AREA',hint:'талбай',diff:'easy',cat:'general',lang:'en'},
  {word:'ARMY',hint:'арми',diff:'easy',cat:'general',lang:'en'},
  {word:'AWAY',hint:'хол',diff:'easy',cat:'general',lang:'en'},
  {word:'BABY',hint:'нялх хүүхэд',diff:'easy',cat:'general',lang:'en'},
  {word:'BACK',hint:'нуруу',diff:'easy',cat:'general',lang:'en'},
  {word:'BALL',hint:'бөмбөг',diff:'easy',cat:'general',lang:'en'},
  {word:'BAND',hint:'туузан',diff:'easy',cat:'general',lang:'en'},
  {word:'BANK',hint:'банк',diff:'easy',cat:'general',lang:'en'},
  {word:'BASE',hint:'суурь',diff:'easy',cat:'general',lang:'en'},
  {word:'BATH',hint:'ванн',diff:'easy',cat:'general',lang:'en'},
  {word:'BEAR',hint:'баавгай',diff:'easy',cat:'general',lang:'en'},
  {word:'BEAT',hint:'цохих',diff:'easy',cat:'general',lang:'en'},
  {word:'BEEN',hint:'байсан',diff:'easy',cat:'general',lang:'en'},
  {word:'BELL',hint:'хонх',diff:'easy',cat:'general',lang:'en'},
  {word:'BELT',hint:'бүс',diff:'easy',cat:'general',lang:'en'},
  {word:'BEST',hint:'хамгийн сайн',diff:'easy',cat:'general',lang:'en'},
  {word:'BILL',hint:'тооцоо',diff:'easy',cat:'general',lang:'en'},
  {word:'BITE',hint:'хазах',diff:'easy',cat:'general',lang:'en'},
  {word:'BLOW',hint:'үлээх',diff:'easy',cat:'general',lang:'en'},
  {word:'BLUE',hint:'цэнхэр',diff:'easy',cat:'general',lang:'en'},
  {word:'BOLD',hint:'зоригтой',diff:'easy',cat:'general',lang:'en'},
  {word:'BOLT',hint:'боолт',diff:'easy',cat:'general',lang:'en'},
  {word:'BONE',hint:'яс',diff:'easy',cat:'general',lang:'en'},
  {word:'BOOM',hint:'дэлбэрэлт',diff:'easy',cat:'general',lang:'en'},
  {word:'BOOT',hint:'гутал',diff:'easy',cat:'general',lang:'en'},
  {word:'BORE',hint:'уйтгартай',diff:'easy',cat:'general',lang:'en'},
  {word:'BOTH',hint:'хоёулаа',diff:'easy',cat:'general',lang:'en'},
  {word:'BOWL',hint:'аяга',diff:'easy',cat:'general',lang:'en'},
  {word:'BREW',hint:'дарс исгэх',diff:'easy',cat:'general',lang:'en'},
  {word:'BROW',hint:'хөмсөг',diff:'easy',cat:'general',lang:'en'},
  {word:'BUCK',hint:'эр буга',diff:'easy',cat:'general',lang:'en'},
  {word:'BULK',hint:'хэмжээ',diff:'easy',cat:'general',lang:'en'},
  {word:'BULL',hint:'бух',diff:'easy',cat:'general',lang:'en'},
  {word:'BURN',hint:'шатах',diff:'easy',cat:'general',lang:'en'},
  {word:'BUSH',hint:'бут',diff:'easy',cat:'general',lang:'en'},
  {word:'BUSY',hint:'завгүй',diff:'easy',cat:'general',lang:'en'},
  {word:'BYTE',hint:'байт',diff:'easy',cat:'general',lang:'en'},
  {word:'CAFE',hint:'кафе',diff:'easy',cat:'general',lang:'en'},
  {word:'CAGE',hint:'тор',diff:'easy',cat:'general',lang:'en'},
  {word:'CAKE',hint:'бялуу',diff:'easy',cat:'general',lang:'en'},
  {word:'CALL',hint:'дуудах',diff:'easy',cat:'general',lang:'en'},
  {word:'CALM',hint:'тайван',diff:'easy',cat:'general',lang:'en'},
  {word:'CAME',hint:'ирсэн',diff:'easy',cat:'general',lang:'en'},
  {word:'CAMP',hint:'хуаран',diff:'easy',cat:'general',lang:'en'},
  {word:'CANE',hint:'таяг',diff:'easy',cat:'general',lang:'en'},
  {word:'CAPE',hint:'даашинз',diff:'easy',cat:'general',lang:'en'},
  {word:'CARE',hint:'анхаарал',diff:'easy',cat:'general',lang:'en'},
  {word:'CART',hint:'тэрэг',diff:'easy',cat:'general',lang:'en'},
  {word:'CASE',hint:'тохиолдол',diff:'easy',cat:'general',lang:'en'},
  {word:'CASH',hint:'бэлэн мөнгө',diff:'easy',cat:'general',lang:'en'},
  {word:'CAST',hint:'шидэх',diff:'easy',cat:'general',lang:'en'},
  {word:'CAVE',hint:'агуй',diff:'easy',cat:'general',lang:'en'},
  {word:'CELL',hint:'эс',diff:'easy',cat:'general',lang:'en'},
  {word:'CHAT',hint:'ярилцах',diff:'easy',cat:'general',lang:'en'},
  {word:'CHEF',hint:'тогооч',diff:'easy',cat:'general',lang:'en'},
  {word:'CHIP',hint:'чип',diff:'easy',cat:'general',lang:'en'},
  {word:'CHOP',hint:'огтлох',diff:'easy',cat:'general',lang:'en'},
  {word:'CITE',hint:'иш татах',diff:'easy',cat:'general',lang:'en'},
  {word:'CITY',hint:'хот',diff:'easy',cat:'general',lang:'en'},
  {word:'CLAP',hint:'ташуурдах',diff:'easy',cat:'general',lang:'en'},
  {word:'CLAY',hint:'шавар',diff:'easy',cat:'general',lang:'en'},
  {word:'CLIP',hint:'затгуур',diff:'easy',cat:'general',lang:'en'},
  {word:'CLUB',hint:'клуб',diff:'easy',cat:'general',lang:'en'},
  {word:'CLUE',hint:'дохиолол',diff:'easy',cat:'general',lang:'en'},
  {word:'COAL',hint:'нүүрс',diff:'easy',cat:'general',lang:'en'},
  {word:'CODE',hint:'код',diff:'easy',cat:'general',lang:'en'},
  {word:'COIL',hint:'ороомог',diff:'easy',cat:'general',lang:'en'},
  {word:'COLD',hint:'хүйтэн',diff:'easy',cat:'general',lang:'en'},
  {word:'COME',hint:'ирэх',diff:'easy',cat:'general',lang:'en'},
  {word:'COOK',hint:'хоол хийх',diff:'easy',cat:'general',lang:'en'},
  {word:'COOL',hint:'сэрүүн',diff:'easy',cat:'general',lang:'en'},
  {word:'COPE',hint:'тэвчих',diff:'easy',cat:'general',lang:'en'},
  {word:'COPY',hint:'хуулбар',diff:'easy',cat:'general',lang:'en'},
  {word:'CORD',hint:'утас',diff:'easy',cat:'general',lang:'en'},
  {word:'CORE',hint:'цөм',diff:'easy',cat:'general',lang:'en'},
  {word:'CORK',hint:'таг',diff:'easy',cat:'general',lang:'en'},
  {word:'CORN',hint:'эрдэнэ шиш',diff:'easy',cat:'general',lang:'en'},
  {word:'COST',hint:'үнэ',diff:'easy',cat:'general',lang:'en'},
  {word:'COZY',hint:'затхай',diff:'easy',cat:'general',lang:'en'},
  {word:'CREW',hint:'баг',diff:'easy',cat:'general',lang:'en'},
  {word:'CROP',hint:'ургац',diff:'easy',cat:'general',lang:'en'},
  {word:'CROW',hint:'хэрээ',diff:'easy',cat:'general',lang:'en'},
  {word:'CUBE',hint:'куб',diff:'easy',cat:'general',lang:'en'},
  {word:'CURL',hint:'муруй',diff:'easy',cat:'general',lang:'en'},
  {word:'CUTE',hint:'хөөрхөн',diff:'easy',cat:'general',lang:'en'},
  {word:'DAMP',hint:'чийглэг',diff:'easy',cat:'general',lang:'en'},
  {word:'DARK',hint:'харанхуй',diff:'easy',cat:'general',lang:'en'},
  {word:'DART',hint:'шидэх',diff:'easy',cat:'general',lang:'en'},
  {word:'DASH',hint:'зугтах',diff:'easy',cat:'general',lang:'en'},
  {word:'DATA',hint:'өгөгдөл',diff:'easy',cat:'general',lang:'en'},
  {word:'DAWN',hint:'өглөөний үүр',diff:'easy',cat:'general',lang:'en'},
  {word:'DAYS',hint:'өдрүүд',diff:'easy',cat:'general',lang:'en'},
  {word:'DEAD',hint:'үхсэн',diff:'easy',cat:'general',lang:'en'},
  {word:'DEAF',hint:'дүлий',diff:'easy',cat:'general',lang:'en'},
  {word:'DEAL',hint:'хэлцэл',diff:'easy',cat:'general',lang:'en'},
  {word:'DEAR',hint:'эрхэм',diff:'easy',cat:'general',lang:'en'},
  {word:'DEBT',hint:'өр',diff:'easy',cat:'general',lang:'en'},
  {word:'DECK',hint:'тавцан',diff:'easy',cat:'general',lang:'en'},
  {word:'DEED',hint:'үйл',diff:'easy',cat:'general',lang:'en'},
  {word:'DEEP',hint:'гүн',diff:'easy',cat:'general',lang:'en'},
  {word:'DEER',hint:'буга',diff:'easy',cat:'general',lang:'en'},
  {word:'DENY',hint:'үгүйсгэх',diff:'easy',cat:'general',lang:'en'},
  {word:'DESK',hint:'ширээ',diff:'easy',cat:'general',lang:'en'},
  {word:'DIAL',hint:'залгах',diff:'easy',cat:'general',lang:'en'},
  {word:'DIET',hint:'хоолны дэглэм',diff:'easy',cat:'general',lang:'en'},
  {word:'DIME',hint:'арван цент',diff:'easy',cat:'general',lang:'en'},
  {word:'DINE',hint:'хоол идэх',diff:'easy',cat:'general',lang:'en'},
  {word:'DIRE',hint:'аймшигтай',diff:'easy',cat:'general',lang:'en'},
  {word:'DIRT',hint:'шороо',diff:'easy',cat:'general',lang:'en'},
  {word:'DISH',hint:'таваг',diff:'easy',cat:'general',lang:'en'},
  {word:'DISK',hint:'диск',diff:'easy',cat:'general',lang:'en'},
  {word:'DIVE',hint:'шумбах',diff:'easy',cat:'general',lang:'en'},
  {word:'DOCK',hint:'боомт',diff:'easy',cat:'general',lang:'en'},
  {word:'DOLL',hint:'хүүхэлдэй',diff:'easy',cat:'general',lang:'en'},
  {word:'DOME',hint:'бөмбөгөр',diff:'easy',cat:'general',lang:'en'},
  {word:'DONE',hint:'дууссан',diff:'easy',cat:'general',lang:'en'},
  {word:'DOOR',hint:'хаалга',diff:'easy',cat:'general',lang:'en'},
  {word:'DOSE',hint:'тун',diff:'easy',cat:'general',lang:'en'},
  {word:'DOVE',hint:'тагтаа',diff:'easy',cat:'general',lang:'en'},
  {word:'DOWN',hint:'доош',diff:'easy',cat:'general',lang:'en'},
  {word:'DRAW',hint:'зурах',diff:'easy',cat:'general',lang:'en'},
  {word:'DREW',hint:'зурсан',diff:'easy',cat:'general',lang:'en'},
  {word:'DRIP',hint:'дуслах',diff:'easy',cat:'general',lang:'en'},
  {word:'DROP',hint:'дусал',diff:'easy',cat:'general',lang:'en'},
  {word:'DRUM',hint:'бөмбөр',diff:'easy',cat:'general',lang:'en'},
  {word:'DUAL',hint:'хос',diff:'easy',cat:'general',lang:'en'},
  {word:'DUEL',hint:'тулаан',diff:'easy',cat:'general',lang:'en'},
  {word:'DULL',hint:'уйтгартай',diff:'easy',cat:'general',lang:'en'},
  {word:'DUMP',hint:'хог',diff:'easy',cat:'general',lang:'en'},
  {word:'DUSK',hint:'бүрий',diff:'easy',cat:'general',lang:'en'},
  {word:'DUST',hint:'тоос',diff:'easy',cat:'general',lang:'en'},
  {word:'DUTY',hint:'үүрэг',diff:'easy',cat:'general',lang:'en'},
  {word:'EACH',hint:'тус бүр',diff:'easy',cat:'general',lang:'en'},
  {word:'EARN',hint:'олох',diff:'easy',cat:'general',lang:'en'},
  {word:'EASE',hint:'хялбар',diff:'easy',cat:'general',lang:'en'},
  {word:'EAST',hint:'зүүн',diff:'easy',cat:'general',lang:'en'},
  {word:'EDGE',hint:'ирмэг',diff:'easy',cat:'general',lang:'en'},
  {word:'ELSE',hint:'өөр',diff:'easy',cat:'general',lang:'en'},
  {word:'EMIT',hint:'ялгаруулах',diff:'easy',cat:'general',lang:'en'},
  {word:'EPIC',hint:'туульс',diff:'easy',cat:'general',lang:'en'},
  {word:'EVEN',hint:'тэгш',diff:'easy',cat:'general',lang:'en'},
  {word:'EVER',hint:'хэзээ ч',diff:'easy',cat:'general',lang:'en'},
  {word:'EVIL',hint:'муу',diff:'easy',cat:'general',lang:'en'},
  {word:'EXAM',hint:'шалгалт',diff:'easy',cat:'general',lang:'en'},
  {word:'EXIT',hint:'гарах',diff:'easy',cat:'general',lang:'en'},
  {word:'FACE',hint:'нүүр',diff:'easy',cat:'general',lang:'en'},
  {word:'FACT',hint:'баримт',diff:'easy',cat:'general',lang:'en'},
  {word:'FADE',hint:'бүдгэрэх',diff:'easy',cat:'general',lang:'en'},
  {word:'FAIL',hint:'амжилтгүй болох',diff:'easy',cat:'general',lang:'en'},
  {word:'FAIR',hint:'шударга',diff:'easy',cat:'general',lang:'en'},
  {word:'FAKE',hint:'хуурамч',diff:'easy',cat:'general',lang:'en'},
  {word:'FALL',hint:'унах',diff:'easy',cat:'general',lang:'en'},
  {word:'FAME',hint:'алдар',diff:'easy',cat:'general',lang:'en'},
  {word:'FARE',hint:'тариф',diff:'easy',cat:'general',lang:'en'},
  {word:'FARM',hint:'фермер',diff:'easy',cat:'general',lang:'en'},
  {word:'FAST',hint:'хурдан',diff:'easy',cat:'general',lang:'en'},
  {word:'FATE',hint:'хувь тавилан',diff:'easy',cat:'general',lang:'en'},
  {word:'FAWN',hint:'гурвалжин буга',diff:'easy',cat:'general',lang:'en'},
  {word:'FEAR',hint:'айх',diff:'easy',cat:'general',lang:'en'},
  {word:'FEAT',hint:'амжилт',diff:'easy',cat:'general',lang:'en'},
  {word:'FEED',hint:'тэжээх',diff:'easy',cat:'general',lang:'en'},
  {word:'FEEL',hint:'мэдрэх',diff:'easy',cat:'general',lang:'en'},
  {word:'FEET',hint:'хөлүүд',diff:'easy',cat:'general',lang:'en'},
  {word:'FELL',hint:'унасан',diff:'easy',cat:'general',lang:'en'},
  {word:'FELT',hint:'мэдэрсэн',diff:'easy',cat:'general',lang:'en'},
  {word:'FERN',hint:'папораник',diff:'easy',cat:'general',lang:'en'},
  {word:'FILL',hint:'дүүргэх',diff:'easy',cat:'general',lang:'en'},
  {word:'FILM',hint:'кино',diff:'easy',cat:'general',lang:'en'},
  {word:'FIND',hint:'олох',diff:'easy',cat:'general',lang:'en'},
  {word:'FINE',hint:'сайн',diff:'easy',cat:'general',lang:'en'},
  {word:'FIST',hint:'нударга',diff:'easy',cat:'general',lang:'en'},
  {word:'ABOUT',hint:'тухай',diff:'medium',cat:'general',lang:'en'},
  {word:'ABOVE',hint:'дээр',diff:'medium',cat:'general',lang:'en'},
  {word:'ABUSE',hint:'буруугаар хэрэглэх',diff:'medium',cat:'general',lang:'en'},
  {word:'AFTER',hint:'дараа',diff:'medium',cat:'general',lang:'en'},
  {word:'AGAIN',hint:'дахин',diff:'medium',cat:'general',lang:'en'},
  {word:'AGREE',hint:'зөвшөөрөх',diff:'medium',cat:'general',lang:'en'},
  {word:'AHEAD',hint:'урагш',diff:'medium',cat:'general',lang:'en'},
  {word:'ALBUM',hint:'цомог',diff:'medium',cat:'general',lang:'en'},
  {word:'ALERT',hint:'анхаарах',diff:'medium',cat:'general',lang:'en'},
  {word:'ALIKE',hint:'адилхан',diff:'medium',cat:'general',lang:'en'},
  {word:'ALIVE',hint:'амьд',diff:'medium',cat:'general',lang:'en'},
  {word:'ALLEY',hint:'гудамж',diff:'medium',cat:'general',lang:'en'},
  {word:'ALLOW',hint:'зөвшөөрөх',diff:'medium',cat:'general',lang:'en'},
  {word:'ALONE',hint:'ганцаар',diff:'medium',cat:'general',lang:'en'},
  {word:'ALONG',hint:'дагуу',diff:'medium',cat:'general',lang:'en'},
  {word:'ALOUD',hint:'чангаар',diff:'medium',cat:'general',lang:'en'},
  {word:'ALTER',hint:'өөрчлөх',diff:'medium',cat:'general',lang:'en'},
  {word:'ANGER',hint:'уур',diff:'medium',cat:'general',lang:'en'},
  {word:'ANGLE',hint:'өнцөг',diff:'medium',cat:'general',lang:'en'},
  {word:'ANKLE',hint:'шагай',diff:'medium',cat:'general',lang:'en'},
  {word:'ANNEX',hint:'нэгтгэх',diff:'medium',cat:'general',lang:'en'},
  {word:'ANTIC',hint:'тоглоом',diff:'medium',cat:'general',lang:'en'},
  {word:'APART',hint:'тусдаа',diff:'medium',cat:'general',lang:'en'},
  {word:'APPLY',hint:'хэрэглэх',diff:'medium',cat:'general',lang:'en'},
  {word:'ARENA',hint:'тавцан',diff:'medium',cat:'general',lang:'en'},
  {word:'ARGUE',hint:'маргах',diff:'medium',cat:'general',lang:'en'},
  {word:'ARISE',hint:'үүсэх',diff:'medium',cat:'general',lang:'en'},
  {word:'ASIDE',hint:'тусдаа',diff:'medium',cat:'general',lang:'en'},
  {word:'ASSET',hint:'хөрөнгө',diff:'medium',cat:'general',lang:'en'},
  {word:'ATLAS',hint:'атлас',diff:'medium',cat:'general',lang:'en'},
  {word:'ATTIC',hint:'тааз',diff:'medium',cat:'general',lang:'en'},
  {word:'AUDIO',hint:'аудио',diff:'medium',cat:'general',lang:'en'},
  {word:'AUDIT',hint:'аудит',diff:'medium',cat:'general',lang:'en'},
  {word:'AVAIL',hint:'ашиг тус',diff:'medium',cat:'general',lang:'en'},
  {word:'AVOID',hint:'зайлсхийх',diff:'medium',cat:'general',lang:'en'},
  {word:'AWAKE',hint:'сэрэх',diff:'medium',cat:'general',lang:'en'},
  {word:'AWARD',hint:'шагнал',diff:'medium',cat:'general',lang:'en'},
  {word:'AWARE',hint:'мэдэх',diff:'medium',cat:'general',lang:'en'},
  {word:'AWFUL',hint:'аймшигтай',diff:'medium',cat:'general',lang:'en'},
  {word:'BAKED',hint:'шарсан',diff:'medium',cat:'general',lang:'en'},
  {word:'BASIC',hint:'үндсэн',diff:'medium',cat:'general',lang:'en'},
  {word:'BASIS',hint:'суурь',diff:'medium',cat:'general',lang:'en'},
  {word:'BATCH',hint:'багц',diff:'medium',cat:'general',lang:'en'},
  {word:'BEGAN',hint:'эхэлсэн',diff:'medium',cat:'general',lang:'en'},
  {word:'BEGIN',hint:'эхлэх',diff:'medium',cat:'general',lang:'en'},
  {word:'BEING',hint:'байх',diff:'medium',cat:'general',lang:'en'},
  {word:'BELOW',hint:'доор',diff:'medium',cat:'general',lang:'en'},
  {word:'BENCH',hint:'сандал',diff:'medium',cat:'general',lang:'en'},
  {word:'BIBLE',hint:'библи',diff:'medium',cat:'general',lang:'en'},
  {word:'BIRTH',hint:'төрөлт',diff:'medium',cat:'general',lang:'en'},
  {word:'BISON',hint:'буйвал',diff:'medium',cat:'general',lang:'en'},
  {word:'BLADE',hint:'ир',diff:'medium',cat:'general',lang:'en'},
  {word:'BLAME',hint:'буруутгах',diff:'medium',cat:'general',lang:'en'},
  {word:'BLAND',hint:'уйтгартай',diff:'medium',cat:'general',lang:'en'},
  {word:'BLANK',hint:'хоосон',diff:'medium',cat:'general',lang:'en'},
  {word:'BLAST',hint:'дэлбэрэх',diff:'medium',cat:'general',lang:'en'},
  {word:'BLAZE',hint:'дөлгөөн',diff:'medium',cat:'general',lang:'en'},
  {word:'BLEED',hint:'цус гарах',diff:'medium',cat:'general',lang:'en'},
  {word:'BLESS',hint:'ерөөх',diff:'medium',cat:'general',lang:'en'},
  {word:'BLIND',hint:'сохор',diff:'medium',cat:'general',lang:'en'},
  {word:'BLOCK',hint:'блок',diff:'medium',cat:'general',lang:'en'},
  {word:'BLOGS',hint:'блогууд',diff:'medium',cat:'general',lang:'en'},
  {word:'BLOOM',hint:'цэцэглэх',diff:'medium',cat:'general',lang:'en'},
  {word:'BLOWN',hint:'үлийсэн',diff:'medium',cat:'general',lang:'en'},
  {word:'BOARD',hint:'самбар',diff:'medium',cat:'general',lang:'en'},
  {word:'BONUS',hint:'урамшуулал',diff:'medium',cat:'general',lang:'en'},
  {word:'BOOST',hint:'дэмжих',diff:'medium',cat:'general',lang:'en'},
  {word:'BOOTH',hint:'буудал',diff:'medium',cat:'general',lang:'en'},
  {word:'BOUND',hint:'хязгаар',diff:'medium',cat:'general',lang:'en'},
  {word:'BOXER',hint:'боксчин',diff:'medium',cat:'general',lang:'en'},
  {word:'BRAKE',hint:'гальм',diff:'medium',cat:'general',lang:'en'},
  {word:'BRAND',hint:'брэнд',diff:'medium',cat:'general',lang:'en'},
  {word:'BRAVE',hint:'зориг',diff:'medium',cat:'general',lang:'en'},
  {word:'BREAK',hint:'таслах',diff:'medium',cat:'general',lang:'en'},
  {word:'BREED',hint:'үржил',diff:'medium',cat:'general',lang:'en'},
  {word:'BRICK',hint:'тоосго',diff:'medium',cat:'general',lang:'en'},
  {word:'BRIDE',hint:'сүйт бүсгүй',diff:'medium',cat:'general',lang:'en'},
  {word:'BRIEF',hint:'товч',diff:'medium',cat:'general',lang:'en'},
  {word:'BRISK',hint:'шуурхай',diff:'medium',cat:'general',lang:'en'},
  {word:'BROAD',hint:'өргөн',diff:'medium',cat:'general',lang:'en'},
  {word:'BROKE',hint:'хугарсан',diff:'medium',cat:'general',lang:'en'},
  {word:'BROOK',hint:'горхи',diff:'medium',cat:'general',lang:'en'},
  {word:'BROWN',hint:'хүрэн',diff:'medium',cat:'general',lang:'en'},
  {word:'BRUNT',hint:'гол цохилт',diff:'medium',cat:'general',lang:'en'},
  {word:'BRUSH',hint:'сойз',diff:'medium',cat:'general',lang:'en'},
  {word:'BUDDY',hint:'найз',diff:'medium',cat:'general',lang:'en'},
  {word:'BUILD',hint:'барих',diff:'medium',cat:'general',lang:'en'},
  {word:'BUILT',hint:'баригдсан',diff:'medium',cat:'general',lang:'en'},
  {word:'BULGE',hint:'хөөх',diff:'medium',cat:'general',lang:'en'},
  {word:'BUMPY',hint:'нүхтэй',diff:'medium',cat:'general',lang:'en'},
  {word:'BUNCH',hint:'баглаа',diff:'medium',cat:'general',lang:'en'},
  {word:'BUYER',hint:'худалдан авагч',diff:'medium',cat:'general',lang:'en'},
  {word:'CABIN',hint:'байшин',diff:'medium',cat:'general',lang:'en'},
  {word:'CABLE',hint:'кабель',diff:'medium',cat:'general',lang:'en'},
  {word:'CAMEL',hint:'тэмээ',diff:'medium',cat:'general',lang:'en'},
  {word:'CANDY',hint:'чихэр',diff:'medium',cat:'general',lang:'en'},
  {word:'CARRY',hint:'зөөх',diff:'medium',cat:'general',lang:'en'},
  {word:'CATCH',hint:'барих',diff:'medium',cat:'general',lang:'en'},
  {word:'CAUSE',hint:'шалтгаан',diff:'medium',cat:'general',lang:'en'},
  {word:'CEASE',hint:'зогсох',diff:'medium',cat:'general',lang:'en'},
  {word:'CHAIN',hint:'гинж',diff:'medium',cat:'general',lang:'en'},
  {word:'CHALK',hint:'шохой',diff:'medium',cat:'general',lang:'en'},
  {word:'CHAOS',hint:'эмх замбараагүй байдал',diff:'medium',cat:'general',lang:'en'},
  {word:'CHARM',hint:'шид',diff:'medium',cat:'general',lang:'en'},
  {word:'CHASE',hint:'хөөх',diff:'medium',cat:'general',lang:'en'},
  {word:'CHEAP',hint:'хямд',diff:'medium',cat:'general',lang:'en'},
  {word:'CHEAT',hint:'хуурах',diff:'medium',cat:'general',lang:'en'},
  {word:'CHECK',hint:'шалгах',diff:'medium',cat:'general',lang:'en'},
  {word:'CHEEK',hint:'хацар',diff:'medium',cat:'general',lang:'en'},
  {word:'CHEER',hint:'баярлах',diff:'medium',cat:'general',lang:'en'},
  {word:'CHESS',hint:'шатар',diff:'medium',cat:'general',lang:'en'},
  {word:'CHEST',hint:'цээж',diff:'medium',cat:'general',lang:'en'},
  {word:'CHIEF',hint:'дарга',diff:'medium',cat:'general',lang:'en'},
  {word:'CIVIC',hint:'иргэний',diff:'medium',cat:'general',lang:'en'},
  {word:'CIVIL',hint:'иргэний',diff:'medium',cat:'general',lang:'en'},
  {word:'CLAIM',hint:'мэдэгдэх',diff:'medium',cat:'general',lang:'en'},
  {word:'CLASH',hint:'мөргөлдөх',diff:'medium',cat:'general',lang:'en'},
  {word:'CLASS',hint:'анги',diff:'medium',cat:'general',lang:'en'},
  {word:'CLEAN',hint:'цэвэр',diff:'medium',cat:'general',lang:'en'},
  {word:'CLEAR',hint:'тодорхой',diff:'medium',cat:'general',lang:'en'},
  {word:'CLERK',hint:'бичиг хэргийн ажилтан',diff:'medium',cat:'general',lang:'en'},
  {word:'CLICK',hint:'дарах',diff:'medium',cat:'general',lang:'en'},
  {word:'CLIFF',hint:'хад',diff:'medium',cat:'general',lang:'en'},
  {word:'CLIMB',hint:'авирах',diff:'medium',cat:'general',lang:'en'},
  {word:'CLING',hint:'наалдах',diff:'medium',cat:'general',lang:'en'},
  {word:'CLOSE',hint:'хаах',diff:'medium',cat:'general',lang:'en'},
  {word:'CLOTH',hint:'даавуу',diff:'medium',cat:'general',lang:'en'},
  {word:'CLOUD',hint:'үүл',diff:'medium',cat:'general',lang:'en'},
  {word:'CLOWN',hint:'хошигнуур',diff:'medium',cat:'general',lang:'en'},
  {word:'COACH',hint:'дасгалжуулагч',diff:'medium',cat:'general',lang:'en'},
  {word:'ACHIEVE',hint:'хүрэх',diff:'hard',cat:'general',lang:'en'},
  {word:'ACQUIRE',hint:'олж авах',diff:'hard',cat:'general',lang:'en'},
  {word:'ADDRESS',hint:'хаяг',diff:'hard',cat:'general',lang:'en'},
  {word:'ADVANCE',hint:'ахих',diff:'hard',cat:'general',lang:'en'},
  {word:'AIRLINE',hint:'агаарын тээвэр',diff:'hard',cat:'general',lang:'en'},
  {word:'AIRPORT',hint:'нисэх онгоцны буудал',diff:'hard',cat:'general',lang:'en'},
  {word:'BALANCE',hint:'тэнцвэр',diff:'hard',cat:'general',lang:'en'},
  {word:'BATTERY',hint:'батарей',diff:'hard',cat:'general',lang:'en'},
  {word:'CABINET',hint:'шүүгээ',diff:'hard',cat:'general',lang:'en'},
  {word:'CAPABLE',hint:'чадвартай',diff:'hard',cat:'general',lang:'en'},
  {word:'CAPSULE',hint:'капсул',diff:'hard',cat:'general',lang:'en'},
  {word:'CAREFUL',hint:'болгоомжтой',diff:'hard',cat:'general',lang:'en'},
  {word:'CEILING',hint:'тааз',diff:'hard',cat:'general',lang:'en'},
  {word:'CHANNEL',hint:'суваг',diff:'hard',cat:'general',lang:'en'},
  {word:'CHAPTER',hint:'бүлэг',diff:'hard',cat:'general',lang:'en'},
  {word:'CHARITY',hint:'буяны байгууллага',diff:'hard',cat:'general',lang:'en'},
  {word:'CITIZEN',hint:'иргэн',diff:'hard',cat:'general',lang:'en'},
  {word:'CLIMATE',hint:'уур амьсгал',diff:'hard',cat:'general',lang:'en'},
  {word:'CLOSELY',hint:'ойрхон',diff:'hard',cat:'general',lang:'en'},
  {word:'CLOTHES',hint:'хувцас',diff:'hard',cat:'general',lang:'en'},
  {word:'COMPLEX',hint:'нийлмэл',diff:'hard',cat:'general',lang:'en'},
  {word:'CONCERN',hint:'санаа зовнил',diff:'hard',cat:'general',lang:'en'},
  {word:'CONFIRM',hint:'баталгаажуулах',diff:'hard',cat:'general',lang:'en'},
  {word:'CONNECT',hint:'холбох',diff:'hard',cat:'general',lang:'en'},
  {word:'CONSIST',hint:'бүрдэх',diff:'hard',cat:'general',lang:'en'},
  {word:'CONTACT',hint:'холбоо барих',diff:'hard',cat:'general',lang:'en'},
  {word:'CONTAIN',hint:'агуулах',diff:'hard',cat:'general',lang:'en'},
  {word:'CONTEXT',hint:'нөхцөл',diff:'hard',cat:'general',lang:'en'},
  {word:'CONTROL',hint:'хяналт',diff:'hard',cat:'general',lang:'en'},
  {word:'CONVERT',hint:'хөрвүүлэх',diff:'hard',cat:'general',lang:'en'},
  {word:'CORRECT',hint:'зөв',diff:'hard',cat:'general',lang:'en'},
  {word:'COUNTER',hint:'тоолуур',diff:'hard',cat:'general',lang:'en'},
  {word:'COURAGE',hint:'зориг',diff:'hard',cat:'general',lang:'en'},
  {word:'COVERED',hint:'хучигдсан',diff:'hard',cat:'general',lang:'en'},
  {word:'CREATED',hint:'үүсгэсэн',diff:'hard',cat:'general',lang:'en'},
  {word:'CRUCIAL',hint:'чухал',diff:'hard',cat:'general',lang:'en'},
  {word:'CRYSTAL',hint:'болор',diff:'hard',cat:'general',lang:'en'},
  {word:'CULTURE',hint:'соёл',diff:'hard',cat:'general',lang:'en'},
  {word:'CAPABLE',hint:'чадвартай',diff:'hard',cat:'general',lang:'en'},
  {word:'DYNASTY',hint:'удам',diff:'hard',cat:'general',lang:'en'},
  {word:'ELDERLY',hint:'ахмад',diff:'hard',cat:'general',lang:'en'},
  {word:'ELEMENT',hint:'элемент',diff:'hard',cat:'general',lang:'en'},
  {word:'EMBRACE',hint:'тэврэх',diff:'hard',cat:'general',lang:'en'},
  {word:'EMOTION',hint:'сэтгэл хөдлөл',diff:'hard',cat:'general',lang:'en'},
  {word:'ENFORCE',hint:'хэрэгжүүлэх',diff:'hard',cat:'general',lang:'en'},
  {word:'ENHANCE',hint:'сайжруулах',diff:'hard',cat:'general',lang:'en'},
  {word:'ENQUIRY',hint:'лавлагаа',diff:'hard',cat:'general',lang:'en'},
  {word:'ETERNAL',hint:'мөнхийн',diff:'hard',cat:'general',lang:'en'},
  {word:'ETHICAL',hint:'ёс зүйн',diff:'hard',cat:'general',lang:'en'},
  {word:'EXAMINE',hint:'шалгах',diff:'hard',cat:'general',lang:'en'},
  {word:'EXPRESS',hint:'илэрхийлэх',diff:'hard',cat:'general',lang:'en'},
  {word:'EXTREME',hint:'туйлын',diff:'hard',cat:'general',lang:'en'},
  {word:'FAILURE',hint:'амжилтгүй байдал',diff:'hard',cat:'general',lang:'en'},
  {word:'FASHION',hint:'загвар',diff:'hard',cat:'general',lang:'en'},
  {word:'FEATURE',hint:'шинж чанар',diff:'hard',cat:'general',lang:'en'},
  {word:'FEELING',hint:'мэдрэмж',diff:'hard',cat:'general',lang:'en'},
  {word:'FINANCE',hint:'санхүү',diff:'hard',cat:'general',lang:'en'},
  {word:'FOREIGN',hint:'гадаадын',diff:'hard',cat:'general',lang:'en'},
  {word:'FOREVER',hint:'үүрдийн',diff:'hard',cat:'general',lang:'en'},
  {word:'FORWARD',hint:'урагш',diff:'hard',cat:'general',lang:'en'},
  {word:'FOUNDER',hint:'үүсгэн байгуулагч',diff:'hard',cat:'general',lang:'en'},
  {word:'FRAGILE',hint:'эмзэг',diff:'hard',cat:'general',lang:'en'},
  {word:'FREEDOM',hint:'эрх чөлөө',diff:'hard',cat:'general',lang:'en'},
  {word:'FREIGHT',hint:'ачаа',diff:'hard',cat:'general',lang:'en'},
  {word:'FURTHER',hint:'цааш',diff:'hard',cat:'general',lang:'en'},
  {word:'GALLERY',hint:'галерей',diff:'hard',cat:'general',lang:'en'},
  {word:'GENUINE',hint:'жинхэнэ',diff:'hard',cat:'general',lang:'en'},
  {word:'GLACIER',hint:'мөсөн гол',diff:'hard',cat:'general',lang:'en'},
  {word:'GLOBULE',hint:'бөмбөлөг',diff:'hard',cat:'general',lang:'en'},
  {word:'GRANTED',hint:'олгогдсон',diff:'hard',cat:'general',lang:'en'},
  {word:'GREATLY',hint:'их хэмжээгээр',diff:'hard',cat:'general',lang:'en'},
  {word:'GROWING',hint:'өсөж байгаа',diff:'hard',cat:'general',lang:'en'},
  {word:'HABITAT',hint:'орчин',diff:'hard',cat:'general',lang:'en'},
  {word:'HANDFUL',hint:'горьдох',diff:'hard',cat:'general',lang:'en'},
  {word:'HAPPILY',hint:'баяртайгаар',diff:'hard',cat:'general',lang:'en'},
  {word:'HARBOUR',hint:'боомт',diff:'hard',cat:'general',lang:'en'},
  {word:'HARMFUL',hint:'хортой',diff:'hard',cat:'general',lang:'en'},
  {word:'HARVEST',hint:'ургац хураах',diff:'hard',cat:'general',lang:'en'},
  {word:'HEALTHY',hint:'эрүүл',diff:'hard',cat:'general',lang:'en'},
  {word:'HEAVILY',hint:'хүнд байдлаар',diff:'hard',cat:'general',lang:'en'},
  {word:'ABUNDANCE',hint:'элбэг дэлбэг',diff:'expert',cat:'general',lang:'en'},
  {word:'ACCOMPLISHED',hint:'биелүүлсэн',diff:'expert',cat:'general',lang:'en'},
  {word:'ACCURATELY',hint:'нарийвчлан',diff:'expert',cat:'general',lang:'en'},
  {word:'ACHIEVEMENT',hint:'амжилт',diff:'expert',cat:'general',lang:'en'},
  {word:'ADVERSITY',hint:'бэрхшээл',diff:'expert',cat:'general',lang:'en'},
  {word:'AFTERWARD',hint:'дараа нь',diff:'expert',cat:'general',lang:'en'},
  {word:'AGGRESSION',hint:'түрэмгийлэл',diff:'expert',cat:'general',lang:'en'},
  {word:'ALGORITHM',hint:'алгоритм',diff:'expert',cat:'general',lang:'en'},
  {word:'ALLEGIANCE',hint:'үнэнч байдал',diff:'expert',cat:'general',lang:'en'},
  {word:'AMBASSADOR',hint:'элчин сайд',diff:'expert',cat:'general',lang:'en'},
  {word:'AMMUNITION',hint:'сум',diff:'expert',cat:'general',lang:'en'},
  {word:'ANNIVERSARY',hint:'ойн баяр',diff:'expert',cat:'general',lang:'en'},
  {word:'ANNOTATION',hint:'тэмдэглэл',diff:'expert',cat:'general',lang:'en'},
  {word:'ANTICIPATE',hint:'урьдчилан таамаглах',diff:'expert',cat:'general',lang:'en'},
  {word:'APPRECIATE',hint:'үнэлэх',diff:'expert',cat:'general',lang:'en'},
  {word:'APPRENTICE',hint:'шавь',diff:'expert',cat:'general',lang:'en'},
  {word:'APPROPRIATE',hint:'тохиромжтой',diff:'expert',cat:'general',lang:'en'},
  {word:'ATMOSPHERE',hint:'агаар мандал',diff:'expert',cat:'general',lang:'en'},
  {word:'ATTACHMENT',hint:'хавсралт',diff:'expert',cat:'general',lang:'en'},
  {word:'ATTRACTION',hint:'татах хүч',diff:'expert',cat:'general',lang:'en'},
  {word:'AUTHORITY',hint:'эрх мэдэл',diff:'expert',cat:'general',lang:'en'},
  {word:'BANKRUPTCY',hint:'дампуурал',diff:'expert',cat:'general',lang:'en'},
  {word:'BIOSPHERE',hint:'биосфер',diff:'expert',cat:'general',lang:'en'},
  {word:'CAPABILITY',hint:'чадавхи',diff:'expert',cat:'general',lang:'en'},
  {word:'CAPITALISM',hint:'капитализм',diff:'expert',cat:'general',lang:'en'},
  {word:'CATASTROPHE',hint:'гамшиг',diff:'expert',cat:'general',lang:'en'},
  {word:'CELEBRATION',hint:'тэмдэглэл',diff:'expert',cat:'general',lang:'en'},
  {word:'CIRCULATION',hint:'эргэлт',diff:'expert',cat:'general',lang:'en'},
  {word:'CITIZENSHIP',hint:'иргэншил',diff:'expert',cat:'general',lang:'en'},
  {word:'CIVILIZATION',hint:'соёл иргэншил',diff:'expert',cat:'general',lang:'en'},
  {word:'COEFFICIENT',hint:'коэффициент',diff:'expert',cat:'general',lang:'en'},
  {word:'COLLABORATE',hint:'хамтран ажиллах',diff:'expert',cat:'general',lang:'en'},
  {word:'COLLECTIVE',hint:'хамтын',diff:'expert',cat:'general',lang:'en'},
  {word:'COMMEMORATE',hint:'дурсах',diff:'expert',cat:'general',lang:'en'},
  {word:'COMMUNICATE',hint:'харилцах',diff:'expert',cat:'general',lang:'en'},
  {word:'COMPETITION',hint:'өрсөлдөөн',diff:'expert',cat:'general',lang:'en'},
  {word:'COMPLICATED',hint:'төвөгтэй',diff:'expert',cat:'general',lang:'en'},
  {word:'COMPOSITION',hint:'найрлага',diff:'expert',cat:'general',lang:'en'},
  {word:'CONCENTRATE',hint:'төвлөрөх',diff:'expert',cat:'general',lang:'en'},
  {word:'CONSEQUENCE',hint:'үр дагавар',diff:'expert',cat:'general',lang:'en'},
  {word:'CONSIDERABLE',hint:'харьцангуй их',diff:'expert',cat:'general',lang:'en'},
  {word:'CONSTITUTION',hint:'үндсэн хууль',diff:'expert',cat:'general',lang:'en'},
  {word:'CONSTRUCTION',hint:'барилга',diff:'expert',cat:'general',lang:'en'},
  {word:'CONTRIBUTION',hint:'хувь нэмэр',diff:'expert',cat:'general',lang:'en'},
  {word:'CONTROVERSY',hint:'маргаан',diff:'expert',cat:'general',lang:'en'},
  {word:'COOPERATION',hint:'хамтын ажиллагаа',diff:'expert',cat:'general',lang:'en'},
  {word:'CORPORATION',hint:'корпораци',diff:'expert',cat:'general',lang:'en'},
  {word:'CORRESPONDING',hint:'тохирох',diff:'expert',cat:'general',lang:'en'},
  {word:'COUNTRYSIDE',hint:'хөдөөний газар',diff:'expert',cat:'general',lang:'en'},
  {word:'DECLARATION',hint:'тунхаглал',diff:'expert',cat:'general',lang:'en'},
  {word:'DELIBERATELY',hint:'зориудаар',diff:'expert',cat:'general',lang:'en'},
  {word:'DEMONSTRATE',hint:'харуулах',diff:'expert',cat:'general',lang:'en'},
  {word:'DESCRIPTION',hint:'тодорхойлолт',diff:'expert',cat:'general',lang:'en'},
  {word:'DESTINATION',hint:'очих газар',diff:'expert',cat:'general',lang:'en'},
  {word:'DEVELOPMENT',hint:'хөгжил',diff:'expert',cat:'general',lang:'en'},
  {word:'DIFFERENCES',hint:'ялгаанууд',diff:'expert',cat:'general',lang:'en'},
  {word:'DIPLOMATIC',hint:'дипломат',diff:'expert',cat:'general',lang:'en'},
  {word:'DISCIPLINE',hint:'сахилга бат',diff:'expert',cat:'general',lang:'en'},
  {word:'DISTINCTION',hint:'ялгаа',diff:'expert',cat:'general',lang:'en'},
  {word:'DISTRIBUTION',hint:'хуваарилалт',diff:'expert',cat:'general',lang:'en'},
  {word:'EARTHQUAKE',hint:'газар хөдлөлт',diff:'expert',cat:'general',lang:'en'},
  {word:'ELIMINATION',hint:'арилгах',diff:'expert',cat:'general',lang:'en'},
  {word:'EMBARRASSED',hint:'ичгүүртэй',diff:'expert',cat:'general',lang:'en'}
];

const EN_WORD_DATA=[
  {word:'CAT',hint:'муур',diff:'easy',cat:'general',lang:'en'},
  {word:'DOG',hint:'нохой',diff:'easy',cat:'general',lang:'en'},
  {word:'SUN',hint:'нар',diff:'easy',cat:'general',lang:'en'},
  {word:'MAP',hint:'газрын зураг',diff:'easy',cat:'general',lang:'en'},
  {word:'BUS',hint:'автобус',diff:'easy',cat:'general',lang:'en'},
  {word:'CAR',hint:'машин',diff:'easy',cat:'general',lang:'en'},
  {word:'EGG',hint:'өндөг',diff:'easy',cat:'general',lang:'en'},
  {word:'ARM',hint:'гар',diff:'easy',cat:'general',lang:'en'},
  {word:'EAR',hint:'чих',diff:'easy',cat:'general',lang:'en'},
  {word:'EYE',hint:'нүд',diff:'easy',cat:'general',lang:'en'},
  {word:'LEG',hint:'хөл',diff:'easy',cat:'general',lang:'en'},
  {word:'LIP',hint:'уруул',diff:'easy',cat:'general',lang:'en'},
  {word:'ICE',hint:'мөс',diff:'easy',cat:'general',lang:'en'},
  {word:'KEY',hint:'түлхүүр',diff:'easy',cat:'general',lang:'en'},
  {word:'BAG',hint:'цүнх',diff:'easy',cat:'general',lang:'en'},
  {word:'BED',hint:'ор',diff:'easy',cat:'general',lang:'en'},
  {word:'BOX',hint:'хайрцаг',diff:'easy',cat:'general',lang:'en'},
  {word:'CUP',hint:'аяга',diff:'easy',cat:'general',lang:'en'},
  {word:'DAY',hint:'өдөр',diff:'easy',cat:'general',lang:'en'},
  {word:'FAN',hint:'сэнс',diff:'easy',cat:'general',lang:'en'},
  {word:'FLY',hint:'нисэх',diff:'easy',cat:'general',lang:'en'},
  {word:'FUN',hint:'тааламжтай',diff:'easy',cat:'general',lang:'en'},
  {word:'GUN',hint:'буу',diff:'easy',cat:'general',lang:'en'},
  {word:'HAT',hint:'малгай',diff:'easy',cat:'general',lang:'en'},
  {word:'HOT',hint:'халуун',diff:'easy',cat:'general',lang:'en'},
  {word:'HUG',hint:'тэврэх',diff:'easy',cat:'general',lang:'en'},
  {word:'JAM',hint:'чанамал',diff:'easy',cat:'general',lang:'en'},
  {word:'JOY',hint:'баяр хөөр',diff:'easy',cat:'general',lang:'en'},
  {word:'LAW',hint:'хууль',diff:'easy',cat:'general',lang:'en'},
  {word:'MAN',hint:'эрэгтэй',diff:'easy',cat:'general',lang:'en'},
  {word:'MUD',hint:'шавар',diff:'easy',cat:'general',lang:'en'},
  {word:'NET',hint:'тор',diff:'easy',cat:'general',lang:'en'},
  {word:'OIL',hint:'тос',diff:'easy',cat:'general',lang:'en'},
  {word:'OLD',hint:'хуучин',diff:'easy',cat:'general',lang:'en'},
  {word:'OWL',hint:'шар шувуу',diff:'easy',cat:'general',lang:'en'},
  {word:'PEN',hint:'үзэг',diff:'easy',cat:'general',lang:'en'},
  {word:'PIG',hint:'гахай',diff:'easy',cat:'general',lang:'en'},
  {word:'PIN',hint:'зүү',diff:'easy',cat:'general',lang:'en'},
  {word:'POT',hint:'тогоо',diff:'easy',cat:'general',lang:'en'},
  {word:'RAT',hint:'харх',diff:'easy',cat:'general',lang:'en'},
  {word:'RED',hint:'улаан',diff:'easy',cat:'general',lang:'en'},
  {word:'RUN',hint:'гүйх',diff:'easy',cat:'general',lang:'en'},
  {word:'SEA',hint:'тэнгис',diff:'easy',cat:'general',lang:'en'},
  {word:'SKY',hint:'тэнгэр',diff:'easy',cat:'general',lang:'en'},
  {word:'TOP',hint:'дээд',diff:'easy',cat:'general',lang:'en'},
  {word:'WAR',hint:'дайн',diff:'easy',cat:'general',lang:'en'},
  {word:'WEB',hint:'тор',diff:'easy',cat:'general',lang:'en'},
  {word:'WIN',hint:'ялах',diff:'easy',cat:'general',lang:'en'},
  {word:'ZOO',hint:'амьтны хүрээлэн',diff:'easy',cat:'general',lang:'en'},
  {word:'AIR',hint:'агаар',diff:'easy',cat:'general',lang:'en'},
  {word:'BOOK',hint:'ном',diff:'easy',cat:'general',lang:'en'},
  {word:'BIRD',hint:'шувуу',diff:'easy',cat:'general',lang:'en'},
  {word:'FISH',hint:'загас',diff:'easy',cat:'general',lang:'en'},
  {word:'FIRE',hint:'гал',diff:'easy',cat:'general',lang:'en'},
  {word:'FOOD',hint:'хоол',diff:'easy',cat:'general',lang:'en'},
  {word:'GOLD',hint:'алт',diff:'easy',cat:'general',lang:'en'},
  {word:'HAND',hint:'гар',diff:'easy',cat:'general',lang:'en'},
  {word:'HEAD',hint:'толгой',diff:'easy',cat:'general',lang:'en'},
  {word:'HILL',hint:'толгод',diff:'easy',cat:'general',lang:'en'},
  {word:'HOME',hint:'гэр',diff:'easy',cat:'general',lang:'en'},
  {word:'KING',hint:'хаан',diff:'easy',cat:'general',lang:'en'},
  {word:'LAKE',hint:'нуур',diff:'easy',cat:'general',lang:'en'},
  {word:'LAND',hint:'газар',diff:'easy',cat:'general',lang:'en'},
  {word:'LEAF',hint:'навч',diff:'easy',cat:'general',lang:'en'},
  {word:'LIFE',hint:'амьдрал',diff:'easy',cat:'general',lang:'en'},
  {word:'LION',hint:'арслан',diff:'easy',cat:'general',lang:'en'},
  {word:'LOCK',hint:'цоож',diff:'easy',cat:'general',lang:'en'},
  {word:'LOVE',hint:'хайр',diff:'easy',cat:'general',lang:'en'},
  {word:'MEAT',hint:'мах',diff:'easy',cat:'general',lang:'en'},
  {word:'MILK',hint:'сүү',diff:'easy',cat:'general',lang:'en'},
  {word:'MIND',hint:'оюун',diff:'easy',cat:'general',lang:'en'},
  {word:'MOON',hint:'сар',diff:'easy',cat:'general',lang:'en'},
  {word:'NOSE',hint:'хамар',diff:'easy',cat:'general',lang:'en'},
  {word:'PAIN',hint:'өвдөлт',diff:'easy',cat:'general',lang:'en'},
  {word:'PATH',hint:'зам',diff:'easy',cat:'general',lang:'en'},
  {word:'RAIN',hint:'бороо',diff:'easy',cat:'general',lang:'en'},
  {word:'RICE',hint:'будаа',diff:'easy',cat:'general',lang:'en'},
  {word:'RING',hint:'бөгж',diff:'easy',cat:'general',lang:'en'},
  {word:'ROAD',hint:'зам',diff:'easy',cat:'general',lang:'en'},
  {word:'ROCK',hint:'чулуу',diff:'easy',cat:'general',lang:'en'},
  {word:'ROOF',hint:'дээвэр',diff:'easy',cat:'general',lang:'en'},
  {word:'ROOM',hint:'өрөө',diff:'easy',cat:'general',lang:'en'},
  {word:'ROOT',hint:'үндэс',diff:'easy',cat:'general',lang:'en'},
  {word:'ROSE',hint:'сарнай',diff:'easy',cat:'general',lang:'en'},
  {word:'RULE',hint:'дүрэм',diff:'easy',cat:'general',lang:'en'},
  {word:'SAIL',hint:'далбаа',diff:'easy',cat:'general',lang:'en'},
  {word:'SALT',hint:'давс',diff:'easy',cat:'general',lang:'en'},
  {word:'SAND',hint:'элс',diff:'easy',cat:'general',lang:'en'},
  {word:'SEED',hint:'үр',diff:'easy',cat:'general',lang:'en'},
  {word:'SHIP',hint:'хөлөг онгоц',diff:'easy',cat:'general',lang:'en'},
  {word:'SHOE',hint:'гутал',diff:'easy',cat:'general',lang:'en'},
  {word:'SIGN',hint:'тэмдэг',diff:'easy',cat:'general',lang:'en'},
  {word:'SILK',hint:'торго',diff:'easy',cat:'general',lang:'en'},
  {word:'SKIN',hint:'арьс',diff:'easy',cat:'general',lang:'en'},
  {word:'SNOW',hint:'цас',diff:'easy',cat:'general',lang:'en'},
  {word:'SOAP',hint:'саван',diff:'easy',cat:'general',lang:'en'},
  {word:'SOIL',hint:'хөрс',diff:'easy',cat:'general',lang:'en'},
  {word:'SONG',hint:'дуу',diff:'easy',cat:'general',lang:'en'},
  {word:'SOUL',hint:'сүнс',diff:'easy',cat:'general',lang:'en'},
  {word:'STAR',hint:'од',diff:'easy',cat:'general',lang:'en'},
  {word:'STEM',hint:'иш',diff:'easy',cat:'general',lang:'en'},
  {word:'STEP',hint:'алхам',diff:'easy',cat:'general',lang:'en'},
  {word:'TAIL',hint:'сүүл',diff:'easy',cat:'general',lang:'en'},
  {word:'TALE',hint:'үлгэр',diff:'easy',cat:'general',lang:'en'},
  {word:'TALL',hint:'өндөр',diff:'easy',cat:'general',lang:'en'},
  {word:'TEAR',hint:'нулимс',diff:'easy',cat:'general',lang:'en'},
  {word:'TENT',hint:'майхан',diff:'easy',cat:'general',lang:'en'},
  {word:'TIDE',hint:'татам',diff:'easy',cat:'general',lang:'en'},
  {word:'TILE',hint:'хавтан',diff:'easy',cat:'general',lang:'en'},
  {word:'TIME',hint:'цаг',diff:'easy',cat:'general',lang:'en'},
  {word:'TOAD',hint:'мэлхий',diff:'easy',cat:'general',lang:'en'},
  {word:'TOES',hint:'хуруу',diff:'easy',cat:'general',lang:'en'},
  {word:'TOOL',hint:'багаж',diff:'easy',cat:'general',lang:'en'},
  {word:'TOWN',hint:'хот',diff:'easy',cat:'general',lang:'en'},
  {word:'TREE',hint:'мод',diff:'easy',cat:'general',lang:'en'},
  {word:'TUBE',hint:'хоолой',diff:'easy',cat:'general',lang:'en'},
  {word:'TUNE',hint:'аялгуу',diff:'easy',cat:'general',lang:'en'},
  {word:'UNIT',hint:'нэгж',diff:'easy',cat:'general',lang:'en'},
  {word:'VALE',hint:'хөндий',diff:'easy',cat:'general',lang:'en'},
  {word:'VINE',hint:'усан үзэм',diff:'easy',cat:'general',lang:'en'},
  {word:'VOTE',hint:'санал',diff:'easy',cat:'general',lang:'en'},
  {word:'WADE',hint:'дамжин өнгөрөх',diff:'easy',cat:'general',lang:'en'},
  {word:'WAGE',hint:'цалин',diff:'easy',cat:'general',lang:'en'},
  {word:'WALL',hint:'хана',diff:'easy',cat:'general',lang:'en'},
  {word:'WAVE',hint:'долгион',diff:'easy',cat:'general',lang:'en'},
  {word:'WEED',hint:'хогийн ургамал',diff:'easy',cat:'general',lang:'en'},
  {word:'WELL',hint:'худаг',diff:'easy',cat:'general',lang:'en'},
  {word:'WIND',hint:'салхи',diff:'easy',cat:'general',lang:'en'},
  {word:'WINE',hint:'дарс',diff:'easy',cat:'general',lang:'en'},
  {word:'WING',hint:'далавч',diff:'easy',cat:'general',lang:'en'},
  {word:'WIRE',hint:'утас',diff:'easy',cat:'general',lang:'en'},
  {word:'WISE',hint:'ухаантай',diff:'easy',cat:'general',lang:'en'},
  {word:'WOLF',hint:'чоно',diff:'easy',cat:'general',lang:'en'},
  {word:'WOOD',hint:'мод',diff:'easy',cat:'general',lang:'en'},
  {word:'WORD',hint:'үг',diff:'easy',cat:'general',lang:'en'},
  {word:'WORM',hint:'өт',diff:'easy',cat:'general',lang:'en'},
  {word:'YARN',hint:'утас',diff:'easy',cat:'general',lang:'en'},
  {word:'YEAR',hint:'жил',diff:'easy',cat:'general',lang:'en'},
  {word:'YOLK',hint:'өндгөн шар',diff:'easy',cat:'general',lang:'en'},
  {word:'ZONE',hint:'бүс',diff:'easy',cat:'general',lang:'en'},
  {word:'APPLE',hint:'алим',diff:'medium',cat:'general',lang:'en'},
  {word:'BREAD',hint:'талх',diff:'medium',cat:'general',lang:'en'},
  {word:'BEACH',hint:'эрэг',diff:'medium',cat:'general',lang:'en'},
  {word:'BRAIN',hint:'тархи',diff:'medium',cat:'general',lang:'en'},
  {word:'BLOOD',hint:'цус',diff:'medium',cat:'general',lang:'en'},
  {word:'CHAIR',hint:'сандал',diff:'medium',cat:'general',lang:'en'},
  {word:'CHILD',hint:'хүүхэд',diff:'medium',cat:'general',lang:'en'},
  {word:'CLOCK',hint:'цаг',diff:'medium',cat:'general',lang:'en'},
  {word:'CLOUD',hint:'үүл',diff:'medium',cat:'general',lang:'en'},
  {word:'COAST',hint:'эрэг',diff:'medium',cat:'general',lang:'en'},
  {word:'CREAM',hint:'зөөхий',diff:'medium',cat:'general',lang:'en'},
  {word:'CROWN',hint:'титэм',diff:'medium',cat:'general',lang:'en'},
  {word:'DANCE',hint:'бүжиглэх',diff:'medium',cat:'general',lang:'en'},
  {word:'DEATH',hint:'үхэл',diff:'medium',cat:'general',lang:'en'},
  {word:'DREAM',hint:'мөрөөдөл',diff:'medium',cat:'general',lang:'en'},
  {word:'DRINK',hint:'уух',diff:'medium',cat:'general',lang:'en'},
  {word:'EAGLE',hint:'бүргэд',diff:'medium',cat:'general',lang:'en'},
  {word:'EARTH',hint:'дэлхий',diff:'medium',cat:'general',lang:'en'},
  {word:'ENEMY',hint:'дайсан',diff:'medium',cat:'general',lang:'en'},
  {word:'FENCE',hint:'хашаа',diff:'medium',cat:'general',lang:'en'},
  {word:'FIELD',hint:'талбай',diff:'medium',cat:'general',lang:'en'},
  {word:'FLAME',hint:'дөл',diff:'medium',cat:'general',lang:'en'},
  {word:'FLASH',hint:'гэрэл',diff:'medium',cat:'general',lang:'en'},
  {word:'FLESH',hint:'мах',diff:'medium',cat:'general',lang:'en'},
  {word:'FLOAT',hint:'усан дээр хөвөх',diff:'medium',cat:'general',lang:'en'},
  {word:'FLOOD',hint:'үер',diff:'medium',cat:'general',lang:'en'},
  {word:'FLOOR',hint:'шал',diff:'medium',cat:'general',lang:'en'},
  {word:'FLOUR',hint:'гурил',diff:'medium',cat:'general',lang:'en'},
  {word:'FLUTE',hint:'лимбэ',diff:'medium',cat:'general',lang:'en'},
  {word:'FORCE',hint:'хүч',diff:'medium',cat:'general',lang:'en'},
  {word:'FOREST',hint:'ой',diff:'medium',cat:'general',lang:'en'},
  {word:'GHOST',hint:'сүнс',diff:'medium',cat:'general',lang:'en'},
  {word:'GIANT',hint:'аварга',diff:'medium',cat:'general',lang:'en'},
  {word:'GLASS',hint:'шил',diff:'medium',cat:'general',lang:'en'},
  {word:'GLOBE',hint:'бөмбөрцөг',diff:'medium',cat:'general',lang:'en'},
  {word:'GLOVE',hint:'бээлий',diff:'medium',cat:'general',lang:'en'},
  {word:'GRACE',hint:'нигүүлсэл',diff:'medium',cat:'general',lang:'en'},
  {word:'GRADE',hint:'зэрэглэл',diff:'medium',cat:'general',lang:'en'},
  {word:'GRAIN',hint:'үр тариа',diff:'medium',cat:'general',lang:'en'},
  {word:'GRAPE',hint:'усан үзэм',diff:'medium',cat:'general',lang:'en'},
  {word:'GRASS',hint:'өвс',diff:'medium',cat:'general',lang:'en'},
  {word:'GRAVE',hint:'булш',diff:'medium',cat:'general',lang:'en'},
  {word:'GREEN',hint:'ногоон',diff:'medium',cat:'general',lang:'en'},
  {word:'GRIEF',hint:'гашуудал',diff:'medium',cat:'general',lang:'en'},
  {word:'GROUP',hint:'бүлэг',diff:'medium',cat:'general',lang:'en'},
  {word:'GUARD',hint:'харуул',diff:'medium',cat:'general',lang:'en'},
  {word:'GUEST',hint:'зочин',diff:'medium',cat:'general',lang:'en'},
  {word:'GUIDE',hint:'хөтөч',diff:'medium',cat:'general',lang:'en'},
  {word:'GUILT',hint:'буруу',diff:'medium',cat:'general',lang:'en'},
  {word:'HEART',hint:'зүрх',diff:'medium',cat:'general',lang:'en'},
  {word:'HORSE',hint:'морь',diff:'medium',cat:'general',lang:'en'},
  {word:'HOTEL',hint:'зочид буудал',diff:'medium',cat:'general',lang:'en'},
  {word:'HOUSE',hint:'байшин',diff:'medium',cat:'general',lang:'en'},
  {word:'HUMAN',hint:'хүн',diff:'medium',cat:'general',lang:'en'},
  {word:'HUMOR',hint:'инээдэм',diff:'medium',cat:'general',lang:'en'},
  {word:'HURRY',hint:'яарах',diff:'medium',cat:'general',lang:'en'},
  {word:'IMAGE',hint:'зураг',diff:'medium',cat:'general',lang:'en'},
  {word:'JUDGE',hint:'шүүгч',diff:'medium',cat:'general',lang:'en'},
  {word:'JUICE',hint:'шүүс',diff:'medium',cat:'general',lang:'en'},
  {word:'KNIFE',hint:'хутга',diff:'medium',cat:'general',lang:'en'},
  {word:'LAUGH',hint:'инээх',diff:'medium',cat:'general',lang:'en'},
  {word:'LAYER',hint:'давхарга',diff:'medium',cat:'general',lang:'en'},
  {word:'LEARN',hint:'сурах',diff:'medium',cat:'general',lang:'en'},
  {word:'LEAVE',hint:'явах',diff:'medium',cat:'general',lang:'en'},
  {word:'LIGHT',hint:'гэрэл',diff:'medium',cat:'general',lang:'en'},
  {word:'LIMIT',hint:'хязгаар',diff:'medium',cat:'general',lang:'en'},
  {word:'LIVER',hint:'элэг',diff:'medium',cat:'general',lang:'en'},
  {word:'LOCAL',hint:'орон нутгийн',diff:'medium',cat:'general',lang:'en'},
  {word:'LOGIC',hint:'логик',diff:'medium',cat:'general',lang:'en'},
  {word:'LOYAL',hint:'үнэнч',diff:'medium',cat:'general',lang:'en'},
  {word:'LUNCH',hint:'үдийн хоол',diff:'medium',cat:'general',lang:'en'},
  {word:'MAGIC',hint:'шидэт',diff:'medium',cat:'general',lang:'en'},
  {word:'MAPLE',hint:'агч мод',diff:'medium',cat:'general',lang:'en'},
  {word:'MARCH',hint:'марш',diff:'medium',cat:'general',lang:'en'},
  {word:'MATCH',hint:'тэмцэл',diff:'medium',cat:'general',lang:'en'},
  {word:'MAYOR',hint:'мэр',diff:'medium',cat:'general',lang:'en'},
  {word:'MEDAL',hint:'медаль',diff:'medium',cat:'general',lang:'en'},
  {word:'MERCY',hint:'энэрэл',diff:'medium',cat:'general',lang:'en'},
  {word:'METAL',hint:'метал',diff:'medium',cat:'general',lang:'en'},
  {word:'MONEY',hint:'мөнгө',diff:'medium',cat:'general',lang:'en'},
  {word:'MONTH',hint:'сар',diff:'medium',cat:'general',lang:'en'},
  {word:'MORAL',hint:'ёс суртахуун',diff:'medium',cat:'general',lang:'en'},
  {word:'MOTOR',hint:'мотор',diff:'medium',cat:'general',lang:'en'},
  {word:'MOUNT',hint:'уул',diff:'medium',cat:'general',lang:'en'},
  {word:'MOUSE',hint:'хулгана',diff:'medium',cat:'general',lang:'en'},
  {word:'MOUTH',hint:'ам',diff:'medium',cat:'general',lang:'en'},
  {word:'MUSIC',hint:'хөгжим',diff:'medium',cat:'general',lang:'en'},
  {word:'NIGHT',hint:'шөнө',diff:'medium',cat:'general',lang:'en'},
  {word:'NOBLE',hint:'язгууртан',diff:'medium',cat:'general',lang:'en'},
  {word:'NORTH',hint:'хойд',diff:'medium',cat:'general',lang:'en'},
  {word:'NURSE',hint:'сувилагч',diff:'medium',cat:'general',lang:'en'},
  {word:'OCEAN',hint:'далай',diff:'medium',cat:'general',lang:'en'},
  {word:'OFFER',hint:'санал болгох',diff:'medium',cat:'general',lang:'en'},
  {word:'OFTEN',hint:'байнга',diff:'medium',cat:'general',lang:'en'},
  {word:'OLIVE',hint:'чидун жимс',diff:'medium',cat:'general',lang:'en'},
  {word:'ORDER',hint:'захиалга',diff:'medium',cat:'general',lang:'en'},
  {word:'ORGAN',hint:'эрхтэн',diff:'medium',cat:'general',lang:'en'},
  {word:'OUTER',hint:'гадаад',diff:'medium',cat:'general',lang:'en'},
  {word:'OWNER',hint:'эзэн',diff:'medium',cat:'general',lang:'en'},
  {word:'OZONE',hint:'озон',diff:'medium',cat:'general',lang:'en'},
  {word:'PAINT',hint:'будаг',diff:'medium',cat:'general',lang:'en'},
  {word:'PANIC',hint:'сандрах',diff:'medium',cat:'general',lang:'en'},
  {word:'PAPER',hint:'цаас',diff:'medium',cat:'general',lang:'en'},
  {word:'PARTY',hint:'нам',diff:'medium',cat:'general',lang:'en'},
  {word:'PEACE',hint:'энх тайван',diff:'medium',cat:'general',lang:'en'},
  {word:'PEARL',hint:'сувд',diff:'medium',cat:'general',lang:'en'},
  {word:'PILOT',hint:'нисгэгч',diff:'medium',cat:'general',lang:'en'},
  {word:'PIZZA',hint:'пицца',diff:'medium',cat:'general',lang:'en'},
  {word:'PLACE',hint:'газар',diff:'medium',cat:'general',lang:'en'},
  {word:'PLAIN',hint:'тэгш',diff:'medium',cat:'general',lang:'en'},
  {word:'PLANE',hint:'онгоц',diff:'medium',cat:'general',lang:'en'},
  {word:'PLANT',hint:'ургамал',diff:'medium',cat:'general',lang:'en'},
  {word:'PLATE',hint:'таваг',diff:'medium',cat:'general',lang:'en'},
  {word:'PLAZA',hint:'талбай',diff:'medium',cat:'general',lang:'en'},
  {word:'PLUCK',hint:'зулгаах',diff:'medium',cat:'general',lang:'en'},
  {word:'PLUMB',hint:'шулуун',diff:'medium',cat:'general',lang:'en'},
  {word:'PLUME',hint:'өд',diff:'medium',cat:'general',lang:'en'},
  {word:'POINT',hint:'цэг',diff:'medium',cat:'general',lang:'en'},
  {word:'POLAR',hint:'туйлын',diff:'medium',cat:'general',lang:'en'},
  {word:'POPPY',hint:'хонхор цэцэг',diff:'medium',cat:'general',lang:'en'},
  {word:'POWER',hint:'эрх мэдэл',diff:'medium',cat:'general',lang:'en'},
  {word:'PRESS',hint:'дарах',diff:'medium',cat:'general',lang:'en'},
  {word:'PRICE',hint:'үнэ',diff:'medium',cat:'general',lang:'en'},
  {word:'PRIDE',hint:'бахархал',diff:'medium',cat:'general',lang:'en'},
  {word:'PRIME',hint:'анхны',diff:'medium',cat:'general',lang:'en'},
  {word:'PRINCE',hint:'ханхүү',diff:'medium',cat:'general',lang:'en'},
  {word:'PRIZE',hint:'шагнал',diff:'medium',cat:'general',lang:'en'},
  {word:'PROOF',hint:'нотолгоо',diff:'medium',cat:'general',lang:'en'},
  {word:'PROUD',hint:'бахархалтай',diff:'medium',cat:'general',lang:'en'},
  {word:'PSALM',hint:'дуулал',diff:'medium',cat:'general',lang:'en'},
  {word:'PULSE',hint:'судасны цохилт',diff:'medium',cat:'general',lang:'en'},
  {word:'PUNCH',hint:'цохих',diff:'medium',cat:'general',lang:'en'},
  {word:'PUPIL',hint:'сурагч',diff:'medium',cat:'general',lang:'en'},
  {word:'QUEEN',hint:'хатан хаан',diff:'medium',cat:'general',lang:'en'},
  {word:'QUEST',hint:'эрэл хайгуул',diff:'medium',cat:'general',lang:'en'},
  {word:'QUEUE',hint:'дараалал',diff:'medium',cat:'general',lang:'en'},
  {word:'QUICK',hint:'хурдан',diff:'medium',cat:'general',lang:'en'},
  {word:'QUIET',hint:'чимээгүй',diff:'medium',cat:'general',lang:'en'},
  {word:'QUOTA',hint:'хувь',diff:'medium',cat:'general',lang:'en'},
  {word:'QUOTE',hint:'иш татах',diff:'medium',cat:'general',lang:'en'},
  {word:'RABBI',hint:'рабби',diff:'medium',cat:'general',lang:'en'},
  {word:'RADAR',hint:'радар',diff:'medium',cat:'general',lang:'en'},
  {word:'RADIO',hint:'радио',diff:'medium',cat:'general',lang:'en'},
  {word:'RANCH',hint:'ранч',diff:'medium',cat:'general',lang:'en'},
  {word:'RANGE',hint:'хэмжээ',diff:'medium',cat:'general',lang:'en'},
  {word:'RAPID',hint:'хурдан',diff:'medium',cat:'general',lang:'en'},
  {word:'RATIO',hint:'харьцаа',diff:'medium',cat:'general',lang:'en'},
  {word:'REACH',hint:'хүрэх',diff:'medium',cat:'general',lang:'en'},
  {word:'REALM',hint:'хаант улс',diff:'medium',cat:'general',lang:'en'},
  {word:'REBEL',hint:'бослого',diff:'medium',cat:'general',lang:'en'},
  {word:'REPLY',hint:'хариу',diff:'medium',cat:'general',lang:'en'},
  {word:'RIDER',hint:'морьт хүн',diff:'medium',cat:'general',lang:'en'},
  {word:'RIDGE',hint:'нуруу',diff:'medium',cat:'general',lang:'en'},
  {word:'RIFLE',hint:'буу',diff:'medium',cat:'general',lang:'en'},
  {word:'RIGHT',hint:'зөв',diff:'medium',cat:'general',lang:'en'},
  {word:'RISKY',hint:'эрсдэлтэй',diff:'medium',cat:'general',lang:'en'},
  {word:'RIVER',hint:'гол',diff:'medium',cat:'general',lang:'en'},
  {word:'ROBIN',hint:'улаан хаваргана',diff:'medium',cat:'general',lang:'en'},
  {word:'ROBOT',hint:'робот',diff:'medium',cat:'general',lang:'en'},
  {word:'ROCKY',hint:'чулуурхаг',diff:'medium',cat:'general',lang:'en'},
  {word:'ROYAL',hint:'хааны',diff:'medium',cat:'general',lang:'en'},
  {word:'RUGBY',hint:'регби',diff:'medium',cat:'general',lang:'en'},
  {word:'RULER',hint:'захирагч',diff:'medium',cat:'general',lang:'en'},
  {word:'RURAL',hint:'хөдөөний',diff:'medium',cat:'general',lang:'en'},
  {word:'SAFER',hint:'аюулгүй',diff:'medium',cat:'general',lang:'en'},
  {word:'BROTHER',hint:'ах дүү',diff:'hard',cat:'general',lang:'en'},
  {word:'CAPTAIN',hint:'ахлагч',diff:'hard',cat:'general',lang:'en'},
  {word:'COMFORT',hint:'тайтгарал',diff:'hard',cat:'general',lang:'en'},
  {word:'COMPANY',hint:'компани',diff:'hard',cat:'general',lang:'en'},
  {word:'COMPETE',hint:'өрсөлдөх',diff:'hard',cat:'general',lang:'en'},
  {word:'CONCERN',hint:'санаа зовнил',diff:'hard',cat:'general',lang:'en'},
  {word:'COUNTRY',hint:'улс',diff:'hard',cat:'general',lang:'en'},
  {word:'COURAGE',hint:'зориг',diff:'hard',cat:'general',lang:'en'},
  {word:'CULTURE',hint:'соёл',diff:'hard',cat:'general',lang:'en'},
  {word:'CURIOUS',hint:'сонирхолтой',diff:'hard',cat:'general',lang:'en'},
  {word:'DECLARE',hint:'тунхаглах',diff:'hard',cat:'general',lang:'en'},
  {word:'DEFENSE',hint:'хамгаалалт',diff:'hard',cat:'general',lang:'en'},
  {word:'DESERVE',hint:'зохих',diff:'hard',cat:'general',lang:'en'},
  {word:'DESTINY',hint:'хувь тавилан',diff:'hard',cat:'general',lang:'en'},
  {word:'DEVELOP',hint:'хөгжих',diff:'hard',cat:'general',lang:'en'},
  {word:'DIAMOND',hint:'алмаз',diff:'hard',cat:'general',lang:'en'},
  {word:'DISCUSS',hint:'ярилцах',diff:'hard',cat:'general',lang:'en'},
  {word:'DISEASE',hint:'өвчин',diff:'hard',cat:'general',lang:'en'},
  {word:'DISTANT',hint:'алслагдсан',diff:'hard',cat:'general',lang:'en'},
  {word:'DOLPHIN',hint:'дельфин',diff:'hard',cat:'general',lang:'en'},
  {word:'ECONOMY',hint:'эдийн засаг',diff:'hard',cat:'general',lang:'en'},
  {word:'EMOTION',hint:'сэтгэл хөдлөл',diff:'hard',cat:'general',lang:'en'},
  {word:'EMPEROR',hint:'эзэн хаан',diff:'hard',cat:'general',lang:'en'},
  {word:'ENDLESS',hint:'төгсгөлгүй',diff:'hard',cat:'general',lang:'en'},
  {word:'ENGLISH',hint:'англи хэл',diff:'hard',cat:'general',lang:'en'},
  {word:'EXAMINE',hint:'шалгах',diff:'hard',cat:'general',lang:'en'},
  {word:'EXAMPLE',hint:'жишээ',diff:'hard',cat:'general',lang:'en'},
  {word:'EXPLORE',hint:'судлах',diff:'hard',cat:'general',lang:'en'},
  {word:'FACTORY',hint:'үйлдвэр',diff:'hard',cat:'general',lang:'en'},
  {word:'FANTASY',hint:'хиймэл ертөнц',diff:'hard',cat:'general',lang:'en'},
  {word:'FEATHER',hint:'өд',diff:'hard',cat:'general',lang:'en'},
  {word:'FICTION',hint:'уран зохиол',diff:'hard',cat:'general',lang:'en'},
  {word:'FINANCE',hint:'санхүү',diff:'hard',cat:'general',lang:'en'},
  {word:'FREEDOM',hint:'эрх чөлөө',diff:'hard',cat:'general',lang:'en'},
  {word:'FRIENDS',hint:'найзууд',diff:'hard',cat:'general',lang:'en'},
  {word:'GENERAL',hint:'генерал',diff:'hard',cat:'general',lang:'en'},
  {word:'HISTORY',hint:'түүх',diff:'hard',cat:'general',lang:'en'},
  {word:'HOLIDAY',hint:'амралт',diff:'hard',cat:'general',lang:'en'},
  {word:'HARVEST',hint:'ургац',diff:'hard',cat:'general',lang:'en'},
  {word:'HABITAT',hint:'орчин',diff:'hard',cat:'general',lang:'en'},
  {word:'IMAGINE',hint:'төсөөлөх',diff:'hard',cat:'general',lang:'en'},
  {word:'IMPROVE',hint:'сайжруулах',diff:'hard',cat:'general',lang:'en'},
  {word:'JOURNEY',hint:'аялал',diff:'hard',cat:'general',lang:'en'},
  {word:'JUSTICE',hint:'шударга ёс',diff:'hard',cat:'general',lang:'en'},
  {word:'KITCHEN',hint:'гал тогоо',diff:'hard',cat:'general',lang:'en'},
  {word:'LANTERN',hint:'дэн',diff:'hard',cat:'general',lang:'en'},
  {word:'LIBRARY',hint:'номын сан',diff:'hard',cat:'general',lang:'en'},
  {word:'MACHINE',hint:'машин',diff:'hard',cat:'general',lang:'en'},
  {word:'MEASURE',hint:'хэмжих',diff:'hard',cat:'general',lang:'en'},
  {word:'MILLION',hint:'сая',diff:'hard',cat:'general',lang:'en'},
  {word:'MONSTER',hint:'мангас',diff:'hard',cat:'general',lang:'en'},
  {word:'MORNING',hint:'өглөө',diff:'hard',cat:'general',lang:'en'},
  {word:'MYSTERY',hint:'нууц',diff:'hard',cat:'general',lang:'en'},
  {word:'NATURAL',hint:'байгалийн',diff:'hard',cat:'general',lang:'en'},
  {word:'NETWORK',hint:'сүлжээ',diff:'hard',cat:'general',lang:'en'},
  {word:'NOTHING',hint:'юу ч биш',diff:'hard',cat:'general',lang:'en'},
  {word:'NUCLEAR',hint:'цөмийн',diff:'hard',cat:'general',lang:'en'},
  {word:'NURSING',hint:'сувилал',diff:'hard',cat:'general',lang:'en'},
  {word:'OLYMPIC',hint:'олимпийн',diff:'hard',cat:'general',lang:'en'},
  {word:'OPINION',hint:'үзэл бодол',diff:'hard',cat:'general',lang:'en'},
  {word:'OUTDOOR',hint:'гадаа',diff:'hard',cat:'general',lang:'en'},
  {word:'OUTSIDE',hint:'гадна',diff:'hard',cat:'general',lang:'en'},
  {word:'PACKAGE',hint:'багц',diff:'hard',cat:'general',lang:'en'},
  {word:'PASSION',hint:'хүсэл тэмүүлэл',diff:'hard',cat:'general',lang:'en'},
  {word:'PATTERN',hint:'хэв маяг',diff:'hard',cat:'general',lang:'en'},
  {word:'PERFECT',hint:'төгс',diff:'hard',cat:'general',lang:'en'},
  {word:'PHYSICS',hint:'физик',diff:'hard',cat:'general',lang:'en'},
  {word:'PICTURE',hint:'зураг',diff:'hard',cat:'general',lang:'en'},
  {word:'PLANET',hint:'гараг',diff:'medium',cat:'general',lang:'en'},
  {word:'PLASTIC',hint:'хуванцар',diff:'hard',cat:'general',lang:'en'},
  {word:'POPULAR',hint:'алдартай',diff:'hard',cat:'general',lang:'en'},
  {word:'POSSESS',hint:'эзэмших',diff:'hard',cat:'general',lang:'en'},
  {word:'PRESENT',hint:'бэлэг',diff:'hard',cat:'general',lang:'en'},
  {word:'PRIVATE',hint:'хувийн',diff:'hard',cat:'general',lang:'en'},
  {word:'PROBLEM',hint:'асуудал',diff:'hard',cat:'general',lang:'en'},
  {word:'PROCESS',hint:'үйл явц',diff:'hard',cat:'general',lang:'en'},
  {word:'PRODUCE',hint:'үйлдвэрлэх',diff:'hard',cat:'general',lang:'en'},
  {word:'PROTECT',hint:'хамгаалах',diff:'hard',cat:'general',lang:'en'},
  {word:'PROVIDE',hint:'хангах',diff:'hard',cat:'general',lang:'en'},
  {word:'PURPOSE',hint:'зорилго',diff:'hard',cat:'general',lang:'en'},
  {word:'QUALITY',hint:'чанар',diff:'hard',cat:'general',lang:'en'},
  {word:'QUARTER',hint:'дөрөвний нэг',diff:'hard',cat:'general',lang:'en'},
  {word:'QUICKLY',hint:'хурдан',diff:'hard',cat:'general',lang:'en'},
  {word:'REALITY',hint:'бодит байдал',diff:'hard',cat:'general',lang:'en'},
  {word:'RECOVER',hint:'эдгэрэх',diff:'hard',cat:'general',lang:'en'},
  {word:'REGULAR',hint:'тогтмол',diff:'hard',cat:'general',lang:'en'},
  {word:'RELEASE',hint:'суллах',diff:'hard',cat:'general',lang:'en'},
  {word:'REPLACE',hint:'орлуулах',diff:'hard',cat:'general',lang:'en'},
  {word:'REQUIRE',hint:'шаардах',diff:'hard',cat:'general',lang:'en'},
  {word:'RESPECT',hint:'хүндэтгэл',diff:'hard',cat:'general',lang:'en'},
  {word:'RESULTS',hint:'үр дүн',diff:'hard',cat:'general',lang:'en'},
  {word:'REVENUE',hint:'орлого',diff:'hard',cat:'general',lang:'en'},
  {word:'ROMANCE',hint:'дурлал',diff:'hard',cat:'general',lang:'en'},
  {word:'SCIENCE',hint:'шинжлэх ухаан',diff:'hard',cat:'general',lang:'en'},
  {word:'SECTION',hint:'хэсэг',diff:'hard',cat:'general',lang:'en'},
  {word:'SERVICE',hint:'үйлчилгээ',diff:'hard',cat:'general',lang:'en'},
  {word:'SILENCE',hint:'чимээгүй байдал',diff:'hard',cat:'general',lang:'en'},
  {word:'SIMILAR',hint:'адилхан',diff:'hard',cat:'general',lang:'en'},
  {word:'SOLDIER',hint:'цэрэг',diff:'hard',cat:'general',lang:'en'},
  {word:'SPECIAL',hint:'тусгай',diff:'hard',cat:'general',lang:'en'},
  {word:'SPONSOR',hint:'ивээн тэтгэгч',diff:'hard',cat:'general',lang:'en'},
  {word:'STUDENT',hint:'оюутан',diff:'hard',cat:'general',lang:'en'},
  {word:'SUCCESS',hint:'амжилт',diff:'hard',cat:'general',lang:'en'},
  {word:'SUGGEST',hint:'санал болгох',diff:'hard',cat:'general',lang:'en'},
  {word:'SUPPORT',hint:'дэмжих',diff:'hard',cat:'general',lang:'en'},
  {word:'TEACHER',hint:'багш',diff:'hard',cat:'general',lang:'en'},
  {word:'THOUGHT',hint:'бодол',diff:'hard',cat:'general',lang:'en'},
  {word:'THROUGH',hint:'дамжин',diff:'hard',cat:'general',lang:'en'},
  {word:'THUNDER',hint:'аянга',diff:'hard',cat:'general',lang:'en'},
  {word:'TONIGHT',hint:'өнөөдрийн шөнө',diff:'hard',cat:'general',lang:'en'},
  {word:'TOURISM',hint:'аялал жуулчлал',diff:'hard',cat:'general',lang:'en'},
  {word:'TOWARDS',hint:'тийш',diff:'hard',cat:'general',lang:'en'},
  {word:'VILLAGE',hint:'тосгон',diff:'hard',cat:'general',lang:'en'},
  {word:'VISIBLE',hint:'харагдах',diff:'hard',cat:'general',lang:'en'},
  {word:'VITAMIN',hint:'витамин',diff:'hard',cat:'general',lang:'en'},
  {word:'VOLCANO',hint:'галт уул',diff:'hard',cat:'general',lang:'en'},
  {word:'WARRIOR',hint:'дайчин',diff:'hard',cat:'general',lang:'en'},
  {word:'WELCOME',hint:'тавтай морил',diff:'hard',cat:'general',lang:'en'},
  {word:'WESTERN',hint:'баруун талын',diff:'hard',cat:'general',lang:'en'},
  {word:'ANCIENT',hint:'эртний',diff:'hard',cat:'general',lang:'en'},
  {word:'ADVENTURE',hint:'адал явдал',diff:'expert',cat:'general',lang:'en'},
  {word:'BEAUTIFUL',hint:'үзэсгэлэнтэй',diff:'expert',cat:'general',lang:'en'},
  {word:'BEGINNING',hint:'эхлэл',diff:'expert',cat:'general',lang:'en'},
  {word:'BRILLIANT',hint:'гайхалтай',diff:'expert',cat:'general',lang:'en'},
  {word:'CELEBRATE',hint:'тэмдэглэх',diff:'expert',cat:'general',lang:'en'},
  {word:'CHARACTER',hint:'дүр',diff:'expert',cat:'general',lang:'en'},
  {word:'CHOCOLATE',hint:'шоколад',diff:'expert',cat:'general',lang:'en'},
  {word:'COMMUNITY',hint:'нийгэмлэг',diff:'expert',cat:'general',lang:'en'},
  {word:'CONTAINER',hint:'сав',diff:'expert',cat:'general',lang:'en'},
  {word:'CONTINENT',hint:'тив',diff:'expert',cat:'general',lang:'en'},
  {word:'DANGEROUS',hint:'аюултай',diff:'expert',cat:'general',lang:'en'},
  {word:'DEMOCRACY',hint:'ардчилал',diff:'expert',cat:'general',lang:'en'},
  {word:'DIFFERENT',hint:'өөр',diff:'expert',cat:'general',lang:'en'},
  {word:'DISCOVERY',hint:'нээлт',diff:'expert',cat:'general',lang:'en'},
  {word:'EDUCATION',hint:'боловсрол',diff:'expert',cat:'general',lang:'en'},
  {word:'EMERGENCY',hint:'яаралтай тусламж',diff:'expert',cat:'general',lang:'en'},
  {word:'EVOLUTION',hint:'хувьсал',diff:'expert',cat:'general',lang:'en'},
  {word:'EXCELLENT',hint:'гайхалтай',diff:'expert',cat:'general',lang:'en'},
  {word:'EXPLOSION',hint:'дэлбэрэлт',diff:'expert',cat:'general',lang:'en'},
  {word:'FANTASTIC',hint:'гайхалтай',diff:'expert',cat:'general',lang:'en'},
  {word:'FORBIDDEN',hint:'хориотой',diff:'expert',cat:'general',lang:'en'},
  {word:'GEOGRAPHY',hint:'газар зүй',diff:'expert',cat:'general',lang:'en'},
  {word:'HAPPINESS',hint:'аз жаргал',diff:'expert',cat:'general',lang:'en'},
  {word:'HURRICANE',hint:'хар салхи',diff:'expert',cat:'general',lang:'en'},
  {word:'IMPORTANT',hint:'чухал',diff:'expert',cat:'general',lang:'en'},
  {word:'INFLUENCE',hint:'нөлөө',diff:'expert',cat:'general',lang:'en'},
  {word:'KNOWLEDGE',hint:'мэдлэг',diff:'expert',cat:'general',lang:'en'},
  {word:'LANDSCAPE',hint:'байгалийн дүр зураг',diff:'expert',cat:'general',lang:'en'},
  {word:'LIGHTNING',hint:'аянга',diff:'expert',cat:'general',lang:'en'},
  {word:'MACHINERY',hint:'тоног төхөөрөмж',diff:'expert',cat:'general',lang:'en'},
  {word:'MARKETING',hint:'маркетинг',diff:'expert',cat:'general',lang:'en'},
  {word:'MOUNTAINS',hint:'уулс',diff:'expert',cat:'general',lang:'en'},
  {word:'NEGOTIATE',hint:'хэлэлцэх',diff:'expert',cat:'general',lang:'en'},
  {word:'NEWSPAPER',hint:'сонин',diff:'expert',cat:'general',lang:'en'},
  {word:'ORCHESTRA',hint:'найрал хөгжим',diff:'expert',cat:'general',lang:'en'},
  {word:'PARAGRAPH',hint:'параграф',diff:'expert',cat:'general',lang:'en'},
  {word:'PASSENGER',hint:'зорчигч',diff:'expert',cat:'general',lang:'en'},
  {word:'PERMANENT',hint:'байнгын',diff:'expert',cat:'general',lang:'en'},
  {word:'PNEUMONIA',hint:'уушигны хатгалгаа',diff:'expert',cat:'general',lang:'en'},
  {word:'POLLUTION',hint:'бохирдол',diff:'expert',cat:'general',lang:'en'},
  {word:'PRESIDENT',hint:'ерөнхийлөгч',diff:'expert',cat:'general',lang:'en'},
  {word:'PROGRAMME',hint:'хөтөлбөр',diff:'expert',cat:'general',lang:'en'},
  {word:'PROMOTION',hint:'дэвшүүлэх',diff:'expert',cat:'general',lang:'en'},
  {word:'PROTOTYPE',hint:'загвар',diff:'expert',cat:'general',lang:'en'},
  {word:'QUARANTINE',hint:'карантин',diff:'expert',cat:'general',lang:'en'},
  {word:'RENEWABLE',hint:'сэргээгдэх',diff:'expert',cat:'general',lang:'en'},
  {word:'REPRESENT',hint:'төлөөлөх',diff:'expert',cat:'general',lang:'en'},
  {word:'RESOURCES',hint:'нөөц',diff:'expert',cat:'general',lang:'en'},
  {word:'REVOLUTION',hint:'хувьсгал',diff:'expert',cat:'general',lang:'en'},
  {word:'SANCTUARY',hint:'дагшин',diff:'expert',cat:'general',lang:'en'},
  {word:'SCIENTIFIC',hint:'шинжлэх ухааны',diff:'expert',cat:'general',lang:'en'},
  {word:'SEPARATION',hint:'тусгаарлал',diff:'expert',cat:'general',lang:'en'},
  {word:'SITUATION',hint:'нөхцөл байдал',diff:'expert',cat:'general',lang:'en'},
  {word:'SMARTPHONE',hint:'ухаалаг утас',diff:'expert',cat:'general',lang:'en'},
  {word:'SPECIALIST',hint:'мэргэжилтэн',diff:'expert',cat:'general',lang:'en'},
  {word:'STRATEGIES',hint:'стратегиуд',diff:'expert',cat:'general',lang:'en'},
  {word:'STRENGTHEN',hint:'бэхжүүлэх',diff:'expert',cat:'general',lang:'en'},
  {word:'SUBMARINE',hint:'шумбагч онгоц',diff:'expert',cat:'general',lang:'en'},
  {word:'TECHNOLOGY',hint:'технологи',diff:'expert',cat:'general',lang:'en'},
  {word:'TEMPERATURE',hint:'температур',diff:'expert',cat:'general',lang:'en'},
  {word:'TREMENDOUS',hint:'асар их',diff:'expert',cat:'general',lang:'en'},
  {word:'UNDERSTAND',hint:'ойлгох',diff:'expert',cat:'general',lang:'en'},
  {word:'UNIVERSITY',hint:'их сургууль',diff:'expert',cat:'general',lang:'en'},
  {word:'VOCABULARY',hint:'үгийн сан',diff:'expert',cat:'general',lang:'en'},
  {word:'WILDERNESS',hint:'цөл газар',diff:'expert',cat:'general',lang:'en'},
  {word:'WILLINGNESS',hint:'хүсэл эрмэлзэл',diff:'expert',cat:'general',lang:'en'}
];

async function wqSeedRussianWords(){
  if(!isAdmin){notify('Зөвхөн admin');return;}
  if(!confirm('Орос '+RU_WORD_DATA.length+' үг Firestore-д нэмэх үү?')) return;
  let added=0, skipped=0;
  const snap=await getDocs(collection(fsdb,'word_items_ru'));
  const existing=new Set();
  snap.forEach(d=>existing.add(d.data().word));
  const allRu=[...RU_WORD_DATA,...RU_EXTRA_DATA];
  const seenRu=new Set();
  const uniqueRu=allRu.filter(w=>{if(seenRu.has(w.word))return false;seenRu.add(w.word);return true;});
  for(const w of uniqueRu){
    if(existing.has(w.word)){skipped++;continue;}
    const id=w.word.toLowerCase().replace(/[^a-zа-яё0-9]/g,'_')+'_'+w.diff;
    await setDoc(doc(fsdb,'word_items_ru',id),{...w,createdAt:Date.now()});
    added++;
  }
  notify('✅ '+added+' үг нэмэгдлээ! '+skipped+' аль хэдийн байсан.');
}

async function wqSeedEnglishWords(){
  if(!isAdmin){notify('Зөвхөн admin');return;}
  if(!confirm('Англи '+EN_WORD_DATA.length+' үг Firestore-д нэмэх үү?')) return;
  let added=0, skipped=0;
  const snap=await getDocs(collection(fsdb,'word_items_en'));
  const existing=new Set();
  snap.forEach(d=>existing.add(d.data().word));
  const allEn=[...EN_WORD_DATA,...EN_EXTRA_DATA];
  // Давхардсан үгсийг хасах
  const seenEn=new Set();
  const uniqueEn=allEn.filter(w=>{if(seenEn.has(w.word))return false;seenEn.add(w.word);return true;});
  for(const w of uniqueEn){
    if(existing.has(w.word)){skipped++;continue;}
    const id=w.word.toLowerCase().replace(/[^a-zа-яё0-9]/g,'_')+'_'+w.diff;
    await setDoc(doc(fsdb,'word_items_en',id),{...w,createdAt:Date.now()});
    added++;
  }
  notify('✅ '+added+' үг нэмэгдлээ! '+skipped+' аль хэдийн байсан.');
}

const WQ_LANG={
  mn:{flag:'🇲🇳',color:'#39ff14',rgba:'rgba(57,255,20,.6)',label:'Монгол',ph:'Үгийг бичнэ үү...',skip:'⏭ АЛГАСАХ',ok:'✅ ЗӨВ!',bad:'❌ БУРУУ',timeout:'⏰ ХУГАЦАА ДУУСЛАА',coll:'word_items'},
  ru:{flag:'🇷🇺',color:'#4fc3f7',rgba:'rgba(79,195,247,.6)',label:'Орос',ph:'Введите слово...',skip:'⏭ ПРОПУСТИТЬ',ok:'✅ ВЕРНО!',bad:'❌ НЕВЕРНО',timeout:'⏰ ВРЕМЯ ВЫШЛО',coll:'word_items_ru'},
  en:{flag:'🇬🇧',color:'#ff6b6b',rgba:'rgba(255,107,107,.6)',label:'Англи',ph:'Type the word...',skip:'⏭ SKIP',ok:'✅ CORRECT!',bad:'❌ WRONG',timeout:'⏰ TIME\'S UP',coll:'word_items_en'},
};

let wqLang='mn';
let wqSettings={mn:{diff:'easy',count:20,time:20},ru:{diff:'easy',count:20,time:20},en:{diff:'easy',count:20,time:20}};
let wqPool=[],wqCurrentWord=null,wqCorrect=0,wqWrong=0,wqSkipped=0;
let wqGameOver=false,wqStartTs=0,wqWordTimer=null,wqPlayerName='Тоглогч';
let wqScores={mn:[],ru:[],en:[]};

function showWQHome(){
  setTheme('wq');
  setAllInactive();
  document.getElementById('wqHomeScreen').classList.add('active');
  document.getElementById('navWQ').classList.add('active');
  wqLoadAllScores();
}

function wqSetDiff(d,lang){
  wqSettings[lang].diff=d;
  document.querySelectorAll('#wqDiffGrid'+{mn:'',ru:'Ru',en:'En'}[lang]+' .mc-reveal-btn').forEach(b=>b.classList.toggle('active',b.dataset.diff===d));
}
function wqSetCount(n,lang){
  wqSettings[lang].count=n;
  document.querySelectorAll('#wqCountGrid'+{mn:'',ru:'Ru',en:'En'}[lang]+' .mc-reveal-btn').forEach(b=>b.classList.toggle('active',b.dataset.n==n));
}
function wqSetTime(t,lang){
  wqSettings[lang].time=t;
  document.querySelectorAll('#wqTimeGrid'+{mn:'',ru:'Ru',en:'En'}[lang]+' .mc-reveal-btn').forEach(b=>b.classList.toggle('active',b.dataset.t==t));
}

function wqScrambleWord(word){
  const arr=word.split('');
  for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}
  if(arr.join('')===word&&word.length>1){[arr[0],arr[1]]=[arr[1],arr[0]];}
  return arr;
}

function wqShowLetters(scrambled,color){
  document.getElementById('wqScramble').innerHTML=scrambled.map((l,i)=>`<div class="wq-letter" style="border-color:${color};color:${color};text-shadow:0 0 12px ${color};" onclick="wqClickLetter(this,'${l}',${i})">${l}</div>`).join('');
  document.getElementById('wqAnswerTiles').innerHTML='';
  window._wqClickedLetters=[];
}

function wqClickLetter(el,letter,idx){
  if(el.classList.contains('used')) return;
  el.classList.add('used');
  window._wqClickedLetters=window._wqClickedLetters||[];
  window._wqClickedLetters.push({letter,idx,el});
  const tilesWrap=document.getElementById('wqAnswerTiles');
  const cfg=WQ_LANG[wqLang];
  const tile=document.createElement('div');
  tile.className='wq-answer-tile';
  tile.style.borderColor=cfg.color;
  tile.style.color=cfg.color;
  tile.textContent=letter;
  tile.onclick=()=>{
    // Remove this tile, restore source letter
    const pos=window._wqClickedLetters.findIndex(x=>x.el===el);
    if(pos===-1) return;
    window._wqClickedLetters.splice(pos,1);
    el.classList.remove('used');
    tile.remove();
    // Update input
    const cur=window._wqClickedLetters.map(x=>x.letter).join('');
    document.getElementById('wqInput').value=cur;
    wqCheckInput(cur);
  };
  tilesWrap.appendChild(tile);
  // Sync to input
  const cur=window._wqClickedLetters.map(x=>x.letter).join('');
  document.getElementById('wqInput').value=cur;
  wqCheckInput(cur);
}

async function wqStartGame(lang){
  if(!currentUser){openLogin();return;}
  if(!await hasActiveSubscription()){showSubRequired();return;}
  wqLang=lang;
  const cfg=WQ_LANG[lang];
  const s=wqSettings[lang];
  const nameId={mn:'wqPlayerName',ru:'wqPlayerNameRu',en:'wqPlayerNameEn'}[lang];
  wqPlayerName=document.getElementById(nameId).value.trim()||'Тоглогч';
  let pool=[];
  try{
    const snap=await getDocs(collection(fsdb,cfg.coll));
    snap.forEach(d=>pool.push({...d.data(),_id:d.id}));
  }catch(e){
    showError('Үг ачааллахад алдаа','Интернэт холболтоо шалгаад дахин оролдоно уу.',()=>wqStartGame(wqLang));
    return;
  }
  const filtered=pool.filter(w=>w.diff===s.diff);
  if(!filtered.length){notify('Энэ түвшинд үг байхгүй! Админ үг нэмэх хэрэгтэй.');return;}
  for(let i=filtered.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[filtered[i],filtered[j]]=[filtered[j],filtered[i]];}
  wqPool=filtered.slice(0,s.count);
  wqCorrect=0;wqWrong=0;wqSkipped=0;wqGameOver=false;wqStartTs=Date.now();
  // Apply lang colors to game screen
  document.getElementById('wqLangFlag').textContent=cfg.flag;
  document.getElementById('wqTimeLeft').style.color=cfg.rgba;
  document.getElementById('wqSkipBtn').textContent=cfg.skip;
  document.getElementById('wqSkipBtn').style.color=cfg.rgba.replace('.6','.5');
  document.getElementById('wqSkipBtn').style.borderColor=cfg.rgba.replace('.6','.3');
  document.getElementById('wqInput').placeholder=cfg.ph;
  document.getElementById('wqInput').style.color=cfg.color;
  document.getElementById('wqInput').style.borderColor=cfg.rgba.replace('.6','.3');
  document.getElementById('wqTimerFill').style.background='linear-gradient(90deg,'+cfg.color+','+cfg.color+'88)';
  setAllInactive();
  document.getElementById('wqGameScreen').classList.add('active');
  document.getElementById('wqPlayerLabel').textContent='👤 '+wqPlayerName;
  wqNextWord();
}

function wqNextWord(){
  if(wqPool.length===0){wqFinish();return;}
  wqCurrentWord=wqPool.shift();
  const word=wqCurrentWord.word.toUpperCase();
  const cfg=WQ_LANG[wqLang];
  wqShowLetters(wqScrambleWord(word),cfg.color);
  const inp=document.getElementById('wqInput');
  inp.value='';inp.className='wq-inp';
  document.getElementById('wqFeedback').textContent='';
  document.getElementById('wqAnswerTiles').innerHTML='';
  window._wqClickedLetters=[];
  const done=wqCorrect+wqWrong+wqSkipped;
  const total=done+wqPool.length+1;
  document.getElementById('wqProgress').textContent=(done+1)+'/'+total;
  document.getElementById('wqProgress').style.color=cfg.color;
  document.getElementById('wqScore').textContent='⭐ '+wqCorrect;
  const hintEl=document.getElementById('wqHintText');
  hintEl.style.color=cfg.rgba;
  hintEl.textContent=wqCurrentWord.hint?'💡 '+wqCurrentWord.hint:'';
  inp.focus();
  wqStartWordTimer();
}

function wqStartWordTimer(){
  clearInterval(wqWordTimer);
  let elapsed=0;
  const s=wqSettings[wqLang];
  const fill=document.getElementById('wqTimerFill');
  const label=document.getElementById('wqTimeLeft');
  const cfg=WQ_LANG[wqLang];
  fill.style.width='0%';
  label.textContent='0с';
  wqWordTimer=setInterval(()=>{
    elapsed++;
    const pct=Math.min(100,(elapsed/s.time)*100);
    fill.style.width=pct+'%';
    fill.style.background=pct<50?'linear-gradient(90deg,'+cfg.color+','+cfg.color+'88)':pct<75?'linear-gradient(90deg,#ffd700,#ff9500)':'linear-gradient(90deg,#ff4444,#ff0000)';
    label.textContent=elapsed+'с';
    if(elapsed>=s.time){
      clearInterval(wqWordTimer);
      wqWrong++;
      wqShowFeedback(cfg.timeout+' ✗ '+wqCurrentWord.word.toUpperCase(),'#ff4444');
      setTimeout(()=>wqNextWord(),1500);
    }
  },1000);
}

function wqCheckInput(val){
  const answer=val.trim().toUpperCase();
  const correct=wqCurrentWord.word.toUpperCase();
  const inp=document.getElementById('wqInput');
  const cfg=WQ_LANG[wqLang];
  if(answer===correct){
    clearInterval(wqWordTimer);
    wqCorrect++;
    inp.className='wq-inp correct';
    inp.style.borderColor='#39ff14';
    wqShowFeedback(cfg.ok+' ✓ '+wqCurrentWord.word.toUpperCase(),'#39ff14');
    setTimeout(()=>wqNextWord(),900);
  }
}

function wqSubmit(){
  const val=document.getElementById('wqInput').value.trim().toUpperCase();
  if(val===wqCurrentWord.word.toUpperCase())return;
  wqShowFeedback(WQ_LANG[wqLang].bad,'#ff4444');
  document.getElementById('wqInput').className='wq-inp wrong';
  setTimeout(()=>{document.getElementById('wqInput').className='wq-inp';document.getElementById('wqFeedback').textContent='';},600);
}

function wqSkip(){
  clearInterval(wqWordTimer);
  wqSkipped++;
  wqShowFeedback('⏭ '+wqCurrentWord.word.toUpperCase(),'#ff9500');
  setTimeout(()=>wqNextWord(),900);
}

function wqShowFeedback(txt,color){
  const el=document.getElementById('wqFeedback');
  el.textContent=txt;el.style.color=color;
}

async function wqFinish(){
  clearInterval(wqWordTimer);
  const totalSec=Math.round((Date.now()-wqStartTs)/1000);
  const total=wqCorrect+wqWrong+wqSkipped;
  const cfg=WQ_LANG[wqLang];
  try{
    const id=Date.now()+'_'+Math.random().toString(36).slice(2,5);
    const newScore={name:wqPlayerName,correct:wqCorrect,wrong:wqWrong,skipped:wqSkipped,
      total,totalSec,diff:wqSettings[wqLang].diff,lang:wqLang,mode:'count',createdAt:Date.now(),_id:id};
    await setDoc(doc(fsdb,'word_scores',id),newScore);
    // Шууд wqScores-д нэмэх — дахин татахгүйгээр
    if(!wqScores) wqScores={mn:[],ru:[],en:[]};
    if(wqScores[wqLang]) wqScores[wqLang].push(newScore);
  }catch(e){console.error(e);}
  setAllInactive();
  document.getElementById('wqResultScreen').classList.add('active');
  document.getElementById('wqResultTitle').style.background='linear-gradient(135deg,'+cfg.color+',#fff)';
  document.getElementById('wqResultTitle').style.webkitBackgroundClip='text';
  document.getElementById('wqResultTitle').style.webkitTextFillColor='transparent';
  document.getElementById('wqResultTitle').textContent=wqCorrect+'/'+total+' ЗӨВ '+cfg.flag;
  document.getElementById('wqResultStats').innerHTML=
    '⭐ Зөв: '+wqCorrect+' &nbsp;|&nbsp; ❌ Буруу: '+wqWrong+' &nbsp;|&nbsp; ⏭ Алгасав: '+wqSkipped+'<br>'+
    '⏱ Нийт хугацаа: '+Math.floor(totalSec/60)+':'+String(totalSec%60).padStart(2,'0')+'<br>'+
    cfg.flag+' '+cfg.label+' · '+wqSettings[wqLang].diff.toUpperCase();
}

function wqPlayAgain(){
  setAllInactive();
  document.getElementById('wqHomeScreen').classList.add('active');
  document.getElementById('navWQ').classList.add('active');
  wqLoadAllScores();
}

async function wqLoadAllScores(){
  try{
    // Хэл тус бүрт дээд 100 оноог татах — бүгдийг татахгүй
    wqScores={mn:[],ru:[],en:[]};
    const langs=['mn','ru','en'];
    await Promise.all(langs.map(async lang=>{
      const q=query(collection(fsdb,'word_scores'),orderBy('correct','desc'),limit(100));
      const snap=await getDocs(q);
      snap.forEach(d=>{
        const s={...d.data(),_id:d.id};
        if((s.lang||'mn')===lang) wqScores[lang].push(s);
      });
    }));
  }catch(e){
    // Fallback: index байхгүй бол бүгдийг татах
    try{
      const snap=await getDocs(collection(fsdb,'word_scores'));
      wqScores={mn:[],ru:[],en:[]};
      snap.forEach(d=>{const s={...d.data(),_id:d.id};const lang=s.lang||'mn';if(wqScores[lang])wqScores[lang].push({...s,lang});});
    }catch(e2){console.error(e2);}
  }
  ['mn','ru','en'].forEach(lang=>wqRenderLb(lang));
  const total=Object.values(wqScores).reduce((a,b)=>a+b.length,0);
  const statEl=document.getElementById('wqStatLine');
  if(statEl&&total>0) statEl.textContent='Нийт '+total+' тоглолт явагдсан';
}

function wqRenderLb(lang){
  const cfg=WQ_LANG[lang];
  const list=[...(wqScores[lang]||[])].sort((a,b)=>b.correct-a.correct||a.totalSec-b.totalSec).slice(0,100);
  const elId='wqLb'+lang.charAt(0).toUpperCase()+lang.slice(1);
  const el=document.getElementById(elId);
  if(!el){return;}
  if(isAdmin) el.classList.add('admin-mode'); else el.classList.remove('admin-mode');
  if(!list.length){el.innerHTML='<div class="mc-lb-empty">Бичлэг алга</div>';return;}
  const delHead=isAdmin?'<div></div>':'';
  let html=`<div class="mc-lb-row mc-lb-header"><div>#</div><div>Нэр</div><div>Зөв</div><div>Хугацаа</div>${delHead}</div>`;
  list.forEach((s,i)=>{
    const delBtn=isAdmin?`<button class="mc-lb-del" onclick="delWqScore('${s._id}')">✕</button>`:'';
    html+=`<div class="mc-lb-row"><div class="mc-lb-rank" style="color:${cfg.color}">${i+1}</div><div class="mc-lb-name">${escH(s.name)}</div><div>${s.correct}/${s.total||s.correct+s.wrong}</div><div>${Math.floor(s.totalSec/60)}:${String(s.totalSec%60).padStart(2,'0')}</div>${delBtn}</div>`;
  });
  el.innerHTML=html;
}

function wqSwitchLbMode(mode){}
async function delAllWqScores(lang){
  if(!isAdmin) return;
  const names={mn:'Монгол',ru:'Орос',en:'Англи'};
  if(!confirm('⚠️ '+names[lang]+' хэлний бүх оноог устгах уу?')) return;
  try{
    const snap=await getDocs(collection(fsdb,'word_scores'));
    const batch=[];
    snap.forEach(d=>{if((d.data().lang||'mn')===lang) batch.push(deleteDoc(doc(fsdb,'word_scores',d.id)));});
    await Promise.all(batch);
    if(!wqScores) wqScores={mn:[],ru:[],en:[]};
    wqScores[lang]=[];
    wqRenderLb(lang);
    notify('✅ '+names[lang]+' оноо устгагдлаа');
  }catch(e){notify('Алдаа: '+e.message);}
}

async function delWqScore(id){
  if(!isAdmin)return;
  await deleteDoc(doc(fsdb,'word_scores',id));
  wqLoadAllScores();
}

// ── WORD ADMIN ──
let waSelectedDiff='easy', waSelectedLang='mn', waWords=[];
const WA_LANG_COLL={mn:'word_items',ru:'word_items_ru',en:'word_items_en'};
const WA_LANG_COLOR={mn:'#39ff14',ru:'#4fc3f7',en:'#ff6b6b'};
const WA_LANG_FLAG={mn:'🇲🇳',ru:'🇷🇺',en:'🇬🇧'};

function showWordAdmin(){
  if(!isAdmin){notify('Зөвхөн admin');return;}
  setAllInactive();
  document.getElementById('wordAdminScreen').classList.add('active');
  document.getElementById('navAdminWords').classList.add('active');
  waSetLang('mn');
}

function waSetLang(lang){
  waSelectedLang=lang;
  ['mn','ru','en'].forEach(l=>{
    const btn=document.getElementById('waLang'+l.charAt(0).toUpperCase()+l.slice(1));
    if(btn) btn.classList.toggle('active',l===lang);
  });
  const color=WA_LANG_COLOR[lang];
  const label=document.getElementById('waWordLabel');
  if(label) label.textContent=WA_LANG_FLAG[lang]+' '+{mn:'Монгол үг',ru:'Орос үг',en:'Англи үг'}[lang];
  document.getElementById('waWord').placeholder={mn:'Жишээ: ХАДГАЛАХ',ru:'Например: ПРИВЕТ',en:'Example: HELLO'}[lang];
  waLoadWords();
}

function waSetDiff(d){
  waSelectedDiff=d;
  document.querySelectorAll('#waDiffGrid .mc-reveal-btn').forEach(b=>b.classList.toggle('active',b.dataset.diff===d));
}

async function waAddWord(){
  const word=document.getElementById('waWord').value.trim().toUpperCase();
  const cat=document.getElementById('waCategory').value.trim();
  const hint=document.getElementById('waHint').value.trim();
  if(!word){waShowMsg('Үг оруулна уу!','#ff4444');return;}
  if(word.length<2){waShowMsg('2-с дээш үсэгтэй үг оруулна уу!','#ff4444');return;}
  const btn=document.getElementById('waAddText');
  btn.textContent='⏳ Хадгалж байна...';
  try{
    const coll=WA_LANG_COLL[waSelectedLang];
    const id=Date.now()+'_'+Math.random().toString(36).slice(2,5);
    await setDoc(doc(fsdb,coll,id),{word,diff:waSelectedDiff,cat:cat||'general',hint:hint||'',lang:waSelectedLang,createdAt:Date.now()});
    waShowMsg(WA_LANG_FLAG[waSelectedLang]+' "'+word+'" нэмэгдлээ!','#39ff14');
    document.getElementById('waWord').value='';
    document.getElementById('waCategory').value='';
    document.getElementById('waHint').value='';
    waLoadWords();
  }catch(e){waShowMsg('❌ Алдаа: '+e.message,'#ff4444');}
  btn.textContent='➕ ҮГ НЭМЭХ';
}

function waShowMsg(txt,color){
  const el=document.getElementById('waMsg');
  el.textContent=txt;el.style.color=color;
  setTimeout(()=>el.textContent='',3000);
}

async function waLoadWords(){
  try{
    const coll=WA_LANG_COLL[waSelectedLang];
    const snap=await getDocs(collection(fsdb,coll));
    waWords=[];
    snap.forEach(d=>waWords.push({...d.data(),_id:d.id}));
    waWords.sort((a,b)=>a.word.localeCompare(b.word));
  }catch(e){console.error(e);}
  waRenderList();
}

function waRenderList(){
  const q=(document.getElementById('waSearch')?.value||'').toLowerCase();
  const diff=(document.getElementById('waDiffFilter')?.value||'all');
  let filtered=waWords.filter(w=>w.word.toLowerCase().includes(q));
  if(diff!=='all') filtered=filtered.filter(w=>w.diff===diff);
  const color=WA_LANG_COLOR[waSelectedLang];
  document.getElementById('waWordCount').textContent=WA_LANG_FLAG[waSelectedLang]+' Нийт: '+filtered.length+' үг';
  const el=document.getElementById('waWordList');
  if(!filtered.length){el.innerHTML='<div style="color:rgba(255,255,255,.4);font-family:Share Tech Mono,monospace;font-size:13px;padding:20px;">Үг байхгүй</div>';return;}
  el.innerHTML=filtered.map(w=>`
    <div style="background:rgba(0,0,0,.3);border:1px solid ${color}33;border-radius:10px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-family:Orbitron,monospace;font-size:14px;color:${color};font-weight:700;">${w.word}</div>
        <div style="font-family:Share Tech Mono,monospace;font-size:10px;color:${color}88;margin-top:3px;">${w.diff} · ${w.cat||'general'}${w.hint?' · 💡'+w.hint:''}</div>
      </div>
      <button onclick="waDelete('${w._id}','${w.word}')" style="font-family:Orbitron,monospace;font-size:9px;padding:5px 10px;border-radius:6px;border:1px solid rgba(255,68,68,.4);background:rgba(255,68,68,.08);color:#ff4444;cursor:pointer;">✕</button>
    </div>
  `).join('');
}

async function waDelete(id,word){
  if(!confirm('"'+word+'" устгах уу?')) return;
  try{
    const coll=WA_LANG_COLL[waSelectedLang];
    await deleteDoc(doc(fsdb,coll,id));
    waWords=waWords.filter(w=>w._id!==id);
    waRenderList();
  }catch(e){notify('Алдаа: '+e.message);}
}


function faqToggle(el){
  const isOpen=el.classList.contains('open');
  // Close all
  document.querySelectorAll('.faq-item.open').forEach(i=>i.classList.remove('open'));
  if(!isOpen) el.classList.add('open');
}




// ══ SHARE ══
let _shareText='', _shareUrl='https://bolorgames.com';

function showShare(text){
  _shareText=text;
  document.getElementById('shareScoreText').innerHTML=text.replace(/\n/g,'<br>');
  document.getElementById('shareOverlay').classList.add('show');
  const copyBtn=document.getElementById('shareCopyBtn');
  if(copyBtn){copyBtn.textContent='📋 Хуулбарлах';copyBtn.classList.remove('copied');}
}
function hideShare(){
  document.getElementById('shareOverlay').classList.remove('show');
}
function _shareMsg(){
  return _shareText+'\n🔗 '+_shareUrl;
}
function shareToFB(e){
  e.preventDefault();
  const url='https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(_shareUrl)+'&quote='+encodeURIComponent(_shareText);
  window.open(url,'_blank','width=600,height=400');
}
function shareToIG(e){
  e.preventDefault();
  // Instagram web share API байхгүй — clipboard-д хуулна
  navigator.clipboard.writeText(_shareMsg()).then(()=>{
    notify('📋 Хуулбарлагдлаа!\nInstagram-д paste хийнэ үү.');
  }).catch(()=>{
    notify('Текстийг гараар хуулна уу:\n\n'+_shareMsg());
  });
}
function shareToMessenger(e){
  e.preventDefault();
  const isMob=/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  if(isMob){
    window.location.href='fb-messenger://share?link='+encodeURIComponent(_shareUrl)+'&app_id=966242223397117';
  } else {
    window.open('https://www.facebook.com/dialog/send?link='+encodeURIComponent(_shareUrl)+'&app_id=966242223397117&redirect_uri='+encodeURIComponent(_shareUrl),'_blank','width=600,height=400');
  }
}
function shareCopy(){
  const msg=_shareMsg();
  const btn=document.getElementById('shareCopyBtn');
  if(navigator.share && /Mobi/i.test(navigator.userAgent)){
    navigator.share({title:'Bolor Games',text:_shareText,url:_shareUrl}).catch(()=>{});
  } else {
    navigator.clipboard.writeText(msg).then(()=>{
      if(btn){btn.textContent='✅ Хуулбарлагдлаа!';btn.classList.add('copied');}
      setTimeout(()=>{if(btn){btn.textContent='📋 Хуулбарлах';btn.classList.remove('copied');}},2500);
    }).catch(()=>{
      if(btn) btn.textContent='❌ Алдаа гарлаа';
    });
  }
}


// ── Тоглоом бүрийн share функц ──
function wqShareResult(){
  const lang={mn:'🇲🇳 Монгол',ru:'🇷🇺 Орос',en:'🇬🇧 Англи'}[wqLang]||'';
  const total=wqCorrect+wqWrong+wqSkipped;
  const secs=Math.round((Date.now()-wqStartTs)/1000);
  const min=Math.floor(secs/60), sec=secs%60;
  const text=`🎮 Bolor Games — Word Quiz\n${lang} · ${wqSettings[wqLang].diff.toUpperCase()}\n⭐ ${wqCorrect}/${total} зөв\n⏱ ${min}:${String(sec).padStart(2,'0')}`;
  showShare(text);
}
function lqShareResult(){
  const text=`🎮 Bolor Games — Logo Quiz\n🏷️ ${lqSelectedDiff.toUpperCase()} · ${lqSelectedCat==='all'?'Бүгд':lqSelectedCat}\n⭐ Зөв: ${lqCorrectCount} · Буруу: ${lqWrongCount}`;
  showShare(text);
}
function flShareResult(){
  const text=`🎮 Bolor Games — Flag Quiz\n🚩 Туг таах тоглоом\n⭐ ${document.getElementById('flResultStats')?.textContent||''}`;
  showShare(text);
}
function mcShareResult(){
  const text=`🎮 Bolor Games — Memory Cards\n🃏 Хөзрийн дараалал санах\n${document.getElementById('mcResultStats')?.textContent||''}`;
  showShare(text);
}

// ══ ERROR HANDLING ══
function showError(title, msg, retryFn){
  hideLoading();
  const el=document.getElementById('errorOverlay');
  const t=document.getElementById('errorTitle');
  const m=document.getElementById('errorMsg');
  const btn=document.getElementById('errorRetryBtn');
  if(t) t.textContent=title||'Алдаа гарлаа';
  if(m) m.textContent=msg||'Дахин оролдоно уу.';
  if(btn){
    if(retryFn){btn.style.display='block';btn.onclick=()=>{hideError();retryFn();};}
    else{btn.style.display='none';}
  }
  if(el) el.classList.add('show');
}
function hideError(){
  const el=document.getElementById('errorOverlay');
  if(el) el.classList.remove('show');
}
// Интернэт холболт шалгах
window.addEventListener('offline',()=>{
  showError('Интернэт тасарлаа','Интернэт холболт тасарсан байна. Холболтоо шалгаад дахин оролдоно уу.');
});
window.addEventListener('online',()=>{
  hideError();
});

// ══ LOADING OVERLAY ══
function showLoading(text, sub){
  const el=document.getElementById('loadingOverlay');
  const t=document.getElementById('loadingText');
  const s=document.getElementById('loadingSub');
  if(t) t.textContent=text||'Ачаалж байна...';
  if(s) s.textContent=sub||'';
  if(el) el.classList.add('show');
}
function hideLoading(){
  const el=document.getElementById('loadingOverlay');
  if(el) el.classList.remove('show');
}

window.showShare=showShare;window.hideShare=hideShare;window.shareToFB=shareToFB;window.shareToIG=shareToIG;window.shareToMessenger=shareToMessenger;window.shareCopy=shareCopy;window.wqShareResult=wqShareResult;window.lqShareResult=lqShareResult;window.flShareResult=flShareResult;window.mcShareResult=mcShareResult;window.hasActiveSubscription=hasActiveSubscription;window.showSubRequired=showSubRequired;window.hideSubReq=hideSubReq;window.subReqSelect=subReqSelect;window.subReqPay=subReqPay;window.showLoading=showLoading;window.hideLoading=hideLoading;window.showError=showError;window.hideError=hideError;window.showSubInfo=showSubInfo;window.closeSubInfo=closeSubInfo;window.showMyAccount=showMyAccount;window.accSaveName=accSaveName;window.accUploadAvatar=accUploadAvatar;window.faqToggle=faqToggle;window.subSelectPlan=subSelectPlan;window.qpayOpenApp=qpayOpenApp;window.subProceedPay=subProceedPay;window.showLogoAdmin=showLogoAdmin;window.laSetDiff=laSetDiff;window.laSetCat=laSetCat;window.laPreview=laPreview;window.laUpload=laUpload;window.laLoadLogos=laLoadLogos;window.laRenderList=laRenderList;window.laDelete=laDelete;window.showWQHome=showWQHome;window.wqSetDiff=wqSetDiff;window.wqSetCount=wqSetCount;window.wqSetTime=wqSetTime;window.wqStartGame=wqStartGame;window.wqCheckInput=wqCheckInput;window.wqSubmit=wqSubmit;window.wqSkip=wqSkip;window.wqPlayAgain=wqPlayAgain;window.wqSwitchLbMode=wqSwitchLbMode;window.delWqScore=delWqScore;window.delAllScores=delAllScores;window.delAllWqScores=delAllWqScores;window.wqRenderLb=wqRenderLb;window.showWordAdmin=showWordAdmin;window.waSetLang=waSetLang;window.wqSeedRussianWords=wqSeedRussianWords;window.wqSeedEnglishWords=wqSeedEnglishWords;window.wqClickLetter=wqClickLetter;window.waSetDiff=waSetDiff;window.waAddWord=waAddWord;window.waLoadWords=waLoadWords;window.waRenderList=waRenderList;window.waDelete=waDelete;window.showLQHome=showLQHome;window.lqSetCat=lqSetCat;window.lqSetDiff=lqSetDiff;window.lqSetMode=lqSetMode;window.lqSetCount=lqSetCount;window.lqSetCustomCount=lqSetCustomCount;window.lqSetTime=lqSetTime;window.lqSetCustomTime=lqSetCustomTime;window.lqStartGame=lqStartGame;window.lqGoHome=lqGoHome;window.lqCloseResult=lqCloseResult;window.lqPlayAgain=lqPlayAgain;window.lqSwitchLbMode=lqSwitchLbMode;window.delLqScore=delLqScore;window.lqFilterSuggestions=lqFilterSuggestions;window.lqPickSuggestion=lqPickSuggestion;window.lqSubmitAnswer=lqSubmitAnswer;
window.flRenderLeaderboard=flRenderLeaderboard;window.lqRenderLeaderboard=lqRenderLeaderboard;window.mcRenderLeaderboard=mcRenderLeaderboard;window.openQPay=openQPay;window.closeQPay=closeQPay;window.initQPay=initQPay;window.checkQPayStatus=checkQPayStatus;window.qpayBack=qpayBack;
window.mqGoHome=mqGoHome;window.qqGoHome=qqGoHome;
window.openNR=openNR;window.closeNR=closeNR;window.createRound=createRound;window.delRound=delRound;
window.openPlayerSetup=openPlayerSetup;window.setPC=setPC;window.startWithPlayers=startWithPlayers;
window.openModal=openModal;window.closeModal=closeModal;window.mOvClick=mOvClick;
window.revealAns=revealAns;window.doneQuestion=doneQuestion;window.adjustScore=adjustScore;
window.mqResetGame=mqResetGame;window.qqResetGame=qqResetGame;
window.mqOpenEditor=mqOpenEditor;window.mqCloseEditor=mqCloseEditor;window.mqSaveEd=mqSaveEd;
window.mqHIc=mqHIc;
window.qqOpenEditor=qqOpenEditor;window.qqCloseEditor=qqCloseEditor;window.qqSaveEd=qqSaveEd;
window.qqHImg=qqHImg;window.qqClrImg=qqClrImg;window.qqDOv=qqDOv;window.qqDLv=qqDLv;window.qqDDp=qqDDp;
window.qqHCatImg=qqHCatImg;window.qqClrCatImg=qqClrCatImg;
window.toggleMusic=toggleMusic;
window.ytToggle=ytToggle;
window.ytVolToggle=ytVolToggle;
window.ytSetVol=ytSetVol;
window.closePodium=closePodium;window.mqSharePodium=mqSharePodium;
window.mqOnSearch=mqOnSearch;window.mqSClick=mqSClick;window.mqImportJSON=mqImportJSON;
function mvPlayToggle(){
  const p=window._ytPlayer;
  if(!window._mvReady||!p||!p.playVideo){
    window._mvWantPlay=true;
    return;
  }
  try{
    if(p.getPlayerState&&p.getPlayerState()===YT.PlayerState.PLAYING){p.pauseVideo();}
    else{p.playVideo();}
  }catch(e){}
}
function mvVolToggle(){
  const p=window._ytPlayer; if(!p)return;
  try{
    window._mvMuted=!window._mvMuted;
    if(window._mvMuted){p.mute();}else{p.unMute();p.setVolume(100);}
    const b=document.getElementById('mvVolBtn'); if(b)b.textContent=window._mvMuted?'🔇':'🔊';
  }catch(e){}
}
function mvFsToggle(){
  const box=document.querySelector('#mediaArea .video-box'); if(!box)return;
  const btn=document.getElementById('mvFsBtn');
  // Гарах
  if(document.fullscreenElement){document.exitFullscreen().catch(()=>{});if(btn)btn.textContent='⛶';return;}
  if(box.classList.contains('mv-fs')){box.classList.remove('mv-fs');if(btn)btn.textContent='⛶';return;}
  // Орох: эхлээд жинхэнэ fullscreen, боломжгүй бол (iPhone) CSS-ээр бүтэн дэлгэц
  const pseudo=()=>{box.classList.add('mv-fs');if(btn)btn.textContent='✕';};
  if(box.requestFullscreen){box.requestFullscreen().then(()=>{if(btn)btn.textContent='✕';}).catch(pseudo);}
  else pseudo();
}
document.addEventListener('fullscreenchange',()=>{
  if(!document.fullscreenElement){const b=document.getElementById('mvFsBtn');if(b)b.textContent='⛶';}
});
window.mvFsToggle=mvFsToggle;
window.mvPlayToggle=mvPlayToggle;window.mvVolToggle=mvVolToggle;
window.showMVHome=showMVHome;window.mvRenderHome=mvRenderHome;window.mvOnSearch=mvOnSearch;window.mvSClick=mvSClick;window.mvImportJSON=mvImportJSON;
window.qqOnSearch=qqOnSearch;window.qqSClick=qqSClick;window.qqImportJSON=qqImportJSON;

// ══════════════════════════════════════════════════════════════
// QUIZRUSH — Ангийн шууд тэмцээн (Kahoot маягийн, бодит цагийн)
// Энэ блок нь одоогийн MQ/QQ/MV/MC/FL/LQ/WQ логикт огт хамаарахгүй,
// бүрэн тусдаа Firestore collection ('live_quizzes','live_sessions')
// ашигладаг тул одоо байгаа тоглоомуудад нөлөөлөхгүй.
// ══════════════════════════════════════════════════════════════

let qrQuizzes=[];
let qrCurQuizId=null, qrEditQIndex=-1, qrQuestionsBuf=[];
let qrSessionId=null, qrCurSession=null, qrIsHost=false;
let qrPlayerId=null, qrPlayerName='';
let qrCurQuizCache=null;
let qrUnsubSession=null, qrUnsubPlayers=null, qrUnsubAnswers=null;
let qrHostTimerInterval=null, qrPlayTimerInterval=null;
let qrPlayerHasAnswered=false;
let qrPlayWrongLog=[];
let qrLastRenderedPhaseKey=null;
let qrLastAnswerSnapCache=[];

function qrGenCode(){ return String(Math.floor(100000+Math.random()*900000)); }
// Идэвхтэй (lobby/question/reveal) тэмцээний код давхцахгүй байхыг баталгаажуулна
async function qrGenUniqueCode(collectionName){
  for(let attempt=0; attempt<6; attempt++){
    const code=qrGenCode();
    try{
      const snap=await getDocs(query(collection(fsdb,collectionName), where('code','==',code)));
      let clash=false;
      snap.forEach(d=>{ const ph=d.data().phase; if(ph!=='ended'&&ph!=='cancelled') clash=true; });
      if(!clash) return code;
    }catch(e){ return code; } // шалгаж чадахгүй бол л шууд ашиглана — блоклохгүй
  }
  return qrGenCode();
}
// Firestore-ийн дуудлага сүлжээ тогтворгүй үед МӨНХӨД хариу хүлээгээд
// "гацахаас" сэргийлэх ерөнхий timeout wrapper. Хугацаа хэтэрвэл алдаа шиднэ.
function withTimeout(promise, ms, label){
  return Promise.race([
    promise,
    new Promise((_,reject)=>setTimeout(()=>reject(new Error('TIMEOUT:'+(label||''))), ms))
  ]);
}
const QR_SHAPES=['▲','⬟','⬢','★','⬣']; // 5 дэх сонголт (A-E тестэд зориулав)
let qrAudioCtx=null;
function qrEnsureAudioCtx(){
  if(!qrAudioCtx){ try{ qrAudioCtx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} }
  if(qrAudioCtx && qrAudioCtx.state==='suspended'){ qrAudioCtx.resume().catch(()=>{}); }
  return qrAudioCtx;
}
function qrTone(freq,dur,vol,type){
  if(musicMuted) return;
  const ctx=qrEnsureAudioCtx(); if(!ctx) return;
  try{
    const osc=ctx.createOscillator(), gain=ctx.createGain();
    osc.type=type||'triangle'; osc.frequency.value=freq;
    gain.gain.setValueAtTime(vol||0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+dur);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime+dur);
  }catch(e){}
}
// Хурдтай, эрч хүчтэй "clock tick" — Kahoot маягийн буржгар авиа
function qrPlayTick(remainFrac){
  const freq=740+(1-remainFrac)*300;
  qrTone(freq,0.06,0.09,'triangle');
}
function qrPlaySelectBlip(){ qrTone(880,0.07,0.13,'triangle'); }
function qrPlayRevealFanfare(){
  qrTone(523,0.1,0.13,'triangle');
  setTimeout(()=>qrTone(659,0.1,0.13,'triangle'),90);
  setTimeout(()=>qrTone(784,0.1,0.13,'triangle'),180);
  setTimeout(()=>qrTone(1046,0.22,0.14,'triangle'),270);
}

// ── НҮҮР: асуултын сангийн жагсаалт ──
let qrFolders=[];
let qrQuizzesLoadedAt=0;
const QR_CACHE_TTL=3*60*1000; // 3 минут дотор дахин орвол дахин татахгүй, кэшээ ашиглана
function qrForceRefresh(){
  qrQuizzesLoadedAt=0;
  showQRHome();
}
async function showQRHome(){
  setAllInactive();
  document.getElementById('qrHomeScreen').classList.add('active');
  document.getElementById('navQR').classList.add('active');
  activeGame='qr';
  qrCurFolderId=null;
  buildQRFloatingBG();
  const needsReload = !qrQuizzes.length || !qrFolders.length || (Date.now()-qrQuizzesLoadedAt>QR_CACHE_TTL);
  if(needsReload){
    await Promise.all([qrLoadQuizzes(), qrLoadFolders()]);
    qrQuizzesLoadedAt=Date.now();
  }
  qrRenderHome();
  const badge=document.getElementById('qrStatsBadge');
  if(badge){
    const totalQ=qrQuizzes.filter(z=>!z.isRandomTest).reduce((s,z)=>s+((z.questions||[]).length),0);
    badge.textContent=`📚 ${qrQuizzes.filter(z=>!z.isRandomTest).length} сан · 📝 ${totalQ} асуулт`;
  }
}
function buildQRFloatingBG(){
  const wrap=document.getElementById('qrFloatBg'); if(!wrap||wrap.childElementCount)return;
  const n=14;
  for(let i=0;i<n;i++){
    const s=document.createElement('div'); s.className='qr-float-shape';
    s.textContent=QR_SHAPES[i%4];
    s.style.top=(4+((i*37)%90))+'%';
    s.style.left=(2+((i*53)%94))+'%';
    s.style.animationDelay=(i*0.7)+'s';
    s.style.animationDuration=(9+(i%5)*1.8)+'s';
    s.style.fontSize=(18+(i%4)*8)+'px';
    if(i%2===0) s.style.color='#f472b6';
    wrap.appendChild(s);
  }
}
async function qrLoadQuizzes(){
  try{
    const snap=await getDocs(collection(fsdb,'live_quizzes'));
    qrQuizzes=[]; snap.forEach(d=>qrQuizzes.push({id:d.id,...d.data()}));
  }catch(e){console.error('[QR] load quizzes err',e); qrQuizzes=[];}
  qrCleanupStaleRandomTests();
}
// RANDOM TEST-ийн 3 цагаас хуучин түр зуурын quiz-үүдийг дэвсгэрт (background) устгана —
// live_quizzes коллекц хэт хуримтлагдаж, QuizRush ачаалалт удаашрахаас сэргийлнэ.
// Дэвсгэрт fire-and-forget байдлаар ажилладаг тул одоогийн ачаалалтыг удаашруулахгүй.
function qrCleanupStaleRandomTests(){
  const staleCutoff=Date.now()-3*60*60*1000;
  const stale=qrQuizzes.filter(z=>z.isRandomTest && (z.createdAt||0)<staleCutoff);
  if(!stale.length) return;
  qrQuizzes=qrQuizzes.filter(z=>!(z.isRandomTest && (z.createdAt||0)<staleCutoff));
  Promise.all(stale.map(z=>deleteDoc(doc(fsdb,'live_quizzes',z.id)).catch(()=>{})))
    .then(()=>console.log('[QR] cleaned up',stale.length,'stale random-test docs'));
}
async function qrLoadFolders(){
  try{
    const snap=await getDocs(collection(fsdb,'live_folders'));
    qrFolders=[]; snap.forEach(d=>qrFolders.push({id:d.id,...d.data()}));
    qrFolders.sort((a,b)=>(a.name||'').localeCompare(b.name||''));
  }catch(e){console.error('[QR] load folders err',e); qrFolders=[];}
}
// folderId-аас эхлээд эцэг фолдерууд руугаа явж бүтэн замыг (breadcrumb) угсарна
function qrFolderPath(folderId){
  if(!folderId) return '';
  let p=qrFolders.find(x=>x.id===folderId);
  if(!p) return '';
  let path=p.name, guard=0;
  while(p.parentId && guard<12){
    const parent=qrFolders.find(x=>x.id===p.parentId);
    if(!parent) break;
    path=parent.name+' → '+path;
    p=parent; guard++;
  }
  return path;
}
async function qrCreateFolder(parentId){
  if(!isAdmin) return;
  const name=prompt(parentId?'Шинэ ДЭД фолдерийн нэр:':'Шинэ фолдерийн нэр:');
  if(!name||!name.trim()) return;
  try{
    const id='qrf'+Date.now();
    await setDoc(doc(fsdb,'live_folders',id),{id,name:name.trim(),parentId:parentId||null,createdAt:Date.now()});
    await qrLoadFolders();
    if(parentId) qrOpenFolder(parentId); else qrRenderHome();
    notify('Фолдер үүслээ! ✓');
  }catch(e){console.error(e);notify('Фолдер үүсгэхэд алдаа гарлаа');}
}
async function qrDeleteFolder(id){
  if(!isAdmin) return;
  const hasSubfolders=qrFolders.some(f=>f.parentId===id);
  const hasQuizzes=qrQuizzes.some(qz=>qz.folderId===id);
  if(hasSubfolders||hasQuizzes){
    notify('Энэ фолдер хоосон биш байна — эхлээд дотор нь байгаа дэд фолдер/тоглолтыг зайлуулна уу.',6000);
    return;
  }
  if(!confirm('Энэ хоосон фолдерийг устгах уу?'))return;
  try{
    const f=qrFolders.find(x=>x.id===id);
    await deleteDoc(doc(fsdb,'live_folders',id));
    await qrLoadFolders();
    if(f&&f.parentId) qrOpenFolder(f.parentId); else qrRenderHome();
  }catch(e){console.error(e);notify('Устгахад алдаа гарлаа');}
}
function qrBuildQuizCard(qz){
  const d=document.createElement('div'); d.className='qr-quiz-card';
  const qCount=(qz.questions||[]).length;
  const mine=canManageRound(qz);
  const delBtn=mine?`<button class="qr-quiz-card-del" onclick="qrDeleteQuiz(event,'${qz.id}')">✕</button>`:'';
  const editBtn=mine?`<button onclick="qrOpenEditor('${qz.id}')">✎ Засах</button>`:'';
  d.innerHTML=`
    ${delBtn}
    <div class="qr-quiz-card-name">${escH(qz.name)}</div>
    <div class="qr-quiz-card-meta">${qCount} асуулттай</div>
    <div class="qr-quiz-card-btns">
      <div class="qr-quiz-card-btns-row">
        ${editBtn}
        <button class="qr-solo-cta" onclick="qrShowTimeAdjust('${qz.id}','solo')">🎮 Ганцаараа</button>
      </div>
      <button class="qr-host-cta" onclick="qrShowTimeAdjust('${qz.id}','host')">▶ Хост эхлүүлэх</button>
    </div>`;
  return d;
}
const QR_FOLDER_ICONS=[
  // Ерөнхий
  '📁','📂','🗂️','📚','📖','📝','📔','📓','🎓','🏆','🎯','🧩','⭐','🔖','📌','🗃️',
  // Анагаах ухаан — ерөнхий
  '🏥','⚕️','🩺','🔬','💊','💉','🩹','🚑','🩼','🦽','👨‍⚕️','👩‍⚕️',
  // Эрхтэн тус бүрээр (мэдрэл, зүрх, уушиг, яс г.м.)
  '🧠','🫀','❤️','🫁','🦴','🦷','👁️','👂','👃','🦵','🦶','🖐️','🫄','🩸',
  // Лаборатори, оношилгоо, генетик
  '🧬','🧫','🩻','🌡️','🦠','🧪','⚗️',
  // Насны бүлэг / чиглэл (хүүхэд, эх барих, настан)
  '👶','🍼','🤰','🧓',
  // Шинжлэх ухаан
  '⚛️','🔭','🌌','🧲','💡','🔋','⚙️',
  // Тоо, санхүү
  '🔢','📐','📊','📈','💰','💹','🧮',
  // Хэл, урлаг, түүх
  '🗣️','🌐','✍️','🎭','🎨','🎵','🎬','🏛️','📜','🗺️','🌍',
  // Спорт, амьдрал
  '⚽','🏀','⚖️','✈️','🚗','🌱','🐾',
  // Компьютер
  '💻','🖥️','📱','🕹️'
];
function qrBuildFolderTile(f, list){
  const tile=document.createElement('div'); tile.className='qr-folder-tile';
  tile.onclick=()=>qrOpenFolder(f.id);
  const delBtn=isAdmin?`<button class="qr-folder-tile-del" onclick="event.stopPropagation();qrDeleteFolder('${f.id}')">✕</button>`:'';
  const editBtn=isAdmin?`<button class="qr-folder-tile-edit" onclick="event.stopPropagation();qrOpenFolderEdit('${f.id}')">✎</button>`:'';
  const icon=f.icon||'📁';
  tile.innerHTML=`${delBtn}${editBtn}<div class="qr-folder-tile-icon">${icon}</div><div class="qr-folder-tile-name">${escH(f.name)}</div><div class="qr-folder-tile-count">${list}</div>`;
  return tile;
}
// ── Фолдер нэр/дүрс засах ──
let qrEditingFolderId=null, qrEditingFolderIcon='📁';
function qrGetDescendantFolderIds(folderId){
  const result=[];
  qrFolders.filter(f=>f.parentId===folderId).forEach(c=>{ result.push(c.id); result.push(...qrGetDescendantFolderIds(c.id)); });
  return result;
}
function qrOpenFolderEdit(id){
  if(!isAdmin) return;
  const f=qrFolders.find(x=>x.id===id); if(!f)return;
  qrEditingFolderId=id; qrEditingFolderIcon=f.icon||'📁';
  document.getElementById('qrFolderEditNameInp').value=f.name||'';
  qrRenderFolderIconPicker();
  // Эцэг фолдерийн сонголт: өөрийгөө болон бүх дэд/дэд-дэд фолдерээ хасна (эргэлт үүсэхээс сэргийлнэ)
  const excludeIds=new Set([id, ...qrGetDescendantFolderIds(id)]);
  const parentSel=document.getElementById('qrFolderEditParentSelect');
  if(parentSel){
    const opts=qrFolders.filter(x=>!excludeIds.has(x.id));
    parentSel.innerHTML='<option value="">— Топ түвшин (эцэггүй) —</option>'+opts.map(x=>`<option value="${x.id}" ${x.id===f.parentId?'selected':''}>${escH(x.name)}</option>`).join('');
  }
  document.getElementById('qrFolderEditOv').classList.add('open');
}
function qrRenderFolderIconPicker(){
  const wrap=document.getElementById('qrFolderIconPicker'); if(!wrap)return;
  wrap.innerHTML=QR_FOLDER_ICONS.map(ic=>`<div class="qr-folder-icon-opt ${ic===qrEditingFolderIcon?'selected':''}" onclick="qrPickFolderIcon('${ic}')">${ic}</div>`).join('');
}
function qrPickFolderIcon(ic){
  qrEditingFolderIcon=ic;
  qrRenderFolderIconPicker();
}
function qrCloseFolderEdit(){ document.getElementById('qrFolderEditOv').classList.remove('open'); }
async function qrSaveFolderEdit(){
  if(!qrEditingFolderId) return;
  const name=document.getElementById('qrFolderEditNameInp').value.trim();
  const parentSel=document.getElementById('qrFolderEditParentSelect');
  const parentId=(parentSel&&parentSel.value)?parentSel.value:null;
  if(!name){notify('Фолдерийн нэрээ бичнэ үү');return;}
  try{
    await setDoc(doc(fsdb,'live_folders',qrEditingFolderId),{name,icon:qrEditingFolderIcon,parentId},{merge:true});
    await qrLoadFolders();
    qrCloseFolderEdit();
    // Одоо аль дэлгэц дээр байгаагаас хамааруулж дахин зурна
    if(document.getElementById('qrFolderScreen').classList.contains('active')) qrOpenFolder(qrCurFolderId);
    else qrRenderHome();
    notify('Фолдер шинэчлэгдлээ! ✓');
  }catch(e){console.error(e);notify('Хадгалахад алдаа гарлаа');}
}
function qrRenderHome(){
  const container=document.getElementById('qrQuizFolderedContainer'); if(!container)return; container.innerHTML='';
  if(!currentUser){
    container.innerHTML='<div class="rounds-title">Асуултын сан үүсгэхийн тулд эхлээд нэвтэрнэ үү.</div>';
    const iw2=document.getElementById('qrImportWrap'); if(iw2)iw2.style.display='none';
    const afb=document.getElementById('qrAddFolderBtn'); if(afb)afb.style.display='none';
    return;
  }
  const validFolderIds=new Set(qrFolders.map(f=>f.id));
  const unfoldered=qrQuizzes.filter(qz=>!qz.isRandomTest&&(!qz.folderId||!validFolderIds.has(qz.folderId)));
  const topFolders=qrFolders.filter(f=>!f.parentId);

  // "+ Шинэ асуултын сан" товч — үргэлж дээд талд
  const nb=document.createElement('button'); nb.className='btn-new-round qr'; nb.textContent='+ Шинэ асуултын сан';
  nb.onclick=()=>qrOpenEditor(null);
  container.appendChild(nb);

  // ТОП ТҮВШНИЙ фолдерууд л энд дүрс болгож харагдана — дэд фолдер зөвхөн дотор нь орсны дараа
  const grid=document.createElement('div'); grid.className='rounds-grid';
  topFolders.forEach(f=>{
    const directQuizCount=qrQuizzes.filter(qz=>qz.folderId===f.id).length;
    const subCount=qrFolders.filter(sf=>sf.parentId===f.id).length;
    if(directQuizCount===0 && subCount===0 && !isAdmin) return;
    const parts=[]; if(subCount>0)parts.push(subCount+' дэд фолдер'); parts.push(directQuizCount+' тоглолт');
    grid.appendChild(qrBuildFolderTile(f, parts.join(' · ')));
  });
  if(unfoldered.length>0){
    const tile=document.createElement('div'); tile.className='qr-folder-tile';
    tile.onclick=()=>qrOpenFolder('__none__');
    tile.innerHTML=`<div class="qr-folder-tile-icon">📄</div><div class="qr-folder-tile-name">Бусад / ангилалгүй</div><div class="qr-folder-tile-count">${unfoldered.length} тоглолт</div>`;
    grid.appendChild(tile);
  }
  container.appendChild(grid);
  if(topFolders.length===0 && unfoldered.length===0){
    const empty=document.createElement('div'); empty.className='rounds-title'; empty.textContent='Одоохондоо тоглолт алга. Дээрх товчоор эхлээрэй.'; container.appendChild(empty);
  }

  const iw=document.getElementById('qrImportWrap'); if(iw)iw.style.display=isAdmin?'block':'none';
  const afb=document.getElementById('qrAddFolderBtn'); if(afb)afb.style.display=isAdmin?'inline-block':'none';
}
// ── Фолдер дотор орох/гарах (дэд фолдер дэмждэг, рекурсив) ──
let qrCurFolderId=null;
// ── RANDOM TEST: тухайн фолдер (бүх дэд фолдерийн хамт) доtorх бүх сангаас 100 асуулт санамсаргүйгээр сонгож тоглодог ──
function qrCollectQuizzesForFolder(folderId){
  const ids=new Set([folderId, ...qrGetDescendantFolderIds(folderId)]);
  return qrQuizzes.filter(qz=>!qz.isRandomTest && qz.folderId && ids.has(qz.folderId));
}
function qrCollectQuestionsForFolder(folderId){
  const pool=[];
  qrCollectQuizzesForFolder(folderId).forEach(qz=>{
    (qz.questions||[]).forEach((q,idx)=>{
      pool.push({...q, _origQuizId:qz.id, _origQIndex:idx, _origQuizName:qz.name, _origFolderId:qz.folderId});
    });
  });
  return pool;
}
function qrShuffleSample(arr, n){
  const a=arr.slice();
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a.slice(0, Math.min(n, a.length));
}
const QR_RANDOM_TEST_SIZE=100;
function qrBuildRandomTestObject(folderId){
  const pool=qrCollectQuestionsForFolder(folderId);
  const sampled=qrShuffleSample(pool, QR_RANDOM_TEST_SIZE);
  const f=qrFolders.find(x=>x.id===folderId);
  const id='randtest_'+folderId+'_'+Date.now();
  return {id, name:'RANDOM TEST — '+(f?f.name:'Фолдер'), questions:sampled, folderId:null, isRandomTest:true, sourceFolderId:folderId, ownerId:(currentUser?currentUser.uid:null), createdAt:Date.now()};
}
function qrRegisterLocalQuiz(obj, folderId){
  // Хуучин (энэ фолдерийн) random-test объектуудыг санах ойгоос цэвэрлээд шинийг нэмнэ — санах ой хэт хуримтлагдахаас сэргийлнэ
  const prefix='randtest_'+folderId+'_';
  qrQuizzes=qrQuizzes.filter(z=>!(z.isRandomTest && z.id.startsWith(prefix)));
  qrQuizzes.push(obj);
}
async function qrRandomTestSoloStart(folderId){
  if(!currentUser){openLogin();return;}
  if(!await hasActiveSubscription()){showSubRequired();return;}
  const pool=qrCollectQuestionsForFolder(folderId);
  if(!pool.length){ notify('Энэ фолдерт одоогоор асуулт алга байна.'); return; }
  const obj=qrBuildRandomTestObject(folderId);
  qrRegisterLocalQuiz(obj, folderId);
  qrExamStart(obj);
}
async function qrRandomTestHostStart(folderId){
  if(!currentUser){openLogin();return;}
  if(!await hasActiveSubscription()){showSubRequired();return;}
  const pool=qrCollectQuestionsForFolder(folderId);
  if(!pool.length){ notify('Энэ фолдерт одоогоор асуулт алга байна.'); return; }
  const obj=qrBuildRandomTestObject(folderId);
  try{ await setDoc(doc(fsdb,'live_quizzes',obj.id), obj); }
  catch(e){ console.error('[QR] random test create err',e); notify('Санамсаргүй тест үүсгэхэд алдаа гарлаа'); return; }
  qrRegisterLocalQuiz(obj, folderId);
  await qrHostStart(obj.id);
}
// ── QR EXAM MODE: RANDOM TEST-ийг "шалгалтын хуудас" маягаар — бүх 100 асуулт зэрэг, чөлөөтэй дараалалтай ──
let qrExamQuiz=null, qrExamAnswers={}, qrExamTimerInt=null, qrExamStartTime=0, qrExamWrongLog=[], qrExamFinished=false;
const QR_EXAM_MINUTES=100;
function qrExamFmtTime(totalSec){
  totalSec=Math.max(0,totalSec);
  const h=Math.floor(totalSec/3600), m=Math.floor((totalSec%3600)/60), s=totalSec%60;
  return (h>0?String(h).padStart(2,'0')+':':'')+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
}
function qrExamStart(quiz){
  qrExamQuiz=quiz; qrExamAnswers={}; qrExamWrongLog=[]; qrExamFinished=false;
  setAllInactive();
  document.getElementById('qrExamScreen').classList.add('active');
  document.getElementById('qrExamTitle').textContent=quiz.name.replace('🎲 ','');
  document.getElementById('qrExamSummary').style.display='none';
  document.getElementById('qrExamFinishBtn').style.display='block';
  document.getElementById('qrExamFinishBtnTop').style.display='inline-block';
  qrExamRenderQuestions();
  qrExamRenderNav();
  qrExamUpdateNavPos();
  qrExamStartTime=Date.now();
  if(qrExamTimerInt) clearInterval(qrExamTimerInt);
  // Хугацааг тухайн тестийн асуулт бүрийн бодит цагийн нийлбэрээр тооцно (жишээ нь 100 асуулттай бол 100 минут орчим,
  // 10 асуулттай бол харгалзан бага байх зэргээр зохимжтой тохируулна), доод тал нь 3 минут
  const sumSec=(quiz.questions||[]).reduce((s,q)=>s+(q.time||60),0);
  const totalSec=Math.max(180, sumSec);
  const tick=()=>{
    const left=totalSec-Math.floor((Date.now()-qrExamStartTime)/1000);
    const txt=document.getElementById('qrExamTimerTxt');
    if(txt) txt.textContent=qrExamFmtTime(left);
    if(left<=0){ if(qrExamTimerInt){clearInterval(qrExamTimerInt);qrExamTimerInt=null;} qrExamFinish(true); }
  };
  tick();
  qrExamTimerInt=setInterval(tick,1000);
}
// position:sticky нь body{overflow-x:hidden}-ээс болж ажилладаггүй тул scroll дээр гар аргаар байрлалыг тооцоолно
function qrExamUpdateNavPos(){
  const screenEl=document.getElementById('qrExamScreen');
  if(!screenEl || !screenEl.classList.contains('active')) return;
  const bodyEl=screenEl.querySelector('.qr-exam-body');
  const nav=document.getElementById('qrExamNavPanel');
  if(!bodyEl || !nav) return;
  if(window.innerWidth<1050){ nav.style.top=''; return; }
  const bodyRect=bodyEl.getBoundingClientRect();
  const desiredViewportTop=150;
  let top=desiredViewportTop - bodyRect.top;
  top=Math.max(0, top);
  const maxTop=Math.max(0, bodyEl.offsetHeight - nav.offsetHeight);
  top=Math.min(top, maxTop);
  nav.style.top=top+'px';
}
window.addEventListener('scroll', qrExamUpdateNavPos, {passive:true});
window.addEventListener('resize', qrExamUpdateNavPos);
function qrExamRenderQuestions(){
  const wrap=document.getElementById('qrExamQList'); if(!wrap) return;
  wrap.innerHTML=qrExamQuiz.questions.map((q,i)=>{
    const labels=qrOptLabels(q);
    const multi=qrIsMulti(q);
    const imgHtml=q.img?`<img class="qr-exam-qimg" src="${q.img}" alt="">`:'';
    const optsHtml=(q.opts||[]).map((o,oi)=>
      `<button class="qr-exam-opt" data-qi="${i}" data-oi="${oi}" onclick="qrExamSelect(${i},${oi},${multi})"><span class="qr-shape">${labels[oi]}</span><span>${escH(o)}</span></button>`
    ).join('');
    return `<div class="qr-exam-qcard" id="qrExamQ${i}">
      <div class="qr-exam-qhead"><span class="qr-exam-qnum-badge">${i+1}</span><div class="qr-exam-qtext">${escH(q.q)}</div></div>
      ${imgHtml}
      <div class="qr-exam-opts">${optsHtml}</div>
    </div>`;
  }).join('');
}
function qrExamRenderNav(){
  const nav=document.getElementById('qrExamNavGrid'); if(!nav) return;
  nav.innerHTML=qrExamQuiz.questions.map((q,i)=>`<div class="qr-exam-navnum" id="qrExamNav${i}" onclick="qrExamScrollTo(${i})">${i+1}</div>`).join('');
}
function qrExamScrollTo(i){
  const el=document.getElementById('qrExamQ'+i);
  if(el) el.scrollIntoView({behavior:'smooth', block:'center'});
}
function qrExamSelect(qi, oi, multi){
  if(qrExamFinished) return;
  let cur=qrExamAnswers[qi]||[];
  if(multi){
    const idx=cur.indexOf(oi);
    cur = idx>=0 ? cur.filter(x=>x!==oi) : [...cur, oi];
  }else{
    cur=[oi];
  }
  qrExamAnswers[qi]=cur;
  qrPlaySelectBlip();
  document.querySelectorAll(`#qrExamQ${qi} .qr-exam-opt`).forEach(btn=>{
    btn.classList.toggle('selected', cur.includes(parseInt(btn.dataset.oi)));
  });
  const navEl=document.getElementById('qrExamNav'+qi);
  if(navEl) navEl.classList.toggle('answered', cur.length>0);
}
function qrExamFinishManual(){
  const totalQuestions=qrExamQuiz.questions.length;
  const answeredCount=Object.values(qrExamAnswers).filter(a=>a&&a.length>0).length;
  const skipped=totalQuestions-answeredCount;
  if(skipped>0){
    if(!confirm(`Та ${answeredCount}/${totalQuestions} асуулт бөглөсөн байна (${skipped} асуулт хариулаагүй үлдсэн).\n\nҮр дүнгээ зөвхөн бөглөсөн ${answeredCount} асуултаар тооцох болно. Одоо дуусгах уу?`)) return;
  }
  qrExamFinish(false);
}
function qrExamFinish(auto){
  if(qrExamFinished) return;
  qrExamFinished=true;
  if(qrExamTimerInt){clearInterval(qrExamTimerInt);qrExamTimerInt=null;}
  document.getElementById('qrExamFinishBtn').style.display='none';
  document.getElementById('qrExamFinishBtnTop').style.display='none';
  let correctCount=0, answeredCount=0; qrExamWrongLog=[];
  qrExamQuiz.questions.forEach((q,i)=>{
    const correctArr=Array.isArray(q.correct)?q.correct:[q.correct];
    const selected=qrExamAnswers[i]||[];
    const answered=selected.length>0;
    if(answered){
      answeredCount++;
      const correct=qrArraysEqual(selected, correctArr);
      if(correct) correctCount++; else qrExamWrongLog.push({q, selectedArr:selected, correctArr});
      const qid = q._origQuizId ? (q._origQuizId+'_'+q._origQIndex) : (qrExamQuiz.id+'_'+i);
      qrLogAnswer({qid, quizId:q._origQuizId||qrExamQuiz.id, quizName:q._origQuizName||qrExamQuiz.name, folderId:q._origFolderId||qrExamQuiz.folderId||null, qText:q.q, correct});
    }
    document.querySelectorAll(`#qrExamQ${i} .qr-exam-opt`).forEach(btn=>{
      const boi=parseInt(btn.dataset.oi);
      btn.classList.add('disabled');
      if(correctArr.includes(boi)) btn.classList.add('correctopt');
      else if(selected.includes(boi)) btn.classList.add('wrongopt');
    });
  });
  const totalQuestions=qrExamQuiz.questions.length;
  const skippedCount=totalQuestions-answeredCount;
  const pct = answeredCount>0 ? Math.round(correctCount/answeredCount*100) : 0;
  const el=document.getElementById('qrExamSummary');
  el.style.display='block';
  el.innerHTML = answeredCount===0 ? `
    <div style="font-size:56px;">🤷</div>
    <div class="qr-exam-summary-title">Ямар ч асуулт бөглөөгүй байна</div>
    <div class="qr-solo-final-btns">
      <button onclick="qrExamRetry()">↻ Дахин тоглох</button>
      <button class="secondary" onclick="qrExamExit()">Гарах</button>
    </div>` : `
    <div style="font-size:56px;">${pct>=80?'🏆':pct>=50?'🎉':'💪'}</div>
    <div class="qr-exam-summary-title">${auto?'⏱ Хугацаа дууслаа!':'✓ Тест дууслаа!'}</div>
    <div class="qr-exam-summary-score">${correctCount}/${answeredCount} зөв (${pct}%)</div>
    ${skippedCount>0?`<div class="qr-exam-summary-skipped">📝 Нийт ${totalQuestions}-аас ${answeredCount} асуулт бөглөсөн (${skippedCount} асуулт хариулаагүй, тооцоонд ороогүй)</div>`:''}
    <div class="qr-solo-final-btns">
      <button onclick="qrExamRetry()">↻ Дахин тоглох</button>
      <button class="secondary" onclick="qrExamExit()">Гарах</button>
    </div>
    ${qrBuildWrongReviewHTML(qrExamWrongLog)}`;
  el.scrollIntoView({behavior:'smooth', block:'start'});
}
function qrExamRetry(){ qrExamStart(qrExamQuiz); }
function qrExamExit(){
  if(qrExamTimerInt){clearInterval(qrExamTimerInt);qrExamTimerInt=null;}
  qrExamQuiz=null;
  showQRHome();
}

// ── QUIZRUSH ЛИДЕРБОРД: фолдер тус бүрээр (RANDOM TEST-тэй ижил хамрах хүрээ, рекурсив) эсвэл нийт (global) ──
async function showQRLeaderboard(folderId){
  setAllInactive();
  document.getElementById('qrLbScreen').classList.add('active');
  const titleEl=document.getElementById('qrLbTitle');
  const wrap=document.getElementById('qrLbList');
  wrap.innerHTML='<div class="qr-lb-loading">Ачааллаж байна…</div>';
  if(folderId){
    if(!qrFolders.length) await qrLoadFolders();
    const f=qrFolders.find(x=>x.id===folderId);
    titleEl.textContent='🏆 '+(f?f.name:'Фолдер')+' — ТОП 10';
  }else{
    titleEl.textContent='🏆 QuizRush — НИЙТ ТОП 10';
  }
  document.getElementById('qrLbBackBtn').setAttribute('onclick', folderId?`qrOpenFolder('${folderId}')`:'showQRHome()');
  try{
    let docs=[];
    if(folderId){
      const ids=[folderId, ...qrGetDescendantFolderIds(folderId)];
      // Firestore 'in' дээд тал нь 30 утга авдаг тул хэсэглэж (chunk) асуулга явуулна
      for(let i=0;i<ids.length;i+=30){
        const chunk=ids.slice(i,i+30);
        const snap=await getDocs(query(collection(fsdb,'qr_folder_stats'), where('folderId','in',chunk)));
        snap.forEach(d=>docs.push(d.data()));
      }
    }else{
      const snap=await getDocs(collection(fsdb,'qr_folder_stats'));
      snap.forEach(d=>docs.push(d.data()));
    }
    const byUid={};
    docs.forEach(d=>{
      if(!byUid[d.uid]) byUid[d.uid]={uid:d.uid, name:d.name, photoURL:d.photoURL, total:0, correct:0};
      byUid[d.uid].total+=(d.totalAttempts||0);
      byUid[d.uid].correct+=(d.correctCount||0);
      // хамгийн сүүлд шинэчлэгдсэн нэр/зургийг ашиглана
      if((d.updatedAt||0) >= (byUid[d.uid]._ts||0)){ byUid[d.uid].name=d.name; byUid[d.uid].photoURL=d.photoURL; byUid[d.uid]._ts=d.updatedAt; }
    });
    let ranked=Object.values(byUid).filter(u=>u.total>0).sort((a,b)=>b.total-a.total).slice(0,10);
    // Топ 10 хэрэглэгчийн нэр/зургийг users коллекцоос ШИНЭЭР татна (кэшилсэн хуучин утга ашиглахгүй,
    // ингэснээр хэрэглэгч дараа нь профайл зургаа солиход лидерборд дээр шууд шинэчлэгдэнэ)
    ranked=await Promise.all(ranked.map(async u=>{
      try{
        const uSnap=await getDoc(doc(fsdb,'user_public',u.uid));
        if(uSnap.exists()){
          const ud=uSnap.data();
          u.name=ud.name||u.name;
          u.photoURL=ud.photoURL||null;
        }
      }catch(e){ /* профайл татахад алдаа гарвал кэшилсэн утгаараа хэвээр үлдэнэ */ }
      return u;
    }));
    qrRenderLeaderboard(ranked);
  }catch(e){
    console.error('[QR] leaderboard load err',e);
    wrap.innerHTML='<div class="qr-lb-loading">Ачаалахад алдаа гарлаа</div>';
  }
}
function qrRenderLeaderboard(ranked){
  const wrap=document.getElementById('qrLbList');
  if(!ranked.length){ wrap.innerHTML='<div class="qr-lb-loading">Одоогоор бичлэг алга — эхлээд тест ажиллаж үзээрэй!</div>'; return; }
  const medals=['🥇','🥈','🥉'];
  wrap.innerHTML=ranked.map((u,i)=>{
    const acc=u.total>0?Math.round(u.correct/u.total*100):0;
    const rankHtml = i<3 ? `<span class="qr-lb-medal">${medals[i]}</span>` : `<span class="qr-lb-rank">#${i+1}</span>`;
    const avatarHtml = u.photoURL
      ? `<img class="qr-lb-avatar" src="${u.photoURL}" alt="" onerror="this.outerHTML='<div class=&quot;qr-lb-avatar qr-lb-avatar-ph&quot;>👤</div>'">`
      : `<div class="qr-lb-avatar qr-lb-avatar-ph">👤</div>`;
    return `<div class="qr-lb-row ${i<3?'qr-lb-row-top':''}">
      ${rankHtml}
      ${avatarHtml}
      <div class="qr-lb-name">${escH(u.name||'Тоглогч')}</div>
      <div class="qr-lb-count">${u.total} тест</div>
      <div class="qr-lb-acc">${acc}% зөв</div>
    </div>`;
  }).join('');
}

function qrBuildCareerQuizCard(){
  const d=document.createElement('div'); d.className='qr-quiz-card mm-career-card';
  d.innerHTML=`
    <div class="qr-quiz-card-name mm-career-card-title">🎯 ҮНДСЭН МЭРГЭШИЛ СОНГОЛТ</div>
    <div class="qr-quiz-card-meta" style="text-align:center;">119 асуулттай гүнзгий тест — 19 нарийн мэргэжлээс танд хамгийн тохирохыг олно</div>
    <div class="qr-quiz-card-btns">
      <button class="qr-solo-cta" style="width:100%;" onclick="mmStartQuiz()">🎯 Тест эхлүүлэх</button>
    </div>`;
  return d;
}
function qrBuildLeaderboardCard(folderId){
  const d=document.createElement('div'); d.className='qr-quiz-card qr-lb-card';
  d.innerHTML=`
    <div class="qr-quiz-card-name qr-lb-card-title">🏆 ТОП 10</div>
    <div class="qr-quiz-card-meta" style="text-align:center;">Энэ фолдерт хамгийн олон тест ажилласан тоглогчид</div>
    <div class="qr-quiz-card-btns">
      <button class="qr-solo-cta" style="width:100%;" onclick="showQRLeaderboard('${folderId}')">🏆 Лидерборд харах</button>
    </div>`;
  return d;
}
function qrBuildRandomTestCard(folderId, poolSize){
  const d=document.createElement('div'); d.className='qr-quiz-card qr-random-card';
  const n=Math.min(QR_RANDOM_TEST_SIZE, poolSize);
  d.innerHTML=`
    <div class="qr-quiz-card-name qr-random-title">RANDOM TEST</div>
    <div class="qr-quiz-card-meta" style="text-align:center;">${poolSize} асуултаас ${n} санамсаргүй асуулт</div>
    <div class="qr-quiz-card-btns">
      <div class="qr-quiz-card-btns-row">
        <button class="qr-solo-cta" onclick="qrRandomTestSoloStart('${folderId}')">🎮 Ганцаараа</button>
      </div>
      <button class="qr-host-cta" onclick="qrRandomTestHostStart('${folderId}')">▶ Хост эхлүүлэх</button>
    </div>`;
  return d;
}

function qrOpenFolder(folderId){
  qrCurFolderId=folderId;
  setAllInactive();
  document.getElementById('qrFolderScreen').classList.add('active');
  const titleEl=document.getElementById('qrFolderViewTitle');
  const grid=document.getElementById('qrFolderQuizGrid'); grid.innerHTML='';

  if(folderId==='__none__'){
    const validFolderIds=new Set(qrFolders.map(f=>f.id));
    const list=qrQuizzes.filter(qz=>!qz.isRandomTest&&(!qz.folderId||!validFolderIds.has(qz.folderId)));
    if(titleEl) titleEl.innerHTML='<button class="qr-back-btn" onclick="showQRHome()">← Буцах</button> 📄 Бусад / ангилалгүй';
    if(list.length===0){
      const empty=document.createElement('div'); empty.className='rounds-title'; empty.textContent='Энд одоохондоо тоглолт алга.'; grid.appendChild(empty);
    }else{
      const quizGrid=document.createElement('div'); quizGrid.className='rounds-grid';
      list.forEach(qz=>quizGrid.appendChild(qrBuildQuizCard(qz)));
      grid.appendChild(quizGrid);
    }
    return;
  }

  const f=qrFolders.find(x=>x.id===folderId);
  const backTarget=f&&f.parentId ? `qrOpenFolder('${f.parentId}')` : 'showQRHome()';
  if(titleEl) titleEl.innerHTML=`<button class="qr-back-btn" onclick="${backTarget}">← Буцах</button> ${f?(f.icon||'📁'):'📁'} ${f?escH(f.name):'Фолдер'}`;

  const subFolders=qrFolders.filter(sf=>sf.parentId===folderId);
  const list=qrQuizzes.filter(qz=>qz.folderId===folderId);

  if(isAdmin){
    const row=document.createElement('div'); row.className='qr-folder-view-actions';
    const nb1=document.createElement('button'); nb1.className='btn-new-round qr'; nb1.textContent='+ Дэд фолдер үүсгэх';
    nb1.onclick=()=>qrCreateFolder(folderId);
    const nb2=document.createElement('button'); nb2.className='btn-new-round qr'; nb2.textContent='+ Шинэ сан нэмэх';
    nb2.onclick=()=>qrOpenEditor(null, folderId);
    const nb3=document.createElement('button'); nb3.className='btn-new-round qr'; nb3.textContent='📥 JSON татах';
    nb3.onclick=()=>qrExportFolderJSON(folderId);
    row.appendChild(nb1); row.appendChild(nb2); row.appendChild(nb3);
    grid.appendChild(row);
    const importRow=document.createElement('div'); importRow.style.cssText='margin-top:12px;text-align:center;';
    importRow.innerHTML=`<label class="qr-import-lbl">📤 JSON import (энэ фолдер руу)<input type="file" accept=".json" style="display:none;" onchange="qrImportJSON(this)"></label>`;
    grid.appendChild(importRow);
  }
  const randomPoolSize=qrCollectQuestionsForFolder(folderId).length;
  const isMedicineFolder = f && (f.name||'').trim().toLowerCase()==='анагаах ухаан';
  if(randomPoolSize>0 || isMedicineFolder){
    const randGrid=document.createElement('div'); randGrid.className='rounds-grid';
    if(randomPoolSize>0) randGrid.appendChild(qrBuildRandomTestCard(folderId, randomPoolSize));
    if(randomPoolSize>0) randGrid.appendChild(qrBuildLeaderboardCard(folderId));
    if(isMedicineFolder) randGrid.appendChild(qrBuildCareerQuizCard());
    grid.appendChild(randGrid);
  }
  if(subFolders.length>0){
    const subGrid=document.createElement('div'); subGrid.className='rounds-grid';
    subFolders.forEach(sf=>{
      const directQuizCount=qrQuizzes.filter(qz=>qz.folderId===sf.id).length;
      const subCount=qrFolders.filter(x=>x.parentId===sf.id).length;
      const parts=[]; if(subCount>0)parts.push(subCount+' дэд фолдер'); parts.push(directQuizCount+' тоглолт');
      subGrid.appendChild(qrBuildFolderTile(sf, parts.join(' · ')));
    });
    grid.appendChild(subGrid);
  }
  if(list.length===0 && subFolders.length===0){
    const empty=document.createElement('div'); empty.className='rounds-title'; empty.textContent='Энэ фолдерт одоохондоо тоглолт алга.'; grid.appendChild(empty);
  }else if(list.length>0){
    const quizGrid=document.createElement('div'); quizGrid.className='rounds-grid';
    list.forEach(qz=>quizGrid.appendChild(qrBuildQuizCard(qz)));
    grid.appendChild(quizGrid);
  }
}
async function qrImportJSON(input){
  const file=input.files[0]; if(!file)return;
  if(!currentUser){notify('Import хийхийн тулд эхлээд нэвтэрнэ үү!');input.value='';return;}
  try{
    const text=await file.text(); const data=JSON.parse(text);
    if(!Array.isArray(data)){notify('Буруу формат');return;}
    const okCorrect=(c,n)=>{
      if(typeof c==='number') return c>=0&&c<n;
      if(Array.isArray(c)) return c.length>0&&c.every(i=>typeof i==='number'&&i>=0&&i<n);
      return false;
    };
    const okStruct=(z)=>z&&z.id&&z.name&&Array.isArray(z.questions)&&z.questions.every(q=>q&&q.q&&Array.isArray(q.opts)&&q.opts.length>=2&&q.opts.length<=5&&okCorrect(q.correct,q.opts.length));
    let added=0, updated=0, failed=0;
    for(const z of data){
      if(!okStruct(z)){failed++;continue;}
      // Файл дотор id байгаа тул тэрийг АШИГЛАНА (upsert) — ингэснээр дахин import хийхэд шинэ давхардал
      // үүсэхгүй, харин ХУУЧИН тестийг шинэчилж бичнэ. Хэрэв энэ ID урьд байгаагүй бол шинээр үүснэ.
      const existed=qrQuizzes.some(q=>q.id===z.id);
      const quizObj={
        id:z.id, name:z.name, ownerId:currentUser.uid,
        folderId: (z.folderId!==undefined ? z.folderId : (qrCurFolderId||null)),
        questions:z.questions.map(q=>({q:q.q,opts:q.opts,correct:q.correct,time:q.time||20,pts:q.pts||1000}))
      };
      try{ await setDoc(doc(fsdb,'live_quizzes',z.id), quizObj); if(existed) updated++; else added++; }
      catch(e){failed++;console.error('qr import save err:',e);}
    }
    await qrLoadQuizzes(); qrQuizzesLoadedAt=Date.now();
    if(qrCurFolderId!==undefined && document.getElementById('qrFolderScreen')&&document.getElementById('qrFolderScreen').classList.contains('active')) qrOpenFolder(qrCurFolderId);
    else qrRenderHome();
    if((added+updated)>0 && failed===0) notify(`✓ ${added} шинэ, ${updated} шинэчлэгдсэн сан import хийгдлээ!`,3000);
    else if((added+updated)>0) notify(`${added} шинэ, ${updated} шинэчлэгдсэн, ${failed} нь алдаатай.`,5000);
    else notify('Import хийх боломжтой зөв бүтэцтэй сан олдсонгүй.',5000);
  }catch(e){notify('Алдаа!');console.error(e);}
  input.value='';
}
// ── Фолдерын бүх тестийг JSON файлаар татаж авах (гадуур засаад, дахин import хийж болно) ──
function qrExportFolderJSON(folderId){
  const quizzes=qrCollectQuizzesForFolder(folderId);
  if(!quizzes.length){ notify('Энэ фолдерт тест алга байна.'); return; }
  const exportData=quizzes.map(qz=>({
    id:qz.id, name:qz.name, folderId:qz.folderId||null,
    questions:(qz.questions||[]).map(q=>({q:q.q, opts:q.opts, correct:q.correct, time:q.time||20, pts:q.pts||1000}))
  }));
  const blob=new Blob([JSON.stringify(exportData,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  const f=qrFolders.find(x=>x.id===folderId);
  const safeName=(f?f.name:'folder').replace(/[^a-zA-Zа-яА-ЯёЁ0-9_-]/g,'_');
  a.href=url; a.download=`quizrush_${safeName}_${Date.now()}.json`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  notify(`${quizzes.length} тест JSON файлаар татагдлаа ✓`,2500);
}

// ── EDITOR: асуулт сан засварлах ──
function qrOpenEditor(quizId, presetFolderId){
  setAllInactive();
  document.getElementById('qrEditorScreen').classList.add('active');
  let curFolderId=presetFolderId||'';
  if(quizId){
    const qz=qrQuizzes.find(q=>q.id===quizId);
    qrCurQuizId=quizId;
    qrQuestionsBuf=qz?JSON.parse(JSON.stringify(qz.questions||[])):[];
    document.getElementById('qrQuizNameInp').value=qz?qz.name:'';
    curFolderId=(qz&&qz.folderId)||'';
  }else{
    qrCurQuizId=null; qrQuestionsBuf=[];
    document.getElementById('qrQuizNameInp').value='';
  }
  const folderWrap=document.getElementById('qrFolderSelectWrap');
  const folderSel=document.getElementById('qrFolderSelect');
  if(folderWrap && folderSel){
    if(isAdmin){
      folderWrap.style.display='block';
      folderSel.innerHTML='<option value="">— Ангилалгүй —</option>'+qrFolders.map(f=>`<option value="${f.id}" ${f.id===curFolderId?'selected':''}>${escH(qrFolderPath(f.id))}</option>`).join('');
    }else{
      folderWrap.style.display='none';
    }
  }
  qrRenderQuestionList();
}
function qrRenderQuestionList(){
  const list=document.getElementById('qrQuestionList'); if(!list)return; list.innerHTML='';
  if(qrQuestionsBuf.length===0){
    list.innerHTML='<div class="rounds-title">Одоохондоо асуулт алга. Доорх товчоор нэмнэ үү.</div>';
    return;
  }
  // Хамгийн эхэнд оруулах товч
  list.appendChild(qrBuildInsertBtn(0));
  qrQuestionsBuf.forEach((q,i)=>{
    const d=document.createElement('div'); d.className='qr-qcard';
    d.onclick=()=>qrOpenQEditor(i);
    const multi=qrIsMulti(q);
    const typeTxt=multi?'🔢 Олон сонголттой':'🔤 Ганц хариулттай';
    d.innerHTML=`<span class="qr-qcard-num">${i+1}</span><div class="qr-qcard-body"><div class="qr-qcard-text">${escH(q.q||'(текстгүй)')}</div><div class="qr-qcard-meta">${typeTxt} · ${q.time}с · ${q.pts} оноо · Зөв: ${escH(qrCorrectLabelText(q))}</div></div>`;
    list.appendChild(d);
    // Энэ асуултын дараа (дараагийн асуултын өмнө) оруулах товч
    list.appendChild(qrBuildInsertBtn(i+1));
  });
}
function qrBuildInsertBtn(pos){
  const btn=document.createElement('button');
  btn.className='qr-insert-btn';
  btn.type='button';
  btn.textContent='+ Энд асуулт оруулах';
  btn.onclick=(e)=>{ e.stopPropagation(); qrOpenQEditor(-1, pos); };
  return btn;
}
let qrEditingQImg=null;
let qrInsertAtPos=-1; // -1 = төгсгөлд нэмэх; >=0 = яг энэ байранд шинэ асуулт оруулах
function qrOpenQEditor(index, insertAtPos){
  qrEditQIndex=index;
  qrInsertAtPos=(index<0 && insertAtPos!=null) ? insertAtPos : -1;
  const q=index>=0?qrQuestionsBuf[index]:{q:'',opts:['','','',''],correct:0,time:20,pts:1000};
  const correctArr=Array.isArray(q.correct)?q.correct:[q.correct];
  document.getElementById('qrQmText').value=q.q||'';
  document.getElementById('qrQmTime').value=String(q.time||20);
  document.getElementById('qrQmPts').value=String(q.pts||1000);
  qrEditingQImg=q.img||null;
  qrQmRenderImgPreview();
  const titleEl=document.querySelector('#qrQOv .qr-qm-title');
  if(titleEl) titleEl.textContent = index>=0 ? 'Асуулт засах'
    : (qrInsertAtPos>=0 ? `Шинэ асуулт оруулах (${qrInsertAtPos+1}-р байранд)` : 'Шинэ асуулт нэмэх');
  const optsWrap=document.getElementById('qrQmOpts');
  optsWrap.innerHTML=[0,1,2,3,4].map(i=>`
    <div class="qr-qm-opt ${correctArr.includes(i)?'correct':''}" id="qrQmOptWrap${i}">
      <span class="qr-qm-lbl">${QR_LETTERS[i]}/${QR_NUMS[i]}</span>
      <input type="checkbox" id="qrQmCorrectChk${i}" ${correctArr.includes(i)?'checked':''} onchange="qrQmMarkCorrect(${i})">
      <textarea id="qrQmOptInp${i}" placeholder="${i<2?'Сонголт '+(i+1)+' (заавал)':'Сонголт '+(i+1)+' (заавал биш)'}" maxlength="400" rows="1">${escH(q.opts[i]||'')}</textarea>
    </div>`).join('');
  document.getElementById('qrQmDelBtn').style.display=index>=0?'inline-block':'none';
  qrUpdateMultiHint();
  document.getElementById('qrQOv').classList.add('open');
}
function qrQmRenderImgPreview(){
  const img=document.getElementById('qrQmImgPreview');
  const ph=document.getElementById('qrQmImgPlaceholder');
  const rmBtn=document.getElementById('qrQmImgRemoveBtn');
  if(qrEditingQImg){
    img.src=qrEditingQImg; img.style.display='block'; ph.style.display='none'; rmBtn.style.display='inline-block';
  }else{
    img.style.display='none'; ph.style.display='block'; rmBtn.style.display='none';
  }
}
async function qrQmImgUpload(input){
  const file=input.files[0]; if(!file) return;
  const ph=document.getElementById('qrQmImgPlaceholder');
  ph.textContent='⏳ Ачааллаж байна...'; ph.style.display='block';
  try{
    const fd=new FormData();
    fd.append('file',file);
    fd.append('upload_preset',CLOUDINARY_PRESET);
    fd.append('public_id','quizrush_q/'+Date.now());
    const r=await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,{method:'POST',body:fd});
    const data=await r.json();
    if(!data.secure_url) throw new Error('Upload failed');
    qrEditingQImg=data.secure_url;
    qrQmRenderImgPreview();
  }catch(e){
    console.error(e);
    notify('Зураг байршуулахад алдаа гарлаа');
    ph.textContent='🖼️ Асуултад зураг нэмэх (заавал биш)';
  }
  input.value='';
}
function qrQmImgRemove(e){
  if(e) e.stopPropagation();
  qrEditingQImg=null;
  qrQmRenderImgPreview();
}
function qrQmMarkCorrect(i){
  const el=document.getElementById('qrQmOptWrap'+i);
  const chk=document.getElementById('qrQmCorrectChk'+i);
  if(el&&chk) el.classList.toggle('correct', chk.checked);
  qrUpdateMultiHint();
}
function qrUpdateMultiHint(){
  const n=[0,1,2,3,4].filter(i=>{const c=document.getElementById('qrQmCorrectChk'+i);return c&&c.checked;}).length;
  const hint=document.getElementById('qrQmMultiHint');
  if(hint) hint.textContent = n>=2 ? `⚠ ${n} зөв хариулт сонгосон байна — тоглогч БҮГДИЙГ сонгож Илгээх ёстой болно` : 'Зөв хариулт(уудаа) чектэй нүдээр тэмдэглэнэ үү. 2+ сонговол олон зөв хариулттай асуулт болно.';
}
function qrCloseQEditor(){ document.getElementById('qrQOv').classList.remove('open'); }
function qrSaveQFromEditor(){
  const text=document.getElementById('qrQmText').value.trim();
  const optsRaw=[0,1,2,3,4].map(i=>document.getElementById('qrQmOptInp'+i).value.trim());
  // Эхнээс нь дараалалтайгаар хоосон биш сонголтуудыг авна (2-оос 5 хүртэл байж болно —
  // тухайн асуултад бодитоор хэдэн сонголт байгаа бол яг тэр тоогоор нь хадгална)
  const opts=[];
  for(let i=0;i<5;i++){
    if(optsRaw[i]) opts.push(optsRaw[i]);
    else break;
  }
  const correctArr=[0,1,2,3,4].filter(i=>{const c=document.getElementById('qrQmCorrectChk'+i);return c&&c.checked;}).filter(i=>i<opts.length);
  const time=parseInt(document.getElementById('qrQmTime').value);
  const pts=parseInt(document.getElementById('qrQmPts').value);
  if(!text){notify('Асуултын текст бичнэ үү');return;}
  if(opts.length<2){notify('Дор хаяж 2 сонголт бичнэ үү');return;}
  if(correctArr.length===0){notify('Дор хаяж нэг зөв хариулт сонгоно уу');return;}
  const correct=correctArr.length===1?correctArr[0]:correctArr.sort((a,b)=>a-b);
  const qObj={q:text,opts,correct,time,pts};
  if(qrEditingQImg) qObj.img=qrEditingQImg;
  if(qrEditQIndex>=0){
    qrQuestionsBuf[qrEditQIndex]=qObj; // одоо байгаа асуултыг засаж байна
  }else if(qrInsertAtPos>=0){
    qrQuestionsBuf.splice(qrInsertAtPos,0,qObj); // яг тэр байранд шинээр оруулна — дараагийн асуултууд автоматаар нэг нэгээр шилжинэ
  }else{
    qrQuestionsBuf.push(qObj); // төгсгөлд нэмнэ
  }
  qrInsertAtPos=-1;
  qrCloseQEditor(); qrRenderQuestionList();
}
function qrDeleteQFromEditor(){
  if(qrEditQIndex<0)return;
  qrQuestionsBuf.splice(qrEditQIndex,1);
  qrCloseQEditor(); qrRenderQuestionList();
}
async function qrSaveQuizMeta(){
  if(!currentUser){notify('Эхлээд нэвтэрнэ үү!');return;}
  const name=document.getElementById('qrQuizNameInp').value.trim()||'Нэргүй сан';
  const id=qrCurQuizId||('qr'+Date.now());
  const data={id,name,ownerId:currentUser.uid,questions:qrQuestionsBuf};
  if(isAdmin){
    const folderSel=document.getElementById('qrFolderSelect');
    data.folderId=(folderSel&&folderSel.value)?folderSel.value:null;
  }
  try{
    await setDoc(doc(fsdb,'live_quizzes',id),data,{merge:true});
    notify('Хадгалагдлаа! ✓');
    qrCurQuizId=id;
    await qrLoadQuizzes(); qrQuizzesLoadedAt=Date.now();
    showQRHome();
  }catch(e){console.error(e);notify('Хадгалахад алдаа гарлаа');}
}
async function qrDeleteQuiz(e,id){
  e.stopPropagation();
  if(!confirm('Энэ асуултын сан болон бүх асуултыг устгах уу?'))return;
  try{
    await deleteDoc(doc(fsdb,'live_quizzes',id));
    qrQuizzes=qrQuizzes.filter(q=>q.id!==id);
    // Фолдер дотор байх үедээ устгавал тэр фолдертоо хэвээр үлдэнэ, эс бөгөөс нүүр рүү
    if(qrCurFolderId && document.getElementById('qrFolderScreen').classList.contains('active')){
      qrOpenFolder(qrCurFolderId);
    }else{
      qrRenderHome();
    }
  }catch(e){console.error(e);notify('Устгахад алдаа гарлаа');}
}

// ── HOST: session үүсгэх, lobby ──
async function qrHostStart(quizId, timeDelta){
  if(!currentUser){openLogin();return;}
  if(!await hasActiveSubscription()){showSubRequired();return;}
  const quiz=qrQuizzes.find(q=>q.id===quizId);
  if(!quiz||!quiz.questions||quiz.questions.length===0){notify('Энэ санд асуулт байхгүй байна. Эхлээд асуулт нэмнэ үү.');return;}
  const delta=timeDelta||0;
  qrCurQuizCache = delta===0 ? quiz : {...quiz, questions: quiz.questions.map(q=>({...q, time: Math.max(5, q.time+delta)}))};
  const code=await qrGenUniqueCode('live_sessions');
  const sid='qs'+Date.now();
  const sessionData={id:sid,code,quizId,quizName:quiz.name,hostId:currentUser.uid,phase:'lobby',qIndex:-1,totalQ:quiz.questions.length,qStartedAt:0,standings:[],createdAt:Date.now()};
  try{
    await setDoc(doc(fsdb,'live_sessions',sid),sessionData);
    qrSessionId=sid; qrIsHost=true; qrCurSession=sessionData; qrLastRenderedPhaseKey=null;
    showQRLobby();
  }catch(e){console.error(e);notify('Сесс үүсгэхэд алдаа гарлаа');}
}
function showQRLobby(){
  setAllInactive();
  document.getElementById('qrHostLobbyScreen').classList.add('active');
  document.getElementById('qrLobbyQuizName').textContent=qrCurSession.quizName;
  document.getElementById('qrPinBox').textContent=qrCurSession.code;
  const joinUrl='https://bolorgames.com/?join='+qrCurSession.code;
  document.getElementById('qrQrImg').src='https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data='+encodeURIComponent(joinUrl);
  qrHostSubscribeLobbyPlayers();
  qrHostSubscribeSession();
}
let qrPlayersRetryCount=0, qrPlayersRetryTimer=null;
function qrHostSubscribeLobbyPlayers(){
  if(qrUnsubPlayers) qrUnsubPlayers();
  if(qrPlayersRetryTimer){clearTimeout(qrPlayersRetryTimer);qrPlayersRetryTimer=null;}
  const mySid=qrSessionId;
  qrUnsubPlayers=onSnapshot(collection(fsdb,'live_sessions',mySid,'players'), snap=>{
    qrPlayersRetryCount=0;
    const players=[]; snap.forEach(d=>players.push({id:d.id,...d.data()}));
    const cntEl=document.getElementById('qrPlayerCount'); if(cntEl)cntEl.textContent=players.length;
    const list=document.getElementById('qrLobbyPlayers');
    if(list) list.innerHTML=players.map(p=>`<span class="qr-player-chip">${escH(p.name)}</span>`).join('');
    const startBtn=document.getElementById('qrStartBtn');
    if(startBtn){ startBtn.disabled=players.length===0; startBtn.textContent=players.length===0?'Тоглогч хүлээж байна…':`▶ Эхлүүлэх (${players.length})`; }
  }, err=>{
    console.error('[QR] players listen err',err);
    if(qrSessionId!==mySid) return;
    qrPlayersRetryCount++;
    if(qrPlayersRetryCount<=8){ qrPlayersRetryTimer=setTimeout(()=>{ if(qrSessionId===mySid) qrHostSubscribeLobbyPlayers(); }, Math.min(1500*qrPlayersRetryCount,8000)); }
    else notify('Тоглогчидтой холбогдоход алдаа гарлаа. Хуудсаа шинэчилнэ үү.',6000);
  });
}
let qrSessionRetryCount=0, qrSessionRetryTimer=null;
function qrHostSubscribeSession(){
  if(qrUnsubSession) qrUnsubSession();
  if(qrSessionRetryTimer){clearTimeout(qrSessionRetryTimer);qrSessionRetryTimer=null;}
  const mySid=qrSessionId;
  qrUnsubSession=onSnapshot(doc(fsdb,'live_sessions',mySid), snap=>{
    qrSessionRetryCount=0; // амжилттай мэдээлэл ирвэл дахин холбогдох тоолуурыг тэглэнэ
    if(!snap.exists())return;
    qrCurSession={id:snap.id,...snap.data()};
    if(qrIsHost) qrHostHandleSessionUpdate(qrCurSession);
    else qrPlayerHandleSessionUpdate(qrCurSession);
  }, err=>{
    console.error('[QR] session listen err',err);
    if(qrSessionId!==mySid) return; // өөр session рүү шилжсэн бол дахин холбогдохгүй
    qrSessionRetryCount++;
    if(qrSessionRetryCount===1) notify('Холболт тасарлаа, автоматаар дахин холбогдож байна…',4000);
    if(qrSessionRetryCount<=8){
      qrSessionRetryTimer=setTimeout(()=>{ if(qrSessionId===mySid) qrHostSubscribeSession(); }, Math.min(1500*qrSessionRetryCount,8000));
    }else{
      notify('Холболт сэргээгдсэнгүй. Хуудсаа шинэчилнэ үү.',8000);
    }
  });
}
async function qrHostBeginGame(){
  try{
    await setDoc(doc(fsdb,'live_sessions',qrSessionId),{...qrCurSession,phase:'question',qIndex:0,qStartedAt:Date.now()},{merge:true});
  }catch(e){console.error(e);notify('Эхлүүлэхэд алдаа гарлаа');}
}
function qrHostCancelSession(){
  if(!confirm('Тэмцээнийг цуцлах уу?'))return;
  if(qrSessionId){ setDoc(doc(fsdb,'live_sessions',qrSessionId),{phase:'cancelled'},{merge:true}).catch(()=>{}); }
  qrDeleteTempRandomQuiz();
  qrHostCleanupListeners();
  qrSessionId=null; qrIsHost=false; qrCurSession=null;
  showQRHome();
}
// RANDOM TEST-ийн зориулалттай түр зуурын quiz баримтыг (хэрэв байвал) устгаж,
// live_quizzes коллекц хэт хуримтлагдахаас (улмаар QuizRush ачаалалт удаашрахаас) сэргийлнэ
function qrDeleteTempRandomQuiz(){
  const qid=qrCurSession&&qrCurSession.quizId;
  if(qid && qid.startsWith('randtest_')){
    deleteDoc(doc(fsdb,'live_quizzes',qid)).catch(()=>{});
  }
}
function qrHostCleanupListeners(){
  if(qrUnsubSession){qrUnsubSession();qrUnsubSession=null;}
  if(qrUnsubPlayers){qrUnsubPlayers();qrUnsubPlayers=null;}
  if(qrUnsubAnswers){qrUnsubAnswers();qrUnsubAnswers=null;}
  if(qrHostTimerInterval){clearInterval(qrHostTimerInterval);qrHostTimerInterval=null;}
  if(qrPlayTimerInterval){clearInterval(qrPlayTimerInterval);qrPlayTimerInterval=null;}
  if(qrSessionRetryTimer){clearTimeout(qrSessionRetryTimer);qrSessionRetryTimer=null;}
  if(qrPlayersRetryTimer){clearTimeout(qrPlayersRetryTimer);qrPlayersRetryTimer=null;}
  if(qrAnswersRetryTimer){clearTimeout(qrAnswersRetryTimer);qrAnswersRetryTimer=null;}
}

// ── HOST: тоглоомын явц ──
function qrHostHandleSessionUpdate(session){
  if(!qrIsHost) return;
  const key=session.phase+':'+session.qIndex;
  if(session.phase==='question'){
    if(qrLastRenderedPhaseKey!==key){
      setAllInactive();
      document.getElementById('qrHostGameScreen').classList.add('active');
      qrHostRenderQuestion(session);
      qrLastRenderedPhaseKey=key;
    }
  }else if(session.phase==='reveal'){
    if(qrLastRenderedPhaseKey!==key){
      qrHostRenderReveal(session);
      qrLastRenderedPhaseKey=key;
    }
  }else if(session.phase==='ended'){
    if(qrLastRenderedPhaseKey!=='ended'){
      qrHostRenderEnded(session);
      qrLastRenderedPhaseKey='ended';
    }
  }
}
function qrHostRenderQuestion(session){
  const q=qrCurQuizCache.questions[session.qIndex];
  const multi=qrIsMulti(q);
  const labels=qrOptLabels(q);
  document.getElementById('qrHostQNum').innerHTML=`${session.qIndex+1}-р асуулт <span class="qr-type-badge${multi?' multi':''}">${qrTypeBadge(q)}</span>`;
  const qEl=document.getElementById('qrHostQText');
  qEl.textContent=q.q;
  qEl.className='qr-host-qtext'+(q.q.length>90?' qr-q-long':'');
  const imgEl=document.getElementById('qrHostQImg');
  if(q.img){ imgEl.src=q.img; imgEl.style.display='block'; }else{ imgEl.style.display='none'; imgEl.src=''; }
  document.getElementById('qrHostOpts').innerHTML=q.opts.map((o,i)=>{
    const lenCls=o.length>70?' qr-opt-vlong':(o.length>34?' qr-opt-long':'');
    return `<div class="qr-host-opt o${i}${lenCls}"><span class="qr-shape">${labels[i]}</span><span>${escH(o)}</span></div>`;
  }).join('');
  document.getElementById('qrHostLeaderboard').style.display='none';
  document.getElementById('qrHostActions').innerHTML=`<button onclick="qrHostReveal()">Хариу харуулах ⏹</button>`;
  qrHostStartTimerBar(q.time, session.qStartedAt);
  qrHostSubscribeAnswerCount(session.qIndex);
}
function qrHostStartTimerBar(timeLimit, startedAt){
  if(qrHostTimerInterval) clearInterval(qrHostTimerInterval);
  const bar=document.getElementById('qrHostTimerBar');
  let lastSec=-1;
  const tick=()=>{
    const elapsed=(Date.now()-startedAt)/1000;
    const remain=Math.max(0,timeLimit-elapsed);
    const pct=Math.max(0,100*(1-elapsed/timeLimit));
    if(bar) bar.style.width=pct+'%';
    const secLeft=Math.ceil(remain);
    if(secLeft!==lastSec && secLeft>=0 && secLeft<=timeLimit){ lastSec=secLeft; qrPlayTick(remain/timeLimit); }
    if(elapsed>=timeLimit){clearInterval(qrHostTimerInterval);qrHostTimerInterval=null;}
  };
  tick(); qrHostTimerInterval=setInterval(tick,100);
}
let qrAnswersRetryCount=0, qrAnswersRetryTimer=null;
function qrHostSubscribeAnswerCount(qIndex){
  if(qrUnsubAnswers) qrUnsubAnswers();
  if(qrAnswersRetryTimer){clearTimeout(qrAnswersRetryTimer);qrAnswersRetryTimer=null;}
  const mySid=qrSessionId;
  qrUnsubAnswers=onSnapshot(query(collection(fsdb,'live_sessions',mySid,'answers'), where('qIndex','==',qIndex)), snap=>{
    qrAnswersRetryCount=0;
    const el=document.getElementById('qrHostAnsCount'); if(el)el.textContent=snap.size+' хариулсан';
    qrLastAnswerSnapCache=[]; snap.forEach(d=>qrLastAnswerSnapCache.push(d.data()));
  }, err=>{
    console.error('[QR] answers listen err',err);
    if(qrSessionId!==mySid) return;
    qrAnswersRetryCount++;
    if(qrAnswersRetryCount<=8){ qrAnswersRetryTimer=setTimeout(()=>{ if(qrSessionId===mySid) qrHostSubscribeAnswerCount(qIndex); }, Math.min(1500*qrAnswersRetryCount,8000)); }
    else notify('Хариултын мэдээлэл авахад алдаа гарлаа.',5000);
  });
}
function qrHostReveal(){
  if(qrHostTimerInterval){clearInterval(qrHostTimerInterval);qrHostTimerInterval=null;}
  // Reveal тооцоолж байх зуур шинэ хариулт орж ирээд өгөгдөл "зөрөхөөс" сэргийлж,
  // тоолж дуусангуутаа listener-ийг зогсооно (cache нь энэ мөчид "царцдаг")
  if(qrUnsubAnswers){qrUnsubAnswers();qrUnsubAnswers=null;}
  if(qrAnswersRetryTimer){clearTimeout(qrAnswersRetryTimer);qrAnswersRetryTimer=null;}
  qrHostComputeStandingsAndReveal();
}
async function qrHostComputeStandingsAndReveal(){
  try{
    const [playersSnap,answersSnap]=await withTimeout(Promise.all([
      getDocs(collection(fsdb,'live_sessions',qrSessionId,'players')),
      getDocs(collection(fsdb,'live_sessions',qrSessionId,'answers'))
    ]), 8000, 'qrRevealFetch');
    const totals={},names={},corrects={};
    playersSnap.forEach(d=>{totals[d.id]=0;names[d.id]=d.data().name;corrects[d.id]=0;});
    answersSnap.forEach(d=>{
      const a=d.data();
      totals[a.playerId]=(totals[a.playerId]||0)+(a.pts||0);
      if(!names[a.playerId])names[a.playerId]=a.playerName;
      if(a.correct){ corrects[a.playerId]=(corrects[a.playerId]||0)+1; }
    });
    const standings=Object.keys(totals).map(id=>({id,name:names[id]||'???',score:totals[id],correctCount:corrects[id]||0})).sort((a,b)=>b.score-a.score).slice(0,15);
    await withTimeout(setDoc(doc(fsdb,'live_sessions',qrSessionId),{...qrCurSession,phase:'reveal',standings},{merge:true}), 8000, 'qrRevealWrite');
  }catch(e){
    console.error(e);
    const msg=String(e&&e.message||'');
    notify(msg.includes('TIMEOUT')?'Сүлжээ удаан байна — «Хариу харуулах»-ыг дахин дарна уу.':'Алдаа гарлаа: '+String(e).slice(0,80), 6000);
  }
}
function qrHostRenderReveal(session){
  setAllInactive();
  document.getElementById('qrHostGameScreen').classList.add('active');
  qrPlayRevealFanfare();
  const q=qrCurQuizCache.questions[session.qIndex];
  const labels=qrOptLabels(q);
  document.getElementById('qrHostQNum').innerHTML=`${session.qIndex+1}-р асуулт — Хариу <span class="qr-correct-label">✓ ${qrCorrectLabelText(q)}</span>`;
  const bar=document.getElementById('qrHostTimerBar'); if(bar)bar.style.width='0%';
  const qEl=document.getElementById('qrHostQText');
  qEl.textContent=q.q;
  qEl.className='qr-host-qtext'+(q.q.length>90?' qr-q-long':'');
  const imgEl2=document.getElementById('qrHostQImg');
  if(q.img){ imgEl2.src=q.img; imgEl2.style.display='block'; }else{ imgEl2.style.display='none'; imgEl2.src=''; }
  const nOpts=q.opts.length;
  const correctArr=Array.isArray(q.correct)?q.correct:[q.correct];
  const counts=new Array(nOpts).fill(0);
  (qrLastAnswerSnapCache||[]).forEach(a=>{
    const sel=Array.isArray(a.selected)?a.selected:(a.opt!=null?[a.opt]:[]);
    sel.forEach(i=>{if(i>=0&&i<nOpts)counts[i]++;});
  });
  const totalPlayers=(qrLastAnswerSnapCache||[]).length||1;
  document.getElementById('qrHostOpts').innerHTML=q.opts.map((o,i)=>{
    const pct=Math.round(counts[i]/totalPlayers*100);
    const lenCls=o.length>70?' qr-opt-vlong':(o.length>34?' qr-opt-long':'');
    return `<div class="qr-host-opt o${i} ${correctArr.includes(i)?'correctopt':'dimmed'}${lenCls}"><span class="qr-shape">${labels[i]}</span><span>${escH(o)}</span><span class="qr-host-opt-pct">${counts[i]} (${pct}%)</span><div class="qr-host-opt-bar" style="width:${pct}%"></div></div>`;
  }).join('');
  document.getElementById('qrHostAnsCount').textContent=totalPlayers+' хариулсан';
  const lb=document.getElementById('qrHostLeaderboard');
  lb.style.display='block';
  lb.innerHTML='<div class="rounds-title" style="margin:20px 0 10px;">🏆 Тэргүүлэгчид</div>'+(session.standings||[]).slice(0,5).map((s,i)=>`<div class="qr-lb-row" style="animation-delay:${i*0.08}s"><span class="qr-lb-rank">${i+1}</span><span class="qr-lb-name">${escH(s.name)}</span><span class="qr-lb-score">${s.score}</span></div>`).join('');
  const isLast=session.qIndex>=session.totalQ-1;
  document.getElementById('qrHostActions').innerHTML=isLast?`<button onclick="qrHostEndGame()">🏁 Тэмцээн дуусгах</button>`:`<button onclick="qrHostNextQuestion()">Дараагийн асуулт →</button>`;
}
async function qrHostNextQuestion(){
  const nextIdx=qrCurSession.qIndex+1;
  try{ await setDoc(doc(fsdb,'live_sessions',qrSessionId),{...qrCurSession,phase:'question',qIndex:nextIdx,qStartedAt:Date.now()},{merge:true}); }
  catch(e){console.error(e);notify('Алдаа гарлаа');}
}
async function qrHostEndGame(){
  try{ await setDoc(doc(fsdb,'live_sessions',qrSessionId),{...qrCurSession,phase:'ended'},{merge:true}); }
  catch(e){console.error(e);notify('Алдаа гарлаа');}
}
function qrHostRenderEnded(session){
  setAllInactive();
  document.getElementById('qrHostGameScreen').classList.add('active');
  document.getElementById('qrHostQNum').textContent='Тэмцээн дууслаа 🏁';
  const bar=document.getElementById('qrHostTimerBar'); if(bar)bar.style.width='0%';
  document.getElementById('qrHostAnsCount').textContent='';
  document.getElementById('qrHostQText').textContent='';
  const imgEl3=document.getElementById('qrHostQImg'); if(imgEl3){imgEl3.style.display='none';imgEl3.src='';}
  document.getElementById('qrHostOpts').innerHTML='';
  const medals=['🥇','🥈','🥉'];
  const totalQ=session.totalQ||1;
  const lb=document.getElementById('qrHostLeaderboard');
  lb.style.display='block';
  lb.innerHTML='<div class="qr-podium-wrap"><div class="qr-podium-emoji">🎉</div></div>'+(session.standings||[]).slice(0,10).map((s,i)=>{
    const cc=s.correctCount||0;
    const pct=Math.round(cc/totalQ*100);
    return `<div class="qr-lb-row" style="animation-delay:${i*0.08}s"><span class="qr-lb-rank">${medals[i]||(i+1)}</span><span class="qr-lb-name">${escH(s.name)}<div class="qr-lb-detail">${cc}/${totalQ} зөв (${pct}%)</div></span><span class="qr-lb-score">${s.score}</span></div>`;
  }).join('');
  document.getElementById('qrHostActions').innerHTML=`<button onclick="qrHostFinishSession()">✓ Дуусгаад гарах</button>`;
}
function qrHostFinishSession(){
  qrDeleteTempRandomQuiz();
  qrHostCleanupListeners();
  qrSessionId=null; qrIsHost=false; qrCurSession=null; qrLastRenderedPhaseKey=null;
  showQRHome();
}

// ── PLAYER: нэгдэх, тоглох ──
function showQRJoin(prefillCode){
  setAllInactive();
  document.getElementById('qrJoinScreen').classList.add('active');
  document.getElementById('qrJoinErr').textContent='';
  document.getElementById('qrJoinCodeInp').value=prefillCode||'';
  document.getElementById('qrJoinNameInp').value=qrPlayerName||'';
  setTimeout(()=>{ const el=prefillCode?document.getElementById('qrJoinNameInp'):document.getElementById('qrJoinCodeInp'); if(el)el.focus(); },200);
}
async function qrDoJoin(){
  const code=document.getElementById('qrJoinCodeInp').value.trim();
  const name=document.getElementById('qrJoinNameInp').value.trim();
  const errEl=document.getElementById('qrJoinErr'); errEl.textContent='';
  if(!/^\d{6}$/.test(code)){errEl.textContent='6 оронтой код оруулна уу';return;}
  if(!name){errEl.textContent='Нэрээ оруулна уу';return;}
  if(name.length>20){errEl.textContent='Нэр 20 тэмдэгтээс ихгүй байх';return;}
  const btn=document.getElementById('qrJoinGoBtn');
  if(btn){ btn.disabled=true; btn.textContent='Холбогдож байна…'; }
  try{
    const snap=await withTimeout(getDocs(query(collection(fsdb,'live_sessions'), where('code','==',code))), 8000, 'qrFindSession');
    const candidates=[];
    const staleCutoff=Date.now()-12*60*60*1000; // 12 цагаас хуучин session-ийг үл тоомсорлоно
    snap.forEach(d=>{ const data=d.data(); if(data.phase!=='ended'&&data.phase!=='cancelled' && (data.createdAt||0)>=staleCutoff) candidates.push({id:d.id,...data}); });
    // Хэрэв санамсаргүй давхцал гарсан бол хамгийн СҮҮЛД үүссэн session-ийг сонгоно
    candidates.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
    const found=candidates[0]||null;
    if(!found){errEl.textContent='Ийм код олдсонгүй эсвэл тэмцээн дууссан байна';return;}
    qrSessionId=found.id; qrCurSession=found; qrIsHost=false; qrPlayerName=name;
    qrPlayerId=localStorage.getItem('qr_pid_'+qrSessionId)||('p'+Date.now()+Math.random().toString(36).slice(2,8));
    localStorage.setItem('qr_pid_'+qrSessionId, qrPlayerId);
    const quizSnap=await withTimeout(getDoc(doc(fsdb,'live_quizzes',found.quizId)), 8000, 'qrFindQuiz');
    if(!quizSnap.exists()){ errEl.textContent='Тоглолтын асуултын сан олдсонгүй. Хосттой холбогдоно уу.'; return; }
    qrCurQuizCache={id:quizSnap.id,...quizSnap.data()};
    await withTimeout(setDoc(doc(fsdb,'live_sessions',qrSessionId,'players',qrPlayerId),{name,joinedAt:Date.now()}), 8000, 'qrJoinWrite');
    qrPlayerHasAnswered=false; qrLastRenderedPhaseKey=null; qrPlayWrongLog=[];
    showQRPlay();
  }catch(e){
    console.error(e);
    const msg=String(e&&e.message||'');
    errEl.textContent=msg.includes('TIMEOUT')?'Сүлжээ удаан байна. Дахин оролдоно уу.':'Холбогдоход алдаа гарлаа. Дахин оролдоно уу.';
  }finally{
    if(btn){ btn.disabled=false; btn.textContent='Нэгдэх →'; }
  }
}
function showQRPlay(){
  setAllInactive();
  document.getElementById('qrPlayScreen').classList.add('active');
  document.getElementById('qrPlayMyName').textContent=qrPlayerName;
  qrHostSubscribeSession();
}
function qrPlayerHandleSessionUpdate(session){
  if(qrIsHost) return;
  const key=session.phase+':'+session.qIndex;
  if(session.phase==='lobby'){
    qrShowPlayWaiting();
  }else if(session.phase==='question'){
    if(qrLastRenderedPhaseKey!==key){ qrPlayerHasAnswered=false; qrRenderPlayShapes(session); qrLastRenderedPhaseKey=key; }
  }else if(session.phase==='reveal'){
    if(qrLastRenderedPhaseKey!==key){ qrRenderPlayReveal(session); qrLastRenderedPhaseKey=key; }
  }else if(session.phase==='ended'){
    qrRenderPlayFinal(session);
  }else if(session.phase==='cancelled'){
    qrRenderPlayCancelled();
  }
}
function qrHideAllPlaySubs(){
  ['qrPlayWaiting','qrPlayQuestion','qrPlaySubmitted','qrPlayReveal','qrPlayFinal'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.style.display='none';
  });
}
function qrShowPlayWaiting(){ qrHideAllPlaySubs(); document.getElementById('qrPlayWaiting').style.display='flex'; }
function qrIsMulti(q){ return Array.isArray(q.correct); }
const QR_LETTERS=['A','B','C','D','E'];
// ── Хугацаа тохируулах модаль (тоглоом эхлэхийн өмнө) — секундээр нэмэх/хасах ──
let qrPendingStartQuizId=null, qrPendingStartMode=null;
let qrPendingStartPlayMode='sequential';
function qrSetPlayMode(m){
  qrPendingStartPlayMode=m;
  document.querySelectorAll('.qr-playmode-btn').forEach(b=>b.classList.toggle('selected', b.dataset.mode===m));
}
function qrShowTimeAdjust(quizId, mode){
  qrPendingStartQuizId=quizId; qrPendingStartMode=mode; qrPendingStartPlayMode='sequential';
  const sel=document.getElementById('qrTimeAdjustSelect'); if(sel) sel.value='0';
  const modeRow=document.getElementById('qrPlayModeRow');
  if(modeRow) modeRow.style.display = mode==='solo' ? 'flex' : 'none';
  document.querySelectorAll('.qr-playmode-btn').forEach(b=>b.classList.toggle('selected', b.dataset.mode==='sequential'));
  document.getElementById('qrTimeAdjustOv').classList.add('open');
}
function qrCloseTimeAdjust(){ document.getElementById('qrTimeAdjustOv').classList.remove('open'); }
async function qrConfirmTimeAdjust(){
  const deltaSec=parseInt(document.getElementById('qrTimeAdjustSelect').value)||0;
  const quizId=qrPendingStartQuizId, mode=qrPendingStartMode, playMode=qrPendingStartPlayMode;
  qrCloseTimeAdjust();
  if(mode==='host') await qrHostStart(quizId, deltaSec);
  else if(mode==='solo'){
    if(playMode==='examall'){
      const quiz=qrQuizzes.find(q=>q.id===quizId);
      if(!quiz||!quiz.questions||quiz.questions.length===0){notify('Энэ санд асуулт байхгүй байна.');return;}
      const adjQuiz = deltaSec===0 ? quiz : {...quiz, questions: quiz.questions.map(q=>({...q, time: Math.max(5, q.time+deltaSec)}))};
      qrExamStart(adjQuiz);
    }else{
      qrStartSolo(quizId, deltaSec);
    }
  }
  else if(mode==='cdhost') await cdHostStart(quizId, deltaSec);
}
const QR_NUMS=['1','2','3','4','5'];
// Дан хариулттай асуултад A,B,C… үсэг; олон сонголттой асуултад 1,2,3… дугаар харуулна
function qrOptLabels(q){ return qrIsMulti(q) ? QR_NUMS : QR_LETTERS; }
function qrTypeBadge(q){ return qrIsMulti(q) ? '🔢 Олон сонголттой' : '🔤 Ганц хариулттай'; }
function qrCorrectLabelText(q){
  const labels=qrOptLabels(q);
  if(qrIsMulti(q)) return q.correct.map(i=>labels[i]).join(', ');
  return labels[q.correct];
}
let qrSelectedMulti=new Set();
function qrRenderPlayShapes(session){
  qrHideAllPlaySubs();
  document.getElementById('qrPlayQuestion').style.display='block';
  const q=(qrCurQuizCache.questions||[])[session.qIndex]||{time:20,opts:[]};
  const nOpts=(q.opts||[]).length||4;
  qrSelectedMulti=new Set();
  const multi=qrIsMulti(q);
  const labels=qrOptLabels(q);
  const imgEl=document.getElementById('qrPlayQImg');
  if(imgEl){ if(q.img){ imgEl.src=q.img; imgEl.style.display='block'; } else { imgEl.style.display='none'; imgEl.src=''; } }
  document.getElementById('qrPlayShapes').innerHTML=labels.slice(0,nOpts).map((s,i)=>
    `<button class="qr-play-shape-btn o${i}" onclick="${multi?`qrToggleMultiSelect(${i})`:`qrSubmitAnswer(${i})`}">${s}</button>`
  ).join('');
  const hintEl=document.getElementById('qrMultiHint');
  const submitBtn=document.getElementById('qrMultiSubmitBtn');
  if(hintEl) hintEl.style.display=multi?'block':'none';
  if(submitBtn){ submitBtn.style.display=multi?'block':'none'; submitBtn.disabled=true; }
  qrPlayStartTimer(q.time, session.qStartedAt);
}
function qrToggleMultiSelect(i){
  if(qrPlayerHasAnswered) return;
  const btn=document.querySelectorAll('#qrPlayShapes .qr-play-shape-btn')[i];
  if(qrSelectedMulti.has(i)){ qrSelectedMulti.delete(i); if(btn)btn.classList.remove('selected'); }
  else{ qrSelectedMulti.add(i); if(btn)btn.classList.add('selected'); }
  qrPlaySelectBlip();
  const submitBtn=document.getElementById('qrMultiSubmitBtn');
  if(submitBtn) submitBtn.disabled=qrSelectedMulti.size===0;
}
function qrSubmitMultiAnswer(){
  if(qrPlayerHasAnswered||qrSelectedMulti.size===0) return;
  qrPlayerHasAnswered=true;
  const arr=Array.from(qrSelectedMulti).sort((a,b)=>a-b);
  qrLastAnswerAttempt={selectedArr:arr};
  if(qrPlayTimerInterval){clearInterval(qrPlayTimerInterval);qrPlayTimerInterval=null;}
  qrHideAllPlaySubs();
  document.getElementById('qrPlaySubmitted').style.display='flex';
  qrDoSubmitAnswer(arr);
}
function qrPlayStartTimer(timeLimit, startedAt){
  if(qrPlayTimerInterval) clearInterval(qrPlayTimerInterval);
  const el=document.getElementById('qrPlayTimer');
  let lastSec=-1;
  const tick=()=>{
    const remain=Math.max(0, timeLimit-(Date.now()-startedAt)/1000);
    if(el) el.textContent=Math.ceil(remain)+'с';
    const secLeft=Math.ceil(remain);
    if(secLeft!==lastSec && secLeft>=0){ lastSec=secLeft; if(!qrPlayerHasAnswered) qrPlayTick(remain/timeLimit); }
    if(remain<=0){clearInterval(qrPlayTimerInterval);qrPlayTimerInterval=null;}
  };
  tick(); qrPlayTimerInterval=setInterval(tick,200);
}
let qrLastAnswerAttempt=null; // {optIndex} эсвэл {selectedArr} — "Дахин илгээх" товчинд хэрэглэнэ
async function qrSubmitAnswer(optIndex){
  if(qrPlayerHasAnswered) return;
  qrPlayerHasAnswered=true;
  qrLastAnswerAttempt={optIndex};
  qrPlaySelectBlip();
  if(qrPlayTimerInterval){clearInterval(qrPlayTimerInterval);qrPlayTimerInterval=null;}
  qrHideAllPlaySubs();
  document.getElementById('qrPlaySubmitted').style.display='flex';
  await qrDoSubmitAnswer([optIndex]);
}
function qrArraysEqual(a,b){
  if(a.length!==b.length) return false;
  const sa=[...a].sort((x,y)=>x-y), sb=[...b].sort((x,y)=>x-y);
  return sa.every((v,i)=>v===sb[i]);
}
async function qrDoSubmitAnswer(selectedArr){
  const txtEl=document.getElementById('qrSubmitTxt');
  const stuckBtn=document.getElementById('qrStuckBtn');
  if(txtEl) txtEl.textContent='Хариулт илгээгдлээ! Хүлээнэ үү…';
  if(stuckBtn) stuckBtn.style.display='none';
  const session=qrCurSession;
  const q=(qrCurQuizCache.questions||[])[session.qIndex];
  if(!q)return;
  const answerId=session.qIndex+'_'+qrPlayerId;
  const elapsed=Math.min(Math.max((Date.now()-session.qStartedAt)/1000,0),q.time);
  const correctArr=Array.isArray(q.correct)?q.correct:[q.correct];
  const correct=qrArraysEqual(selectedArr,correctArr);
  const pts=correct?Math.round(q.pts*(0.5+0.5*(1-elapsed/q.time))):0;
  if(!correct) qrPlayWrongLog.push({q, selectedArr:selectedArr.slice(), correctArr});
  try{
    // Firestore дуудлага 8 секундээс удвал "гацахын" оронд алдаа заана
    await withTimeout(
      setDoc(doc(fsdb,'live_sessions',qrSessionId,'answers',answerId),{playerId:qrPlayerId,playerName:qrPlayerName,qIndex:session.qIndex,selected:selectedArr,opt:selectedArr[0],correct,pts,at:Date.now()}),
      8000, 'qrSubmitAnswer'
    );
  }catch(e){
    console.error('[QR] answer submit err',e);
    const msg=String(e&&e.code||e&&e.message||'');
    if(msg.includes('permission-denied')){
      // Аль хэдийн бичигдсэн (жишээ нь refresh хийсний дараа дахин дарсан) — асуудалгүй
      return;
    }
    // Жинхэнэ алдаа/timeout — тоглогчид дахин оролдох боломж өгнө
    if(txtEl) txtEl.textContent='Илгээхэд алдаа гарлаа. Сүлжээгээ шалгаад дахин оролдоно уу.';
    if(stuckBtn) stuckBtn.style.display='inline-block';
  }
}
function qrRetryLastAnswer(){
  if(!qrLastAnswerAttempt) return;
  const stuckBtn=document.getElementById('qrStuckBtn');
  if(stuckBtn) stuckBtn.style.display='none';
  const arr=qrLastAnswerAttempt.selectedArr || [qrLastAnswerAttempt.optIndex];
  qrDoSubmitAnswer(arr);
}
function qrRenderPlayReveal(session){
  qrHideAllPlaySubs();
  qrPlayRevealFanfare();
  const el=document.getElementById('qrPlayReveal'); el.style.display='block';
  const mine=(session.standings||[]).find(s=>s.id===qrPlayerId);
  const rank=mine?(session.standings.indexOf(mine)+1):null;
  const cc=mine?(mine.correctCount||0):0;
  const answeredSoFar=(session.qIndex||0)+1;
  el.innerHTML=`<div class="qr-play-reveal-icon">${mine&&rank===1?'🏆':'📊'}</div><div class="qr-play-wait-txt" style="margin-bottom:14px;">Хариу гарлаа!</div><div class="qr-play-reveal-pts">${mine?mine.score:0} оноо</div><div class="qr-play-reveal-detail">${cc}/${answeredSoFar} зөв хариулсан</div><div class="qr-play-reveal-rank">${rank?'Одоогийн байр: '+rank+' / '+session.standings.length:''}</div>`;
}
function qrRenderPlayFinal(session){
  qrHideAllPlaySubs();
  const el=document.getElementById('qrPlayFinal'); el.style.display='block';
  const mine=(session.standings||[]).find(s=>s.id===qrPlayerId);
  const rank=mine?session.standings.indexOf(mine)+1:'-';
  const medals={1:'🥇',2:'🥈',3:'🥉'};
  const totalQ=session.totalQ||1;
  const cc=mine?(mine.correctCount||0):0;
  const pct=Math.round(cc/totalQ*100);
  el.innerHTML=`<div class="qr-play-final-rank">${medals[rank]||('#'+rank)}</div><div class="qr-play-wait-txt" style="margin-bottom:10px;">Тэмцээн дууслаа!</div><div class="qr-play-final-score">${mine?mine.score:0} оноо</div><div class="qr-play-final-detail">${cc}/${totalQ} зөв хариулж, ${pct}% гүйцэтгэлээ</div><button class="qr-join-go-btn" style="margin-top:26px;" onclick="qrPlayerLeaveToHome()">Гарах</button>${qrBuildWrongReviewHTML(qrPlayWrongLog)}`;
}
function qrRenderPlayCancelled(){
  qrHideAllPlaySubs();
  const el=document.getElementById('qrPlayFinal'); el.style.display='block';
  el.innerHTML=`<div class="qr-play-final-rank">😕</div><div class="qr-play-wait-txt">Хост тэмцээнийг цуцалсан байна.</div><button class="qr-join-go-btn" style="margin-top:26px;" onclick="qrPlayerLeaveToHome()">Гарах</button>`;
}
function qrPlayerLeaveToHome(){
  qrHostCleanupListeners();
  qrSessionId=null; qrCurSession=null; qrPlayerHasAnswered=false; qrLastRenderedPhaseKey=null;
  showLanding();
}

// ── SOLO: ганцаараа тоглох горим (Firestore session хэрэггүй, локал) ──
let qrSoloQuiz=null, qrSoloIndex=0, qrSoloScore=0, qrSoloAnswered=false, qrSoloTimer=null, qrSoloCorrectCount=0, qrSoloWrongLog=[];
async function qrStartSolo(quizId, timeDelta){
  if(!currentUser){openLogin();return;}
  if(!await hasActiveSubscription()){showSubRequired();return;}
  const quiz=qrQuizzes.find(q=>q.id===quizId);
  if(!quiz||!quiz.questions||quiz.questions.length===0){notify('Энэ санд асуулт байхгүй байна.');return;}
  const delta=timeDelta||0;
  qrSoloQuiz = delta===0 ? quiz : {...quiz, questions: quiz.questions.map(q=>({...q, time: Math.max(5, q.time+delta)}))};
  qrSoloIndex=0; qrSoloScore=0; qrSoloCorrectCount=0; qrSoloWrongLog=[];
  setAllInactive();
  document.getElementById('qrSoloScreen').classList.add('active');
  document.getElementById('qrSoloFinal').style.display='none';
  qrSoloRenderQuestion();
}
let qrSoloSelectedMulti=new Set();
function qrSoloRenderQuestion(){
  qrSoloAnswered=false;
  qrSoloSelectedMulti=new Set();
  const q=qrSoloQuiz.questions[qrSoloIndex];
  const multi=qrIsMulti(q);
  const labels=qrOptLabels(q);
  document.getElementById('qrSoloQNum').innerHTML=`${qrSoloIndex+1}-р асуулт <span class="qr-type-badge${multi?' multi':''}">${qrTypeBadge(q)}</span>`;
  document.getElementById('qrSoloScore').textContent=qrSoloScore+' оноо';
  const qEl=document.getElementById('qrSoloQText');
  qEl.textContent=q.q;
  qEl.className='qr-solo-qtext'+(q.q.length>90?' qr-q-long':'');
  const imgEl=document.getElementById('qrSoloQImg');
  if(imgEl){ if(q.img){ imgEl.src=q.img; imgEl.style.display='block'; } else { imgEl.style.display='none'; imgEl.src=''; } }
  document.getElementById('qrSoloOpts').innerHTML=q.opts.map((o,i)=>
    `<button class="qr-solo-opt o${i}" onclick="${multi?`qrSoloToggleMulti(${i})`:`qrSoloAnswer(${i})`}"><span class="qr-shape">${labels[i]}</span><span>${escH(o)}</span></button>`
  ).join('');
  document.getElementById('qrSoloFeedback').style.display='none';
  document.getElementById('qrSoloOpts').style.display='grid';
  const hintEl=document.getElementById('qrSoloMultiHint');
  const submitBtn=document.getElementById('qrSoloMultiSubmitBtn');
  if(hintEl) hintEl.style.display=multi?'block':'none';
  if(submitBtn){ submitBtn.style.display=multi?'block':'none'; submitBtn.disabled=true; }
  qrSoloStartTimer(q.time);
}
function qrSoloToggleMulti(i){
  if(qrSoloAnswered) return;
  const btn=document.querySelectorAll('#qrSoloOpts .qr-solo-opt')[i];
  if(qrSoloSelectedMulti.has(i)){ qrSoloSelectedMulti.delete(i); if(btn)btn.classList.remove('selected'); }
  else{ qrSoloSelectedMulti.add(i); if(btn)btn.classList.add('selected'); }
  qrPlaySelectBlip();
  const submitBtn=document.getElementById('qrSoloMultiSubmitBtn');
  if(submitBtn) submitBtn.disabled=qrSoloSelectedMulti.size===0;
}
function qrSoloSubmitMulti(){
  if(qrSoloAnswered||qrSoloSelectedMulti.size===0) return;
  qrSoloFinishAnswer(Array.from(qrSoloSelectedMulti).sort((a,b)=>a-b));
}
function qrSoloStartTimer(timeLimit){
  if(qrSoloTimer) clearInterval(qrSoloTimer);
  const startedAt=Date.now();
  const bar=document.getElementById('qrSoloTimerBar');
  const tick=()=>{
    const elapsed=(Date.now()-startedAt)/1000;
    const pct=Math.max(0,100*(1-elapsed/timeLimit));
    if(bar) bar.style.width=pct+'%';
    if(elapsed>=timeLimit){ clearInterval(qrSoloTimer); qrSoloTimer=null; if(!qrSoloAnswered) qrSoloFinishAnswer(Array.from(qrSoloSelectedMulti)); }
  };
  tick(); qrSoloTimer=setInterval(tick,100);
  qrSoloQuiz._curStartedAt=startedAt;
}
function qrSoloAnswer(optIndex){
  if(qrSoloAnswered) return;
  qrSoloFinishAnswer(optIndex<0?[]:[optIndex]);
}
function qrSoloFinishAnswer(selectedArr){
  if(qrSoloAnswered) return;
  qrSoloAnswered=true;
  if(qrSoloTimer){clearInterval(qrSoloTimer);qrSoloTimer=null;}
  qrPlaySelectBlip();
  const q=qrSoloQuiz.questions[qrSoloIndex];
  const elapsed=Math.min(Math.max((Date.now()-(qrSoloQuiz._curStartedAt||Date.now()))/1000,0),q.time);
  const correctArr=Array.isArray(q.correct)?q.correct:[q.correct];
  const correct=qrArraysEqual(selectedArr,correctArr);
  const pts=correct?Math.round(q.pts*(0.5+0.5*(1-elapsed/q.time))):0;
  qrSoloScore+=pts;
  if(correct) qrSoloCorrectCount++;
  else qrSoloWrongLog.push({q, selectedArr:selectedArr.slice(), correctArr});
  qrLogAnswer({qid:qrSoloQuiz.id+'_'+qrSoloIndex, quizId:qrSoloQuiz.id, quizName:qrSoloQuiz.name, folderId:qrSoloQuiz.folderId||null, qText:q.q, correct});
  document.querySelectorAll('#qrSoloOpts .qr-solo-opt').forEach((el,i)=>{
    el.classList.add('disabled');
    if(correctArr.includes(i)) el.classList.add('correctopt');
    else if(selectedArr.includes(i)) el.classList.add('wrongopt');
  });
  qrPlayRevealFanfare();
  const fb=document.getElementById('qrSoloFeedback');
  fb.style.display='block';
  const labels=qrOptLabels(q);
  const correctTxt=correctArr.map(i=>labels[i]+'. '+q.opts[i]).join('; ');
  fb.innerHTML=correct
    ?`<div class="qr-solo-feedback-icon">🎉</div><div class="qr-solo-feedback-txt correct">Зөв! (${qrCorrectLabelText(q)}) +${pts} оноо</div>`
    :`<div class="qr-solo-feedback-icon">😕</div><div class="qr-solo-feedback-txt wrong">Буруу — зөв хариулт: ${escH(correctTxt)}</div>`;
  setTimeout(()=>{
    qrSoloIndex++;
    if(qrSoloIndex<qrSoloQuiz.questions.length) qrSoloRenderQuestion();
    else qrSoloShowFinal();
  }, 2200);
}
function qrSoloFinishEarly(){
  if(!qrSoloQuiz) return;
  const total=qrSoloQuiz.questions.length;
  const answered=qrSoloIndex; // одоог хүртэл хариулсан асуултын тоо (0-based индекс = хариулсан тоо)
  const remaining=total-answered;
  if(remaining<=0) return; // сүүлийн асуулт дээр байгаа бол хэвийн явцаар дуусна
  if(!confirm(`Та ${answered}/${total} асуулт хариулсан байна (${remaining} асуулт үлдсэн).\n\nҮр дүнгээ зөвхөн хариулсан ${answered} асуултаар тооцох болно. Одоо дуусгах уу?`)) return;
  if(qrSoloTimer){clearInterval(qrSoloTimer);qrSoloTimer=null;}
  qrSoloShowFinal(true);
}
function qrSoloShowFinal(early){
  document.getElementById('qrSoloOpts').style.display='none';
  document.getElementById('qrSoloFeedback').style.display='none';
  document.getElementById('qrSoloQText').textContent='';
  const bar=document.getElementById('qrSoloTimerBar'); if(bar) bar.style.width='0%';
  const totalQuestions=qrSoloQuiz.questions.length;
  const answered = early ? qrSoloIndex : totalQuestions;
  const skipped=totalQuestions-answered;
  const pct = answered>0 ? Math.round(qrSoloCorrectCount/answered*100) : 0;
  const fin=document.getElementById('qrSoloFinal');
  fin.style.display='block';
  fin.innerHTML=`
    <div style="font-size:60px;">${pct>=80?'🏆':pct>=50?'🎉':'💪'}</div>
    <div class="qr-solo-final-score">${qrSoloScore} оноо</div>
    <div class="qr-solo-final-pct">${qrSoloCorrectCount}/${answered} зөв (${pct}%)</div>
    ${skipped>0?`<div class="qr-exam-summary-skipped">📝 Нийт ${totalQuestions}-аас ${answered} асуулт хариулсан (${skipped} асуулт тооцоонд ороогүй)</div>`:''}
    <div class="qr-solo-final-btns">
      <button onclick="qrStartSolo('${qrSoloQuiz.id}')">↻ Дахин тоглох</button>
      <button class="secondary" onclick="qrSoloExit()">Гарах</button>
    </div>
    ${qrBuildWrongReviewHTML(qrSoloWrongLog)}`;
}
// Алдсан асуултуудыг сонголт+зөв хариултын хамт харуулах хэсэг (solo болон multiplayer хоёуланд ашиглана)
function qrBuildWrongReviewHTML(wrongLog){
  if(!wrongLog || !wrongLog.length) return `<div class="qr-wrong-review qr-wrong-review-perfect">🎯 Та бүх асуултад зөв хариуллаа! Алдаа алга.</div>`;
  const items=wrongLog.map((w,i)=>{
    const labels=qrOptLabels(w.q);
    const optsHtml=(w.q.opts||[]).map((o,oi)=>{
      const isCorrect=w.correctArr.includes(oi);
      const isSelected=w.selectedArr.includes(oi);
      let cls='qr-wr-opt';
      if(isCorrect) cls+=' qr-wr-opt-correct';
      else if(isSelected) cls+=' qr-wr-opt-wrong';
      const mark=isCorrect?'✓':(isSelected?'✗':'○');
      return `<div class="${cls}">${mark} ${labels[oi]}. ${escH(o)}</div>`;
    }).join('');
    return `<div class="qr-wrong-item">
      <div class="qr-wrong-qnum">${i+1}. ${escH(w.q.q)}</div>
      <div class="qr-wrong-opts">${optsHtml}</div>
    </div>`;
  }).join('');
  return `<div class="qr-wrong-review">
    <div class="qr-wrong-review-title">❌ Алдсан асуултууд (${wrongLog.length})</div>
    <div class="qr-wrong-list">${items}</div>
  </div>`;
}
function qrSoloExit(){
  if(qrSoloTimer){clearInterval(qrSoloTimer);qrSoloTimer=null;}
  qrSoloQuiz=null;
  showQRHome();
}

// ── QUIZRUSH: БҮХ САНГААС АСУУЛТ ХАЙХ ──
// live_quizzes коллекц дэх БҮХ тестийн БҮХ асуултаас (folder-оос үл хамааран)
// текстээр хайж, олдсон бүр дээр сонголтууд+зөв хариулт+байршлыг харуулна.
// Давхардсан (өөр өөр санд ижилхэн) асуултууд бүгд тусад нь жагсаана.
let qrSearchLoaded=false;
async function showQRSearch(){
  setAllInactive();
  document.getElementById('qrSearchScreen').classList.add('active');
  const inp=document.getElementById('qrSearchInp');
  const prevQuery=inp?inp.value:'';
  document.getElementById('qrSearchResults').innerHTML='';
  document.getElementById('qrSearchCount').textContent='';
  const statusEl=document.getElementById('qrSearchStatus');
  if(statusEl) statusEl.textContent='Сангуудыг шинэчилж байна…';
  await Promise.all([qrLoadQuizzes(), qrLoadFolders()]);
  qrSearchLoaded=true;
  if(statusEl){
    const totalQ=qrQuizzes.filter(z=>!z.isRandomTest).reduce((s,z)=>s+((z.questions||[]).length),0);
    statusEl.textContent=`📚 ${qrQuizzes.filter(z=>!z.isRandomTest).length} сан · 📝 ${totalQ} асуулт дундаас хайна`;
  }
  if(inp){
    if(!prevQuery) inp.value='';
    setTimeout(()=>inp.focus(),150);
  }
  if(prevQuery && prevQuery.trim().length>=2) qrSearchRun();
}
let qrSearchDebounce=null;
function qrSearchOnInput(){
  if(qrSearchDebounce) clearTimeout(qrSearchDebounce);
  qrSearchDebounce=setTimeout(qrSearchRun, 250);
}
function qrSearchRun(){
  const inp=document.getElementById('qrSearchInp');
  const raw=(inp&&inp.value||'').trim();
  const wrap=document.getElementById('qrSearchResults');
  const countEl=document.getElementById('qrSearchCount');
  if(raw.length<2){
    wrap.innerHTML='<div class="qr-search-empty">Хайх үгээ бичнэ үү (дор хаяж 2 тэмдэгт)…</div>';
    countEl.textContent='';
    return;
  }
  const needle=raw.toLowerCase();
  const matches=[];
  qrQuizzes.forEach(quiz=>{
    if(quiz.isRandomTest) return;
    (quiz.questions||[]).forEach((q,idx)=>{
      if((q.q||'').toLowerCase().includes(needle)) matches.push({quiz,q,idx});
    });
  });
  countEl.textContent = matches.length ? `${matches.length} илэрц олдлоо` : '';
  if(!matches.length){
    wrap.innerHTML='<div class="qr-search-empty">Илэрц олдсонгүй. Өөр үгээр хайж үзнэ үү.</div>';
    return;
  }
  wrap.innerHTML=matches.map(m=>{
    const correctArr=Array.isArray(m.q.correct)?m.q.correct:[m.q.correct];
    const optsHtml=(m.q.opts||[]).map((o,i)=>
      `<div class="qr-search-opt${correctArr.includes(i)?' qr-search-opt-correct':''}">${correctArr.includes(i)?'✓':'○'} ${escH(o)}</div>`
    ).join('');
    const path=qrFolderPath(m.quiz.folderId);
    const locStr=(path?path+' → ':'')+(m.quiz.name||'Нэргүй сан');
    return `<div class="qr-search-result">
      <div class="qr-search-qtext">${qrHighlightMatch(m.q.q, raw)}</div>
      <div class="qr-search-opts">${optsHtml}</div>
      <div class="qr-search-loc">📍 ${escH(locStr)} — <b>${m.idx+1}</b>-р асуулт</div>
    </div>`;
  }).join('');
}
// Олдсон үгийг тод (highlight) харуулна — эхлээд escape хийгээд аюулгүйгээр mark хийнэ
function qrHighlightMatch(text, needle){
  const escaped=escH(text||'');
  const escNeedle=escH(needle||'');
  if(!escNeedle) return escaped;
  const idx=escaped.toLowerCase().indexOf(escNeedle.toLowerCase());
  if(idx===-1) return escaped;
  return escaped.slice(0,idx)+'<mark>'+escaped.slice(idx,idx+escNeedle.length)+'</mark>'+escaped.slice(idx+escNeedle.length);
}

window.showQRHome=showQRHome;window.qrOpenEditor=qrOpenEditor;window.qrSaveQuizMeta=qrSaveQuizMeta;window.qrDeleteQuiz=qrDeleteQuiz;
window.qrQmImgUpload=qrQmImgUpload;window.qrQmImgRemove=qrQmImgRemove;
window.qrCreateFolder=qrCreateFolder;window.qrDeleteFolder=qrDeleteFolder;window.qrOpenFolder=qrOpenFolder;
window.qrOpenFolderEdit=qrOpenFolderEdit;window.qrCloseFolderEdit=qrCloseFolderEdit;window.qrSaveFolderEdit=qrSaveFolderEdit;window.qrPickFolderIcon=qrPickFolderIcon;
window.qrShowTimeAdjust=qrShowTimeAdjust;window.qrCloseTimeAdjust=qrCloseTimeAdjust;window.qrConfirmTimeAdjust=qrConfirmTimeAdjust;window.qrSetPlayMode=qrSetPlayMode;
window.qrStartSolo=qrStartSolo;window.qrSoloAnswer=qrSoloAnswer;window.qrSoloExit=qrSoloExit;window.qrSoloFinishEarly=qrSoloFinishEarly;
window.qrSoloToggleMulti=qrSoloToggleMulti;window.qrSoloSubmitMulti=qrSoloSubmitMulti;
window.qrOpenQEditor=qrOpenQEditor;window.qrCloseQEditor=qrCloseQEditor;window.qrSaveQFromEditor=qrSaveQFromEditor;window.qrDeleteQFromEditor=qrDeleteQFromEditor;window.qrQmMarkCorrect=qrQmMarkCorrect;
window.qrHostStart=qrHostStart;window.qrHostBeginGame=qrHostBeginGame;window.qrHostCancelSession=qrHostCancelSession;
window.qrHostReveal=qrHostReveal;window.qrHostNextQuestion=qrHostNextQuestion;window.qrHostEndGame=qrHostEndGame;window.qrHostFinishSession=qrHostFinishSession;
window.showQRJoin=showQRJoin;window.qrDoJoin=qrDoJoin;window.qrSubmitAnswer=qrSubmitAnswer;window.qrPlayerLeaveToHome=qrPlayerLeaveToHome;
window.qrToggleMultiSelect=qrToggleMultiSelect;window.qrSubmitMultiAnswer=qrSubmitMultiAnswer;
window.qrRetryLastAnswer=qrRetryLastAnswer;
window.qrImportJSON=qrImportJSON;window.qrExportFolderJSON=qrExportFolderJSON;
window.qrRandomTestSoloStart=qrRandomTestSoloStart;window.qrRandomTestHostStart=qrRandomTestHostStart;
window.qrForceRefresh=qrForceRefresh;
window.showQRLeaderboard=showQRLeaderboard;
window.qrExamSelect=qrExamSelect;window.qrExamScrollTo=qrExamScrollTo;window.qrExamFinish=qrExamFinish;window.qrExamFinishManual=qrExamFinishManual;
window.qrExamRetry=qrExamRetry;window.qrExamExit=qrExamExit;
window.showQRSearch=showQRSearch;window.qrSearchOnInput=qrSearchOnInput;window.qrSearchRun=qrSearchRun;

// ══════════════════════════════════════════════════════════════
// COUNTDASH — Live Counting Arena (Kahoot маягийн, бодит цагийн)
// QuizRush-тай ижил Kahoot дэд бүтэц (session/players/answers),
// гэхдээ ФУЛЛ ТУСДАА collection ('count_quizzes','count_sessions')
// болон бүх хувьсагч/функц cd-угтвартай тул QuizRush-д НЭГ Ч мөр
// хамаагүй, огт нөлөөлөхгүй.
// ══════════════════════════════════════════════════════════════

let cdQuizzes=[];
let cdCurQuizId=null, cdEditRIndex=-1, cdRoundsBuf=[], cdSelectedShape='⭐';
let cdSessionId=null, cdCurSession=null, cdIsHost=false;
let cdPlayerId=null, cdPlayerName='';
let cdCurQuizCache=null;
let cdUnsubSession=null, cdUnsubPlayers=null, cdUnsubAnswers=null;
let cdHostTimerInterval=null, cdPlayTimerInterval=null;
let cdPlayerHasAnswered=false, cdCurGuess=0, cdEnteredAnswerPhase=false;
let cdLastRenderedPhaseKey=null;
let cdLastAnswerSnapCache=[];
let cdAudioCtx=null, cdCurrentPlayerCount=0, cdAutoNextTimeout=null;

const CD_SHAPES=['⭐','💎','❤️','🔵','🌙','🍀','🔶','🟣'];

function cdEnsureAudioCtx(){
  if(!cdAudioCtx){ try{ cdAudioCtx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} }
  if(cdAudioCtx && cdAudioCtx.state==='suspended'){ cdAudioCtx.resume().catch(()=>{}); }
  return cdAudioCtx;
}
function cdTone(freq,dur,vol,type){
  if(musicMuted) return;
  const ctx=cdEnsureAudioCtx(); if(!ctx) return;
  try{
    const osc=ctx.createOscillator(), gain=ctx.createGain();
    osc.type=type||'sine'; osc.frequency.value=freq;
    gain.gain.setValueAtTime(vol||0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+dur);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime+dur);
  }catch(e){}
}
function cdPlayTensionTick(remainFrac){
  // remainFrac: 0(дуусаж байгаа)..1(дөнгөж эхэлсэн) — цаг багасах тусам өндөр, яаралтай авиа
  const freq=520+(1-remainFrac)*560;
  cdTone(freq, 0.09, 0.1, 'square');
}
function cdPlayConfirmBlip(){ cdTone(720,0.08,0.14,'sine'); setTimeout(()=>cdTone(960,0.09,0.12,'sine'),70); }
function cdPlayRevealChime(){ cdTone(660,0.12,0.14,'sine'); setTimeout(()=>cdTone(880,0.14,0.13,'sine'),110); setTimeout(()=>cdTone(1100,0.18,0.12,'sine'),220); }

// ══════════════════════════════════════════════════════════════
// STARQUIZ — тоглоомын үндсэн логик
// (Ганц "горим" биш — бичих ба дарах хоёулаа үргэлж зэрэг ажиллана)
// ══════════════════════════════════════════════════════════════
let sqSelectedCat='__mixed__', sqSelectedCount=10;
let sqAllItems=[];

async function showSQHome(){
  setAllInactive();
  document.getElementById('sqHomeScreen').classList.add('active');
  document.getElementById('navSQ').classList.add('active');
  activeGame='sq';
  sqBuildFloatingBG();
  try{
    const snap=await getDocs(collection(fsdb,'star_items'));
    sqAllItems=[]; snap.forEach(d=>sqAllItems.push({...d.data(),_id:d.id}));
  }catch(e){console.error('[SQ] load items err',e); sqAllItems=[];}
  sqRenderCatGrid();
  const cntInp=document.getElementById('sqCountInp'); if(cntInp) cntInp.value=sqSelectedCount;
  sqLoadScores();
}
function sqBuildFloatingBG(){
  const wrap=document.getElementById('sqFloatBg'); if(!wrap||wrap.childElementCount)return;
  for(let i=0;i<10;i++){
    const s=document.createElement('div'); s.textContent='⭐';
    s.style.cssText=`position:absolute;top:${4+((i*37)%90)}%;left:${2+((i*53)%94)}%;font-size:${14+(i%4)*10}px;opacity:.12;color:#facc15;animation:qrFloat ${9+(i%5)*1.8}s ease-in-out infinite;animation-delay:${i*0.7}s;`;
    wrap.appendChild(s);
  }
}
function sqRenderCatGrid(){
  const wrap=document.getElementById('sqCatGrid'); if(!wrap)return;
  const cats=[...new Set(sqAllItems.map(i=>i.cat).filter(Boolean))].sort();
  const counts={}; sqAllItems.forEach(i=>{counts[i.cat]=(counts[i.cat]||0)+1;});
  let html=`<button class="sq-cat-btn ${sqSelectedCat==='__mixed__'?'active':''}" onclick="sqSetCat('__mixed__')">🎲 Холимог (${sqAllItems.length})</button>`;
  html+=cats.map(c=>`<button class="sq-cat-btn ${sqSelectedCat===c?'active':''}" onclick="sqSetCat('${escA(c)}')">${escH(c)} (${counts[c]})</button>`).join('');
  wrap.innerHTML=html;
  if(sqAllItems.length===0){
    wrap.innerHTML='<div class="rounds-title">Одоохондоо хүн байхгүй байна. Админ эрхтэй бол «⭐ Од удирдах»-аар нэмнэ үү.</div>';
  }
}
function sqSetCat(c){ sqSelectedCat=c; sqRenderCatGrid(); }
function sqSetCount(v){
  const n=parseInt(v);
  sqSelectedCount = (isNaN(n)||n<1) ? 1 : Math.min(n,50);
}
function sqPickRandomItems(n){
  const pool = sqSelectedCat==='__mixed__' ? sqAllItems.slice() : sqAllItems.filter(i=>i.cat===sqSelectedCat);
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  return pool.slice(0,n).map(i=>({name:i.name,url:i.url,hint:i.hint||''}));
}
function sqScrambleName(name){
  // Зайг ч оролцуулан бүх тэмдэгтийг холино (олон үгтэй нэрийг бүрэн бичих боломжтой байх)
  const letters=name.toUpperCase().split('');
  if(!letters.includes("'")) letters.push("'"); // Апостроф үргэлж боломжтой байлгана
  for(let i=letters.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[letters[i],letters[j]]=[letters[j],letters[i]];}
  return letters;
}
function sqNamesMatch(guess, correctName){
  const norm=s=>String(s||'').toLowerCase().trim().replace(/\s+/g,' ');
  return norm(guess)===norm(correctName);
}

// ── Хариулах хэсэг: БИЧИХ (input) БА ДАРАХ (үсэг) ХОЁУЛАА ЗЭРЭГ АЖИЛЛАНА ──
// submitFn(guessText), skipFn() — жинхэнэ функцийн reference дамжуулна (onclick string биш,
// тиймээс найдвартай, "гацдаг" эрсдэлгүй).
function sqRenderAnswerArea(containerId, item, submitFn, skipFn){
  const wrap=document.getElementById(containerId); if(!wrap)return;
  const scrambled=sqScrambleName(item.name);
  const dispLetter=l=>l===' '?'␣':l;
  const hintHtml=item.hint?`<div class="sq-hint-box">💡 ${escH(item.hint)}</div>`:'';
  wrap.innerHTML=`
    ${hintHtml}
    <input class="sq-type-inp" id="${containerId}Input" type="text" placeholder="Нэрийг бичих эсвэл доорх үсгэн дээр дарна уу..." autocomplete="off" autocapitalize="off" spellcheck="false">
    <div class="sq-scramble-wrap" id="${containerId}Letters"></div>
    <div class="sq-answer-btns">
      <button type="button" class="sq-type-submit-btn" id="${containerId}SubmitBtn">✓ Илгээх</button>
      <button type="button" class="sq-skip-btn" id="${containerId}SkipBtn">Алгасах →</button>
    </div>`;
  const lettersWrap=document.getElementById(containerId+'Letters');
  scrambled.forEach((l,i)=>{
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='sq-letter'+(l===' '?' sq-letter-space':'');
    btn.textContent=dispLetter(l);
    btn.addEventListener('click', ()=>{ inputEl.value+=l; inputEl.focus(); });
    lettersWrap.appendChild(btn);
  });
  const inputEl=document.getElementById(containerId+'Input');
  const submitBtn=document.getElementById(containerId+'SubmitBtn');
  const skipBtn=document.getElementById(containerId+'SkipBtn');
  let fired=false; // давхар илгээхээс сэргийлнэ
  const doSubmit=()=>{ if(fired)return; fired=true; submitFn(inputEl.value); };
  const doSkip=()=>{ if(fired)return; fired=true; skipFn(); };
  submitBtn.addEventListener('click', doSubmit);
  skipBtn.addEventListener('click', doSkip);
  inputEl.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); doSubmit(); } });
  setTimeout(()=>inputEl.focus(),150);
}

// ── SOLO ГОРИМ ──
let sqSoloItems=[], sqSoloIndex=0, sqSoloScore=0, sqSoloCorrectCount=0, sqSoloTotalTimeMs=0;
let sqSoloAnswered=false, sqSoloTimerInt=null, sqSoloStartedAt=0;
async function sqStartSolo(){
  if(!currentUser){openLogin();return;}
  if(!await hasActiveSubscription()){showSubRequired();return;}
  if(sqAllItems.length===0){notify('Одоохондоо хүн байхгүй байна.');return;}
  const items=sqPickRandomItems(sqSelectedCount);
  if(items.length===0){notify('Энэ ангилалд хүн алга.');return;}
  sqSoloItems=items; sqSoloIndex=0; sqSoloScore=0; sqSoloCorrectCount=0; sqSoloTotalTimeMs=0;
  setAllInactive();
  document.getElementById('sqSoloScreen').classList.add('active');
  document.getElementById('sqSoloFinal').style.display='none';
  sqSoloRenderQuestion();
}
function sqSoloRenderQuestion(){
  sqSoloAnswered=false;
  const item=sqSoloItems[sqSoloIndex];
  document.getElementById('sqSoloQNum').textContent=`${sqSoloIndex+1}/${sqSoloItems.length}`;
  document.getElementById('sqSoloPhoto').src=item.url;
  document.getElementById('sqSoloFeedback').style.display='none';
  document.getElementById('sqSoloAnswerArea').style.display='block';
  sqRenderAnswerArea('sqSoloAnswerArea', item, sqSoloFinish, ()=>sqSoloFinish(''));
  sqSoloStartedAt=Date.now();
  if(sqSoloTimerInt) clearInterval(sqSoloTimerInt);
  sqSoloTimerInt=setInterval(()=>{
    const el=document.getElementById('sqSoloTimer'); if(el) el.textContent=((Date.now()-sqSoloStartedAt)/1000).toFixed(1)+'с';
  },100);
}
function sqSoloFinish(guess){
  if(sqSoloAnswered) return;
  sqSoloAnswered=true;
  if(sqSoloTimerInt){clearInterval(sqSoloTimerInt);sqSoloTimerInt=null;}
  const item=sqSoloItems[sqSoloIndex];
  const elapsedMs=Date.now()-sqSoloStartedAt;
  const correct=guess && sqNamesMatch(guess, item.name);
  const pts=correct?Math.max(100,2000-Math.round(elapsedMs/50)):0;
  sqSoloScore+=pts; sqSoloTotalTimeMs+=elapsedMs;
  if(correct) sqSoloCorrectCount++;
  qrPlaySelectBlip();
  const fb=document.getElementById('sqSoloFeedback');
  document.getElementById('sqSoloAnswerArea').style.display='none';
  fb.style.display='block';
  fb.innerHTML=correct
    ?`<div class="qr-solo-feedback-icon">🎉</div><div class="qr-solo-feedback-txt correct">Зөв! ${(elapsedMs/1000).toFixed(1)}с — +${pts} оноо</div>`
    :`<div class="qr-solo-feedback-icon">😕</div><div class="qr-solo-feedback-txt wrong">Зөв хариулт: ${escH(item.name)}</div>`;
  setTimeout(()=>{
    sqSoloIndex++;
    if(sqSoloIndex<sqSoloItems.length) sqSoloRenderQuestion();
    else sqSoloShowFinal();
  },2200);
}
async function sqSoloShowFinal(){
  document.getElementById('sqSoloAnswerArea').style.display='none';
  document.getElementById('sqSoloFeedback').style.display='none';
  document.getElementById('sqSoloPhoto').src='';
  const total=sqSoloItems.length;
  const pct=Math.round(sqSoloCorrectCount/total*100);
  const fin=document.getElementById('sqSoloFinal');
  fin.style.display='block';
  fin.innerHTML=`
    <div style="font-size:60px;">${pct>=80?'🏆':pct>=50?'⭐':'💪'}</div>
    <div class="qr-solo-final-score">${sqSoloScore} оноо</div>
    <div class="qr-solo-final-pct">${sqSoloCorrectCount}/${total} зөв · нийт ${(sqSoloTotalTimeMs/1000).toFixed(1)}с</div>
    <div class="qr-solo-final-btns">
      <button onclick="sqStartSolo()">↻ Дахин тоглох</button>
      <button class="secondary" onclick="sqSoloExit()">Гарах</button>
    </div>`;
  try{
    const scoreId=`${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    const name=currentUser?(currentUser.displayName||currentUser.email.split('@')[0]):'Зочин';
    await setDoc(doc(fsdb,'star_scores',scoreId),{name,correct:sqSoloCorrectCount,total,totalSec:Math.round(sqSoloTotalTimeMs/100)/10,score:sqSoloScore,cat:sqSelectedCat==='__mixed__'?'Холимог':sqSelectedCat,ts:Date.now()});
  }catch(e){console.error('[SQ] score save err',e);}
}
function sqSoloExit(){
  if(sqSoloTimerInt){clearInterval(sqSoloTimerInt);sqSoloTimerInt=null;}
  showSQHome();
}
let sqScores=[];
async function sqLoadScores(){
  try{
    const q=query(collection(fsdb,'star_scores'),orderBy('correct','desc'),limit(100));
    const snap=await getDocs(q);
    sqScores=[]; snap.forEach(d=>sqScores.push({...d.data(),_id:d.id}));
  }catch(e){console.error('[SQ] load scores err',e); sqScores=[];}
  sqRenderLeaderboard();
}
function sqRenderLeaderboard(){
  const sorted=sqScores.slice().sort((a,b)=> b.correct-a.correct || a.totalSec-b.totalSec).slice(0,20);
  const tableEl=document.getElementById('sqLbTable'); if(!tableEl)return;
  if(!sorted.length){tableEl.innerHTML='<div class="mc-lb-empty">Бичлэг алга — эхлээд ганцаараа тоглоод үзээрэй!</div>';return;}
  let html=`<div class="mc-lb-row mc-lb-header"><div>#</div><div>Нэр</div><div>Зөв</div><div>Хугацаа</div><div></div></div>`;
  sorted.forEach((s,i)=>{
    const delBtn=isAdmin?`<button class="mc-lb-del" onclick="sqDelScore('${s._id}')">✕</button>`:'';
    html+=`<div class="mc-lb-row"><div class="mc-lb-rank">${i+1}</div><div class="mc-lb-name">${escH(s.name||'Тоглогч')}</div><div>${s.correct}/${s.total}</div><div>${(s.totalSec||0).toFixed(1)}с</div><div>${delBtn}</div></div>`;
  });
  tableEl.innerHTML=html;
}
async function sqDelScore(id){
  if(!isAdmin)return;
  try{ await deleteDoc(doc(fsdb,'star_scores',id)); sqScores=sqScores.filter(s=>s._id!==id); sqRenderLeaderboard(); }catch(e){notify('Устгахад алдаа гарлаа');}
}

// ── HOST ГОРИМ (олон тоглогч) ──
let sqSessionId=null, sqIsHost=false, sqCurSession=null, sqLastRenderedPhaseKey=null;
let sqUnsubSession=null, sqUnsubPlayers=null, sqUnsubAnswers=null;
let sqHostTimerInt=null, sqLastAnswerSnapCache=[], sqCurrentPlayerCount=0;
let sqSessionRetryCount=0, sqSessionRetryTimer=null, sqPlayersRetryCount=0, sqPlayersRetryTimer=null, sqAnswersRetryCount=0, sqAnswersRetryTimer=null;

async function sqHostStart(){
  if(!currentUser){openLogin();return;}
  if(!await hasActiveSubscription()){showSubRequired();return;}
  if(sqAllItems.length===0){notify('Одоохондоо хүн байхгүй байна.');return;}
  const items=sqPickRandomItems(sqSelectedCount);
  if(items.length===0){notify('Энэ ангилалд хүн алга.');return;}
  const code=await qrGenUniqueCode('star_sessions');
  const sid='sq'+Date.now();
  const sessionData={id:sid,code,hostId:currentUser.uid,category:sqSelectedCat==='__mixed__'?'Холимог':sqSelectedCat,items,phase:'lobby',qIndex:-1,totalQ:items.length,qStartedAt:0,standings:[],createdAt:Date.now()};
  try{
    await setDoc(doc(fsdb,'star_sessions',sid),sessionData);
    sqSessionId=sid; sqIsHost=true; sqCurSession=sessionData; sqLastRenderedPhaseKey=null;
    showSQLobby();
  }catch(e){console.error(e);notify('Сесс үүсгэхэд алдаа гарлаа');}
}
function showSQLobby(){
  setAllInactive();
  document.getElementById('sqHostLobbyScreen').classList.add('active');
  document.getElementById('sqLobbyInfo').textContent=`⭐ ${sqCurSession.category} · ${sqCurSession.totalQ} хүн`;
  document.getElementById('sqPinBox').textContent=sqCurSession.code;
  const joinUrl='https://bolorgames.com/?sjoin='+sqCurSession.code;
  document.getElementById('sqQrImg').src='https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data='+encodeURIComponent(joinUrl);
  sqHostSubscribeLobbyPlayers();
  sqHostSubscribeSession();
}
function sqHostSubscribeLobbyPlayers(){
  if(sqUnsubPlayers) sqUnsubPlayers();
  if(sqPlayersRetryTimer){clearTimeout(sqPlayersRetryTimer);sqPlayersRetryTimer=null;}
  const mySid=sqSessionId;
  sqUnsubPlayers=onSnapshot(collection(fsdb,'star_sessions',mySid,'players'), snap=>{
    sqPlayersRetryCount=0;
    const players=[]; snap.forEach(d=>players.push({id:d.id,...d.data()}));
    sqCurrentPlayerCount=players.length;
    const cntEl=document.getElementById('sqPlayerCount'); if(cntEl)cntEl.textContent=players.length;
    const list=document.getElementById('sqLobbyPlayers');
    if(list) list.innerHTML=players.map(p=>`<span class="qr-player-chip">${escH(p.name)}</span>`).join('');
    const startBtn=document.getElementById('sqStartBtn');
    if(startBtn){ startBtn.disabled=players.length===0; startBtn.textContent=players.length===0?'Тоглогч хүлээж байна…':`▶ Эхлүүлэх (${players.length})`; }
  }, err=>{
    console.error('[SQ] players listen err',err);
    if(sqSessionId!==mySid) return;
    sqPlayersRetryCount++;
    if(sqPlayersRetryCount<=8){ sqPlayersRetryTimer=setTimeout(()=>{ if(sqSessionId===mySid) sqHostSubscribeLobbyPlayers(); }, Math.min(1500*sqPlayersRetryCount,8000)); }
    else notify('Тоглогчидтой холбогдоход алдаа гарлаа. Хуудсаа шинэчилнэ үү.',6000);
  });
}
function sqHostSubscribeSession(){
  if(sqUnsubSession) sqUnsubSession();
  if(sqSessionRetryTimer){clearTimeout(sqSessionRetryTimer);sqSessionRetryTimer=null;}
  const mySid=sqSessionId;
  sqUnsubSession=onSnapshot(doc(fsdb,'star_sessions',mySid), snap=>{
    sqSessionRetryCount=0;
    if(!snap.exists())return;
    sqCurSession={id:snap.id,...snap.data()};
    if(sqIsHost) sqHostHandleSessionUpdate(sqCurSession);
    else sqPlayerHandleSessionUpdate(sqCurSession);
  }, err=>{
    console.error('[SQ] session listen err',err);
    if(sqSessionId!==mySid) return;
    sqSessionRetryCount++;
    if(sqSessionRetryCount===1) notify('Холболт тасарлаа, автоматаар дахин холбогдож байна…',4000);
    if(sqSessionRetryCount<=8){ sqSessionRetryTimer=setTimeout(()=>{ if(sqSessionId===mySid) sqHostSubscribeSession(); }, Math.min(1500*sqSessionRetryCount,8000)); }
    else notify('Холболт сэргээгдсэнгүй. Хуудсаа шинэчилнэ үү.',8000);
  });
}
function sqHostCancelSession(){
  if(!confirm('Тэмцээнийг цуцлах уу?'))return;
  if(sqSessionId){ setDoc(doc(fsdb,'star_sessions',sqSessionId),{phase:'cancelled'},{merge:true}).catch(()=>{}); }
  sqHostCleanupListeners();
  sqSessionId=null; sqIsHost=false; sqCurSession=null;
  showSQHome();
}
function sqHostCleanupListeners(){
  if(sqUnsubSession){sqUnsubSession();sqUnsubSession=null;}
  if(sqUnsubPlayers){sqUnsubPlayers();sqUnsubPlayers=null;}
  if(sqUnsubAnswers){sqUnsubAnswers();sqUnsubAnswers=null;}
  if(sqHostTimerInt){clearInterval(sqHostTimerInt);sqHostTimerInt=null;}
  if(sqSessionRetryTimer){clearTimeout(sqSessionRetryTimer);sqSessionRetryTimer=null;}
  if(sqPlayersRetryTimer){clearTimeout(sqPlayersRetryTimer);sqPlayersRetryTimer=null;}
  if(sqAnswersRetryTimer){clearTimeout(sqAnswersRetryTimer);sqAnswersRetryTimer=null;}
  sqCurrentPlayerCount=0;
}
async function sqHostBeginGame(){
  try{ await setDoc(doc(fsdb,'star_sessions',sqSessionId),{phase:'question',qIndex:0,qStartedAt:Date.now()},{merge:true}); }
  catch(e){console.error(e);notify('Эхлүүлэхэд алдаа гарлаа');}
}
function sqHostHandleSessionUpdate(session){
  if(!sqIsHost) return;
  const key=session.phase+':'+session.qIndex;
  if(session.phase==='question'){
    if(sqLastRenderedPhaseKey!==key){ setAllInactive(); document.getElementById('sqHostGameScreen').classList.add('active'); sqHostRenderQuestion(session); sqLastRenderedPhaseKey=key; }
  }else if(session.phase==='reveal'){
    if(sqLastRenderedPhaseKey!==key){ sqHostRenderReveal(session); sqLastRenderedPhaseKey=key; }
  }else if(session.phase==='ended'){
    if(sqLastRenderedPhaseKey!=='ended'){ sqHostRenderEnded(session); sqLastRenderedPhaseKey='ended'; }
  }
}
function sqHostRenderQuestion(session){
  const item=session.items[session.qIndex];
  document.getElementById('sqHostQNum').textContent=`${session.qIndex+1}-р хүн / ${session.totalQ}`;
  document.getElementById('sqHostPhoto').src=item.url;
  document.getElementById('sqHostHint').innerHTML=item.hint?`💡 ${escH(item.hint)}`:'';
  document.getElementById('sqHostActions').innerHTML=`<button onclick="sqHostReveal()">Хариу харуулах ⏹</button>`;
  document.getElementById('sqHostLeaderboard').style.display='none';
  if(sqHostTimerInt) clearInterval(sqHostTimerInt);
  const startedAt=session.qStartedAt;
  sqHostTimerInt=setInterval(()=>{
    const el=document.getElementById('sqHostTimer'); if(el) el.textContent=((Date.now()-startedAt)/1000).toFixed(1)+'с';
  },100);
  sqHostSubscribeAnswerCount(session.qIndex);
}
function sqHostSubscribeAnswerCount(qIndex){
  if(sqUnsubAnswers) sqUnsubAnswers();
  if(sqAnswersRetryTimer){clearTimeout(sqAnswersRetryTimer);sqAnswersRetryTimer=null;}
  const mySid=sqSessionId;
  let autoRevealed=false;
  sqUnsubAnswers=onSnapshot(query(collection(fsdb,'star_sessions',mySid,'answers'), where('qIndex','==',qIndex)), snap=>{
    sqAnswersRetryCount=0;
    const el=document.getElementById('sqHostAnsCount'); if(el)el.textContent=snap.size+' хариулсан';
    sqLastAnswerSnapCache=[]; snap.forEach(d=>sqLastAnswerSnapCache.push(d.data()));
    if(!autoRevealed && sqCurSession && sqCurSession.phase==='question' && sqCurSession.qIndex===qIndex
       && snap.size>0 && sqCurrentPlayerCount>0 && snap.size>=sqCurrentPlayerCount){
      autoRevealed=true; sqHostReveal();
    }
  }, err=>{
    console.error('[SQ] answers listen err',err);
    if(sqSessionId!==mySid) return;
    sqAnswersRetryCount++;
    if(sqAnswersRetryCount<=8){ sqAnswersRetryTimer=setTimeout(()=>{ if(sqSessionId===mySid) sqHostSubscribeAnswerCount(qIndex); }, Math.min(1500*sqAnswersRetryCount,8000)); }
    else notify('Хариултын мэдээлэл авахад алдаа гарлаа.',5000);
  });
}
function sqHostReveal(){
  if(sqHostTimerInt){clearInterval(sqHostTimerInt);sqHostTimerInt=null;}
  if(sqUnsubAnswers){sqUnsubAnswers();sqUnsubAnswers=null;}
  if(sqAnswersRetryTimer){clearTimeout(sqAnswersRetryTimer);sqAnswersRetryTimer=null;}
  sqHostComputeStandingsAndReveal();
}
async function sqHostComputeStandingsAndReveal(){
  try{
    const [playersSnap,answersSnap]=await withTimeout(Promise.all([
      getDocs(collection(fsdb,'star_sessions',sqSessionId,'players')),
      getDocs(collection(fsdb,'star_sessions',sqSessionId,'answers'))
    ]), 8000, 'sqRevealFetch');
    const totals={},names={},corrects={},times={};
    playersSnap.forEach(d=>{totals[d.id]=0;names[d.id]=d.data().name;corrects[d.id]=0;times[d.id]=0;});
    answersSnap.forEach(d=>{
      const a=d.data();
      totals[a.playerId]=(totals[a.playerId]||0)+(a.pts||0);
      times[a.playerId]=(times[a.playerId]||0)+(a.elapsedMs||0);
      if(!names[a.playerId])names[a.playerId]=a.playerName;
      if(a.correct){ corrects[a.playerId]=(corrects[a.playerId]||0)+1; }
    });
    const standings=Object.keys(totals).map(id=>({id,name:names[id]||'???',score:totals[id],correctCount:corrects[id]||0,totalTimeMs:times[id]||0}))
      .sort((a,b)=> b.correctCount-a.correctCount || a.totalTimeMs-b.totalTimeMs).slice(0,15);
    await withTimeout(setDoc(doc(fsdb,'star_sessions',sqSessionId),{phase:'reveal',standings},{merge:true}), 8000, 'sqRevealWrite');
  }catch(e){
    console.error(e);
    const msg=String(e&&e.message||'');
    notify(msg.includes('TIMEOUT')?'Сүлжээ удаан байна — «Хариу харуулах»-ыг дахин дарна уу.':'Алдаа гарлаа: '+String(e).slice(0,80), 6000);
  }
}
function sqHostRenderReveal(session){
  setAllInactive();
  document.getElementById('sqHostGameScreen').classList.add('active');
  qrPlayRevealFanfare();
  const item=session.items[session.qIndex];
  document.getElementById('sqHostQNum').innerHTML=`${session.qIndex+1}-р хүн — <span class="qr-correct-label">✓ ${escH(item.name)}</span>`;
  document.getElementById('sqHostPhoto').src=item.url;
  document.getElementById('sqHostHint').innerHTML='';
  const t=document.getElementById('sqHostTimer'); if(t) t.textContent='';
  document.getElementById('sqHostAnsCount').textContent=(sqLastAnswerSnapCache||[]).length+' хариулсан';
  const lb=document.getElementById('sqHostLeaderboard');
  lb.style.display='block';
  const totalQ=session.totalQ||1;
  lb.innerHTML='<div class="rounds-title" style="margin:20px 0 10px;">🏆 Тэргүүлэгчид</div>'+(session.standings||[]).slice(0,5).map((s,i)=>
    `<div class="qr-lb-row" style="animation-delay:${i*0.08}s"><span class="qr-lb-rank">${i+1}</span><span class="qr-lb-name">${escH(s.name)}<div class="qr-lb-detail">${s.correctCount}/${totalQ} зөв · ${(s.totalTimeMs/1000).toFixed(1)}с</div></span><span class="qr-lb-score">${s.score}</span></div>`
  ).join('');
  const isLast=session.qIndex>=session.totalQ-1;
  document.getElementById('sqHostActions').innerHTML=isLast?`<button onclick="sqHostEndGame()">🏁 Тэмцээн дуусгах</button>`:`<button onclick="sqHostNextQuestion()">Дараагийн хүн →</button>`;
}
async function sqHostNextQuestion(){
  const nextIdx=sqCurSession.qIndex+1;
  try{ await setDoc(doc(fsdb,'star_sessions',sqSessionId),{phase:'question',qIndex:nextIdx,qStartedAt:Date.now()},{merge:true}); }
  catch(e){console.error(e);notify('Алдаа гарлаа');}
}
async function sqHostEndGame(){
  try{ await setDoc(doc(fsdb,'star_sessions',sqSessionId),{phase:'ended'},{merge:true}); }
  catch(e){console.error(e);notify('Алдаа гарлаа');}
}
function sqHostRenderEnded(session){
  setAllInactive();
  document.getElementById('sqHostGameScreen').classList.add('active');
  document.getElementById('sqHostQNum').textContent='Тэмцээн дууслаа 🏁';
  document.getElementById('sqHostAnsCount').textContent='';
  document.getElementById('sqHostPhoto').src='';
  document.getElementById('sqHostHint').innerHTML='';
  const t=document.getElementById('sqHostTimer'); if(t) t.textContent='';
  const medals=['🥇','🥈','🥉'];
  const totalQ=session.totalQ||1;
  const lb=document.getElementById('sqHostLeaderboard');
  lb.style.display='block';
  lb.innerHTML='<div class="qr-podium-wrap"><div class="qr-podium-emoji">🎉</div></div>'+(session.standings||[]).slice(0,10).map((s,i)=>
    `<div class="qr-lb-row" style="animation-delay:${i*0.08}s"><span class="qr-lb-rank">${medals[i]||(i+1)}</span><span class="qr-lb-name">${escH(s.name)}<div class="qr-lb-detail">${s.correctCount}/${totalQ} зөв · ${(s.totalTimeMs/1000).toFixed(1)}с</div></span><span class="qr-lb-score">${s.score}</span></div>`
  ).join('');
  document.getElementById('sqHostActions').innerHTML=`<button onclick="sqHostFinishSession()">✓ Дуусгаад гарах</button>`;
}
function sqHostFinishSession(){
  sqHostCleanupListeners();
  sqSessionId=null; sqIsHost=false; sqCurSession=null; sqLastRenderedPhaseKey=null;
  showSQHome();
}

// ── ТОГЛОГЧ (join, play) ──
let sqPlayerId=null, sqPlayerName='', sqPlayerHasAnswered=false, sqPlayTimerInt=null, sqLastAnswerAttempt=null;
async function showSQJoin(prefillCode){
  setAllInactive();
  document.getElementById('sqJoinScreen').classList.add('active');
  document.getElementById('sqJoinErr').textContent='';
  document.getElementById('sqJoinCodeInp').value=prefillCode||'';
  document.getElementById('sqJoinNameInp').value=sqPlayerName||'';
  setTimeout(()=>{ const el=prefillCode?document.getElementById('sqJoinNameInp'):document.getElementById('sqJoinCodeInp'); if(el)el.focus(); },200);
}
async function sqDoJoin(){
  const code=document.getElementById('sqJoinCodeInp').value.trim();
  const name=document.getElementById('sqJoinNameInp').value.trim();
  const errEl=document.getElementById('sqJoinErr'); errEl.textContent='';
  if(!/^\d{6}$/.test(code)){errEl.textContent='6 оронтой код оруулна уу';return;}
  if(!name){errEl.textContent='Нэрээ оруулна уу';return;}
  if(name.length>20){errEl.textContent='Нэр 20 тэмдэгтээс ихгүй байх';return;}
  const btn=document.getElementById('sqJoinGoBtn');
  if(btn){ btn.disabled=true; btn.textContent='Холбогдож байна…'; }
  try{
    const snap=await withTimeout(getDocs(query(collection(fsdb,'star_sessions'), where('code','==',code))), 8000, 'sqFindSession');
    const candidates=[];
    const staleCutoff=Date.now()-12*60*60*1000;
    snap.forEach(d=>{ const data=d.data(); if(data.phase!=='ended'&&data.phase!=='cancelled' && (data.createdAt||0)>=staleCutoff) candidates.push({id:d.id,...data}); });
    candidates.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
    const found=candidates[0]||null;
    if(!found){errEl.textContent='Ийм код олдсонгүй эсвэл тэмцээн дууссан байна';return;}
    sqSessionId=found.id; sqCurSession=found; sqIsHost=false; sqPlayerName=name;
    sqPlayerId=localStorage.getItem('sq_pid_'+sqSessionId)||('p'+Date.now()+Math.random().toString(36).slice(2,8));
    localStorage.setItem('sq_pid_'+sqSessionId, sqPlayerId);
    await withTimeout(setDoc(doc(fsdb,'star_sessions',sqSessionId,'players',sqPlayerId),{name,joinedAt:Date.now()}), 8000, 'sqJoinWrite');
    sqPlayerHasAnswered=false; sqLastRenderedPhaseKey=null;
    showSQPlay();
  }catch(e){
    console.error(e);
    const msg=String(e&&e.message||'');
    errEl.textContent=msg.includes('TIMEOUT')?'Сүлжээ удаан байна. Дахин оролдоно уу.':'Холбогдоход алдаа гарлаа. Дахин оролдоно уу.';
  }finally{
    if(btn){ btn.disabled=false; btn.textContent='Нэгдэх →'; }
  }
}
function showSQPlay(){
  setAllInactive();
  document.getElementById('sqPlayScreen').classList.add('active');
  document.getElementById('sqPlayMyName').textContent=sqPlayerName;
  sqHostSubscribeSession();
}
function sqPlayerHandleSessionUpdate(session){
  if(sqIsHost) return;
  const key=session.phase+':'+session.qIndex;
  if(session.phase==='lobby'){
    sqHideAllPlaySubs(); document.getElementById('sqPlayWaiting').style.display='flex';
  }else if(session.phase==='question'){
    if(sqLastRenderedPhaseKey!==key){ sqPlayerHasAnswered=false; sqRenderPlayQuestion(session); sqLastRenderedPhaseKey=key; }
  }else if(session.phase==='reveal'){
    if(sqLastRenderedPhaseKey!==key){ sqRenderPlayReveal(session); sqLastRenderedPhaseKey=key; }
  }else if(session.phase==='ended'){
    sqRenderPlayFinal(session);
  }else if(session.phase==='cancelled'){
    sqRenderPlayCancelled();
  }
}
function sqHideAllPlaySubs(){
  ['sqPlayWaiting','sqPlayQuestion','sqPlaySubmitted','sqPlayReveal','sqPlayFinal'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.style.display='none';
  });
}
function sqRenderPlayQuestion(session){
  sqHideAllPlaySubs();
  document.getElementById('sqPlayQuestion').style.display='block';
  const item=session.items[session.qIndex];
  sqRenderAnswerArea('sqPlayAnswerArea', item, sqSubmitAnswer, sqSkipAnswer);
  if(sqPlayTimerInt) clearInterval(sqPlayTimerInt);
  const startedAt=session.qStartedAt;
  sqPlayTimerInt=setInterval(()=>{
    const el=document.getElementById('sqPlayTimer'); if(el) el.textContent=((Date.now()-startedAt)/1000).toFixed(1)+'с';
  },100);
}
function sqSkipAnswer(){ if(sqPlayerHasAnswered) return; sqSubmitAnswer(''); }
async function sqSubmitAnswer(guess){
  if(sqPlayerHasAnswered) return;
  sqPlayerHasAnswered=true;
  sqLastAnswerAttempt={guess};
  qrPlaySelectBlip();
  if(sqPlayTimerInt){clearInterval(sqPlayTimerInt);sqPlayTimerInt=null;}
  sqHideAllPlaySubs();
  document.getElementById('sqPlaySubmitted').style.display='flex';
  await sqDoSubmitAnswer(guess);
}
async function sqDoSubmitAnswer(guess){
  const txtEl=document.getElementById('sqSubmitTxt');
  const stuckBtn=document.getElementById('sqStuckBtn');
  if(txtEl) txtEl.textContent='Хариулт илгээгдлээ! Хүлээнэ үү…';
  if(stuckBtn) stuckBtn.style.display='none';
  const session=sqCurSession;
  const item=session.items[session.qIndex];
  if(!item)return;
  const answerId=session.qIndex+'_'+sqPlayerId;
  const elapsedMs=Date.now()-session.qStartedAt;
  const correct=guess && sqNamesMatch(guess, item.name);
  const pts=correct?Math.max(100,2000-Math.round(elapsedMs/50)):0;
  try{
    await withTimeout(
      setDoc(doc(fsdb,'star_sessions',sqSessionId,'answers',answerId),{playerId:sqPlayerId,playerName:sqPlayerName,qIndex:session.qIndex,guess,correct,elapsedMs,pts,at:Date.now()}),
      8000, 'sqSubmitAnswer'
    );
  }catch(e){
    console.error('[SQ] answer submit err',e);
    const msg=String(e&&e.code||e&&e.message||'');
    if(msg.includes('permission-denied')) return;
    if(txtEl) txtEl.textContent='Илгээхэд алдаа гарлаа. Сүлжээгээ шалгаад дахин оролдоно уу.';
    if(stuckBtn) stuckBtn.style.display='inline-block';
  }
}
function sqRetryLastAnswer(){
  if(!sqLastAnswerAttempt) return;
  const stuckBtn=document.getElementById('sqStuckBtn'); if(stuckBtn) stuckBtn.style.display='none';
  sqDoSubmitAnswer(sqLastAnswerAttempt.guess);
}
function sqRenderPlayReveal(session){
  sqHideAllPlaySubs();
  qrPlayRevealFanfare();
  const el=document.getElementById('sqPlayReveal'); el.style.display='block';
  const item=session.items[session.qIndex];
  const mine=(session.standings||[]).find(s=>s.id===sqPlayerId);
  const rank=mine?(session.standings.indexOf(mine)+1):null;
  el.innerHTML=`<div class="qr-play-reveal-icon">${mine&&rank===1?'🏆':'⭐'}</div><div class="qr-play-wait-txt" style="margin-bottom:6px;">Зөв хариулт: ${escH(item.name)}</div><div class="qr-play-reveal-pts">${mine?mine.score:0} оноо</div><div class="qr-play-reveal-detail">${mine?mine.correctCount:0}/${session.qIndex+1} зөв</div><div class="qr-play-reveal-rank">${rank?'Одоогийн байр: '+rank+' / '+session.standings.length:''}</div>`;
}
function sqRenderPlayFinal(session){
  sqHideAllPlaySubs();
  const el=document.getElementById('sqPlayFinal'); el.style.display='block';
  const mine=(session.standings||[]).find(s=>s.id===sqPlayerId);
  const rank=mine?session.standings.indexOf(mine)+1:'-';
  const medals={1:'🥇',2:'🥈',3:'🥉'};
  const totalQ=session.totalQ||1;
  el.innerHTML=`<div class="qr-play-final-rank">${medals[rank]||('#'+rank)}</div><div class="qr-play-wait-txt" style="margin-bottom:10px;">Тэмцээн дууслаа!</div><div class="qr-play-final-score">${mine?mine.score:0} оноо</div><div class="qr-play-final-detail">${mine?mine.correctCount:0}/${totalQ} зөв · ${mine?(mine.totalTimeMs/1000).toFixed(1):0}с</div><button class="qr-join-go-btn" style="margin-top:26px;" onclick="sqPlayerLeaveToHome()">Гарах</button>`;
}
function sqRenderPlayCancelled(){
  sqHideAllPlaySubs();
  const el=document.getElementById('sqPlayFinal'); el.style.display='block';
  el.innerHTML=`<div class="qr-play-final-rank">😕</div><div class="qr-play-wait-txt">Хост тэмцээнийг цуцалсан байна.</div><button class="qr-join-go-btn" style="margin-top:26px;" onclick="sqPlayerLeaveToHome()">Гарах</button>`;
}
function sqPlayerLeaveToHome(){
  sqHostCleanupListeners();
  sqSessionId=null; sqCurSession=null; sqPlayerHasAnswered=false; sqLastRenderedPhaseKey=null;
  showSQHome();
}

window.showSQHome=showSQHome;window.sqSetCat=sqSetCat;window.sqSetCount=sqSetCount;
window.sqStartSolo=sqStartSolo;window.sqSoloExit=sqSoloExit;
window.sqHostStart=sqHostStart;window.sqHostBeginGame=sqHostBeginGame;window.sqHostCancelSession=sqHostCancelSession;window.sqHostReveal=sqHostReveal;window.sqHostNextQuestion=sqHostNextQuestion;window.sqHostEndGame=sqHostEndGame;window.sqHostFinishSession=sqHostFinishSession;
window.showSQJoin=showSQJoin;window.sqDoJoin=sqDoJoin;window.sqRetryLastAnswer=sqRetryLastAnswer;window.sqPlayerLeaveToHome=sqPlayerLeaveToHome;
window.sqDelScore=sqDelScore;
window.showStarAdmin=showStarAdmin;window.saPreview=saPreview;window.saUpload=saUpload;window.saLoadItems=saLoadItems;window.saRenderList=saRenderList;window.saDelete=saDelete;
// ══════════════════════════════════════════════════════════════
// KIDS QUIZ — хаб (дэд тоглоомуудын жагсаалт)
// ══════════════════════════════════════════════════════════════
function showKidsHome(){
  setAllInactive();
  document.getElementById('kidsHomeScreen').classList.add('active');
  document.getElementById('navKZ').classList.add('active');
  activeGame='kz';
  kzBuildFloatingBG('kzFloatBg');
}
function kzBuildFloatingBG(wrapId){
  const wrap=document.getElementById(wrapId); if(!wrap||wrap.childElementCount)return;
  const icons=['🎈','⭐','🍎','🌈','🎨'];
  for(let i=0;i<10;i++){
    const s=document.createElement('div'); s.textContent=icons[i%icons.length];
    s.style.cssText=`position:absolute;top:${4+((i*37)%90)}%;left:${2+((i*53)%94)}%;font-size:${14+(i%4)*10}px;opacity:.15;animation:qrFloat ${9+(i%5)*1.8}s ease-in-out infinite;animation-delay:${i*0.7}s;`;
    wrap.appendChild(s);
  }
}

// ══════════════════════════════════════════════════════════════
// ХҮРД ЦЭЭЖЛЭХ (Multiplication Table) — StarQuiz-тэй ижил архитектур:
// зогсоогдоогүй, 0-с дээшээ явдаг цаг; зөв тоо (буурахаар), хугацаа (өсөхөөр)
// эрэмбэлэгддэг; бичих ба дарах хэрэггүй — зөвхөн тоо оруулдаг энгийн input.
// ══════════════════════════════════════════════════════════════
let multSelectedTable='__mixed__', multSelectedCount=10;
const MULT_DECOS=['🍎🍊🍓','🐻🐶🐱','🌟🎈🎨','🚗🚀🛸','🦄🐢🐸','⚽🏀🎾'];

function showMultHome(){
  setAllInactive();
  document.getElementById('multHomeScreen').classList.add('active');
  activeGame='mult';
  kzBuildFloatingBG('multFloatBg');
  multRenderTableGrid();
  const cntInp=document.getElementById('multCountInp'); if(cntInp) cntInp.value=multSelectedCount;
  multLoadScores();
}
function multRenderTableGrid(){
  const wrap=document.getElementById('multTableGrid'); if(!wrap)return;
  let html=`<button class="sq-cat-btn ${multSelectedTable==='__mixed__'?'active':''}" onclick="multSetTable('__mixed__')">🎲 Холимог</button>`;
  for(let t=2;t<=9;t++){
    html+=`<button class="sq-cat-btn ${multSelectedTable===t?'active':''}" onclick="multSetTable(${t})">${t}-ийн хүрд</button>`;
  }
  wrap.innerHTML=html;
}
function multSetTable(t){ multSelectedTable=t; multRenderTableGrid(); }
function multSetCount(v){
  const n=parseInt(v);
  multSelectedCount=(isNaN(n)||n<1)?1:Math.min(n,50);
}
function multGenerateProblems(n){
  const problems=[];
  for(let i=0;i<n;i++){
    const a = multSelectedTable==='__mixed__' ? (1+Math.floor(Math.random()*9)) : multSelectedTable;
    const b = 1+Math.floor(Math.random()*9);
    problems.push({a,b,answer:a*b,deco:MULT_DECOS[Math.floor(Math.random()*MULT_DECOS.length)]});
  }
  return problems;
}
function multAnswerMatch(guess, answer){
  const n=parseInt(String(guess||'').trim());
  return !isNaN(n) && n===answer;
}
// ── Хариулах хэсэг: зөвхөн тоо оруулдаг input (бичих+Enter, найдвартай) ──
function multRenderAnswerArea(containerId, submitFn, skipFn){
  const wrap=document.getElementById(containerId); if(!wrap)return;
  wrap.innerHTML=`
    <input class="sq-type-inp" id="${containerId}Input" type="number" inputmode="numeric" placeholder="Хариугаа бичнэ үү..." autocomplete="off">
    <div class="sq-answer-btns">
      <button type="button" class="sq-type-submit-btn" id="${containerId}SubmitBtn">✓ Илгээх</button>
      <button type="button" class="sq-skip-btn" id="${containerId}SkipBtn">Алгасах →</button>
    </div>`;
  const inputEl=document.getElementById(containerId+'Input');
  const submitBtn=document.getElementById(containerId+'SubmitBtn');
  const skipBtn=document.getElementById(containerId+'SkipBtn');
  let fired=false;
  const doSubmit=()=>{ if(fired)return; fired=true; submitFn(inputEl.value); };
  const doSkip=()=>{ if(fired)return; fired=true; skipFn(); };
  submitBtn.addEventListener('click', doSubmit);
  skipBtn.addEventListener('click', doSkip);
  inputEl.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); doSubmit(); } });
  setTimeout(()=>inputEl.focus(),150);
}

// ── SOLO ГОРИМ ──
let multSoloItems=[], multSoloIndex=0, multSoloScore=0, multSoloCorrectCount=0, multSoloTotalTimeMs=0;
let multSoloAnswered=false, multSoloTimerInt=null, multSoloStartedAt=0;
async function multStartSolo(){
  if(!currentUser){openLogin();return;}
  if(!await hasActiveSubscription()){showSubRequired();return;}
  const items=multGenerateProblems(multSelectedCount);
  multSoloItems=items; multSoloIndex=0; multSoloScore=0; multSoloCorrectCount=0; multSoloTotalTimeMs=0;
  setAllInactive();
  document.getElementById('multSoloScreen').classList.add('active');
  document.getElementById('multSoloFinal').style.display='none';
  multSoloRenderQuestion();
}
function multSoloRenderQuestion(){
  multSoloAnswered=false;
  const item=multSoloItems[multSoloIndex];
  document.getElementById('multSoloQNum').textContent=`${multSoloIndex+1}/${multSoloItems.length}`;
  document.getElementById('multSoloProblem').textContent=`${item.a} × ${item.b} = ?`;
  document.getElementById('multSoloDeco').textContent=item.deco;
  document.getElementById('multSoloFeedback').style.display='none';
  document.getElementById('multSoloAnswerArea').style.display='block';
  multRenderAnswerArea('multSoloAnswerArea', multSoloFinish, ()=>multSoloFinish(''));
  multSoloStartedAt=Date.now();
  if(multSoloTimerInt) clearInterval(multSoloTimerInt);
  multSoloTimerInt=setInterval(()=>{
    const el=document.getElementById('multSoloTimer'); if(el) el.textContent=((Date.now()-multSoloStartedAt)/1000).toFixed(1)+'с';
  },100);
}
function multSoloFinish(guess){
  if(multSoloAnswered) return;
  multSoloAnswered=true;
  if(multSoloTimerInt){clearInterval(multSoloTimerInt);multSoloTimerInt=null;}
  const item=multSoloItems[multSoloIndex];
  const elapsedMs=Date.now()-multSoloStartedAt;
  const correct=guess!=='' && multAnswerMatch(guess, item.answer);
  const pts=correct?Math.max(100,2000-Math.round(elapsedMs/50)):0;
  multSoloScore+=pts; multSoloTotalTimeMs+=elapsedMs;
  if(correct) multSoloCorrectCount++;
  qrPlaySelectBlip();
  const fb=document.getElementById('multSoloFeedback');
  document.getElementById('multSoloAnswerArea').style.display='none';
  fb.style.display='block';
  fb.innerHTML=correct
    ?`<div class="qr-solo-feedback-icon">🎉</div><div class="qr-solo-feedback-txt correct">Зөв! ${(elapsedMs/1000).toFixed(1)}с — +${pts} оноо</div>`
    :`<div class="qr-solo-feedback-icon">😕</div><div class="qr-solo-feedback-txt wrong">Зөв хариулт: ${item.a} × ${item.b} = ${item.answer}</div>`;
  setTimeout(()=>{
    multSoloIndex++;
    if(multSoloIndex<multSoloItems.length) multSoloRenderQuestion();
    else multSoloShowFinal();
  },2000);
}
async function multSoloShowFinal(){
  document.getElementById('multSoloAnswerArea').style.display='none';
  document.getElementById('multSoloFeedback').style.display='none';
  document.getElementById('multSoloProblem').textContent='';
  document.getElementById('multSoloDeco').textContent='🎉';
  const total=multSoloItems.length;
  const pct=Math.round(multSoloCorrectCount/total*100);
  const fin=document.getElementById('multSoloFinal');
  fin.style.display='block';
  fin.innerHTML=`
    <div style="font-size:60px;">${pct>=80?'🏆':pct>=50?'⭐':'💪'}</div>
    <div class="qr-solo-final-score">${multSoloScore} оноо</div>
    <div class="qr-solo-final-pct">${multSoloCorrectCount}/${total} зөв · нийт ${(multSoloTotalTimeMs/1000).toFixed(1)}с</div>
    <div class="qr-solo-final-btns">
      <button onclick="multStartSolo()">↻ Дахин тоглох</button>
      <button class="secondary" onclick="multSoloExit()">Гарах</button>
    </div>`;
  try{
    const scoreId=`${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    const name=currentUser?(currentUser.displayName||currentUser.email.split('@')[0]):'Зочин';
    await setDoc(doc(fsdb,'mult_scores',scoreId),{name,correct:multSoloCorrectCount,total,totalSec:Math.round(multSoloTotalTimeMs/100)/10,score:multSoloScore,table:multSelectedTable==='__mixed__'?'Холимог':multSelectedTable+'-ийн хүрд',ts:Date.now()});
  }catch(e){console.error('[MULT] score save err',e);}
}
function multSoloExit(){
  if(multSoloTimerInt){clearInterval(multSoloTimerInt);multSoloTimerInt=null;}
  showMultHome();
}
let multScores=[];
async function multLoadScores(){
  try{
    const q=query(collection(fsdb,'mult_scores'),orderBy('correct','desc'),limit(100));
    const snap=await getDocs(q);
    multScores=[]; snap.forEach(d=>multScores.push({...d.data(),_id:d.id}));
  }catch(e){console.error('[MULT] load scores err',e); multScores=[];}
  multRenderLeaderboard();
}
function multRenderLeaderboard(){
  const sorted=multScores.slice().sort((a,b)=> b.correct-a.correct || a.totalSec-b.totalSec).slice(0,20);
  const tableEl=document.getElementById('multLbTable'); if(!tableEl)return;
  if(!sorted.length){tableEl.innerHTML='<div class="mc-lb-empty">Бичлэг алга — эхлээд ганцаараа тоглоод үзээрэй!</div>';return;}
  let html=`<div class="mc-lb-row mc-lb-header"><div>#</div><div>Нэр</div><div>Зөв</div><div>Хугацаа</div><div></div></div>`;
  sorted.forEach((s,i)=>{
    const delBtn=isAdmin?`<button class="mc-lb-del" onclick="multDelScore('${s._id}')">✕</button>`:'';
    html+=`<div class="mc-lb-row"><div class="mc-lb-rank">${i+1}</div><div class="mc-lb-name">${escH(s.name||'Тоглогч')}</div><div>${s.correct}/${s.total}</div><div>${(s.totalSec||0).toFixed(1)}с</div><div>${delBtn}</div></div>`;
  });
  tableEl.innerHTML=html;
}
async function multDelScore(id){
  if(!isAdmin)return;
  try{ await deleteDoc(doc(fsdb,'mult_scores',id)); multScores=multScores.filter(s=>s._id!==id); multRenderLeaderboard(); }catch(e){notify('Устгахад алдаа гарлаа');}
}

// ── HOST ГОРИМ (олон тоглогч) ──
let multSessionId=null, multIsHost=false, multCurSession=null, multLastRenderedPhaseKey=null;
let multUnsubSession=null, multUnsubPlayers=null, multUnsubAnswers=null;
let multHostTimerInt=null, multLastAnswerSnapCache=[], multCurrentPlayerCount=0;
let multSessionRetryCount=0, multSessionRetryTimer=null, multPlayersRetryCount=0, multPlayersRetryTimer=null, multAnswersRetryCount=0, multAnswersRetryTimer=null;

async function multHostStart(){
  if(!currentUser){openLogin();return;}
  if(!await hasActiveSubscription()){showSubRequired();return;}
  const items=multGenerateProblems(multSelectedCount);
  const code=await qrGenUniqueCode('mult_sessions');
  const sid='mt'+Date.now();
  const sessionData={id:sid,code,hostId:currentUser.uid,table:multSelectedTable==='__mixed__'?'Холимог':multSelectedTable+'-ийн хүрд',items,phase:'lobby',qIndex:-1,totalQ:items.length,qStartedAt:0,standings:[],createdAt:Date.now()};
  try{
    await setDoc(doc(fsdb,'mult_sessions',sid),sessionData);
    multSessionId=sid; multIsHost=true; multCurSession=sessionData; multLastRenderedPhaseKey=null;
    showMultLobby();
  }catch(e){console.error(e);notify('Сесс үүсгэхэд алдаа гарлаа');}
}
function showMultLobby(){
  setAllInactive();
  document.getElementById('multHostLobbyScreen').classList.add('active');
  document.getElementById('multLobbyInfo').textContent=`🔢 ${multCurSession.table} · ${multCurSession.totalQ} бодлого`;
  document.getElementById('multPinBox').textContent=multCurSession.code;
  const joinUrl='https://bolorgames.com/?mjoin='+multCurSession.code;
  document.getElementById('multQrImg').src='https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data='+encodeURIComponent(joinUrl);
  multHostSubscribeLobbyPlayers();
  multHostSubscribeSession();
}
function multHostSubscribeLobbyPlayers(){
  if(multUnsubPlayers) multUnsubPlayers();
  if(multPlayersRetryTimer){clearTimeout(multPlayersRetryTimer);multPlayersRetryTimer=null;}
  const mySid=multSessionId;
  multUnsubPlayers=onSnapshot(collection(fsdb,'mult_sessions',mySid,'players'), snap=>{
    multPlayersRetryCount=0;
    const players=[]; snap.forEach(d=>players.push({id:d.id,...d.data()}));
    multCurrentPlayerCount=players.length;
    const cntEl=document.getElementById('multPlayerCount'); if(cntEl)cntEl.textContent=players.length;
    const list=document.getElementById('multLobbyPlayers');
    if(list) list.innerHTML=players.map(p=>`<span class="qr-player-chip">${escH(p.name)}</span>`).join('');
    const startBtn=document.getElementById('multStartBtn');
    if(startBtn){ startBtn.disabled=players.length===0; startBtn.textContent=players.length===0?'Тоглогч хүлээж байна…':`▶ Эхлүүлэх (${players.length})`; }
  }, err=>{
    console.error('[MULT] players listen err',err);
    if(multSessionId!==mySid) return;
    multPlayersRetryCount++;
    if(multPlayersRetryCount<=8){ multPlayersRetryTimer=setTimeout(()=>{ if(multSessionId===mySid) multHostSubscribeLobbyPlayers(); }, Math.min(1500*multPlayersRetryCount,8000)); }
    else notify('Тоглогчидтой холбогдоход алдаа гарлаа. Хуудсаа шинэчилнэ үү.',6000);
  });
}
function multHostSubscribeSession(){
  if(multUnsubSession) multUnsubSession();
  if(multSessionRetryTimer){clearTimeout(multSessionRetryTimer);multSessionRetryTimer=null;}
  const mySid=multSessionId;
  multUnsubSession=onSnapshot(doc(fsdb,'mult_sessions',mySid), snap=>{
    multSessionRetryCount=0;
    if(!snap.exists())return;
    multCurSession={id:snap.id,...snap.data()};
    if(multIsHost) multHostHandleSessionUpdate(multCurSession);
    else multPlayerHandleSessionUpdate(multCurSession);
  }, err=>{
    console.error('[MULT] session listen err',err);
    if(multSessionId!==mySid) return;
    multSessionRetryCount++;
    if(multSessionRetryCount===1) notify('Холболт тасарлаа, автоматаар дахин холбогдож байна…',4000);
    if(multSessionRetryCount<=8){ multSessionRetryTimer=setTimeout(()=>{ if(multSessionId===mySid) multHostSubscribeSession(); }, Math.min(1500*multSessionRetryCount,8000)); }
    else notify('Холболт сэргээгдсэнгүй. Хуудсаа шинэчилнэ үү.',8000);
  });
}
function multHostCancelSession(){
  if(!confirm('Тэмцээнийг цуцлах уу?'))return;
  if(multSessionId){ setDoc(doc(fsdb,'mult_sessions',multSessionId),{phase:'cancelled'},{merge:true}).catch(()=>{}); }
  multHostCleanupListeners();
  multSessionId=null; multIsHost=false; multCurSession=null;
  showMultHome();
}
function multHostCleanupListeners(){
  if(multUnsubSession){multUnsubSession();multUnsubSession=null;}
  if(multUnsubPlayers){multUnsubPlayers();multUnsubPlayers=null;}
  if(multUnsubAnswers){multUnsubAnswers();multUnsubAnswers=null;}
  if(multHostTimerInt){clearInterval(multHostTimerInt);multHostTimerInt=null;}
  if(multSessionRetryTimer){clearTimeout(multSessionRetryTimer);multSessionRetryTimer=null;}
  if(multPlayersRetryTimer){clearTimeout(multPlayersRetryTimer);multPlayersRetryTimer=null;}
  if(multAnswersRetryTimer){clearTimeout(multAnswersRetryTimer);multAnswersRetryTimer=null;}
  multCurrentPlayerCount=0;
}
async function multHostBeginGame(){
  try{ await setDoc(doc(fsdb,'mult_sessions',multSessionId),{phase:'question',qIndex:0,qStartedAt:Date.now()},{merge:true}); }
  catch(e){console.error(e);notify('Эхлүүлэхэд алдаа гарлаа');}
}
function multHostHandleSessionUpdate(session){
  if(!multIsHost) return;
  const key=session.phase+':'+session.qIndex;
  if(session.phase==='question'){
    if(multLastRenderedPhaseKey!==key){ setAllInactive(); document.getElementById('multHostGameScreen').classList.add('active'); multHostRenderQuestion(session); multLastRenderedPhaseKey=key; }
  }else if(session.phase==='reveal'){
    if(multLastRenderedPhaseKey!==key){ multHostRenderReveal(session); multLastRenderedPhaseKey=key; }
  }else if(session.phase==='ended'){
    if(multLastRenderedPhaseKey!=='ended'){ multHostRenderEnded(session); multLastRenderedPhaseKey='ended'; }
  }
}
function multHostRenderQuestion(session){
  const item=session.items[session.qIndex];
  document.getElementById('multHostQNum').textContent=`Бодлого ${session.qIndex+1} / ${session.totalQ}`;
  document.getElementById('multHostProblem').textContent=`${item.a} × ${item.b} = ?`;
  document.getElementById('multHostDeco').textContent=item.deco;
  document.getElementById('multHostActions').innerHTML=`<button onclick="multHostReveal()">Хариу харуулах ⏹</button>`;
  document.getElementById('multHostLeaderboard').style.display='none';
  if(multHostTimerInt) clearInterval(multHostTimerInt);
  const startedAt=session.qStartedAt;
  multHostTimerInt=setInterval(()=>{
    const el=document.getElementById('multHostTimer'); if(el) el.textContent=((Date.now()-startedAt)/1000).toFixed(1)+'с';
  },100);
  multHostSubscribeAnswerCount(session.qIndex);
}
function multHostSubscribeAnswerCount(qIndex){
  if(multUnsubAnswers) multUnsubAnswers();
  if(multAnswersRetryTimer){clearTimeout(multAnswersRetryTimer);multAnswersRetryTimer=null;}
  const mySid=multSessionId;
  let autoRevealed=false;
  multUnsubAnswers=onSnapshot(query(collection(fsdb,'mult_sessions',mySid,'answers'), where('qIndex','==',qIndex)), snap=>{
    multAnswersRetryCount=0;
    const el=document.getElementById('multHostAnsCount'); if(el)el.textContent=snap.size+' хариулсан';
    multLastAnswerSnapCache=[]; snap.forEach(d=>multLastAnswerSnapCache.push(d.data()));
    if(!autoRevealed && multCurSession && multCurSession.phase==='question' && multCurSession.qIndex===qIndex
       && snap.size>0 && multCurrentPlayerCount>0 && snap.size>=multCurrentPlayerCount){
      autoRevealed=true; multHostReveal();
    }
  }, err=>{
    console.error('[MULT] answers listen err',err);
    if(multSessionId!==mySid) return;
    multAnswersRetryCount++;
    if(multAnswersRetryCount<=8){ multAnswersRetryTimer=setTimeout(()=>{ if(multSessionId===mySid) multHostSubscribeAnswerCount(qIndex); }, Math.min(1500*multAnswersRetryCount,8000)); }
    else notify('Хариултын мэдээлэл авахад алдаа гарлаа.',5000);
  });
}
function multHostReveal(){
  if(multHostTimerInt){clearInterval(multHostTimerInt);multHostTimerInt=null;}
  if(multUnsubAnswers){multUnsubAnswers();multUnsubAnswers=null;}
  if(multAnswersRetryTimer){clearTimeout(multAnswersRetryTimer);multAnswersRetryTimer=null;}
  multHostComputeStandingsAndReveal();
}
async function multHostComputeStandingsAndReveal(){
  try{
    const [playersSnap,answersSnap]=await withTimeout(Promise.all([
      getDocs(collection(fsdb,'mult_sessions',multSessionId,'players')),
      getDocs(collection(fsdb,'mult_sessions',multSessionId,'answers'))
    ]), 8000, 'multRevealFetch');
    const totals={},names={},corrects={},times={};
    playersSnap.forEach(d=>{totals[d.id]=0;names[d.id]=d.data().name;corrects[d.id]=0;times[d.id]=0;});
    answersSnap.forEach(d=>{
      const a=d.data();
      totals[a.playerId]=(totals[a.playerId]||0)+(a.pts||0);
      times[a.playerId]=(times[a.playerId]||0)+(a.elapsedMs||0);
      if(!names[a.playerId])names[a.playerId]=a.playerName;
      if(a.correct){ corrects[a.playerId]=(corrects[a.playerId]||0)+1; }
    });
    const standings=Object.keys(totals).map(id=>({id,name:names[id]||'???',score:totals[id],correctCount:corrects[id]||0,totalTimeMs:times[id]||0}))
      .sort((a,b)=> b.correctCount-a.correctCount || a.totalTimeMs-b.totalTimeMs).slice(0,15);
    await withTimeout(setDoc(doc(fsdb,'mult_sessions',multSessionId),{phase:'reveal',standings},{merge:true}), 8000, 'multRevealWrite');
  }catch(e){
    console.error(e);
    const msg=String(e&&e.message||'');
    notify(msg.includes('TIMEOUT')?'Сүлжээ удаан байна — «Хариу харуулах»-ыг дахин дарна уу.':'Алдаа гарлаа: '+String(e).slice(0,80), 6000);
  }
}
function multHostRenderReveal(session){
  setAllInactive();
  document.getElementById('multHostGameScreen').classList.add('active');
  qrPlayRevealFanfare();
  const item=session.items[session.qIndex];
  document.getElementById('multHostQNum').innerHTML=`Бодлого ${session.qIndex+1} — <span class="qr-correct-label">✓ ${item.a}×${item.b}=${item.answer}</span>`;
  document.getElementById('multHostProblem').textContent=`${item.a} × ${item.b} = ${item.answer}`;
  const t=document.getElementById('multHostTimer'); if(t) t.textContent='';
  document.getElementById('multHostAnsCount').textContent=(multLastAnswerSnapCache||[]).length+' хариулсан';
  const lb=document.getElementById('multHostLeaderboard');
  lb.style.display='block';
  const totalQ=session.totalQ||1;
  lb.innerHTML='<div class="rounds-title" style="margin:20px 0 10px;">🏆 Тэргүүлэгчид</div>'+(session.standings||[]).slice(0,5).map((s,i)=>
    `<div class="qr-lb-row" style="animation-delay:${i*0.08}s"><span class="qr-lb-rank">${i+1}</span><span class="qr-lb-name">${escH(s.name)}<div class="qr-lb-detail">${s.correctCount}/${totalQ} зөв · ${(s.totalTimeMs/1000).toFixed(1)}с</div></span><span class="qr-lb-score">${s.score}</span></div>`
  ).join('');
  const isLast=session.qIndex>=session.totalQ-1;
  document.getElementById('multHostActions').innerHTML=isLast?`<button onclick="multHostEndGame()">🏁 Тэмцээн дуусгах</button>`:`<button onclick="multHostNextQuestion()">Дараагийн бодлого →</button>`;
}
async function multHostNextQuestion(){
  const nextIdx=multCurSession.qIndex+1;
  try{ await setDoc(doc(fsdb,'mult_sessions',multSessionId),{phase:'question',qIndex:nextIdx,qStartedAt:Date.now()},{merge:true}); }
  catch(e){console.error(e);notify('Алдаа гарлаа');}
}
async function multHostEndGame(){
  try{ await setDoc(doc(fsdb,'mult_sessions',multSessionId),{phase:'ended'},{merge:true}); }
  catch(e){console.error(e);notify('Алдаа гарлаа');}
}
function multHostRenderEnded(session){
  setAllInactive();
  document.getElementById('multHostGameScreen').classList.add('active');
  document.getElementById('multHostQNum').textContent='Тэмцээн дууслаа 🏁';
  document.getElementById('multHostAnsCount').textContent='';
  document.getElementById('multHostProblem').textContent='🎉';
  document.getElementById('multHostDeco').textContent='';
  const t=document.getElementById('multHostTimer'); if(t) t.textContent='';
  const medals=['🥇','🥈','🥉'];
  const totalQ=session.totalQ||1;
  const lb=document.getElementById('multHostLeaderboard');
  lb.style.display='block';
  lb.innerHTML='<div class="qr-podium-wrap"><div class="qr-podium-emoji">🎉</div></div>'+(session.standings||[]).slice(0,10).map((s,i)=>
    `<div class="qr-lb-row" style="animation-delay:${i*0.08}s"><span class="qr-lb-rank">${medals[i]||(i+1)}</span><span class="qr-lb-name">${escH(s.name)}<div class="qr-lb-detail">${s.correctCount}/${totalQ} зөв · ${(s.totalTimeMs/1000).toFixed(1)}с</div></span><span class="qr-lb-score">${s.score}</span></div>`
  ).join('');
  document.getElementById('multHostActions').innerHTML=`<button onclick="multHostFinishSession()">✓ Дуусгаад гарах</button>`;
}
function multHostFinishSession(){
  multHostCleanupListeners();
  multSessionId=null; multIsHost=false; multCurSession=null; multLastRenderedPhaseKey=null;
  showMultHome();
}

// ── ТОГЛОГЧ (join, play) ──
let multPlayerId=null, multPlayerName='', multPlayerHasAnswered=false, multPlayTimerInt=null, multLastAnswerAttempt=null;
async function showMultJoin(prefillCode){
  setAllInactive();
  document.getElementById('multJoinScreen').classList.add('active');
  document.getElementById('multJoinErr').textContent='';
  document.getElementById('multJoinCodeInp').value=prefillCode||'';
  document.getElementById('multJoinNameInp').value=multPlayerName||'';
  setTimeout(()=>{ const el=prefillCode?document.getElementById('multJoinNameInp'):document.getElementById('multJoinCodeInp'); if(el)el.focus(); },200);
}
async function multDoJoin(){
  const code=document.getElementById('multJoinCodeInp').value.trim();
  const name=document.getElementById('multJoinNameInp').value.trim();
  const errEl=document.getElementById('multJoinErr'); errEl.textContent='';
  if(!/^\d{6}$/.test(code)){errEl.textContent='6 оронтой код оруулна уу';return;}
  if(!name){errEl.textContent='Нэрээ оруулна уу';return;}
  if(name.length>20){errEl.textContent='Нэр 20 тэмдэгтээс ихгүй байх';return;}
  const btn=document.getElementById('multJoinGoBtn');
  if(btn){ btn.disabled=true; btn.textContent='Холбогдож байна…'; }
  try{
    const snap=await withTimeout(getDocs(query(collection(fsdb,'mult_sessions'), where('code','==',code))), 8000, 'multFindSession');
    const candidates=[];
    const staleCutoff=Date.now()-12*60*60*1000;
    snap.forEach(d=>{ const data=d.data(); if(data.phase!=='ended'&&data.phase!=='cancelled' && (data.createdAt||0)>=staleCutoff) candidates.push({id:d.id,...data}); });
    candidates.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
    const found=candidates[0]||null;
    if(!found){errEl.textContent='Ийм код олдсонгүй эсвэл тэмцээн дууссан байна';return;}
    multSessionId=found.id; multCurSession=found; multIsHost=false; multPlayerName=name;
    multPlayerId=localStorage.getItem('mt_pid_'+multSessionId)||('p'+Date.now()+Math.random().toString(36).slice(2,8));
    localStorage.setItem('mt_pid_'+multSessionId, multPlayerId);
    await withTimeout(setDoc(doc(fsdb,'mult_sessions',multSessionId,'players',multPlayerId),{name,joinedAt:Date.now()}), 8000, 'multJoinWrite');
    multPlayerHasAnswered=false; multLastRenderedPhaseKey=null;
    showMultPlay();
  }catch(e){
    console.error(e);
    const msg=String(e&&e.message||'');
    errEl.textContent=msg.includes('TIMEOUT')?'Сүлжээ удаан байна. Дахин оролдоно уу.':'Холбогдоход алдаа гарлаа. Дахин оролдоно уу.';
  }finally{
    if(btn){ btn.disabled=false; btn.textContent='Нэгдэх →'; }
  }
}
function showMultPlay(){
  setAllInactive();
  document.getElementById('multPlayScreen').classList.add('active');
  document.getElementById('multPlayMyName').textContent=multPlayerName;
  multHostSubscribeSession();
}
function multPlayerHandleSessionUpdate(session){
  if(multIsHost) return;
  const key=session.phase+':'+session.qIndex;
  if(session.phase==='lobby'){
    multHideAllPlaySubs(); document.getElementById('multPlayWaiting').style.display='flex';
  }else if(session.phase==='question'){
    if(multLastRenderedPhaseKey!==key){ multPlayerHasAnswered=false; multRenderPlayQuestion(session); multLastRenderedPhaseKey=key; }
  }else if(session.phase==='reveal'){
    if(multLastRenderedPhaseKey!==key){ multRenderPlayReveal(session); multLastRenderedPhaseKey=key; }
  }else if(session.phase==='ended'){
    multRenderPlayFinal(session);
  }else if(session.phase==='cancelled'){
    multRenderPlayCancelled();
  }
}
function multHideAllPlaySubs(){
  ['multPlayWaiting','multPlayQuestion','multPlaySubmitted','multPlayReveal','multPlayFinal'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.style.display='none';
  });
}
function multRenderPlayQuestion(session){
  multHideAllPlaySubs();
  document.getElementById('multPlayQuestion').style.display='block';
  const item=session.items[session.qIndex];
  document.getElementById('multPlayProblem').textContent=`${item.a} × ${item.b} = ?`;
  document.getElementById('multPlayDeco').textContent=item.deco;
  multRenderAnswerArea('multPlayAnswerArea', multSubmitAnswer, multSkipAnswer);
  if(multPlayTimerInt) clearInterval(multPlayTimerInt);
  const startedAt=session.qStartedAt;
  multPlayTimerInt=setInterval(()=>{
    const el=document.getElementById('multPlayTimer'); if(el) el.textContent=((Date.now()-startedAt)/1000).toFixed(1)+'с';
  },100);
}
function multSkipAnswer(){ if(multPlayerHasAnswered) return; multSubmitAnswer(''); }
async function multSubmitAnswer(guess){
  if(multPlayerHasAnswered) return;
  multPlayerHasAnswered=true;
  multLastAnswerAttempt={guess};
  qrPlaySelectBlip();
  if(multPlayTimerInt){clearInterval(multPlayTimerInt);multPlayTimerInt=null;}
  multHideAllPlaySubs();
  document.getElementById('multPlaySubmitted').style.display='flex';
  await multDoSubmitAnswer(guess);
}
async function multDoSubmitAnswer(guess){
  const txtEl=document.getElementById('multSubmitTxt');
  const stuckBtn=document.getElementById('multStuckBtn');
  if(txtEl) txtEl.textContent='Хариулт илгээгдлээ! Хүлээнэ үү…';
  if(stuckBtn) stuckBtn.style.display='none';
  const session=multCurSession;
  const item=session.items[session.qIndex];
  if(!item)return;
  const answerId=session.qIndex+'_'+multPlayerId;
  const elapsedMs=Date.now()-session.qStartedAt;
  const correct=guess!=='' && multAnswerMatch(guess, item.answer);
  const pts=correct?Math.max(100,2000-Math.round(elapsedMs/50)):0;
  try{
    await withTimeout(
      setDoc(doc(fsdb,'mult_sessions',multSessionId,'answers',answerId),{playerId:multPlayerId,playerName:multPlayerName,qIndex:session.qIndex,guess,correct,elapsedMs,pts,at:Date.now()}),
      8000, 'multSubmitAnswer'
    );
  }catch(e){
    console.error('[MULT] answer submit err',e);
    const msg=String(e&&e.code||e&&e.message||'');
    if(msg.includes('permission-denied')) return;
    if(txtEl) txtEl.textContent='Илгээхэд алдаа гарлаа. Сүлжээгээ шалгаад дахин оролдоно уу.';
    if(stuckBtn) stuckBtn.style.display='inline-block';
  }
}
function multRetryLastAnswer(){
  if(!multLastAnswerAttempt) return;
  const stuckBtn=document.getElementById('multStuckBtn'); if(stuckBtn) stuckBtn.style.display='none';
  multDoSubmitAnswer(multLastAnswerAttempt.guess);
}
function multRenderPlayReveal(session){
  multHideAllPlaySubs();
  qrPlayRevealFanfare();
  const el=document.getElementById('multPlayReveal'); el.style.display='block';
  const item=session.items[session.qIndex];
  const mine=(session.standings||[]).find(s=>s.id===multPlayerId);
  const rank=mine?(session.standings.indexOf(mine)+1):null;
  el.innerHTML=`<div class="qr-play-reveal-icon">${mine&&rank===1?'🏆':'🔢'}</div><div class="qr-play-wait-txt" style="margin-bottom:6px;">Зөв хариулт: ${item.a}×${item.b}=${item.answer}</div><div class="qr-play-reveal-pts">${mine?mine.score:0} оноо</div><div class="qr-play-reveal-detail">${mine?mine.correctCount:0}/${session.qIndex+1} зөв</div><div class="qr-play-reveal-rank">${rank?'Одоогийн байр: '+rank+' / '+session.standings.length:''}</div>`;
}
function multRenderPlayFinal(session){
  multHideAllPlaySubs();
  const el=document.getElementById('multPlayFinal'); el.style.display='block';
  const mine=(session.standings||[]).find(s=>s.id===multPlayerId);
  const rank=mine?session.standings.indexOf(mine)+1:'-';
  const medals={1:'🥇',2:'🥈',3:'🥉'};
  const totalQ=session.totalQ||1;
  el.innerHTML=`<div class="qr-play-final-rank">${medals[rank]||('#'+rank)}</div><div class="qr-play-wait-txt" style="margin-bottom:10px;">Тэмцээн дууслаа!</div><div class="qr-play-final-score">${mine?mine.score:0} оноо</div><div class="qr-play-final-detail">${mine?mine.correctCount:0}/${totalQ} зөв · ${mine?(mine.totalTimeMs/1000).toFixed(1):0}с</div><button class="qr-join-go-btn" style="margin-top:26px;" onclick="multPlayerLeaveToHome()">Гарах</button>`;
}
function multRenderPlayCancelled(){
  multHideAllPlaySubs();
  const el=document.getElementById('multPlayFinal'); el.style.display='block';
  el.innerHTML=`<div class="qr-play-final-rank">😕</div><div class="qr-play-wait-txt">Хост тэмцээнийг цуцалсан байна.</div><button class="qr-join-go-btn" style="margin-top:26px;" onclick="multPlayerLeaveToHome()">Гарах</button>`;
}
function multPlayerLeaveToHome(){
  multHostCleanupListeners();
  multSessionId=null; multCurSession=null; multPlayerHasAnswered=false; multLastRenderedPhaseKey=null;
  showMultHome();
}

window.showKidsHome=showKidsHome;
window.showMultHome=showMultHome;window.multSetTable=multSetTable;window.multSetCount=multSetCount;
window.multStartSolo=multStartSolo;window.multSoloExit=multSoloExit;window.multDelScore=multDelScore;
window.multHostStart=multHostStart;window.multHostBeginGame=multHostBeginGame;window.multHostCancelSession=multHostCancelSession;window.multHostReveal=multHostReveal;window.multHostNextQuestion=multHostNextQuestion;window.multHostEndGame=multHostEndGame;window.multHostFinishSession=multHostFinishSession;
window.showMultJoin=showMultJoin;window.multDoJoin=multDoJoin;window.multRetryLastAnswer=multRetryLastAnswer;window.multPlayerLeaveToHome=multPlayerLeaveToHome;
// ══════════════════════════════════════════════════════════════
// F1 READY — реакц/нарийвчлалын тоглоом
// Тоглогч өөрөө цагаа сонгоно (жишээ 5.55 = 5.55 секунд) → 3 улаан
// гэрэл асаад бүгд ногоон болонгуут цаг эхэлнэ → тоглогч ЗОГСОО
// дарж, сонгосон цагтаа хэр ойрхон тааруулснаараа эрэмбэлэгдэнэ.
// ══════════════════════════════════════════════════════════════
let f1SelectedMode='visible', f1SelectedCount=3;

function showF1Home(){
  setAllInactive();
  document.getElementById('f1HomeScreen').classList.add('active');
  document.getElementById('navF1').classList.add('active');
  activeGame='f1';
  setTheme('f1');
  f1BuildFloatingBG();
  const cntInp=document.getElementById('f1CountInp'); if(cntInp) cntInp.value=f1SelectedCount;
  f1LoadScores();
}
function f1BuildFloatingBG(){
  const wrap=document.getElementById('f1FloatBg'); if(!wrap||wrap.childElementCount)return;
  const icons=['🏁','🔴','🟢'];
  for(let i=0;i<10;i++){
    const s=document.createElement('div'); s.textContent=icons[i%icons.length];
    s.style.cssText=`position:absolute;top:${4+((i*37)%90)}%;left:${2+((i*53)%94)}%;font-size:${14+(i%4)*10}px;opacity:.13;animation:qrFloat ${9+(i%5)*1.8}s ease-in-out infinite;animation-delay:${i*0.7}s;`;
    wrap.appendChild(s);
  }
}
function f1SetMode(m){ f1SelectedMode=m; document.querySelectorAll('#f1HomeScreen .mc-reveal-grid [data-f1mode]').forEach(b=>b.classList.toggle('active',b.dataset.f1mode===m)); }
function f1SetCount(v){ const n=parseInt(v); f1SelectedCount=(isNaN(n)||n<1)?1:Math.min(n,20); }
function f1ParseTarget(str){
  const n=parseFloat(String(str||'').trim().replace(',','.'));
  if(isNaN(n)||n<=0||n>60) return null;
  return Math.round(n*100)/100; // 2 орны нарийвчлал (доль)
}
function f1FmtDiff(diffSec){
  const sign = diffSec>0 ? '+' : (diffSec<0 ? '−' : '');
  return sign + Math.abs(diffSec).toFixed(2) + 'с';
}
// qStartedAt-аас (бүх төхөөрөмжид ижилхэн) ижил "улаан хугацаа"-г тооцоолж, гэрлийг синхрон явуулна
function f1GreenDelayMs(seedMs){ return 1800 + (seedMs % 2200); } // 1.8с - 4.0с хооронд

// containerId доторх .f1-light элементүүдийг гэрэл асаах дараалалаар жолоодоно, ногоон болоход onGreen дуудна
function f1RunLightSequence(containerId, startedAt, onGreen){
  const lights=document.querySelectorAll('#'+containerId+' .f1-light');
  lights.forEach(l=>l.classList.remove('on-red','on-green'));
  const greenDelay=f1GreenDelayMs(startedAt);
  const litSteps=[startedAt+250, startedAt+650, startedAt+1050]; // 3 гэрэл дараалан улаанаар асна
  const greenAt=startedAt+greenDelay;
  const timers=[];
  litSteps.forEach((t,i)=>{
    const wait=t-Date.now();
    timers.push(setTimeout(()=>{ if(lights[i]) lights[i].classList.add('on-red'); qrTone(420,0.12,0.22,'square'); }, Math.max(0,wait)));
  });
  const waitGreen=greenAt-Date.now();
  timers.push(setTimeout(()=>{
    lights.forEach(l=>{ l.classList.remove('on-red'); l.classList.add('on-green'); });
    qrTone(880,0.28,0.3,'sawtooth'); // "GO" дохио — өндөр, тод чимээ
    onGreen(greenAt);
  }, Math.max(0,waitGreen)));
  return {greenAt, timers};
}
function f1ClearTimers(timerObj){ if(timerObj&&timerObj.timers) timerObj.timers.forEach(t=>clearTimeout(t)); }
// qStartedAt-аас 2.0-8.0 секундийн хооронд деterминистаар "жинхэнэ зай"-г тооцоолно (бүх төхөөрөмжид ижилхэн)
function f1ComputeGap(seedMs){ return Math.round((2+((seedMs%6000)/1000))*100)/100; }
// 3 улаан гэрэл → ногоон "START" анивчина → жинхэнэ зайн дараа дахин ногоон "FINISH" анивчина.
// statusElId өгвөл тэр элементэд START/FINISH бичгийг харуулна. onFinish(actualGap) дуудна.
function f1RunGapSequence(containerId, startedAt, statusElId, onFinish){
  const lights=document.querySelectorAll('#'+containerId+' .f1-light');
  lights.forEach(l=>l.classList.remove('on-red','on-green'));
  const statusEl=statusElId?document.getElementById(statusElId):null;
  if(statusEl){ statusEl.className='f1-gap-label'; statusEl.textContent=''; }
  const greenDelay=f1GreenDelayMs(startedAt);
  const litSteps=[startedAt+250, startedAt+650, startedAt+1050];
  const startAt=startedAt+greenDelay;
  const actualGap=f1ComputeGap(startedAt);
  const finishAt=startAt+actualGap*1000;
  const timers=[];
  litSteps.forEach((t,i)=>{
    const wait=t-Date.now();
    timers.push(setTimeout(()=>{ if(lights[i]) lights[i].classList.add('on-red'); qrTone(420,0.12,0.22,'square'); }, Math.max(0,wait)));
  });
  timers.push(setTimeout(()=>{
    lights.forEach(l=>{ l.classList.remove('on-red'); l.classList.add('on-green'); });
    if(statusEl) statusEl.textContent='🏁 START';
    qrTone(880,0.28,0.3,'sawtooth');
  }, Math.max(0,startAt-Date.now())));
  timers.push(setTimeout(()=>{
    lights.forEach(l=>l.classList.remove('on-green'));
    if(statusEl) statusEl.textContent='';
  }, Math.max(0,startAt-Date.now()+450)));
  timers.push(setTimeout(()=>{
    lights.forEach(l=>l.classList.add('on-green'));
    if(statusEl) statusEl.textContent='🏁 FINISH';
    qrTone(660,0.32,0.32,'sawtooth');
    onFinish(actualGap);
  }, Math.max(0,finishAt-Date.now())));
  return {timers};
}

// ── SOLO ГОРИМ ──
let f1SoloRoundIdx=0, f1SoloResults=[], f1SoloTarget=0, f1SoloActualGap=0, f1SoloGreenAt=0, f1SoloTimerInt=null, f1SoloLightObj=null, f1SoloStopped=false, f1SoloKeyHandler=null;
async function f1StartSolo(){
  if(!currentUser){openLogin();return;}
  if(!await hasActiveSubscription()){showSubRequired();return;}
  f1SoloRoundIdx=0; f1SoloResults=[];
  setAllInactive();
  document.getElementById('f1SoloScreen').classList.add('active');
  document.getElementById('f1SoloFinal').style.display='none';
  f1SoloRenderTargetEntry();
}
function f1SoloRenderTargetEntry(){
  document.getElementById('f1SoloQNum').textContent=`Раунд ${f1SoloRoundIdx+1}/${f1SelectedCount}`;
  document.getElementById('f1SoloFeedback').style.display='none';
  const stage=document.getElementById('f1SoloStage'); stage.style.display='block';
  document.getElementById('f1SoloLights').style.display='none';
  document.getElementById('f1SoloTimer').style.display='none';
  document.getElementById('f1SoloStopBtn').style.display='none';
  const oldGuessBox=document.getElementById('f1SoloGuessBox'); if(oldGuessBox) oldGuessBox.remove();
  if(f1SelectedMode==='gap'){
    // Эхлэл-Төгсгөл горимд тоглогч цаг оруулахгүй — шууд гэрэл рүү орно
    document.getElementById('f1SoloTargetEntry').style.display='none';
    f1SoloBeginLights();
    return;
  }
  document.getElementById('f1SoloTargetEntry').style.display='block';
  const inp=document.getElementById('f1SoloTargetInp'); inp.value='';
  setTimeout(()=>inp.focus(),150);
  const btn=document.getElementById('f1SoloTargetBtn');
  const doConfirm=()=>{
    const t=f1ParseTarget(inp.value);
    if(!t){ notify('Зөв тоо оруулна уу (жишээ: 5.55)'); return; }
    f1SoloTarget=t;
    f1SoloBeginLights();
  };
  btn.onclick=doConfirm;
  inp.onkeydown=e=>{ if(e.key==='Enter'){ e.preventDefault(); doConfirm(); } };
}
function f1SoloBeginLights(){
  document.getElementById('f1SoloTargetEntry').style.display='none';
  document.getElementById('f1SoloLights').style.display='flex';
  const startedAt=Date.now();
  if(f1SelectedMode==='gap'){
    document.getElementById('f1SoloStopBtn').style.display='none';
    f1SoloLightObj=f1RunGapSequence('f1SoloLights', startedAt, 'f1SoloStatusTxt', (actualGap)=>{
      f1SoloActualGap=actualGap;
      f1SoloRenderGapGuessInput();
    });
    return;
  }
  document.getElementById('f1SoloStopBtn').style.display='block';
  f1SoloStopped=false;
  f1SoloLightObj=f1RunLightSequence('f1SoloLights', startedAt, (greenAt)=>{
    f1SoloGreenAt=greenAt;
    if(f1SelectedMode==='visible'){
      const tEl=document.getElementById('f1SoloTimer'); tEl.style.display='block';
      if(f1SoloTimerInt) clearInterval(f1SoloTimerInt);
      f1SoloTimerInt=setInterval(()=>{ tEl.textContent=((Date.now()-f1SoloGreenAt)/1000).toFixed(2)+'с'; },30);
    }
  });
  const stopBtn=document.getElementById('f1SoloStopBtn');
  stopBtn.onclick=f1SoloStop;
  f1SoloKeyHandler=e=>{ if(e.code==='Space'){ e.preventDefault(); f1SoloStop(); } };
  document.addEventListener('keydown', f1SoloKeyHandler);
}
function f1SoloRenderGapGuessInput(){
  const wrap=document.getElementById('f1SoloStage');
  let guessBox=document.getElementById('f1SoloGuessBox');
  if(!guessBox){ guessBox=document.createElement('div'); guessBox.id='f1SoloGuessBox'; guessBox.className='f1-target-entry'; wrap.appendChild(guessBox); }
  guessBox.style.display='block';
  guessBox.innerHTML=`
    <div class="f1-target-label">Хэдэн секунд өнгөрснийг тааж бич:</div>
    <input class="f1-target-inp" id="f1SoloGuessInp" type="text" inputmode="decimal" placeholder="5.55" autocomplete="off">
    <button class="sq-type-submit-btn f1-btn" id="f1SoloGuessBtn">✓ Илгээх</button>`;
  const inp=document.getElementById('f1SoloGuessInp'); setTimeout(()=>inp.focus(),150);
  const doSubmit=()=>{
    const g=f1ParseTarget(inp.value);
    if(!g){ notify('Зөв тоо оруулна уу (жишээ: 5.55)'); return; }
    guessBox.remove();
    f1SoloFinishGap(g);
  };
  document.getElementById('f1SoloGuessBtn').onclick=doSubmit;
  inp.onkeydown=e=>{ if(e.key==='Enter'){ e.preventDefault(); doSubmit(); } };
}
function f1SoloFinishGap(guess){
  const diff=guess-f1SoloActualGap;
  const absDiff=Math.abs(diff);
  f1SoloResults.push({target:f1SoloActualGap,elapsed:guess,diff,absDiff});
  document.getElementById('f1SoloStage').style.display='none';
  const fb=document.getElementById('f1SoloFeedback');
  fb.style.display='block';
  const cls=absDiff<0.005?'perfect':(diff>0?'over':'under');
  fb.innerHTML=`<div class="qr-solo-feedback-icon">${absDiff<0.05?'🎯':'🏁'}</div><div class="f1-result-diff ${cls}">${f1FmtDiff(diff)}</div><div class="qr-solo-feedback-txt" style="color:rgba(255,255,255,.7);">Бодит зай: ${f1SoloActualGap.toFixed(2)}с · Таасан: ${guess.toFixed(2)}с</div>`;
  setTimeout(()=>{
    f1SoloRoundIdx++;
    if(f1SoloRoundIdx<f1SelectedCount) f1SoloRenderTargetEntry();
    else f1SoloShowFinal();
  },2200);
}
function f1SoloStop(){
  if(f1SoloStopped) return;
  if(!f1SoloGreenAt) return; // улаан үед дарвал үл тооно (false start)
  f1SoloStopped=true;
  if(f1SoloTimerInt){clearInterval(f1SoloTimerInt);f1SoloTimerInt=null;}
  if(f1SoloKeyHandler){document.removeEventListener('keydown',f1SoloKeyHandler);f1SoloKeyHandler=null;}
  qrPlaySelectBlip();
  const elapsed=(Date.now()-f1SoloGreenAt)/1000;
  const diff=elapsed-f1SoloTarget;
  const absDiff=Math.abs(diff);
  f1SoloResults.push({target:f1SoloTarget,elapsed,diff,absDiff});
  document.getElementById('f1SoloStage').style.display='none';
  const fb=document.getElementById('f1SoloFeedback');
  fb.style.display='block';
  const cls=absDiff<0.005?'perfect':(diff>0?'over':'under');
  fb.innerHTML=`<div class="qr-solo-feedback-icon">${absDiff<0.05?'🎯':'🏁'}</div><div class="f1-result-diff ${cls}">${f1FmtDiff(diff)}</div><div class="qr-solo-feedback-txt" style="color:rgba(255,255,255,.7);">Сонгосон: ${f1SoloTarget.toFixed(2)}с · Бодит: ${elapsed.toFixed(2)}с</div>`;
  setTimeout(()=>{
    f1SoloRoundIdx++;
    if(f1SoloRoundIdx<f1SelectedCount) f1SoloRenderTargetEntry();
    else f1SoloShowFinal();
  },2200);
}
async function f1SoloShowFinal(){
  const totalAbsDiff=f1SoloResults.reduce((s,r)=>s+r.absDiff,0);
  const avgAbsDiff=totalAbsDiff/f1SoloResults.length;
  const fin=document.getElementById('f1SoloFinal');
  fin.style.display='block';
  const roundsHtml=f1SoloResults.map((r,i)=>{
    const cls=r.absDiff<0.005?'perfect':(r.diff>0?'over':'under');
    return `<div class="f1-round-row"><span>Раунд ${i+1}</span><span class="f1-round-diff ${cls}">${f1FmtDiff(r.diff)}</span></div>`;
  }).join('');
  fin.innerHTML=`
    <div style="font-size:60px;">${avgAbsDiff<0.05?'🏆':avgAbsDiff<0.2?'🏁':'💪'}</div>
    <div class="qr-solo-final-score">Дундаж зөрүү: ${avgAbsDiff.toFixed(3)}с</div>
    <div class="qr-solo-final-pct">${f1SoloResults.length} раунд · нийт зөрүү ${totalAbsDiff.toFixed(2)}с</div>
    <div class="f1-rounds-breakdown">${roundsHtml}</div>
    <div class="qr-solo-final-btns">
      <button onclick="f1StartSolo()">↻ Дахин тоглох</button>
      <button class="secondary" onclick="f1SoloExit()">Гарах</button>
    </div>`;
  try{
    const scoreId=`${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    const name=(document.getElementById('f1NameInp')&&document.getElementById('f1NameInp').value.trim())||(currentUser?(currentUser.displayName||currentUser.email.split('@')[0]):'Зочин');
    await setDoc(doc(fsdb,'f1_scores',scoreId),{name,rounds:f1SoloResults.length,totalAbsDiff:Math.round(totalAbsDiff*1000)/1000,avgAbsDiff:Math.round(avgAbsDiff*1000)/1000,mode:f1SelectedMode,ts:Date.now()});
  }catch(e){console.error('[F1] score save err',e);}
}
function f1SoloExit(){
  if(f1SoloTimerInt){clearInterval(f1SoloTimerInt);f1SoloTimerInt=null;}
  if(f1SoloKeyHandler){document.removeEventListener('keydown',f1SoloKeyHandler);f1SoloKeyHandler=null;}
  f1ClearTimers(f1SoloLightObj);
  showF1Home();
}
let f1Scores=[];
async function f1LoadScores(){
  try{
    const q=query(collection(fsdb,'f1_scores'),orderBy('avgAbsDiff','asc'),limit(100));
    const snap=await getDocs(q);
    f1Scores=[]; snap.forEach(d=>f1Scores.push({...d.data(),_id:d.id}));
  }catch(e){console.error('[F1] load scores err',e); f1Scores=[];}
  f1RenderLeaderboard();
}
function f1RenderLeaderboard(){
  const sorted=f1Scores.slice().sort((a,b)=> a.avgAbsDiff-b.avgAbsDiff).slice(0,20);
  const tableEl=document.getElementById('f1LbTable'); if(!tableEl)return;
  if(!sorted.length){tableEl.innerHTML='<div class="mc-lb-empty">Бичлэг алга — эхлээд ганцаараа тоглоод үзээрэй!</div>';return;}
  let html=`<div class="mc-lb-row mc-lb-header"><div>#</div><div>Нэр</div><div>Дундаж зөрүү</div><div>Раунд</div><div></div></div>`;
  sorted.forEach((s,i)=>{
    const delBtn=isAdmin?`<button class="mc-lb-del" onclick="f1DelScore('${s._id}')">✕</button>`:'';
    html+=`<div class="mc-lb-row"><div class="mc-lb-rank">${i+1}</div><div class="mc-lb-name">${escH(s.name||'Тоглогч')}</div><div>${s.avgAbsDiff.toFixed(3)}с</div><div>${s.rounds}</div><div>${delBtn}</div></div>`;
  });
  tableEl.innerHTML=html;
}
async function f1DelScore(id){
  if(!isAdmin)return;
  try{ await deleteDoc(doc(fsdb,'f1_scores',id)); f1Scores=f1Scores.filter(s=>s._id!==id); f1RenderLeaderboard(); }catch(e){notify('Устгахад алдаа гарлаа');}
}

// ── HOST ГОРИМ (олон тоглогч) ──
let f1SessionId=null, f1IsHost=false, f1CurSession=null, f1LastRenderedPhaseKey=null;
let f1UnsubSession=null, f1UnsubPlayers=null, f1UnsubTargets=null, f1UnsubAnswers=null;
let f1CurrentPlayerCount=0, f1LastTargetSnapCache=[], f1LastAnswerSnapCache=[];
let f1HostLightObj=null, f1HostTimerInt=null;
let f1SessionRetryCount=0, f1SessionRetryTimer=null, f1PlayersRetryCount=0, f1PlayersRetryTimer=null;

async function f1HostStart(){
  if(!currentUser){openLogin();return;}
  if(!await hasActiveSubscription()){showSubRequired();return;}
  const code=await qrGenUniqueCode('f1_sessions');
  const sid='f1'+Date.now();
  const sessionData={id:sid,code,hostId:currentUser.uid,mode:f1SelectedMode,totalRounds:f1SelectedCount,phase:'lobby',roundIndex:-1,qStartedAt:0,standings:[],createdAt:Date.now()};
  try{
    await setDoc(doc(fsdb,'f1_sessions',sid),sessionData);
    f1SessionId=sid; f1IsHost=true; f1CurSession=sessionData; f1LastRenderedPhaseKey=null;
    showF1Lobby();
  }catch(e){console.error(e);notify('Сесс үүсгэхэд алдаа гарлаа');}
}
function showF1Lobby(){
  setAllInactive();
  document.getElementById('f1HostLobbyScreen').classList.add('active');
  document.getElementById('f1LobbyInfo').textContent=`🏁 ${f1CurSession.mode==='hidden'?'Мэдрэмжээр':'Цаг харагдана'} · ${f1CurSession.totalRounds} раунд`;
  document.getElementById('f1PinBox').textContent=f1CurSession.code;
  const joinUrl='https://bolorgames.com/?fjoin='+f1CurSession.code;
  document.getElementById('f1QrImg').src='https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data='+encodeURIComponent(joinUrl);
  f1HostSubscribeLobbyPlayers();
  f1HostSubscribeSession();
}
function f1HostSubscribeLobbyPlayers(){
  if(f1UnsubPlayers) f1UnsubPlayers();
  if(f1PlayersRetryTimer){clearTimeout(f1PlayersRetryTimer);f1PlayersRetryTimer=null;}
  const mySid=f1SessionId;
  f1UnsubPlayers=onSnapshot(collection(fsdb,'f1_sessions',mySid,'players'), snap=>{
    f1PlayersRetryCount=0;
    const players=[]; snap.forEach(d=>players.push({id:d.id,...d.data()}));
    f1CurrentPlayerCount=players.length;
    const cntEl=document.getElementById('f1PlayerCount'); if(cntEl)cntEl.textContent=players.length;
    const list=document.getElementById('f1LobbyPlayers');
    if(list) list.innerHTML=players.map(p=>`<span class="qr-player-chip">${escH(p.name)}</span>`).join('');
    const startBtn=document.getElementById('f1StartBtn');
    if(startBtn){ startBtn.disabled=players.length===0; startBtn.textContent=players.length===0?'Тоглогч хүлээж байна…':`▶ Эхлүүлэх (${players.length})`; }
  }, err=>{
    console.error('[F1] players listen err',err);
    if(f1SessionId!==mySid) return;
    f1PlayersRetryCount++;
    if(f1PlayersRetryCount<=8){ f1PlayersRetryTimer=setTimeout(()=>{ if(f1SessionId===mySid) f1HostSubscribeLobbyPlayers(); }, Math.min(1500*f1PlayersRetryCount,8000)); }
    else notify('Тоглогчидтой холбогдоход алдаа гарлаа. Хуудсаа шинэчилнэ үү.',6000);
  });
}
function f1HostSubscribeSession(){
  if(f1UnsubSession) f1UnsubSession();
  if(f1SessionRetryTimer){clearTimeout(f1SessionRetryTimer);f1SessionRetryTimer=null;}
  const mySid=f1SessionId;
  f1UnsubSession=onSnapshot(doc(fsdb,'f1_sessions',mySid), snap=>{
    f1SessionRetryCount=0;
    if(!snap.exists())return;
    f1CurSession={id:snap.id,...snap.data()};
    if(f1IsHost) f1HostHandleSessionUpdate(f1CurSession);
    else f1PlayerHandleSessionUpdate(f1CurSession);
  }, err=>{
    console.error('[F1] session listen err',err);
    if(f1SessionId!==mySid) return;
    f1SessionRetryCount++;
    if(f1SessionRetryCount===1) notify('Холболт тасарлаа, автоматаар дахин холбогдож байна…',4000);
    if(f1SessionRetryCount<=8){ f1SessionRetryTimer=setTimeout(()=>{ if(f1SessionId===mySid) f1HostSubscribeSession(); }, Math.min(1500*f1SessionRetryCount,8000)); }
    else notify('Холболт сэргээгдсэнгүй. Хуудсаа шинэчилнэ үү.',8000);
  });
}
function f1HostCancelSession(){
  if(!confirm('Тэмцээнийг цуцлах уу?'))return;
  if(f1SessionId){ setDoc(doc(fsdb,'f1_sessions',f1SessionId),{phase:'cancelled'},{merge:true}).catch(()=>{}); }
  f1HostCleanupListeners();
  f1SessionId=null; f1IsHost=false; f1CurSession=null;
  showF1Home();
}
function f1HostCleanupListeners(){
  if(f1UnsubSession){f1UnsubSession();f1UnsubSession=null;}
  if(f1UnsubPlayers){f1UnsubPlayers();f1UnsubPlayers=null;}
  if(f1UnsubTargets){f1UnsubTargets();f1UnsubTargets=null;}
  if(f1UnsubAnswers){f1UnsubAnswers();f1UnsubAnswers=null;}
  if(f1HostTimerInt){clearInterval(f1HostTimerInt);f1HostTimerInt=null;}
  f1ClearTimers(f1HostLightObj);
  if(f1SessionRetryTimer){clearTimeout(f1SessionRetryTimer);f1SessionRetryTimer=null;}
  if(f1PlayersRetryTimer){clearTimeout(f1PlayersRetryTimer);f1PlayersRetryTimer=null;}
  f1CurrentPlayerCount=0;
}
async function f1HostBeginGame(){
  try{ await setDoc(doc(fsdb,'f1_sessions',f1SessionId),{phase:'target_entry',roundIndex:0},{merge:true}); }
  catch(e){console.error(e);notify('Эхлүүлэхэд алдаа гарлаа');}
}
function f1HostHandleSessionUpdate(session){
  if(!f1IsHost) return;
  const key=session.phase+':'+session.roundIndex;
  if(session.phase==='target_entry'){
    if(f1LastRenderedPhaseKey!==key){ setAllInactive(); document.getElementById('f1HostGameScreen').classList.add('active'); f1HostRenderTargetEntry(session); f1LastRenderedPhaseKey=key; }
  }else if(session.phase==='lights'){
    if(f1LastRenderedPhaseKey!==key){ f1HostRenderLights(session); f1LastRenderedPhaseKey=key; }
  }else if(session.phase==='reveal'){
    if(f1LastRenderedPhaseKey!==key){ f1HostRenderReveal(session); f1LastRenderedPhaseKey=key; }
  }else if(session.phase==='ended'){
    if(f1LastRenderedPhaseKey!=='ended'){ f1HostRenderEnded(session); f1LastRenderedPhaseKey='ended'; }
  }
}
function f1HostRenderTargetEntry(session){
  document.getElementById('f1HostAnsCount').textContent='';
  document.getElementById('f1HostStatusTxt').style.display='none';
  document.getElementById('f1HostStatusTxt').className='f1-status-txt';
  document.getElementById('f1HostLights').querySelectorAll('.f1-light').forEach(l=>l.classList.remove('on-red','on-green'));
  document.getElementById('f1HostTimer').style.display='none';
  document.getElementById('f1HostLeaderboard').style.display='none';
  if(session.mode==='gap'){
    document.getElementById('f1HostQNum').textContent=`Раунд ${session.roundIndex+1} / ${session.totalRounds} — Эхлэл→Төгсгөл`;
    document.getElementById('f1HostActions').innerHTML=`<button onclick="f1HostStartGapRound()">🚦 Эхлүүлэх</button>`;
    return;
  }
  document.getElementById('f1HostQNum').textContent=`Раунд ${session.roundIndex+1} / ${session.totalRounds} — Хост цаг оруулна`;
  document.getElementById('f1HostActions').innerHTML=`
    <input class="f1-target-inp" id="f1HostTargetInp" type="text" inputmode="decimal" placeholder="5.55" autocomplete="off" style="max-width:200px;margin:0 auto 14px;display:block;">
    <button onclick="f1HostSetTargetAndStart()">🚦 Цаг оруулаад эхлүүлэх</button>`;
  setTimeout(()=>{
    const inp=document.getElementById('f1HostTargetInp');
    if(inp){ inp.focus(); inp.onkeydown=e=>{ if(e.key==='Enter'){ e.preventDefault(); f1HostSetTargetAndStart(); } }; }
  },100);
}
async function f1HostSetTargetAndStart(){
  const inp=document.getElementById('f1HostTargetInp');
  const t=f1ParseTarget(inp?inp.value:'');
  if(!t){ notify('Зөв тоо оруулна уу (жишээ: 5.55)'); return; }
  try{ await setDoc(doc(fsdb,'f1_sessions',f1SessionId),{phase:'lights',currentTarget:t,qStartedAt:Date.now()},{merge:true}); }
  catch(e){console.error(e);notify('Алдаа гарлаа');}
}
async function f1HostStartGapRound(){
  const qStartedAt=Date.now();
  const actualGap=f1ComputeGap(qStartedAt);
  try{ await setDoc(doc(fsdb,'f1_sessions',f1SessionId),{phase:'lights',currentTarget:actualGap,qStartedAt},{merge:true}); }
  catch(e){console.error(e);notify('Алдаа гарлаа');}
}
function f1HostRenderLights(session){
  document.getElementById('f1HostActions').innerHTML=`<button onclick="f1HostReveal()">Хариу харуулах ⏹</button>`;
  if(session.mode==='gap'){
    document.getElementById('f1HostQNum').textContent=`Раунд ${session.roundIndex+1} / ${session.totalRounds} — Тоглогчид тааж байна`;
    document.getElementById('f1HostStatusTxt').style.display='block';
    f1HostLightObj=f1RunGapSequence('f1HostLights', session.qStartedAt, 'f1HostStatusTxt', ()=>{});
    f1HostSubscribeAnswerCount(session.roundIndex);
    return;
  }
  document.getElementById('f1HostQNum').innerHTML=`Раунд ${session.roundIndex+1} / ${session.totalRounds} — 🎯 Зорилт: <b style="color:#39ff14;">${session.currentTarget.toFixed(2)}с</b>`;
  document.getElementById('f1HostStatusTxt').style.display='none';
  f1HostLightObj=f1RunLightSequence('f1HostLights', session.qStartedAt, ()=>{
    if(session.mode==='visible'){
      const tEl=document.getElementById('f1HostTimer'); tEl.style.display='block';
      if(f1HostTimerInt) clearInterval(f1HostTimerInt);
      f1HostTimerInt=setInterval(()=>{ tEl.textContent=((Date.now()-(session.qStartedAt+f1GreenDelayMs(session.qStartedAt)))/1000).toFixed(2)+'с'; },30);
    }
  });
  f1HostSubscribeAnswerCount(session.roundIndex);
}
function f1HostSubscribeAnswerCount(roundIndex){
  if(f1UnsubAnswers) f1UnsubAnswers();
  const mySid=f1SessionId;
  let autoRevealed=false;
  f1UnsubAnswers=onSnapshot(query(collection(fsdb,'f1_sessions',mySid,'answers'), where('roundIndex','==',roundIndex)), snap=>{
    const el=document.getElementById('f1HostAnsCount'); if(el)el.textContent=snap.size+' зогссон';
    f1LastAnswerSnapCache=[]; snap.forEach(d=>f1LastAnswerSnapCache.push(d.data()));
    if(!autoRevealed && f1CurSession && f1CurSession.phase==='lights' && f1CurSession.roundIndex===roundIndex
       && snap.size>0 && f1CurrentPlayerCount>0 && snap.size>=f1CurrentPlayerCount){
      autoRevealed=true; f1HostReveal();
    }
  }, err=>console.error('[F1] answers listen err',err));
}
function f1HostReveal(){
  if(f1HostTimerInt){clearInterval(f1HostTimerInt);f1HostTimerInt=null;}
  f1ClearTimers(f1HostLightObj);
  if(f1UnsubAnswers){f1UnsubAnswers();f1UnsubAnswers=null;}
  f1HostComputeStandingsAndReveal();
}
async function f1HostComputeStandingsAndReveal(){
  try{
    const [playersSnap,answersSnap]=await withTimeout(Promise.all([
      getDocs(collection(fsdb,'f1_sessions',f1SessionId,'players')),
      getDocs(collection(fsdb,'f1_sessions',f1SessionId,'answers'))
    ]), 8000, 'f1RevealFetch');
    const names={},totalAbsDiff={},roundsPlayed={};
    playersSnap.forEach(d=>{names[d.id]=d.data().name;totalAbsDiff[d.id]=0;roundsPlayed[d.id]=0;});
    answersSnap.forEach(d=>{
      const a=d.data();
      if(!names[a.playerId])names[a.playerId]=a.playerName;
      totalAbsDiff[a.playerId]=(totalAbsDiff[a.playerId]||0)+(a.absDiffSec||0);
      roundsPlayed[a.playerId]=(roundsPlayed[a.playerId]||0)+1;
    });
    const standings=Object.keys(names).map(id=>{
      const rounds=roundsPlayed[id]||0;
      const total=totalAbsDiff[id]||0;
      const avg=rounds>0?total/rounds:0;
      return {id,name:names[id]||'???',totalAbsDiff:Math.round(total*1000)/1000,avgAbsDiff:Math.round(avg*1000)/1000,rounds};
    }).sort((a,b)=> a.avgAbsDiff-b.avgAbsDiff).slice(0,15);
    await withTimeout(setDoc(doc(fsdb,'f1_sessions',f1SessionId),{phase:'reveal',standings},{merge:true}), 8000, 'f1RevealWrite');
  }catch(e){
    console.error(e);
    const msg=String(e&&e.message||'');
    notify(msg.includes('TIMEOUT')?'Сүлжээ удаан байна — «Хариу харуулах»-ыг дахин дарна уу.':'Алдаа гарлаа: '+String(e).slice(0,80), 6000);
  }
}
function f1HostRenderReveal(session){
  setAllInactive();
  document.getElementById('f1HostGameScreen').classList.add('active');
  qrPlayRevealFanfare();
  document.getElementById('f1HostQNum').textContent=`Раунд ${session.roundIndex+1} — Дүн`;
  document.getElementById('f1HostStatusTxt').style.display='none';
  const t=document.getElementById('f1HostTimer'); t.style.display='none';
  document.getElementById('f1HostAnsCount').textContent=(f1LastAnswerSnapCache||[]).length+' зогссон';
  const lb=document.getElementById('f1HostLeaderboard');
  lb.style.display='block';
  lb.innerHTML='<div class="rounds-title" style="margin:20px 0 10px;">🏆 Тэргүүлэгчид (нийт зөрүүгээр)</div>'+(session.standings||[]).slice(0,5).map((s,i)=>
    `<div class="qr-lb-row" style="animation-delay:${i*0.08}s"><span class="qr-lb-rank">${i+1}</span><span class="qr-lb-name">${escH(s.name)}<div class="qr-lb-detail">${s.rounds} раунд · дундаж</div></span><span class="qr-lb-score">${s.avgAbsDiff.toFixed(3)}с</span></div>`
  ).join('');
  const isLast=session.roundIndex>=session.totalRounds-1;
  document.getElementById('f1HostActions').innerHTML=isLast?`<button onclick="f1HostEndGame()">🏁 Тэмцээн дуусгах</button>`:`<button onclick="f1HostNextRound()">Дараагийн раунд →</button>`;
}
async function f1HostNextRound(){
  const nextIdx=f1CurSession.roundIndex+1;
  try{ await setDoc(doc(fsdb,'f1_sessions',f1SessionId),{phase:'target_entry',roundIndex:nextIdx},{merge:true}); }
  catch(e){console.error(e);notify('Алдаа гарлаа');}
}
async function f1HostEndGame(){
  try{ await setDoc(doc(fsdb,'f1_sessions',f1SessionId),{phase:'ended'},{merge:true}); }
  catch(e){console.error(e);notify('Алдаа гарлаа');}
}
function f1HostRenderEnded(session){
  setAllInactive();
  document.getElementById('f1HostGameScreen').classList.add('active');
  document.getElementById('f1HostQNum').textContent='Тэмцээн дууслаа 🏁';
  document.getElementById('f1HostAnsCount').textContent='';
  document.getElementById('f1HostStatusTxt').style.display='none';
  document.getElementById('f1HostTimer').style.display='none';
  document.getElementById('f1HostLights').querySelectorAll('.f1-light').forEach(l=>l.classList.remove('on-red','on-green'));
  const medals=['🥇','🥈','🥉'];
  const lb=document.getElementById('f1HostLeaderboard');
  lb.style.display='block';
  lb.innerHTML='<div class="qr-podium-wrap"><div class="qr-podium-emoji">🏁</div></div>'+(session.standings||[]).slice(0,10).map((s,i)=>
    `<div class="qr-lb-row" style="animation-delay:${i*0.08}s"><span class="qr-lb-rank">${medals[i]||(i+1)}</span><span class="qr-lb-name">${escH(s.name)}<div class="qr-lb-detail">${s.rounds} раунд · дундаж</div></span><span class="qr-lb-score">${s.avgAbsDiff.toFixed(3)}с</span></div>`
  ).join('');
  document.getElementById('f1HostActions').innerHTML=`<button onclick="f1HostFinishSession()">✓ Дуусгаад гарах</button>`;
}
function f1HostFinishSession(){
  f1HostCleanupListeners();
  f1SessionId=null; f1IsHost=false; f1CurSession=null; f1LastRenderedPhaseKey=null;
  showF1Home();
}

// ── ТОГЛОГЧ (join, play) ──
let f1PlayerId=null, f1PlayerName='', f1PlayerTarget=0, f1PlayerHasSubmittedTarget=false, f1PlayerHasAnswered=false;
let f1PlayLightObj=null, f1PlayTimerInt=null, f1PlayGreenAt=0, f1PlayKeyHandler=null, f1LastAnswerAttempt=null;
async function showF1Join(prefillCode){
  setAllInactive();
  document.getElementById('f1JoinScreen').classList.add('active');
  document.getElementById('f1JoinErr').textContent='';
  document.getElementById('f1JoinCodeInp').value=prefillCode||'';
  document.getElementById('f1JoinNameInp').value=f1PlayerName||'';
  setTimeout(()=>{ const el=prefillCode?document.getElementById('f1JoinNameInp'):document.getElementById('f1JoinCodeInp'); if(el)el.focus(); },200);
}
async function f1DoJoin(){
  const code=document.getElementById('f1JoinCodeInp').value.trim();
  const name=document.getElementById('f1JoinNameInp').value.trim();
  const errEl=document.getElementById('f1JoinErr'); errEl.textContent='';
  if(!/^\d{6}$/.test(code)){errEl.textContent='6 оронтой код оруулна уу';return;}
  if(!name){errEl.textContent='Нэрээ оруулна уу';return;}
  if(name.length>20){errEl.textContent='Нэр 20 тэмдэгтээс ихгүй байх';return;}
  const btn=document.getElementById('f1JoinGoBtn');
  if(btn){ btn.disabled=true; btn.textContent='Холбогдож байна…'; }
  try{
    const snap=await withTimeout(getDocs(query(collection(fsdb,'f1_sessions'), where('code','==',code))), 8000, 'f1FindSession');
    const candidates=[];
    const staleCutoff=Date.now()-12*60*60*1000;
    snap.forEach(d=>{ const data=d.data(); if(data.phase!=='ended'&&data.phase!=='cancelled' && (data.createdAt||0)>=staleCutoff) candidates.push({id:d.id,...data}); });
    candidates.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
    const found=candidates[0]||null;
    if(!found){errEl.textContent='Ийм код олдсонгүй эсвэл тэмцээн дууссан байна';return;}
    f1SessionId=found.id; f1CurSession=found; f1IsHost=false; f1PlayerName=name;
    f1PlayerId=localStorage.getItem('f1_pid_'+f1SessionId)||('p'+Date.now()+Math.random().toString(36).slice(2,8));
    localStorage.setItem('f1_pid_'+f1SessionId, f1PlayerId);
    await withTimeout(setDoc(doc(fsdb,'f1_sessions',f1SessionId,'players',f1PlayerId),{name,joinedAt:Date.now()}), 8000, 'f1JoinWrite');
    f1PlayerHasAnswered=false; f1PlayerHasSubmittedTarget=false; f1LastRenderedPhaseKey=null;
    showF1Play();
  }catch(e){
    console.error(e);
    const msg=String(e&&e.message||'');
    errEl.textContent=msg.includes('TIMEOUT')?'Сүлжээ удаан байна. Дахин оролдоно уу.':'Холбогдоход алдаа гарлаа. Дахин оролдоно уу.';
  }finally{
    if(btn){ btn.disabled=false; btn.textContent='Нэгдэх →'; }
  }
}
function showF1Play(){
  setAllInactive();
  document.getElementById('f1PlayScreen').classList.add('active');
  document.getElementById('f1PlayMyName').textContent=f1PlayerName;
  f1HostSubscribeSession();
}
function f1HideAllPlaySubs(){
  ['f1PlayWaiting','f1PlayStage','f1PlaySubmitted','f1PlayReveal','f1PlayFinal'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.style.display='none';
  });
}
function f1PlayerHandleSessionUpdate(session){
  if(f1IsHost) return;
  const key=session.phase+':'+session.roundIndex;
  if(session.phase==='lobby'){
    f1HideAllPlaySubs(); document.getElementById('f1PlayWaiting').style.display='flex';
  }else if(session.phase==='target_entry'){
    if(f1LastRenderedPhaseKey!==key){ f1PlayerHasSubmittedTarget=false; f1PlayerHasAnswered=false; f1RenderPlayTargetEntry(session); f1LastRenderedPhaseKey=key; }
  }else if(session.phase==='lights'){
    if(f1LastRenderedPhaseKey!==key){ f1RenderPlayLights(session); f1LastRenderedPhaseKey=key; }
  }else if(session.phase==='reveal'){
    if(f1LastRenderedPhaseKey!==key){ f1RenderPlayReveal(session); f1LastRenderedPhaseKey=key; }
  }else if(session.phase==='ended'){
    f1RenderPlayFinal(session);
  }else if(session.phase==='cancelled'){
    f1RenderPlayCancelled();
  }
}
function f1RenderPlayTargetEntry(session){
  f1HideAllPlaySubs();
  document.getElementById('f1PlayStage').style.display='block';
  document.getElementById('f1PlayTargetEntry').style.display='block';
  document.getElementById('f1PlayLights').style.display='none';
  document.getElementById('f1PlayTimer').style.display='none';
  document.getElementById('f1PlayStopBtn').style.display='none';
  const oldBanner=document.getElementById('f1PlayTargetBanner'); if(oldBanner) oldBanner.remove();
  const oldGuessBox=document.getElementById('f1PlayGuessBox'); if(oldGuessBox) oldGuessBox.remove();
  // Тоглогч цагаа өөрөө оруулдаггүй — хост л оруулна (эсвэл gap горимд систем өөрөө үүсгэнэ), бүгд ижил цагтай тоглоно
  document.getElementById('f1PlayTargetEntry').innerHTML=`
    <div class="f1-target-label">🏁 ${session.mode==='gap'?'Хост бэлдэж байна…':'Хост зорилтот цаг оруулж байна…'}</div>
    <div style="font-family:'Share Tech Mono',monospace;font-size:12px;color:rgba(255,255,255,.45);">Бэлэн болмогц гэрэл асна</div>`;
}
function f1RenderPlayLights(session){
  f1HideAllPlaySubs();
  document.getElementById('f1PlayStage').style.display='block';
  document.getElementById('f1PlayTargetEntry').style.display='none';
  document.getElementById('f1PlayLights').style.display='flex';
  if(session.mode==='gap'){
    document.getElementById('f1PlayStopBtn').style.display='none';
    const oldBanner=document.getElementById('f1PlayTargetBanner'); if(oldBanner) oldBanner.remove(); // Зайг нуух ёстой — тааж олох учраас
    f1PlayLightObj=f1RunGapSequence('f1PlayLights', session.qStartedAt, 'f1PlayStatusTxt', ()=>{
      f1RenderPlayGapGuessInput();
    });
    return;
  }
  document.getElementById('f1PlayStopBtn').style.display='block';
  let targetBanner=document.getElementById('f1PlayTargetBanner');
  if(!targetBanner){
    targetBanner=document.createElement('div'); targetBanner.id='f1PlayTargetBanner';
    targetBanner.style.cssText='font-family:Orbitron,monospace;font-size:16px;font-weight:800;color:#39ff14;margin-bottom:14px;';
    document.getElementById('f1PlayLights').parentElement.insertBefore(targetBanner, document.getElementById('f1PlayLights'));
  }
  targetBanner.textContent=`🎯 Зорилт: ${session.currentTarget.toFixed(2)}с`;
  f1PlayLightObj=f1RunLightSequence('f1PlayLights', session.qStartedAt, (greenAt)=>{
    f1PlayGreenAt=greenAt;
    if(session.mode==='visible'){
      const tEl=document.getElementById('f1PlayTimer'); tEl.style.display='block';
      if(f1PlayTimerInt) clearInterval(f1PlayTimerInt);
      f1PlayTimerInt=setInterval(()=>{ tEl.textContent=((Date.now()-f1PlayGreenAt)/1000).toFixed(2)+'с'; },30);
    }
  });
  const stopBtn=document.getElementById('f1PlayStopBtn');
  stopBtn.onclick=f1PlayStop;
  f1PlayKeyHandler=e=>{ if(e.code==='Space'){ e.preventDefault(); f1PlayStop(); } };
  document.addEventListener('keydown', f1PlayKeyHandler);
}
function f1RenderPlayGapGuessInput(){
  const wrap=document.getElementById('f1PlayStage');
  let guessBox=document.getElementById('f1PlayGuessBox');
  if(!guessBox){ guessBox=document.createElement('div'); guessBox.id='f1PlayGuessBox'; guessBox.className='f1-target-entry'; wrap.appendChild(guessBox); }
  guessBox.style.display='block';
  guessBox.innerHTML=`
    <div class="f1-target-label">Хэдэн секунд өнгөрснийг тааж бич:</div>
    <input class="f1-target-inp" id="f1PlayGuessInp" type="text" inputmode="decimal" placeholder="5.55" autocomplete="off">
    <button class="sq-type-submit-btn f1-btn" id="f1PlayGuessBtn">✓ Илгээх</button>`;
  const inp=document.getElementById('f1PlayGuessInp'); setTimeout(()=>inp.focus(),150);
  const doSubmit=()=>{
    if(f1PlayerHasAnswered) return;
    const g=f1ParseTarget(inp.value);
    if(!g){ notify('Зөв тоо оруулна уу (жишээ: 5.55)'); return; }
    f1PlayerHasAnswered=true;
    guessBox.remove();
    qrPlaySelectBlip();
    f1LastAnswerAttempt={elapsed:g};
    f1HideAllPlaySubs();
    document.getElementById('f1PlaySubmitted').style.display='flex';
    f1DoSubmitAnswer(g);
  };
  document.getElementById('f1PlayGuessBtn').onclick=doSubmit;
  inp.onkeydown=e=>{ if(e.key==='Enter'){ e.preventDefault(); doSubmit(); } };
}
function f1PlayStop(){
  if(f1PlayerHasAnswered) return;
  if(!f1PlayGreenAt) return; // улаан үед дарвал үл тооно
  f1PlayerHasAnswered=true;
  if(f1PlayTimerInt){clearInterval(f1PlayTimerInt);f1PlayTimerInt=null;}
  if(f1PlayKeyHandler){document.removeEventListener('keydown',f1PlayKeyHandler);f1PlayKeyHandler=null;}
  f1ClearTimers(f1PlayLightObj);
  qrPlaySelectBlip();
  const elapsed=(Date.now()-f1PlayGreenAt)/1000;
  f1LastAnswerAttempt={elapsed};
  f1HideAllPlaySubs();
  document.getElementById('f1PlaySubmitted').style.display='flex';
  f1DoSubmitAnswer(elapsed);
}
async function f1DoSubmitAnswer(elapsed){
  const txtEl=document.getElementById('f1SubmitTxt');
  const stuckBtn=document.getElementById('f1StuckBtn');
  if(txtEl) txtEl.textContent='Хариулт илгээгдлээ! Хүлээнэ үү…';
  if(stuckBtn) stuckBtn.style.display='none';
  const session=f1CurSession;
  const target=session.currentTarget; // Бүх тоглогчид ижил, хостын тохируулсан зорилтот цаг
  const diff=elapsed-target;
  const absDiff=Math.abs(diff);
  const answerId=session.roundIndex+'_'+f1PlayerId;
  try{
    await withTimeout(
      setDoc(doc(fsdb,'f1_sessions',f1SessionId,'answers',answerId),{playerId:f1PlayerId,playerName:f1PlayerName,roundIndex:session.roundIndex,targetSec:target,elapsedSec:Math.round(elapsed*1000)/1000,diffSec:Math.round(diff*1000)/1000,absDiffSec:Math.round(absDiff*1000)/1000,at:Date.now()}),
      8000, 'f1SubmitAnswer'
    );
  }catch(e){
    console.error('[F1] answer submit err',e);
    const msg=String(e&&e.code||e&&e.message||'');
    if(msg.includes('permission-denied')) return;
    if(txtEl) txtEl.textContent='Илгээхэд алдаа гарлаа. Сүлжээгээ шалгаад дахин оролдоно уу.';
    if(stuckBtn) stuckBtn.style.display='inline-block';
  }
}
function f1RetryLastAnswer(){
  if(!f1LastAnswerAttempt) return;
  const stuckBtn=document.getElementById('f1StuckBtn'); if(stuckBtn) stuckBtn.style.display='none';
  f1DoSubmitAnswer(f1LastAnswerAttempt.elapsed);
}
function f1RenderPlayReveal(session){
  f1HideAllPlaySubs();
  qrPlayRevealFanfare();
  const el=document.getElementById('f1PlayReveal'); el.style.display='block';
  const mine=(session.standings||[]).find(s=>s.id===f1PlayerId);
  const rank=mine?(session.standings.indexOf(mine)+1):null;
  el.innerHTML=`<div class="qr-play-reveal-icon">${mine&&rank===1?'🏆':'🏁'}</div><div class="qr-play-wait-txt" style="margin-bottom:6px;">Дундаж зөрүү: ${mine?mine.avgAbsDiff.toFixed(3):'-'}с</div><div class="qr-play-reveal-rank">${rank?'Одоогийн байр: '+rank+' / '+session.standings.length:''}</div>`;
}
async function f1RenderPlayFinal(session){
  f1HideAllPlaySubs();
  const el=document.getElementById('f1PlayFinal'); el.style.display='block';
  const mine=(session.standings||[]).find(s=>s.id===f1PlayerId);
  const rank=mine?session.standings.indexOf(mine)+1:'-';
  const medals={1:'🥇',2:'🥈',3:'🥉'};
  el.innerHTML=`<div class="qr-play-final-rank">${medals[rank]||('#'+rank)}</div><div class="qr-play-wait-txt" style="margin-bottom:10px;">Тэмцээн дууслаа!</div><div class="qr-play-final-score">Дундаж: ${mine?mine.avgAbsDiff.toFixed(3):'-'}с</div><div class="qr-play-final-detail">${mine?mine.rounds:0} раунд</div><div class="f1-rounds-breakdown" id="f1PlayRoundsBreakdown">Ачааллаж байна…</div><button class="qr-join-go-btn" style="margin-top:26px;" onclick="f1PlayerLeaveToHome()">Гарах</button>`;
  try{
    const snap=await getDocs(query(collection(fsdb,'f1_sessions',f1SessionId,'answers'), where('playerId','==',f1PlayerId)));
    const mine2=[]; snap.forEach(d=>mine2.push(d.data()));
    mine2.sort((a,b)=>a.roundIndex-b.roundIndex);
    const bd=document.getElementById('f1PlayRoundsBreakdown');
    if(bd){
      bd.innerHTML=mine2.map(a=>{
        const cls=a.absDiffSec<0.005?'perfect':(a.diffSec>0?'over':'under');
        return `<div class="f1-round-row"><span>Раунд ${a.roundIndex+1}</span><span class="f1-round-diff ${cls}">${f1FmtDiff(a.diffSec)}</span></div>`;
      }).join('');
    }
  }catch(e){ console.error('[F1] rounds breakdown fetch err',e); const bd=document.getElementById('f1PlayRoundsBreakdown'); if(bd) bd.innerHTML=''; }
}
function f1RenderPlayCancelled(){
  f1HideAllPlaySubs();
  const el=document.getElementById('f1PlayFinal'); el.style.display='block';
  el.innerHTML=`<div class="qr-play-final-rank">😕</div><div class="qr-play-wait-txt">Хост тэмцээнийг цуцалсан байна.</div><button class="qr-join-go-btn" style="margin-top:26px;" onclick="f1PlayerLeaveToHome()">Гарах</button>`;
}
function f1PlayerLeaveToHome(){
  f1HostCleanupListeners();
  if(f1PlayKeyHandler){document.removeEventListener('keydown',f1PlayKeyHandler);f1PlayKeyHandler=null;}
  f1SessionId=null; f1CurSession=null; f1PlayerHasAnswered=false; f1LastRenderedPhaseKey=null;
  showF1Home();
}

window.showF1Home=showF1Home;window.f1SetMode=f1SetMode;window.f1SetCount=f1SetCount;
window.f1StartSolo=f1StartSolo;window.f1SoloExit=f1SoloExit;window.f1DelScore=f1DelScore;
window.f1HostStart=f1HostStart;window.f1HostBeginGame=f1HostBeginGame;window.f1HostSetTargetAndStart=f1HostSetTargetAndStart;window.f1HostStartGapRound=f1HostStartGapRound;window.f1HostCancelSession=f1HostCancelSession;window.f1HostReveal=f1HostReveal;window.f1HostNextRound=f1HostNextRound;window.f1HostEndGame=f1HostEndGame;window.f1HostFinishSession=f1HostFinishSession;
window.showF1Join=showF1Join;window.f1DoJoin=f1DoJoin;window.f1RetryLastAnswer=f1RetryLastAnswer;window.f1PlayerLeaveToHome=f1PlayerLeaveToHome;




// ── НҮҮР ──
async function showCDHome(){
  setAllInactive();
  document.getElementById('cdHomeScreen').classList.add('active');
  document.getElementById('navCD').classList.add('active');
  activeGame='cd';
  buildCDFloatingBG();
  await cdLoadQuizzes();
  cdRenderHome();
}
function buildCDFloatingBG(){
  const wrap=document.getElementById('cdFloatBg'); if(!wrap||wrap.childElementCount)return;
  for(let i=0;i<14;i++){
    const s=document.createElement('div'); s.className='cd-float-shape';
    s.textContent=CD_SHAPES[i%CD_SHAPES.length];
    s.style.top=(4+((i*37)%90))+'%'; s.style.left=(2+((i*53)%94))+'%';
    s.style.animationDelay=(i*0.7)+'s'; s.style.animationDuration=(9+(i%5)*1.8)+'s';
    s.style.fontSize=(16+(i%4)*8)+'px';
    wrap.appendChild(s);
  }
}
async function cdLoadQuizzes(){
  try{
    const snap=await getDocs(collection(fsdb,'count_quizzes'));
    cdQuizzes=[]; snap.forEach(d=>cdQuizzes.push({id:d.id,...d.data()}));
  }catch(e){console.error('[CD] load quizzes err',e); cdQuizzes=[];}
}
function cdRenderHome(){
  const g=document.getElementById('cdQuizGrid'); if(!g)return; g.innerHTML='';
  if(!currentUser){
    g.innerHTML='<div class="rounds-title" style="grid-column:1/-1;">Тоолгын сан үүсгэхийн тулд эхлээд нэвтэрнэүү.</div>';
    return;
  }
  const nb=document.createElement('button'); nb.className='btn-new-round cd'; nb.textContent='+ Шинэ тоолгын сан';
  nb.onclick=()=>cdOpenEditor(null);
  g.appendChild(nb);
  cdQuizzes.forEach(qz=>{
    const d=document.createElement('div'); d.className='qr-quiz-card';
    const rCount=(qz.rounds||[]).length;
    const mine=canManageRound(qz);
    const delBtn=mine?`<button class="qr-quiz-card-del" onclick="cdDeleteQuiz(event,'${qz.id}')">✕</button>`:'';
    const editBtn=mine?`<button onclick="cdOpenEditor('${qz.id}')">✎ Засах</button>`:'';
    d.innerHTML=`
      ${delBtn}
      <div class="qr-quiz-card-name">${escH(qz.name)}</div>
      <div class="qr-quiz-card-meta">${rCount} раундтай</div>
      <div class="qr-quiz-card-btns">
        ${editBtn}
        <button class="qr-host-cta" onclick="qrShowTimeAdjust('${qz.id}','cdhost')">▶ Хост эхлүүлэх</button>
      </div>`;
    g.appendChild(d);
  });
  const iw=document.getElementById('cdImportWrap'); if(iw)iw.style.display=isAdmin?'block':'none';
}
async function cdImportJSON(input){
  const file=input.files[0]; if(!file)return;
  if(!currentUser){notify('Import хийхийн тулд эхлээд нэвтэрнэ үү!');input.value='';return;}
  try{
    const text=await file.text(); const data=JSON.parse(text);
    if(!Array.isArray(data)){notify('Буруу формат');return;}
    const okStruct=(z)=>z&&z.id&&z.name&&Array.isArray(z.rounds)&&z.rounds.every(r=>r&&r.shape&&typeof r.count==='number'&&r.count>0);
    let added=0, failed=0;
    for(const z of data){
      if(!okStruct(z)){failed++;continue;}
      const id='cd'+Date.now()+Math.random().toString(36).slice(2,6);
      const quizObj={id,name:z.name,ownerId:currentUser.uid,rounds:z.rounds.map(r=>({shape:r.shape,count:r.count,showTime:r.showTime||5,answerTime:r.answerTime||15,pts:r.pts||1000}))};
      try{ await setDoc(doc(fsdb,'count_quizzes',id), quizObj); added++; }catch(e){failed++;console.error('cd import save err:',e);}
    }
    await cdLoadQuizzes(); cdRenderHome();
    if(added>0 && failed===0) notify(`${added} тоолгын сан import хийгдэж хадгалагдлаа!`);
    else if(added>0) notify(`${added} сан хадгалагдлаа, ${failed} нь алдаатай.`,5000);
    else notify('Import хийх боломжтой зөв бүтэцтэй сан олдсонгүй.',5000);
  }catch(e){notify('Алдаа!');console.error(e);}
  input.value='';
}

// ── EDITOR ──
function cdOpenEditor(quizId){
  setAllInactive();
  document.getElementById('cdEditorScreen').classList.add('active');
  if(quizId){
    const qz=cdQuizzes.find(q=>q.id===quizId);
    cdCurQuizId=quizId;
    cdRoundsBuf=qz?JSON.parse(JSON.stringify(qz.rounds||[])):[];
    document.getElementById('cdQuizNameInp').value=qz?qz.name:'';
  }else{
    cdCurQuizId=null; cdRoundsBuf=[];
    document.getElementById('cdQuizNameInp').value='';
  }
  cdRenderRoundList();
}
function cdRenderRoundList(){
  const list=document.getElementById('cdRoundList'); if(!list)return; list.innerHTML='';
  if(cdRoundsBuf.length===0){
    list.innerHTML='<div class="rounds-title">Одоохондоо раунд алга. Доорх товчоор нэмнэ үү.</div>';
    return;
  }
  cdRoundsBuf.forEach((r,i)=>{
    const d=document.createElement('div'); d.className='qr-qcard';
    d.onclick=()=>cdOpenREditor(i);
    d.innerHTML=`<span class="qr-qcard-num">${i+1}</span><div class="qr-qcard-body"><div class="qr-qcard-text">${r.shape} × ${r.count}</div><div class="qr-qcard-meta">Харуулах ${r.showTime}с · Хариулах ${r.answerTime}с · ${r.pts} оноо</div></div>`;
    list.appendChild(d);
  });
}
function cdOpenREditor(index){
  cdEditRIndex=index;
  const r=index>=0?cdRoundsBuf[index]:{shape:'⭐',count:8,showTime:5,answerTime:15,pts:1000};
  cdSelectedShape=r.shape;
  const picker=document.getElementById('cdShapePicker');
  picker.innerHTML=CD_SHAPES.map(s=>`<div class="cd-shape-opt ${s===cdSelectedShape?'selected':''}" onclick="cdPickShape('${s}')">${s}</div>`).join('');
  document.getElementById('cdRmCount').value=r.count;
  document.getElementById('cdRmPts').value=String(r.pts);
  document.getElementById('cdRmShow').value=String(r.showTime);
  document.getElementById('cdRmAns').value=String(r.answerTime);
  document.getElementById('cdRmDelBtn').style.display=index>=0?'inline-block':'none';
  document.getElementById('cdROv').classList.add('open');
}
function cdPickShape(s){
  cdSelectedShape=s;
  document.querySelectorAll('.cd-shape-opt').forEach(el=>el.classList.toggle('selected', el.textContent===s));
}
function cdCloseREditor(){ document.getElementById('cdROv').classList.remove('open'); }
function cdSaveRFromEditor(){
  const count=parseInt(document.getElementById('cdRmCount').value);
  const pts=parseInt(document.getElementById('cdRmPts').value);
  const showTime=parseInt(document.getElementById('cdRmShow').value);
  const answerTime=parseInt(document.getElementById('cdRmAns').value);
  if(!count||count<1||count>40){notify('Тоо 1-40 хооронд байх ёстой');return;}
  const rObj={shape:cdSelectedShape,count,showTime,answerTime,pts};
  if(cdEditRIndex>=0) cdRoundsBuf[cdEditRIndex]=rObj; else cdRoundsBuf.push(rObj);
  cdCloseREditor(); cdRenderRoundList();
}
function cdDeleteRFromEditor(){
  if(cdEditRIndex<0)return;
  cdRoundsBuf.splice(cdEditRIndex,1);
  cdCloseREditor(); cdRenderRoundList();
}
async function cdSaveQuizMeta(){
  if(!currentUser){notify('Эхлээд нэвтэрнэ үү!');return;}
  const name=document.getElementById('cdQuizNameInp').value.trim()||'Нэргүй сан';
  const id=cdCurQuizId||('cd'+Date.now());
  const data={id,name,ownerId:currentUser.uid,rounds:cdRoundsBuf};
  try{
    await setDoc(doc(fsdb,'count_quizzes',id),data);
    notify('Хадгалагдлаа! ✓');
    cdCurQuizId=id;
    await cdLoadQuizzes();
    showCDHome();
  }catch(e){console.error(e);notify('Хадгалахад алдаа гарлаа');}
}
async function cdDeleteQuiz(e,id){
  e.stopPropagation();
  if(!confirm('Энэ тоолгын сан болон бүх раундыг устгах уу?'))return;
  try{
    await deleteDoc(doc(fsdb,'count_quizzes',id));
    cdQuizzes=cdQuizzes.filter(q=>q.id!==id);
    cdRenderHome();
  }catch(e){console.error(e);notify('Устгахад алдаа гарлаа');}
}

// ── HOST: session, lobby ──
async function cdHostStart(quizId, timeDelta){
  if(!currentUser){openLogin();return;}
  if(!await hasActiveSubscription()){showSubRequired();return;}
  const quiz=cdQuizzes.find(q=>q.id===quizId);
  if(!quiz||!quiz.rounds||quiz.rounds.length===0){notify('Энэ санд раунд байхгүй байна. Эхлээд раунд нэмнэ үү.');return;}
  const delta=timeDelta||0;
  // CountDash: харах хугацаанд хагасыг, хариулах хугацаанд бүтнийг нь нэмнэ (харах хугацаа хэт удаан болохоос сэргийлнэ)
  cdCurQuizCache = delta===0 ? quiz : {...quiz, rounds: quiz.rounds.map(r=>({...r, showTime:Math.max(2, r.showTime+Math.round(delta/2)), answerTime:Math.max(5, r.answerTime+delta)}))};
  const code=await qrGenUniqueCode('count_sessions');
  const sid='cs'+Date.now();
  const sessionData={id:sid,code,quizId,quizName:quiz.name,hostId:currentUser.uid,phase:'lobby',qIndex:-1,totalQ:quiz.rounds.length,qStartedAt:0,standings:[],createdAt:Date.now()};
  try{
    await setDoc(doc(fsdb,'count_sessions',sid),sessionData);
    cdSessionId=sid; cdIsHost=true; cdCurSession=sessionData; cdLastRenderedPhaseKey=null;
    showCDLobby();
  }catch(e){console.error(e);notify('Сесс үүсгэхэд алдаа гарлаа');}
}
function showCDLobby(){
  setAllInactive();
  document.getElementById('cdHostLobbyScreen').classList.add('active');
  document.getElementById('cdLobbyQuizName').textContent=cdCurSession.quizName;
  document.getElementById('cdPinBox').textContent=cdCurSession.code;
  const joinUrl='https://bolorgames.com/?cjoin='+cdCurSession.code;
  document.getElementById('cdQrImg').src='https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data='+encodeURIComponent(joinUrl);
  cdHostSubscribeLobbyPlayers();
  cdSubscribeSession();
}
let cdPlayersRetryCount=0, cdPlayersRetryTimer=null;
function cdHostSubscribeLobbyPlayers(){
  if(cdUnsubPlayers) cdUnsubPlayers();
  if(cdPlayersRetryTimer){clearTimeout(cdPlayersRetryTimer);cdPlayersRetryTimer=null;}
  const mySid=cdSessionId;
  cdUnsubPlayers=onSnapshot(collection(fsdb,'count_sessions',mySid,'players'), snap=>{
    cdPlayersRetryCount=0;
    const players=[]; snap.forEach(d=>players.push({id:d.id,...d.data()}));
    cdCurrentPlayerCount=players.length;
    const cntEl=document.getElementById('cdPlayerCount'); if(cntEl)cntEl.textContent=players.length;
    const list=document.getElementById('cdLobbyPlayers');
    if(list) list.innerHTML=players.map(p=>`<span class="qr-player-chip">${escH(p.name)}</span>`).join('');
    const startBtn=document.getElementById('cdStartBtn');
    if(startBtn){ startBtn.disabled=players.length===0; startBtn.textContent=players.length===0?'Тоглогч хүлээж байна…':`▶ Эхлүүлэх (${players.length})`; }
  }, err=>{
    console.error('[CD] players listen err',err);
    if(cdSessionId!==mySid) return;
    cdPlayersRetryCount++;
    if(cdPlayersRetryCount<=8){ cdPlayersRetryTimer=setTimeout(()=>{ if(cdSessionId===mySid) cdHostSubscribeLobbyPlayers(); }, Math.min(1500*cdPlayersRetryCount,8000)); }
    else notify('Тоглогчидтой холбогдоход алдаа гарлаа. Хуудсаа шинэчилнэ үү.',6000);
  });
}
let cdSessionRetryCount=0, cdSessionRetryTimer=null;
function cdSubscribeSession(){
  if(cdUnsubSession) cdUnsubSession();
  if(cdSessionRetryTimer){clearTimeout(cdSessionRetryTimer);cdSessionRetryTimer=null;}
  const mySid=cdSessionId;
  cdUnsubSession=onSnapshot(doc(fsdb,'count_sessions',mySid), snap=>{
    cdSessionRetryCount=0;
    if(!snap.exists())return;
    cdCurSession={id:snap.id,...snap.data()};
    if(cdIsHost) cdHostHandleSessionUpdate(cdCurSession);
    else cdPlayerHandleSessionUpdate(cdCurSession);
  }, err=>{
    console.error('[CD] session listen err',err);
    if(cdSessionId!==mySid) return;
    cdSessionRetryCount++;
    if(cdSessionRetryCount===1) notify('Холболт тасарлаа, автоматаар дахин холбогдож байна…',4000);
    if(cdSessionRetryCount<=8){
      cdSessionRetryTimer=setTimeout(()=>{ if(cdSessionId===mySid) cdSubscribeSession(); }, Math.min(1500*cdSessionRetryCount,8000));
    }else{
      notify('Холболт сэргээгдсэнгүй. Хуудсаа шинэчилнэ үү.',8000);
    }
  });
}
async function cdHostBeginGame(){
  try{ await setDoc(doc(fsdb,'count_sessions',cdSessionId),{...cdCurSession,phase:'question',qIndex:0,qStartedAt:Date.now()},{merge:true}); }
  catch(e){console.error(e);notify('Эхлүүлэхэд алдаа гарлаа');}
}
function cdHostCancelSession(){
  if(!confirm('Тэмцээнийг цуцлах уу?'))return;
  if(cdSessionId){ setDoc(doc(fsdb,'count_sessions',cdSessionId),{phase:'cancelled'},{merge:true}).catch(()=>{}); }
  cdHostCleanupListeners();
  cdSessionId=null; cdIsHost=false; cdCurSession=null;
  showCDHome();
}
function cdHostCleanupListeners(){
  if(cdUnsubSession){cdUnsubSession();cdUnsubSession=null;}
  if(cdUnsubPlayers){cdUnsubPlayers();cdUnsubPlayers=null;}
  if(cdUnsubAnswers){cdUnsubAnswers();cdUnsubAnswers=null;}
  if(cdHostTimerInterval){clearInterval(cdHostTimerInterval);cdHostTimerInterval=null;}
  if(cdPlayTimerInterval){clearInterval(cdPlayTimerInterval);cdPlayTimerInterval=null;}
  if(cdAutoNextTimeout){clearTimeout(cdAutoNextTimeout);cdAutoNextTimeout=null;}
  if(cdSessionRetryTimer){clearTimeout(cdSessionRetryTimer);cdSessionRetryTimer=null;}
  if(cdPlayersRetryTimer){clearTimeout(cdPlayersRetryTimer);cdPlayersRetryTimer=null;}
  if(cdAnswersRetryTimer){clearTimeout(cdAnswersRetryTimer);cdAnswersRetryTimer=null;}
  cdCurrentPlayerCount=0;
}

// ── HOST: тоглоомын явц ──
function cdHostHandleSessionUpdate(session){
  if(!cdIsHost) return;
  const key=session.phase+':'+session.qIndex;
  if(session.phase==='question'){
    if(cdLastRenderedPhaseKey!==key){
      setAllInactive();
      document.getElementById('cdHostGameScreen').classList.add('active');
      cdHostRenderQuestion(session);
      cdLastRenderedPhaseKey=key;
    }
  }else if(session.phase==='reveal'){
    if(cdLastRenderedPhaseKey!==key){ cdHostRenderReveal(session); cdLastRenderedPhaseKey=key; }
  }else if(session.phase==='ended'){
    if(cdLastRenderedPhaseKey!=='ended'){ cdHostRenderEnded(session); cdLastRenderedPhaseKey='ended'; }
  }
}
function cdBuildStage(round){
  const stage=document.getElementById('cdStage'); stage.innerHTML='';
  const cover=document.getElementById('cdStageCover'); cover.classList.remove('show');
  const n=round.count;
  // Сеткэн байршил — тоолоход хялбар, давхцахгүй, гэхдээ шулуун мөр биш санагдуулах бага зэргийн життэртэй
  const cols=Math.max(1, Math.ceil(Math.sqrt(n*1.8)));
  const rows=Math.max(1, Math.ceil(n/cols));
  const cells=[];
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) cells.push({r,c});
  for(let i=cells.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [cells[i],cells[j]]=[cells[j],cells[i]]; }
  const cellW=100/cols, cellH=100/rows;
  const pad=Math.min(cellW,cellH)*0.22;
  for(let i=0;i<n;i++){
    const {r,c}=cells[i];
    const jitterX=(Math.random()-0.5)*(cellW-pad*2);
    const jitterY=(Math.random()-0.5)*(cellH-pad*2);
    const left=c*cellW+cellW/2+jitterX;
    const top=r*cellH+cellH/2+jitterY;
    const el=document.createElement('div'); el.className='cd-stage-item';
    el.style.left=Math.max(3,Math.min(97,left))+'%';
    el.style.top=Math.max(4,Math.min(96,top))+'%';
    el.style.transform='translate(-50%,-50%)';
    // "Навч салхинд хийсэх" — санамсаргүй чиглэлээс орж ирээд, жижигхэн налуутайгаар зогсоно
    const ang=Math.random()*Math.PI*2, dist=90+Math.random()*70;
    const dx=Math.round(Math.cos(ang)*dist), dy=Math.round(Math.sin(ang)*dist);
    const rotIn=Math.round(Math.random()*360-180), rotRest=Math.round(Math.random()*26-13);
    const inner=document.createElement('span'); inner.className='cd-stage-item-inner'; inner.textContent=round.shape;
    inner.style.fontSize='inherit';
    inner.style.setProperty('--dx', dx+'px'); inner.style.setProperty('--dy', dy+'px');
    inner.style.setProperty('--rot', rotIn+'deg'); inner.style.setProperty('--rot2', rotRest+'deg');
    inner.style.animationDelay=(i*0.035)+'s';
    el.appendChild(inner);
    stage.appendChild(el);
  }
}
function cdHostRenderQuestion(session){
  const round=cdCurQuizCache.rounds[session.qIndex];
  document.getElementById('cdHostQNum').textContent=`Раунд ${session.qIndex+1}/${session.totalQ}`;
  const feedList=document.getElementById('cdLiveFeedList');
  if(feedList) feedList.innerHTML='<div class="cd-feed-empty">Одоогоор хэн ч хариулаагүй</div>';
  cdBuildStage(round);
  document.getElementById('cdHostLeaderboard').style.display='none';
  document.getElementById('cdHostActions').innerHTML=`<button onclick="cdHostReveal()">Хариу харуулах ⏹</button>`;
  cdHostStartTimerBar(round, session.qStartedAt);
  cdHostSubscribeAnswerCount(session.qIndex);
}
function cdHostStartTimerBar(round, startedAt){
  if(cdHostTimerInterval) clearInterval(cdHostTimerInterval);
  const bar=document.getElementById('cdHostTimerBar');
  const cover=document.getElementById('cdStageCover');
  const cdEl=document.getElementById('cdCoverCountdown');
  const total=round.showTime+round.answerTime;
  let lastSec=-1;
  const tick=()=>{
    const elapsed=(Date.now()-startedAt)/1000;
    const pct=Math.max(0,100*(1-elapsed/total));
    if(bar) bar.style.width=pct+'%';
    if(elapsed>=round.showTime){
      if(cover && !cover.classList.contains('show')){
        cover.classList.add('show');
        document.querySelectorAll('#cdStage .cd-stage-item').forEach(el=>el.classList.add('cd-blow-out'));
        cdPlayConfirmBlip();
      }
      const remainAns=Math.max(0, round.showTime+round.answerTime-elapsed);
      const secLeft=Math.ceil(remainAns);
      if(cdEl) cdEl.textContent=secLeft;
      if(secLeft!==lastSec && secLeft>=0 && secLeft<=round.answerTime){
        lastSec=secLeft;
        cdPlayTensionTick(remainAns/round.answerTime);
      }
    }
    if(elapsed>=total){clearInterval(cdHostTimerInterval);cdHostTimerInterval=null;}
  };
  tick(); cdHostTimerInterval=setInterval(tick,100);
}
let cdAnswersRetryCount=0, cdAnswersRetryTimer=null;
function cdHostSubscribeAnswerCount(qIndex){
  if(cdUnsubAnswers) cdUnsubAnswers();
  if(cdAnswersRetryTimer){clearTimeout(cdAnswersRetryTimer);cdAnswersRetryTimer=null;}
  const mySid=cdSessionId;
  let autoRevealed=false;
  cdUnsubAnswers=onSnapshot(query(collection(fsdb,'count_sessions',mySid,'answers'), where('qIndex','==',qIndex)), snap=>{
    cdAnswersRetryCount=0;
    const el=document.getElementById('cdHostAnsCount'); if(el)el.textContent=snap.size+' хариулсан';
    cdLastAnswerSnapCache=[]; snap.forEach(d=>cdLastAnswerSnapCache.push(d.data()));
    const feedList=document.getElementById('cdLiveFeedList');
    if(feedList){
      feedList.innerHTML = cdLastAnswerSnapCache.length
        ? cdLastAnswerSnapCache.map((a,i)=>`<div class="cd-feed-item" style="animation-delay:${i*0.04}s"><span class="cd-feed-check">✓</span>${escH(a.playerName)}</div>`).join('')
        : '<div class="cd-feed-empty">Одоогоор хэн ч хариулаагүй</div>';
    }
    if(!autoRevealed && cdCurSession && cdCurSession.phase==='question' && cdCurSession.qIndex===qIndex
       && snap.size>0 && cdCurrentPlayerCount>0 && snap.size>=cdCurrentPlayerCount){
      autoRevealed=true;
      cdHostReveal();
    }
  }, err=>{
    console.error('[CD] answers listen err',err);
    if(cdSessionId!==mySid) return;
    cdAnswersRetryCount++;
    if(cdAnswersRetryCount<=8){ cdAnswersRetryTimer=setTimeout(()=>{ if(cdSessionId===mySid) cdHostSubscribeAnswerCount(qIndex); }, Math.min(1500*cdAnswersRetryCount,8000)); }
    else notify('Хариултын мэдээлэл авахад алдаа гарлаа.',5000);
  });
}
function cdHostReveal(){
  if(cdHostTimerInterval){clearInterval(cdHostTimerInterval);cdHostTimerInterval=null;}
  if(cdUnsubAnswers){cdUnsubAnswers();cdUnsubAnswers=null;}
  if(cdAnswersRetryTimer){clearTimeout(cdAnswersRetryTimer);cdAnswersRetryTimer=null;}
  cdHostComputeStandingsAndReveal();
}
async function cdHostComputeStandingsAndReveal(){
  try{
    const [playersSnap,answersSnap]=await withTimeout(Promise.all([
      getDocs(collection(fsdb,'count_sessions',cdSessionId,'players')),
      getDocs(collection(fsdb,'count_sessions',cdSessionId,'answers'))
    ]), 8000, 'cdRevealFetch');
    const totals={},names={};
    playersSnap.forEach(d=>{totals[d.id]=0;names[d.id]=d.data().name;});
    answersSnap.forEach(d=>{const a=d.data();totals[a.playerId]=(totals[a.playerId]||0)+(a.pts||0);if(!names[a.playerId])names[a.playerId]=a.playerName;});
    const standings=Object.keys(totals).map(id=>({id,name:names[id]||'???',score:totals[id]})).sort((a,b)=>b.score-a.score).slice(0,15);
    await withTimeout(setDoc(doc(fsdb,'count_sessions',cdSessionId),{...cdCurSession,phase:'reveal',standings},{merge:true}), 8000, 'cdRevealWrite');
  }catch(e){
    console.error(e);
    const msg=String(e&&e.message||'');
    notify(msg.includes('TIMEOUT')?'Сүлжээ удаан байна — «Хариу харуулах»-ыг дахин дарна уу.':'Алдаа гарлаа: '+String(e).slice(0,80), 6000);
  }
}
function cdHostRenderReveal(session){
  setAllInactive();
  document.getElementById('cdHostGameScreen').classList.add('active');
  cdPlayRevealChime();
  const round=cdCurQuizCache.rounds[session.qIndex];
  document.getElementById('cdHostQNum').textContent=`Раунд ${session.qIndex+1}/${session.totalQ} — Зөв хариу: ${round.count} ${round.shape}`;
  const bar=document.getElementById('cdHostTimerBar'); if(bar)bar.style.width='0%';
  document.getElementById('cdStageCover').classList.remove('show');
  cdBuildStage(round);
  const total=(cdLastAnswerSnapCache||[]).length;
  document.getElementById('cdHostAnsCount').textContent=total+' хариулсан';
  const isLast=session.qIndex>=session.totalQ-1;
  const autoTxt=document.getElementById('cdAutoNextTxt');
  if(cdAutoNextTimeout){clearTimeout(cdAutoNextTimeout);cdAutoNextTimeout=null;}
  if(isLast){
    document.getElementById('cdHostActions').innerHTML=`<button onclick="cdHostEndGame()">🏁 Тэмцээн дуусгах</button>`;
    if(autoTxt) autoTxt.style.display='none';
  }else{
    document.getElementById('cdHostActions').innerHTML=`<button onclick="cdHostNextNow()">Одоо үргэлжлүүлэх →</button>`;
    if(autoTxt){ autoTxt.style.display='block'; }
    let secLeft=3;
    const upd=()=>{ if(autoTxt) autoTxt.textContent=`Дараагийн раунд ${secLeft} секундын дараа автоматаар эхэлнэ…`; };
    upd();
    const iv=setInterval(()=>{ secLeft--; if(secLeft>0) upd(); else clearInterval(iv); },1000);
    cdAutoNextTimeout=setTimeout(()=>{ clearInterval(iv); cdHostNextQuestion(); }, 3000);
  }
  const lb=document.getElementById('cdHostLeaderboard');
  lb.style.display='block';
  lb.innerHTML='<div class="rounds-title" style="margin:20px 0 10px;">🏆 Тэргүүлэгчид</div>'+(session.standings||[]).slice(0,5).map((s,i)=>`<div class="qr-lb-row" style="animation-delay:${i*0.08}s"><span class="qr-lb-rank">${i+1}</span><span class="qr-lb-name">${escH(s.name)}</span><span class="qr-lb-score">${s.score}</span></div>`).join('');
}
function cdHostNextNow(){
  if(cdAutoNextTimeout){clearTimeout(cdAutoNextTimeout);cdAutoNextTimeout=null;}
  cdHostNextQuestion();
}
let cdNextInFlight=false;
async function cdHostNextQuestion(){
  if(cdNextInFlight) return; cdNextInFlight=true;
  if(cdAutoNextTimeout){clearTimeout(cdAutoNextTimeout);cdAutoNextTimeout=null;}
  const nextIdx=cdCurSession.qIndex+1;
  try{ await setDoc(doc(fsdb,'count_sessions',cdSessionId),{...cdCurSession,phase:'question',qIndex:nextIdx,qStartedAt:Date.now()},{merge:true}); }
  catch(e){console.error(e);notify('Алдаа гарлаа');}
  finally{ cdNextInFlight=false; }
}
async function cdHostEndGame(){
  try{ await setDoc(doc(fsdb,'count_sessions',cdSessionId),{...cdCurSession,phase:'ended'},{merge:true}); }
  catch(e){console.error(e);notify('Алдаа гарлаа');}
}
function cdHostRenderEnded(session){
  setAllInactive();
  document.getElementById('cdHostGameScreen').classList.add('active');
  document.getElementById('cdHostQNum').textContent='Тэмцээн дууслаа 🏁';
  const bar=document.getElementById('cdHostTimerBar'); if(bar)bar.style.width='0%';
  document.getElementById('cdHostAnsCount').textContent='';
  document.getElementById('cdStage').innerHTML=''; document.getElementById('cdStageCover').classList.remove('show');
  const medals=['🥇','🥈','🥉'];
  const lb=document.getElementById('cdHostLeaderboard');
  lb.style.display='block';
  lb.innerHTML='<div class="qr-podium-wrap"><div class="qr-podium-emoji">🎉</div></div>'+(session.standings||[]).slice(0,10).map((s,i)=>`<div class="qr-lb-row" style="animation-delay:${i*0.08}s"><span class="qr-lb-rank">${medals[i]||(i+1)}</span><span class="qr-lb-name">${escH(s.name)}</span><span class="qr-lb-score">${s.score}</span></div>`).join('');
  document.getElementById('cdHostActions').innerHTML=`<button onclick="cdHostFinishSession()">✓ Дуусгаад гарах</button>`;
}
function cdHostFinishSession(){
  cdHostCleanupListeners();
  cdSessionId=null; cdIsHost=false; cdCurSession=null; cdLastRenderedPhaseKey=null;
  showCDHome();
}

// ── PLAYER: нэгдэх, тоглох ──
function showCDJoin(prefillCode){
  setAllInactive();
  document.getElementById('cdJoinScreen').classList.add('active');
  document.getElementById('cdJoinErr').textContent='';
  document.getElementById('cdJoinCodeInp').value=prefillCode||'';
  document.getElementById('cdJoinNameInp').value=cdPlayerName||'';
  setTimeout(()=>{ const el=prefillCode?document.getElementById('cdJoinNameInp'):document.getElementById('cdJoinCodeInp'); if(el)el.focus(); },200);
}
async function cdDoJoin(){
  const code=document.getElementById('cdJoinCodeInp').value.trim();
  const name=document.getElementById('cdJoinNameInp').value.trim();
  const errEl=document.getElementById('cdJoinErr'); errEl.textContent='';
  if(!/^\d{6}$/.test(code)){errEl.textContent='6 оронтой код оруулна уу';return;}
  if(!name){errEl.textContent='Нэрээ оруулна уу';return;}
  if(name.length>20){errEl.textContent='Нэр 20 тэмдэгтээс ихгүй байх';return;}
  const btn=document.getElementById('cdJoinGoBtn');
  if(btn){ btn.disabled=true; btn.textContent='Холбогдож байна…'; }
  try{
    const snap=await withTimeout(getDocs(query(collection(fsdb,'count_sessions'), where('code','==',code))), 8000, 'cdFindSession');
    const candidates=[];
    const staleCutoff=Date.now()-12*60*60*1000;
    snap.forEach(d=>{ const data=d.data(); if(data.phase!=='ended'&&data.phase!=='cancelled' && (data.createdAt||0)>=staleCutoff) candidates.push({id:d.id,...data}); });
    candidates.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
    const found=candidates[0]||null;
    if(!found){errEl.textContent='Ийм код олдсонгүй эсвэл тэмцээн дууссан байна';return;}
    cdSessionId=found.id; cdCurSession=found; cdIsHost=false; cdPlayerName=name;
    cdPlayerId=localStorage.getItem('cd_pid_'+cdSessionId)||('p'+Date.now()+Math.random().toString(36).slice(2,8));
    localStorage.setItem('cd_pid_'+cdSessionId, cdPlayerId);
    const quizSnap=await withTimeout(getDoc(doc(fsdb,'count_quizzes',found.quizId)), 8000, 'cdFindQuiz');
    if(!quizSnap.exists()){ errEl.textContent='Тэмцээний тоолгын сан олдсонгүй. Хосттой холбогдоно уу.'; return; }
    cdCurQuizCache={id:quizSnap.id,...quizSnap.data()};
    await withTimeout(setDoc(doc(fsdb,'count_sessions',cdSessionId,'players',cdPlayerId),{name,joinedAt:Date.now()}), 8000, 'cdJoinWrite');
    cdPlayerHasAnswered=false; cdLastRenderedPhaseKey=null;
    showCDPlay();
  }catch(e){
    console.error(e);
    const msg=String(e&&e.message||'');
    errEl.textContent=msg.includes('TIMEOUT')?'Сүлжээ удаан байна. Дахин оролдоно уу.':'Холбогдоход алдаа гарлаа. Дахин оролдоно уу.';
  }finally{
    if(btn){ btn.disabled=false; btn.textContent='Нэгдэх →'; }
  }
}
function showCDPlay(){
  setAllInactive();
  document.getElementById('cdPlayScreen').classList.add('active');
  document.getElementById('cdPlayMyName').textContent=cdPlayerName;
  cdSubscribeSession();
}
function cdHideAllPlaySubs(){
  ['cdPlayWaiting','cdPlayWatch','cdPlayInput','cdPlaySubmitted','cdPlayReveal','cdPlayFinal'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.style.display='none';
  });
}
function cdPlayerHandleSessionUpdate(session){
  if(cdIsHost) return;
  const key=session.phase+':'+session.qIndex;
  if(session.phase==='lobby'){
    cdHideAllPlaySubs(); document.getElementById('cdPlayWaiting').style.display='flex';
  }else if(session.phase==='question'){
    if(cdLastRenderedPhaseKey!==key){ cdPlayerRunQuestionPhase(session); cdLastRenderedPhaseKey=key; }
  }else if(session.phase==='reveal'){
    if(cdLastRenderedPhaseKey!==key){ cdRenderPlayReveal(session); cdLastRenderedPhaseKey=key; }
  }else if(session.phase==='ended'){
    cdRenderPlayFinal(session);
  }else if(session.phase==='cancelled'){
    cdRenderPlayCancelled();
  }
}
function cdPlayerRunQuestionPhase(session){
  cdPlayerHasAnswered=false; cdCurGuess=0; cdEnteredAnswerPhase=false;
  cdHideAllPlaySubs();
  document.getElementById('cdPlayWatch').style.display='flex';
  const round=(cdCurQuizCache.rounds||[])[session.qIndex]||{showTime:5,answerTime:15,count:0};
  if(cdPlayTimerInterval) clearInterval(cdPlayTimerInterval);
  const watchTimerEl=document.getElementById('cdPlayWatchTimer');
  const inputTimerEl=document.getElementById('cdPlayTimer');
  let lastSec=-1;
  const tick=()=>{
    const elapsed=(Date.now()-session.qStartedAt)/1000;
    if(elapsed<round.showTime){
      if(watchTimerEl) watchTimerEl.textContent=Math.ceil(round.showTime-elapsed)+'с';
    }else{
      if(!cdEnteredAnswerPhase){
        cdEnteredAnswerPhase=true;
        cdHideAllPlaySubs();
        document.getElementById('cdPlayInput').style.display='block';
        const gnEl=document.getElementById('cdGuessNum'); if(gnEl) gnEl.value='0';
        cdPlayConfirmBlip();
      }
      const remain=Math.max(0, round.showTime+round.answerTime-elapsed);
      const secLeft=Math.ceil(remain);
      if(inputTimerEl) inputTimerEl.textContent=secLeft+'с';
      if(secLeft!==lastSec && secLeft>=0){ lastSec=secLeft; if(!cdPlayerHasAnswered) cdPlayTensionTick(remain/round.answerTime); }
      if(remain<=0){ clearInterval(cdPlayTimerInterval); cdPlayTimerInterval=null; }
    }
  };
  tick(); cdPlayTimerInterval=setInterval(tick,200);
}
function cdStepGuess(delta){
  if(cdPlayerHasAnswered) return;
  cdCurGuess=Math.max(0, cdCurGuess+delta);
  const el=document.getElementById('cdGuessNum'); if(el) el.value=String(cdCurGuess);
}
// Тоглогч дугаараа шууд бичихэд дуудагдана (тоон гарын оролт)
function cdGuessTyped(val){
  if(cdPlayerHasAnswered) return;
  const cleaned=String(val).replace(/[^0-9]/g,'');
  const n=cleaned===''?0:parseInt(cleaned,10);
  cdCurGuess=Math.max(0, Math.min(999, isNaN(n)?0:n));
  const el=document.getElementById('cdGuessNum');
  if(el && el.value!==String(cdCurGuess)) el.value=String(cdCurGuess);
}
let cdLastAnswerAttempt=null;
async function cdSubmitGuess(){
  if(cdPlayerHasAnswered) return;
  cdPlayerHasAnswered=true;
  cdLastAnswerAttempt=true;
  cdPlayRevealChime();
  if(cdPlayTimerInterval){clearInterval(cdPlayTimerInterval);cdPlayTimerInterval=null;}
  cdHideAllPlaySubs();
  document.getElementById('cdPlaySubmitted').style.display='flex';
  await cdDoSubmitGuess();
}
async function cdDoSubmitGuess(){
  const txtEl=document.getElementById('cdSubmitTxt');
  const stuckBtn=document.getElementById('cdStuckBtn');
  if(txtEl) txtEl.textContent='Хариулт илгээгдлээ! Хүлээнэ үү…';
  if(stuckBtn) stuckBtn.style.display='none';
  const session=cdCurSession;
  const round=(cdCurQuizCache.rounds||[])[session.qIndex];
  if(!round)return;
  const answerId=session.qIndex+'_'+cdPlayerId;
  const elapsedTotal=Math.max((Date.now()-session.qStartedAt)/1000,0);
  const elapsedAnswer=Math.min(Math.max(elapsedTotal-round.showTime,0),round.answerTime);
  const correct=cdCurGuess===round.count;
  const pts=correct?Math.round(round.pts*(0.5+0.5*(1-elapsedAnswer/round.answerTime))):0;
  try{
    await withTimeout(
      setDoc(doc(fsdb,'count_sessions',cdSessionId,'answers',answerId),{playerId:cdPlayerId,playerName:cdPlayerName,qIndex:session.qIndex,guess:cdCurGuess,correct,pts,at:Date.now()}),
      8000, 'cdSubmitGuess'
    );
  }catch(e){
    console.error('[CD] answer submit err',e);
    const msg=String(e&&e.code||e&&e.message||'');
    if(msg.includes('permission-denied')){
      return; // аль хэдийн бичигдсэн — асуудалгүй
    }
    if(txtEl) txtEl.textContent='Илгээхэд алдаа гарлаа. Сүлжээгээ шалгаад дахин оролдоно уу.';
    if(stuckBtn) stuckBtn.style.display='inline-block';
  }
}
function cdRetryLastAnswer(){
  if(!cdLastAnswerAttempt) return;
  const stuckBtn=document.getElementById('cdStuckBtn');
  if(stuckBtn) stuckBtn.style.display='none';
  cdDoSubmitGuess();
}
function cdRenderPlayReveal(session){
  cdHideAllPlaySubs();
  const el=document.getElementById('cdPlayReveal'); el.style.display='block';
  const round=(cdCurQuizCache.rounds||[])[session.qIndex];
  const mine=(session.standings||[]).find(s=>s.id===cdPlayerId);
  const rank=mine?(session.standings.indexOf(mine)+1):null;
  el.innerHTML=`<div class="qr-play-reveal-icon">${round?round.shape:'📦'}</div><div class="qr-play-wait-txt" style="margin-bottom:6px;">Зөв хариу: ${round?round.count:'?'}</div><div class="qr-play-reveal-pts">${mine?mine.score:0} оноо</div><div class="qr-play-reveal-rank">${rank?'Одоогийн байр: '+rank+' / '+session.standings.length:''}</div>`;
}
function cdRenderPlayFinal(session){
  cdHideAllPlaySubs();
  const el=document.getElementById('cdPlayFinal'); el.style.display='block';
  const mine=(session.standings||[]).find(s=>s.id===cdPlayerId);
  const rank=mine?session.standings.indexOf(mine)+1:'-';
  const medals={1:'🥇',2:'🥈',3:'🥉'};
  el.innerHTML=`<div class="qr-play-final-rank">${medals[rank]||('#'+rank)}</div><div class="qr-play-wait-txt" style="margin-bottom:10px;">Тэмцээн дууслаа!</div><div class="qr-play-final-score">${mine?mine.score:0} оноо</div><button class="qr-join-go-btn cd" style="margin-top:26px;" onclick="cdPlayerLeaveToHome()">Гарах</button>`;
}
function cdRenderPlayCancelled(){
  cdHideAllPlaySubs();
  const el=document.getElementById('cdPlayFinal'); el.style.display='block';
  el.innerHTML=`<div class="qr-play-final-rank">😕</div><div class="qr-play-wait-txt">Хост тэмцээнийг цуцалсан байна.</div><button class="qr-join-go-btn cd" style="margin-top:26px;" onclick="cdPlayerLeaveToHome()">Гарах</button>`;
}
function cdPlayerLeaveToHome(){
  cdHostCleanupListeners();
  cdSessionId=null; cdCurSession=null; cdPlayerHasAnswered=false; cdLastRenderedPhaseKey=null;
  showLanding();
}

window.showCDHome=showCDHome;window.cdOpenEditor=cdOpenEditor;window.cdSaveQuizMeta=cdSaveQuizMeta;window.cdDeleteQuiz=cdDeleteQuiz;window.cdImportJSON=cdImportJSON;
window.cdOpenREditor=cdOpenREditor;window.cdCloseREditor=cdCloseREditor;window.cdSaveRFromEditor=cdSaveRFromEditor;window.cdDeleteRFromEditor=cdDeleteRFromEditor;window.cdPickShape=cdPickShape;
window.cdHostStart=cdHostStart;window.cdHostBeginGame=cdHostBeginGame;window.cdHostCancelSession=cdHostCancelSession;
window.cdHostReveal=cdHostReveal;window.cdHostNextQuestion=cdHostNextQuestion;window.cdHostEndGame=cdHostEndGame;window.cdHostFinishSession=cdHostFinishSession;
window.cdHostNextNow=cdHostNextNow;
window.showCDJoin=showCDJoin;window.cdDoJoin=cdDoJoin;window.cdStepGuess=cdStepGuess;window.cdSubmitGuess=cdSubmitGuess;window.cdPlayerLeaveToHome=cdPlayerLeaveToHome;
window.cdGuessTyped=cdGuessTyped;
window.cdRetryLastAnswer=cdRetryLastAnswer;

// ══════════════════════════════════════════════════════════════
// MATH OF A2MB — 1-100 ТҮВШИН ДАМЖИХ ТОГЛООМ
// Админ бодлого+хариултаа гараар оруулна ('tw_levels' коллекц, doc id
// = түвшний дугаар, questions:[{id,text,answer}]). Ганцаараа тоглоход
// 1-ээс эхэлж зөв бодох тусам түвшин ахина, буруу бодвол GAME OVER.
// Багийн тэмцээнд бүх тоглогч ижил бодлого хариулж, зөв/хурдан
// хариулсан баг татлагыг өөр тал руугаа татна. Цаг зогсдоггүй —
// 0-ээс дээшээ л явна, албадан хугацаа-хязгаар байхгүй.
// Бусад коллекцтой огт давхцахгүй, бүх функц/хувьсагч tw-угтвартай.
// ══════════════════════════════════════════════════════════════

const TW_MAX_LEVEL=100;
const TW_ROPE_MAX=6;
const TW_MAX_ROUNDS=14;

function twFmtTime(totalSec){
  const m=Math.floor(totalSec/60), s=totalSec%60;
  return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
}
// Бодлого бүрийн (админ тохируулсан) хугацааны countdown — ерөнхий хэрэглээний функцууд
function twRenderQTimerUI(barId, txtId, left, total){
  const bar=document.getElementById(barId); const txt=document.getElementById(txtId);
  const pct=Math.max(0,Math.min(100,(left/Math.max(1,total))*100));
  if(bar){ bar.style.width=pct+'%'; bar.style.background = pct<25?'#dc2626':(pct<55?'#f59e0b':'#16a34a'); }
  if(txt) txt.textContent=twFmtTime(Math.max(0,left));
}
// Тухайн түвшний бодлогуудаас санамсаргүйгээр 1-ийг сонгоно (админ оруулсан сангаас)
async function twFetchRandomQuestion(level){
  try{
    const snap=await getDoc(doc(fsdb,'tw_levels',String(level)));
    if(!snap.exists()) return null;
    const qs=snap.data().questions||[];
    if(!qs.length) return null;
    return qs[Math.floor(Math.random()*qs.length)];
  }catch(e){console.error('[TW] fetch question err',e); return null;}
}
function twRenderProgress(containerId, level){
  const el=document.getElementById(containerId); if(!el) return;
  const pct=Math.max(0,Math.min(100,(level/TW_MAX_LEVEL)*100));
  const fill=el.querySelector('.tw-progress-fill'); if(fill) fill.style.width=pct+'%';
  const puller=el.querySelector('.tw-progress-puller'); if(puller) puller.style.left=`calc(${pct}% - 17px)`;
}
function twRenderRope(containerId, pos, animate){
  const el=document.getElementById(containerId); if(!el) return;
  const clamped=Math.max(-TW_ROPE_MAX,Math.min(TW_ROPE_MAX,pos||0));
  const pct=50+(clamped/TW_ROPE_MAX)*42;
  const knot=el.querySelector('.tw-rope-knot');
  if(knot){
    knot.style.left=pct+'%';
    if(animate){ knot.classList.remove('tw-pulse'); void knot.offsetWidth; knot.classList.add('tw-pulse'); }
  }
}
// netPull эерэг бол Баг А, сөрөг бол Баг Б тал руу хүмүүс татаж буй анимаци тоглуулна
// Зөв хариулсан баг сэлмээ шиднэ, нөгөө тал блок хийж оч гаргана
function twAnimatePull(containerId, netPull){
  const el=document.getElementById(containerId); if(!el||!netPull) return;
  const fromSide = netPull>0 ? 'a' : 'b';
  twPlaySwordClash(el, fromSide);
}
function twPlaySwordClash(el, fromSide){
  el.querySelectorAll('.tw-sword-fly,.tw-clash-spark').forEach(n=>n.remove());
  const sword=document.createElement('div');
  sword.className='tw-sword-fly'+(fromSide==='b'?' tw-sword-fly-b':'');
  sword.textContent='⚔️';
  el.appendChild(sword);
  qrTone(1100,.06,.15,'square');
  setTimeout(()=>{
    if(!sword.isConnected) return;
    qrTone(1500,.09,.22,'square');
    const spark=document.createElement('div');
    spark.className='tw-clash-spark';
    spark.textContent='✨';
    el.appendChild(spark);
    sword.remove();
    setTimeout(()=>{ spark.remove(); }, 480);
  }, 400);
}
// Тэмцээн дуусахад: ялсан баг туг мандуулж, ялагдсан баг өвдөг дээрээ сөхөрнө
function twShowVictory(containerId, winner){
  const el=document.getElementById(containerId); if(!el) return;
  el.querySelectorAll('.tw-sword-fly,.tw-clash-spark').forEach(n=>n.remove());
  const groupA=el.querySelector('.tw-puller-group-a');
  const groupB=el.querySelector('.tw-puller-group-b');
  if(!groupA||!groupB||!winner||winner==='draw') return;
  const loserGroup = winner==='A' ? groupB : groupA;
  const winnerGroup = winner==='A' ? groupA : groupB;
  loserGroup.classList.add('tw-kneel');
  if(!winnerGroup.querySelector('.tw-flag-pole')){
    const flag=document.createElement('div');
    flag.className='tw-flag-pole';
    flag.innerHTML=`<div class="tw-flag-stick"></div><div class="tw-flag-cloth"><svg viewBox="0 0 3 2" preserveAspectRatio="none">
        <rect width="0.75" height="2" fill="#C4272F"/><rect x="0.75" width="1.5" height="2" fill="#1B4CA6"/><rect x="2.25" width="0.75" height="2" fill="#C4272F"/>
        <circle cx="0.375" cy="1" r=".22" fill="#F9CE45"/>
      </svg></div>`;
    winnerGroup.appendChild(flag);
  }
}
// Ганцаарчилсан горимд зөв хариулахад тоглогчийн дүрсийг татах анимаци тоглуулна
function twAnimateSoloPull(containerId){
  const el=document.getElementById(containerId); if(!el) return;
  const grp=el.querySelector('.tw-progress-puller'); if(!grp) return;
  grp.classList.remove('tw-yank'); void grp.offsetWidth; grp.classList.add('tw-yank');
  grp.querySelectorAll('.tw-slash-fx').forEach(n=>n.remove());
  const slash=document.createElement('div');
  slash.className='tw-slash-fx';
  slash.textContent='⚔️';
  grp.appendChild(slash);
  setTimeout(()=>slash.remove(), 520);
}

// ── ЕРӨНХИЙ ТОЙМ ГАРЦ ──
async function showTWHome(){
  setAllInactive();
  document.getElementById('twHomeScreen').classList.add('active');
  document.getElementById('navTW').classList.add('active');
  activeGame='tw';
  twLoadScores();
}

// ── ТОЙМ ЛИДЕРБОРД ──
let twScores=[];
async function twLoadScores(){
  try{
    const q=query(collection(fsdb,'tw_scores'),orderBy('level','desc'),limit(200));
    const snap=await getDocs(q);
    twScores=[]; snap.forEach(d=>twScores.push({...d.data(),_id:d.id}));
    twScores.sort((a,b)=> (b.level-a.level) || ((a.timeSec||0)-(b.timeSec||0)));
  }catch(e){console.error('[TW] load scores err',e); twScores=[];}
  twRenderLeaderboard();
}
function twRenderLeaderboard(){
  const tableEl=document.getElementById('twLbTable'); if(!tableEl)return;
  if(!twScores.length){ tableEl.innerHTML='<div class="tw-lb-empty">Бичлэг алга — эхлээд ганцаараа тоглоод үзээрэй!</div>'; return; }
  let html=`<div class="tw-lb-row tw-lb-header"><div>#</div><div>Нэр</div><div>Түвшин</div><div>Цаг</div><div></div></div>`;
  twScores.slice(0,20).forEach((s,i)=>{
    const delBtn=isAdmin?`<button class="tw-lb-del" onclick="twDelScore('${s._id}')">✕</button>`:'';
    html+=`<div class="tw-lb-row"><div class="tw-lb-rank">${i+1}</div><div class="tw-lb-name">${escH(s.name||'Тоглогч')}</div><div>${s.level}${s.completed?' 🏆':''}</div><div>${twFmtTime(s.timeSec||0)}</div><div>${delBtn}</div></div>`;
  });
  tableEl.innerHTML=html;
}
async function twDelScore(id){
  if(!isAdmin)return;
  try{ await deleteDoc(doc(fsdb,'tw_scores',id)); twScores=twScores.filter(s=>s._id!==id); twRenderLeaderboard(); }catch(e){notify('Устгахад алдаа гарлаа');}
}

// ── ХАРИУЛТЫН ОРОЛТ (тоо / текст / A-B-C-D) — solo болон play дэлгэц хоёулаа хэрэглэнэ ──
// Тухайн бодлогын төрлөөс хамааран тохирох оролтын виджет зурна
function twRenderAnswerInput(prefix, q){
  const wrap=document.getElementById(prefix+'AnswerArea'); if(!wrap) return;
  const type=q&&q.type||'number';
  if(type==='mc'){
    wrap.innerHTML=`<div class="tw-mc-grid">`+(q.options||[]).map((o,i)=>
      `<button class="tw-mc-btn" onclick="twMCSubmit('${prefix}',${i})"><span class="tw-mc-letter">${String.fromCharCode(65+i)}</span>${escH(o)}</button>`
    ).join('')+`</div>`;
  }else if(type==='text'){
    wrap.innerHTML=`
      <input class="tw-text-inp" id="${prefix}TextInp" type="text" placeholder="Хариугаа бичнэ үү..." autocomplete="off">
      <button class="tw-btn tw-btn-blue" style="width:100%;margin-top:12px;" onclick="twTextSubmit('${prefix}')">Илгээх →</button>`;
    setTimeout(()=>{ const el=document.getElementById(prefix+'TextInp'); if(el){ el.focus(); el.onkeydown=(e)=>{ if(e.key==='Enter') twTextSubmit(prefix); }; } },150);
  }else{
    wrap.innerHTML=`
      <input class="tw-kp-display" id="${prefix}Display" type="text" readonly placeholder="Хариугаа бич">
      <div class="tw-kp-grid">
        <button onclick="twKeypadPress('${prefix}','1')">1</button>
        <button onclick="twKeypadPress('${prefix}','2')">2</button>
        <button onclick="twKeypadPress('${prefix}','3')">3</button>
        <button onclick="twKeypadPress('${prefix}','4')">4</button>
        <button onclick="twKeypadPress('${prefix}','5')">5</button>
        <button onclick="twKeypadPress('${prefix}','6')">6</button>
        <button onclick="twKeypadPress('${prefix}','7')">7</button>
        <button onclick="twKeypadPress('${prefix}','8')">8</button>
        <button onclick="twKeypadPress('${prefix}','9')">9</button>
        <button class="tw-kp-c" onclick="twKeypadPress('${prefix}','C')">C</button>
        <button onclick="twKeypadPress('${prefix}','0')">0</button>
        <button class="tw-kp-neg" onclick="twKeypadPress('${prefix}','±')">±</button>
        <button class="tw-kp-ok" onclick="twKeypadSubmit('${prefix}')">OK</button>
      </div>`;
  }
}
function twKeypadPress(prefix, key){
  const disp=document.getElementById(prefix+'Display'); if(!disp) return;
  let v=disp.value;
  if(key==='C'){ v=''; }
  else if(key==='±'){ v = v.startsWith('-') ? v.slice(1) : (v ? '-'+v : '-'); }
  else if(v.replace('-','').length<9){ v+=key; }
  disp.value=v;
}
function twKeypadSubmit(prefix){
  const disp=document.getElementById(prefix+'Display'); if(!disp) return;
  const raw=disp.value.trim();
  if(raw===''||raw==='-'){ notify('Хариугаа оруулна уу'); return; }
  const num=parseFloat(raw);
  if(isNaN(num)){ notify('Зөв тоо оруулна уу'); return; }
  twAnswerDispatch(prefix, num);
}
function twTextSubmit(prefix){
  const el=document.getElementById(prefix+'TextInp'); if(!el) return;
  const val=el.value.trim();
  if(!val){ notify('Хариугаа бичнэ үү'); return; }
  twAnswerDispatch(prefix, val);
}
function twMCSubmit(prefix, idx){
  twAnswerDispatch(prefix, idx);
}
function twAnswerDispatch(prefix, raw){
  if(prefix==='twSolo') twSoloSubmit(raw);
  else if(prefix==='twPlay') twSubmitAnswer(raw);
}
// Бодлогын төрлөөс хамааран хариулт зөв эсэхийг шалгана
function twCheckAnswer(q, raw){
  if(!q) return false;
  if(q.type==='mc') return Number(raw)===q.correctIndex;
  if(q.type==='text'){
    const norm=s=>String(s).trim().toLowerCase();
    return norm(raw)===norm(q.answer);
  }
  const num=typeof raw==='number'?raw:parseFloat(raw);
  return !isNaN(num) && Math.abs(num-q.answer)<1e-9;
}
// Дэлгэцэд харуулах "зөв хариулт" текстийг бодлогын төрлөөр бэлдэнэ
function twAnswerDisplayText(q){
  if(!q) return '?';
  if(q.type==='mc') return String.fromCharCode(65+q.correctIndex)+') '+(q.options?.[q.correctIndex]??'');
  return String(q.answer);
}

// ── ГАНЦААРЧИЛСАН ГОРИМ (1-100 түвшин дамжина) ──
let twSoloLevel=1, twSoloQuestion=null, twSoloStartTime=0, twSoloTimerInt=null;
let twSoloQTimerInt=null, twSoloQTimeLeft=0;

async function twStartSolo(){
  twSoloLevel=1;
  setAllInactive();
  document.getElementById('twSoloScreen').classList.add('active');
  document.getElementById('twSoloGameOver').style.display='none';
  document.getElementById('twSoloStage').style.display='block';
  document.getElementById('twSoloTimer').textContent='00:00';
  twSoloStartTime=Date.now();
  if(twSoloTimerInt) clearInterval(twSoloTimerInt);
  twSoloTimerInt=setInterval(()=>{
    const el=document.getElementById('twSoloTimer'); if(!el)return;
    el.textContent=twFmtTime(Math.floor((Date.now()-twSoloStartTime)/1000));
  },250);
  await twSoloLoadLevel();
}
let twSoloAnswered=false;
function twSoloStartQTimer(seconds){
  twSoloStopQTimer();
  twSoloQTimeLeft=seconds;
  twRenderQTimerUI('twSoloQTimerBar','twSoloQTimerTxt', twSoloQTimeLeft, seconds);
  twSoloQTimerInt=setInterval(()=>{
    twSoloQTimeLeft--;
    twRenderQTimerUI('twSoloQTimerBar','twSoloQTimerTxt', twSoloQTimeLeft, seconds);
    if(twSoloQTimeLeft<=0){
      twSoloStopQTimer();
      if(!twSoloAnswered) twSoloSubmit(NaN);
    }
  },1000);
}
function twSoloStopQTimer(){ if(twSoloQTimerInt){clearInterval(twSoloQTimerInt);twSoloQTimerInt=null;} }
async function twSoloLoadLevel(){
  twSoloAnswered=false;
  document.getElementById('twSoloExplBox').style.display='none';
  document.getElementById('twSoloAnswerArea').style.display='block';
  document.getElementById('twSoloLevelNum').textContent='Түвшин '+twSoloLevel+' / '+TW_MAX_LEVEL;
  twRenderProgress('twSoloProgress', twSoloLevel);
  const q=await twFetchRandomQuestion(twSoloLevel);
  if(!q){ twSoloFinishAllLevels(); return; }
  twSoloQuestion=q;
  document.getElementById('twSoloQText').textContent=q.text;
  twRenderAnswerInput('twSolo', q);
  twSoloStartQTimer(q.timeLimit||60);
}
function twSoloSubmit(raw){
  if(!twSoloQuestion || twSoloAnswered) return;
  twSoloAnswered=true;
  twSoloStopQTimer();
  const timedOut=Number.isNaN(raw);
  const correct=!timedOut && twCheckAnswer(twSoloQuestion, raw);
  if(correct){ qrTone(880,.15,.2,'triangle'); twAnimateSoloPull('twSoloProgress'); }
  else{ qrTone(220,.2,.25,'sawtooth'); }
  twSoloShowExplanation(correct, twSoloQuestion, timedOut);
}
function twSoloShowExplanation(correct, q, timedOut){
  document.getElementById('twSoloAnswerArea').style.display='none';
  const box=document.getElementById('twSoloExplBox');
  box.style.display='block';
  box.innerHTML=`
    <div class="tw-expl-icon">${correct?'✅':(timedOut?'⏱':'❌')}</div>
    <div class="tw-expl-status ${correct?'tw-expl-ok':'tw-expl-bad'}">${correct?'Зөв хариулаа!':(timedOut?'Хугацаа дууслаа!':'Буруу хариулаа.')}</div>
    <div class="tw-expl-correct">Зөв хариулт: <b>${escH(twAnswerDisplayText(q))}</b></div>
    ${q.explanation?`<div class="tw-expl-text">${escH(q.explanation)}</div>`:''}
    <button class="tw-btn tw-btn-blue" style="margin-top:14px;" onclick="twSoloContinueAfterExpl(${correct})">${correct?'Үргэлжлүүлэх →':'Дуусгах'}</button>`;
}
function twSoloContinueAfterExpl(correct){
  if(correct){
    twSoloLevel++;
    if(twSoloLevel>TW_MAX_LEVEL){ twSoloFinishAllLevels(); return; }
    twSoloLoadLevel();
  }else{
    twSoloGameOver();
  }
}
function twSoloGameOver(){
  if(twSoloTimerInt){clearInterval(twSoloTimerInt);twSoloTimerInt=null;}
  twSoloStopQTimer();
  const elapsedSec=Math.floor((Date.now()-twSoloStartTime)/1000);
  document.getElementById('twSoloStage').style.display='none';
  const fin=document.getElementById('twSoloGameOver');
  fin.style.display='block';
  fin.innerHTML=`
    <div class="tw-gameover-title">GAME OVER</div>
    <div class="tw-gameover-sub">Хүрсэн түвшин: <b>${twSoloLevel}</b> · Цаг: <b>${twFmtTime(elapsedSec)}</b></div>
    <div class="tw-gameover-correct">Зөв хариулт байсан: <b>${escH(twAnswerDisplayText(twSoloQuestion))}</b></div>
    <div class="qr-solo-final-btns">
      <button onclick="twStartSolo()">↻ Дахин тоглох</button>
      <button class="secondary" onclick="twSoloExit()">Гарах</button>
    </div>`;
  twSoloSaveScore(twSoloLevel, elapsedSec, false);
}
async function twSoloFinishAllLevels(){
  if(twSoloTimerInt){clearInterval(twSoloTimerInt);twSoloTimerInt=null;}
  twSoloStopQTimer();
  const elapsedSec=Math.floor((Date.now()-twSoloStartTime)/1000);
  document.getElementById('twSoloStage').style.display='none';
  const fin=document.getElementById('twSoloGameOver');
  fin.style.display='block';
  fin.innerHTML=`
    <div class="tw-gameover-title tw-win">🏆 БҮГДИЙГ ДҮҮРГЭЛЭЭ!</div>
    <div class="tw-gameover-sub">${TW_MAX_LEVEL} түвшинг ${twFmtTime(elapsedSec)}-т бүрэн давлаа!</div>
    <div class="qr-solo-final-btns">
      <button onclick="twStartSolo()">↻ Дахин тоглох</button>
      <button class="secondary" onclick="twSoloExit()">Гарах</button>
    </div>`;
  twSoloSaveScore(TW_MAX_LEVEL, elapsedSec, true);
}
async function twSoloSaveScore(level, timeSec, completed){
  try{
    const scoreId=`${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    const name=currentUser?(currentUser.displayName||currentUser.email.split('@')[0]):'Зочин';
    await setDoc(doc(fsdb,'tw_scores',scoreId),{name,level,timeSec,completed,ts:Date.now()});
    twLoadScores();
  }catch(e){console.error('[TW] score save err',e);}
}
function twSoloExit(){
  if(twSoloTimerInt){clearInterval(twSoloTimerInt);twSoloTimerInt=null;}
  twSoloStopQTimer();
  showTWHome();
}

// ── ХОСТ ГОРИМ (олон тоглогч, багаар — татлага) ──
let twSessionId=null, twIsHost=false, twCurSession=null, twLastRenderedPhaseKey=null;
let twUnsubSession=null, twUnsubPlayers=null, twUnsubAnswers=null, twUnsubMyTeam=null;
let twSessionRetryCount=0, twSessionRetryTimer=null, twPlayersRetryCount=0, twPlayersRetryTimer=null;
let twCurrentPlayerCount=0, twHostQTimerInt=null;

function twHostStartQTimer(seconds){
  twHostStopQTimer();
  document.getElementById('twHostQTimerWrap').style.display='block';
  let left=seconds;
  twRenderQTimerUI('twHostQTimerBar','twHostQTimerTxt', left, seconds);
  twHostQTimerInt=setInterval(()=>{
    left--;
    twRenderQTimerUI('twHostQTimerBar','twHostQTimerTxt', left, seconds);
    if(left<=0){ twHostStopQTimer(); twHostReveal(); }
  },1000);
}
function twHostStopQTimer(){ if(twHostQTimerInt){clearInterval(twHostQTimerInt);twHostQTimerInt=null;} }

async function twHostStart(){
  if(!currentUser){openLogin();return;}
  if(!await hasActiveSubscription()){showSubRequired();return;}
  const code=await qrGenUniqueCode('tw_sessions');
  const sid='tw'+Date.now();
  const sessionData={id:sid,code,hostId:currentUser.uid,phase:'lobby',roundIndex:-1,level:0,ropePos:0,qStartedAt:0,createdAt:Date.now()};
  try{
    await setDoc(doc(fsdb,'tw_sessions',sid),sessionData);
    twSessionId=sid; twIsHost=true; twCurSession=sessionData; twLastRenderedPhaseKey=null;
    showTWLobby();
  }catch(e){console.error(e);notify('Сесс үүсгэхэд алдаа гарлаа');}
}
function showTWLobby(){
  setAllInactive();
  document.getElementById('twHostLobbyScreen').classList.add('active');
  document.getElementById('twPinBox').textContent=twCurSession.code;
  const joinUrl='https://bolorgames.com/?twjoin='+twCurSession.code;
  document.getElementById('twQrImg').src='https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data='+encodeURIComponent(joinUrl);
  twHostSubscribeLobbyPlayers();
  twHostSubscribeSession();
}
function twHostSubscribeLobbyPlayers(){
  if(twUnsubPlayers) twUnsubPlayers();
  if(twPlayersRetryTimer){clearTimeout(twPlayersRetryTimer);twPlayersRetryTimer=null;}
  const mySid=twSessionId;
  twUnsubPlayers=onSnapshot(collection(fsdb,'tw_sessions',mySid,'players'), snap=>{
    twPlayersRetryCount=0;
    const players=[]; snap.forEach(d=>players.push({id:d.id,...d.data()}));
    players.sort((a,b)=>(a.joinedAt||0)-(b.joinedAt||0));
    twCurrentPlayerCount=players.length;
    const cntEl=document.getElementById('twPlayerCount'); if(cntEl)cntEl.textContent=players.length;
    const teamA=players.filter((p,i)=>i%2===0), teamB=players.filter((p,i)=>i%2===1);
    const list=document.getElementById('twLobbyPlayers');
    if(list) list.innerHTML=
      '<div class="tw-team-col tw-team-col-a"><div class="tw-team-label">🔵 БАГ А</div>'+teamA.map(p=>`<span class="tw-player-chip">${escH(p.name)}</span>`).join('')+'</div>'+
      '<div class="tw-team-col tw-team-col-b"><div class="tw-team-label">🔴 БАГ Б</div>'+teamB.map(p=>`<span class="tw-player-chip">${escH(p.name)}</span>`).join('')+'</div>';
    const startBtn=document.getElementById('twStartBtn');
    if(startBtn){ startBtn.disabled=players.length<2; startBtn.textContent=players.length<2?'Дор хаяж 2 тоглогч хэрэгтэй…':`▶ Эхлүүлэх (${players.length})`; }
  }, err=>{
    console.error('[TW] players listen err',err);
    if(twSessionId!==mySid) return;
    twPlayersRetryCount++;
    if(twPlayersRetryCount<=8){ twPlayersRetryTimer=setTimeout(()=>{ if(twSessionId===mySid) twHostSubscribeLobbyPlayers(); }, Math.min(1500*twPlayersRetryCount,8000)); }
    else notify('Тоглогчидтой холбогдоход алдаа гарлаа. Хуудсаа шинэчилнэ үү.',6000);
  });
}
function twHostSubscribeSession(){
  if(twUnsubSession) twUnsubSession();
  if(twSessionRetryTimer){clearTimeout(twSessionRetryTimer);twSessionRetryTimer=null;}
  const mySid=twSessionId;
  twUnsubSession=onSnapshot(doc(fsdb,'tw_sessions',mySid), snap=>{
    twSessionRetryCount=0;
    if(!snap.exists())return;
    twCurSession={id:snap.id,...snap.data()};
    if(twIsHost) twHostHandleSessionUpdate(twCurSession);
    else twPlayerHandleSessionUpdate(twCurSession);
  }, err=>{
    console.error('[TW] session listen err',err);
    if(twSessionId!==mySid) return;
    twSessionRetryCount++;
    if(twSessionRetryCount===1) notify('Холболт тасарлаа, автоматаар дахин холбогдож байна…',4000);
    if(twSessionRetryCount<=8){ twSessionRetryTimer=setTimeout(()=>{ if(twSessionId===mySid) twHostSubscribeSession(); }, Math.min(1500*twSessionRetryCount,8000)); }
    else notify('Холболт сэргээгдсэнгүй. Хуудсаа шинэчилнэ үү.',8000);
  });
}
function twHostCancelSession(){
  if(!confirm('Тэмцээнийг цуцлах уу?'))return;
  if(twSessionId){ setDoc(doc(fsdb,'tw_sessions',twSessionId),{phase:'cancelled'},{merge:true}).catch(()=>{}); }
  twHostCleanupListeners();
  twSessionId=null; twIsHost=false; twCurSession=null;
  showTWHome();
}
function twHostCleanupListeners(){
  if(twUnsubSession){twUnsubSession();twUnsubSession=null;}
  if(twUnsubPlayers){twUnsubPlayers();twUnsubPlayers=null;}
  if(twUnsubAnswers){twUnsubAnswers();twUnsubAnswers=null;}
  if(twUnsubMyTeam){twUnsubMyTeam();twUnsubMyTeam=null;}
  if(twSessionRetryTimer){clearTimeout(twSessionRetryTimer);twSessionRetryTimer=null;}
  if(twPlayersRetryTimer){clearTimeout(twPlayersRetryTimer);twPlayersRetryTimer=null;}
  twHostStopQTimer();
  const tw2=document.getElementById('twHostQTimerWrap'); if(tw2) tw2.style.display='none';
  twCurrentPlayerCount=0;
}
// Firestore-д хадгалахад зориулж бодлогоос зөвхөн хэрэгтэй талбаруудыг сонгоно (id хэрэггүй)
function twProblemPayload(q){
  const p={type:q.type||'number', text:q.text, timeLimit:q.timeLimit||60};
  if(q.type==='mc'){ p.options=q.options; p.correctIndex=q.correctIndex; }
  else{ p.answer=q.answer; }
  if(q.explanation) p.explanation=q.explanation;
  return p;
}
async function twHostBeginGame(){
  const problem=await twFetchRandomQuestion(1);
  if(!problem){ notify('1-р түвшинд бодлого алга байна. Эхлээд «Түвшин удирдах» хэсгээс бодлого нэмнэ үү.',5000); return; }
  try{ await setDoc(doc(fsdb,'tw_sessions',twSessionId),{phase:'question',roundIndex:0,level:1,problem:twProblemPayload(problem),qStartedAt:Date.now()},{merge:true}); }
  catch(e){console.error(e);notify('Эхлүүлэхэд алдаа гарлаа');}
}
function twHostHandleSessionUpdate(session){
  if(!twIsHost) return;
  const key=session.phase+':'+session.roundIndex;
  if(session.phase==='question'){
    if(twLastRenderedPhaseKey!==key){ setAllInactive(); document.getElementById('twHostGameScreen').classList.add('active'); twHostRenderQuestion(session); twLastRenderedPhaseKey=key; }
  }else if(session.phase==='reveal'){
    if(twLastRenderedPhaseKey!==key){ twHostRenderReveal(session); twLastRenderedPhaseKey=key; }
  }else if(session.phase==='ended'){
    if(twLastRenderedPhaseKey!=='ended'){ twHostRenderEnded(session); twLastRenderedPhaseKey='ended'; }
  }
}
function twHostRenderQuestion(session){
  document.getElementById('twHostQNum').textContent='Раунд '+(session.roundIndex+1)+' (Түвшин '+session.level+')';
  document.getElementById('twHostAnsCount').textContent='0 хариулсан';
  document.getElementById('twHostQText').textContent=session.problem.text;
  twRenderRope('twHostRope', session.ropePos||0);
  document.getElementById('twHostActions').innerHTML=`<button class="tw-btn tw-btn-blue" onclick="twHostReveal()">Хариу харуулах ⏹</button>`;
  twHostSubscribeAnswerCount(session.roundIndex);
  twHostStartQTimer(session.problem.timeLimit||60);
}
function twHostSubscribeAnswerCount(roundIndex){
  if(twUnsubAnswers) twUnsubAnswers();
  const mySid=twSessionId;
  let autoRevealed=false;
  twUnsubAnswers=onSnapshot(query(collection(fsdb,'tw_sessions',mySid,'answers'), where('roundIndex','==',roundIndex)), snap=>{
    const el=document.getElementById('twHostAnsCount'); if(el)el.textContent=snap.size+' хариулсан';
    if(!autoRevealed && twCurSession && twCurSession.phase==='question' && twCurSession.roundIndex===roundIndex
       && snap.size>0 && twCurrentPlayerCount>0 && snap.size>=twCurrentPlayerCount){
      autoRevealed=true; twHostReveal();
    }
  }, err=>console.error('[TW] answers listen err',err));
}
function twHostReveal(){
  twHostStopQTimer();
  document.getElementById('twHostQTimerWrap').style.display='none';
  if(twUnsubAnswers){twUnsubAnswers();twUnsubAnswers=null;}
  twHostComputeRevealAndWrite();
}
async function twHostComputeRevealAndWrite(){
  try{
    const [playersSnap,answersSnap]=await withTimeout(Promise.all([
      getDocs(collection(fsdb,'tw_sessions',twSessionId,'players')),
      getDocs(query(collection(fsdb,'tw_sessions',twSessionId,'answers'), where('roundIndex','==',twCurSession.roundIndex)))
    ]), 8000, 'twRevealFetch');
    const players=[]; playersSnap.forEach(d=>players.push({id:d.id,...d.data()}));
    players.sort((a,b)=>(a.joinedAt||0)-(b.joinedAt||0));
    const teamOf={}; players.forEach((p,i)=>{ teamOf[p.id]=i%2===0?'A':'B'; });
    let correctA=0, correctB=0, fastestPlayer=null, fastestMs=Infinity;
    answersSnap.forEach(d=>{
      const a=d.data();
      if(a.correct){
        if(teamOf[a.playerId]==='A') correctA++; else if(teamOf[a.playerId]==='B') correctB++;
        if((a.elapsedMs??99999)<fastestMs){ fastestMs=a.elapsedMs; fastestPlayer=a.playerId; }
      }
    });
    let netPull=Math.max(-2,Math.min(2, correctA-correctB));
    if(fastestPlayer && teamOf[fastestPlayer]) netPull+=teamOf[fastestPlayer]==='A'?1:-1;
    netPull=Math.max(-3,Math.min(3, netPull));
    const newRope=Math.max(-TW_ROPE_MAX,Math.min(TW_ROPE_MAX,(twCurSession.ropePos||0)+netPull));
    let winner=null;
    if(newRope>=TW_ROPE_MAX) winner='A';
    else if(newRope<=-TW_ROPE_MAX) winner='B';
    else if(twCurSession.roundIndex>=TW_MAX_ROUNDS) winner=newRope>0?'A':(newRope<0?'B':'draw');
    await withTimeout(setDoc(doc(fsdb,'tw_sessions',twSessionId),{
      phase:'reveal', ropePos:newRope, revealCorrectA:correctA, revealCorrectB:correctB, revealNetPull:netPull, winner:winner||null
    },{merge:true}), 8000, 'twRevealWrite');
  }catch(e){
    console.error(e);
    const msg=String(e&&e.message||'');
    notify(msg.includes('TIMEOUT')?'Сүлжээ удаан байна — дахин оролдоно уу.':'Алдаа гарлаа: '+String(e).slice(0,80), 6000);
  }
}
function twHostRenderReveal(session){
  setAllInactive();
  document.getElementById('twHostGameScreen').classList.add('active');
  qrPlayRevealFanfare();
  document.getElementById('twHostQNum').textContent='Раунд '+(session.roundIndex+1)+' — Дүн';
  document.getElementById('twHostQText').innerHTML='✓ Зөв хариу: '+escH(twAnswerDisplayText(session.problem))+
    (session.problem.explanation?`<div class="tw-expl-text" style="margin-top:10px;">${escH(session.problem.explanation)}</div>`:'');
  twRenderRope('twHostRope', session.ropePos, true);
  twAnimatePull('twHostRope', session.revealNetPull);
  document.getElementById('twHostAnsCount').textContent=`Баг А: ${session.revealCorrectA||0} зөв · Баг Б: ${session.revealCorrectB||0} зөв`;
  if(session.winner){
    document.getElementById('twHostActions').innerHTML=`<button class="tw-btn tw-btn-blue" onclick="twHostEndGame()">🏁 Тэмцээн дуусгах</button>`;
  }else{
    document.getElementById('twHostActions').innerHTML=`<button class="tw-btn tw-btn-blue" onclick="twHostNextRound()">Дараагийн бодлого →</button>`;
  }
}
async function twHostNextRound(){
  const nextIdx=twCurSession.roundIndex+1;
  const nextLevel=Math.min(TW_MAX_LEVEL, (twCurSession.level||1)+1);
  const problem=await twFetchRandomQuestion(nextLevel);
  if(!problem){ notify('Дараагийн түвшинд бодлого алга тул тэмцээнийг дуусгаж байна.',5000); await twHostEndGame(); return; }
  try{ await setDoc(doc(fsdb,'tw_sessions',twSessionId),{phase:'question',roundIndex:nextIdx,level:nextLevel,problem:twProblemPayload(problem),qStartedAt:Date.now()},{merge:true}); }
  catch(e){console.error(e);notify('Алдаа гарлаа');}
}
async function twHostEndGame(){
  try{ await setDoc(doc(fsdb,'tw_sessions',twSessionId),{phase:'ended'},{merge:true}); }
  catch(e){console.error(e);notify('Алдаа гарлаа');}
}
function twHostRenderEnded(session){
  setAllInactive();
  document.getElementById('twHostGameScreen').classList.add('active');
  document.getElementById('twHostQNum').textContent='Тэмцээн дууслаа 🏁';
  document.getElementById('twHostQText').textContent=session.winner==='draw'?'Тэнцлээ!':(session.winner==='A'?'🔵 БАГ А ЯЛЛАА!':'🔴 БАГ Б ЯЛЛАА!');
  twRenderRope('twHostRope', session.ropePos);
  twShowVictory('twHostRope', session.winner);
  document.getElementById('twHostAnsCount').textContent='';
  document.getElementById('twHostActions').innerHTML=`<button class="tw-btn tw-btn-blue" onclick="twHostFinishSession()">✓ Дуусгаад гарах</button>`;
}
function twHostFinishSession(){
  twHostCleanupListeners();
  twSessionId=null; twIsHost=false; twCurSession=null; twLastRenderedPhaseKey=null;
  showTWHome();
}

// ── ТОГЛОГЧ (join, play) ──
let twPlayerId=null, twPlayerName='', twPlayerTeam=null, twPlayerHasAnswered=false;
let twPlayRoundStart=0, twLastAnswerAttempt=null;

async function showTWJoin(prefillCode){
  setAllInactive();
  document.getElementById('twJoinScreen').classList.add('active');
  document.getElementById('twJoinErr').textContent='';
  document.getElementById('twJoinCodeInp').value=prefillCode||'';
  document.getElementById('twJoinNameInp').value=twPlayerName||'';
  setTimeout(()=>{ const el=prefillCode?document.getElementById('twJoinNameInp'):document.getElementById('twJoinCodeInp'); if(el)el.focus(); },200);
}
async function twDoJoin(){
  const code=document.getElementById('twJoinCodeInp').value.trim();
  const name=document.getElementById('twJoinNameInp').value.trim();
  const errEl=document.getElementById('twJoinErr'); errEl.textContent='';
  if(!/^\d{6}$/.test(code)){errEl.textContent='6 оронтой код оруулна уу';return;}
  if(!name){errEl.textContent='Нэрээ оруулна уу';return;}
  if(name.length>20){errEl.textContent='Нэр 20 тэмдэгтээс ихгүй байх';return;}
  const btn=document.getElementById('twJoinGoBtn');
  if(btn){ btn.disabled=true; btn.textContent='Холбогдож байна…'; }
  try{
    const snap=await withTimeout(getDocs(query(collection(fsdb,'tw_sessions'), where('code','==',code))), 8000, 'twFindSession');
    const candidates=[];
    const staleCutoff=Date.now()-12*60*60*1000;
    snap.forEach(d=>{ const data=d.data(); if(data.phase!=='ended'&&data.phase!=='cancelled' && (data.createdAt||0)>=staleCutoff) candidates.push({id:d.id,...data}); });
    candidates.sort((a,b)=>(b.createdAt||0)-(a.createdAt||0));
    const found=candidates[0]||null;
    if(!found){errEl.textContent='Ийм код олдсонгүй эсвэл тэмцээн дууссан байна';return;}
    twSessionId=found.id; twCurSession=found; twIsHost=false; twPlayerName=name;
    twPlayerId=localStorage.getItem('tw_pid_'+twSessionId)||('p'+Date.now()+Math.random().toString(36).slice(2,8));
    localStorage.setItem('tw_pid_'+twSessionId, twPlayerId);
    await withTimeout(setDoc(doc(fsdb,'tw_sessions',twSessionId,'players',twPlayerId),{name,joinedAt:Date.now()}), 8000, 'twJoinWrite');
    twPlayerHasAnswered=false; twLastRenderedPhaseKey=null;
    showTWPlay();
  }catch(e){
    console.error(e);
    const msg=String(e&&e.message||'');
    errEl.textContent=msg.includes('TIMEOUT')?'Сүлжээ удаан байна. Дахин оролдоно уу.':'Холбогдоход алдаа гарлаа. Дахин оролдоно уу.';
  }finally{
    if(btn){ btn.disabled=false; btn.textContent='Нэгдэх →'; }
  }
}
function showTWPlay(){
  setAllInactive();
  document.getElementById('twPlayScreen').classList.add('active');
  document.getElementById('twPlayMyName').textContent=twPlayerName;
  twHostSubscribeSession();
  twPlaySubscribeMyTeam();
}
function twPlaySubscribeMyTeam(){
  const mySid=twSessionId;
  if(twUnsubMyTeam) twUnsubMyTeam();
  twUnsubMyTeam=onSnapshot(collection(fsdb,'tw_sessions',mySid,'players'), snap=>{
    if(twSessionId!==mySid) return;
    const players=[]; snap.forEach(d=>players.push({id:d.id,...d.data()}));
    players.sort((a,b)=>(a.joinedAt||0)-(b.joinedAt||0));
    const idx=players.findIndex(p=>p.id===twPlayerId);
    twPlayerTeam=idx<0?null:(idx%2===0?'A':'B');
    const badge=document.getElementById('twPlayTeamBadge');
    if(badge) badge.textContent=twPlayerTeam==='A'?'🔵 БАГ А':(twPlayerTeam==='B'?'🔴 БАГ Б':'');
  });
}
function twHideAllPlaySubs(){
  ['twPlayWaiting','twPlayStage','twPlaySubmitted','twPlayReveal','twPlayFinal'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.style.display='none';
  });
}
function twPlayerHandleSessionUpdate(session){
  if(twIsHost) return;
  const key=session.phase+':'+session.roundIndex;
  if(session.phase==='lobby'){
    twHideAllPlaySubs(); document.getElementById('twPlayWaiting').style.display='flex';
  }else if(session.phase==='question'){
    if(twLastRenderedPhaseKey!==key){ twPlayerHasAnswered=false; twRenderPlayQuestion(session); twLastRenderedPhaseKey=key; }
  }else if(session.phase==='reveal'){
    if(twLastRenderedPhaseKey!==key){ twRenderPlayReveal(session); twLastRenderedPhaseKey=key; }
  }else if(session.phase==='ended'){
    twRenderPlayFinal(session);
  }else if(session.phase==='cancelled'){
    twRenderPlayCancelled();
  }
}
// Play дэлгэц дээр динамикаар зурах татлагын зураг (host-той ижил бүтэцтэй)
function twRopeTrackHTML(){
  return `<div class="tw-rope-knot"></div>
    <div class="tw-puller-group tw-puller-group-a">
      <img src="warrior-team-a.png" alt="Баг А дайчин" class="tw-puller-img">
    </div>
    <div class="tw-puller-group tw-puller-group-b">
      <img src="warrior-team-b.png" alt="Баг Б дайчин" class="tw-puller-img tw-puller-img-mirror">
    </div>`;
}
let twPlayQTimerInt=null;
function twRenderPlayQuestion(session){
  twHideAllPlaySubs();
  document.getElementById('twPlayStage').style.display='block';
  document.getElementById('twPlayQText').textContent=session.problem.text;
  twRenderAnswerInput('twPlay', session.problem);
  twPlayRoundStart=session.qStartedAt||Date.now();
  if(twPlayQTimerInt){clearInterval(twPlayQTimerInt);twPlayQTimerInt=null;}
  const total=session.problem.timeLimit||60;
  const tick=()=>{
    const left=Math.ceil(total-(Date.now()-twPlayRoundStart)/1000);
    twRenderQTimerUI('twPlayQTimerBar','twPlayQTimerTxt', left, total);
    if(left<=0 && twPlayQTimerInt){ clearInterval(twPlayQTimerInt); twPlayQTimerInt=null; }
  };
  tick();
  twPlayQTimerInt=setInterval(tick, 1000);
}
async function twSubmitAnswer(raw){
  if(twPlayerHasAnswered) return;
  twPlayerHasAnswered=true;
  if(twPlayQTimerInt){clearInterval(twPlayQTimerInt);twPlayQTimerInt=null;}
  const elapsedMs=Date.now()-twPlayRoundStart;
  const correct=twCheckAnswer(twCurSession.problem, raw);
  const answerId=twPlayerId+'_'+twCurSession.roundIndex;
  twLastAnswerAttempt={raw};
  document.getElementById('twPlayStage').style.display='none';
  document.getElementById('twPlaySubmitted').style.display='flex';
  document.getElementById('twSubmitTxt').textContent='Хариулт илгээгдлээ! Бусад тоглогчийг хүлээж байна…';
  document.getElementById('twStuckBtn').style.display='none';
  try{
    await withTimeout(setDoc(doc(fsdb,'tw_sessions',twSessionId,'answers',answerId),{playerId:twPlayerId,playerName:twPlayerName,roundIndex:twCurSession.roundIndex,value:raw,correct,elapsedMs,at:Date.now()}), 8000, 'twSubmitAnswer');
  }catch(e){
    console.error('[TW] answer submit err',e);
    const msg=String(e&&e.code||e&&e.message||'');
    if(msg.includes('permission-denied')) return;
    document.getElementById('twSubmitTxt').textContent='Илгээхэд алдаа гарлаа. Дахин оролдоно уу.';
    document.getElementById('twStuckBtn').style.display='inline-block';
  }
}
function twRetryLastAnswer(){
  if(!twLastAnswerAttempt) return;
  twPlayerHasAnswered=false;
  twSubmitAnswer(twLastAnswerAttempt.raw);
}
function twRenderPlayReveal(session){
  twHideAllPlaySubs();
  const el=document.getElementById('twPlayReveal'); el.style.display='block';
  el.innerHTML=`<div class="tw-play-reveal-icon">${session.revealNetPull>0?'🔵':(session.revealNetPull<0?'🔴':'⚖️')}</div>
    <div class="tw-play-wait-txt" style="margin-bottom:6px;">Зөв хариу: ${escH(twAnswerDisplayText(session.problem))}</div>
    ${session.problem.explanation?`<div class="tw-expl-text">${escH(session.problem.explanation)}</div>`:''}
    <div class="tw-play-reveal-pts">Баг А: ${session.revealCorrectA||0} зөв · Баг Б: ${session.revealCorrectB||0} зөв</div>
    <div id="twPlayRope" class="tw-rope-track" style="margin-top:16px;">${twRopeTrackHTML()}</div>`;
  twRenderRope('twPlayRope', session.ropePos, true);
  twAnimatePull('twPlayRope', session.revealNetPull);
}
function twRenderPlayFinal(session){
  twHideAllPlaySubs();
  const el=document.getElementById('twPlayFinal'); el.style.display='block';
  const myWin=twPlayerTeam && session.winner===twPlayerTeam;
  el.innerHTML=`<div class="tw-play-final-rank">${session.winner==='draw'?'⚖️':(myWin?'🏆':'💔')}</div>
    <div class="tw-play-wait-txt" style="margin-bottom:10px;">${session.winner==='draw'?'Тэнцлээ!':(myWin?'Таны баг яллаа!':'Нөгөө баг яллаа')}</div>
    <div id="twPlayFinalRope" class="tw-rope-track" style="margin:0 auto 16px;">${twRopeTrackHTML()}</div>
    <button class="tw-btn tw-btn-blue" onclick="twPlayerLeaveToHome()">Гарах</button>`;
  twRenderRope('twPlayFinalRope', session.ropePos);
  twShowVictory('twPlayFinalRope', session.winner);
}
function twRenderPlayCancelled(){
  twHideAllPlaySubs();
  const el=document.getElementById('twPlayFinal'); el.style.display='block';
  el.innerHTML=`<div class="tw-play-final-rank">😕</div><div class="tw-play-wait-txt">Хост тэмцээнийг цуцалсан байна.</div><button class="tw-btn tw-btn-blue" style="margin-top:26px;" onclick="twPlayerLeaveToHome()">Гарах</button>`;
}
function twPlayerLeaveToHome(){
  twHostCleanupListeners();
  if(twPlayQTimerInt){clearInterval(twPlayQTimerInt);twPlayQTimerInt=null;}
  twSessionId=null; twCurSession=null; twPlayerHasAnswered=false; twLastRenderedPhaseKey=null;
  showLanding();
}

// ── АДМИН: ТҮВШИН УДИРДАХ (бодлого + хариулт гараар оруулах) ──
let twAdminLevel=1, twAdminQuestions=[], twAdminSelType='number';
async function showTWAdmin(){
  if(!isAdmin){ notify('Зөвхөн админ хандах боломжтой'); return; }
  setAllInactive();
  document.getElementById('twAdminScreen').classList.add('active');
  document.getElementById('navAdminTW').classList.add('active');
  document.getElementById('twAdminLevelInp').value=twAdminLevel;
  twAdminSetType('number');
  await twAdminLoadLevel();
}
async function twAdminLoadLevel(){
  const raw=parseInt(document.getElementById('twAdminLevelInp').value)||1;
  twAdminLevel=Math.max(1,Math.min(TW_MAX_LEVEL, raw));
  document.getElementById('twAdminLevelInp').value=twAdminLevel;
  document.getElementById('twAdminLevelTitle').textContent='Түвшин '+twAdminLevel;
  try{
    const snap=await getDoc(doc(fsdb,'tw_levels',String(twAdminLevel)));
    twAdminQuestions=snap.exists()?(snap.data().questions||[]):[];
  }catch(e){console.error(e); twAdminQuestions=[];}
  twAdminRenderQuestions();
}
function twAdminPrevLevel(){ document.getElementById('twAdminLevelInp').value=Math.max(1,twAdminLevel-1); twAdminLoadLevel(); }
function twAdminNextLevel(){ document.getElementById('twAdminLevelInp').value=Math.min(TW_MAX_LEVEL,twAdminLevel+1); twAdminLoadLevel(); }
function twAdminSetType(type){
  twAdminSelType=type;
  document.querySelectorAll('#twAdminScreen [data-twtype]').forEach(b=>b.classList.toggle('active', b.dataset.twtype===type));
  document.getElementById('twAdminAnsNumber').style.display=type==='number'?'block':'none';
  document.getElementById('twAdminAnsText').style.display=type==='text'?'block':'none';
  document.getElementById('twAdminAnsMC').style.display=type==='mc'?'block':'none';
}
const TW_TYPE_LABEL={number:'🔢 Тоо',text:'🔤 Үг',mc:'🅰️ Сонголт'};
function twAdminRenderQuestions(){
  const wrap=document.getElementById('twAdminQList'); if(!wrap)return;
  if(!twAdminQuestions.length){ wrap.innerHTML='<div class="tw-admin-empty">Энэ түвшинд бодлого алга байна. Доор нэмнэ үү.</div>'; return; }
  wrap.innerHTML=twAdminQuestions.map((q,i)=>{
    const ansTxt = q.type==='mc' ? `${String.fromCharCode(65+q.correctIndex)}) ${escH(q.options?.[q.correctIndex]??'')}` : escH(String(q.answer));
    return `
    <div class="tw-admin-qrow">
      <div class="tw-admin-qtext"><span class="tw-admin-qtype">${TW_TYPE_LABEL[q.type||'number']}</span> ${escH(q.text)}${q.explanation?` <span class="tw-admin-qexpl-badge" title="${escH(q.explanation)}">📝 бодолттой</span>`:''} <span class="tw-admin-qtime-badge">⏱ ${q.timeLimit||60}с</span></div>
      <div class="tw-admin-qans">Хариу: <b>${ansTxt}</b></div>
      <button class="tw-admin-qdel" onclick="twAdminDeleteQuestion(${i})">✕</button>
    </div>`;
  }).join('');
}
async function twAdminDeleteQuestion(i){
  twAdminQuestions.splice(i,1);
  await twAdminSaveLevel();
}
async function twAdminAddQuestion(){
  const textEl=document.getElementById('twAdminQTextInp');
  const text=textEl.value.trim();
  if(!text){ notify('Бодлогын текст оруулна уу'); return; }
  let q={id:'q'+Date.now()+Math.random().toString(36).slice(2,6), type:twAdminSelType, text};
  if(twAdminSelType==='number'){
    const ans=parseFloat(document.getElementById('twAdminQAnsInp').value);
    if(isNaN(ans)){ notify('Зөв тоон хариулт оруулна уу'); return; }
    q.answer=ans;
    document.getElementById('twAdminQAnsInp').value='';
  }else if(twAdminSelType==='text'){
    const ans=document.getElementById('twAdminQAnsTextInp').value.trim();
    if(!ans){ notify('Зөв хариултаа бичнэ үү'); return; }
    q.answer=ans;
    document.getElementById('twAdminQAnsTextInp').value='';
  }else{
    const opts=[0,1,2,3].map(i=>document.getElementById('twAdminMC'+i).value.trim());
    if(opts.some(o=>!o)){ notify('A, B, C, D бүх сонголтыг бөглөнө үү'); return; }
    const correctIndex=parseInt((document.querySelector('input[name="twAdminMCCorrect"]:checked')||{}).value||'0');
    q.options=opts; q.correctIndex=correctIndex;
    [0,1,2,3].forEach(i=>document.getElementById('twAdminMC'+i).value='');
  }
  const explEl=document.getElementById('twAdminQExplInp');
  const expl=explEl.value.trim();
  if(expl) q.explanation=expl;
  explEl.value='';
  const timeEl=document.getElementById('twAdminQTimeInp');
  let tLimit=parseInt(timeEl.value);
  if(isNaN(tLimit)) tLimit=60;
  tLimit=Math.max(10,Math.min(1200,tLimit));
  q.timeLimit=tLimit;
  timeEl.value='60';
  textEl.value='';
  twAdminQuestions.push(q);
  await twAdminSaveLevel();
}
async function twAdminSaveLevel(){
  try{
    await setDoc(doc(fsdb,'tw_levels',String(twAdminLevel)),{level:twAdminLevel,questions:twAdminQuestions,updatedAt:Date.now()});
    twAdminRenderQuestions();
    notify('Хадгаллаа ✓',1500);
  }catch(e){console.error(e);notify('Хадгалахад алдаа гарлаа');}
}

window.showTWHome=showTWHome;window.twDelScore=twDelScore;
window.twKeypadPress=twKeypadPress;window.twKeypadSubmit=twKeypadSubmit;window.twTextSubmit=twTextSubmit;window.twMCSubmit=twMCSubmit;
window.twStartSolo=twStartSolo;window.twSoloExit=twSoloExit;window.twSoloContinueAfterExpl=twSoloContinueAfterExpl;
window.twHostStart=twHostStart;window.twHostBeginGame=twHostBeginGame;window.twHostCancelSession=twHostCancelSession;
window.twHostReveal=twHostReveal;window.twHostNextRound=twHostNextRound;window.twHostEndGame=twHostEndGame;window.twHostFinishSession=twHostFinishSession;
window.showTWJoin=showTWJoin;window.twDoJoin=twDoJoin;window.twRetryLastAnswer=twRetryLastAnswer;window.twPlayerLeaveToHome=twPlayerLeaveToHome;
window.showTWAdmin=showTWAdmin;window.twAdminLoadLevel=twAdminLoadLevel;window.twAdminPrevLevel=twAdminPrevLevel;window.twAdminNextLevel=twAdminNextLevel;window.twAdminSetType=twAdminSetType;
window.twAdminAddQuestion=twAdminAddQuestion;window.twAdminDeleteQuestion=twAdminDeleteQuestion;

// ══════════════════════════════════════════════════════════════
// MY MAJOR — Анагаах ухааны нарийн мэргэжил тохируулагч
// 120 асуулт → далд шинж чанар (trait) → 19 нарийн мэргэжлийн
// тохироо + Монголын бодит хэрэгцээ/ирээдүйн боломжийн шинжилгээ.
// ══════════════════════════════════════════════════════════════

// 16 далд шинж чанар (latent trait) — асуулт бүр эдгээрийн 1-2-т жинтэй холбогдоно
const MM_TRAITS=['analytical','autonomy','broad','procedure','blood','speed','lab','empathy','pediatric','infectious','tech','ambition','income','lifestyle','rural','international'];
const MM_TRAIT_LABEL={
  analytical:'Аналитик сэтгэлгээ', autonomy:'Бие даан шийдвэр', broad:'Өргөн мэдлэг',
  procedure:'Гар ажиллагаа', blood:'Цус/шархны тэсвэр', speed:'Хурд', lab:'Лаборatori/Микроскоп',
  empathy:'Эмпати/Харилцаа', pediatric:'Хүүхэдтэй ажиллах', infectious:'Халдвар/Нийгмийн ЭМ',
  tech:'Технологи/Дүрс', ambition:'Амбиц/Инноваци', income:'Орлогын хүсэл', lifestyle:'Work-life balance',
  rural:'Орон нутагт ажиллах хүсэл', international:'Олон улсын карьер'
};

// ── 14 бүлгийн үндсэн trait-жин (асуулт бүр харьяалагдах бүлгээсээ жинг өвлөнө) ──
const MM_SECTION_TRAITS={
  I:{analytical:1,lab:.3}, II:{autonomy:1,speed:.6,broad:.5}, III:{broad:1},
  IV:{procedure:1}, V:{blood:1}, VI:{speed:1}, VII:{lab:1,analytical:.6},
  VIII:{empathy:1}, IX:{pediatric:1}, X:{infectious:1}, XI:{tech:1},
  XII:{ambition:1}, XIII:{income:.7,lifestyle:.7}, XIV:{rural:.6,international:.6}
};

// ── 19 нарийн мэргэжлийн trait-профайл (-2..+2) ──
// [analytical,autonomy,broad,procedure,blood,speed,lab,empathy,pediatric,infectious,tech,ambition,income,lifestyle,rural,international]
const MM_SPECIALTIES={
  path:{name:'Анатомийн эмгэг судлал', p:[2,0,-1,-1,0,-1,2,-2,-1,0,1,1,0,1,-1,0]},
  derm:{name:'Арьс судлал', p:[1,1,-1,1,0,0,0,1,0,0,0,0,1,2,-1,0]},
  trauma:{name:'Гэмтэл согог судлал', p:[0,1,-1,2,2,1,-1,-1,0,0,1,0,1,-1,1,0]},
  internal:{name:'Дотрын анагаах судлал', p:[2,1,2,-1,0,-1,1,1,0,1,0,0,0,0,1,0]},
  radiology:{name:'Дүрс оношилгоо судлал', p:[2,0,0,0,-1,0,1,-2,-1,0,2,1,1,2,-1,0]},
  general:{name:'Ерөнхий мэргэшил судлал', p:[1,1,2,-1,-1,0,-1,2,1,1,-1,-1,-1,1,2,-1]},
  neuro:{name:'Мэдрэл судлал', p:[2,1,1,0,-1,-1,0,0,-1,-1,1,1,0,0,-1,1]},
  anesth:{name:'Мэдээгүйжүүлэг судлал', p:[1,2,-1,2,1,2,-1,-1,-1,-1,1,0,2,0,-1,0]},
  surgery:{name:'Мэс засал судлал', p:[0,2,-1,2,2,1,-2,-1,-1,-1,1,2,2,-2,0,1]},
  eye:{name:'Нүд судлал', p:[0,1,-1,2,-1,0,-1,0,-1,-1,2,0,1,2,-1,0]},
  psych:{name:'Сэтгэц судлал', p:[0,1,-1,-2,-2,-2,-2,2,0,-1,-1,-1,-1,2,0,0]},
  onco:{name:'Хавдар судлал', p:[2,1,1,-1,0,-1,1,1,0,-1,1,2,1,-1,0,1]},
  infect:{name:'Халдварт өвчин судлал', p:[1,1,1,-1,0,0,1,0,0,2,0,0,-1,1,1,0]},
  peds:{name:'Хүүхэд судлал', p:[1,1,2,-1,-1,0,-1,2,2,1,-1,-1,-1,0,1,-1]},
  ent:{name:'Чих, хамар, хоолой судлал', p:[0,1,-1,2,1,0,-1,0,0,0,1,0,1,1,-1,0]},
  clinpath:{name:'Эмнэл зүйн эмгэг судлал', p:[2,0,0,-1,-1,-1,2,-2,-1,1,1,0,0,1,-1,0]},
  icu:{name:'Эрчимт эмчилгээ судлал', p:[1,2,2,1,1,2,-1,-1,-1,0,1,0,1,-2,0,0]},
  obgyn:{name:'Эх барих, эмэгтэйчүүд судлал', p:[0,1,-1,2,2,1,-1,1,1,-1,0,0,1,-1,1,0]},
  emerg:{name:'Яаралтай тусламж судлал', p:[1,2,2,1,1,2,-2,-1,1,0,0,1,1,-2,1,0]}
};

// ── Монголын хүний нөөцийн бодит дата (2020 оны судалгаанаас, эх сурвалж: Монголын эмч, эмнэлгийн
//    мэргэжилтний хүний нөөцийн байршил-хэрэгцээний судалгаа) — зөвхөн эх сурвалжид байгаа тоог ашиглана,
//    тодорхой тоо аваагүй мэргэжлүүдэд "тодорхой тоо баримт алга" гэж үнэнчээр тэмдэглэнэ ══
// Эх сурвалж: "Эмч, эмнэлгийн мэргэжилтний хүний нөөцийн байршил, хэрэгцээний судалгаа" (Хүснэгт 4, 2020 он) — Улсын хэмжээний бодит тоо
const MM_MONGOLIA_DATA={
  general:{count:1973, per10k:5.88, note:null},
  path:{count:67, per10k:0.20, note:null},
  derm:{count:170, per10k:0.51, note:null},
  trauma:{count:279, per10k:0.83, note:null},
  internal:{count:1200, per10k:3.57, note:null},
  radiology:{count:420, per10k:1.25, note:null},
  neuro:{count:378, per10k:1.13, note:null},
  surgery:{count:589, per10k:1.75, note:null},
  anesth:{count:276, per10k:0.82, note:null},
  eye:{count:182, per10k:0.54, note:null},
  psych:{count:171, per10k:0.51, note:null},
  onco:{count:83, per10k:0.25, note:null},
  infect:{count:237, per10k:0.71, note:null},
  peds:{count:725, per10k:2.16, note:null},
  ent:{count:194, per10k:0.58, note:null},
  clinpath:{count:227, per10k:0.68, note:null},
  obgyn:{count:862, per10k:2.57, note:null},
  icu:{count:177, per10k:0.53, note:null},
  emerg:{count:141, per10k:0.42, note:null}
};
const MM_NATIONAL_AVG_PER10K=37.02; // нийт их эмч, 10,000 хүн амд (бүх мэргэжил нийлбэр)

// Эх сурвалж: 2024 оны Эрүүл мэндийн сайдын А/273 тушаал — "Монгол Улсад эмчлэх боломжгүй өвчний
// жагсаалт"-д тухайн мэргэжлийн хэсэгт орсон бодлогын тоогоор тооцсон "хангагдаагүй хэрэгцээ" оноо (0-10)
const MM_IMPACT={
  surgery:10, neuro:7, onco:8, trauma:6, ent:5, obgyn:5, internal:3,
  peds:4, icu:2, anesth:2, eye:2, radiology:2, emerg:2, psych:2,
  path:2, clinpath:2, derm:2, infect:2, general:1
};
// Резидентурын ойролцоо хугацаа (жилээр)
const MM_TRAINING_YEARS={
  general:1, internal:3, psych:3, derm:3, infect:3, path:4, clinpath:3,
  peds:3, obgyn:4, radiology:4, anesth:3, emerg:3, ent:4, eye:4,
  trauma:4, neuro:4, icu:3, onco:4, surgery:5
};
// Эх сурвалж: Эрүүл мэндийн сайдын 2026 оны 135 тоот тогтоол — ТҮЭМ зэрэглэлийн үндсэн цалин (2026.12.01, 75%-иар нэмэгдсэн байдлаар)
// ТҮЭМ-7 (хамгийн өндөр): Эрчимт, Мэс засал, Мэдээгүйжүүлэг, ЯТ, Гэмтэл, Эх, Хүүхэд, Хавдрын эмч
// ТҮЭМ-6: бусад нарийн мэргэжлийн эмч; ТҮЭМ-5: Ерөнхий мэргэжлийн эмч
const MM_SALARY_TIER={
  surgery:7, icu:7, anesth:7, emerg:7, trauma:7, obgyn:7, peds:7, onco:7,
  internal:6, neuro:6, radiology:6, eye:6, ent:6, derm:6, psych:6, infect:6, path:6, clinpath:6,
  general:5
};
const MM_SALARY_BY_TIER={
  7:{base2025:2128100, base2026:2864800},
  6:{base2025:2026700, base2026:2728300},
  5:{base2025:1929200, base2026:2597000}
};
// Эх сурвалж: ЭМХТ (hdc.gov.mn) 2025-2026 оны хичээлийн жилийн Үндсэн мэргэшлийн резидентурын
// элсэлтийн бодит квот — Төрийн сан (улсын төсвөөр) ба Хувь зардал (өөрөө төлж сурах) гэж тусад нь
const MM_QUOTA_STATE={
  path:5, trauma:1, internal:5, radiology:7, neuro:2, anesth:1, surgery:2,
  psych:6, onco:12, peds:1, ent:3, icu:1, obgyn:7, emerg:7
};
const MM_QUOTA_PRIVATE={
  path:1, derm:3, trauma:5, internal:50, radiology:10, general:4, neuro:13,
  anesth:11, surgery:8, eye:5, psych:4, onco:7, infect:1, peds:3,
  ent:4, clinpath:4, icu:8, obgyn:17, emerg:8
};
const MM_QUOTA_2025={};
[...new Set([...Object.keys(MM_QUOTA_STATE), ...Object.keys(MM_QUOTA_PRIVATE)])].forEach(k=>{
  MM_QUOTA_2025[k]=(MM_QUOTA_STATE[k]||0)+(MM_QUOTA_PRIVATE[k]||0);
});
// 2025 оны 09-р сарын элсэлтийн шалгалтын ЕРӨНХИЙ статистик (бүх мэргэжил нийлээд):
// нийт 1023 хүн шалгалт өгч, 27.5% (282 хүн) нь 60+ оноо авсан, дундаж 48.5. Одоогийн журмаар
// тэнцэх босго оноо албан ёсоор 70% байна. Эх сурвалж: ЭМХТ hdc.gov.mn/post/1779
const MM_EXAM_STATS={totalTook:1023, passedCount:282, passRate:27.5, avgScore:48.5, officialThreshold:70};

// ── 120 АСУУЛТ (14 бүлэг) ──
// Тэмдэглэл: 'r' талбар (reverse) true бол оноог 6-value урвуулна (эсрэг чиглэлтэй асуулт)
const MM_QUESTIONS=[
// I. ОНОШИЛГООНЫ ХЭВ МАЯГ
{s:'I',t:'Нэг өвчтөнд олон шинж тэмдэг зэрэг илэрвэл аль нэгийг нь шууд эмчлэхээс өмнө бүхнийг нь нэгтгэж бодох дуртай юу?'},
{s:'I',t:'Өвчний оношийг шууд харагдах шинжээр бус, далд шалтгааныг нь олж тогтоох нь танд хэр сонирхолтой вэ?'},
{s:'I',t:'Нэг өвчтөнд 5–10 боломжит онош байхад тэдгээрийг системтэйгээр хасаж оношлох ажил танд сонирхолтой юу?'},
{s:'I',t:'Лабораторийн олон үзүүлэлтийг харьцуулж өвчний шалтгааныг олох сонирхол хэр вэ?'},
{s:'I',t:'CT, MRI, X-ray, ultrasound зэрэг зураг дээрээс жижиг өөрчлөлт илрүүлэх ажил танд сонирхолтой юу?', bonus:{radiology:2}},
{s:'I',t:'Эс, эдийн микроскопийн зураг дээр маш жижиг өөрчлөлт хайх ажил танд сонирхолтой юу?', bonus:{path:3}},
{s:'I',t:'Цус, шээс болон бусад лабораторийн шинжилгээний үр дүнгээр өвчнийг илрүүлэх ажил танд сонирхолтой юу?', bonus:{clinpath:3}},
{s:'I',t:'Нэг өвчтөнийг олон удаа үзэж, өвчний явцыг хугацааны турш ажиглах нь танд таалагдах уу?'},
{s:'I',t:'Тодорхойгүй, хариу нь шууд гарахгүй өвчтөн танд сонирхолтой санагддаг уу?'},
{s:'I',t:'Ховор өвчний талаар олон эх сурвалжаас мэдээлэл хайж оношлох дуртай юу?'},
{s:'I',t:'Өвчний оношийг технологиор илрүүлэхээс илүү өвчтөнтэй ярилцаж, үзлэгээр олж тогтоохыг илүүд үзэх үү?'},
{s:'I',t:'Онош тодорхой болох хүртэл олон хувилбар дээр ажиллах нь танд стресс үүсгэдэг үү?', r:true},
// II. БИЕ ДААН ШИЙДВЭР / ЯАРАЛТАЙ НӨХЦӨЛ
{s:'II',t:'Мэдээлэл бүрэн биш байсан ч шийдвэр гаргах шаардлагатай үед хэр тухтай вэ?'},
{s:'II',t:'Та ганцаараа шийдвэр гаргах шаардлагатай нөхцөлд өөртөө хэр итгэлтэй байдаг вэ?'},
{s:'II',t:'Таны шийдвэр өвчтөний амь насанд шууд нөлөөлөх нөхцөлд ажиллах хүсэл хэр вэ?'},
{s:'II',t:'30 секунд–2 минутын дотор шийдвэр гаргах шаардлагатай нөхцөл танд тохирох уу?', bonus:{emerg:2}},
{s:'II',t:'Нэгэн зэрэг хэд хэдэн өвчтөн тусламж хүсвэл аль нь түрүүлж тусламж авах ёстойг хурдан тодорхойлж чадах уу?'},
{s:'II',t:'Олон төрлийн өвчин эмгэгийн талаар өргөн мэдлэгтэй байх шаардлагатай specialty танд тохирох уу?', bonus:{emerg:1,general:1,internal:1}},
{s:'II',t:'"Би нэг эрхтний мэргэжилтэн болохоос илүү олон төрлийн өвчнийг эхний байдлаар таньж, зөв шийдвэр гаргадаг эмч болохыг хүсдэг" гэдэгтэй хэр санал нийлэх вэ?'},
{s:'II',t:'Ховор тохиолдлоос илүү өдөр бүр өөр өөр өвчтөн, өөр өөр өвчинтэй нүүр тулах нь танд сонирхолтой юу?'},
{s:'II',t:'Өвчтөн ирэх бүрт юу болохыг урьдчилан таах боломжгүй ажлын орчин танд таалагдах уу?'},
{s:'II',t:'Алдаа гаргах эрсдэл өндөр боловч хурдан шийдвэр шаарддаг ажил танд тохирох уу?'},
{s:'II',t:'Өндөр дарамттай үед бусдын зааврыг хүлээлгүй, өөрөө асуудлыг зохион байгуулж эхлэх хандлагатай юу?'},
{s:'II',t:'Яаралтай нөхцөлд удирдагчийн үүргийг авахад хэр бэлэн вэ?'},
{s:'II',t:'Яаралтай нөхцөл өнгөрсний дараа дараагийн өвчтөн рүү шууд шилжиж чаддаг уу?', bonus:{emerg:1}},
// III. "НЭГ ЭРХТЭН" VS "ӨРГӨН МЭДЛЭГ"
{s:'III',t:'Та нэг эрхтнийг маш гүнзгий судлахыг илүүд үзэх үү, эсвэл бүх биеийн олон өвчнийг өргөн хүрээнд мэдэхийг хүсэх үү?'},
{s:'III',t:'"Нэг чиглэлдээ дэлхийн хэмжээний эксперт болох" нь танд хэр сонирхолтой вэ?', r:true},
{s:'III',t:'"Олон төрлийн өвчнийг эхний байдлаар оношилж, шаардлагатай мэргэжилтэн рүү чиглүүлэх" нь танд хэр сонирхолтой вэ?'},
{s:'III',t:'Хүний биеийн бүх систем хоорондоо хэрхэн холбоотойг судлах сонирхолтой юу?', bonus:{internal:2,general:1}},
{s:'III',t:'Зөвхөн мэдрэлийн системийг маш гүнзгий судлах сонирхол хэр вэ?', bonus:{neuro:3}},
{s:'III',t:'Зөвхөн нүдний бүтэц, харааны системийг маш гүнзгий судлах сонирхол хэр вэ?', bonus:{eye:3}},
{s:'III',t:'Арьсны өвчнийг харааны шинжээр ялган оношлох сонирхол хэр вэ?', bonus:{derm:3}},
{s:'III',t:'Чих, хамар, хоолой, толгой-хүзүүний өвчнийг нэг системээр судлах сонирхол хэр вэ?', bonus:{ent:3}},
{s:'III',t:'Эмэгтэй хүний нөхөн үржихүй, жирэмслэлт, төрөлт зэрэг олон үе шатыг хамарсан specialty танд сонирхолтой юу?', bonus:{obgyn:3}},
// IV. PROCEDURE / ГАРДАН АЖИЛЛАГАА
{s:'IV',t:'Гараараа procedure хийх нь танд онолын оношлогооноос илүү сонирхолтой юу?'},
{s:'IV',t:'Жижиг зүйл дээр маш нарийн хөдөлгөөн хийхдээ өөртөө итгэлтэй юу?'},
{s:'IV',t:'Гар-нүдний coordination сайтай юу?'},
{s:'IV',t:'Видео тоглоомын хурд, нарийн хөдөлгөөн шаардсан төрөлд хэр сайн бэ?'},
{s:'IV',t:'Нэгэн зэрэг хоёр гараараа өөр өөр хөдөлгөөн хийхэд хэр сайн вэ?'},
{s:'IV',t:'Гар тань чичирдэг/салганадаг уу?', r:true},
{s:'IV',t:'Микроскоп, жижиг камер, жижиг багаж ашиглан ажиллах сонирхолтой юу?', bonus:{eye:1,surgery:1,ent:1}},
{s:'IV',t:'Том хэмжээний гэмтэл, яс, үе мөчтэй гардан ажиллах сонирхолтой юу?', bonus:{trauma:3}},
{s:'IV',t:'Катетер, гуурс, airway зэрэг procedure хийх сонирхолтой юу?', bonus:{anesth:2,icu:1,emerg:1}},
{s:'IV',t:'Өвчтөний биеийн байдлыг шууд procedure хийж өөрчлөх нь танд сэтгэл ханамж өгдөг үү?'},
{s:'IV',t:'Нэг жижиг хөдөлгөөнд алдаа гаргавал том үр дагавартай procedure танд тохирох уу?'},
// V. ЦУС / ШАРХ / БИЕИЙН ШИНГЭН
{s:'V',t:'Цус харахад эвгүйцдэг үү?', r:true},
{s:'V',t:'Их хэмжээний цус алдалт харахад хэр тэсвэртэй вэ?'},
{s:'V',t:'Ил шарх харахад хэр тухтай вэ?'},
{s:'V',t:'Дотор эрхтэн харахад эвгүйцдэг үү?', r:true},
{s:'V',t:'Биеийн шингэнтэй ажиллахад хэр тухтай вэ?'},
{s:'V',t:'Цогцос/үхэлтэй холбоотой ажилд хэр тухтай вэ?'},
{s:'V',t:'Микроскопоор эд, эс, эрхтний бүтэцтэй ажиллах нь танд эвгүй биш үү?', r:true, bonus:{path:1}},
{s:'V',t:'Өвчтөний маш хүнд гэмтэлтэй дүр зургийг хараад ажлаа үргэлжлүүлж чадах уу?'},
{s:'V',t:'Цус, шархнаас илүү лабораторийн/зураг оношилгооны орчин танд таалагддаг уу?', bonus:{radiology:1,path:1,clinpath:1}},
// VI. ХУРД VS НАРИЙВЧЛАЛ
{s:'VI',t:'Хурдан шийдвэр гаргах уу, удаан боловч илүү нарийвчлалтай шийдвэр гаргах уу?'},
{s:'VI',t:'10 өвчтөнийг хурдан үнэлэх үү, 1 өвчтөнийг маш гүнзгий судлах уу?'},
{s:'VI',t:'Ажлын орчин байнга өөрчлөгдөхөд хэр дасан зохицдог вэ?'},
{s:'VI',t:'Нэг procedure-ийг олон цаг хийхэд тэвчээртэй юу?', r:true},
{s:'VI',t:'Олон жижиг case дараалан шийдэх нь танд таалагдах уу?'},
{s:'VI',t:'Удаан хугацаанд нэг онош дээр төвлөрөх нь танд таалагдах уу?', r:true},
{s:'VI',t:'Яаралтай үед 80%-ийн мэдээлэлтэй байсан ч шийдвэр гаргаж чадах уу?'},
{s:'VI',t:'Эцсийн шийдвэр гаргахаас өмнө бүх мэдээллийг цуглуулахыг илүүд үздэг үү?', r:true},
{s:'VI',t:'Хурдан, тодорхой шийдвэр гаргах шаардлагатай ажил таны сонирхлыг нэмэгдүүлдэг үү?'},
// VII. ЭМГЭГ СУДЛАЛ / ЛАБОРАТОРИ / СУДАЛГАА
{s:'VII',t:'Өвчтөнтэй өдөржин харилцахаас илүү өвчний эд эсийн шалтгааныг судлах сонирхолтой юу?', bonus:{path:1}},
{s:'VII',t:'Микроскопоор маш жижиг өөрчлөлт хайх ажил танд сонирхолтой юу?', bonus:{path:2}},
{s:'VII',t:'Эсийн бүтэц өөрчлөгдөж өвчин үүсэх механизмыг судлах сонирхолтой юу?'},
{s:'VII',t:'Шинжилгээний үр дүнгээр бусад эмчийн оношилгоонд туслах нь танд сонирхолтой юу?', bonus:{clinpath:2}},
{s:'VII',t:'"Өвчтөнийг өөрөө үзэхгүй ч оношилгооны маш чухал хэсгийг хийх" нь танд тохирох уу?', bonus:{path:1,clinpath:1,radiology:1}},
{s:'VII',t:'Судалгааны өгүүлэл унших, судалгаа хийхэд сонирхолтой юу?'},
{s:'VII',t:'Лабораторийн нарийн тоног төхөөрөмжтэй ажиллах сонирхолтой юу?'},
{s:'VII',t:'Хавдрын эсийн бүтэц, mutation, pathology зэрэгтэй холбоотой судалгаа хийх сонирхолтой юу?', bonus:{path:1,onco:2}},
{s:'VII',t:'Өвчтөний шууд эмчилгээ хийхээс илүү өвчний механизмийг ойлгох нь танд чухал уу?'},
// VIII. ХҮНИЙ СЭТГЭЛ ЗҮЙ / ЭМПАТИ
{s:'VIII',t:'Хүний сэтгэл хөдлөлийг ойлгох нь танд амархан уу?'},
{s:'VIII',t:'Өвчтөн 30 минут тасралтгүй ярьсан ч анхааралтай сонсож чадах уу?'},
{s:'VIII',t:'Сэтгэцийн өвчтэй хүмүүстэй ажиллахад хэр тухтай вэ?', bonus:{psych:3}},
{s:'VIII',t:'Амиа хорлох эрсдэлтэй өвчтөнтэй ярилцах шаардлагатай бол хэр тухтай байх вэ?', bonus:{psych:2}},
{s:'VIII',t:'Өвчтөний сэтгэлзүйн асуудлыг эмчилгээний гол хэсэг гэж үздэг үү?'},
{s:'VIII',t:'Өвчтөнтэй удаан хугацааны эмчилгээний харилцаа үүсгэх сонирхолтой юу?'},
{s:'VIII',t:'Гэр бүл, нийгмийн нөхцөл өвчний явцад нөлөөлдөг гэж үзэж, үүнийг эмчилгээний нэг хэсэг болгон авч үзэх сонирхолтой юу?'},
{s:'VIII',t:'Өвчтөн өөрөө асуудлаа бүрэн ойлгохгүй байсан ч тэвчээртэй ажиллаж чаддаг уу?'},
// IX. ХҮҮХЭД / ЭХ БАРИХ / ГЭР БҮЛ
{s:'IX',t:'Нярай хүүхэдтэй ажиллах сонирхолтой юу?', bonus:{peds:2}},
{s:'IX',t:'Хүүхэд өөрийн өвдөлтөө сайн тайлбарлаж чадахгүй үед оношлох нь танд сонирхолтой challenge санагдах уу?', bonus:{peds:2}},
{s:'IX',t:'Хүүхдийн эцэг эхтэй зэрэг харилцах шаардлагатай ажил танд тохирох уу?', bonus:{peds:1}},
{s:'IX',t:'Жирэмсэн эмэгтэйг жирэмсний эхнээс төрсний дараах үе хүртэл дагаж ажиллах сонирхолтой юу?', bonus:{obgyn:3}},
{s:'IX',t:'Төрөх үед гэнэтийн хүндрэл гарч болох орчинд ажиллах сонирхолтой юу?', bonus:{obgyn:2}},
{s:'IX',t:'Эх, хүүхдийн хоёр өвчтөний эрсдэлийг зэрэг бодож шийдвэр гаргах нь танд тохирох уу?', bonus:{obgyn:2}},
{s:'IX',t:'Хүүхдийн яаралтай нөхцөлд хурдан шийдвэр гаргах ажил танд тохирох уу?', bonus:{peds:1,emerg:1}},
{s:'IX',t:'Хүүхдийн өвчин наснаас хамаарч өөр өөр илэрдэг учраас өргөн мэдлэг шаарддаг specialty танд сонирхолтой юу?', bonus:{peds:1}},
// X. ХАЛДВАР / НИЙГМИЙН ЭРҮҮЛ МЭНД
{s:'X',t:'Халдварт өвчин хэрхэн тархдагийг судлах сонирхолтой юу?', bonus:{infect:3}},
{s:'X',t:'Нэг өвчтөнийг эмчлэхээс гадна олон нийтэд өвчин тархахаас сэргийлэх нь танд сонирхолтой юу?', bonus:{infect:2}},
{s:'X',t:'Эпидеми, outbreak үед ажиллахад хэр бэлэн вэ?', bonus:{infect:2}},
{s:'X',t:'Хамгаалах хэрэгсэл өмсөж, өндөр эрсдэлтэй нөхцөлд удаан хугацаагаар ажиллах шаардлага танд хэр хүлээн зөвшөөрөгдөх вэ?', bonus:{infect:1}},
{s:'X',t:'Ховор боловч нийгмийн эрсдэл өндөр өвчнийг судлах сонирхолтой юу?', bonus:{infect:1}},
{s:'X',t:'Өвчтөний эмчилгээнээс гадна урьдчилан сэргийлэх арга хэмжээ боловсруулах сонирхолтой юу?', bonus:{general:1,infect:1}},
{s:'X',t:'Нийгмийн хэмжээнд impact гаргах нь таны карьерын гол зорилгуудын нэг мөн үү?'},
// XI. ӨНДӨР ТЕХНОЛОГИ / ЗУРАГ / AI
{s:'XI',t:'MRI/CT/X-ray дээр маш жижиг өөрчлөлт хайх нь танд сонирхолтой юу?', bonus:{radiology:3}},
{s:'XI',t:'AI ашиглан medical image analysis хийх сонирхолтой юу?', bonus:{radiology:2}},
{s:'XI',t:'Робот мэс засал, navigation system зэрэг технологи танд сонирхолтой юу?', bonus:{surgery:1,neuro:1}},
{s:'XI',t:'Компьютерийн дэлгэц дээр олон цаг ажиллахад тухтай юу?', bonus:{radiology:1}},
{s:'XI',t:'Технологи өөрчлөгдөх бүрт шинэ төхөөрөмж сурах сонирхолтой юу?'},
{s:'XI',t:'Өвчтөний бие дээр ажиллахаас илүү medical technology ашиглан оношлох нь танд сонирхолтой юу?', bonus:{radiology:1}},
{s:'XI',t:'Ирээдүйд AI хамгийн их өөрчлөх specialty-д орох сонирхолтой юу?'},
// XII. АМБИЦ / НЭР ХҮНД / ИННОВАЦИ
{s:'XII',t:'Өөрийн specialty-д Монголын шилдэг эмч болох хүсэл хэр өндөр вэ?'},
{s:'XII',t:'Гадаадаас шинэ эмчилгээ Монголд авчрах сонирхол хэр өндөр вэ?'},
{s:'XII',t:'Монголд одоогоор хязгаарлагдмал байгаа эмчилгээг нутагшуулахыг хүсдэг үү?'},
{s:'XII',t:'Судалгаа хийж шинэ эмчилгээ/технологи хөгжүүлэх сонирхолтой юу?'},
{s:'XII',t:'Эмчээс гадна баг удирдах сонирхолтой юу?'},
{s:'XII',t:'Нэр хүнд өндөр specialty сонгох нь танд хэр чухал вэ?'},
{s:'XII',t:'Ирээдүйд "Монголд өмнө нь хийгддэггүй байсан эмчилгээг бий болгосон эмч" болох хүсэл хэр өндөр вэ?'},
// XIII. ЦАЛИН + АЖЛЫН АЧААЛАЛ + АМЬДРАЛ
{s:'XIII',t:'Өндөр цалин specialty сонгоход хэр чухал вэ?'},
{s:'XIII',t:'Өндөр цалин авахын тулд шөнийн дуудлагатай ажиллах уу?'},
{s:'XIII',t:'Өндөр орлогын төлөө 50–60+ цаг ажиллахыг зөвшөөрөх үү?'},
{s:'XIII',t:'Work-life balance танд хэр чухал вэ?'},
{s:'XIII',t:'Тогтмол ажлын цагтай specialty сонгох уу?'},
{s:'XIII',t:'Цалин бага байсан ч маш ховор, өндөр мэргэшил шаарддаг specialty-г сонгох уу?'},
// XIV. МОНГОЛ + ГАДААД + КАРЬЕРЫН ЗАМ
{s:'XIV',t:'Гадаадад ажиллах боломж танд хэр чухал вэ?'},
{s:'XIV',t:'Гадаадад residency хийхийн тулд хэдэн жил нэмэлт сургалт/шалгалт шаардагдсан ч бэлэн үү?'},
{s:'XIV',t:'Монголд эмчийн тоо цөөн боловч аймагт маш их хэрэгцээтэй specialty сонгох сонирхолтой юу?'},
{s:'XIV',t:'Монголд одоогоор хязгаарлагдмал байгаа эмчилгээг ирээдүйд нутагшуулах боломжтой specialty сонгох нь танд чухал уу?'}
];

// ══════════════════════════════════════════════════════════════
// MY MAJOR — тоглоомын engine (асуулт харуулах, оноо тооцоолох, үр дүн)
// ══════════════════════════════════════════════════════════════

let mmIndex=0, mmAnswers=[], mmShuffledQuestions=[];

let mmIntentSelected=new Set();
function mmStartQuiz(){
  mmIntentSelected=new Set();
  setAllInactive();
  document.getElementById('mmIntentScreen').classList.add('active');
  mmRenderIntentGrid();
  mmLoadComments();
}
function mmRenderIntentGrid(){
  const wrap=document.getElementById('mmIntentGrid');
  wrap.innerHTML=Object.entries(MM_SPECIALTIES).map(([key,spec])=>
    `<button class="mm-intent-btn" id="mmIntent_${key}" onclick="mmToggleIntent('${key}')">${escH(spec.name)}</button>`
  ).join('');
}
function mmToggleIntent(key){
  const btn=document.getElementById('mmIntent_'+key);
  if(mmIntentSelected.has(key)){ mmIntentSelected.delete(key); btn.classList.remove('selected'); }
  else{ mmIntentSelected.add(key); btn.classList.add('selected'); }
}
function mmConfirmIntent(){
  mmIndex=0;
  mmAnswers=new Array(MM_QUESTIONS.length).fill(null);
  mmShuffledQuestions=MM_QUESTIONS.map((q,i)=>({...q,_idx:i}));
  setAllInactive();
  document.getElementById('mmQuizScreen').classList.add('active');
  mmRenderQuestion();
  mmLoadComments();
}
function mmRenderQuestion(){
  const q=mmShuffledQuestions[mmIndex];
  const total=mmShuffledQuestions.length;
  document.getElementById('mmProgressTxt').textContent=`Асуулт ${mmIndex+1} / ${total}`;
  document.getElementById('mmProgressBar').style.width=((mmIndex)/total*100)+'%';
  document.getElementById('mmQText').textContent=q.t;
  document.querySelectorAll('#mmLikertGrid .mm-likert-btn').forEach(b=>b.classList.remove('selected'));
  const prev=mmAnswers[mmIndex];
  if(prev!==null){
    const btn=document.querySelector(`#mmLikertGrid .mm-likert-btn[data-val="${prev}"]`);
    if(btn) btn.classList.add('selected');
  }
  document.getElementById('mmBackBtn').style.display=mmIndex>0?'inline-block':'none';
}
function mmAnswer(val){
  mmAnswers[mmIndex]=val;
  document.querySelectorAll('#mmLikertGrid .mm-likert-btn').forEach(b=>b.classList.toggle('selected', parseInt(b.dataset.val)===val));
  setTimeout(()=>{
    if(mmIndex<mmShuffledQuestions.length-1){ mmIndex++; mmRenderQuestion(); }
    else mmComputeResults();
  },220);
}
function mmGoBack(){
  if(mmIndex>0){ mmIndex--; mmRenderQuestion(); }
}
function mmExitQuiz(){
  if(!confirm('Тестээ гараад цуцлах уу? Явц хадгалагдахгүй.')) return;
  qrOpenFolder(qrCurFolderId);
}

function mmComputeResults(){
  // trait бүрийн дундаж оноог тооцно (1-5 хариултаас, reverse бол урвуулна)
  const traitSum={}, traitCount={};
  MM_TRAITS.forEach(t=>{traitSum[t]=0;traitCount[t]=0;});
  const directBonus={};
  mmShuffledQuestions.forEach((q,i)=>{
    let val=mmAnswers[i];
    if(val===null||val===undefined) val=3; // алгассан бол төвийг сахисан гэж үзнэ
    if(q.r) val=6-val;
    const norm=(val-3)/2; // -1..+1 хооронд normalize
    const secTraits=MM_SECTION_TRAITS[q.s]||{};
    Object.entries(secTraits).forEach(([trait,w])=>{
      traitSum[trait]+=norm*w; traitCount[trait]+=Math.abs(w);
    });
    if(q.bonus){
      Object.entries(q.bonus).forEach(([spec,w])=>{
        directBonus[spec]=(directBonus[spec]||0)+norm*w;
      });
    }
  });
  const userTraitVec={};
  MM_TRAITS.forEach(t=>{ userTraitVec[t]=traitCount[t]>0 ? traitSum[t]/traitCount[t] : 0; }); // -1..+1

  const results=Object.entries(MM_SPECIALTIES).map(([key,spec])=>{
    let raw=0, maxPossible=0;
    MM_TRAITS.forEach((t,i)=>{
      const w=spec.p[i];
      raw += userTraitVec[t]*w;
      maxPossible += Math.abs(w);
    });
    raw += (directBonus[key]||0);
    if(mmIntentSelected.has(key)) raw += 2.2; // эхний "сонирхлын" сонголтын бонус
    maxPossible += 3;
    const pct=Math.max(5, Math.min(98, Math.round(50 + (raw/Math.max(1,maxPossible))*50)));
    const mongolia=MM_MONGOLIA_DATA[key]||{};
    let demandScore;
    if(mongolia.per10k!=null){
      demandScore=Math.round(Math.max(10,Math.min(95, 100 - (mongolia.per10k/MM_NATIONAL_AVG_PER10K*100))));
    }else{
      demandScore=null;
    }
    return {
      key, name:spec.name, fit:pct,
      demandScore, mongoliaCount:mongolia.count, mongoliaPer10k:mongolia.per10k, mongoliaNote:mongolia.note,
      impact:MM_IMPACT[key]||3, trainingYears:MM_TRAINING_YEARS[key]||4
    };
  });
  results.sort((a,b)=>b.fit-a.fit);
  mmShowResults(results, userTraitVec);
}

function mmImpactStars(v){
  const full=Math.round(v/2);
  return '⭐'.repeat(Math.max(1,full))+'☆'.repeat(Math.max(0,5-full));
}
function mmShowResults(results, userTraitVec){
  setAllInactive();
  document.getElementById('mmResultsScreen').classList.add('active');
  const top5=results.slice(0,5);
  const wrap=document.getElementById('mmResultsList');
  wrap.innerHTML=top5.map((r,i)=>{
    const demandHtml = r.demandScore!=null
      ? `<div class="mm-stat"><span class="mm-stat-label">🇲🇳 Монголын одоогийн эрэлт</span><span class="mm-stat-val">${r.demandScore}/100</span></div>
         <div class="mm-stat-sub">10,000 хүнд ${r.mongoliaPer10k} эмч (${r.mongoliaCount} эмч, 2020) · улсын дундаж ${MM_NATIONAL_AVG_PER10K}</div>`
      : `<div class="mm-stat"><span class="mm-stat-label">🇲🇳 Монголын одоогийн эрэлт</span><span class="mm-stat-val">—</span></div>
         <div class="mm-stat-sub">${escH(r.mongoliaNote||'Тодорхой тоо баримт алга')}</div>`;
    return `<div class="mm-result-card ${i===0?'mm-result-top':''}">
      <div class="mm-result-rank">${i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)}</div>
      <div class="mm-result-body">
        <div class="mm-result-name">${escH(r.name)}</div>
        <div class="mm-result-fit-bar-wrap"><div class="mm-result-fit-bar" style="width:${r.fit}%;"></div><span class="mm-result-fit-txt">${r.fit}% тохирно</span></div>
        <div class="mm-stats-grid">
          ${demandHtml}
          <div class="mm-stat"><span class="mm-stat-label">🚀 Ирээдүйн боломж (unmet need)</span><span class="mm-stat-val">${mmImpactStars(r.impact)}</span></div>
          <div class="mm-stat"><span class="mm-stat-label">📚 Резидентурын ойролцоо хугацаа</span><span class="mm-stat-val">${r.trainingYears} жил</span></div>
        </div>
      </div>
    </div>`;
  }).join('');
  document.getElementById('mmDetailedWriteup').innerHTML=mmBuildDetailedWriteup(top5[0], userTraitVec);
  mmLoadComments();
  const otherWrap=document.getElementById('mmOtherResults');
  otherWrap.innerHTML='<div class="mm-other-title">Бусад мэргэжлийн тохироо</div>'+
    results.slice(5).map(r=>`<div class="mm-other-row"><span>${escH(r.name)}</span><span>${r.fit}%</span></div>`).join('');
}

// Мэргэжил дуусаад цаашид салбарлах боломжийн ерөнхий тоймоос (тодорхой хөтөлбөрийн жагсаалт биш, ерөнхий чиг хандлага)
const MM_SUBSPECIALTY_NOTE={
  internal:'Дотрын анагаахаас кардиологи, гастроэнтерологи, эндокринологи, нефрологи, ревматологи зэрэг олон салбарт цаашид төрөлжих боломж арвин (10+ чиглэл).',
  surgery:'Ерөнхий мэс заслаас зүрх-судасны, хавдрын, гэдэсний, транспланталогийн мэс засал зэрэг олон салбарт цаашид гүнзгийрэх боломжтой (10+ чиглэл), гэхдээ нэмэлт 2-4 жилийн сургалт шаардана.',
  neuro:'Мэдрэлийн мэс засал, эпилептологи, stroke medicine зэрэг цөөн боловч өндөр төрөлжсөн салбар руу цаашид орох боломжтой.',
  peds:'Хүүхдийн кардиологи, неонатологи, хүүхдийн онкологи зэрэг олон дэд мэргэжилд цаашид төрөлжих боломжтой.',
  obgyn:'Нөхөн үржихүйн эндокринологи, high-risk pregnancy, gynecologic oncology зэрэг дэд чиглэл байдаг.',
  onco:'Хими эмчилгээ, туяа эмчилгээ, хавдрын мэс засал гэсэн 3 үндсэн чиглэлд төрөлжинө.',
  radiology:'Interventional radiology, neuroradiology зэрэг цөөн тооны өндөр төрөлжсөн чиглэл байдаг.',
  path:'Цаашид салбарлах боломж харьцангуй цөөн — гол чиглэлдээ гүнзгийрдэг тогтвортой карьерын зам.',
  clinpath:'Цаашид салбарлах боломж харьцангуй цөөн, гол чиглэлдээ гүнзгийрдэг.',
  emerg:'Цаашид сонголт харьцангуй цөөн, харин өргөн мэдлэг + удирдах ур чадвар (эмнэлгийн менежмент) руу шилжих боломжтой.',
  icu:'Хүүхдийн эрчимт эмчилгээ, зүрхний эрчимт эмчилгээ зэрэг цөөн тооны дэд чиглэлд төрөлжинө.',
  anesth:'Хүүхдийн мэдээгүйжүүлэг, өвдөлт намдаах эмчилгээ (pain medicine) зэрэг дэд чиглэлд орох боломжтой.',
  eye:'Ретинологи, glaucoma, кератопластик мэс засал зэрэг дэд чиглэлүүд байдаг.',
  ent:'Толгой-хүзүүний мэс засал, сонсголын мэс засал зэрэг дэд чиглэлд төрөлжинө.',
  psych:'Хүүхдийн сэтгэц судлал, донтолтын эмчилгээ зэрэг дэд чиглэлд орох боломжтой.',
  derm:'Гоо сайхны арьс судлал, арьсны хавдар судлал зэрэг дэд чиглэлд орох боломжтой.',
  trauma:'Нугас, гар/хөлний нарийн мэс засал зэрэг дэд чиглэлд төрөлжинө.',
  infect:'HIV/эпидемиологи, эмнэлгийн халдвар хяналт зэрэг дэд чиглэлд орох боломжтой.',
  general:'Ерөнхий мэргэшлээс дараа нь бараг бүх нарийн мэргэжил рүү шилжих (residency) боломж нээлттэй хэвээр байдаг — карьерын хамгийн уян хатан эхлэлүүдийн нэг.'
};
function mmFmtMNT(n){ return n.toLocaleString('mn-MN')+'₮'; }
function mmBuildDetailedWriteup(top, uv){
  if(!top) return '';
  const spec=MM_SPECIALTIES[top.key];
  const traitIdx=(key)=>MM_TRAITS.indexOf(key);
  const contribs=MM_TRAITS.map((t,i)=>({t,label:MM_TRAIT_LABEL[t],contrib:(uv[t]||0)*spec.p[i]}))
    .sort((a,b)=>b.contrib-a.contrib).filter(c=>c.contrib>0.05).slice(0,3);
  const traitTxt=contribs.length ? contribs.map(c=>c.label.toLowerCase()).join(', ') : 'олон талт зан чанарын шинж';

  // Цалин — ТҮЭМ зэрэглэлийн 2026 оны бодит тоогоор (Эрүүл мэндийн сайдын 135 тоот тогтоол)
  const tier=MM_SALARY_TIER[top.key];
  const salInfo=MM_SALARY_BY_TIER[tier];
  const tier7=MM_SALARY_BY_TIER[7].base2026, tier6=MM_SALARY_BY_TIER[6].base2026, tier5=MM_SALARY_BY_TIER[5].base2026;
  let salaryNote;
  if(tier===7) salaryNote=`Энэ бол ТҮЭМ-7 зэрэглэл — эмчийн цалингийн шатлалын **хамгийн өндөр** ангилалд ордог (${mmFmtMNT(tier6)}-тэй ТҮЭМ-6-аас ердөө ${mmFmtMNT(tier7-tier6)}-өөр, ${mmFmtMNT(tier5)}-тэй ерөнхий мэргэжлийн эмчээс ${mmFmtMNT(tier7-tier5)}-өөр илүү — ялгаа харьцангуй бага гэдгийг анхаараарай).`;
  else if(tier===6) salaryNote=`Энэ бол ТҮЭМ-6 (нарийн мэргэжлийн эмчийн ерөнхий) зэрэглэл — хамгийн өндөр ТҮЭМ-7-оос ${mmFmtMNT(tier7-tier6)}-өөр бага, харин ерөнхий мэргэжлийн эмчээс ${mmFmtMNT(tier6-tier5)}-өөр өндөр.`;
  else salaryNote=`Энэ бол ТҮЭМ-5 (Ерөнхий мэргэшил) зэрэглэл — үндсэн цалингийн шатлалын хамгийн доод түвшинд ордог (нарийн мэргэжлийн эмчээс ${mmFmtMNT(tier6-tier5)}, хамгийн өндрөөс ${mmFmtMNT(tier7-tier5)}-өөр бага). Гэхдээ энэ бол ердөө эхлэлийн шат — Ерөнхий мэргэшлээ дүүргэсний дараа өөр нарийн мэргэжил рүү шилжиж болно.`;
  const salaryHtml=`<p>💰 <b>Цалингийн боломж:</b> ${top.name}-ийн үндсэн цалин 2026 оны эцсийн байдлаар ойролцоогоор <b>${mmFmtMNT(salInfo.base2026)}</b> байна (2025 онд ${mmFmtMNT(salInfo.base2025)} байснаас өссөн). ${salaryNote} <span style="opacity:.6;font-size:12px;">Эх сурвалж: ЭМЯ-ны 2026.05.21-ний албан бичиг, Засгийн газрын 135 тоот тогтоол.</span></p>`;

  // Квот — ЭМХТ-ийн 2025-2026 оны бодит элсэлтийн тоо, Төрийн сан ба Хувь зардлаар тусад нь
  const quota=MM_QUOTA_2025[top.key];
  const stateQ=MM_QUOTA_STATE[top.key]||0, privQ=MM_QUOTA_PRIVATE[top.key]||0;
  let quotaHtml='';
  if(quota!=null){
    let warnTxt='';
    if(privQ>0 && privQ<=3) warnTxt=` ⚠️ <b>Анхаар:</b> Хувь зардлаар суралцах байрны тоо маш цөөн (${privQ} байр) байгаа тул хэрэв та хувь зардлаар энэ чиглэлээр орох бодолтой бол өрсөлдөөн маш өндөр, хэцүү байх магадлалтай гэдгийг анхаараарай.`;
    else if(stateQ===0) warnTxt=` ⚠️ Энэ чиглэлээр 2025-2026 онд Төрийн сангийн (үнэгүй) байр огт байгаагүй — зөвхөн Хувь зардлаар (${privQ} байр) элссэн байна.`;
    quotaHtml=`<p>🎓 <b>Элсэлтийн өрсөлдөөн:</b> 2025-2026 оны хичээлийн жилд энэ чиглэлээр нийт <b>${quota} хүн</b> резидентурт элссэн (Төрийн сан: ${stateQ}, Хувь зардал: ${privQ}). Улсын хэмжээнд нийт ${MM_EXAM_STATS.totalTook} хүн шалгалт өгч, ердөө ${MM_EXAM_STATS.passRate}% нь 60+ оноо авсан (дундаж оноо ${MM_EXAM_STATS.avgScore}), одоогийн журмаар тэнцэх албан ёсны босго ${MM_EXAM_STATS.officialThreshold}% байна — тиймээс энэ чиглэлээр орох гэж байгаа бол үүнээс дээгүүр оноо авахаар бэлдэх нь зүйтэй.${warnTxt}</p>`;
  }

  const intlScore=uv.international||0;
  const specIntl=spec.p[traitIdx('international')];
  let intlHtml;
  if(intlScore>0.3 && specIntl>=1){
    intlHtml=`<p>🌎 <b>Гадаад боломж:</b> Та гадаадад суралцах/ажиллах сонирхол өндөр байгаа бөгөөд энэ мэргэжил олон улсад мэргэшлийн хувьд харьцангуй хүлээн зөвшөөрөгддөг тул таны зорилготой нийцэж байна.</p>`;
  }else if(intlScore>0.3 && specIntl<1){
    intlHtml=`<p>🌎 <b>Гадаад боломж:</b> Та гадаадад суралцах/ажиллах бодолтой байгаа боловч, энэ тодорхой мэргэжил гадаадын residency/сургалтын системд онцгой давуу тал багатай эсвэл өрсөлдөөн ихтэй байж болзошгүй тул энэ талаараа нэмэлт судалгаа хийхийг зөвлөж байна — өөрийн зорилготойгоо тохирч буй эсэхийг сайтар нягтлаарай.</p>`;
  }else{
    intlHtml=`<p>🌎 <b>Гадаад боломж:</b> Таны хариултаас харахад та Монголдоо ажиллах сонирхол харьцангуй өндөр байна — энэ нь энэ мэргэжлийн Монгол дахь бодит хэрэгцээтэй сайн нийцэж байна.</p>`;
  }

  const demandTxt = top.demandScore!=null
    ? `10,000 хүн амд <b>${top.mongoliaPer10k}</b> эмч ногдож байгаа нь (${top.mongoliaCount} эмч, 2020 оны судалгаагаар) улсын нийт дундаж ${MM_NATIONAL_AVG_PER10K}-аас (бүх мэргэжил нийлбэрээр) ${top.mongoliaPer10k<3?'МАШ доогуур':top.mongoliaPer10k<8?'доогуур':'дээгүүр'} байна`
    : (top.mongoliaNote||'тодорхой тоо баримт алга');

  // Олон улсын харьцуулалт — WHO 2019 өгөгдөл (нийт их эмчийн түвшинд)
  const intlCompareHtml=`<p>🌐 <b>Олон улсын харьцуулалт:</b> Ерөнхийдөө Монгол улсад 10,000 хүнд 28.9 их эмч ногдож байгаа нь дэлхийн дундаж (15.1)-аас 1.9 дахин, хөгжиж буй орнуудаас (жишээ нь Вьетнам 8.2, Индонез 3.8)-аас 3 дахин их байна. Гэвч энэ нь **мэргэшлийн чиглэл тус бүрээр жигд бус тархсан** — Улаанбаатарт төвлөрөл өндөр, зарим аймагт тодорхой нарийн мэргэжил огт байхгүй.</p>`;

  const subspec=MM_SUBSPECIALTY_NOTE[top.key]||'Цаашдын төрөлжих боломжийн тухай тодорхой мэдээлэл бэлдэгдэж байна.';

  const policyNote = `<p>⚠️ <b>2026 оны бодлогын чухал өөрчлөлт:</b> Эрүүл мэндийн сайдын 2026 оны шинэ журмаар, 2026 оноос хойш төгссөн Хүний их эмч нар ЗӨВХӨН "Ерөнхий мэргэшил судлал"-аар эхлээд элсэх ёстой болсон (үндсэн мэргэшлийн сургалт 3-аас доошгүй жилтэй, эхний жил нь Ерөнхий мэргэшил байх). Өөрөөр хэлбэл ${top.key==='general'?'энэ чиглэл (Ерөнхий мэргэшил) нь одоо БҮХ шинэ төгсөгчийн заавал эхлэх цэг болсон':'2026-с хойш төгсвөл эхлээд Ерөнхий мэргэшлээр 1 жил сурч, дараа нь энэ чиглэл рүү шилжих ёстой болсон'} — өмнөх шигээ шууд элсэх боломжгүй тул сургалтын төлөвлөгөөгөө үүнд тааруулан бодоорой. Элсэлтийн шалгалтад тэнцэх босго оноо 70% байна.</p>`;

  return `<div class="mm-writeup">
    <div class="mm-writeup-title">📖 «${escH(top.name)}» — дэлгэрэнгүй тайлбар</div>
    <p>🧠 <b>Тохироо:</b> Таны хариултаар энэ мэргэжил <b>${top.fit}%</b> тохирч байна. Хамгийн их нөлөөлсөн зан чанарын шинжүүд: <b>${escH(traitTxt)}</b>.</p>
    <p>🇲🇳 <b>Монголын одоогийн эрэлт:</b> ${demandTxt}.</p>
    ${salaryHtml}
    ${quotaHtml}
    ${intlHtml}
    ${intlCompareHtml}
    <p>🚀 <b>Ирээдүйн боломж:</b> ${mmImpactStars(top.impact)} — Монголд одоогоор гадаадад эмчлүүлэх шаардлагатай (2024 оны ЭМЯ-ны тушаалын жагсаалтад орсон) зарим өндөр технологийн эмчилгээг ирээдүйд нутагшуулах боломжийн үнэлгээ.</p>
    <p>📚 <b>Сургалт:</b> Резидентур ойролцоогоор <b>${top.trainingYears} жил</b> үргэлжилнэ.</p>
    ${policyNote}
    <p>🧭 <b>Цаашдын карьерын зам:</b> ${escH(subspec)}</p>
    <div class="mm-writeup-disclaimer">* Дээрх дүгнэлт таны хариултаас автоматаар үүсгэгдсэн, зөвлөмжийн шинж чанартай болно. Цалин, квот, эмчийн нөөцийн тоо албан ёсны эх сурвалжаас (ЭМЯ, ЭМХТ) авсан бодит тоо боловч цаг хугацааны хувьд өөрчлөгдөж болно. Эцсийн шийдвэрээ мэргэжлийн зөвлөгөө, өөрийн судалгаагаараа баталгаажуулаарай.</div>
  </div>`;
}

// ── Хамтын коммент хэсэг (хүмүүс бие биедээ туслах) — тест эхлэхээс өмнө ч, дараа нь ч уншиж болно ──
async function mmLoadComments(){
  try{
    const snap=await getDocs(query(collection(fsdb,'mm_comments'), orderBy('ts','desc'), limit(100)));
    const comments=[]; snap.forEach(d=>comments.push({id:d.id,...d.data()}));
    mmRenderComments(comments);
  }catch(e){
    console.error('[MM] load comments err',e);
    document.querySelectorAll('.mm-comments-list').forEach(el=>el.innerHTML='<div class="mm-comments-empty">Ачаалахад алдаа гарлаа.</div>');
  }
}
function mmRenderComments(comments){
  const html = comments.length
    ? comments.map(c=>`<div class="mm-comment-row">
        <div class="mm-comment-head"><span class="mm-comment-name">${escH(c.name||'Зочин')}</span><span class="mm-comment-time">${mmTimeAgo(c.ts)}</span></div>
        <div class="mm-comment-text">${escH(c.text)}</div>
      </div>`).join('')
    : '<div class="mm-comments-empty">Одоогоор коммент алга — та эхнийх нь болоорой!</div>';
  document.querySelectorAll('.mm-comments-list').forEach(el=>el.innerHTML=html);
}
function mmTimeAgo(ts){
  if(!ts) return '';
  const diff=Date.now()-ts, min=Math.floor(diff/60000), hr=Math.floor(diff/3600000), day=Math.floor(diff/86400000);
  if(min<1) return 'дөнгөж сая';
  if(min<60) return min+' мин өмнө';
  if(hr<24) return hr+' цаг өмнө';
  return day+' өдөр өмнө';
}
async function mmPostComment(inputId){
  if(!currentUser){ openLogin(); return; }
  const input=document.getElementById(inputId);
  const text=input.value.trim();
  if(!text){ notify('Коммент бичнэ үү'); return; }
  if(text.length>500){ notify('Коммент 500 тэмдэгтээс ихгүй байх ёстой'); return; }
  const name=currentUser.displayName||(currentUser.email?currentUser.email.split('@')[0]:'Хэрэглэгч');
  try{
    const id='mm'+Date.now()+Math.random().toString(36).slice(2,6);
    await setDoc(doc(fsdb,'mm_comments',id),{uid:currentUser.uid, name, text, ts:Date.now()});
    input.value='';
    mmLoadComments();
  }catch(e){ console.error(e); notify('Коммент илгээхэд алдаа гарлаа'); }
}

window.mmStartQuiz=mmStartQuiz;
window.qrBuildCareerQuizCard=qrBuildCareerQuizCard;
window.mmPostComment=mmPostComment;
window.mmToggleIntent=mmToggleIntent;window.mmConfirmIntent=mmConfirmIntent;
window.mmAnswer=mmAnswer;window.mmGoBack=mmGoBack;window.mmExitQuiz=mmExitQuiz;
