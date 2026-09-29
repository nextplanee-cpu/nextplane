/**
 * Listas de cidades para os seletores de Origem e Destino das Assessorias.
 * Formato: [região, 'Cidade/País, Cidade/País, …']
 */

const parse = groups => groups.map(([grupo, txt]) => ({
  grupo,
  cidades: txt.split(',').map(s => s.trim()).filter(Boolean).map(s => {
    const [nome, pais = ''] = s.split('/').map(x => x.trim())
    return { nome, pais }
  }),
}))

export const ORIGENS_BR = parse([
  ['Aeroportos do Brasil',
    'Brasília (BSB)/DF, São Paulo (GRU)/SP, São Paulo (CGH)/SP, Campinas (VCP)/SP, Rio de Janeiro (GIG)/RJ, Rio de Janeiro (SDU)/RJ, ' +
    'Belo Horizonte (CNF)/MG, Salvador (SSA)/BA, Recife (REC)/PE, Fortaleza (FOR)/CE, Porto Alegre (POA)/RS, Curitiba (CWB)/PR, ' +
    'Florianópolis (FLN)/SC, Goiânia (GYN)/GO, Manaus (MAO)/AM, Belém (BEL)/PA, Natal (NAT)/RN, Maceió (MCZ)/AL, ' +
    'João Pessoa (JPA)/PB, Vitória (VIX)/ES, Cuiabá (CGB)/MT, Campo Grande (CGR)/MS, São Luís (SLZ)/MA, Teresina (THE)/PI, ' +
    'Aracaju (AJU)/SE, Palmas (PMW)/TO, Porto Velho (PVH)/RO, Macapá (MCP)/AP, Boa Vista (BVB)/RR, Rio Branco (RBR)/AC, ' +
    'Uberlândia (UDI)/MG, Ribeirão Preto (RAO)/SP, São José do Rio Preto (SJP)/SP, Londrina (LDB)/PR, Maringá (MGF)/PR, ' +
    'Navegantes (NVT)/SC, Joinville (JOI)/SC, Foz do Iguaçu (IGU)/PR, Porto Seguro (BPS)/BA, Ilhéus (IOS)/BA, ' +
    'Juazeiro do Norte (JDO)/CE, Montes Claros (MOC)/MG, Chapecó (XAP)/SC, Caxias do Sul (CXJ)/RS'],
])

export const DESTINOS = parse([
  ['Europa',
    'Lisboa/Portugal, Porto/Portugal, Algarve/Portugal, Sintra/Portugal, Madeira/Portugal, Açores/Portugal, ' +
    'Madri/Espanha, Barcelona/Espanha, Sevilha/Espanha, Granada/Espanha, Valência/Espanha, Málaga/Espanha, Ibiza/Espanha, Palma de Mallorca/Espanha, San Sebastián/Espanha, ' +
    'Paris/França, Nice/França, Cannes/França, Lyon/França, Bordeaux/França, Marselha/França, Provence/França, Chamonix/França, Mônaco/Mônaco, ' +
    'Londres/Inglaterra, Edimburgo/Escócia, Dublin/Irlanda, Amsterdã/Holanda, Bruxelas/Bélgica, Bruges/Bélgica, ' +
    'Roma/Itália, Florença/Itália, Veneza/Itália, Milão/Itália, Nápoles/Itália, Sorrento/Itália, Positano/Itália, Amalfi/Itália, Capri/Itália, ' +
    'Toscana/Itália, Cinque Terre/Itália, Lago de Como/Itália, Verona/Itália, Bolonha/Itália, Sicília/Itália, Puglia/Itália, Dolomitas/Itália, ' +
    'Zurique/Suíça, Genebra/Suíça, Lucerna/Suíça, Interlaken/Suíça, Zermatt/Suíça, St. Moritz/Suíça, ' +
    'Viena/Áustria, Salzburgo/Áustria, Innsbruck/Áustria, Hallstatt/Áustria, Munique/Alemanha, Berlim/Alemanha, Frankfurt/Alemanha, Hamburgo/Alemanha, ' +
    'Praga/Tchéquia, Budapeste/Hungria, Cracóvia/Polônia, Varsóvia/Polônia, ' +
    'Copenhague/Dinamarca, Estocolmo/Suécia, Oslo/Noruega, Bergen/Noruega, Tromsø/Noruega, Helsinque/Finlândia, Rovaniemi (Lapônia)/Finlândia, Reykjavik/Islândia, ' +
    'Atenas/Grécia, Santorini/Grécia, Mykonos/Grécia, Creta/Grécia, Dubrovnik/Croácia, Split/Croácia, Istambul/Turquia, Capadócia/Turquia, Malta/Malta'],
  ['Estados Unidos e Canadá',
    'Nova York/EUA, Miami/EUA, Orlando/EUA, Fort Lauderdale/EUA, Los Angeles/EUA, San Francisco/EUA, Las Vegas/EUA, Chicago/EUA, ' +
    'Washington/EUA, Boston/EUA, Nova Orleans/EUA, San Diego/EUA, Honolulu (Havaí)/EUA, Maui (Havaí)/EUA, Aspen/EUA, Vail/EUA, Napa Valley/EUA, ' +
    'Toronto/Canadá, Vancouver/Canadá, Montreal/Canadá, Quebec/Canadá, Banff/Canadá, Whistler/Canadá'],
  ['México e Caribe',
    'Cancún/México, Playa del Carmen/México, Tulum/México, Cidade do México/México, Los Cabos/México, ' +
    'Punta Cana/Rep. Dominicana, Aruba/Aruba, Curaçao/Curaçao, Nassau/Bahamas, Turks e Caicos/Turks e Caicos, Montego Bay/Jamaica, ' +
    'San Juan/Porto Rico, Cartagena/Colômbia, San Andrés/Colômbia, Cidade do Panamá/Panamá'],
  ['América do Sul',
    'Buenos Aires/Argentina, Bariloche/Argentina, Mendoza/Argentina, Ushuaia/Argentina, El Calafate/Argentina, ' +
    'Santiago/Chile, Atacama/Chile, Puerto Natales (Torres del Paine)/Chile, Valle Nevado/Chile, ' +
    'Lima/Peru, Cusco/Peru, Machu Picchu/Peru, Montevidéu/Uruguai, Punta del Este/Uruguai, Colônia do Sacramento/Uruguai, ' +
    'Bogotá/Colômbia, Medellín/Colômbia, Quito/Equador, Galápagos/Equador'],
  ['Brasil',
    'Rio de Janeiro/Brasil, São Paulo/Brasil, Fernando de Noronha/Brasil, Gramado/Brasil, Foz do Iguaçu/Brasil, Jericoacoara/Brasil, ' +
    'Porto de Galinhas/Brasil, Maragogi/Brasil, Bonito/Brasil, Lençóis Maranhenses/Brasil, Trancoso/Brasil, Florianópolis/Brasil, ' +
    'Salvador/Brasil, Natal/Brasil, Maceió/Brasil, Chapada Diamantina/Brasil, Campos do Jordão/Brasil, Búzios/Brasil, Paraty/Brasil'],
  ['Oriente Médio e África',
    'Dubai/Emirados Árabes, Abu Dhabi/Emirados Árabes, Doha/Catar, Tel Aviv/Israel, Jerusalém/Israel, Petra/Jordânia, ' +
    'Cairo/Egito, Luxor/Egito, Marrakech/Marrocos, Cidade do Cabo/África do Sul, Kruger/África do Sul, Zanzibar/Tanzânia, ' +
    'Seychelles/Seychelles, Maurício/Maurício'],
  ['Ásia',
    'Tóquio/Japão, Kyoto/Japão, Osaka/Japão, Seul/Coreia do Sul, Pequim/China, Xangai/China, Hong Kong/China, Singapura/Singapura, ' +
    'Bangkok/Tailândia, Phuket/Tailândia, Chiang Mai/Tailândia, Bali/Indonésia, Maldivas/Maldivas, Hanói/Vietnã, Ho Chi Minh/Vietnã, ' +
    'Siem Reap/Camboja, Nova Délhi/Índia, Agra/Índia, Jaipur/Índia, Colombo/Sri Lanka, Kuala Lumpur/Malásia'],
  ['Oceania',
    'Sydney/Austrália, Melbourne/Austrália, Gold Coast/Austrália, Auckland/Nova Zelândia, Queenstown/Nova Zelândia, ' +
    'Taiti/Polinésia Francesa, Bora Bora/Polinésia Francesa, Fiji/Fiji'],
])

/* Aeroportos para os trechos aéreos: Brasil + internacionais (Cidade (IATA)/País) */
export const AEROPORTOS = [
  { grupo:'Brasil', cidades:[
    ...ORIGENS_BR[0].cidades,
    ...parse([['', 'Fernando de Noronha (FEN)/PE, Jericoacoara (JJD)/CE, Bonito (BYO)/MS, Petrolina (PNZ)/PE, Imperatriz (IMP)/MA, Santarém (STM)/PA, Cabo Frio (CFB)/RJ']])[0].cidades,
  ] },
  ...parse([
    ['Europa',
      'Lisboa (LIS)/Portugal, Porto (OPO)/Portugal, Faro (FAO)/Portugal, Funchal – Madeira (FNC)/Portugal, Ponta Delgada – Açores (PDL)/Portugal, ' +
      'Madri (MAD)/Espanha, Barcelona (BCN)/Espanha, Sevilha (SVQ)/Espanha, Málaga (AGP)/Espanha, Valência (VLC)/Espanha, Ibiza (IBZ)/Espanha, Palma de Mallorca (PMI)/Espanha, Bilbao (BIO)/Espanha, ' +
      'Paris (CDG)/França, Paris (ORY)/França, Nice (NCE)/França, Lyon (LYS)/França, Marselha (MRS)/França, Bordeaux (BOD)/França, ' +
      'Londres (LHR)/Inglaterra, Londres (LGW)/Inglaterra, Londres (STN)/Inglaterra, Edimburgo (EDI)/Escócia, Dublin (DUB)/Irlanda, Amsterdã (AMS)/Holanda, Bruxelas (BRU)/Bélgica, ' +
      'Roma (FCO)/Itália, Milão (MXP)/Itália, Milão (LIN)/Itália, Veneza (VCE)/Itália, Florença (FLR)/Itália, Pisa (PSA)/Itália, Nápoles (NAP)/Itália, Bolonha (BLQ)/Itália, ' +
      'Catânia (CTA)/Itália, Palermo (PMO)/Itália, Bari (BRI)/Itália, ' +
      'Zurique (ZRH)/Suíça, Genebra (GVA)/Suíça, Viena (VIE)/Áustria, Munique (MUC)/Alemanha, Frankfurt (FRA)/Alemanha, Berlim (BER)/Alemanha, Hamburgo (HAM)/Alemanha, ' +
      'Praga (PRG)/Tchéquia, Budapeste (BUD)/Hungria, Cracóvia (KRK)/Polônia, Varsóvia (WAW)/Polônia, ' +
      'Copenhague (CPH)/Dinamarca, Estocolmo (ARN)/Suécia, Oslo (OSL)/Noruega, Tromsø (TOS)/Noruega, Helsinque (HEL)/Finlândia, Rovaniemi (RVN)/Finlândia, Reykjavik (KEF)/Islândia, ' +
      'Atenas (ATH)/Grécia, Santorini (JTR)/Grécia, Mykonos (JMK)/Grécia, Heraklion – Creta (HER)/Grécia, Dubrovnik (DBV)/Croácia, Split (SPU)/Croácia, ' +
      'Istambul (IST)/Turquia, Capadócia (NAV)/Turquia, Malta (MLA)/Malta'],
    ['Estados Unidos e Canadá',
      'Nova York (JFK)/EUA, Nova York (EWR)/EUA, Nova York (LGA)/EUA, Miami (MIA)/EUA, Orlando (MCO)/EUA, Fort Lauderdale (FLL)/EUA, ' +
      'Los Angeles (LAX)/EUA, San Francisco (SFO)/EUA, Las Vegas (LAS)/EUA, Chicago (ORD)/EUA, Washington (IAD)/EUA, Boston (BOS)/EUA, ' +
      'Atlanta (ATL)/EUA, Dallas (DFW)/EUA, Houston (IAH)/EUA, Denver (DEN)/EUA, Nova Orleans (MSY)/EUA, San Diego (SAN)/EUA, ' +
      'Honolulu (HNL)/EUA, Maui (OGG)/EUA, Aspen (ASE)/EUA, Toronto (YYZ)/Canadá, Vancouver (YVR)/Canadá, Montreal (YUL)/Canadá, Calgary (YYC)/Canadá'],
    ['México, Caribe e América Central',
      'Cancún (CUN)/México, Cidade do México (MEX)/México, Los Cabos (SJD)/México, Punta Cana (PUJ)/Rep. Dominicana, Aruba (AUA)/Aruba, ' +
      'Curaçao (CUR)/Curaçao, Nassau (NAS)/Bahamas, Turks e Caicos (PLS)/Turks e Caicos, Montego Bay (MBJ)/Jamaica, San Juan (SJU)/Porto Rico, ' +
      'Cidade do Panamá (PTY)/Panamá, San José (SJO)/Costa Rica'],
    ['América do Sul',
      'Buenos Aires (EZE)/Argentina, Buenos Aires (AEP)/Argentina, Bariloche (BRC)/Argentina, Mendoza (MDZ)/Argentina, Ushuaia (USH)/Argentina, El Calafate (FTE)/Argentina, ' +
      'Santiago (SCL)/Chile, Calama – Atacama (CJC)/Chile, Puerto Natales (PNT)/Chile, Punta Arenas (PUQ)/Chile, ' +
      'Lima (LIM)/Peru, Cusco (CUZ)/Peru, Montevidéu (MVD)/Uruguai, Punta del Este (PDP)/Uruguai, ' +
      'Bogotá (BOG)/Colômbia, Medellín (MDE)/Colômbia, Cartagena (CTG)/Colômbia, San Andrés (ADZ)/Colômbia, ' +
      'Quito (UIO)/Equador, Guayaquil (GYE)/Equador, Galápagos (GPS)/Equador, Assunção (ASU)/Paraguai, La Paz (LPB)/Bolívia'],
    ['Oriente Médio e África',
      'Dubai (DXB)/Emirados Árabes, Abu Dhabi (AUH)/Emirados Árabes, Doha (DOH)/Catar, Tel Aviv (TLV)/Israel, Amã (AMM)/Jordânia, ' +
      'Cairo (CAI)/Egito, Luxor (LXR)/Egito, Marrakech (RAK)/Marrocos, Casablanca (CMN)/Marrocos, Cidade do Cabo (CPT)/África do Sul, ' +
      'Joanesburgo (JNB)/África do Sul, Zanzibar (ZNZ)/Tanzânia, Seychelles (SEZ)/Seychelles, Maurício (MRU)/Maurício, Adis Abeba (ADD)/Etiópia, Luanda (LAD)/Angola'],
    ['Ásia',
      'Tóquio (HND)/Japão, Tóquio (NRT)/Japão, Osaka (KIX)/Japão, Seul (ICN)/Coreia do Sul, Pequim (PEK)/China, Xangai (PVG)/China, Hong Kong (HKG)/China, ' +
      'Singapura (SIN)/Singapura, Bangkok (BKK)/Tailândia, Phuket (HKT)/Tailândia, Chiang Mai (CNX)/Tailândia, Bali (DPS)/Indonésia, Malé – Maldivas (MLE)/Maldivas, ' +
      'Hanói (HAN)/Vietnã, Ho Chi Minh (SGN)/Vietnã, Siem Reap (SAI)/Camboja, Nova Délhi (DEL)/Índia, Mumbai (BOM)/Índia, Colombo (CMB)/Sri Lanka, Kuala Lumpur (KUL)/Malásia'],
    ['Oceania',
      'Sydney (SYD)/Austrália, Melbourne (MEL)/Austrália, Gold Coast (OOL)/Austrália, Auckland (AKL)/Nova Zelândia, Queenstown (ZQN)/Nova Zelândia, ' +
      'Papeete – Taiti (PPT)/Polinésia Francesa, Bora Bora (BOB)/Polinésia Francesa, Nadi – Fiji (NAN)/Fiji'],
  ]),
]

/* Companhias aéreas para os trechos: Companhia (IATA)/País */
export const CIAS = parse([
  ['Brasil',
    'LATAM (LA)/Brasil, GOL (G3)/Brasil, Azul (AD)/Brasil, Voepass (2Z)/Brasil'],
  ['América do Sul e Central',
    'Aerolíneas Argentinas (AR)/Argentina, Sky Airline (H2)/Chile, JetSMART (JA)/Chile, Avianca (AV)/Colômbia, ' +
    'Copa Airlines (CM)/Panamá, Paranair (ZP)/Paraguai, Boliviana de Aviación (OB)/Bolívia, Arajet (DM)/Rep. Dominicana'],
  ['América do Norte',
    'American Airlines (AA)/EUA, Delta Air Lines (DL)/EUA, United Airlines (UA)/EUA, JetBlue (B6)/EUA, Southwest (WN)/EUA, ' +
    'Alaska Airlines (AS)/EUA, Spirit (NK)/EUA, Hawaiian Airlines (HA)/EUA, Air Canada (AC)/Canadá, WestJet (WS)/Canadá, ' +
    'Aeroméxico (AM)/México, Volaris (Y4)/México'],
  ['Europa',
    'TAP Air Portugal (TP)/Portugal, Iberia (IB)/Espanha, Air Europa (UX)/Espanha, Vueling (VY)/Espanha, Volotea (V7)/Espanha, ' +
    'Air France (AF)/França, Transavia (HV)/Holanda, KLM (KL)/Holanda, Lufthansa (LH)/Alemanha, Eurowings (EW)/Alemanha, Condor (DE)/Alemanha, ' +
    'Swiss (LX)/Suíça, Edelweiss (WK)/Suíça, Austrian Airlines (OS)/Áustria, Brussels Airlines (SN)/Bélgica, ' +
    'British Airways (BA)/Inglaterra, Virgin Atlantic (VS)/Inglaterra, easyJet (U2)/Inglaterra, Aer Lingus (EI)/Irlanda, Ryanair (FR)/Irlanda, ' +
    'ITA Airways (AZ)/Itália, SAS (SK)/Escandinávia, Norwegian (DY)/Noruega, Finnair (AY)/Finlândia, Icelandair (FI)/Islândia, ' +
    'LOT Polish (LO)/Polônia, Wizz Air (W6)/Hungria, Aegean (A3)/Grécia, Turkish Airlines (TK)/Turquia'],
  ['Oriente Médio e África',
    'Emirates (EK)/Emirados Árabes, Etihad (EY)/Emirados Árabes, Qatar Airways (QR)/Catar, Saudia (SV)/Arábia Saudita, ' +
    'El Al (LY)/Israel, Royal Jordanian (RJ)/Jordânia, EgyptAir (MS)/Egito, Royal Air Maroc (AT)/Marrocos, ' +
    'Ethiopian Airlines (ET)/Etiópia, South African Airways (SA)/África do Sul, TAAG Angola (DT)/Angola, Kenya Airways (KQ)/Quênia'],
  ['Ásia e Oceania',
    'Singapore Airlines (SQ)/Singapura, Cathay Pacific (CX)/Hong Kong, Japan Airlines (JL)/Japão, ANA (NH)/Japão, ' +
    'Korean Air (KE)/Coreia do Sul, Asiana (OZ)/Coreia do Sul, Thai Airways (TG)/Tailândia, Air China (CA)/China, ' +
    'China Eastern (MU)/China, China Southern (CZ)/China, Air India (AI)/Índia, Vietnam Airlines (VN)/Vietnã, ' +
    'Malaysia Airlines (MH)/Malásia, Garuda Indonesia (GA)/Indonésia, Philippine Airlines (PR)/Filipinas, ' +
    'Qantas (QF)/Austrália, Virgin Australia (VA)/Austrália, Air New Zealand (NZ)/Nova Zelândia, Air Tahiti Nui (TN)/Polinésia Francesa, Fiji Airways (FJ)/Fiji'],
])
