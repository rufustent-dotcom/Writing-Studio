export interface Template {
  id: string;
  title: string;
  category: string;
  content: string;
  description: string;
}

export const WRITING_TEMPLATES: Template[] = [
  {
    id: "science-blog",
    title: "Quantum Landscapes & The Cosmic Loom",
    category: "Science & Philosophy",
    description: "A descriptive philosophical essay that needs polishing to feel more poetic and engaging.",
    content: `For decades, researchers have been looking into the nature of quantum space. Standard theory says that it is a void, empty of matter. However, recent evidence is suggesting that space is actually quite interactive. It acts more like a busy fabric that weaves particles together.

At the smallest levels, things do not behave in normal ways. They exist as probability waves until we measure them. We might say that the universe is shy. It refuses to reveal its true properties to spectators that are passive. 

This leads us to a profound realization. Science is not just about measuring things out there in the cold database of space. Instead, observers are actively designing the metrics they record. The canvas and the brush are connected.`
  },
  {
    id: "marketing-story",
    title: "The Silent Shift: Why Quiet Software Wins",
    category: "Product & Business",
    description: "A tech-focused business narrative with some corporate passive voice that could benefit from punchier framing.",
    content: `The modern tech workspace is filled with noise. Notification badges scream at you constantly. Bells ring whenever a sale is made. Slack channels chime every minute. Product managers have always believed that more noise equals more engagement.

But a silent shift is happening. Users are getting tired of the constant interruptions. The softwares that are quiet are starting to win. They don't beg for your attention. Instead, they wait patiently in the background, only surfacing when they are genuinely required.

This is the philosophy of respectful design. Software should be a tool that serves the mind, not a machine that colonizes focus. We need tools that respect our cognitive silence.`
  },
  {
    id: "creative-story",
    title: "The Watchmaker of Lucerne",
    category: "Fiction & Creative",
    description: "A whimsical narrative draft that is slightly repetitive and would feel spectacular with deeper sensory metaphors.",
    content: `The clock shop was tucked between two stone buildings. In the window, hundreds of clocks were ticking loudly. Old Nicholas sat at his wooden desk, wearing a small glass lens over his left eye. He had spent his whole life working with gears and springs.

He loved Swiss watches. Every watch had a tiny heart that beat in perfect rhythm. But today, a stranger came in with an unusual request. The stranger had a beautiful silver watch that did not keep time. Instead, it ran backwards, tracking hours that had already passed.

Nicholas looked at the gears. They were made of a strange blue metal. When he touched the crown, he felt a cold chill. He realized this watch was not measuring seconds. It was remembering regrets.`
  }
];
