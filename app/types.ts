export interface Exploit {
  id: string;
  isExploit: boolean;
  date: string;
  protocol: string;
  chain: string;
  category: string;
  severity: string;
  funds: string;
  fundsNum: number;
  txHash: string;
  txLink: string;
  account: string;
  tweetUrl: string;
  summary: string;
  reasoning: string;
  confidence: string;
  fortaRisk: number | null;
  fortaProfit: number | null;
  fortaModules: string;
}
