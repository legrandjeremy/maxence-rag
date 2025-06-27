export interface CompetitionDiscipline {
  code: string;
  frenchLabel: string;
  englishLabel: string;
}

const competitionDisciplines: CompetitionDiscipline[] = [
  { code: "BMX", frenchLabel: "BMX Racing", englishLabel: "BMX Racing" },
  { code: "CPT", frenchLabel: "Cycling for All", englishLabel: "Cycling for All" },
  { code: "CRO", frenchLabel: "Cyclo-cross", englishLabel: "Cyclo-cross" },
  { code: "IND", frenchLabel: "Indoor Cycling", englishLabel: "Indoor Cycling" },
  { code: "MAS", frenchLabel: "Masters", englishLabel: "Masters" },
  { code: "MTB", frenchLabel: "Mountain Bike", englishLabel: "Mountain Bike" },
  { code: "PAR", frenchLabel: "Para-Cycling", englishLabel: "Para-Cycling" },
  { code: "PIS", frenchLabel: "Track", englishLabel: "Track" },
  { code: "ROA", frenchLabel: "Road", englishLabel: "Road" },
  { code: "TOU", frenchLabel: "Cycle-Touring", englishLabel: "Cycle-Touring" },
  { code: "TRI", frenchLabel: "Trials", englishLabel: "Trials" },
  { code: "BFR", frenchLabel: "BMX Freestyle Park", englishLabel: "BMX Freestyle Park" },
  { code: "CES", frenchLabel: "Cycling E-Sport", englishLabel: "Cycling E-Sport" },
  { code: "GRA", frenchLabel: "Gravel", englishLabel: "Gravel" }
];

export { competitionDisciplines };
