export type Aggregates = {
  revenue: number;
  count: number;
  avg: number;
  goldRevenue: number;
  goldCount: number;
  pace: number;
  daySpan: number;
  courseAgg: { name: string; sum: number; count: number }[];
  offeringAgg: { name: string; sum: number; count: number }[];
  stateAgg: { name: string; count: number }[];
  centerAgg: { name: string; sum: number; count: number }[];
  posTypeAgg: { name: string; sum: number; count: number }[];
};

export type UploadMeta = {
  month_label: string;
  total_rows: number;
  excluded_offline: number;
  excluded_zero: number;
  included_count: number;
};

export type MonthEntry = { month_key: string; month_label: string };

export type AnalyticsResponse = {
  current: { aggregates: Aggregates; meta: UploadMeta | null };
  previous: { aggregates: Aggregates; meta: UploadMeta | null } | null;
};
