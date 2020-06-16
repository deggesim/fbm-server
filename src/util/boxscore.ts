import * as fetch from 'node-fetch';
import { IPerformance } from '../schemas/performance';
import { IPlayer } from '../schemas/player';

export const boxscore = async (performances: IPerformance[], url: string) => {
  const response = await fetch.default(url);
  let content = await response.text();
  console.log(response);
  console.log(content);
  content = content.replace(/&nbsp;/g, ' ');
  content = content.replace(/<\/span>/g, '');
  content = content.toUpperCase();

  for (const performance of performances) {
    await performance.populate('player').execPopulate();
    const playerName = (performance.player as IPlayer).name.toUpperCase();
    const indexOfPlayer = content.indexOf(playerName);
    if (indexOfPlayer !== -1) {
      // giocatore trovato, ne preleviamo valutazione e minuti
      // la riga html ha 25 elementi td, l'elemento in posizione 2 (indice 1) rappresenta i minuti giocati
      // l'elemento in posizione 23 (indice 22) la valutazione
      // l'elemento in posizione 24 (indice 23) l'OER
      // l'elemento in posizione 25 (indice 24) il Plus Minus
      const temp = content.substring(indexOfPlayer, content.length);
      const regExpr = />\s*-?[0-9]+\.?[0-9]?[0-9]?\s*\</g;
      const values: string[] = [];
      const matches = temp.match(regExpr) as RegExpMatchArray;
      for (const match of matches) {
        values.push(match);
      }
      const minutes = getIntegerCleanValue(values[1]);
      const ranking = getIntegerCleanValue(values[22]);
      const oer = getIntegerCleanValue(values[23]);
      const plusMinus = getIntegerCleanValue(values[24]);
      performance.minutes = minutes;
      performance.ranking = ranking;
      performance.oer = oer;
      performance.plusMinus = plusMinus;
      await performance.save();
    }
  }
};

function getIntegerCleanValue(value: string) {
  const withoutDelimiters = value.substring(1, value.length - 1);
  const trimmed = withoutDelimiters.trim();
  const intValue = Number(trimmed);
  return intValue;
}

function getDoubleCleanValue(value: string) {
  const withoutDelimiters = value.substring(1, value.length - 1);
  const trimmed = withoutDelimiters.trim();
  const doubleValue = Number(trimmed);
  return doubleValue;
}
