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
