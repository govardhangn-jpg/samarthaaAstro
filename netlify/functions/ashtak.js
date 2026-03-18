// SamarthaaAstro — Accurate Ashtakavarga Calculator
// Based on Parashari BPHS, Chapter 66 — verified totals: 337 bindus

// Benefic house numbers (1-12) from each source planet
// Source: BPHS Shloka 66.15-66.75 (Santhanam translation, verified against JHora)
const BPHS = {
  Sun:{
    Sun:[1,2,4,7,8,9,10,11],Moon:[3,6,10,11],Mars:[1,2,4,7,8,9,10,11],
    Mercury:[3,5,6,9,10,11,12],Jupiter:[5,6,9,11],Venus:[6,7,12],
    Saturn:[1,2,4,7,8,9,10,11],Lagna:[3,4,6,10,11,12]
  },
  Moon:{
    Sun:[3,6,7,8,10,11],Moon:[1,3,6,7,10,11],Mars:[2,3,5,6,9,10,11],
    Mercury:[1,3,4,5,7,8,10,11],Jupiter:[1,4,7,8,10,11,12],Venus:[3,4,5,7,9,10,11],
    Saturn:[3,5,6,11],Lagna:[3,6,10,11]
  },
  Mars:{
    Sun:[3,5,6,10,11],Moon:[3,6,11],Mars:[1,2,4,7,8,10,11],
    Mercury:[3,5,6,11],Jupiter:[6,10,11,12],Venus:[6,8,11,12],
    Saturn:[1,4,7,8,9,10,11],Lagna:[1,4,7,8,10]
  },
  Mercury:{
    Sun:[5,6,9,11,12],Moon:[2,4,6,8,10,11],Mars:[1,2,4,7,8,9,10,11],
    Mercury:[1,3,5,6,9,10,11,12],Jupiter:[6,8,11,12],Venus:[1,2,3,4,5,8,9,11],
    Saturn:[1,2,4,7,8,9,10,11],Lagna:[1,2,4,6,8,10,11]
  },
  Jupiter:{
    Sun:[1,2,3,4,7,8,9,10,11],Moon:[2,5,7,9,11],Mars:[1,2,4,7,8,10,11],
    Mercury:[1,2,4,5,6,9,10,11],Jupiter:[1,2,3,4,7,8,10,11],Venus:[2,5,6,9,10,11],
    Saturn:[3,5,6,12],Lagna:[1,2,4,5,6,7,9,10,11]
  },
  Venus:{
    Sun:[8,11,12],Moon:[1,2,3,4,5,8,9,11,12],Mars:[3,4,6,9,11,12],
    Mercury:[3,5,6,9,11],Jupiter:[5,8,9,10,11],Venus:[1,2,3,4,5,8,9,10,11],
    Saturn:[3,4,5,8,9,10,11],Lagna:[1,2,3,4,5,8,9,11]
  },
  Saturn:{
    Sun:[1,2,4,7,8,9,10,11],Moon:[3,6,11],Mars:[3,5,6,10,11,12],
    Mercury:[6,8,9,10,11,12],Jupiter:[5,6,11,12],Venus:[6,11,12],
    Saturn:[3,5,6,11],Lagna:[1,3,4,6,10]
  }
};

const SIGNS=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SSKT=['Mesha','Vrishabha','Mithuna','Karka','Simha','Kanya','Tula','Vrishchika','Dhanu','Makara','Kumbha','Meena'];
const HOUSE_MEANINGS=['Self & Personality','Wealth & Family','Siblings & Courage','Home & Mother','Intelligence & Children','Health & Enemies','Spouse & Partnerships','Longevity & Transformation','Fortune & Higher Learning','Career & Status','Gains & Social Circle','Loss & Liberation'];

exports.handler=async(event)=>{
  const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json'};
  if(event.httpMethod==='OPTIONS')return{statusCode:200,headers:cors,body:''};
  try{
    // planet_positions: {Sun:si, Moon:si, Mars:si, ...} (sign indices 0-11)
    // asc_sign_idx: 0-11
    const{planet_positions,asc_sign_idx}=JSON.parse(event.body);

    const pOrder=['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn'];
    const sources={...planet_positions,Lagna:asc_sign_idx};

    // Binnashtakavarga (BAV) for each planet: array of 12 bindu counts
    const bav={};
    const sarva=new Array(12).fill(0);

    for(const target of pOrder){
      const tbl=BPHS[target];
      const counts=new Array(12).fill(0);
      for(const[source,beneficHouses] of Object.entries(tbl)){
        const srcSi=sources[source];
        if(srcSi===undefined||srcSi===null)continue;
        for(const houseNum of beneficHouses){
          // houseNum is 1-based position FROM source planet
          const targetSi=(srcSi+houseNum-1)%12;
          counts[targetSi]++;
        }
      }
      bav[target]=counts;
      counts.forEach((v,i)=>{sarva[i]+=v});
    }

    // Detailed house-by-house analysis
    const houses=sarva.map((score,i)=>({
      house:i+1,
      sign:SIGNS[i],
      sign_skt:SSKT[i],
      score,
      meaning:HOUSE_MEANINGS[i],
      strength:score>=30?'Strong':score>=25?'Moderate':'Weak',
      bav_breakdown:pOrder.map(p=>({planet:p,score:bav[p][i]}))
    }));

    // Find which house has planets and their transit strength
    const strongHouses=houses.filter(h=>h.score>=30).map(h=>'H'+h.house+' '+h.sign+' ('+h.score+')');
    const weakHouses=houses.filter(h=>h.score<=24).map(h=>'H'+h.house+' '+h.sign+' ('+h.score+')');

    // Verify total
    const total=sarva.reduce((a,b)=>a+b,0);

    return{statusCode:200,headers:cors,body:JSON.stringify({
      sarvashtakavarga:sarva,
      binnashtakavarga:bav,
      houses,
      strong_houses:strongHouses,
      weak_houses:weakHouses,
      total_bindus:total,
      // Planet-wise totals
      planet_totals:Object.fromEntries(pOrder.map(p=>[p,bav[p].reduce((a,b)=>a+b,0)]))
    })};
  }catch(e){return{statusCode:500,headers:cors,body:JSON.stringify({error:e.message})}}
};
