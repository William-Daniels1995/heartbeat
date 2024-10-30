/**
 * Pauses execution for a specified number of milliseconds
 * @param {number} ms - The time to wait in milliseconds
 * @returns {Promise<void>} A promise that resolves after the specified delay
 */
export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))