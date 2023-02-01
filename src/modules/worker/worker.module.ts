import { Module } from '@nestjs/common'
import { RunnerModule } from '~/modules/runner/runner.module'
import { TaskerModule } from '~/modules/tasker/tasker.module'

@Module({ imports: [RunnerModule, TaskerModule] })
export class WorkerModule {}
