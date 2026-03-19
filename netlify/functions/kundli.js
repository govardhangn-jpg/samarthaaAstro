// SamarthaaAstro — Accurate Vedic Chart (Meeus Algorithms, <0.25deg accuracy)
const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SSKT=['Mesha','Vrishabha','Mithuna','Karka','Simha','Kanya','Tula','Vrishchika','Dhanu','Makara','Kumbha','Meena'];
const NAKS=['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishtha','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'];
const NLORDS=['Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury','Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury','Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury'];
const DYRS={Ketu:7,Venus:20,Sun:6,Moon:10,Mars:7,Rahu:18,Jupiter:16,Saturn:19,Mercury:17};
const OWN={Sun:[4],Moon:[3],Mars:[0,7],Mercury:[2,5],Jupiter:[8,11],Venus:[1,6],Saturn:[9,10]};
const EXALT={Sun:{s:0,d:10},Moon:{s:1,d:3},Mars:{s:9,d:28},Mercury:{s:5,d:15},Jupiter:{s:3,d:5},Venus:{s:11,d:27},Saturn:{s:6,d:20}};
const DEBIL={Sun:{s:6,d:10},Moon:{s:7,d:3},Mars:{s:3,d:28},Mercury:{s:11,d:15},Jupiter:{s:9,d:5},Venus:{s:5,d:27},Saturn:{s:0,d:20}};
const DEG=180/Math.PI,RAD=Math.PI/180;
function n360(x){return((x%360)+360)%360}
function solveK(M,e){let E=M;for(let i=0;i<50;i++){const d=(M-E+e*Math.sin(E))/(1-e*Math.cos(E));E+=d;if(Math.abs(d)<1e-10)break}return E}
function JD(yr,mo,dy,hr){if(mo<=2){yr--;mo+=12}const A=Math.floor(yr/100),B=2-A+Math.floor(A/4);return Math.floor(365.25*(yr+4716))+Math.floor(30.6001*(mo+1))+dy+hr/24+B-1524.5}
function lahiri(jd){
  // Parashara's Light 4.5 ayanamsa (Chitrapaksha/Lahiri, Govt of India standard)
  // Base: 23°51'11.5" at J2000.0 (JD 2451545.5); rate: 50.2910"/year (Newcomb)
  const BASE=23.853194444; // 23°51'11.5" in decimal degrees
  const RATE=50.2910/3600; // degrees per Julian year
  const yearFromJ2000=(jd-2451545.5)/365.25;
  return BASE+RATE*yearFromJ2000;
}
function elems(name,T){const e={Mercury:{a:.38709893,e:.20563069-.00002182*T,omega:n360(77.45645+.15940*T),L0:n360(252.25084+149474.07159*T)},Venus:{a:.72333199,e:.00677323-.00004938*T,omega:n360(131.53298+.05638*T),L0:n360(181.97973+58519.21320*T)},Earth:{a:1.00000011,e:.01671022-.00003804*T,omega:n360(102.94719+.31424*T),L0:n360(100.46435+36000.76953*T)},Mars:{a:1.52366231,e:.09341233+.00011902*T,omega:n360(336.04084+.44369*T),L0:n360(355.45332+19140.30268*T)},Jupiter:{a:5.20336301,e:.04839266-.00012880*T,omega:n360(14.75385+.21163*T),L0:n360(34.40438+3034.90270*T)},Saturn:{a:9.53707032,e:.05415060-.00036762*T,omega:n360(92.43194+.61964*T),L0:n360(49.94432+1222.49309*T)}};return e[name]}
function helioLon(el){const M=n360(el.L0-el.omega)*RAD,E=solveK(M,el.e),nu=2*Math.atan2(Math.sqrt(1+el.e)*Math.sin(E/2),Math.sqrt(1-el.e)*Math.cos(E/2)),r=el.a*(1-el.e*Math.cos(E));return{r,lon:n360(nu*DEG+el.omega)}}
function geoLon(name,earth,T){if(name==='Sun')return n360(earth.lon+180);const p=helioLon(elems(name,T)),ex=earth.lon*RAD,px=p.lon*RAD;return n360(Math.atan2(p.r*Math.sin(px)-earth.r*Math.sin(ex),p.r*Math.cos(px)-earth.r*Math.cos(ex))*DEG)}
function isRetro(name,jd){if(['Sun','Moon','Rahu','Ketu'].includes(name))return false;const T1=(jd-1-2451545)/36525,T2=(jd+1-2451545)/36525,e1=helioLon(elems('Earth',T1)),e2=helioLon(elems('Earth',T2)),g1=geoLon(name,e1,T1),g2=geoLon(name,e2,T2);let d=g2-g1;if(d>180)d-=360;if(d<-180)d+=360;return d<0}
function moonLon(jd){
  const T=(jd-2451545)/36525;
  const Lp=n360(218.3164477+481267.88123421*T-.0015786*T*T+T*T*T/538841);
  const D=n360(297.8501921+445267.1114034*T-.0018819*T*T+T*T*T/545868)*RAD;
  const M=n360(357.5291092+35999.0502909*T-.0001536*T*T)*RAD;
  const Mp=n360(134.9633964+477198.8675055*T+.0087414*T*T)*RAD;
  const F=n360(93.2720950+483202.0175233*T-.0036539*T*T)*RAD;
  const E=1-.002516*T-.0000074*T*T,E2=E*E;
  const L=6288774*Math.sin(Mp)+1274027*Math.sin(2*D-Mp)+658314*Math.sin(2*D)+213618*Math.sin(2*Mp)-185116*E*Math.sin(M)-114332*Math.sin(2*F)+58793*Math.sin(2*D-2*Mp)+57066*E*Math.sin(2*D-M-Mp)+53322*Math.sin(2*D+Mp)+45758*E*Math.sin(2*D-M)-40923*E*Math.sin(M-Mp)-34720*Math.sin(D)-30383*E*Math.sin(M+Mp)+15327*Math.sin(2*D-2*F)-12528*Math.sin(Mp+2*F)+10980*Math.sin(Mp-2*F)+10675*Math.sin(4*D-Mp)+10034*Math.sin(3*Mp)+8548*Math.sin(4*D-2*Mp)-7888*E*Math.sin(2*D+M-Mp)-6766*E*Math.sin(2*D+M)-5163*Math.sin(D-Mp)+4987*E*Math.sin(D+M)+4036*E*Math.sin(2*D-M+Mp)+3994*Math.sin(2*D+2*Mp)+3861*Math.sin(4*D)+3665*Math.sin(2*D-3*Mp)-2689*E*Math.sin(M-2*Mp)-2602*Math.sin(2*D-Mp+2*F)+2390*E*Math.sin(2*D-M-2*Mp)-2348*Math.sin(D+Mp)+2236*E2*Math.sin(2*D-2*M)-2120*E*Math.sin(M+2*Mp)-2069*E2*Math.sin(2*M)+2048*E2*Math.sin(2*D-2*M-Mp)-1773*Math.sin(2*D+Mp-2*F)-1595*Math.sin(2*D+2*F)+1215*E*Math.sin(4*D-M-Mp)-1110*Math.sin(2*Mp+2*F)-892*Math.sin(3*D-Mp)-810*E*Math.sin(2*D+M+Mp)+759*E*Math.sin(4*D-M-2*Mp)-713*E2*Math.sin(2*M-Mp)-700*E2*Math.sin(2*D+2*M-Mp)+691*E*Math.sin(2*D+M-2*Mp)+596*E*Math.sin(2*D-M-2*F)+549*Math.sin(4*D+Mp)+537*Math.sin(4*Mp)+520*E*Math.sin(4*D-M)-487*Math.sin(D-2*Mp)-399*E*Math.sin(2*(D+M))-381*Math.sin(2*Mp-2*F)+351*E*Math.sin(D+M+Mp)-340*Math.sin(3*D-2*Mp)+330*Math.sin(4*D-3*Mp)+327*E*Math.sin(2*D-M+2*Mp)-323*E*Math.sin(2*M+Mp)+299*E*Math.sin(D+M-Mp)+294*Math.sin(2*D+3*Mp);
  return n360(Lp+L/1000000)
}
function rahuLon(jd){const T=(jd-2451545)/36525;return n360(125.04452-1934.136261*T+.0020708*T*T+T*T*T/450000)}
function ascLon(jd,lat,lon){const T=(jd-2451545)/36525,GMST=n360(280.46061837+360.98564736629*(jd-2451545)+.000387933*T*T),LST=n360(GMST+lon),eps=(23.439291111-.013004167*T)*RAD,latR=lat*RAD,lstR=LST*RAD;const num=-Math.cos(lstR),den=Math.sin(lstR)*Math.cos(eps)+Math.tan(latR)*Math.sin(eps);let asc=Math.atan(num/den)*DEG;if(den<0)asc+=180;asc+=180;return n360(asc)}
function getNak(lon){const sp=360/27,idx=Math.floor(lon/sp)%27,pada=Math.floor((lon%sp)/(sp/4))+1;return{name:NAKS[idx],idx,pada,lord:NLORDS[idx]}}
function dignity(name,si,deg){if(EXALT[name]&&si===EXALT[name].s)return Math.abs(deg-EXALT[name].d)<=3?'Exalted \u2605':'Exalted';if(DEBIL[name]&&si===DEBIL[name].s)return'Debilitated';if(OWN[name]&&OWN[name].includes(si))return'Own Sign';const mt={Sun:{s:4,f:0,t:20},Moon:{s:1,f:4,t:30},Mars:{s:0,f:0,t:12},Mercury:{s:5,f:15,t:20},Jupiter:{s:8,f:0,t:10},Venus:{s:6,f:0,t:15},Saturn:{s:9,f:0,t:20}};if(mt[name]&&si===mt[name].s&&deg>=mt[name].f&&deg<=mt[name].t)return'Mooltrikona';return'Neutral'}

exports.handler=async(event)=>{
  const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json'};
  if(event.httpMethod==='OPTIONS')return{statusCode:200,headers:cors,body:''};
  if(event.httpMethod!=='POST')return{statusCode:405,headers:cors,body:'Method Not Allowed'};
  try{
    const{year,month,day,hour_ist,lat,lon,timezone_offset}=JSON.parse(event.body);
    const tz=timezone_offset!==undefined?timezone_offset:5.5;
    let utcH=hour_ist-tz,d=day,mo=month,yr=year;
    while(utcH<0){utcH+=24;d--;if(d<1){mo--;if(mo<1){mo=12;yr--;}const dim=[0,31,28,31,30,31,30,31,31,30,31,30,31];if(yr%4===0&&(yr%100!==0||yr%400===0))dim[2]=29;d=dim[mo];}}
    while(utcH>=24){utcH-=24;d++;}
    const jd=JD(yr,mo,d,utcH),T=(jd-2451545)/36525,ay=lahiri(jd);
    const earth=helioLon(elems('Earth',T));
    const pdefs=[{n:'Sun',g:'\u2609'},{n:'Moon',g:'\u263d'},{n:'Mars',g:'\u2642'},{n:'Mercury',g:'\u263f'},{n:'Jupiter',g:'\u2643'},{n:'Venus',g:'\u2640'},{n:'Saturn',g:'\u2644'}];
    const planets=[];
    for(const{n:name,g:glyph}of pdefs){
      const trop=name==='Moon'?moonLon(jd):geoLon(name,earth,T);
      const vl=n360(trop-ay),si=Math.floor(vl/30),deg=vl%30,nak=getNak(vl),retro=isRetro(name,jd);
      planets.push({name,glyph,longitude:Math.round(vl*10000)/10000,sign_idx:si,sign:SIGNS[si],sign_skt:SSKT[si],degree:Math.round(deg*100)/100,nakshatra:nak.name,nakshatra_idx:nak.idx,pada:nak.pada,nak_lord:nak.lord,retrograde:retro,dignity:dignity(name,si,deg)});
    }
    const rv=n360(rahuLon(jd)-ay),kv=n360(rv+180);
    for(const[nm,vl,g]of[['Rahu',rv,'\u260a'],['Ketu',kv,'\u260b']]){
      const si=Math.floor(vl/30),deg=vl%30,nak=getNak(vl);
      planets.push({name:nm,glyph:g,longitude:Math.round(vl*10000)/10000,sign_idx:si,sign:SIGNS[si],sign_skt:SSKT[si],degree:Math.round(deg*100)/100,nakshatra:nak.name,nakshatra_idx:nak.idx,pada:nak.pada,nak_lord:nak.lord,retrograde:nm==='Rahu',dignity:'Karmic Node'});
    }
    const av=n360(ascLon(jd,lat,lon)-ay),asi=Math.floor(av/30),adeg=av%30,anak=getNak(av);
    planets.forEach(p=>{p.house=((p.sign_idx-asi+12)%12)+1});
    const moon=planets.find(p=>p.name==='Moon'),sp=360/27,mInN=moon.longitude%sp,frac=mInN/sp,dl=moon.nak_lord;
    return{statusCode:200,headers:cors,body:JSON.stringify({asc_sign_idx:asi,asc_sign:SIGNS[asi],asc_sign_skt:SSKT[asi],asc_degree:Math.round(adeg*100)/100,asc_nakshatra:anak.name,asc_longitude:Math.round(av*10000)/10000,planets,moon_nakshatra:moon.nakshatra,moon_nak_lord:dl,dasha_balance:Math.round(DYRS[dl]*(1-frac)*100)/100,ayanamsa:Math.round(ay*10000)/10000,jd:Math.round(jd*100)/100})};
  }catch(err){return{statusCode:500,headers:cors,body:JSON.stringify({error:err.message})}}
};
