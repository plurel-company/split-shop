import type { CartState } from "./types";
export const DEMO_SCENARIOS: Array<{ id: string; title: string; detail: string; cart: CartState; people: number }> = [
  { id: "weekend", title: "A weekend away", detail: "One suite. Four friends.", cart: { "deluxe-suite": 2 }, people: 4 },
  { id: "night", title: "A night out", detail: "Four tickets. One plan.", cart: { "concert-tickets": 1 }, people: 4 },
  { id: "gift", title: "The group gift", detail: "Something they’ll use every day.", cart: { "espresso-machine": 1 }, people: 5 },
];
/** Currency minor units stay whole; any remainder is distributed one unit at a time. */
export function splitPreview(total: number, people: number): number[] {
  if (!Number.isSafeInteger(total) || total < 0 || !Number.isInteger(people) || people < 2 || people > 6) throw new Error("Invalid split");
  const floor = Math.floor(total / people);
  return Array.from({ length: people }, (_, index) => floor + (index < total % people ? 1 : 0));
}
