import { EntityManager, In } from 'typeorm';

import { App } from '~/app/entity/app.entity';
import { MemberInfrastructure } from '~/member/member.infra';
import { Member } from '~/member/entity/member.entity';
import { MemberNote } from '~/entity/MemberNote';
import { MemberPhone } from '~/member/entity/member_phone.entity';
import { MemberProperty } from '~/member/entity/member_property.entity';

import { PorterCommand } from './porterCommandInterface';
import { CacheService } from '~/utility/cache/cache.service';
import { Queue } from 'bull';
import { MailJob } from '~/tasker/mailer.tasker';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import {
  CalledType,
  CalledDisposition,
  CalledData,
  RawEventData,
  ErrorLogType,
  ProcessedEventData,
} from './portPhoneServiceInsertEventCommand.types';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

class PortPhoneServiceInsertEventCommand implements PorterCommand {
  constructor(
    private readonly memberInfra: MemberInfrastructure,
    private readonly cacheService: CacheService,
    private readonly mailerQueue?: Queue,
  ) {}

  private async sendMail(appId: string, to: string[], subject: string, content: string): Promise<void> {
    if (!this.mailerQueue) {
      console.warn('[PortPhoneServiceInsertEventCommand] Mailer queue not available, skipping email notification');
      return;
    }

    const mailJob: MailJob = {
      appId,
      subject,
      to,
      cc: [],
      bcc: [],
      content,
    };

    try {
      await this.mailerQueue.add(mailJob, { removeOnComplete: true, removeOnFail: true });
      console.log(
        `[PortPhoneServiceInsertEventCommand] Email queued successfully. Subject: ${subject}, To: ${to.join(', ')}`,
      );
    } catch (error) {
      console.error(`[PortPhoneServiceInsertEventCommand] Failed to queue email: ${error}`);
    }
  }

  private mapCalledDisposition(disposition: CalledDisposition): string | null {
    switch (disposition) {
      case CalledDisposition.NO_ANSWER:
        return 'missed';
      case CalledDisposition.ANSWERED:
        return 'answered';
      default:
        return null;
    }
  }

  private mapCalledType(type: CalledType): string | null {
    switch (type) {
      case CalledType.INCOMING:
        return 'inbound';
      case CalledType.OUTGOING:
        return 'outbound';
      default:
        return null;
    }
  }

  private async findCorrectDestination(
    appId: string,
    sourcePhone: string,
    manager: EntityManager,
  ): Promise<string | null> {
    try {
      const members = await this.getMemberByPhone(appId, sourcePhone, manager);
      if (!members || members.length === 0) {
        console.log(`No members found for phone: ${sourcePhone}`);
        return null;
      }

      for (const memberInfo of members) {
        const member = await manager.findOne(Member, {
          where: { id: memberInfo.id, appId },
          select: ['id', 'managerId'],
        });

        if (member?.managerId) {
          const memberProperty = await manager.findOne(MemberProperty, {
            where: {
              memberId: member.managerId,
              property: { name: '分機號碼' },
              member: { appId },
            },
            relations: { property: true },
          });

          if (memberProperty?.value) {
            console.log(
              `Found extension ${memberProperty.value} for manager ${member.managerId} of member ${member.id}`,
            );
            return memberProperty.value;
          }
        }
      }

      console.log(`Could not find a manager with extension for members with phone ${sourcePhone}`);
      return null;
    } catch (error) {
      console.error(`Error in findCorrectDestination: ${error}`);
      return null;
    }
  }

  private async getSalesByExtensionNumber(
    appId: string,
    extensionNumber: string,
    manager: EntityManager,
  ): Promise<{ id: string; email: string } | null> {
    console.log(`[getSalesByExtensionNumber] Searching for extension: ${extensionNumber}, appId: ${appId}`);

    const memberProperty = await manager.findOne(MemberProperty, {
      where: { value: extensionNumber, property: { name: '分機號碼' }, member: { appId } },
      relations: { member: true, property: true },
    });

    if (!memberProperty) {
      console.log(`[getSalesByExtensionNumber] NOT FOUND - extension: ${extensionNumber}, appId: ${appId}`);

      const allMatchingExtensions = await manager.find(MemberProperty, {
        where: { value: extensionNumber, property: { name: '分機號碼' } },
        relations: { member: true, property: true },
        take: 5,
      });

      if (allMatchingExtensions.length > 0) {
        console.log(
          `[getSalesByExtensionNumber] DEBUG - Found ${allMatchingExtensions.length} extensions with value '${extensionNumber}' in other apps:`,
        );
        allMatchingExtensions.forEach(mp => {
          console.log(
            `  - Member: ${mp.member?.name || 'unknown'}, App: ${mp.member?.appId || 'unknown'}, Property App: ${
              mp.property?.appId || 'unknown'
            }`,
          );
        });
      } else {
        console.log(`[getSalesByExtensionNumber] DEBUG - No extension '${extensionNumber}' found in ANY app`);
      }

      return null;
    }

    console.log(
      `[getSalesByExtensionNumber] FOUND - Member: ${memberProperty.member.name}, Email: ${memberProperty.member.email}`,
    );

    return {
      id: memberProperty.memberId || '',
      email: memberProperty.member.email || '',
    };
  }

  private async getMemberByPhone(
    appId: string,
    phone: string,
    manager: EntityManager,
  ): Promise<Array<{ id: string; email: string }>> {
    const memberPhone = await manager.find(MemberPhone, {
      where: { member: { appId }, phone },
      relations: { member: true },
    });

    return memberPhone.map(phone => ({
      id: phone.memberId,
      email: phone.member.email,
    }));
  }

  private async getCallers(
    appId: string,
    callData: CalledData,
    manager: EntityManager,
  ): Promise<Array<{ id: string; email: string }>> {
    const { calltype, source } = callData;
    switch (calltype) {
      case CalledType.INCOMING:
        const member = await this.getMemberByPhone(appId, source, manager);
        return member.map(v => ({ id: v.id, email: v.email }));
      case CalledType.OUTGOING:
        const sales = await this.getSalesByExtensionNumber(appId, source, manager);
        if (!sales) {
          return [];
        }
        return [{ id: sales.id, email: sales.email }];
      default:
        throw new Error('Unknown CalledType');
    }
  }

  private async getMemberIdsByCallerIdsAndDestination(
    appId: string,
    extensionNumber: string,
    callerIds: string[],
    manager: EntityManager,
  ): Promise<string[] | undefined> {
    const sale = await this.getSalesByExtensionNumber(appId, extensionNumber, manager);
    if (!sale) return;

    const member = await manager.find(Member, {
      select: { id: true },
      where: {
        id: In(callerIds),
        managerId: sale.id,
      },
    });

    const memberIds = member.map(m => m.id);
    console.log(
      `GetMemberIdsByCallerIdsAndDestination callbacked by extensionNumber: ${extensionNumber} find sale ${
        sale.id
      }, callerIds:${callerIds} find member ids: ${JSON.stringify(memberIds)}`,
    );

    return memberIds;
  }

  private async batchProcessEvents(
    processedEvents: ProcessedEventData[],
    appId: string,
    manager: EntityManager,
  ): Promise<void> {
    const allMemberNotes: MemberNote[] = [];
    const allMemberUpdates = new Map<string, any>();
    const allCallbackUpdates = new Map<string, Date>();

    for (const event of processedEvents) {
      allMemberNotes.push(...event.memberNotes);

      for (const [memberId, updates] of event.memberUpdates.entries()) {
        const existing = allMemberUpdates.get(memberId);
        if (existing) {
          allMemberUpdates.set(memberId, {
            lastMemberNoteCreated: updates.lastMemberNoteCreated || existing.lastMemberNoteCreated,
            lastMemberNoteCalled: updates.lastMemberNoteCalled || existing.lastMemberNoteCalled,
            lastMemberNoteAnswered: updates.lastMemberNoteAnswered || existing.lastMemberNoteAnswered,
          });
        } else {
          allMemberUpdates.set(memberId, updates);
        }
      }

      for (const [memberId, callbackTime] of event.callbackUpdates.entries()) {
        const existing = allCallbackUpdates.get(memberId);
        if (!existing || callbackTime > existing) {
          allCallbackUpdates.set(memberId, callbackTime);
        }
      }
    }

    if (allMemberNotes.length > 0) {
      await this.memberInfra.insertData(allMemberNotes, manager);
      console.log(`Batch inserted ${allMemberNotes.length} member notes`);
    }

    if (allMemberUpdates.size > 0) {
      const memberIds = Array.from(allMemberUpdates.keys());
      const updateGroups = new Map<string, { memberIds: string[]; updates: any }>();

      for (const [memberId, updates] of allMemberUpdates.entries()) {
        const key = JSON.stringify(updates);
        const group = updateGroups.get(key);

        if (group) {
          group.memberIds.push(memberId);
        } else {
          updateGroups.set(key, { memberIds: [memberId], updates });
        }
      }

      for (const { memberIds, updates } of updateGroups.values()) {
        await this.memberInfra.updateData<Member>({ id: In(memberIds), appId }, updates, Member, manager);
      }

      console.log(`Batch updated timestamps for ${memberIds.length} members`);
    }

    if (allCallbackUpdates.size > 0) {
      const callbackMemberIds = Array.from(allCallbackUpdates.keys());

      const callbackGroups = new Map<number, string[]>();

      for (const [memberId, callbackTime] of allCallbackUpdates.entries()) {
        const timeKey = callbackTime.getTime();
        const group = callbackGroups.get(timeKey);

        if (group) {
          group.push(memberId);
        } else {
          callbackGroups.set(timeKey, [memberId]);
        }
      }

      for (const [timeKey, memberIds] of callbackGroups.entries()) {
        await manager.update(Member, { id: In(memberIds) }, { callbackedAt: new Date(timeKey) });
      }

      console.log(`Batch updated callbackedAt for ${callbackMemberIds.length} members`);
    }
  }

  private async prepareEventData(
    rawEventData: RawEventData,
    manager: EntityManager,
  ): Promise<ProcessedEventData | null> {
    const { appId, callData, originalSourceIp } = rawEventData;
    const { destination: originalDestination, disposition, source } = callData;

    const shouldCorrectDestination = (dest: unknown): dest is string =>
      typeof dest === 'string' && (dest === 't' || dest.startsWith('IVR'));

    const getCorrectedDestination = async (dest: string): Promise<string> => {
      const corrected = await this.findCorrectDestination(appId, source, manager);

      return corrected
        ? (console.log(`Corrected destination from ${dest} to ${corrected}`), corrected)
        : (console.log(`Could not correct destination ${dest} for source ${source}`), dest);
    };

    const destination = await (shouldCorrectDestination(originalDestination)
      ? getCorrectedDestination(originalDestination)
      : Promise.resolve(originalDestination));

    if (destination !== originalDestination) {
      callData.destination = destination;
    }

    const callers = await this.getCallers(appId, callData, manager);
    if (callers.length === 0) {
      console.log(`[${appId}] NotFound Caller Event: ${JSON.stringify(callData)}`);
      return null;
    }

    const callerIds: string[] = callers.map(caller => caller.id);
    const memberIdsByPhone: string[] = (await this.getMemberByPhone(appId, destination, manager)).map(v => v.id);
    const memberIds: string[] = callData.calltype === CalledType.INCOMING ? callerIds : memberIdsByPhone;

    if (memberIds.length === 0) {
      console.log(`NotFound Members Event: ${JSON.stringify(callData)}`);
      return null;
    }

    const status = this.mapCalledDisposition(disposition);
    if (memberIds.length > 3 && status === 'missed') {
      console.log(`Too many member has same phone Event: ${JSON.stringify(callData)}`);

      const app = await manager.findOne(App, { where: { id: appId } });
      if (!app) {
        throw new Error('App not found');
      }

      const members = await manager.find(Member, { where: { appId, role: 'app-owner' } });
      const adminMemberEmails = members.map(v => v.email);

      return {
        memberNotes: [],
        memberUpdates: new Map(),
        callbackUpdates: new Map(),
        duplicateMemberEmails: {
          appId,
          appName: app.name,
          adminEmails: adminMemberEmails,
          callerEmails: callers.map(caller => caller.email),
          destination,
          memberCount: memberIds.length,
        },
      };
    }

    const { billableseconds, calltype } = callData;
    const starttimeFormat = 'YYYY-MM-DD HH:mm:ss';

    const memberNotes = memberIds.map(memberId => {
      const memberNote = new MemberNote();
      memberNote.authorId = calltype === CalledType.INCOMING ? memberId : callerIds[0];
      memberNote.metadata = { ...callData, originalSourceIp };
      memberNote.duration = billableseconds;
      memberNote.memberId = memberId;
      memberNote.status = this.mapCalledDisposition(disposition);
      memberNote.type = this.mapCalledType(calltype);
      memberNote.createdAt = dayjs(callData.starttime, starttimeFormat, true).isValid()
        ? dayjs.tz(callData.starttime, 'Asia/Taipei').utc().toDate()
        : dayjs().utc().toDate();
      return memberNote;
    });

    const memberUpdates = new Map<string, any>();
    const timestamp = new Date();

    for (const memberId of memberIds) {
      const updates: any = {
        lastMemberNoteCreated: timestamp,
      };

      if (calltype === CalledType.OUTGOING && disposition !== CalledDisposition.ANSWERED) {
        updates.lastMemberNoteCalled = timestamp;
      }

      if (calltype === CalledType.OUTGOING && disposition === CalledDisposition.ANSWERED) {
        updates.lastMemberNoteAnswered = timestamp;
      }

      memberUpdates.set(memberId, updates);
    }

    const callbackUpdates = new Map<string, Date>();
    if (calltype === CalledType.INCOMING) {
      const memberIdsForCallback = await this.getMemberIdsByCallerIdsAndDestination(
        appId,
        destination,
        callerIds,
        manager,
      );

      if (memberIdsForCallback && memberIdsForCallback.length > 0) {
        const callbackTime = new Date();
        for (const memberId of memberIdsForCallback) {
          callbackUpdates.set(memberId, callbackTime);
        }
      }
    }

    console.log(`Prepared event data for appId: ${appId}, memberIds: ${memberIds.join(',')}`);

    return {
      memberNotes,
      memberUpdates,
      callbackUpdates,
    };
  }

  public async execute(manager: EntityManager, batchSize = 1000): Promise<void> {
    const client = this.cacheService.getClient();

    // key format: PhoneServiceRawEvent:${appId}:${uniqueid}:${source}
    const pattern = `PhoneServiceRawEvent:*`;
    let cursor = '0';

    do {
      const scanResult = await client.scan(cursor, 'MATCH', pattern, 'COUNT', batchSize);
      cursor = scanResult[0];
      const keys = scanResult[1];

      if (keys.length === 0) {
        continue;
      }

      console.log(`Processing batch of ${keys.length} events...`);

      const errorLogs: ErrorLogType[] = [];
      const eventsByAppId = new Map<string, { events: ProcessedEventData[]; keys: string[] }>();
      const duplicateNotifications: Array<ProcessedEventData['duplicateMemberEmails']> = [];

      const createErrorLog = (key: string): ErrorLogType => {
        const parts = key.split(':');
        const dateTime = parts[parts.length - 1];
        return {
          key,
          date: `${new Date(parseInt(dateTime, 10))}`,
          info: {
            memberNote: 'NoError',
            member: 'NoError',
          },
        };
      };

      for (const key of keys) {
        try {
          const valueString = await client.get(key);

          if (!valueString) {
            const errorLog = createErrorLog(key);
            errorLog.info = 'No data found';
            errorLogs.push(errorLog);
            continue;
          }

          const rawEventData: RawEventData = JSON.parse(valueString);

          if (!rawEventData.appId || !rawEventData.callData) {
            const errorLog = createErrorLog(key);
            errorLog.info = 'Data format error';
            errorLogs.push(errorLog);
            continue;
          }

          const processedData = await this.prepareEventData(rawEventData, manager);

          if (!processedData) {
            continue;
          }

          if (processedData.duplicateMemberEmails) {
            duplicateNotifications.push(processedData.duplicateMemberEmails);
            const appData = eventsByAppId.get(rawEventData.appId);
            if (appData) {
              appData.keys.push(key);
            } else {
              eventsByAppId.set(rawEventData.appId, { events: [], keys: [key] });
            }
            continue;
          }

          const appData = eventsByAppId.get(rawEventData.appId);
          if (appData) {
            appData.events.push(processedData);
            appData.keys.push(key);
          } else {
            eventsByAppId.set(rawEventData.appId, {
              events: [processedData],
              keys: [key],
            });
          }
        } catch (error) {
          const errorLog = createErrorLog(key);
          errorLog.info = 'Processing error';
          errorLogs.push(errorLog);
          console.error(`Error preparing event ${key}:`, error);
        }
      }

      const successfulKeys: string[] = [];

      for (const [appId, { events, keys: appKeys }] of eventsByAppId.entries()) {
        if (events.length === 0) {
          continue;
        }

        try {
          await manager.transaction(async transactionManager => {
            await this.batchProcessEvents(events, appId, transactionManager);
          });

          successfulKeys.push(...appKeys);
          console.log(`Successfully processed ${events.length} events for appId: ${appId}`);
        } catch (error) {
          console.error(`Error batch processing events for appId ${appId}:`, error);
        }
      }

      for (const notification of duplicateNotifications) {
        if (notification) {
          await this.sendMail(
            notification.appId,
            notification.adminEmails,
            `[${notification.appName}]重複會員電話提醒通知`,
            `${notification.callerEmails.join(',')} 於 ${dayjs().tz('Asia/Taipei').format('YYYY-MM-DD')} 撥打電話 ${
              notification.destination
            } ，此號碼於系統內存在共 ${
              notification.memberCount
            } 筆重複會員，此通話將不自動建立聯絡紀錄，建議您檢查您的會員資料並進行帳號整理，謝謝。`,
          );
        }
      }

      if (successfulKeys.length > 0) {
        await client.del(...successfulKeys);
        console.log(`Deleted ${successfulKeys.length} successfully processed Redis keys`);
      }

      if (errorLogs.length > 0) {
        for (const errorItem of errorLogs) {
          console.error(`Processing phone service event failed: ${JSON.stringify(errorItem)}`);
        }
      }
    } while (cursor !== '0');

    console.log('Batch processing complete');
  }
}

export { PortPhoneServiceInsertEventCommand };
