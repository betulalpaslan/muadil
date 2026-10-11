// Trendyol yorum sınıflandırıcısı — trendyol.com'daki bir sekmede javascript_tool ile bir kez çalıştırılır.
// Kurallar Bargello puanlamasında (Ekim 2026) kullanılanla aynıdır; değiştirirsen eski sonuçlarla karşılaştırılamaz.
//
// Kullanım (sayfada):
//   window.__META[id]   = [contentId, 'Orijinal Marka Parfüm', 'Orijinal Marka']   // id ör. 'Mad W191'
//   window.__DEALER[id] = ekContentId          // isteğe bağlı: yorum yetmezse sayılacak ek ilan (başka boy, bayi)
//   window.__Q = [contentId, ...]; window.__maxPages = 40; window.__loop2();   // arka planda yorum çeker
//   window.__doKod(id)   -> sayım + puan        window.__doComb(id) -> eksik puanı ek ilanla tamamlar
//   window.__mention(contentId) -> yorumlarda en çok geçen parfüm adları (kod eşleştirmesini doğrulamak için)
//   window.__export([id, ...]) -> her id için JSON metni (birlestir.py'nin "sayimlar" girdisi)
{
(()=>{
const N=s=>(s||'').toLocaleLowerCase('tr').replace(/ı/g,'i').replace(/ş/g,'s').replace(/ç/g,'c').replace(/ğ/g,'g').replace(/ö/g,'o').replace(/ü/g,'u').replace(/[âàá]/g,'a').replace(/[îìí]/g,'i').replace(/[éèê]/g,'e').replace(/[’'`´]/g,'').replace(/(.)\1{2,}/g,'$1').replace(/\s+/g,' ');
window.__N=N;
window.__jobs=window.__jobs||{};
const MID='(?:da |de |hic |pek |cok |asla |o kadar |o kadarda |pek de |gibi |hic de |fazla |asiri |maalesef |malesef |yine |ise |cok da |uzun sure |artik |sanki |bence |o kadar da |hicte |hic bir sekilde )*';
const K_REL=/kalic|ucuyor|ucucu|ucup|\buctu\b|ucmus|kalmiyor|gun boyu|butun gun|tum gun|aksama kadar|geceye kadar|ertesi gun|saatlerce|uzun sure|\d\s*saat|(bir|yarim|iki|uc|bes|alti|yedi|sekiz|on) saat|dakika|hemen (gidiyor|geciyor|kayboluyor|siliniyor)/;
const K_NEU=[/(umarim|insallah|in sallah|umuyorum).{0,30}kalic/,/kalic\w*.{0,40}(bakacag|bakmis olucam|gorecez|gorecegiz|gorucez|goreceg|bilmiyorum|diyemem|diyemiyorum|fikrim yok|yorum yapam|kullaninca|guncelle|zamanla|henuz|test ed|deneyip|denemedim|anlayacag)/,/henuz.{0,40}kalic/];
const K_NEG=[new RegExp('kalic\\w*\\s+'+MID+'(degil|deil|degl|degildi|olmuyor|olmayan|olmadi|olmamis|olmadigi)'),new RegExp('kalic\\w*\\s+'+MID+'(yok|az|dusuk|kotu|zayif|sifir|berbat|yetersiz|eksik|rezalet)\\b'),/(sifir|\b0) kalic/,new RegExp('kalic\\w*\\s+'+MID+'(iyi|guzel|yeterli|yuksek|basarili|uzun) (degil|deil|olmayan)'),/kalic\w*.{0,30}(olumlu degil|begenmedim|memnun (kalmadim|degilim|kalamadim)|istedigim gibi degil|beklentimi karsila(ma|mi)|hayal kirikl|sikinti var|sorunu var|problemi var)/,/(?<!biraz )(daha|cok daha) kalici olmasini (bekler|ister|umar)|keske (daha )?kalic|kalici olsa(ydi)? (keske|super|mukemmel|daha)/,/\bucuyor|ucucu|ucup gid|\buctu\b|ucmus|hemen (gidiyor|geciyor|kayboluyor|siliniyor|kaciyor)|kokusu kalmiyor|\bkalmiyor/,/(\d+|bir|yarim|iki|uc|on|bes) ?dakika (sonra|icinde|bile|kaliyor|yok|sur)/];
const K_ORTA=[/kalic\w* (da |de |ise )?(orta|normal|idare|eh iste|ortalama|fena degil|vasat|ne iyi ne kotu|makul|standart|kismen)/,/orta (seviye|derece|halli)\w*.{0,15}kalic/,/kismen kalic|biraz daha (kalici|olsa)|kalic\w* biraz daha|yungul kalic|hafif kalic|kalic\w* hafif/,/kalic\w*.{0,15}(bu fiyata|fiyatina gore)|(bu fiyata|fiyatina gore).{0,20}kalic/,/kalic\w*.{0,30}bazen.{0,30}bazen/];
const K_POS=[/kalic\w*\s+(?:da |de |ise |cok |gayet |baya |bayagi |asiri |oldukca |son derece |gercekten |inanilmaz |super |ayrica |acayip )*(iyi|guzel|mukemmel|harika|super|yuksek|efsane|basarili|muthis|muhtesem|on numara|mukemel|muk|tavan|sahane|yeterli|var\b|uzun|tatmin|10 numara|bomba|ideal|fazla|hos)/,/(cok|gayet|baya|bayagi|asiri|oldukca|epey|super|inanilmaz|efsane|muthis|son derece|\ben|daha|acayip|fazlasiyla|yeterince|ayrica|\bhem|kesinlikle|gercekten|tam) kalic/,/kalic\w*.{0,20}(memnunum|memnun kaldim|begendim|sorun yok|problem yok)/,/gun boyu|butun gun|tum gun|aksama (kadar|dek)|geceye kadar|ertesi gun|saatlerce|uzun sure (kal|kok|dur|gid)|yikan\w*.{0,25}(kok|kal)/,/\bkalici(dir|d[ia]r|lar)?\b/];
const KARGO=/kargo|teslim|geldi|elime|siparis|ulasti|paket/;
function hours(t){let neg=0,orta=0,pos=0;const re=/(\d+(?:[.,]\d+)?)\s*(?:-|–|ile|veya|\/|ya da)?\s*(\d+)?\s*saat/g;let m;while((m=re.exec(t))){const ctx=t.slice(Math.max(0,m.index-30),m.index+m[0].length+30);if(KARGO.test(ctx)||/\b24\b/.test(m[0]))continue;const v=Math.max(parseFloat(m[1].replace(',','.')),m[2]?parseFloat(m[2]):0);if(v<=3)neg++;else if(v<5)orta++;else if(v<=48)pos++;}
const w=t.match(/\b(bir|yarim|iki|uc|bes|alti|yedi|sekiz|dokuz|on|oniki) saat/g)||[];w.forEach(x=>{const ctx=t.slice(Math.max(0,t.indexOf(x)-30),t.indexOf(x)+40);if(KARGO.test(ctx))return;if(/^(bir|yarim|iki|uc)/.test(x))neg++;else pos++;});return{neg,orta,pos};}
window.__kLabel=c=>{const t=N(c);const h=hours(t);if(!K_REL.test(t)&&!(h.neg+h.orta+h.pos))return null;let s=t,neu=0,neg=h.neg,orta=h.orta,pos=h.pos;
for(const re of K_NEU){if(re.test(s)){neu++;s=s.replace(re,' # ');}}
for(const re of K_NEG){const g=new RegExp(re.source,'g');const m=s.match(g);if(m){neg+=m.length;s=s.replace(g,' # ');}}
for(const re of K_ORTA){const g=new RegExp(re.source,'g');const m=s.match(g);if(m){orta+=m.length;s=s.replace(g,' # ');}}
for(const re of K_POS){const g=new RegExp(re.source,'g');const m=s.match(g);if(m){pos+=m.length;s=s.replace(g,' # ');}}
if(neg&&pos)return'orta';if(neg)return'neg';if(orta)return'orta';if(pos)return'pos';if(neu)return'neu';return'bel';};
const ALIAS={'yves saint laurent':['ysl'],'jean paul gaultier':['jpg'],'calvin klein':['ck'],'dolce & gabbana':['dg','d&g'],"victoria's secret":['vs','victoria'],'maison francis kurkdjian':['mfk','baccarat'],'carolina herrera':['ch'],'emporio armani':['armani'],'giorgio armani':['armani'],'paco rabanne':['paco','rabanne'],'hugo boss':['boss','hugo']};
const STOPT=new Set(['for','her','him','men','man','pour','homme','femme','the','one','de','la','le','eau','di','des','du','by','edp','edt','parfum','intense','with','est','dont','be','love','y']);
window.__refs=(orijinal,marka)=>{const toks=new Set();N(orijinal).replace(/[^a-z0-9& ]/g,' ').split(' ').forEach(w=>{if(w&&!STOPT.has(w)&&w.length>=2)toks.add(w);});const mk=N(marka||'');(ALIAS[mk]||[]).forEach(a=>toks.add(a));return[...toks];};
window.__classify=(cid,orijinal,marka)=>{const job=window.__jobs[cid];const refs=window.__refs(orijinal,marka);const K={pos:[],orta:[],neg:[],neu:[],bel:[]},B={pos:[],orta:[],neg:[]};
job.reviews.forEach(r=>{const k=window.__kLabel(r.c);if(k)K[k].push(r);const b=window.__bLabel(r.c,refs);if(b)B[b].push(r);});
job.K=K;job.B=B;job.refs=refs;const s=job.summary||{};const tag=(s.tags||[]).find(x=>x.name==='Kalıcılık');
return{cid,refs,yildiz:s.averageRating,degerlendirme:s.totalRatingCount,yorum:s.totalCommentCount,okunan:job.reviews.length,ilk:job.reviews.length?new Date(job.reviews.at(-1).t).toISOString().slice(0,10):null,
k:{pos:K.pos.length,orta:K.orta.length,neg:K.neg.length,neu:K.neu.length,bel:K.bel.length},b:{pos:B.pos.length,orta:B.orta.length,neg:B.neg.length},tyKalicilik:tag?tag.sentiment||{count:tag.count}:null};};
window.__show=(cid,grp,lab,n=15,len=110)=>{const a=window.__jobs[cid][grp][lab];return a.slice(0,n).map(r=>r.rate+'★ '+r.c.replace(/\s+/g,' ').slice(0,len));};
})();

// Puan: 1 + 9 × (olumlu + 0,5 × orta) / toplam; ilgili yorum 5'ten azsa null ("yetersiz"). 5–7 yorumlu puan Excel'de "az kanıt" diye işaretlenir.
if(!window.__kLabel0) window.__kLabel0=window.__kLabel;
window.__score=(o)=>{const f=(p,m,n)=>{const tot=p+m+n; return tot<5?null:Math.floor(1+9*(p+0.5*m)/tot+0.5);}; return {k:f(o.k.pos,o.k.orta,o.k.neg), b:f(o.b.pos,o.b.orta,o.b.neg)};};

// Aksan temizliği (Lancôme gibi adlar için)
const strip=s=>(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'');
if(!window.__N0) window.__N0=window.__N;
window.__N=s=>window.__N0(s).normalize('NFD').replace(/[̀-ͯ]/g,'');
if(!window.__refs0) window.__refs0=window.__refs;
window.__refs=(o,m)=>window.__refs0(strip(o),strip(m));

// Benzerlik sınıflandırıcısı
(()=>{
const B_NEG=/benzemiyor|benzemez|benzetemedim|benzetmedim|alakasi (yok|yoktu|olmayan|bile yok|dahi yok)|alakasi oldugunu dusunmuyorum|alakasiz|ilgisi (yok|olmayan)|ayni degil|aynisi degil|ayni kokmuyor|gibi kokmuyor|uzaktan yakindan|uzak yakin|yakindan uzaktan|benzedigini dusunmuyorum|hic benzer|benzerligi yok|muadili (asla |hic )?degil|cok farkli/g;
const B_POS=/birebir|bire bir|aynisi|ayni koku|ayni kokuyor|aynisini|tipatip|tipa tip|benziyor|benzer\b|benzerlik|farki yok|farki yoktu|\bfark yok|(cok |baya |oldukca |epey |gayet )?yakin|esdeger|es deger|hatirlatiyor|andiriyor|gibi kokuyor|ta kendisi|ayirt edilemez|ayirt edemez|kopyasi|(orijinal|orjinal)\w* gibi/g;
const B_EXCL=/yanlis urun|baska urun|farkli (bir )?urun gel|\beski(si|den)? .{0,20}(gibi|ile|kadar)|onceki (aldig|siparis)|daha once aldig|ilk aldig|magaza(dan aldig|daki)|bayiden|baska satici|diger satici|fotograftaki|resimdeki|gorseldeki|carsida/;
const B_STOPN=/(erkek|kolonya|kolanya|deterjan|sabun|haci|lavanta|yasli|amca|dayi|teyze|oda|bebek|sampuan|kis|yaz|cicek|meyve|pudra|vanilya|alkol|ilac|kimyasal|ucuz|tarcin|deodorant|tuvalet|wc|surup|good girl|kadin|parfumune|parfumlerine|sabunu)\w*\s*(\S+\s+)?$/;
window.__bLabel1=(c,refs)=>{let t=window.__N(c);
const R=refs.map(x=>'\\b'+x.replace(/[&]/g,'\\&')+(x.length<=3?'(ye|ya|yi|nin|den|dan|e|a|i)?\\b':'\\w*')).join('|');
const ORI='orijinal\\w*|orjinal\\w*|original\\w*|orginal\\w*|gercegi(yle|ne|nin|nden)?\\b|gercek (parfum|koku)\\w*|\\basli(ni|na|yla|ndan)?\\b'+(R?'|'+R:'');
const oriRe=new RegExp('('+ORI+')'); const refRe=new RegExp('('+ORI+'|\\bmuadil)');
t=t.replace(/yakin zaman|yakinda|yakinlarim|yakin arkadas|aynisi (\S+ )?geldi|fotograftakinin aynisi|resimdekinin aynisi|gorseldekinin aynisi/g,' # ');
t=t.replace(/(benziyor|benzer|ayni|aynisi|birebir|bire bir) (diyen|dedikleri|diyorlar|denilen|dediler|yaziyor|deniyor|diye)\w*/g,' # ');
t=t.replace(/(urun|parfum|koku|kokusu)\w* (orijinal|orjinal) (degil|mi)/g,' # ');
const strong=/(birebir|bire bir|tipatip|tipa tip|ta kendisi)/.test(t)&&!/(urun|gorsel|fotograf|resim|paket|kutu|sise|kargo|siparis)\w*.{0,25}(birebir|bire bir|tipatip|tipa tip)|(birebir|bire bir|tipatip|tipa tip).{0,25}(urun|gorsel|fotograf|resim|paket|kutu|sise|geldi)/.test(t);
const hasRef=refRe.test(t); if(!hasRef&&!strong)return null;
if(B_EXCL.test(t)&&!oriRe.test(t))return null;
let neg=0,pos=0;
const dynNeg=new RegExp('(asla|hic|kesinlikle) ('+(R||'zzzz')+') (degil|deil)|('+(R||'zzzz')+') degil\\b|(orijinal|orjinal)\\w* gibi (degil|deil)|(orijinal|orjinal|original'+(R?'|'+R:'')+')\\w*.{0,15}(cok )?(farkli|uzak)\\b','g');
let m=t.match(dynNeg); if(m){neg+=m.length;t=t.replace(dynNeg,' # ');}
m=t.match(B_NEG); if(m){neg+=m.length;t=t.replace(B_NEG,' # ');}
const dynPos=new RegExp('(orijinal|orjinal|original'+(R?'|'+R:'')+')\\w* (ile |la |le |e |a )?(neredeyse |tamamen |hemen hemen |tipki |tam |resmen )?ayni\\b|neredeyse ayni|(orijinal|orjinal)\\w* (de |da )?kullan\\w*.{0,60}(en (iyi|guzel|basarili) muadil|cok (iyi|basarili|guzel) (bir )?muadil)','g');
m=t.match(dynPos); if(m){pos+=m.length;t=t.replace(dynPos,' # ');}
const re=new RegExp(B_POS.source,'g'); let x; while((x=re.exec(t))){const pre=t.slice(Math.max(0,x.index-30),x.index); if(/benziyor|benzer|gibi kokuyor|hatirlatiyor|andiriyor|yakin/.test(x[0])&&B_STOPN.test(pre))continue; pos++;}
if(/(orijinal|orjinal|para|binlerce|dunyanin|servet)\w*.{0,40}gerek yok/.test(t))pos++;
if(neg&&pos)return'orta'; if(neg)return'neg'; if(pos)return'pos'; return null;};
})();

// Yanlış sınıflanan kalıplar için düzeltmeler (sıra önemli)
window.__kLabel=c=>{let t=__N(c);
t=t.replace(/\bdeyil\b|\bdegil\b|\bdeil\b|\bdegl\b/g,'degil');
t=t.replace(/(kalic\w*) (\w+ )?bile (degil)/g,'$1 degil');
t=t.replace(/(daha|biraz daha) (fazla )?kalici olabilir\w*/g,' kismen kalici ');
t=t.replace(/(kalic\w*) ve (guzel|hos|iyi|yogun|etkili) (degil)/g,'$1 degil');
t=t.replace(/(kalic\w*) ve (yayilim\w*|kokusu|etkisi|yogunlugu|performans\w*|kalitesi) /g,'$1 ');
t=t.replace(/\bsu gibi\b/g,' kalici degil ');
return window.__kLabel0(t);};
window.__bLabel=(c,refs)=>{let t=__N(c)
 .replace(/(benzer|ayni|aynisi) oldugunu (pek |hic |da )?(dusunmuyorum|sanmiyorum)/g,' benzemiyor ')
 .replace(/(benzedigini|benzettigimi) (pek |hic )?(dusunmuyorum|sanmiyorum|soyleyemem)/g,' benzemiyor ')
 .replace(/(orijinal|orjinal)\w* gibi (olmuyor|olmaz|olamaz|olmamis|degil|deil)/g,' benzemiyor ')
 .replace(/(sprey|sac|sampuan|sabun|deodorant|kolonya|krem|losyon|vucut|oda kokusu|camasir)\w*(.{0,40}?)(birebir|bire bir|tipatip|tipa tip|aynisi)/g,'$1$2 # ');
 return window.__bLabel1(t,refs);};
if(!window.__kLabel2) window.__kLabel2=window.__kLabel;
window.__kLabel=c=>window.__kLabel2(__N(c).replace(/(kalic\w*) (bir |bi )?(koku|parfum)\w* (\w+ )?(degil|deyil|deil|olmadi|olmuyor)/g,'$1 degil'));
if(!window.__kLabel3) window.__kLabel3=window.__kLabel;
window.__kLabel=c=>window.__kLabel3(__N(c).replace(/\bne (\w+ )?kalic\w* ne ?de\b/g,' kalici degil ').replace(/\bne kalic\w*\b/g,' kalici degil '));
if(!window.__bLabel2) window.__bLabel2=window.__bLabel;
window.__bLabel=(c,refs)=>window.__bLabel2(__N(c).replace(/benzer (bi|bir) (kokusu|koku|yani|tarafi)\w* (yok|olmayan)/g,' benzemiyor ').replace(/benzerlik (yok|gostermiyor)/g,' benzemiyor '),refs);
if(!window.__kLabel4) window.__kLabel4=window.__kLabel;
window.__kLabel=c=>window.__kLabel4(__N(c).replace(/(kalic\w*) (bir |bi )?(koku|parfum)\w* (yok|olmayan)/g,'$1 degil'));
if(!window.__bLabel3) window.__bLabel3=window.__bLabel;
window.__bLabel=(c,refs)=>window.__bLabel3(__N(c).replace(/(cok ?ta |cok da |pek )?yakin (bi |bir )?(koku )?(degil|deil|olmayan)/g,' benzemiyor '),refs);
if(!window.__kLabel5) window.__kLabel5=window.__kLabel;
window.__kLabel=c=>window.__kLabel5(__N(c).replace(/(kalic\w*) (\w+ )?(uzun |fazla |cok )?(surmuyor|kalmiyor|durmuyor|gitmiyor|tutmuyor)/g,'$1 degil'));

// Yorum çekme: sekme arka plandayken zamanlayıcılar kısılmasın diye Worker ile bekler.
// Bir hata (HTTP ≠ 200, JSON yerine doğrulama sayfası) olursa kuyruk DURUR; kullanıcıya sormadan devam etme.
const w=new Worker(URL.createObjectURL(new Blob(['onmessage=e=>setTimeout(()=>postMessage(e.data.id),e.data.ms)'],{type:'text/javascript'})));
window.__tw=w;
window.__sleep=ms=>new Promise(r=>{const id=Math.random();const h=e=>{if(e.data===id){w.removeEventListener('message',h);r();}};w.addEventListener('message',h);w.postMessage({id,ms});});
window.__runJobW=async(cid,maxPages)=>{const job={cid,status:'running',pages:0,reviews:[],summary:null,err:null};window.__jobs[cid]=job;
 try{for(let p=0;p<maxPages;p++){const u=`https://apigw.trendyol.com/discovery-storefront-trproductgw-service/api/review-read/product-reviews/detailed?contentId=${cid}&page=${p}&pageSize=50&order=DESC&orderBy=CreatedDate&channelId=1`;
  const r=await fetch(u,{credentials:'include'}); if(r.status!==200){job.err='HTTP '+r.status;break;}
  let j; try{j=await r.json();}catch(e){job.err='JSON degil (dogrulama sayfasi olabilir)';break;}
  if(!j.result){job.err='result yok';break;} if(!job.summary)job.summary=j.result.summary;
  const rv=j.result.reviews||[]; rv.forEach(x=>job.reviews.push({id:x.id,rate:x.rate,c:x.comment||'',t:x.createdAt})); job.pages=p+1;
  if(rv.length<50||p+1>=j.result.summary.totalPages)break; await window.__sleep(2500+Math.random()*1000);}
  job.status=job.err?'error':'done';}catch(e){job.status='error';job.err=String(e);} };
window.__Q=window.__Q||[];
window.__loop2=async()=>{window.__loopOn=1; while(window.__loopOn&&window.__Q.length){const cid=window.__Q.shift(); if(window.__jobs[cid]&&window.__jobs[cid].status==='done')continue; await window.__runJobW(cid,window.__maxPages||40); if(window.__jobs[cid].status==='error'){window.__loopOn=0;break;} await window.__sleep(3000);} window.__loopOn=0;};
window.__durum=()=>({kuyruk:window.__Q.length, calisiyor:!!window.__loopOn, bitmeyen:Object.values(window.__jobs).filter(j=>j.status&&j.status!=='done').map(j=>j.cid+':'+j.status+':'+j.pages+(j.err?':'+j.err:''))});

// Sayım, ek ilanla tamamlama, dışa aktarma
window.__res=window.__res||{}; window.__DEALER=window.__DEALER||{}; window.__META=window.__META||{};
window.__doKod=(kod)=>{const [cid,o,m]=window.__META[kod]; const j=window.__jobs[cid]; if(!j||j.status!=='done') return kod+': '+(j?j.status+' '+j.pages:'kuyrukta'); const r=window.__classify(cid,o,m); r.kod=kod; r.score=window.__score(r); window.__res[kod]=r; return kod+' | '+r.yildiz+'★ '+r.degerlendirme+'/'+r.yorum+' okunan '+r.okunan+' | K '+r.k.pos+'/'+r.k.orta+'/'+r.k.neg+' →'+r.score.k+' | B '+r.b.pos+'/'+r.b.orta+'/'+r.b.neg+' →'+r.score.b;};
window.__doComb=(kod)=>{const [cid,o,m]=__META[kod]; const d=__DEALER[kod]; const jd=__jobs[d]; if(!jd||jd.status!=='done') return kod+': ek ilan bekliyor'; window.__doKod(kod); const base=__res[kod]; const key='c'+kod; const seen=new Set(); const revs=[...__jobs[cid].reviews,...jd.reviews].filter(r=>{if(seen.has(r.id))return false;seen.add(r.id);return true;}); __jobs[key]={cid:key,status:'done',reviews:revs,summary:__jobs[cid].summary}; const c=__classify(key,o,m); const sc=__score(c); const notes=[];
 if(base.score.k==null){base.k=c.k; base.score.k=sc.k; base.kCid=key; notes.push('kalıcılık');}
 if(base.score.b==null){base.b=c.b; base.score.b=sc.b; base.bCid=key; notes.push('benzerlik');}
 base.not=notes.length?(notes.join(' ve ')+' için ek ilan p-'+d+' ('+jd.reviews.length+' yorum) da sayıldı'+((base.score.k==null||base.score.b==null)?'; yine de yetersiz':'')+'. '):'';
 return kod+' | K '+base.k.pos+'/'+base.k.orta+'/'+base.k.neg+' →'+base.score.k+' | B '+base.b.pos+'/'+base.b.orta+'/'+base.b.neg+' →'+base.score.b+' | '+base.not;};
window.__win=(txt,re,len)=>{const s=txt.replace(/\s+/g,' ').trim(); const m=s.match(re); if(!m) return s.length<=len?s:s.slice(0,len-1)+'…'; let a=Math.max(0,m.index-Math.floor(len/2)); let b=Math.min(s.length,a+len); a=Math.max(0,b-len); return (a>0?'…':'')+s.slice(a,b)+(b<s.length?'…':'');};
window.__ex1=(arr,re,len=60)=>{if(!arr.length)return null; const sorted=arr.slice().sort((x,y)=>x.c.length-y.c.length); const pick=sorted[Math.floor(sorted.length/3)]; return __win(pick.c,re,len);};
const KRE=/kal[ıi]c|u[çc]uyor|u[çc]tu|saat|g[üu]n boyu|ak[şs]ama|kalm[ıi]yor|su gibi|dakika/i, BRE=/birebir|bire bir|ayn[ıi]|benz|alakas|ilgisi|t[ıi]pa ?t[ıi]p|fark|yak[ıi]n|uzak|gerek yok|or[ij]+inal/i;
window.__export=(kods)=>kods.map(k=>{const r=window.__res[k]; if(!r)return null; const jk=window.__jobs[r.kCid||r.cid], jb=window.__jobs[r.bCid||r.cid]; return JSON.stringify({id:String(k),cid:r.cid,yildiz:r.yildiz,degerlendirme:r.degerlendirme,yorum:r.yorum,okunan:r.okunan,ilk:r.ilk,k:{pos:r.k.pos,orta:r.k.orta,neg:r.k.neg,ex:{pos:__ex1(jk.K.pos,KRE),neg:__ex1(jk.K.neg,KRE)}},b:{pos:r.b.pos,orta:r.b.orta,neg:r.b.neg,ex:{pos:__ex1(jb.B.pos,BRE,70),neg:__ex1(jb.B.neg,BRE,70)}},score:r.score,ty:r.tyKalicilik,not:r.not||''});}).filter(Boolean);

// Kod eşleştirmesini doğrulama: yorumlarda en çok geçen parfüm/marka adları
const NAMES=['sauvage','bleu','chanel','aventus','creed','baccarat','540','black opium','la vie','good girl','invictus','eros','libre','coco','mademoiselle','chance','jadore','j adore','hypnotic','addict','armani','passione','my way','acqua','gio','code','stronger','swy','idole','hypnose','alien','olympea','olimpia','lady million','one million','1 million','le male','scandal','212','vip','bottled','boss','the one','euphoria','chloe','crystal','terre','hermes','polo','ralph','narciso','bombshell','kilian','orchid','candy','noa','interdit','paradox','delina','kirke','miss dior','blooming','cool water','ultra male','dylan','versace','dior','paco','gaultier','jpg','tom ford','prada','ysl','lancome','dolce','gabbana','davidoff','bvlgari','lacoste','azzaro','mugler','valentino','gucci','burberry','givenchy','carolina','marly','tiziana','kurkdjian'];
window.__mention=(cid)=>{const j=window.__jobs[cid]; if(!j||j.status!=='done') return 'bekliyor'; const cnt={}; j.reviews.forEach(r=>{const t=' '+window.__N(r.c).replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ')+' '; NAMES.forEach(n=>{if(t.includes(' '+n)) cnt[n]=(cnt[n]||0)+1;});}); return j.reviews.length+' yorum | '+Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,7).map(([n,c])=>n+':'+c).join(', ');};
}
'siniflandirici kuruldu';
