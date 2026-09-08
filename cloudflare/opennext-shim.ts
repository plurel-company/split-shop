/** The integrated handler receives its bindings directly from its parent Worker. */
export async function getCloudflareContext(): Promise<never> {
  throw new Error("Use the main Worker's demo handler to provide bindings.");
}
