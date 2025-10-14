import { CardJoinDTO } from './dto/card-join.dto';

export abstract class CardRepository {
  abstract findAllByApp(appId: string): Promise<CardJoinDTO[]>;
}
