import Router = require('koa-router');
import { ObjectId } from 'mongodb';
import { League } from '../schemas/league';

export const halfDownRound = (firstOperand: number, secondOperand: number) => {
  let half = firstOperand / secondOperand;
  const decimalPart = half % 1;
  if (decimalPart === 0.5) {
    half -= decimalPart;
  } else {
    half = Math.round(half);
  }
  return half;
};

export const entityNotFound = (entity: string, ...params: Array<string | ObjectId>): string => {
  return `Entity ${entity} not found for params: ${params}`;
};

export const getLeague = async (ctx: Router.IRouterContext) => {
  const league = await League.findById(ctx.get("league")).exec();
  if (league == null) {
    throw new Error("Lega non trovata");
  } else {
    return league;
  }
}
