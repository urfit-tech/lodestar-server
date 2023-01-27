import { Module } from '@nestjs/common'
import { RunnerModule } from '~/runner/runner.module'
import { TaskerModule } from '~/tasker/tasker.module'

@Module({ imports: [RunnerModule, TaskerModule] })
export class WorkerModule {}
