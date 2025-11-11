import { MemberNote } from '~/entity/MemberNote';

export enum CalledEvent {
  HANGUP = 'hangup',
  CDR = 'cdr',
  CC_CDR = 'cc_cdr',
  DIAL_BEGIN = 'dialbegin',
  DIAL_END = 'dialend',
  EXTENSION_STATUS = 'extensionstatus',
}

export enum CalledType {
  INCOMING = 'incoming',
  OUTGOING = 'outgoing',
}

export enum CalledDisposition {
  NO_ANSWER = 'NO ANSWER',
  ANSWERED = 'ANSWERED',
}

export type CDRCalledData = {
  event: CalledEvent.CDR;
  calltype: CalledType;
  source: string;
  destination: string;
  duration: number;
  uniqueid: string;
  disposition: CalledDisposition;
  billableseconds: number;
  starttime: string;
};

export type CalledData = CDRCalledData;

export type RawEventData = {
  appId: string;
  callData: CalledData;
  originalSourceIp?: string;
  receivedAt: string;
};

export type LastMemberNotesType = {
  criteria: {
    id: any;
    appId: string;
  };
  lastMemberRecord: {
    lastMemberNoteAnswered?: Date;
    lastMemberNoteCalled?: Date;
    lastMemberNoteCreated: Date;
  };
};

export type ErrInfoType = {
  memberNote: { data: MemberNote[]; errMsg: string } | 'NoError';
  member: { data: LastMemberNotesType; errMsg: string } | 'NoError';
};

export type ErrorLogType = {
  key: string;
  date: string;
  info: ErrInfoType | 'No data found' | 'Data format error' | 'Processing error';
};

export type ProcessedEventData = {
  memberNotes: MemberNote[];
  memberUpdates: Map<
    string,
    {
      lastMemberNoteCreated?: Date;
      lastMemberNoteCalled?: Date;
      lastMemberNoteAnswered?: Date;
    }
  >;
  callbackUpdates: Map<string, Date>;
  duplicateMemberEmails?: {
    appId: string;
    appName: string;
    adminEmails: string[];
    callerEmails: string[];
    destination: string;
    memberCount: number;
  };
};
