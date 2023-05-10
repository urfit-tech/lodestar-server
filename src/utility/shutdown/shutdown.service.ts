import { Subject } from 'rxjs';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ShutdownService {
  private shutdownListener$: Subject<void> = new Subject();

  subscribeToShutdown(shutdownFn: () => void): void {
    this.shutdownListener$.subscribe(() => shutdownFn());
  }

  shutdown() {
    this.shutdownListener$.next();
  }
}