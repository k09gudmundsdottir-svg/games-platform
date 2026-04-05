export type TriviaCategory =
  | "Geography"
  | "History"
  | "Science"
  | "Sports"
  | "Entertainment"
  | "General";

export interface TriviaQuestion {
  id: number;
  category: TriviaCategory;
  question: string;
  answers: string[];
  correctIndex: number;
}

const allQuestions: TriviaQuestion[] = [
  // Geography
  { id: 1, category: "Geography", question: "What is the capital of Australia?", answers: ["Sydney", "Melbourne", "Canberra", "Brisbane"], correctIndex: 2 },
  { id: 2, category: "Geography", question: "Which river is the longest in the world?", answers: ["Amazon", "Nile", "Yangtze", "Mississippi"], correctIndex: 1 },
  { id: 3, category: "Geography", question: "In which country is Mount Kilimanjaro located?", answers: ["Kenya", "Tanzania", "Uganda", "Ethiopia"], correctIndex: 1 },
  { id: 4, category: "Geography", question: "What is the smallest country in the world by area?", answers: ["Monaco", "San Marino", "Vatican City", "Liechtenstein"], correctIndex: 2 },
  { id: 5, category: "Geography", question: "Which desert is the largest hot desert on Earth?", answers: ["Gobi", "Kalahari", "Sahara", "Arabian"], correctIndex: 2 },
  { id: 6, category: "Geography", question: "What is the deepest ocean on Earth?", answers: ["Atlantic", "Indian", "Arctic", "Pacific"], correctIndex: 3 },
  { id: 7, category: "Geography", question: "Which country has the most time zones?", answers: ["Russia", "USA", "France", "China"], correctIndex: 2 },
  { id: 8, category: "Geography", question: "What is the capital of Mongolia?", answers: ["Astana", "Ulaanbaatar", "Bishkek", "Tashkent"], correctIndex: 1 },
  { id: 9, category: "Geography", question: "Which African country was formerly known as Abyssinia?", answers: ["Somalia", "Eritrea", "Ethiopia", "Sudan"], correctIndex: 2 },
  { id: 10, category: "Geography", question: "What strait separates Europe from Africa?", answers: ["Bosphorus", "Hormuz", "Malacca", "Gibraltar"], correctIndex: 3 },
  { id: 11, category: "Geography", question: "Which is the largest island in the Mediterranean Sea?", answers: ["Sardinia", "Corsica", "Sicily", "Crete"], correctIndex: 2 },
  { id: 12, category: "Geography", question: "In which country would you find the Atacama Desert?", answers: ["Peru", "Argentina", "Chile", "Bolivia"], correctIndex: 2 },
  { id: 13, category: "Geography", question: "What is the capital of New Zealand?", answers: ["Auckland", "Christchurch", "Wellington", "Hamilton"], correctIndex: 2 },
  { id: 14, category: "Geography", question: "Which sea is the saltiest in the world?", answers: ["Dead Sea", "Red Sea", "Caspian Sea", "Black Sea"], correctIndex: 0 },
  { id: 15, category: "Geography", question: "What is the longest mountain range in the world?", answers: ["Himalayas", "Rocky Mountains", "Andes", "Alps"], correctIndex: 2 },

  // History
  { id: 16, category: "History", question: "In what year did the Berlin Wall fall?", answers: ["1987", "1989", "1991", "1990"], correctIndex: 1 },
  { id: 17, category: "History", question: "Who was the first Emperor of Rome?", answers: ["Julius Caesar", "Nero", "Augustus", "Caligula"], correctIndex: 2 },
  { id: 18, category: "History", question: "Which war was fought between 1914 and 1918?", answers: ["World War II", "Korean War", "World War I", "Crimean War"], correctIndex: 2 },
  { id: 19, category: "History", question: "What ancient civilization built Machu Picchu?", answers: ["Aztec", "Maya", "Inca", "Olmec"], correctIndex: 2 },
  { id: 20, category: "History", question: "Who wrote the Communist Manifesto?", answers: ["Lenin", "Marx & Engels", "Stalin", "Trotsky"], correctIndex: 1 },
  { id: 21, category: "History", question: "In which year did the Titanic sink?", answers: ["1910", "1911", "1912", "1913"], correctIndex: 2 },
  { id: 22, category: "History", question: "Who was the first person to walk on the Moon?", answers: ["Buzz Aldrin", "Neil Armstrong", "Yuri Gagarin", "John Glenn"], correctIndex: 1 },
  { id: 23, category: "History", question: "What year did the French Revolution begin?", answers: ["1776", "1789", "1799", "1804"], correctIndex: 1 },
  { id: 24, category: "History", question: "Which empire was ruled by Genghis Khan?", answers: ["Ottoman", "Persian", "Mongol", "Byzantine"], correctIndex: 2 },
  { id: 25, category: "History", question: "Who painted the ceiling of the Sistine Chapel?", answers: ["Leonardo da Vinci", "Raphael", "Michelangelo", "Donatello"], correctIndex: 2 },
  { id: 26, category: "History", question: "What was the Manhattan Project?", answers: ["Bridge construction", "Nuclear weapons development", "Space program", "Urban planning"], correctIndex: 1 },
  { id: 27, category: "History", question: "Which ancient wonder was located in Alexandria?", answers: ["Colossus", "Hanging Gardens", "Lighthouse", "Mausoleum"], correctIndex: 2 },
  { id: 28, category: "History", question: "Who led India's independence movement through nonviolence?", answers: ["Nehru", "Bose", "Gandhi", "Patel"], correctIndex: 2 },
  { id: 29, category: "History", question: "What year did the United States declare independence?", answers: ["1774", "1775", "1776", "1777"], correctIndex: 2 },
  { id: 30, category: "History", question: "Which civilization invented writing around 3400 BCE?", answers: ["Egyptian", "Sumerian", "Chinese", "Indus Valley"], correctIndex: 1 },

  // Science
  { id: 31, category: "Science", question: "What is the chemical symbol for gold?", answers: ["Go", "Gd", "Au", "Ag"], correctIndex: 2 },
  { id: 32, category: "Science", question: "How many bones are in the adult human body?", answers: ["186", "206", "226", "256"], correctIndex: 1 },
  { id: 33, category: "Science", question: "What planet is known as the Red Planet?", answers: ["Venus", "Jupiter", "Mars", "Saturn"], correctIndex: 2 },
  { id: 34, category: "Science", question: "What is the speed of light in vacuum (approx)?", answers: ["300,000 km/s", "150,000 km/s", "500,000 km/s", "100,000 km/s"], correctIndex: 0 },
  { id: 35, category: "Science", question: "What gas do plants absorb from the atmosphere?", answers: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"], correctIndex: 2 },
  { id: 36, category: "Science", question: "What is the hardest natural substance on Earth?", answers: ["Quartz", "Topaz", "Diamond", "Corundum"], correctIndex: 2 },
  { id: 37, category: "Science", question: "What is the powerhouse of the cell?", answers: ["Nucleus", "Ribosome", "Mitochondria", "Golgi apparatus"], correctIndex: 2 },
  { id: 38, category: "Science", question: "Which element has the atomic number 1?", answers: ["Helium", "Hydrogen", "Lithium", "Carbon"], correctIndex: 1 },
  { id: 39, category: "Science", question: "What force keeps planets in orbit around the Sun?", answers: ["Electromagnetic", "Strong nuclear", "Gravity", "Centrifugal"], correctIndex: 2 },
  { id: 40, category: "Science", question: "What is the most abundant gas in Earth's atmosphere?", answers: ["Oxygen", "Carbon Dioxide", "Argon", "Nitrogen"], correctIndex: 3 },
  { id: 41, category: "Science", question: "How many chromosomes do humans have?", answers: ["23", "44", "46", "48"], correctIndex: 2 },
  { id: 42, category: "Science", question: "What type of animal is a dolphin?", answers: ["Fish", "Reptile", "Mammal", "Amphibian"], correctIndex: 2 },
  { id: 43, category: "Science", question: "What does DNA stand for?", answers: ["Deoxyribonucleic Acid", "Dinucleic Acid", "Diribonucleic Acid", "Deoxyribonitric Acid"], correctIndex: 0 },
  { id: 44, category: "Science", question: "What is the largest organ in the human body?", answers: ["Liver", "Brain", "Skin", "Lungs"], correctIndex: 2 },
  { id: 45, category: "Science", question: "Which planet has the most moons?", answers: ["Jupiter", "Saturn", "Uranus", "Neptune"], correctIndex: 1 },

  // Sports
  { id: 46, category: "Sports", question: "How many players are on a soccer team on the field?", answers: ["9", "10", "11", "12"], correctIndex: 2 },
  { id: 47, category: "Sports", question: "In which sport would you perform a slam dunk?", answers: ["Volleyball", "Tennis", "Basketball", "Handball"], correctIndex: 2 },
  { id: 48, category: "Sports", question: "What country won the first FIFA World Cup in 1930?", answers: ["Brazil", "Argentina", "Uruguay", "Italy"], correctIndex: 2 },
  { id: 49, category: "Sports", question: "How many Grand Slam tennis tournaments are there per year?", answers: ["3", "4", "5", "6"], correctIndex: 1 },
  { id: 50, category: "Sports", question: "In which sport is the term 'birdie' used?", answers: ["Tennis", "Golf", "Badminton", "Cricket"], correctIndex: 1 },
  { id: 51, category: "Sports", question: "How long is an Olympic swimming pool in meters?", answers: ["25", "50", "75", "100"], correctIndex: 1 },
  { id: 52, category: "Sports", question: "Which country has won the most Olympic gold medals all time?", answers: ["China", "Russia", "USA", "Great Britain"], correctIndex: 2 },
  { id: 53, category: "Sports", question: "What is the maximum score in a single frame of bowling?", answers: ["10", "20", "30", "50"], correctIndex: 2 },
  { id: 54, category: "Sports", question: "In baseball, how many strikes make an out?", answers: ["2", "3", "4", "5"], correctIndex: 1 },
  { id: 55, category: "Sports", question: "Which martial art originated in Japan and means 'gentle way'?", answers: ["Karate", "Judo", "Taekwondo", "Kung Fu"], correctIndex: 1 },
  { id: 56, category: "Sports", question: "How many periods are in an ice hockey game?", answers: ["2", "3", "4", "5"], correctIndex: 1 },
  { id: 57, category: "Sports", question: "What sport uses a shuttlecock?", answers: ["Tennis", "Squash", "Badminton", "Table Tennis"], correctIndex: 2 },
  { id: 58, category: "Sports", question: "In which year were the first modern Olympic Games held?", answers: ["1892", "1896", "1900", "1904"], correctIndex: 1 },
  { id: 59, category: "Sports", question: "What is the diameter of a basketball hoop in inches?", answers: ["16", "18", "20", "22"], correctIndex: 1 },
  { id: 60, category: "Sports", question: "Which Formula 1 driver has the most World Championships?", answers: ["Ayrton Senna", "Michael Schumacher", "Lewis Hamilton", "Max Verstappen"], correctIndex: 2 },

  // Entertainment
  { id: 61, category: "Entertainment", question: "Who directed the movie 'Inception'?", answers: ["Steven Spielberg", "Christopher Nolan", "James Cameron", "Ridley Scott"], correctIndex: 1 },
  { id: 62, category: "Entertainment", question: "What band performed 'Bohemian Rhapsody'?", answers: ["The Beatles", "Led Zeppelin", "Queen", "Pink Floyd"], correctIndex: 2 },
  { id: 63, category: "Entertainment", question: "In which fictional city does Batman operate?", answers: ["Metropolis", "Star City", "Gotham City", "Central City"], correctIndex: 2 },
  { id: 64, category: "Entertainment", question: "What is the highest-grossing film of all time (adjusted)?", answers: ["Avatar", "Titanic", "Star Wars", "Gone with the Wind"], correctIndex: 3 },
  { id: 65, category: "Entertainment", question: "Who wrote the Harry Potter book series?", answers: ["J.R.R. Tolkien", "J.K. Rowling", "C.S. Lewis", "Roald Dahl"], correctIndex: 1 },
  { id: 66, category: "Entertainment", question: "What instrument does a pianist play?", answers: ["Organ", "Harpsichord", "Piano", "Synthesizer"], correctIndex: 2 },
  { id: 67, category: "Entertainment", question: "Which TV show features dragons and the Iron Throne?", answers: ["The Witcher", "Lord of the Rings", "Game of Thrones", "Vikings"], correctIndex: 2 },
  { id: 68, category: "Entertainment", question: "Who painted the Mona Lisa?", answers: ["Michelangelo", "Raphael", "Leonardo da Vinci", "Botticelli"], correctIndex: 2 },
  { id: 69, category: "Entertainment", question: "What video game franchise features Mario?", answers: ["Sonic", "Zelda", "Super Mario", "Donkey Kong"], correctIndex: 2 },
  { id: 70, category: "Entertainment", question: "Which artist released the album 'Thriller'?", answers: ["Prince", "Michael Jackson", "Stevie Wonder", "Whitney Houston"], correctIndex: 1 },
  { id: 71, category: "Entertainment", question: "In the movie 'The Matrix', what color pill does Neo take?", answers: ["Blue", "Green", "Red", "White"], correctIndex: 2 },
  { id: 72, category: "Entertainment", question: "What animated film features a clownfish named Nemo?", answers: ["Shark Tale", "Finding Nemo", "The Little Mermaid", "Moana"], correctIndex: 1 },
  { id: 73, category: "Entertainment", question: "Which Shakespeare play features the character Hamlet?", answers: ["Macbeth", "Othello", "Hamlet", "King Lear"], correctIndex: 2 },
  { id: 74, category: "Entertainment", question: "What is the name of the hobbit played by Elijah Wood?", answers: ["Sam", "Pippin", "Merry", "Frodo"], correctIndex: 3 },
  { id: 75, category: "Entertainment", question: "Which streaming service produced 'Stranger Things'?", answers: ["Hulu", "Amazon Prime", "Disney+", "Netflix"], correctIndex: 3 },

  // General
  { id: 76, category: "General", question: "How many continents are there on Earth?", answers: ["5", "6", "7", "8"], correctIndex: 2 },
  { id: 77, category: "General", question: "What is the currency of Japan?", answers: ["Yuan", "Won", "Yen", "Baht"], correctIndex: 2 },
  { id: 78, category: "General", question: "What is the tallest building in the world (2024)?", answers: ["Shanghai Tower", "Burj Khalifa", "One World Trade", "Taipei 101"], correctIndex: 1 },
  { id: 79, category: "General", question: "How many colors are in a rainbow?", answers: ["5", "6", "7", "8"], correctIndex: 2 },
  { id: 80, category: "General", question: "What language has the most native speakers worldwide?", answers: ["English", "Hindi", "Spanish", "Mandarin Chinese"], correctIndex: 3 },
  { id: 81, category: "General", question: "What is the largest mammal on Earth?", answers: ["African Elephant", "Blue Whale", "Giraffe", "Whale Shark"], correctIndex: 1 },
  { id: 82, category: "General", question: "How many days are in a leap year?", answers: ["364", "365", "366", "367"], correctIndex: 2 },
  { id: 83, category: "General", question: "What is the main ingredient in guacamole?", answers: ["Tomato", "Avocado", "Lime", "Cilantro"], correctIndex: 1 },
  { id: 84, category: "General", question: "Which company created the iPhone?", answers: ["Samsung", "Google", "Microsoft", "Apple"], correctIndex: 3 },
  { id: 85, category: "General", question: "What is the boiling point of water at sea level in Celsius?", answers: ["90", "95", "100", "105"], correctIndex: 2 },
  { id: 86, category: "General", question: "How many letters are in the English alphabet?", answers: ["24", "25", "26", "27"], correctIndex: 2 },
  { id: 87, category: "General", question: "What is the largest ocean on Earth?", answers: ["Atlantic", "Indian", "Arctic", "Pacific"], correctIndex: 3 },
  { id: 88, category: "General", question: "Which blood type is known as the universal donor?", answers: ["A+", "B+", "AB+", "O-"], correctIndex: 3 },
  { id: 89, category: "General", question: "What is a group of wolves called?", answers: ["Herd", "Flock", "Pack", "Pride"], correctIndex: 2 },
  { id: 90, category: "General", question: "What does 'www' stand for in a website URL?", answers: ["World Wide Web", "Western Web Works", "Wide World Web", "Web World Wide"], correctIndex: 0 },
];

/** Shuffle array in-place (Fisher-Yates) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Returns a shuffled set of trivia questions.
 * @param count Number of questions to return (default 15)
 * @param category Filter by category, or "All" for mixed
 */
export function getQuestions(
  count = 15,
  category: TriviaCategory | "All" = "All"
): TriviaQuestion[] {
  const pool =
    category === "All"
      ? allQuestions
      : allQuestions.filter((q) => q.category === category);
  return shuffle(pool).slice(0, Math.min(count, pool.length));
}
