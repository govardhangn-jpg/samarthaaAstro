// SamarthaaAstro — Accurate Vimshottari Dasha + Antardasha Calculator
const DSEQ=['Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury'];
const DYRS={Ketu:7,Venus:20,Sun:6,Moon:10,Mars:7,Rahu:18,Jupiter:16,Saturn:19,Mercury:17};
const NLORDS=['Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury','Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury','Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury'];
const NNAMES=['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishtha','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'];

function addYrs(ms,y){return ms+y*365.25*24*3600*1000}
function fmt(ms){const d=new Date(ms),mn=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];return d.getDate()+'-'+mn[d.getMonth()]+'-'+d.getFullYear()}

exports.handler=async(event)=>{
  const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json'};
  if(event.httpMethod==='OPTIONS')return{statusCode:200,headers:cors,body:''};
  try{
    const{moon_longitude,birth_year,birth_month,birth_day,birth_hour_ist}=JSON.parse(event.body);
    const NS=360/27;
    const ni=Math.floor(moon_longitude/NS)%27;
    const moonInNak=moon_longitude%NS;
    const fracElapsed=moonInNak/NS;
    const fracRem=1-fracElapsed;
    const nakLord=NLORDS[ni];
    const balYrs=DYRS[nakLord]*fracRem;

    // Birth timestamp (UTC)
    const utcH=birth_hour_ist-5.5;
    const bMs=Date.UTC(birth_year,birth_month-1,birth_day)+utcH*3600000;
    const today=Date.now();
    const si=DSEQ.indexOf(nakLord);

    const mahas=[];
    let curMs=bMs;

    for(let i=0;i<9;i++){
      const mLord=DSEQ[(si+i)%9];
      const mYrs=i===0?balYrs:DYRS[mLord];
      const endMs=addYrs(curMs,mYrs);
      const isCurMaha=curMs<=today&&today<endMs;

      // Antardashas — sequence starts from Mahadasha lord
      const asi=DSEQ.indexOf(mLord);
      const antars=[];
      let aMs=curMs;

      for(let j=0;j<9;j++){
        const aLord=DSEQ[(asi+j)%9];
        // Full antardasha years = (Maha_yrs_total * Antar_yrs) / 120
        const fullAYrs=(DYRS[mLord]*DYRS[aLord])/120;
        // For first Mahadasha: scale by fracRem
        const aYrs=i===0?fullAYrs*fracRem:fullAYrs;
        const aEnd=addYrs(aMs,aYrs);
        antars.push({
          lord:aLord,
          start:fmt(aMs),end:fmt(aEnd),
          startMs:aMs,endMs:aEnd,
          years:Math.round(aYrs*1000)/1000,
          isCurrent:aMs<=today&&today<aEnd
        });
        aMs=aEnd;
      }

      mahas.push({
        lord:mLord,
        start:fmt(curMs),end:fmt(endMs),
        startMs:curMs,endMs:endMs,
        years:Math.round(mYrs*1000)/1000,
        isCurrent:isCurMaha,
        antardashas:antars
      });
      curMs=endMs;
    }

    const cMaha=mahas.find(m=>m.isCurrent)||mahas[0];
    const cAntar=cMaha?.antardashas?.find(a=>a.isCurrent);
    const yrsRemMaha=cMaha?Math.round((cMaha.endMs-today)/(365.25*86400000)*100)/100:0;
    const yrsRemAntar=cAntar?Math.round((cAntar.endMs-today)/(365.25*86400000)*100)/100:0;

    return{statusCode:200,headers:cors,body:JSON.stringify({
      moon_nakshatra:NNAMES[ni],moon_nak_lord:nakLord,
      balance_years:Math.round(balYrs*1000)/1000,
      balance_yrs:Math.floor(balYrs),
      balance_months:Math.floor((balYrs%1)*12),
      balance_days:Math.round(((balYrs%1)*12%1)*30),
      mahadashas:mahas,
      current_maha:cMaha?.lord,current_antar:cAntar?.lord,
      current_maha_end:cMaha?.end,current_antar_end:cAntar?.end,
      yrs_rem_maha:yrsRemMaha,yrs_rem_antar:yrsRemAntar
    })};
  }catch(e){return{statusCode:500,headers:cors,body:JSON.stringify({error:e.message})}}
};
