type CardResponseDTO = import('./card.dto').CardResponseDTO;

export interface CardRepository {
  getMembershipCards(): Promise<CardResponseDTO[]>;
}
