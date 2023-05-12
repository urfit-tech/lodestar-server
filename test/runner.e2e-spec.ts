import request from 'supertest';
import { Injectable, Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { Runner } from '~/runner/runner';
import { RunnerModule } from '~/runner/runner.module';
import { RunnerService } from '~/runner/runner.service';
import { DistributedLockService } from '~/utility/lock/distributed_lock.service';
import { ShutdownService } from '~/utility/shutdown/shutdown.service';

@Injectable()
class TestSuicideRunner extends Runner {
  constructor(
    protected readonly logger: Logger,
    protected readonly distributedLockService: DistributedLockService,
    protected readonly shutdownService: ShutdownService,
  ) {
    super(
      TestSuicideRunner.name,
      1000,
      logger,
      distributedLockService,
      shutdownService,
    );
  }

  async execute(): Promise<void> {
    await new Promise((resolve) => setTimeout(() => resolve(true), 1200));
  }
}

@Injectable()
class TestSuicideAtSecondCallRunner extends Runner {
  private count: number = 0;

  constructor(
    protected readonly logger: Logger,
    protected readonly distributedLockService: DistributedLockService,
    protected readonly shutdownService: ShutdownService,
  ) {
    super(
      TestSuicideAtSecondCallRunner.name,
      2000,
      logger,
      distributedLockService,
      shutdownService,
    );
  }

  async execute(): Promise<void> {
    this.count = await new Promise((resolve) => setTimeout(
      () => resolve(this.count + 1),
      this.count > 0 ? 2400 : 1000,
    ));
  }
}

@Injectable()
class TestNormalRunner extends Runner {
  constructor(
    protected readonly logger: Logger,
    protected readonly distributedLockService: DistributedLockService,
    protected readonly shutdownService: ShutdownService,
  ) {
    super(
      TestNormalRunner.name,
      1000,
      logger,
      distributedLockService,
      shutdownService,
    );
  }

  async execute(): Promise<void> {
    await new Promise((resolve) => setTimeout(() => resolve(true), 100));
  }
}

describe('Runner (e2e)', () => {
  describe('Runner Module', () => {
    it('Should suicide when runner running longer than expected interval', async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
          imports: [RunnerModule.forRoot({
            workerName: 'test-suicide-case-1', nodeEnv: 'Test', clazz: TestSuicideRunner,
          })],
        }).compile();
        let mockShutdown = jest.fn();

        const app = moduleFixture
          .createNestApplication()
          .enableShutdownHooks();
        
        app.get(ShutdownService).subscribeToShutdown(async () => {
          await app.close();
          mockShutdown();
        });
        await app.init();
        await new Promise((resolve) => setTimeout(() => resolve(true), 4000));
        
        expect(mockShutdown).toBeCalledTimes(1);
    });

    it('Should only one runner running in the time', async () => {
      const moduleFixture1: TestingModule = await Test.createTestingModule({
        imports: [RunnerModule.forRoot({
          workerName: 'test-normal-case-2', nodeEnv: 'Test', clazz: TestNormalRunner,
        })],
      }).compile();
      const moduleFixture2: TestingModule = await Test.createTestingModule({
        imports: [RunnerModule.forRoot({
          workerName: 'test-normal-case-2', nodeEnv: 'Test', clazz: TestNormalRunner,
        })],
      }).compile();
      
      const app1 = moduleFixture1
        .createNestApplication()
        .enableShutdownHooks();
      const app2 =moduleFixture2
        .createNestApplication()
        .enableShutdownHooks();

      app1.get(ShutdownService).subscribeToShutdown(async () => await app1.close());
      app2.get(ShutdownService).subscribeToShutdown(async () => await app2.close());
      await app1.init();
      // Interleaved initialization
      await new Promise((resolve) => setTimeout(() => resolve(true), 500));
      await app2.init();

      await new Promise((resolve) => setTimeout(() => resolve(true), 10000));
      const runner1 = app1.get(RunnerService).runner;
      const runner2 = app2.get(RunnerService).runner;
      expect(runner1.getPreviousExecutedTime()).not.toBeUndefined;
      expect(runner2.getPreviousExecutedTime()).toBeUndefined;
    });
  });

  describe('Runner Controller', () => {
    describe('/healthz (GET)', () => {
      const route = '/runner/healthz';

      it('Should get datetime with single runner when each execution success', async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
          imports: [RunnerModule.forRoot({
            workerName: 'test-normal-case-3', nodeEnv: 'Test', clazz: TestNormalRunner,
          })],
        }).compile();

        const app = moduleFixture
          .createNestApplication()
          .enableShutdownHooks();
        app.get(ShutdownService).subscribeToShutdown(async () => await app.close());
        await app.init();

        await new Promise((resolve) => setTimeout(() => resolve(true), 1200));
        
        const { text: result1 } = await request(app.getHttpServer())
          .get(route)
          .expect(200);
        expect(result1).not.toBeUndefined;

        await new Promise((resolve) => setTimeout(() => resolve(true), 1200));
        const { text: result2 } = await request(app.getHttpServer())
          .get(route)
          .expect(200);
        expect(result2).not.toBeUndefined;
        expect(new Date(result1).getTime()).toBeLessThan(new Date(result2).getTime());

        await app.close();
      });

      describe('Should get dateime with only one runner when it success', () => {
        async function test(timeout: number) {
          const moduleFixture1: TestingModule = await Test.createTestingModule({
            imports: [RunnerModule.forRoot({
              workerName: 'test-normal-case-4', nodeEnv: 'Test', clazz: TestNormalRunner,
            })],
          }).compile();
          const moduleFixture2: TestingModule = await Test.createTestingModule({
            imports: [RunnerModule.forRoot({
              workerName: 'test-normal-case-4', nodeEnv: 'Test', clazz: TestNormalRunner,
            })],
          }).compile();
  
          const app1 = moduleFixture1
            .createNestApplication()
            .enableShutdownHooks();
          const app2 = moduleFixture2
            .createNestApplication()
            .enableShutdownHooks();
          app1.get(ShutdownService).subscribeToShutdown(async () => await app1.close());
          app2.get(ShutdownService).subscribeToShutdown(async () => await app2.close());
          await app1.init();
          // Interleaved initialization
          await new Promise((resolve) => setTimeout(() => resolve(true), timeout));
          await app2.init();
  
          await new Promise((resolve) => setTimeout(() => resolve(true), 1000));
          
          const { text: result1 } = await request(app1.getHttpServer())
            .get(route)
            .expect(200);
          expect(result1).not.toBeUndefined;
          const { text: result2 } = await request(app2.getHttpServer())
            .get(route)
            .expect(200);
          expect(result1).not.toBeUndefined;
          expect(result2).toBe('not execute yet');
          
          await app1.close();
          await app2.close();
        }

        it('runner initialize at same time: 0', async () => await test(0));

        it('runner initialize at same time: 100', async () => await test(100));

        it('runner initialize at same time: 500', async () => await test(500));

        it('runner initialize at same time: 1000', async () => await test(1000));
      });

      it('Should get unhealthy return due to execution hang', async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
          imports: [RunnerModule.forRoot({
            workerName: 'test-suicide-second-call',
            nodeEnv: 'Test',
            clazz: TestSuicideAtSecondCallRunner,
          })],
        }).compile();
        let mockShutdown = jest.fn();

        const app = moduleFixture
          .createNestApplication()
          .enableShutdownHooks();
        
        app.get(ShutdownService).subscribeToShutdown(async () => {
          await app.close();
          mockShutdown();
        });
        await app.init();
        
        await request(app.getHttpServer()).get(route).expect(200);
        await new Promise((resolve) => setTimeout(() => resolve(true), 6000));
        await request(app.getHttpServer()).get(route).expect(500);
        await new Promise((resolve) => setTimeout(() => resolve(true), 1000));
        expect(mockShutdown).toBeCalledTimes(1);
      });
    });
  });
});
