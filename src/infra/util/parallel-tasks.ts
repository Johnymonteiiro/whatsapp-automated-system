export async function parallelTasks<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number,
): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<T>[] = [];

  for (const task of tasks) {
    const promise = task();
    results.push(promise as unknown as T);
    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      executing.splice(
        executing.findIndex((p) => p === promise),
        1,
      );
    }
  }

  return Promise.all(results);
}
