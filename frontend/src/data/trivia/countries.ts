export interface Country {
  name: string;
  capital: string;
  flag: string;
  continent: "Europe" | "Asia" | "Africa" | "North America" | "South America" | "Oceania";
  landmarks?: string[];
}

export const countries: Country[] = [
  // ─── Europe ───────────────────────────────────────────────────────────────────
  { name: "France", capital: "Paris", flag: "\u{1F1EB}\u{1F1F7}", continent: "Europe", landmarks: ["Eiffel Tower", "Louvre"] },
  { name: "Germany", capital: "Berlin", flag: "\u{1F1E9}\u{1F1EA}", continent: "Europe", landmarks: ["Brandenburg Gate", "Neuschwanstein Castle"] },
  { name: "United Kingdom", capital: "London", flag: "\u{1F1EC}\u{1F1E7}", continent: "Europe", landmarks: ["Big Ben", "Tower of London"] },
  { name: "Italy", capital: "Rome", flag: "\u{1F1EE}\u{1F1F9}", continent: "Europe", landmarks: ["Colosseum", "Leaning Tower of Pisa"] },
  { name: "Spain", capital: "Madrid", flag: "\u{1F1EA}\u{1F1F8}", continent: "Europe", landmarks: ["Sagrada Familia", "Alhambra"] },
  { name: "Portugal", capital: "Lisbon", flag: "\u{1F1F5}\u{1F1F9}", continent: "Europe", landmarks: ["Tower of Belem"] },
  { name: "Netherlands", capital: "Amsterdam", flag: "\u{1F1F3}\u{1F1F1}", continent: "Europe", landmarks: ["Anne Frank House"] },
  { name: "Belgium", capital: "Brussels", flag: "\u{1F1E7}\u{1F1EA}", continent: "Europe", landmarks: ["Grand Place"] },
  { name: "Switzerland", capital: "Bern", flag: "\u{1F1E8}\u{1F1ED}", continent: "Europe", landmarks: ["Matterhorn"] },
  { name: "Austria", capital: "Vienna", flag: "\u{1F1E6}\u{1F1F9}", continent: "Europe", landmarks: ["Schonbrunn Palace"] },
  { name: "Sweden", capital: "Stockholm", flag: "\u{1F1F8}\u{1F1EA}", continent: "Europe" },
  { name: "Norway", capital: "Oslo", flag: "\u{1F1F3}\u{1F1F4}", continent: "Europe", landmarks: ["Fjords"] },
  { name: "Denmark", capital: "Copenhagen", flag: "\u{1F1E9}\u{1F1F0}", continent: "Europe", landmarks: ["Little Mermaid Statue"] },
  { name: "Finland", capital: "Helsinki", flag: "\u{1F1EB}\u{1F1EE}", continent: "Europe" },
  { name: "Iceland", capital: "Reykjavik", flag: "\u{1F1EE}\u{1F1F8}", continent: "Europe" },
  { name: "Ireland", capital: "Dublin", flag: "\u{1F1EE}\u{1F1EA}", continent: "Europe" },
  { name: "Poland", capital: "Warsaw", flag: "\u{1F1F5}\u{1F1F1}", continent: "Europe" },
  { name: "Czech Republic", capital: "Prague", flag: "\u{1F1E8}\u{1F1FF}", continent: "Europe", landmarks: ["Charles Bridge", "Prague Castle"] },
  { name: "Hungary", capital: "Budapest", flag: "\u{1F1ED}\u{1F1FA}", continent: "Europe" },
  { name: "Romania", capital: "Bucharest", flag: "\u{1F1F7}\u{1F1F4}", continent: "Europe", landmarks: ["Bran Castle"] },
  { name: "Greece", capital: "Athens", flag: "\u{1F1EC}\u{1F1F7}", continent: "Europe", landmarks: ["Parthenon", "Acropolis"] },
  { name: "Turkey", capital: "Ankara", flag: "\u{1F1F9}\u{1F1F7}", continent: "Europe", landmarks: ["Hagia Sophia", "Cappadocia"] },
  { name: "Croatia", capital: "Zagreb", flag: "\u{1F1ED}\u{1F1F7}", continent: "Europe" },
  { name: "Serbia", capital: "Belgrade", flag: "\u{1F1F7}\u{1F1F8}", continent: "Europe" },
  { name: "Bulgaria", capital: "Sofia", flag: "\u{1F1E7}\u{1F1EC}", continent: "Europe" },
  { name: "Ukraine", capital: "Kyiv", flag: "\u{1F1FA}\u{1F1E6}", continent: "Europe" },
  { name: "Slovakia", capital: "Bratislava", flag: "\u{1F1F8}\u{1F1F0}", continent: "Europe" },
  { name: "Slovenia", capital: "Ljubljana", flag: "\u{1F1F8}\u{1F1EE}", continent: "Europe" },
  { name: "Estonia", capital: "Tallinn", flag: "\u{1F1EA}\u{1F1EA}", continent: "Europe" },
  { name: "Latvia", capital: "Riga", flag: "\u{1F1F1}\u{1F1FB}", continent: "Europe" },
  { name: "Lithuania", capital: "Vilnius", flag: "\u{1F1F1}\u{1F1F9}", continent: "Europe" },

  // ─── Asia ─────────────────────────────────────────────────────────────────────
  { name: "China", capital: "Beijing", flag: "\u{1F1E8}\u{1F1F3}", continent: "Asia", landmarks: ["Great Wall of China", "Forbidden City"] },
  { name: "Japan", capital: "Tokyo", flag: "\u{1F1EF}\u{1F1F5}", continent: "Asia", landmarks: ["Mount Fuji", "Fushimi Inari Shrine"] },
  { name: "South Korea", capital: "Seoul", flag: "\u{1F1F0}\u{1F1F7}", continent: "Asia", landmarks: ["Gyeongbokgung Palace"] },
  { name: "India", capital: "New Delhi", flag: "\u{1F1EE}\u{1F1F3}", continent: "Asia", landmarks: ["Taj Mahal", "Red Fort"] },
  { name: "Indonesia", capital: "Jakarta", flag: "\u{1F1EE}\u{1F1E9}", continent: "Asia", landmarks: ["Borobudur"] },
  { name: "Thailand", capital: "Bangkok", flag: "\u{1F1F9}\u{1F1ED}", continent: "Asia", landmarks: ["Grand Palace", "Wat Arun"] },
  { name: "Vietnam", capital: "Hanoi", flag: "\u{1F1FB}\u{1F1F3}", continent: "Asia", landmarks: ["Ha Long Bay"] },
  { name: "Philippines", capital: "Manila", flag: "\u{1F1F5}\u{1F1ED}", continent: "Asia" },
  { name: "Malaysia", capital: "Kuala Lumpur", flag: "\u{1F1F2}\u{1F1FE}", continent: "Asia", landmarks: ["Petronas Towers"] },
  { name: "Singapore", capital: "Singapore", flag: "\u{1F1F8}\u{1F1EC}", continent: "Asia", landmarks: ["Marina Bay Sands"] },
  { name: "Myanmar", capital: "Naypyidaw", flag: "\u{1F1F2}\u{1F1F2}", continent: "Asia" },
  { name: "Cambodia", capital: "Phnom Penh", flag: "\u{1F1F0}\u{1F1ED}", continent: "Asia", landmarks: ["Angkor Wat"] },
  { name: "Nepal", capital: "Kathmandu", flag: "\u{1F1F3}\u{1F1F5}", continent: "Asia", landmarks: ["Mount Everest"] },
  { name: "Sri Lanka", capital: "Sri Jayawardenepura Kotte", flag: "\u{1F1F1}\u{1F1F0}", continent: "Asia" },
  { name: "Bangladesh", capital: "Dhaka", flag: "\u{1F1E7}\u{1F1E9}", continent: "Asia" },
  { name: "Pakistan", capital: "Islamabad", flag: "\u{1F1F5}\u{1F1F0}", continent: "Asia" },
  { name: "Iran", capital: "Tehran", flag: "\u{1F1EE}\u{1F1F7}", continent: "Asia", landmarks: ["Persepolis"] },
  { name: "Iraq", capital: "Baghdad", flag: "\u{1F1EE}\u{1F1F6}", continent: "Asia" },
  { name: "Saudi Arabia", capital: "Riyadh", flag: "\u{1F1F8}\u{1F1E6}", continent: "Asia", landmarks: ["Mecca"] },
  { name: "United Arab Emirates", capital: "Abu Dhabi", flag: "\u{1F1E6}\u{1F1EA}", continent: "Asia", landmarks: ["Burj Khalifa"] },
  { name: "Israel", capital: "Jerusalem", flag: "\u{1F1EE}\u{1F1F1}", continent: "Asia", landmarks: ["Western Wall", "Dead Sea"] },
  { name: "Jordan", capital: "Amman", flag: "\u{1F1EF}\u{1F1F4}", continent: "Asia", landmarks: ["Petra"] },
  { name: "Lebanon", capital: "Beirut", flag: "\u{1F1F1}\u{1F1E7}", continent: "Asia" },
  { name: "Mongolia", capital: "Ulaanbaatar", flag: "\u{1F1F2}\u{1F1F3}", continent: "Asia" },
  { name: "Kazakhstan", capital: "Astana", flag: "\u{1F1F0}\u{1F1FF}", continent: "Asia" },
  { name: "Uzbekistan", capital: "Tashkent", flag: "\u{1F1FA}\u{1F1FF}", continent: "Asia", landmarks: ["Registan Square"] },

  // ─── Africa ───────────────────────────────────────────────────────────────────
  { name: "Egypt", capital: "Cairo", flag: "\u{1F1EA}\u{1F1EC}", continent: "Africa", landmarks: ["Pyramids of Giza", "Sphinx"] },
  { name: "South Africa", capital: "Pretoria", flag: "\u{1F1FF}\u{1F1E6}", continent: "Africa", landmarks: ["Table Mountain", "Kruger National Park"] },
  { name: "Nigeria", capital: "Abuja", flag: "\u{1F1F3}\u{1F1EC}", continent: "Africa" },
  { name: "Kenya", capital: "Nairobi", flag: "\u{1F1F0}\u{1F1EA}", continent: "Africa", landmarks: ["Maasai Mara"] },
  { name: "Morocco", capital: "Rabat", flag: "\u{1F1F2}\u{1F1E6}", continent: "Africa", landmarks: ["Hassan II Mosque"] },
  { name: "Ethiopia", capital: "Addis Ababa", flag: "\u{1F1EA}\u{1F1F9}", continent: "Africa", landmarks: ["Rock-Hewn Churches of Lalibela"] },
  { name: "Ghana", capital: "Accra", flag: "\u{1F1EC}\u{1F1ED}", continent: "Africa" },
  { name: "Tanzania", capital: "Dodoma", flag: "\u{1F1F9}\u{1F1FF}", continent: "Africa", landmarks: ["Mount Kilimanjaro", "Serengeti"] },
  { name: "Uganda", capital: "Kampala", flag: "\u{1F1FA}\u{1F1EC}", continent: "Africa" },
  { name: "Rwanda", capital: "Kigali", flag: "\u{1F1F7}\u{1F1FC}", continent: "Africa" },
  { name: "Senegal", capital: "Dakar", flag: "\u{1F1F8}\u{1F1F3}", continent: "Africa" },
  { name: "Tunisia", capital: "Tunis", flag: "\u{1F1F9}\u{1F1F3}", continent: "Africa", landmarks: ["Carthage Ruins"] },
  { name: "Algeria", capital: "Algiers", flag: "\u{1F1E9}\u{1F1FF}", continent: "Africa" },
  { name: "Ivory Coast", capital: "Yamoussoukro", flag: "\u{1F1E8}\u{1F1EE}", continent: "Africa" },
  { name: "Cameroon", capital: "Yaounde", flag: "\u{1F1E8}\u{1F1F2}", continent: "Africa" },
  { name: "Madagascar", capital: "Antananarivo", flag: "\u{1F1F2}\u{1F1EC}", continent: "Africa" },
  { name: "Mozambique", capital: "Maputo", flag: "\u{1F1F2}\u{1F1FF}", continent: "Africa" },
  { name: "Zimbabwe", capital: "Harare", flag: "\u{1F1FF}\u{1F1FC}", continent: "Africa", landmarks: ["Victoria Falls"] },
  { name: "Botswana", capital: "Gaborone", flag: "\u{1F1E7}\u{1F1FC}", continent: "Africa" },
  { name: "Namibia", capital: "Windhoek", flag: "\u{1F1F3}\u{1F1E6}", continent: "Africa" },
  { name: "Democratic Republic of the Congo", capital: "Kinshasa", flag: "\u{1F1E8}\u{1F1E9}", continent: "Africa" },
  { name: "Mali", capital: "Bamako", flag: "\u{1F1F2}\u{1F1F1}", continent: "Africa", landmarks: ["Great Mosque of Djenne"] },
  { name: "Angola", capital: "Luanda", flag: "\u{1F1E6}\u{1F1F4}", continent: "Africa" },
  { name: "Sudan", capital: "Khartoum", flag: "\u{1F1F8}\u{1F1E9}", continent: "Africa" },
  { name: "Libya", capital: "Tripoli", flag: "\u{1F1F1}\u{1F1FE}", continent: "Africa" },

  // ─── North America ────────────────────────────────────────────────────────────
  { name: "United States", capital: "Washington, D.C.", flag: "\u{1F1FA}\u{1F1F8}", continent: "North America", landmarks: ["Statue of Liberty", "Grand Canyon"] },
  { name: "Canada", capital: "Ottawa", flag: "\u{1F1E8}\u{1F1E6}", continent: "North America", landmarks: ["CN Tower", "Niagara Falls"] },
  { name: "Mexico", capital: "Mexico City", flag: "\u{1F1F2}\u{1F1FD}", continent: "North America", landmarks: ["Chichen Itza", "Teotihuacan"] },
  { name: "Cuba", capital: "Havana", flag: "\u{1F1E8}\u{1F1FA}", continent: "North America" },
  { name: "Jamaica", capital: "Kingston", flag: "\u{1F1EF}\u{1F1F2}", continent: "North America" },
  { name: "Haiti", capital: "Port-au-Prince", flag: "\u{1F1ED}\u{1F1F9}", continent: "North America" },
  { name: "Dominican Republic", capital: "Santo Domingo", flag: "\u{1F1E9}\u{1F1F4}", continent: "North America" },
  { name: "Guatemala", capital: "Guatemala City", flag: "\u{1F1EC}\u{1F1F9}", continent: "North America", landmarks: ["Tikal"] },
  { name: "Honduras", capital: "Tegucigalpa", flag: "\u{1F1ED}\u{1F1F3}", continent: "North America" },
  { name: "El Salvador", capital: "San Salvador", flag: "\u{1F1F8}\u{1F1FB}", continent: "North America" },
  { name: "Nicaragua", capital: "Managua", flag: "\u{1F1F3}\u{1F1EE}", continent: "North America" },
  { name: "Costa Rica", capital: "San Jose", flag: "\u{1F1E8}\u{1F1F7}", continent: "North America" },
  { name: "Panama", capital: "Panama City", flag: "\u{1F1F5}\u{1F1E6}", continent: "North America", landmarks: ["Panama Canal"] },
  { name: "Trinidad and Tobago", capital: "Port of Spain", flag: "\u{1F1F9}\u{1F1F9}", continent: "North America" },
  { name: "Bahamas", capital: "Nassau", flag: "\u{1F1E7}\u{1F1F8}", continent: "North America" },
  { name: "Barbados", capital: "Bridgetown", flag: "\u{1F1E7}\u{1F1E7}", continent: "North America" },
  { name: "Belize", capital: "Belmopan", flag: "\u{1F1E7}\u{1F1FF}", continent: "North America" },

  // ─── South America ────────────────────────────────────────────────────────────
  { name: "Brazil", capital: "Brasilia", flag: "\u{1F1E7}\u{1F1F7}", continent: "South America", landmarks: ["Christ the Redeemer", "Amazon Rainforest"] },
  { name: "Argentina", capital: "Buenos Aires", flag: "\u{1F1E6}\u{1F1F7}", continent: "South America", landmarks: ["Iguazu Falls"] },
  { name: "Colombia", capital: "Bogota", flag: "\u{1F1E8}\u{1F1F4}", continent: "South America" },
  { name: "Peru", capital: "Lima", flag: "\u{1F1F5}\u{1F1EA}", continent: "South America", landmarks: ["Machu Picchu", "Nazca Lines"] },
  { name: "Chile", capital: "Santiago", flag: "\u{1F1E8}\u{1F1F1}", continent: "South America", landmarks: ["Easter Island"] },
  { name: "Venezuela", capital: "Caracas", flag: "\u{1F1FB}\u{1F1EA}", continent: "South America", landmarks: ["Angel Falls"] },
  { name: "Ecuador", capital: "Quito", flag: "\u{1F1EA}\u{1F1E8}", continent: "South America", landmarks: ["Galapagos Islands"] },
  { name: "Bolivia", capital: "Sucre", flag: "\u{1F1E7}\u{1F1F4}", continent: "South America", landmarks: ["Salar de Uyuni"] },
  { name: "Paraguay", capital: "Asuncion", flag: "\u{1F1F5}\u{1F1FE}", continent: "South America" },
  { name: "Uruguay", capital: "Montevideo", flag: "\u{1F1FA}\u{1F1FE}", continent: "South America" },
  { name: "Guyana", capital: "Georgetown", flag: "\u{1F1EC}\u{1F1FE}", continent: "South America" },
  { name: "Suriname", capital: "Paramaribo", flag: "\u{1F1F8}\u{1F1F7}", continent: "South America" },

  // ─── Oceania ──────────────────────────────────────────────────────────────────
  { name: "Australia", capital: "Canberra", flag: "\u{1F1E6}\u{1F1FA}", continent: "Oceania", landmarks: ["Sydney Opera House", "Great Barrier Reef"] },
  { name: "New Zealand", capital: "Wellington", flag: "\u{1F1F3}\u{1F1FF}", continent: "Oceania", landmarks: ["Milford Sound"] },
  { name: "Fiji", capital: "Suva", flag: "\u{1F1EB}\u{1F1EF}", continent: "Oceania" },
  { name: "Papua New Guinea", capital: "Port Moresby", flag: "\u{1F1F5}\u{1F1EC}", continent: "Oceania" },
  { name: "Samoa", capital: "Apia", flag: "\u{1F1FC}\u{1F1F8}", continent: "Oceania" },
  { name: "Tonga", capital: "Nukualofa", flag: "\u{1F1F9}\u{1F1F4}", continent: "Oceania" },
  { name: "Vanuatu", capital: "Port Vila", flag: "\u{1F1FB}\u{1F1FA}", continent: "Oceania" },
  { name: "Solomon Islands", capital: "Honiara", flag: "\u{1F1F8}\u{1F1E7}", continent: "Oceania" },
  { name: "Palau", capital: "Ngerulmud", flag: "\u{1F1F5}\u{1F1FC}", continent: "Oceania" },
  { name: "Micronesia", capital: "Palikir", flag: "\u{1F1EB}\u{1F1F2}", continent: "Oceania" },
];

/**
 * Returns a shuffled random selection of countries.
 */
export function getRandomCountries(count: number): Country[] {
  const shuffled = [...countries];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

/**
 * Returns all countries belonging to the specified continent.
 */
export function getCountriesByContinent(continent: Country["continent"]): Country[] {
  return countries.filter((c) => c.continent === continent);
}
