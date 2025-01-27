import { UseCase } from "./interface";

export const USE_CASES: UseCase[] = [
  {
    name: "General Conversation",
    value: "general",
    temperature: 1.3,
    description: "Balanced responses for everyday conversation"
  },
  {
    name: "Coding & Math",
    value: "coding",
    temperature: 0.0,
    description: "Precise, deterministic responses for technical tasks"
  },
  {
    name: "Data Analysis",
    value: "data",
    temperature: 1.0,
    description: "Balanced analysis for data processing tasks"
  },
  {
    name: "Translation",
    value: "translation",
    temperature: 1.3,
    description: "Natural language translation tasks"
  },
  {
    name: "Creative Writing",
    value: "creative",
    temperature: 1.5,
    description: "More creative and varied responses"
  }
];