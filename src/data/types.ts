// Response shapes of the WealthLite API, as the tests rely on them.

export interface Holding {
  units: number;
  unitPricePence: number;
  valuePence: number;
}

export interface HoldingsResponse {
  holdings: Holding[];
  totalPence: number;
  currency: string;
}

export interface ApiError {
  error: string;
}
