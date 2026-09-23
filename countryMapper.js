import {
    getCountryForTimezone,
    getAllCountries,
    getAllTimezones,
    getTimezonesForCountry as getTimezonesForCountryCT
} from 'countries-and-timezones';

export const tzToCountryMap = {
    // South Asia
    'Asia/Kolkata': { country: 'India', code: 'IN', flag: '🇮🇳' },
    'Asia/Calcutta': { country: 'India', code: 'IN', flag: '🇮🇳' },
    'IST': { country: 'India', code: 'IN', flag: '🇮🇳' },
    'Asia/Karachi': { country: 'Pakistan', code: 'PK', flag: '🇵🇰' },
    'Asia/Dhaka': { country: 'Bangladesh', code: 'BD', flag: '🇧🇩' },
    'Asia/Kathmandu': { country: 'Nepal', code: 'NP', flag: '🇳🇵' },
    'Asia/Katmandu': { country: 'Nepal', code: 'NP', flag: '🇳🇵' },
    'Asia/Colombo': { country: 'Sri Lanka', code: 'LK', flag: '🇱🇰' },
    'Asia/Kabul': { country: 'Afghanistan', code: 'AF', flag: '🇦🇫' },
    'Indian/Maldives': { country: 'Maldives', code: 'MV', flag: '🇲🇻' },

    // Americas
    'America/New_York': { country: 'United States', code: 'US', flag: '🇺🇸' },
    'America/Chicago': { country: 'United States', code: 'US', flag: '🇺🇸' },
    'America/Los_Angeles': { country: 'United States', code: 'US', flag: '🇺🇸' },
    'America/Denver': { country: 'United States', code: 'US', flag: '🇺🇸' },
    'America/Phoenix': { country: 'United States', code: 'US', flag: '🇺🇸' },
    'America/Detroit': { country: 'United States', code: 'US', flag: '🇺🇸' },
    'America/Indiana/Indianapolis': { country: 'United States', code: 'US', flag: '🇺🇸' },
    'America/Anchorage': { country: 'United States', code: 'US', flag: '🇺🇸' },
    'America/Boise': { country: 'United States', code: 'US', flag: '🇺🇸' },
    'Pacific/Honolulu': { country: 'United States', code: 'US', flag: '🇺🇸' },
    'America/Puerto_Rico': { country: 'Puerto Rico', code: 'PR', flag: '🇵🇷' },

    'America/Toronto': { country: 'Canada', code: 'CA', flag: '🇨🇦' },
    'America/Vancouver': { country: 'Canada', code: 'CA', flag: '🇨🇦' },
    'America/Edmonton': { country: 'Canada', code: 'CA', flag: '🇨🇦' },
    'America/Winnipeg': { country: 'Canada', code: 'CA', flag: '🇨🇦' },
    'America/Halifax': { country: 'Canada', code: 'CA', flag: '🇨🇦' },
    'America/Regina': { country: 'Canada', code: 'CA', flag: '🇨🇦' },

    'America/Mexico_City': { country: 'Mexico', code: 'MX', flag: '🇲🇽' },
    'America/Monterrey': { country: 'Mexico', code: 'MX', flag: '🇲🇽' },
    'America/Tijuana': { country: 'Mexico', code: 'MX', flag: '🇲🇽' },
    'America/Hermosillo': { country: 'Mexico', code: 'MX', flag: '🇲🇽' },
    'America/Ciudad_Juarez': { country: 'Mexico', code: 'MX', flag: '🇲🇽' },
    'America/Cancun': { country: 'Mexico', code: 'MX', flag: '🇲🇽' },
    'America/Mazatlan': { country: 'Mexico', code: 'MX', flag: '🇲🇽' },

    'America/Sao_Paulo': { country: 'Brazil', code: 'BR', flag: '🇧🇷' },
    'America/Fortaleza': { country: 'Brazil', code: 'BR', flag: '🇧🇷' },
    'America/Recife': { country: 'Brazil', code: 'BR', flag: '🇧🇷' },
    'America/Maceio': { country: 'Brazil', code: 'BR', flag: '🇧🇷' },
    'America/Bahia': { country: 'Brazil', code: 'BR', flag: '🇧🇷' },
    'America/Belem': { country: 'Brazil', code: 'BR', flag: '🇧🇷' },
    'America/Manaus': { country: 'Brazil', code: 'BR', flag: '🇧🇷' },
    'America/Campo_Grande': { country: 'Brazil', code: 'BR', flag: '🇧🇷' },
    'America/Boa_Vista': { country: 'Brazil', code: 'BR', flag: '🇧🇷' },
    'America/Rio_Branco': { country: 'Brazil', code: 'BR', flag: '🇧🇷' },

    'America/Buenos_Aires': { country: 'Argentina', code: 'AR', flag: '🇦🇷' },
    'America/Argentina/Buenos_Aires': { country: 'Argentina', code: 'AR', flag: '🇦🇷' },
    'America/Argentina/Cordoba': { country: 'Argentina', code: 'AR', flag: '🇦🇷' },
    'America/Argentina/San_Luis': { country: 'Argentina', code: 'AR', flag: '🇦🇷' },
    'America/Argentina/Tucuman': { country: 'Argentina', code: 'AR', flag: '🇦🇷' },
    'America/Argentina/La_Rioja': { country: 'Argentina', code: 'AR', flag: '🇦🇷' },
    'America/Argentina/Catamarca': { country: 'Argentina', code: 'AR', flag: '🇦🇷' },
    'America/Argentina/Salta': { country: 'Argentina', code: 'AR', flag: '🇦🇷' },

    'America/Caracas': { country: 'Venezuela', code: 'VE', flag: '🇻🇪' },
    'America/Lima': { country: 'Peru', code: 'PE', flag: '🇵🇪' },
    'America/Bogota': { country: 'Colombia', code: 'CO', flag: '🇨🇴' },
    'America/Santiago': { country: 'Chile', code: 'CL', flag: '🇨🇱' },
    'America/La_Paz': { country: 'Bolivia', code: 'BO', flag: '🇧🇴' },
    'America/Guayaquil': { country: 'Ecuador', code: 'EC', flag: '🇪🇨' },
    'America/Asuncion': { country: 'Paraguay', code: 'PY', flag: '🇵🇾' },
    'America/Panama': { country: 'Panama', code: 'PA', flag: '🇵🇦' },
    'America/Montevideo': { country: 'Uruguay', code: 'UY', flag: '🇺🇾' },
    'America/Santo_Domingo': { country: 'Dominican Republic', code: 'DO', flag: '🇩🇴' },
    'America/Havana': { country: 'Cuba', code: 'CU', flag: '🇨🇺' },
    'America/Tegucigalpa': { country: 'Honduras', code: 'HN', flag: '🇭🇳' },
    'America/Port_of_Spain': { country: 'Trinidad and Tobago', code: 'TT', flag: '🇹🇹' },
    'America/Guatemala': { country: 'Guatemala', code: 'GT', flag: '🇬🇹' },
    'America/Managua': { country: 'Nicaragua', code: 'NI', flag: '🇳🇮' },
    'America/Costa_Rica': { country: 'Costa Rica', code: 'CR', flag: '🇨🇷' },
    'America/El_Salvador': { country: 'El Salvador', code: 'SV', flag: '🇸🇻' },
    'America/Port-au-Prince': { country: 'Haiti', code: 'HT', flag: '🇭🇹' },
    'America/Dominica': { country: 'Dominica', code: 'DM', flag: '🇩🇲' },
    'America/Cayenne': { country: 'French Guiana', code: 'GF', flag: '🇬🇫' },
    'America/Montserrat': { country: 'Montserrat', code: 'MS', flag: '🇲🇸' },

    // Middle East & North Africa
    'Africa/Cairo': { country: 'Egypt', code: 'EG', flag: '🇪🇬' },
    'Africa/Algiers': { country: 'Algeria', code: 'DZ', flag: '🇩🇿' },
    'Asia/Baghdad': { country: 'Iraq', code: 'IQ', flag: '🇮🇶' },
    'Africa/Casablanca': { country: 'Morocco', code: 'MA', flag: '🇲🇦' },
    'Africa/Khartoum': { country: 'Sudan', code: 'SD', flag: '🇸🇩' },
    'Asia/Tehran': { country: 'Iran', code: 'IR', flag: '🇮🇷' },
    'Asia/Riyadh': { country: 'Saudi Arabia', code: 'SA', flag: '🇸🇦' },
    'Asia/Aden': { country: 'Yemen', code: 'YE', flag: '🇾🇪' },
    'Asia/Jerusalem': { country: 'Israel', code: 'IL', flag: '🇮🇱' },
    'Asia/Hebron': { country: 'Palestine', code: 'PS', flag: '🇵🇸' },
    'Asia/Gaza': { country: 'Palestine', code: 'PS', flag: '🇵🇸' },
    'Asia/Dubai': { country: 'United Arab Emirates', code: 'AE', flag: '🇦🇪' },
    'Asia/Damascus': { country: 'Syria', code: 'SY', flag: '🇸🇾' },
    'Asia/Amman': { country: 'Jordan', code: 'JO', flag: '🇯🇴' },
    'Asia/Beirut': { country: 'Lebanon', code: 'LB', flag: '🇱🇧' },
    'Africa/Tunis': { country: 'Tunisia', code: 'TN', flag: '🇹🇳' },
    'Africa/Tripoli': { country: 'Libya', code: 'LY', flag: '🇱🇾' },
    'Asia/Muscat': { country: 'Oman', code: 'OM', flag: '🇴🇲' },
    'Asia/Qatar': { country: 'Qatar', code: 'QA', flag: '🇶🇦' },
    'Asia/Kuwait': { country: 'Kuwait', code: 'KW', flag: '🇰🇼' },
    'Asia/Bahrain': { country: 'Bahrain', code: 'BH', flag: '🇧🇭' },

    // Sub-Saharan Africa
    'Africa/Lagos': { country: 'Nigeria', code: 'NG', flag: '🇳🇬' },
    'Africa/Nairobi': { country: 'Kenya', code: 'KE', flag: '🇰🇪' },
    'Africa/Johannesburg': { country: 'South Africa', code: 'ZA', flag: '🇿🇦' },
    'Africa/Accra': { country: 'Ghana', code: 'GH', flag: '🇬🇭' },
    'Africa/Addis_Ababa': { country: 'Ethiopia', code: 'ET', flag: '🇪🇹' },
    'Africa/Douala': { country: 'Cameroon', code: 'CM', flag: '🇨🇲' },
    'Africa/Kinshasa': { country: 'DR Congo', code: 'CD', flag: '🇨🇩' },
    'Africa/Lubumbashi': { country: 'DR Congo', code: 'CD', flag: '🇨🇩' },
    'Africa/Lusaka': { country: 'Zambia', code: 'ZM', flag: '🇿🇲' },
    'Africa/Dar_es_Salaam': { country: 'Tanzania', code: 'TZ', flag: '🇹🇿' },
    'Africa/Dakar': { country: 'Senegal', code: 'SN', flag: '🇸🇳' },
    'Africa/Antananarivo': { country: 'Madagascar', code: 'MG', flag: '🇲🇬' },
    'Africa/Kampala': { country: 'Uganda', code: 'UG', flag: '🇺🇬' },
    'Africa/Bamako': { country: 'Mali', code: 'ML', flag: '🇲🇱' },
    'Africa/Monrovia': { country: 'Liberia', code: 'LR', flag: '🇱🇷' },
    'Africa/Mogadishu': { country: 'Somalia', code: 'SO', flag: '🇸🇴' },
    'Africa/Kigali': { country: 'Rwanda', code: 'RW', flag: '🇷🇼' },
    'Africa/Nouakchott': { country: 'Mauritania', code: 'MR', flag: '🇲🇷' },
    'Africa/Ndjamena': { country: 'Chad', code: 'TD', flag: '🇹🇩' },
    'Africa/Conakry': { country: 'Guinea', code: 'GN', flag: '🇬🇳' },
    'Africa/Libreville': { country: 'Gabon', code: 'GA', flag: '🇬🇦' },
    'Africa/Lome': { country: 'Togo', code: 'TG', flag: '🇹🇬' },
    'Africa/Brazzaville': { country: 'Congo', code: 'CG', flag: '🇨🇬' },
    'Africa/Harare': { country: 'Zimbabwe', code: 'ZW', flag: '🇿🇼' },
    'Africa/Ouagadougou': { country: 'Burkina Faso', code: 'BF', flag: '🇧🇫' },
    'Africa/Niamey': { country: 'Niger', code: 'NE', flag: '🇳🇪' },
    'Africa/Porto-Novo': { country: 'Benin', code: 'BJ', flag: '🇧🇯' },
    'Africa/Djibouti': { country: 'Djibouti', code: 'DJ', flag: '🇩🇯' },
    'Africa/Maputo': { country: 'Mozambique', code: 'MZ', flag: '🇲🇿' },
    'Africa/Luanda': { country: 'Angola', code: 'AO', flag: '🇦🇴' },
    'Africa/Freetown': { country: 'Sierra Leone', code: 'SL', flag: '🇸🇱' },
    'Africa/Ceuta': { country: 'Spain', code: 'ES', flag: '🇪🇸' },
    'Africa/Blantyre': { country: 'Malawi', code: 'MW', flag: '🇲🇼' },
    'Africa/Bujumbura': { country: 'Burundi', code: 'BI', flag: '🇧🇮' },
    'Africa/Gaborone': { country: 'Botswana', code: 'BW', flag: '🇧🇼' },
    'Indian/Mauritius': { country: 'Mauritius', code: 'MU', flag: '🇲🇺' },
    'Indian/Reunion': { country: 'France', code: 'FR', flag: '🇫🇷' },

    // Europe
    'Europe/Rome': { country: 'Italy', code: 'IT', flag: '🇮🇹' },
    'Europe/London': { country: 'United Kingdom', code: 'GB', flag: '🇬🇧' },
    'GMT': { country: 'United Kingdom', code: 'GB', flag: '🇬🇧' },
    'BST': { country: 'United Kingdom', code: 'GB', flag: '🇬🇧' },
    'Europe/Berlin': { country: 'Germany', code: 'DE', flag: '🇩🇪' },
    'Europe/Paris': { country: 'France', code: 'FR', flag: '🇫🇷' },
    'Europe/Madrid': { country: 'Spain', code: 'ES', flag: '🇪🇸' },
    'Atlantic/Canary': { country: 'Spain', code: 'ES', flag: '🇪🇸' },
    'Europe/Bucharest': { country: 'Romania', code: 'RO', flag: '🇷🇴' },
    'Europe/Moscow': { country: 'Russia', code: 'RU', flag: '🇷🇺' },
    'Asia/Yekaterinburg': { country: 'Russia', code: 'RU', flag: '🇷🇺' },
    'Asia/Krasnoyarsk': { country: 'Russia', code: 'RU', flag: '🇷🇺' },
    'Asia/Yakutsk': { country: 'Russia', code: 'RU', flag: '🇷🇺' },
    'Europe/Samara': { country: 'Russia', code: 'RU', flag: '🇷🇺' },
    'Europe/Athens': { country: 'Greece', code: 'GR', flag: '🇬🇷' },
    'Europe/Sofia': { country: 'Bulgaria', code: 'BG', flag: '🇧🇬' },
    'Europe/Vienna': { country: 'Austria', code: 'AT', flag: '🇦🇹' },
    'Europe/Warsaw': { country: 'Poland', code: 'PL', flag: '🇵🇱' },
    'Europe/Budapest': { country: 'Hungary', code: 'HU', flag: '🇭🇺' },
    'Europe/Lisbon': { country: 'Portugal', code: 'PT', flag: '🇵🇹' },
    'Europe/Bratislava': { country: 'Slovakia', code: 'SK', flag: '🇸🇰' },
    'Europe/Oslo': { country: 'Norway', code: 'NO', flag: '🇳🇴' },
    'Europe/Stockholm': { country: 'Sweden', code: 'SE', flag: '🇸🇪' },
    'Europe/Amsterdam': { country: 'Netherlands', code: 'NL', flag: '🇳🇱' },
    'Europe/Belgrade': { country: 'Serbia', code: 'RS', flag: '🇷🇸' },
    'Europe/Zurich': { country: 'Switzerland', code: 'CH', flag: '🇨🇭' },
    'Europe/Kiev': { country: 'Ukraine', code: 'UA', flag: '🇺🇦' },
    'Europe/Zaporozhye': { country: 'Ukraine', code: 'UA', flag: '🇺🇦' },
    'Europe/Dublin': { country: 'Ireland', code: 'IE', flag: '🇮🇪' },
    'Europe/Tirane': { country: 'Albania', code: 'AL', flag: '🇦🇱' },
    'Europe/Zagreb': { country: 'Croatia', code: 'HR', flag: '🇭🇷' },
    'Europe/Brussels': { country: 'Belgium', code: 'BE', flag: '🇧🇪' },
    'Europe/Sarajevo': { country: 'Bosnia', code: 'BA', flag: '🇧🇦' },
    'Europe/Riga': { country: 'Latvia', code: 'LV', flag: '🇱🇻' },
    'Europe/Skopje': { country: 'North Macedonia', code: 'MK', flag: '🇲🇰' },
    'Europe/Chisinau': { country: 'Moldova', code: 'MD', flag: '🇲🇩' },
    'Europe/Ljubljana': { country: 'Slovenia', code: 'SI', flag: '🇸🇮' },
    'Europe/Minsk': { country: 'Belarus', code: 'BY', flag: '🇧🇾' },
    'Europe/Prague': { country: 'Czechia', code: 'CZ', flag: '🇨🇿' },
    'Europe/Copenhagen': { country: 'Denmark', code: 'DK', flag: '🇩🇰' },
    'Europe/Tallinn': { country: 'Estonia', code: 'EE', flag: '🇪🇪' },
    'Europe/Malta': { country: 'Malta', code: 'MT', flag: '🇲🇹' },
    'Europe/Vilnius': { country: 'Lithuania', code: 'LT', flag: '🇱🇹' },
    'Europe/Helsinki': { country: 'Finland', code: 'FI', flag: '🇫🇮' },
    'Atlantic/Reykjavik': { country: 'Iceland', code: 'IS', flag: '🇮🇸' },
    'Asia/Nicosia': { country: 'Cyprus', code: 'CY', flag: '🇨🇾' },

    // Asia & Pacific
    'Asia/Istanbul': { country: 'Turkey', code: 'TR', flag: '🇹🇷' },
    'Asia/Tbilisi': { country: 'Georgia', code: 'GE', flag: '🇬🇪' },
    'Asia/Yerevan': { country: 'Armenia', code: 'AM', flag: '🇦🇲' },
    'Asia/Baku': { country: 'Azerbaijan', code: 'AZ', flag: '🇦🇿' },
    'Asia/Tashkent': { country: 'Uzbekistan', code: 'UZ', flag: '🇺🇿' },
    'Asia/Samarkand': { country: 'Uzbekistan', code: 'UZ', flag: 'UZ' },
    'Asia/Ashgabat': { country: 'Turkmenistan', code: 'TM', flag: '🇹🇲' },
    'Asia/Bishkek': { country: 'Kyrgyzstan', code: 'KG', flag: '🇰🇬' },
    'Asia/Almaty': { country: 'Kazakhstan', code: 'KZ', flag: '🇰🇿' },
    'Asia/Atyrau': { country: 'Kazakhstan', code: 'KZ', flag: '🇰🇿' },
    'Asia/Dushanbe': { country: 'Tajikistan', code: 'TJ', flag: '🇹🇯' },

    'Asia/Singapore': { country: 'Singapore', code: 'SG', flag: '🇸🇬' },
    'Asia/Tokyo': { country: 'Japan', code: 'JP', flag: '🇯🇵' },
    'Asia/Hong_Kong': { country: 'Hong Kong', code: 'HK', flag: '🇭🇰' },
    'Asia/Seoul': { country: 'South Korea', code: 'KR', flag: '🇰🇷' },
    'Asia/Jakarta': { country: 'Indonesia', code: 'ID', flag: '🇮🇩' },
    'Asia/Makassar': { country: 'Indonesia', code: 'ID', flag: '🇮🇩' },
    'Asia/Jayapura': { country: 'Indonesia', code: 'ID', flag: '🇮🇩' },
    'Asia/Pontianak': { country: 'Indonesia', code: 'ID', flag: '🇮🇩' },
    'Asia/Bangkok': { country: 'Thailand', code: 'TH', flag: '🇹🇭' },
    'Asia/Kuala_Lumpur': { country: 'Malaysia', code: 'MY', flag: '🇲🇾' },
    'Asia/Manila': { country: 'Philippines', code: 'PH', flag: '🇵🇭' },
    'Asia/Ho_Chi_Minh': { country: 'Vietnam', code: 'VN', flag: '🇻🇳' },
    'Asia/Yangon': { country: 'Myanmar', code: 'MM', flag: '🇲🇲' },
    'Asia/Rangoon': { country: 'Myanmar', code: 'MM', flag: '🇲🇲' },
    'Asia/Phnom_Penh': { country: 'Cambodia', code: 'KH', flag: '🇰🇭' },
    'Asia/Taipei': { country: 'Taiwan', code: 'TW', flag: '🇹🇼' },
    'Asia/Brunei': { country: 'Brunei', code: 'BN', flag: '🇧🇳' },
    'Asia/Dili': { country: 'East Timor', code: 'TL', flag: '🇹🇱' },

    'Australia/Sydney': { country: 'Australia', code: 'AU', flag: '🇦🇺' },
    'Australia/Melbourne': { country: 'Australia', code: 'AU', flag: '🇦🇺' },
    'Australia/Brisbane': { country: 'Australia', code: 'AU', flag: '🇦🇺' },
    'Australia/Perth': { country: 'Australia', code: 'AU', flag: '🇦🇺' },
    'Australia/Adelaide': { country: 'Australia', code: 'AU', flag: '🇦🇺' },
    'Pacific/Auckland': { country: 'New Zealand', code: 'NZ', flag: '🇳🇿' },
    'Pacific/Guadalcanal': { country: 'Solomon Islands', code: 'SB', flag: '🇸🇧' }
};

export const countryNameToFlag = {
    'India': '🇮🇳',
    'United States': '🇺🇸',
    'United States of America': '🇺🇸',
    'USA': '🇺🇸',
    'Canada': '🇨🇦',
    'United Kingdom': '🇬🇧',
    'UK': '🇬🇧',
    'Australia': '🇦🇺',
    'Germany': '🇩🇪',
    'France': '🇫🇷',
    'Spain': '🇪🇸',
    'Italy': '🇮🇹',
    'Brazil': '🇧🇷',
    'Mexico': '🇲🇽',
    'Japan': '🇯🇵',
    'South Korea': '🇰🇷',
    'China': '🇨🇳',
    'Singapore': '🇸🇬',
    'United Arab Emirates': '🇦🇪',
    'UAE': '🇦🇪',
    'Saudi Arabia': '🇸🇦',
    'Pakistan': '🇵🇰',
    'Bangladesh': '🇧🇩',
    'Nepal': '🇳🇵',
    'Sri Lanka': '🇱🇰',
    'Indonesia': '🇮🇩',
    'Philippines': '🇵🇭',
    'Vietnam': '🇻🇳',
    'Thailand': '🇹🇭',
    'Malaysia': '🇲🇾',
    'Netherlands': '🇳🇱',
    'Sweden': '🇸🇪',
    'Norway': '🇳🇴',
    'Switzerland': '🇨🇭',
    'Poland': '🇵🇱',
    'Russia': '🇷🇺',
    'South Africa': '🇿🇦',
    'Nigeria': '🇳🇬',
    'Egypt': '🇪🇬',
    'Kenya': '🇰🇪',
    'New Zealand': '🇳🇿',
    'Ireland': '🇮🇪',
    'Turkey': '🇹🇷'
};

// Populate countryNameToFlag with all countries from tzToCountryMap
Object.values(tzToCountryMap).forEach(({ country, flag }) => {
    if (country && flag && !countryNameToFlag[country]) {
        countryNameToFlag[country] = flag;
    }
});

/**
 * Converts 2-letter ISO country code (e.g. "US", "IN") to emoji flag.
 */
export const getFlagEmoji = (countryCode) => {
    if (!countryCode || typeof countryCode !== 'string' || countryCode.length !== 2) return '🌐';
    try {
        const codePoints = countryCode
            .toUpperCase()
            .split('')
            .map((char) => 127397 + char.charCodeAt(0));
        return String.fromCodePoint(...codePoints);
    } catch {
        return '🌐';
    }
};

/**
 * Resolves country name, 2-letter code, and flag emoji from timezone and/or country object/string.
 */
export function getCountryInfo(timezone, existingCountry, existingFlag) {
    if (existingFlag && existingFlag !== '🌐' && existingCountry) {
        const countryName = typeof existingCountry === 'string' ? existingCountry : existingCountry.name;
        const code = typeof existingCountry === 'object' ? existingCountry.code : null;
        return { country: countryName || 'Unknown', code, flag: existingFlag };
    }

    if (existingCountry) {
        const code = typeof existingCountry === 'object' 
            ? existingCountry.code 
            : (typeof existingCountry === 'string' && existingCountry.length === 2 ? existingCountry : null);
        const name = typeof existingCountry === 'object' ? existingCountry.name : existingCountry;
        const flag = (typeof existingCountry === 'object' && existingCountry.flag && existingCountry.flag !== '🌐') 
            ? existingCountry.flag 
            : (code ? getFlagEmoji(code) : (name ? countryNameToFlag[name] : null));

        if (flag && flag !== '🌐') {
            return { country: name || code, code, flag };
        }
    }

    if (!timezone || timezone === 'UTC' || timezone === 'unknown') {
        const fallbackName = typeof existingCountry === 'string' ? existingCountry : existingCountry?.name;
        if (fallbackName && countryNameToFlag[fallbackName]) {
            return { country: fallbackName, code: null, flag: countryNameToFlag[fallbackName] };
        }
        return { country: fallbackName || 'UTC / Global', code: null, flag: '🌐' };
    }

    const tz = String(timezone).trim();
    if (tzToCountryMap[tz]) {
        return {
            country: tzToCountryMap[tz].country,
            code: tzToCountryMap[tz].code || null,
            flag: tzToCountryMap[tz].flag
        };
    }

    // Try countries-and-timezones library lookup
    try {
        const c = getCountryForTimezone(tz);
        if (c?.id) {
            return {
                country: c.name || tz,
                code: c.id,
                flag: getFlagEmoji(c.id)
            };
        }
    } catch {
        // Continue to prefix matchers
    }

    if (tz.startsWith('US/') || tz.startsWith('America/US')) return { country: 'United States', code: 'US', flag: '🇺🇸' };
    if (tz.startsWith('Canada/')) return { country: 'Canada', code: 'CA', flag: '🇨🇦' };
    if (tz.startsWith('Australia/')) return { country: 'Australia', code: 'AU', flag: '🇦🇺' };

    const parts = tz.split('/');
    const city = parts[parts.length - 1].replace(/_/g, ' ');
    const flag = countryNameToFlag[city] || '🌐';
    return { country: city, code: null, flag };
}

/**
 * Convenient helper to extract country info from a user object.
 */
export function getUserCountry(user) {
    if (!user) return { country: 'Unknown', code: null, flag: '🌐' };
    return getCountryInfo(user.timezone, user.country, user.flag);
}

/**
 * Returns all timezones matching a country name or code.
 */
export function getTimezonesForCountry(countryQuery) {
    if (!countryQuery) return [];
    const q = countryQuery.trim().toLowerCase();
    const matched = new Set();

    // 1. Check tzToCountryMap
    for (const [tz, info] of Object.entries(tzToCountryMap)) {
        if (info.country?.toLowerCase() === q || info.code?.toLowerCase() === q) {
            matched.add(tz);
        }
    }

    // 2. Check countries-and-timezones library
    try {
        const allCountries = getAllCountries();
        const countryObj = Object.values(allCountries).find(
            (c) => c.name.toLowerCase() === q || c.id.toLowerCase() === q || (q === 'united states' && c.id === 'US')
        );
        if (countryObj) {
            const ctTzs = getTimezonesForCountryCT(countryObj.id) || [];
            ctTzs.forEach((t) => matched.add(t.name));
        }

        const allTimezones = getAllTimezones();
        for (const [tzName] of Object.entries(allTimezones)) {
            const info = getCountryInfo(tzName);
            if (info.country?.toLowerCase() === q || info.code?.toLowerCase() === q) {
                matched.add(tzName);
            }
        }
    } catch {
        // Fallback to tzToCountryMap matches only
    }

    return Array.from(matched);
}

