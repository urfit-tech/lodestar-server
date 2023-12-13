interface ActivityBasicCondition {
  organizerId?: string | null;
  appId: string;
  scenario: 'holding' | 'finished' | 'draft' | 'privateHolding';
}
