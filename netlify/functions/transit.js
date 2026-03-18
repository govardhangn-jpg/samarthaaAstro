// SamarthaaAstro — Today's Accurate Transiting Positions
// Uses same Meeus orbital mechanics as kundli.js

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SSKT=['Mesha','Vrishabha','Mithuna','Karka','Simha','Kanya','Tula','Vrishchika','Dhanu','Makara','Kumbha','Meena'];
const NAKS=['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishtha','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'];
const DEG=180/Math.PI,RAD=Math.PI/180;
function n360(x){return((x%360)+360)%360}
function solveK(M,e){let E=M;for(let i=0;i<50;i++){const d=(M-E+e*Math.sin(E))/(1-e*Math.cos(E));E+=d;if(Math.abs(d)<1e-10)break}return E}
function JD(yr,mo,dy,hr){if(mo<=2){yr--;mo+=12}const A=Math.floor(yr/100),B=2-A+Math.floor(A/4);return Math.floor(365.25*(yr+4716))+Math.floor(30.6001*(mo+1))+dy+hr/24+B-1524.5}
function lahiri(jd){return 23.857092+(50.27/3600)*((jd-2451545)/365.25)}
function elems(name,T){const e={Mercury:{a:.38709893,e:.20563069-.00002182*T,omega:n360(77.45645+.15940*T),L0:n360(252.25084+149474.07159*T)},Venus:{a:.72333199,e:.00677323-.00004938*T,omega:n360(131.53298+.05638*T),L0:n360(181.97973+58519.21320*T)},Earth:{a:1.00000011,e:.01671022-.00003804*T,omega:n360(102.94719+.31424*T),L0:n360(100.46435+36000.76953*T)},Mars:{a:1.52366231,e:.09341233+.00011902*T,omega:n360(336.04084+.44369*T),L0:n360(355.45332+19140.30268*T)},Jupiter:{a:5.20336301,e:.04839266-.00012880*T,omega:n360(14.75385+.21163*T),L0:n360(34.40438+3034.90270*T)},Saturn:{a:9.53707032,e:.05415060-.00036762*T,omega:n360(92.43194+.61964*T),L0:n360(49.94432+1222.49309*T)}};return e[name]}
function helioLon(el){const M=n360(el.L0-el.omega)*RAD,E=solveK(M,el.e),nu=2*Math.atan2(Math.sqrt(1+el.e)*Math.sin(E/2),Math.sqrt(1-el.e)*Math.cos(E/2)),r=el.a*(1-el.e*Math.cos(E));return{r,lon:n360(nu*DEG+el.omega)}}
function geoLon(name,earth,T){if(name==="Sun")return n360(earth.lon+180);const p=helioLon(elems(name,T)),ex=earth.lon*RAD,px=p.lon*RAD;return n360(Math.atan2(p.r*Math.sin(px)-earth.r*Math.sin(ex),p.r*Math.cos(px)-earth.r*Math.cos(ex))*DEG)}
function moonLon(jd){const T=(jd-2451545)/36525,Lp=n360(218.3164477+481267.88123421*T-.0015786*T*T),D=n360(297.8501921+445267.1114034*T-.0018819*T*T)*RAD,M=n360(357.5291092+35999.0502909*T)*RAD,Mp=n360(134.9633964+477198.8675055*T+.0087414*T*T)*RAD,F=n360(93.2720950+483202.0175233*T)*RAD,E=1-.002516*T;const L=6288774*Math.sin(Mp)+1274027*Math.sin(2*D-Mp)+658314*Math.sin(2*D)+213618*Math.sin(2*Mp)-185116*E*Math.sin(M)-114332*Math.sin(2*F)+58793*Math.sin(2*D-2*Mp)+57066*E*Math.sin(2*D-M-Mp)+53322*Math.sin(2*D+Mp)+45758*E*Math.sin(2*D-M)-40923*E*Math.sin(M-Mp)-34720*Math.sin(D)-30383*E*Math.sin(M+Mp)+15327*Math.sin(2*D-2*F)-12528*Math.sin(Mp+2*F)+10980*Math.sin(Mp-2*F)+10675*Math.sin(4*D-Mp)+10034*Math.sin(3*Mp)+8548*Math.sin(4*D-2*Mp)-7888*E*Math.sin(2*D+M-Mp)-6766*E*Math.sin(2*D+M)-5163*Math.sin(D-Mp)+4987*E*Math.sin(D+M)+4036*E*Math.sin(2*D-M+Mp)+3994*Math.sin(2*D+2*Mp)+3861*Math.sin(4*D)+3665*Math.sin(2*D-3*Mp)-2689*E*Math.sin(M-2*Mp)+2390*E*Math.sin(2*D-M-2*Mp)+2236*E*E*Math.sin(2*D-2*M)-2120*E*Math.sin(M+2*Mp)-2069*E*E*Math.sin(2*M)+2048*E*E*Math.sin(2*D-2*M-Mp)-1773*Math.sin(2*D+Mp-2*F)-1595*Math.sin(2*D+2*F);return n360(Lp+L/1000000)}
function rahuLon(jd){const T=(jd-2451545)/36525;return n360(125.04452-1934.136261*T)}
function isRetro(name,jd){if(["Sun","Moon","Rahu","Ketu"].includes(name))return false;const T1=(jd-1-2451545)/36525,T2=(jd+1-2451545)/36525,e1=helioLon(elems("Earth",T1)),e2=helioLon(elems("Earth",T2)),g1=geoLon(name,e1,T1),g2=geoLon(name,e2,T2);let d=g2-g1;if(d>180)d-=360;if(d<-180)d+=360;return d<0}
function getNak(lon){const sp=360/27,idx=Math.floor(lon/sp)%27,pada=Math.floor((lon%sp)/(sp/4))+1;return{name:NAKS[idx],idx,pada}}

// Vedic transit rules — which houses are sensitive for each natal lagna
const TRANSIT_RULES = {
  Saturn: {
    good:[3,6,11], bad:[1,2,4,5,7,8,10,12],
    specialBad: {7:"Kantaka Shani",8:"Ashtama Shani",12:"Saturn in 12th — losses",1:"Sade Sati peak"},
    sadesati_offset:[-1,0,1] // 12th, 1st, 2nd from natal moon
  },
  Jupiter: {
    good:[2,5,7,9,11], bad:[1,3,4,6,8,10,12],
    special:{5:"Guru in 5th — excellent for children/wisdom",9:"Guru in 9th — dharma/fortune",11:"Guru in 11th — gains"}
  },
  Mars:{good:[3,6,11],bad:[1,2,4,5,7,8,10,12]},
  Venus:{good:[1,2,3,4,5,8,9,11,12],bad:[6,7,10]},
  Mercury:{good:[2,4,6,8,10,11],bad:[1,3,5,7,9,12]},
  Sun:{good:[3,6,10,11],bad:[1,2,4,5,7,8,9,12]},
  Moon:{good:[1,3,6,7,10,11],bad:[2,4,5,8,9,12]},
  Rahu:{good:[3,6,11],bad:[2,5,9]},
  Ketu:{good:[3,6,11],bad:[4,8,12]}
};

exports.handler=async(event)=>{
  const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"Content-Type","Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json"};
  if(event.httpMethod==="OPTIONS")return{statusCode:200,headers:cors,body:""};
  try{
    const{date_str, natal_asc_si, natal_moon_si, natal_planet_signs}=JSON.parse(event.body);
    // Parse date
    const parts=date_str.split("-");
    const yr=parseInt(parts[0]),mo=parseInt(parts[1]),dy=parseInt(parts[2]);
    // Use noon IST = 6:30 UTC
    const jd=JD(yr,mo,dy,6.5);
    const T=(jd-2451545)/36525;
    const ay=lahiri(jd);
    const earth=helioLon(elems("Earth",T));

    const pdefs=[
      {n:"Sun",g:"☉"},{n:"Moon",g:"☽"},{n:"Mars",g:"♂"},
      {n:"Mercury",g:"☿"},{n:"Jupiter",g:"♃"},{n:"Venus",g:"♀"},
      {n:"Saturn",g:"♄"},{n:"Rahu",g:"☊"},{n:"Ketu",g:"☋"}
    ];

    const planets=[];
    for(const{n:name,g:glyph} of pdefs){
      let trop;
      if(name==="Moon") trop=moonLon(jd);
      else if(name==="Rahu") trop=rahuLon(jd);
      else if(name==="Ketu") trop=n360(rahuLon(jd)+180);
      else trop=geoLon(name,earth,T);
      const ved=n360(trop-ay);
      const si=Math.floor(ved/30);
      const deg=ved%30;
      const nak=getNak(ved);
      const retro=isRetro(name,jd);
      // Transit house from natal lagna
      const transitHouse=natal_asc_si!==undefined?((si-natal_asc_si+12)%12)+1:null;
      // Transit house from natal moon
      const transitFromMoon=natal_moon_si!==undefined?((si-natal_moon_si+12)%12)+1:null;
      // Transit quality
      const rules=TRANSIT_RULES[name];
      let quality="neutral";
      if(rules){
        if(transitHouse&&rules.good&&rules.good.includes(transitHouse)) quality="favourable";
        if(transitHouse&&rules.bad&&rules.bad.includes(transitHouse)) quality="challenging";
      }
      // Special conditions
      let specialNote="";
      if(name==="Saturn"&&natal_moon_si!==undefined){
        const moonDist=(si-natal_moon_si+12)%12;
        if(moonDist===11||moonDist===0||moonDist===1){
          specialNote="⚠ Sade Sati — Saturn transiting "+["12th","1st","2nd"][moonDist===11?0:moonDist===0?1:2]+" from natal Moon";
          quality="challenging";
        }
      }
      if(name==="Saturn"&&transitHouse===8) specialNote="⚠ Ashtama Shani";
      if(name==="Saturn"&&transitHouse===7) specialNote="⚠ Kantaka Shani";
      if(name==="Jupiter"&&transitHouse===5) specialNote="✦ Guru in 5th — wisdom & progeny";
      if(name==="Jupiter"&&transitHouse===9) specialNote="✦ Guru in 9th — fortune & dharma";
      if(name==="Jupiter"&&transitHouse===11) specialNote="✦ Guru in 11th — gains & fulfilment";

      // Check if transit planet is same sign as natal planet (conjunction)
      let conjunct=null;
      if(natal_planet_signs&&natal_planet_signs[name]===si){
        conjunct=name+" transiting own natal position";
      }

      planets.push({
        name,glyph,
        longitude:Math.round(ved*10000)/10000,
        sign_idx:si,sign:SIGNS[si],sign_skt:SSKT[si],
        degree:Math.round(deg*100)/100,
        nakshatra:nak.name,pada:nak.pada,
        retrograde:retro,
        transit_house:transitHouse,
        transit_from_moon:transitFromMoon,
        quality,
        special_note:specialNote,
        conjunct
      });
    }

    // Panchanga for the day
    const dow=new Date(date_str).getDay();
    const dayLords=["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"];
    const dayLord=dayLords[dow];
    const nakIdx=Math.floor(n360(moonLon(jd)-lahiri(jd))/(360/27))%27;

    return{statusCode:200,headers:cors,body:JSON.stringify({
      date:date_str,
      planets,
      panchanga:{
        vara:["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][dow],
        vara_lord:dayLord,
        moon_nakshatra:NAKS[nakIdx],
        ayanamsa:Math.round(lahiri(jd)*10000)/10000
      }
    })};
  }catch(e){return{statusCode:500,headers:cors,body:JSON.stringify({error:e.message})}}
};
