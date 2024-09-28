export interface PrizeDetail {
  prizeId: number;
  prizeName: string;
  regions: PrizeRegionDetail[]
}

export interface PrizeRegionDetail {
  prizeRegionId: number;
  regionId: number;
  regionName: string;
  numOfItem: number;
}