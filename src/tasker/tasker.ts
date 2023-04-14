// import { InjectQueue } from '@nestjs/bull';
// import { Inject, Injectable } from '@nestjs/common';
import { ProcessCallbackFunction, Queue } from 'bull';

export enum TaskerType {
  EXAMPLE_TASKER = 'EXAMPLE_TASKER',
};

export abstract class Tasker {
  abstract queue: Queue;
  abstract process: ProcessCallbackFunction<any>

  async execute(): Promise<void> {
    this.queue.process(this.process);
  }
}
