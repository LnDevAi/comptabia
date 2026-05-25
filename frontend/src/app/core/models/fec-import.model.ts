export interface FecImportResult {
  ecrituresCreees: number;
  ecrituresIgnorees: number;
  comptesCrees: number;
  erreurs: FecLineError[];
}

export interface FecLineError {
  ligne: number;
  ecritureNum: string;
  message: string;
}
