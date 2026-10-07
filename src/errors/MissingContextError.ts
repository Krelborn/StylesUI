/**
 * Thrown when a part of a compound component renders outside the component that provides its state
 */
export class MissingContextError extends Error {
  public override readonly name = "MissingContextError";

  /**
   * @param part the part that rendered, such as `Tab`
   * @param provider the component it must render inside, such as `Tabs`
   */
  public constructor(part: string, provider: string) {
    super(`${part} must be rendered inside ${provider}`);
  }
}
