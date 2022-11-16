import { ObjectId } from "mongodb";
import { League } from "../schemas/league";
import { isEmpty } from "./globals";

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
  return params != null && !isEmpty(params)
    ? `${entity} inesistente per la chiave di ricerca '${params}'`
    : `${entity} inesistente`;
};

export const getLeague = async (leagueId: string | ObjectId) => {
  const league = await League.findById(leagueId).exec();
  if (league == null) {
    throw new Error(entityNotFound("Lega", leagueId));
  } else {
    return league;
  }
};
