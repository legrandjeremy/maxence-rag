/**
 * Utility functions for country code conversions
 */

/**
 * Convert IOC country codes to ISO country codes
 *
 * @param iocCode The IOC country code (3 letters)
 * @returns The corresponding ISO country code (2 letters)
 */
export const iocToIso = (iocCode: string): string => {
  // This is a mapping of common IOC codes to ISO codes
  const iocToIsoMap: Record<string, string> = {
    // Some examples of differences between IOC and ISO
    'AFG': 'AF', // Afghanistan
    'ALB': 'AL', // Albania
    'ALG': 'DZ', // Algeria
    'AND': 'AD', // Andorra
    'ANG': 'AO', // Angola
    'ANT': 'AG', // Antigua and Barbuda
    'ARG': 'AR', // Argentina
    'ARM': 'AM', // Armenia
    'ARU': 'AW', // Aruba
    'AUS': 'AU', // Australia
    'AUT': 'AT', // Austria
    'BAH': 'BS', // Bahamas
    'BEN': 'BJ', // Benin
    'BHU': 'BT', // Bhutan
    'BIH': 'BA', // Bosnia and Herzegovina
    'BIZ': 'BZ', // Belize
    'BLR': 'BY', // Belarus
    'BOL': 'BO', // Bolivia
    'BOT': 'BW', // Botswana
    'BRA': 'BR', // Brazil
    'BRN': 'BN', // Brunei
    'BUL': 'BG', // Bulgaria
    'CAF': 'CF', // Central African Republic
    'CAN': 'CA', // Canada
    'CGO': 'CG', // Congo
    'CHI': 'CL', // Chile
    'CIV': 'CI', // Côte d'Ivoire
    'COL': 'CO', // Colombia
    'COM': 'KM', // Comoros
    'CPV': 'CV', // Cape Verde
    'CRC': 'CR', // Costa Rica
    'CRO': 'HR', // Croatia
    'CUB': 'CU', // Cuba
    'CYP': 'CY', // Cyprus
    'CZE': 'CZ', // Czech Republic
    'DEN': 'DK', // Denmark
    'DJI': 'DJ', // Djibouti
    'DOM': 'DO', // Dominican Republic
    'ECU': 'EC', // Ecuador
    'ERI': 'ER', // Eritrea
    'ESA': 'SV', // El Salvador
    'ESP': 'ES', // Spain
    'EST': 'EE', // Estonia
    'FIJ': 'FJ', // Fiji
    'FIN': 'FI', // Finland
    'FRA': 'FR', // France
    'FSM': 'FM', // Micronesia
    'GAB': 'GA', // Gabon
    'GAM': 'GM', // Gambia
    'GBR': 'GB', // Great Britain
    'GEO': 'GE', // Georgia
    'GER': 'DE', // Germany
    'GHA': 'GH', // Ghana
    'GRE': 'GR', // Greece
    'GRN': 'GD', // Grenada
    'GUA': 'GT', // Guatemala
    'GUY': 'GY', // Guyana
    'HAI': 'HT', // Haiti
    'HUN': 'HU', // Hungary
    'INA': 'ID', // Indonesia
    'IND': 'IN', // India
    'IRI': 'IR', // Iran
    'IRL': 'IE', // Ireland
    'IRQ': 'IQ', // Iraq
    'ISL': 'IS', // Iceland
    'ISR': 'IL', // Israel
    'ITA': 'IT', // Italy
    'JAM': 'JM', // Jamaica
    'JOR': 'JO', // Jordan
    'JPN': 'JP', // Japan
    'KAZ': 'KZ', // Kazakhstan
    'KEN': 'KE', // Kenya
    'KIR': 'KI', // Kiribati
    'KOR': 'KR', // South Korea
    'KOS': 'XK', // Kosovo
    'KUW': 'KW', // Kuwait
    'LAO': 'LA', // Laos
    'LAT': 'LV', // Latvia
    'LBA': 'LY', // Libya
    'LBR': 'LR', // Liberia
    'LES': 'LS', // Lesotho
    'LIE': 'LI', // Liechtenstein
    'LTU': 'LT', // Lithuania
    'LUX': 'LU', // Luxembourg
    'MAD': 'MG', // Madagascar
    'MAR': 'MA', // Morocco
    'MAS': 'MY', // Malaysia
    'MDA': 'MD', // Moldova
    'MEX': 'MX', // Mexico
    'MGL': 'MN', // Mongolia
    'MKD': 'MK', // North Macedonia
    'MLI': 'ML', // Mali
    'MLT': 'MT', // Malta
    'MLW': 'MW', // Malawi
    'MNE': 'ME', // Montenegro
    'MON': 'MC', // Monaco
    'MOZ': 'MZ', // Mozambique
    'MRT': 'MR', // Mauritania
    'MWI': 'MW', // Malawi
    'MYA': 'MM', // Myanmar
    'NAM': 'NA', // Namibia
    'NCA': 'NI', // Nicaragua
    'NED': 'NL', // Netherlands
    'NEP': 'NP', // Nepal
    'NGR': 'NG', // Nigeria
    'NIG': 'NE', // Niger
    'NRU': 'NR', // Nauru
    'NZL': 'NZ', // New Zealand
    'OMA': 'OM', // Oman
    'PAK': 'PK', // Pakistan
    'PAN': 'PA', // Panama
    'PAR': 'PY', // Paraguay
    'PER': 'PE', // Peru
    'PHI': 'PH', // Philippines
    'PLW': 'PW', // Palau
    'PNG': 'PG', // Papua New Guinea
    'POL': 'PL', // Poland
    'POR': 'PT', // Portugal
    'PRK': 'KP', // North Korea
    'PUR': 'PR', // Puerto Rico
    'QAT': 'QA', // Qatar
    'RSA': 'ZA', // South Africa
    'RUS': 'RU', // Russia
    'RWA': 'RW', // Rwanda
    'SAM': 'WS', // Samoa
    'SEN': 'SN', // Senegal
    'SIN': 'SG', // Singapore
    'SLB': 'SB', // Solomon Islands
    'SLE': 'SL', // Sierra Leone
    'SMR': 'SM', // San Marino
    'SOM': 'SO', // Somalia
    'SRB': 'RS', // Serbia
    'SRI': 'LK', // Sri Lanka
    'SSD': 'SS', // South Sudan
    'STP': 'ST', // São Tomé and Príncipe
    'SUD': 'SD', // Sudan
    'SUI': 'CH', // Switzerland
    'SUR': 'SR', // Suriname
    'SVK': 'SK', // Slovakia
    'SVN': 'SI', // Slovenia (alternate code)
    'SWE': 'SE', // Sweden
    'SWZ': 'SZ', // Eswatini (formerly Swaziland)
    'SYR': 'SY', // Syria
    'TAN': 'TZ', // Tanzania
    'TCH': 'TD', // Chad
    'TGA': 'TO', // Tonga
    'THA': 'TH', // Thailand
    'TJK': 'TJ', // Tajikistan
    'TKM': 'TM', // Turkmenistan
    'TLS': 'TL', // Timor-Leste
    'TOG': 'TG', // Togo
    'TPE': 'TW', // Chinese Taipei
    'TTO': 'TT', // Trinidad and Tobago
    'TUN': 'TN', // Tunisia
    'TUR': 'TR', // Turkey
    'TUV': 'TV', // Tuvalu
    'UAE': 'AE', // United Arab Emirates
    'UGA': 'UG', // Uganda
    'UKR': 'UA', // Ukraine
    'URU': 'UY', // Uruguay
    'USA': 'US', // United States
    'UZB': 'UZ', // Uzbekistan
    'VAN': 'VU', // Vanuatu
    'VEN': 'VE', // Venezuela
    'VIE': 'VN', // Vietnam
    'VIN': 'VC', // Saint Vincent and the Grenadines
    'YEM': 'YE', // Yemen
    'ZAF': 'ZA', // South Africa
    'ZAM': 'ZM', // Zambia
    'ZIM': 'ZW', // Zimbabwe
  };

  // Return the ISO code if a mapping exists, otherwise return the IOC code
  // (Many codes are the same between IOC and ISO)
  return iocToIsoMap[iocCode] || iocCode;
};
