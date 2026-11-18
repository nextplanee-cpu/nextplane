# Estações de trem (busca por sigla na etapa Trem)

Na ficha da assessoria, etapa **Trem**, os campos "Saída" e "Chegada" têm busca igual à dos aeroportos:
digite o nome da estação, a cidade (em português ou inglês) ou a sigla e escolha na lista.
Se a estação não estiver na base, a opção **+ Usar "texto"** guarda o que foi digitado (texto livre).
Trechos antigos, digitados à mão, continuam como estão (nada é alterado nos dados salvos).

Arquivo da base: `src/pages/crm/estacoes.js` (**gerado**, não editar à mão). Hoje: ~460 estações em 40 países.

## Que código aparece entre parênteses

| Onde | Código |
|---|---|
| Estações com código IATA (3 letras começando em Q, X ou Z) | o IATA, ex.: `XPG` Paris Gare du Nord, `QQS` London St Pancras, `ZYR` Bruxelas-Midi, `XRJ` Roma Termini, `XOC` Madrid Atocha |
| Reino Unido sem IATA | sigla CRS, ex.: `LBG` London Bridge |
| Europa sem sigla curta | `UIC nnnnnnn` (código internacional da estação) |
| Fora da Europa | sigla local quando existe (Amtrak `WAS`, Indian Railways `NDLS`); no Japão, China, Brasil etc. só o nome |

A busca também aceita apelidos: `STP` acha St Pancras, `Tokyo` acha Tóquio, `NYP` acha Penn Station.

## Fontes e licenças

- Wikipédia, "List of IATA-indexed railway stations, bus stations and ferry terminals" (CC BY-SA 4.0).
- Trainline EU, `stations.csv` (ODbL 1.0): https://github.com/trainline-eu/stations (códigos UIC e CRS).
- Complemento manual fora da Europa.

## Como atualizar

1. Baixar `stations.csv` (Trainline) e o wikitexto da Wikipédia (`action=raw`) para uma pasta, como `iata-wiki.txt` e `trainline.csv`.
2. `node scripts/gerar-estacoes.mjs <pasta>`
3. Conferir a diferença em `src/pages/crm/estacoes.js` e publicar.

Para incluir uma estação à mão, edite as listas `SUPL` (Europa, buscada na Trainline) ou `MANUAL` no script e gere de novo.
