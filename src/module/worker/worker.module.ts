import { Module } from '@nestjs/common'
import { RunnerModule } from '~/module/runner/runner.module'
import { TaskerModule } from '~/module/tasker/tasker.module'

@Module({ imports: [RunnerModule, TaskerModule] })
export class WorkerModule {}
