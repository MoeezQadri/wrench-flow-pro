
/**
 * Utility to safely use async data in a component
 * @param promise The promise to await
 * @param defaultValue Default value to use if promise fails
 * @returns Resolved value or default value
 */
export async function safeAwait<T>(promise: Promise<T | null>, defaultValue: T): Promise<T> {
  try {
    const result = await promise;
    return result !== null ? result : defaultValue;
  } catch (error) {
    console.error('Error in safeAwait:', error);
    return defaultValue;
  }
}

/**
 * Helper to convert a async function into one that returns the result or a default value
 * For use with useEffect where we need to handle promises
 */
export function withDefault<T>(asyncFn: () => Promise<T | null>, defaultValue: T) {
  return async () => {
    try {
      const result = await asyncFn();
      return result !== null ? result : defaultValue;
    } catch (error) {
      console.error('Error in withDefault:', error);
      return defaultValue;
    }
  };
}

/**
 * Utility to safely resolve a promise before using as state
 * This is useful when setting state with data from promises
 * @param promise The promise to await
 * @param setter The state setter function
 */
export async function resolvePromiseAndSetState<T>(
  promise: Promise<T>,
  setter: (value: T) => void
): Promise<void> {
  try {
    const result = await promise;
    setter(result);
  } catch (error) {
    console.error('Error resolving promise for state:', error);
  }
}
