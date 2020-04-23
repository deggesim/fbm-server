export const isEmpty = (obj: any) => [Object, Array].includes((obj || {}).constructor) && !Object.entries((obj || {})).length;

export enum AppConfig {
  'Starters' = 5,
  'PlayersInBench' = 5,
  'MinPlayersInLineup' = 10,
  'MaxPlayersInLineup' = 12,
  'DefaultGrade' = 5.5,
  'NecessaryGrades' = 10,
  'gradePlayerTeamWithNoGame' = 4,
  'LastBenchPlayerWithStarter' = 10,
}
