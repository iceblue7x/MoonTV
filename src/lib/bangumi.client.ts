'use client';

export interface BangumiCalendarData {
  weekday: {
    en: string;
  };
  items: {
    id: number;
    name: string;
    name_cn: string | null;
    rating: {
      score: number;
    } | null;
    air_date: string | null;
    images: {
      large: string;
      common: string;
      medium: string;
      small: string;
      grid: string;
    } | null;
  }[];
}

export function getBangumiPoster(
  images: BangumiCalendarData['items'][number]['images']
) {
  return (
    images?.large ||
    images?.common ||
    images?.medium ||
    images?.small ||
    images?.grid ||
    ''
  );
}

export async function GetBangumiCalendarData(): Promise<BangumiCalendarData[]> {
  const response = await fetch('https://api.bgm.tv/calendar');
  const data = await response.json();
  return data;
}
