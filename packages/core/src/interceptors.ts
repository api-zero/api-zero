export class InterceptorManager<V> {
  private handlers: Array<{
    fulfilled?: (value: V) => V | Promise<V>;
    rejected?: (error: unknown) => any;
  } | null> = [];

  use(fulfilled?: (value: V) => V | Promise<V>, rejected?: (error: unknown) => any): number {
    this.handlers.push({ fulfilled, rejected });
    return this.handlers.length - 1;
  }

  eject(id: number): void {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  }

  clear(): void {
    this.handlers = [];
  }

  forEach(fn: (handler: { fulfilled?: (value: V) => V | Promise<V>; rejected?: (error: unknown) => any }) => void): void {
    this.handlers.forEach((h) => {
      if (h !== null) {
        fn(h);
      }
    });
  }
}
