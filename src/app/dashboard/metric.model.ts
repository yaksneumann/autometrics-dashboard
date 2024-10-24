export interface Metric {
    timestamp: string;
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number; 
}

export interface MetricSummary {
    totalImpressions: number;
    totalClicks: number;
    totalCost: number;
    totalConversions: number; 
}
