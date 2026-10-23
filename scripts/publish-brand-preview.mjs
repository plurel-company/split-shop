import { rename, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";

/** Swap completed artifacts without deleting the previous bundle before the swap succeeds. */
export async function publishPreview(staged, output, move = rename) {
  const backup = `${output}.previous-${randomUUID()}`;
  let previous = false;
  try {
    await move(output, backup);
    previous = true;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  try {
    await move(staged, output);
  } catch (error) {
    if (previous) await move(backup, output);
    throw error;
  }
  if (previous) {
    await rm(backup, { recursive: true, force: true }).catch(() => {
      console.warn(`Preview ready. Previous generated bundle retained at ${backup}.`);
    });
  }
}
