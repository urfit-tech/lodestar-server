import { v4 } from 'uuid';

export abstract class Runner {
  public readonly uuid: string;
  protected readonly name: string;
  protected isCompleted: boolean;
  protected readonly interval: number;

  constructor(name: string, interval: number) {
    this.uuid = v4();
    this.name = name;
    this.isCompleted = true;
    this.interval = interval;
  }

  abstract execute(): Promise<void>;

  async run(): Promise<void> {
    if (this.isCompleted === false) {
      console.error('Previous execution is not completed yet');
      return;
    }
    
    try {
      this.isCompleted = false;
      await this.execute();
    } catch (err) {
      console.error(err);
    } finally {
      this.isCompleted = true;
    }
  }

  getName(): string {
    return this.name;
  }

  getInterval(): number {
    return this.interval;
  }

  isExecutable(): boolean {
    return this.isCompleted;
  }
}
