import Router = require("koa-router");
import { ObjectId } from "mongodb";
import { League } from "../schemas/league";
import { erroreImprevisto } from "./globals";

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

export const entityNotFound = (
  entity: string,
  ...params: Array<string | ObjectId>
): string => {
  return `${entity} inesistente per la chiave di ricerca '${params}'`;
};

export const getLeague = async (leagueId: string | ObjectId) => {
  const league = await League.findById(leagueId).exec();
  if (league == null) {
    throw new Error(entityNotFound("Lega", leagueId));
  } else {
    return league;
  }
};

export const handleError = (
  error: unknown,
  ctx: Router.IRouterContext,
  status: number
) => {
  console.log(error);
  if (error instanceof Error) {
    ctx.throw(status, error.message);
  } else {
    ctx.throw(500, erroreImprevisto);
  }
};
