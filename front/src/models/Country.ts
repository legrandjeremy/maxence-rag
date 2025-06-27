import { Continent } from './Continent'

export interface Country {
  isoCode: string;
  isoCode3: string;
  frenchLabel: string;
  englishLabel: string;
  continent: Continent;
}

const Countries: Country[] = [
  { isoCode: "FR", isoCode3: "FRA", frenchLabel: "France", englishLabel: "France", continent: Continent.Europe },
  { isoCode: "US", isoCode3: "USA", frenchLabel: "États-Unis", englishLabel: "United States", continent: Continent.NorthAmerica },
  { isoCode: "DE", isoCode3: "DEU", frenchLabel: "Allemagne", englishLabel: "Germany", continent: Continent.Europe },
  { isoCode: "SG", isoCode3: "SGP", frenchLabel: "Singapour", englishLabel: "Singapore", continent: Continent.Asia }
];

export { Countries };
