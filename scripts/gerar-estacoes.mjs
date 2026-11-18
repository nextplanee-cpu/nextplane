/**
 * Gera src/pages/crm/estacoes.js a partir de:
 *  - Wikipédia: lista de estações com código IATA (CC BY-SA)  -> iata-wiki.txt
 *  - Trainline EU stations.csv (ODbL)                          -> trainline.csv
 *  - complemento manual (estações fora da Europa, sem código)
 */
import fs from 'fs';
const D = (process.argv[2] || './dados-estacoes').replace(/[\\/]$/, '') + '/'
const OUT = new URL('../src/pages/crm/estacoes.js', import.meta.url)

const sa = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/* ---------- países e cidades em português ---------- */
const PAIS = {
  France: 'França', 'United Kingdom': 'Reino Unido', Germany: 'Alemanha', Italy: 'Itália', Spain: 'Espanha', Portugal: 'Portugal',
  Switzerland: 'Suíça', Netherlands: 'Países Baixos', 'The Netherlands': 'Países Baixos', Belgium: 'Bélgica', Austria: 'Áustria', 'Czech Republic': 'República Tcheca',
  Hungary: 'Hungria', Poland: 'Polônia', Sweden: 'Suécia', Norway: 'Noruega', Denmark: 'Dinamarca', Finland: 'Finlândia', Russia: 'Rússia',
  'United States': 'Estados Unidos', Canada: 'Canadá', Malaysia: 'Malásia', China: 'China', Turkey: 'Turquia', Ireland: 'Irlanda',
  Croatia: 'Croácia', Slovakia: 'Eslováquia', Luxembourg: 'Luxemburgo',
};
const ISO = { FR: 'França', GB: 'Reino Unido', DE: 'Alemanha', IT: 'Itália', ES: 'Espanha', PT: 'Portugal', CH: 'Suíça', NL: 'Países Baixos', BE: 'Bélgica', AT: 'Áustria', CZ: 'República Tcheca', HU: 'Hungria', PL: 'Polônia', SE: 'Suécia', NO: 'Noruega', DK: 'Dinamarca', FI: 'Finlândia', IE: 'Irlanda', HR: 'Croácia', SK: 'Eslováquia', LU: 'Luxemburgo' };
const CIDADE = {
  Brussels: 'Bruxelas', Cologne: 'Colônia', Munich: 'Munique', Vienna: 'Viena', Rome: 'Roma', Milan: 'Milão', Florence: 'Florença', Venice: 'Veneza',
  Naples: 'Nápoles', Turin: 'Turim', Prague: 'Praga', Lisbon: 'Lisboa', Seville: 'Sevilha', Geneva: 'Genebra', Zurich: 'Zurique', 'Zürich': 'Zurique',
  Copenhagen: 'Copenhague', Stockholm: 'Estocolmo', Edinburgh: 'Edimburgo', London: 'Londres', Antwerp: 'Antuérpia', 'The Hague': 'Haia', Warsaw: 'Varsóvia',
  Moscow: 'Moscou', Athens: 'Atenas', Lucerne: 'Lucerna', Bern: 'Berna', Nuremberg: 'Nuremberg', Gothenburg: 'Gotemburgo', Basel: 'Basileia',
  Marseille: 'Marselha', Lyon: 'Lyon', Cracow: 'Cracóvia', Krakow: 'Cracóvia', Bruges: 'Bruges', Hamburg: 'Hamburgo', Frankfurt: 'Frankfurt',
  Budapest: 'Budapeste', Rotterdam: 'Roterdã', Amsterdam: 'Amsterdã', Montreal: 'Montreal', 'Montréal': 'Montreal', Vancouver: 'Vancouver',
  Philadelphia: 'Filadélfia', Boston: 'Boston', 'New York': 'Nova York', Baltimore: 'Baltimore', Seville2: 'Sevilha', Cordoba: 'Córdoba',
};
const cidadePT = c => CIDADE[c] || c;

/* ---------- 1) Wikipédia: estações com código IATA (Q, X, Z) ---------- */
const clean = s => s.replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1').replace(/\{\{[^}]*\}\}/g, '').replace(/<ref[^>]*>.*?<\/ref>/g, '').replace(/''/g, '').replace(/\s*\([^)]*\)\s*$/, '').replace(/\s+/g, ' ').trim();
const estacoes = [];   // { nome, pais, grupo, busca }
const STOP = new Set(['railway','station','gare','hauptbahnhof','hbf','central','centrale','centraal','stazione','international','the','del','des','bahnhof','estacion']);
for (const l of fs.readFileSync(D + 'iata-wiki.txt', 'utf8').split('\n')) {
  const m = l.match(/^: '''([A-Z]{3})''': (.*)$/);
  if (!m || !'QXZ'.includes(m[1][0])) continue;
  const code = m[1];
  const txt = clean(m[2]);
  if (/collective|bus station|ferry|harbour|port$|airport/i.test(txt)) continue;
  const parts = txt.split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length < 2) continue;
  const paisEN = parts[parts.length - 1];
  const station = parts[0].replace(/\s+(railway )?station$/i, '').replace(/\s+Railway Station$/i, '').trim();
  const cidEN = parts.length >= 3 ? parts[1] : '';
  const pais = PAIS[paisEN];
  if (!pais) { console.log('país sem tradução:', paisEN, code); continue; }
  const cid = cidadePT(cidEN);
  const jaTemCidade = cidEN && (sa(station).includes(sa(cidEN)) || sa(station).includes(sa(cid)));
  const nome = jaTemCidade || !cidEN ? `${station} (${code})` : `${cid} – ${station} (${code})`;
  const alias = [cidEN, cid, paisEN].filter((v, i, a) => v && a.indexOf(v) === i).join(' ');
  estacoes.push({ nome, pais: alias, grupo: pais, cid: cidEN });
}

/* ---------- 2) Trainline: complemento da Europa (UIC / CRS) ---------- */
function parseCSV(t) { const rows = []; let row = [], f = '', q = false; for (let i = 0; i < t.length; i++) { const c = t[i]; if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; } else if (c === '"') q = true; else if (c === ';') { row.push(f); f = ''; } else if (c === '\n') { row.push(f.replace(/\r$/, '')); rows.push(row); row = []; f = ''; } else f += c; } return rows; }
const rows = parseCSV(fs.readFileSync(D + 'trainline.csv', 'utf8'));
const H = rows[0];
const T = rows.slice(1).map(r => Object.fromEntries(H.map((k, i) => [k, r[i]]))).filter(r => r.name);

// [país ISO, nome exato na Trainline, cidade em PT (para busca)]
const SUPL = [
  ['FR', 'Paris Gare de Lyon', 'Paris'], ['FR', 'Paris Austerlitz', 'Paris'], ['FR', 'Paris Bercy', 'Paris'],
  ['FR', 'Nice Ville', 'Nice'], ['FR', 'Cannes', 'Cannes'], ['FR', 'Toulouse Matabiau', 'Toulouse'], ['FR', 'Lille-Flandres', 'Lille'], ['FR', 'Dijon Ville', 'Dijon'],
  ['FR', 'Avignon Centre', 'Avignon'], ['FR', 'Biarritz', 'Biarritz'], ['FR', 'Nîmes', 'Nîmes'], ['FR', 'Lourdes', 'Lourdes'], ['FR', 'Annecy', 'Annecy'], ['FR', 'Grenoble', 'Grenoble'],
  ['FR', 'Chamonix Mont Blanc', 'Chamonix'], ['FR', 'Nantes', 'Nantes'], ['FR', 'Rouen Rive Droite', 'Rouen'], ['FR', 'Reims', 'Reims'], ['FR', 'Perpignan', 'Perpignan'],
  ['GB', 'London Bridge', 'Londres'], ['GB', 'London Charing Cross', 'Londres'], ['GB', 'London Marylebone', 'Londres'], ['GB', 'Edinburgh', 'Edimburgo'], ['GB', 'Glasgow Queen Street', 'Glasgow'],
  ['GB', 'Bath Spa', 'Bath'], ['GB', 'Oxford', 'Oxford'], ['GB', 'Cambridge', 'Cambridge'], ['GB', 'Brighton', 'Brighton'], ['GB', 'Bristol Temple Meads', 'Bristol'], ['GB', 'Cardiff Central', 'Cardiff'],
  ['GB', 'Liverpool Lime Street', 'Liverpool'], ['GB', 'Leeds', 'Leeds'], ['GB', 'Newcastle', 'Newcastle'], ['GB', 'Southampton Central', 'Southampton'], ['GB', 'Dover Priory', 'Dover'],
  ['GB', 'Stratford International', 'Londres'], ['GB', 'Ebbsfleet International', 'Londres'],
  ['DE', 'Berlin Ostbahnhof', 'Berlim'], ['DE', 'Berlin Südkreuz', 'Berlim'], ['DE', 'Stuttgart Hbf', 'Stuttgart'], ['DE', 'Heidelberg Hbf', 'Heidelberg'], ['DE', 'Hannover Hbf', 'Hannover'],
  ['DE', 'Dresden Hbf', 'Dresden'], ['DE', 'Bremen Hbf', 'Bremen'], ['DE', 'Bonn Hbf', 'Bonn'], ['DE', 'Koblenz Hbf', 'Coblença'], ['DE', 'Mainz Hbf', 'Mainz'], ['DE', 'Baden-Baden', 'Baden-Baden'],
  ['DE', 'Wiesbaden Hbf', 'Wiesbaden'], ['DE', 'Garmisch-Partenkirchen', 'Garmisch'], ['DE', 'Lübeck Hbf', 'Lübeck'], ['DE', 'Freiburg (Breisgau) Hbf', 'Freiburg'], ['DE', 'Würzburg Hbf', 'Würzburg'],
  ['IT', 'Roma Tiburtina', 'Roma'], ['IT', 'Napoli Centrale', 'Nápoles'], ['IT', 'Torino Porta Nuova', 'Turim'], ['IT', 'Bologna Centrale', 'Bolonha'], ['IT', 'Verona Porta Nuova', 'Verona'],
  ['IT', 'Genova Piazza Principe', 'Gênova'], ['IT', 'Genova Brignole', 'Gênova'], ['IT', 'Pisa Centrale', 'Pisa'], ['IT', 'Siena', 'Siena'], ['IT', 'La Spezia Centrale', 'La Spezia'],
  ['IT', 'Salerno', 'Salerno'], ['IT', 'Bari Centrale', 'Bari'], ['IT', 'Palermo Centrale', 'Palermo'], ['IT', 'Trieste Centrale', 'Trieste'], ['IT', 'Padova', 'Pádua'],
  ['IT', 'Venezia Mestre', 'Veneza'], ['IT', 'Milano Porta Garibaldi', 'Milão'], ['IT', 'Orvieto', 'Orvieto'], ['IT', 'Lucca', 'Lucca'], ['IT', 'Monterosso', 'Cinque Terre'],
  ['IT', 'Vernazza', 'Cinque Terre'], ['IT', 'Manarola', 'Cinque Terre'], ['IT', 'Riomaggiore', 'Cinque Terre'], ['IT', 'Corniglia', 'Cinque Terre'], ['IT', 'Bolzano/Bozen', 'Bolzano'],
  ['IT', 'Como San Giovanni', 'Como'], ['IT', 'Rimini', 'Rimini'], ['IT', 'Ancona', 'Ancona'], ['IT', 'Pescara Centrale', 'Pescara'], ['IT', 'Lecce', 'Lecce'], ['IT', 'Catania Centrale', 'Catânia'],
  ['ES', 'Madrid-Chamartín-Clara Campoamor', 'Madri'], ['ES', 'Barcelona Sants', 'Barcelona'], ['ES', 'Barcelona Estació de França', 'Barcelona'], ['ES', 'Sevilla Santa Justa', 'Sevilha'], ['ES', 'Málaga-María Zambrano', 'Málaga'],
  ['ES', 'Valencia Joaquín Sorolla', 'Valência'], ['ES', 'Córdoba', 'Córdoba'], ['ES', 'Granada', 'Granada'], ['ES', 'Zaragoza Delicias', 'Saragoça'], ['ES', 'Bilbao Abando', 'Bilbao'],
  ['ES', 'San Sebastián', 'San Sebastián'], ['ES', 'Toledo', 'Toledo'], ['ES', 'Segovia Guiomar', 'Segóvia'], ['ES', 'Santiago de Compostela', 'Santiago de Compostela'], ['ES', 'Cádiz', 'Cádiz'], ['ES', 'Girona', 'Girona'],
  ['PT', 'Lisboa Santa Apolónia', 'Lisboa'], ['PT', 'Lisboa Oriente', 'Lisboa'], ['PT', 'Porto Campanhã', 'Porto'], ['PT', 'Porto São Bento', 'Porto'], ['PT', 'Coimbra', 'Coimbra'], ['PT', 'Faro', 'Faro'],
  ['PT', 'Braga', 'Braga'], ['PT', 'Évora', 'Évora'],
  ['NL', 'Utrecht Centraal', 'Utrecht'], ['NL', 'Den Haag Centraal', 'Haia'],
  ['BE', 'Bruxelles-Central', 'Bruxelas'], ['BE', 'Antwerpen-Centraal', 'Antuérpia'], ['BE', 'Brugge', 'Bruges'], ['BE', 'Gent-Sint-Pieters', 'Gante'], ['BE', 'Liège-Guillemins', 'Liège'],
  ['AT', 'Innsbruck Hbf', 'Innsbruck'], ['AT', 'Graz Hbf', 'Graz'], ['AT', 'Linz/Donau Hbf', 'Linz'], ['AT', 'Wien Meidling', 'Viena'],
  ['CZ', 'Brno hl.n.', 'Brno'], ['CZ', 'Plzeň hl.n.', 'Plzeň'], ['HU', 'Budapest-Nyugati', 'Budapeste'], ['HU', 'Budapest-Déli', 'Budapeste'],
  ['PL', 'Warszawa-Wschodnia', 'Varsóvia'],['PL', 'Kraków Główny', 'Cracóvia'], ['PL', 'Gdańsk Główny', 'Gdańsk'], ['PL', 'Wrocław Główny', 'Breslávia'],
  ['CH', 'Zürich HB', 'Zurique'], ['CH', 'Luzern', 'Lucerna'], ['CH', 'Zermatt', 'Zermatt'], ['CH', 'Interlaken West', 'Interlaken'], ['CH', 'Lauterbrunnen', 'Lauterbrunnen'], ['CH', 'Grindelwald', 'Grindelwald'],
  ['CH', 'Locarno', 'Locarno'], ['CH', 'Genève', 'Genebra'], ['CH', 'Lausanne', 'Lausanne'], ['CH', 'Bern Hbf', 'Berna'], ['CH', 'Basel SBB', 'Basileia'], ['CH', 'Lugano', 'Lugano'], ['CH', 'Montreux', 'Montreux'],
  ['IE', 'Dublin Heuston', 'Dublin'], ['IE', 'Dublin Connolly', 'Dublin'], ['HR', 'Zagreb Glavni kolodvor', 'Zagreb'], ['SK', 'Bratislava hl.st.', 'Bratislava'], ['LU', 'Luxembourg', 'Luxemburgo'],
];
const achados = []; const faltou = [];
const tokOf = s => new Set(sa(s).split(/[^a-z0-9]+/).filter(t => t.length > 2 && !STOP.has(t)));
const subset = (a, b) => a.size && [...a].every(t => b.has(t));
for (const [iso, q, cid] of SUPL) {
  const nq = sa(q);
  let r = T.find(x => x.country === iso && sa(x.name) === nq && x.is_airport !== 't') || T.find(x => x.country === iso && sa(x.name).startsWith(nq) && x.is_airport !== 't');
  if (!r) { faltou.push(`${iso} ${q}`); continue; }
  if (!(iso === 'GB' && r.atoc_id) && !r.uic) { faltou.push(`${iso} ${q} (sem código)`); continue; }
  const code = iso === 'GB' && r.atoc_id ? r.atoc_id : `UIC ${r.uic}`;
  const nome = `${r.name} (${code})`;
  if (estacoes.some(e => sa(e.nome).includes(sa(r.name)))) continue;
  const tk = tokOf(`${cid} ${r.name}`);
  const dup = estacoes.find(e => {
    if (e.grupo !== ISO[iso]) return false;
    const te = tokOf(e.nome.replace(/\([^)]*\)/g, '') + ' ' + (e.cid || ''));
    const igual = te.size === tk.size && subset(te, tk);
    return igual || (Math.min(te.size, tk.size) >= 2 && (subset(te, tk) || subset(tk, te)));
  });
  if (dup) { achados.push(`dup: ${nome}  ~  ${dup.nome}`); continue; }
  estacoes.push({ nome, pais: `${cid} ${ISO[iso]}`, grupo: ISO[iso], cid });
}

// ajustes pontuais
estacoes.forEach(e => { if (e.nome.endsWith('(ZYP)')) e.nome = 'Nova York – Penn Station (ZYP)'; if (e.nome.endsWith('(ZTO)')) e.nome = 'Boston – South Station (ZTO)'; if (e.nome.endsWith('(ZTY)')) e.nome = 'Boston – Back Bay (ZTY)'; if (e.nome.endsWith('(ZFV)')) e.nome = 'Filadélfia – 30th Street (ZFV)'; });
estacoes.forEach(e => { if (e.nome.endsWith('(ZYR)')) { e.nome = 'Bruxelas – Bruxelles-Midi / Brussels-South (ZYR)'; e.pais += ' Midi Zuid'; } });
estacoes.push({ nome: 'Paris – Gare de l\'Est (UIC 8711300)', pais: 'Paris França Est', grupo: 'França', cid: 'Paris' });
estacoes.push({ nome: 'Paris – Gare Saint-Lazare (UIC 8738400)', pais: 'Paris França', grupo: 'França', cid: 'Paris' });

/* ---------- 3) Fora da Europa: complemento manual ---------- */
const MANUAL = {
  'Portugal': ['Lisboa – Oriente', 'Lisboa – Rossio (Sintra)', 'Lisboa – Cais do Sodré', 'Porto – São Bento', 'Évora', 'Coimbra – Coimbra-B'],
  'Irlanda': ['Dublin – Heuston', 'Dublin – Connolly'],
  'Croácia': ['Zagreb – Glavni kolodvor'],
  'Polônia': ['Cracóvia – Kraków Główny', 'Varsóvia – Centralna'],
  'Bélgica': ['Bruges – Brugge'],
  'Alemanha': ['Koblenz Hbf', 'Lübeck Hbf'],
  'Itália': ['Lecce'],
  'Espanha': ['San Sebastián – Donostia'],
  'França': ['Cannes', 'Nîmes'],
  'Japão': ['Tóquio – Estação de Tóquio', 'Tóquio – Shinagawa', 'Tóquio – Shinjuku', 'Tóquio – Ueno', 'Yokohama – Shin-Yokohama', 'Odawara', 'Kyoto', 'Osaka – Shin-Osaka', 'Osaka – Estação de Osaka', 'Nagoya', 'Hiroshima', 'Hakata – Fukuoka', 'Nara', 'Kanazawa', 'Nagano', 'Karuizawa', 'Hakone-Yumoto', 'Nikko', 'Kamakura', 'Himeji', 'Okayama', 'Takayama', 'Sapporo', 'Sendai', 'Kagoshima-Chuo', 'Nagasaki'],
  'Estados Unidos': ['Washington – Union Station (WAS)', 'Chicago – Union Station (CHI)', 'Los Angeles – Union Station (LAX)', 'Seattle – King Street (SEA)', 'Portland – Union Station (PDX)', 'Miami (MIA)', 'Orlando (ORL)', 'Nova Orleans – Union Passenger Terminal (NOL)', 'Denver – Union Station (DEN)', 'Sacramento (SAC)', 'San Diego – Santa Fe Depot (SAN)', 'Emeryville – São Francisco (EMY)'],
  'Canadá': ['Toronto – Union Station', 'Montreal – Gare Centrale', 'Ottawa', 'Quebec – Gare du Palais', 'Vancouver – Pacific Central', 'Niagara Falls', 'Jasper', 'Kingston'],
  'Brasil': ['Rio de Janeiro – Central do Brasil', 'São Paulo – Luz', 'São Paulo – Brás', 'Curitiba – Estação Ferroviária', 'Morretes (Serra Verde Express)', 'Paranaguá', 'Ouro Preto – Maria Fumaça', 'Tiradentes – Maria Fumaça', 'Bento Gonçalves – Maria Fumaça', 'Campos do Jordão – Capivari'],
  'Peru': ['Cusco – Poroy', 'Cusco – San Pedro', 'Ollantaytambo', 'Aguas Calientes – Machu Picchu Pueblo', 'Puno', 'Arequipa'],
  'Argentina': ['Buenos Aires – Retiro', 'Buenos Aires – Constitución', 'Tigre'],
  'Chile': ['Santiago – Estación Central', 'Santiago – Alameda'],
  'Índia': ['Nova Délhi (NDLS)', 'Délhi – Old Delhi (DLI)', 'Mumbai – Chhatrapati Shivaji Terminus (CSMT)', 'Mumbai – Central (BCT)', 'Calcutá – Howrah (HWH)', 'Chennai – Central (MAS)', 'Bangalore – City (SBC)', 'Jaipur (JP)', 'Agra – Cantt (AGC)', 'Ahmedabad (ADI)', 'Varanasi (BSB)', 'Lucknow (LKO)', 'Udaipur City (UDZ)', 'Jodhpur (JU)', 'Jaisalmer (JSM)', 'Pune (PUNE)'],
  'China': ['Pequim – Sul', 'Pequim – Oeste', 'Pequim – Estação de Pequim', 'Xangai – Hongqiao', 'Xangai – Estação de Xangai', 'Xi\'an – Norte', 'Chengdu – Leste', 'Guangzhou – Sul', 'Shenzhen – Norte', 'Hangzhou – Leste', 'Nanjing – Sul', 'Hong Kong – West Kowloon'],
  'Coreia do Sul': ['Seul – Estação de Seul', 'Busan', 'Daejeon', 'Gyeongju', 'Seul – Yongsan', 'Incheon Airport'],
  'Taiwan': ['Taipei – Main Station', 'Taichung', 'Tainan', 'Kaohsiung – Zuoying'],
  'Tailândia': ['Bangkok – Krung Thep Aphiwat (Bang Sue)', 'Bangkok – Hua Lamphong', 'Chiang Mai', 'Ayutthaya', 'Hua Hin'],
  'Vietnã': ['Hanói', 'Ho Chi Minh – Saigon', 'Da Nang', 'Hue', 'Nha Trang'],
  'Malásia': ['Kuala Lumpur – KL Sentral (XKL)', 'Kuala Lumpur – Estação Antiga'],
  'Austrália': ['Sydney – Central', 'Melbourne – Southern Cross', 'Brisbane – Roma Street', 'Perth', 'Adelaide'],
  'Marrocos': ['Marrakech', 'Casablanca – Voyageurs', 'Casablanca – Port', 'Rabat – Ville', 'Tânger – Ville', 'Fez'],
  'Egito': ['Cairo – Ramses', 'Alexandria – Misr', 'Luxor', 'Assuã'],
  'Turquia': ['Istambul – Sirkeci', 'Istambul – Halkalı', 'Ancara – Gar', 'Konya', 'Esmirna – Alsancak'],
  'Rússia': ['São Petersburgo – Moskovsky', 'Moscou – Leningradsky (ZKD)', 'Moscou – Paveletsky (XRK)'],
  'África do Sul': ['Pretória – Rovos Rail', 'Cidade do Cabo'],
};
for (const [pais, lista] of Object.entries(MANUAL)) for (const n of lista) {
  if (estacoes.some(e => e.grupo === pais && sa(e.nome) === sa(n))) continue;
  const cod = n.match(/\(([A-Z]{3,4})\)/);
  if (cod && estacoes.some(e => e.nome.endsWith(`(${cod[1]})`))) continue;
  estacoes.push({ nome: n, pais, grupo: pais });
}

/* ---------- apelidos de busca (inglês e siglas britânicas CRS) ---------- */
const EN = { 'Tóquio': 'Tokyo', 'Quioto': 'Kyoto', 'Pequim': 'Beijing', 'Xangai': 'Shanghai', 'Délhi': 'Delhi', 'Calcutá': 'Kolkata Calcutta', 'Seul': 'Seoul', 'Hanói': 'Hanoi', 'Istambul': 'Istanbul', 'Ancara': 'Ankara',
  'São Petersburgo': 'Saint Petersburg', 'Moscou': 'Moscow', 'Cidade do Cabo': 'Cape Town', 'Nova York': 'New York', 'Filadélfia': 'Philadelphia', 'Nova Orleans': 'New Orleans', 'São Francisco': 'San Francisco',
  'Cusco': 'Cuzco', 'Machu Picchu': 'Machu Picchu', 'Bangkok': 'Bangkok', 'Ho Chi Minh': 'Saigon', 'Lisboa': 'Lisbon', 'Roma': 'Rome', 'Milão': 'Milan', 'Veneza': 'Venice', 'Florença': 'Florence', 'Gênova': 'Genoa',
  'Nápoles': 'Naples', 'Turim': 'Turin', 'Munique': 'Munich', 'Viena': 'Vienna', 'Praga': 'Prague', 'Varsóvia': 'Warsaw', 'Cracóvia': 'Krakow', 'Budapeste': 'Budapest', 'Colônia': 'Cologne', 'Genebra': 'Geneva',
  'Zurique': 'Zurich', 'Basileia': 'Basel', 'Berna': 'Bern', 'Lucerna': 'Lucerne', 'Madri': 'Madrid', 'Sevilha': 'Seville', 'Bruxelas': 'Brussels', 'Antuérpia': 'Antwerp', 'Haia': 'The Hague', 'Amsterdã': 'Amsterdam', 'Londres': 'London', 'Edimburgo': 'Edinburgh' };
const CRS = { QQS: 'STP', QQK: 'KGX', QQU: 'EUS', ZEP: 'VIC', QQP: 'PAD', ZLS: 'LST', QQM: 'MAN', QQN: 'BHM', QQY: 'YRK', ZGG: 'GLC', ZDU: 'DEE', ZIV: 'INV', QQW: 'WAT', ZYP: 'NYP Amtrak', ZTO: 'BOS Amtrak', ZTY: 'BBY Amtrak', ZFV: 'PHL Amtrak', QDH: 'AFK', XQE: 'EBD' };
estacoes.forEach(e => {
  const extra = [];
  for (const [pt, en] of Object.entries(EN)) if (sa(e.nome).includes(sa(pt)) || sa(e.pais).includes(sa(pt))) extra.push(en);
  const m = e.nome.match(/\(([A-Z]{3})\)$/);
  if (m && CRS[m[1]]) extra.push(CRS[m[1]]);
  if (extra.length) e.pais = `${e.pais} ${extra.join(' ')}`;
});

/* ---------- agrupa e grava ---------- */
const ORDEM = ['França', 'Itália', 'Espanha', 'Portugal', 'Reino Unido', 'Alemanha', 'Suíça', 'Países Baixos', 'Bélgica', 'Áustria', 'República Tcheca', 'Hungria', 'Polônia', 'Irlanda', 'Croácia', 'Eslováquia', 'Luxemburgo', 'Suécia', 'Noruega', 'Dinamarca', 'Finlândia', 'Estados Unidos', 'Canadá', 'Brasil', 'Peru', 'Argentina', 'Chile', 'Japão', 'Índia', 'China', 'Coreia do Sul', 'Taiwan', 'Tailândia', 'Vietnã', 'Malásia', 'Austrália', 'Marrocos', 'Egito', 'Turquia', 'Rússia', 'África do Sul'];
const grupos = {};
estacoes.forEach(e => { (grupos[e.grupo] ||= []).push(e); });
const ids = Object.keys(grupos).sort((a, b) => { const ia = ORDEM.indexOf(a), ib = ORDEM.indexOf(b); return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib) || a.localeCompare(b, 'pt'); });
const js = ids.map(g => `  { grupo:${JSON.stringify(g)}, cidades:[\n${grupos[g].sort((a, b) => a.nome.localeCompare(b.nome, 'pt')).map(e => `    { nome:${JSON.stringify(e.nome)}, pais:${JSON.stringify(e.pais)} },`).join('\n')}\n  ] },`).join('\n');
const total = estacoes.length;
fs.writeFileSync(OUT, `/**
 * Estações de trem para os trechos da etapa Trem (mesmo formato de AEROPORTOS em cidades.js).
 * ARQUIVO GERADO — não edite à mão; veja docs/ESTACOES.md para refazer.
 * Código entre parênteses: IATA de estação (Q/X/Z...), CRS no Reino Unido, "UIC nnnnnnn" onde não há sigla curta;
 * fora da Europa, sigla local quando existe (Amtrak, Indian Railways) ou só o nome.
 * Fontes: Wikipédia "List of IATA-indexed railway stations" (CC BY-SA 4.0) e Trainline EU stations.csv (ODbL 1.0).
 */
export const ESTACOES = [
${js}
]
`);
console.log('estações:', total, 'grupos:', ids.length);
console.log('não achadas na Trainline:', faltou.length, faltou.join(' | '));
console.log('duplicadas ignoradas:', achados.length);
console.log(achados.slice(0, 30).join('\n'));
