
interface CardData {
  id: number;
  title: string;
  subtitle: string;
  color: string;
}

export const CARDS_DATA: CardData[] = [
  {
    id: 1,
    title: "Ultra-fast speed",
    subtitle: "Evaluates scores faster than any platform in the market",
    color: "#D9F99D", // Lime-200
  },
  {
    id: 2,
    title: "Secure by design",
    subtitle: "Users can't cheat — all test files are securely stored on the server and cannot be accessed or manipulated",
    color: "#A5B4FC", // Indigo-300
  },
  {
    id: 3,
    title: "Built for creators and students",
    subtitle: "From testing to creating challenges, everything is smooth and seamless",
    color: "#ffedd5",
  },
  {
    id: 4,
    title: "Scales with your ambition",
    subtitle: "Designed to grow from small classrooms to large developer communities",
    color: "#9cc5ff", // Orange-100
  }
];
