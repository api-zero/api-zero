export interface InterceptorHandler<V, E = unknown> {
  fulfilled?: (value: V) => V | Promise<V> | any;
  rejected?: (error: E) => any;
}

export class InterceptorManager<V, E = unknown> {
  private handlers: Array<InterceptorHandler<V, E> | null> = [];

  use(
    fulfilled?: (value: V) => V | Promise<V> | any,
    rejected?: (error: E) => any,
  ): number {
    this.handlers.push({ fulfilled, rejected });
    return this.handlers.length - 1;
  }

  eject(id: number): void {
    if (id >= 0 && id < this.handlers.length) {
      this.handlers[id] = null;
    }
  }

  clear(): void {
    this.handlers = [];
  }

  get activeHandlers(): Array<InterceptorHandler<V, E>> {
    return this.handlers.filter(
      (h): h is InterceptorHandler<V, E> => h !== null,
    );
  }

  forEach(fn: (handler: InterceptorHandler<V, E>) => void): void {
    this.handlers.forEach((h) => {
      if (h !== null) {
        fn(h);
      }
    });
  }
}
