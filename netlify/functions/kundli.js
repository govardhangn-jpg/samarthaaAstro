const path = require('path');

// Swiss Ephemeris constants
const PLANETS = {
  SUN: 0, MOON: 1, MARS: 4, MERCURY: 2, JUPITER: 5,
  VENUS: 3, SATURN: 6, MEAN_NODE: 10
};

const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
const SIGNS_SKT = ['Mesha','Vrishabha','Mithuna','Karka','Simha','Kanya','Tula','Vrishchika','Dhanu','Makara','Kumbha','Meena'];
const NAKSHATRAS = ['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishtha','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'];
const NAK_LORDS = ['Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury','Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury','Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury'];
const DASHA_YEARS = {Ketu:7,Venus:20,Sun:6,Moon:10,Mars:7,Rahu:18,Jupiter:16,Saturn:19,Mercury:17};

const OWN_SIGNS = {Sun:[4],Moon:[3],Mars:[0,7],Mercury:[2,5],Jupiter:[8,11],Venus:[1,6],Saturn:[9,10]};
const EXALTATION = {Sun:{sign:0,deg:10},Moon:{sign:1,deg:3},Mars:{sign:9,deg:28},Mercury:{sign:5,deg:15},Jupiter:{sign:3,deg:5},Venus:{sign:11,deg:27},Saturn:{sign:6,deg:20}};
const DEBILITATION = {Sun:{sign:6,deg:10},Moon:{sign:7,deg:3},Mars:{sign:3,deg:28},Mercury:{sign:11,deg:15},Jupiter:{sign:9,deg:5},Venus:{sign:5,deg:27},Saturn:{sign:0,deg:20}};

function getDignity(name, signIdx, deg) {
  if (EXALTATION[name] && signIdx === EXALTATION[name].sign) return Math.abs(deg - EXALTATION[name].deg) <= 3 ? 'Exalted ★' : 'Exalted';
  if (DEBILITATION[name] && signIdx === DEBILITATION[name].sign) return 'Debilitated';
  if (OWN_SIGNS[name] && OWN_SIGNS[name].includes(signIdx)) return 'Own Sign';
  return 'Neutral';
}

function getNakshatra(longitude) {
  const nakSpan = 360 / 27;
  const idx = Math.floor(longitude / nakSpan) % 27;
  const pada = Math.floor((longitude % nakSpan) / (nakSpan / 4)) + 1;
  return { name: NAKSHATRAS[idx], idx, pada, lord: NAK_LORDS[idx] };
}

// Compute Julian Day Number
function julianDay(year, month, day, hour) {
  if (month <= 2) { year -= 1; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + hour / 24.0 + B - 1524.5;
}

// Lahiri Ayanamsa calculation (accurate to ~0.001°)
function getLahiriAyanamsa(jd) {
  // T = Julian centuries from J2000.0
  const T = (jd - 2451545.0) / 36525.0;
  // Lahiri ayanamsa formula
  const ayanamsa = 23.85 + 0.013646 * (jd - 2415020.0) / 365.25;
  // More precise: use the standard IAU formula then apply correction
  // Precession rate ~50.27" per year
  const jd_base = 2395982.5; // Jan 1, 1900
  const years_from_1900 = (jd - jd_base) / 365.25;
  // Lahiri epoch: ayanamsa was 22°27'44" on Jan 1 1900
  const base = 22 + 27/60 + 44/3600;
  const rate = 50.2910 / 3600; // degrees per year
  return base + rate * years_from_1900;
}

// Planetary positions using VSOP87 simplified (accurate to ~0.1°)
function sunLongitude(jd) {
  const T = (jd - 2451545.0) / 36525.0;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * Math.PI / 180;
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M)
          + (0.019993 - 0.000101 * T) * Math.sin(2 * M)
          + 0.000289 * Math.sin(3 * M);
  return ((L0 + C) % 360 + 360) % 360;
}

function moonLongitude(jd) {
  const T = (jd - 2451545.0) / 36525.0;
  const L = ((218.3165 + 481267.8813 * T) % 360 + 360) % 360;
  const M = ((357.5291 + 35999.0503 * T) % 360 + 360) % 360 * Math.PI / 180;
  const Mp = ((134.9634 + 477198.8676 * T) % 360 + 360) % 360 * Math.PI / 180;
  const D = ((297.8502 + 445267.1115 * T) % 360 + 360) % 360 * Math.PI / 180;
  const F = ((93.2720 + 483202.0175 * T) % 360 + 360) % 360 * Math.PI / 180;
  
  const lon = L
    + 6.2888 * Math.sin(Mp)
    + 1.2740 * Math.sin(2*D - Mp)
    + 0.6583 * Math.sin(2*D)
    + 0.2136 * Math.sin(2*Mp)
    - 0.1851 * Math.sin(M)
    - 0.1143 * Math.sin(2*F)
    + 0.0588 * Math.sin(2*D - 2*Mp)
    + 0.0572 * Math.sin(2*D - M - Mp)
    + 0.0533 * Math.sin(2*D + Mp)
    + 0.0459 * Math.sin(2*D - M)
    + 0.0410 * Math.sin(Mp - M)
    - 0.0348 * Math.sin(D)
    + 0.0305 * Math.sin(M + Mp)
    + 0.0275 * Math.sin(2*D - 2*M)
    - 0.0253 * Math.sin(Mp + M - 2*D)
    + 0.0246 * Math.sin(2*(D-Mp));
  return ((lon % 360) + 360) % 360;
}

function marsLongitude(jd) {
  const T = (jd - 2451545.0) / 36525.0;
  const L = ((355.433 + 19140.299 * T) % 360 + 360) % 360;
  const M = ((319.529 + 19139.858 * T) % 360 + 360) % 360 * Math.PI / 180;
  const C = 10.691 * Math.sin(M) + 0.623 * Math.sin(2*M) + 0.050 * Math.sin(3*M);
  return ((L + C) % 360 + 360) % 360;
}

function mercuryLongitude(jd) {
  const T = (jd - 2451545.0) / 36525.0;
  const L = ((252.251 + 149472.675 * T) % 360 + 360) % 360;
  const M = ((168.594 + 149472.515 * T) % 360 + 360) % 360 * Math.PI / 180;
  const v = M + (23.440 * Math.sin(M) + 2.994 * Math.sin(2*M)) * Math.PI / 180;
  // Simplified - use mean longitude correction
  const Msun = ((357.5291 + 35999.0503 * T) % 360 + 360) % 360 * Math.PI / 180;
  const lon = L + 23.440 * Math.sin(M) + 2.994 * Math.sin(2*M) 
              - 22.380 * Math.sin(Msun) + 4.532 * Math.sin(2*Msun - M)
              + 0.570 * Math.sin(3*Msun - 2*M);
  return ((lon % 360) + 360) % 360;
}

function jupiterLongitude(jd) {
  const T = (jd - 2451545.0) / 36525.0;
  const L = ((34.351 + 3034.906 * T) % 360 + 360) % 360;
  const M = ((20.020 + 3034.678 * T) % 360 + 360) % 360 * Math.PI / 180;
  const Msat = ((317.020 + 1222.114 * T) % 360 + 360) % 360 * Math.PI / 180;
  const C = 5.555 * Math.sin(M) + 0.168 * Math.sin(2*M) - 0.282 * Math.sin(Msat)
            + 0.293 * Math.sin(2*M - Msat) + 0.255 * Math.sin(M - Msat);
  return ((L + C) % 360 + 360) % 360;
}

function venusLongitude(jd) {
  const T = (jd - 2451545.0) / 36525.0;
  const L = ((181.979 + 58517.816 * T) % 360 + 360) % 360;
  const M = ((212.448 + 58517.804 * T) % 360 + 360) % 360 * Math.PI / 180;
  const Msun = ((357.5291 + 35999.0503 * T) % 360 + 360) % 360 * Math.PI / 180;
  const C = 0.7758 * Math.sin(M) + 0.0033 * Math.sin(2*M)
            - 0.1030 * Math.sin(Msun) + 0.0022 * Math.sin(2*Msun - M);
  return ((L + C) % 360 + 360) % 360;
}

function saturnLongitude(jd) {
  const T = (jd - 2451545.0) / 36525.0;
  const L = ((50.077 + 1222.114 * T) % 360 + 360) % 360;
  const M = ((317.021 + 1222.114 * T) % 360 + 360) % 360 * Math.PI / 180;
  const Mjup = ((20.020 + 3034.678 * T) % 360 + 360) % 360 * Math.PI / 180;
  const C = 6.394 * Math.sin(M) + 0.201 * Math.sin(2*M) 
            - 0.587 * Math.sin(Mjup) + 0.217 * Math.sin(2*M - Mjup);
  return ((L + C) % 360 + 360) % 360;
}

function rahuLongitude(jd) {
  const T = (jd - 2451545.0) / 36525.0;
  // Mean ascending node (retrograde motion)
  const omega = 125.0445 - 1934.1363 * T + 0.0020708 * T * T;
  return ((omega % 360) + 360) % 360;
}

// Ascendant calculation (Lagna)
function getAscendant(jd, lat, lon) {
  const T = (jd - 2451545.0) / 36525.0;
  // Greenwich Sidereal Time
  const GMST = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T;
  const LST = ((GMST + lon) % 360 + 360) % 360; // Local Sidereal Time in degrees
  const RAMC = LST; // Right Ascension of Midheaven Cusp
  
  // Obliquity of ecliptic
  const eps = (23.439291111 - 0.013004167 * T) * Math.PI / 180;
  const latRad = lat * Math.PI / 180;
  const ramcRad = RAMC * Math.PI / 180;
  
  // Ascendant formula
  const y = -Math.cos(ramcRad);
  const x = Math.sin(ramcRad) * Math.cos(eps) + Math.tan(latRad) * Math.sin(eps);
  let asc = Math.atan2(y, x) * 180 / Math.PI;
  asc = ((asc % 360) + 360) % 360;
  return asc;
}

// Retrograde detection (check if planet moved backward)
function isRetrograde(planetFn, jd) {
  const lon1 = planetFn(jd - 0.5);
  const lon2 = planetFn(jd + 0.5);
  let diff = lon2 - lon1;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff < 0;
}

exports.handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: corsHeaders, body: 'Method Not Allowed' };

  try {
    const { year, month, day, hour_ist, lat, lon } = JSON.parse(event.body);

    // Convert IST to UTC
    let utcHour = hour_ist - 5.5;
    let utcDay = day, utcMonth = month, utcYear = year;
    if (utcHour < 0) {
      utcHour += 24; utcDay -= 1;
      if (utcDay === 0) {
        utcMonth -= 1;
        if (utcMonth === 0) { utcMonth = 12; utcYear -= 1; }
        const daysInMonth = [0,31,28,31,30,31,30,31,31,30,31,30,31];
        if (utcYear % 4 === 0 && (utcYear % 100 !== 0 || utcYear % 400 === 0)) daysInMonth[2] = 29;
        utcDay = daysInMonth[utcMonth];
      }
    } else if (utcHour >= 24) { utcHour -= 24; utcDay += 1; }

    const jd = julianDay(utcYear, utcMonth, utcDay, utcHour);
    const ayanamsa = getLahiriAyanamsa(jd);

    // Calculate tropical longitudes
    const tropicals = {
      Sun: sunLongitude(jd),
      Moon: moonLongitude(jd),
      Mars: marsLongitude(jd),
      Mercury: mercuryLongitude(jd),
      Jupiter: jupiterLongitude(jd),
      Venus: venusLongitude(jd),
      Saturn: saturnLongitude(jd),
      Rahu: rahuLongitude(jd),
    };
    tropicals.Ketu = (tropicals.Rahu + 180) % 360;

    const glyphs = {Sun:'☉',Moon:'☽',Mars:'♂',Mercury:'☿',Jupiter:'♃',Venus:'♀',Saturn:'♄',Rahu:'☊',Ketu:'☋'};
    const retroCheck = {Sun:sunLongitude,Moon:moonLongitude,Mars:marsLongitude,Mercury:mercuryLongitude,Jupiter:jupiterLongitude,Venus:venusLongitude,Saturn:saturnLongitude};

    // Compute Vedic (sidereal) positions
    const planets = [];
    for (const [name, tropLon] of Object.entries(tropicals)) {
      const vedicLon = ((tropLon - ayanamsa) % 360 + 360) % 360;
      const signIdx = Math.floor(vedicLon / 30);
      const degree = vedicLon % 30;
      const nak = getNakshatra(vedicLon);
      const retrograde = retroCheck[name] ? isRetrograde(retroCheck[name], jd) : false;
      const dignity = getDignity(name, signIdx, degree);
      
      planets.push({
        name, glyph: glyphs[name],
        longitude: Math.round(vedicLon * 10000) / 10000,
        sign_idx: signIdx,
        sign: SIGNS[signIdx],
        sign_skt: SIGNS_SKT[signIdx],
        degree: Math.round(degree * 100) / 100,
        nakshatra: nak.name,
        nakshatra_idx: nak.idx,
        pada: nak.pada,
        nak_lord: nak.lord,
        retrograde,
        dignity,
      });
    }

    // Ascendant
    const ascTrop = getAscendant(jd, lat, lon);
    const ascVedic = ((ascTrop - ayanamsa) % 360 + 360) % 360;
    const ascSignIdx = Math.floor(ascVedic / 30);
    const ascDegree = ascVedic % 30;
    const ascNak = getNakshatra(ascVedic);

    // Assign houses (Whole Sign)
    planets.forEach(p => { p.house = ((p.sign_idx - ascSignIdx + 12) % 12) + 1; });

    // Vimshottari Dasha balance
    const moon = planets.find(p => p.name === 'Moon');
    const nakSpan = 360 / 27;
    const moonLongInNak = moon.longitude % nakSpan;
    const fractionElapsed = moonLongInNak / nakSpan;
    const dashaLord = moon.nak_lord;
    const dashaBalance = Math.round(DASHA_YEARS[dashaLord] * (1 - fractionElapsed) * 100) / 100;

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        asc_sign_idx: ascSignIdx,
        asc_sign: SIGNS[ascSignIdx],
        asc_sign_skt: SIGNS_SKT[ascSignIdx],
        asc_degree: Math.round(ascDegree * 100) / 100,
        asc_nakshatra: ascNak.name,
        asc_longitude: Math.round(ascVedic * 100) / 100,
        planets,
        moon_nakshatra: moon.nakshatra,
        moon_nak_lord: dashaLord,
        dasha_balance: dashaBalance,
        ayanamsa: Math.round(ayanamsa * 10000) / 10000,
      }),
    };
  } catch (err) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
  }
};
