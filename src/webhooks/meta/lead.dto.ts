export interface LeadWebhookBody {
  id: number;
  created_time: string;
  ad_id: number;
  ad_name: string;
  adset_id: number;
  adset_name: string;
  campaign_id: number;
  campaign_name: string;
  form_id: number;
  form_name: string;
  is_organic: boolean;
  platform: string;
  email: string;
  full_name: string;
  phone_number: string;
  city: string;
}
