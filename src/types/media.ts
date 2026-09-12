export interface InternetSummary {
  headline: string;
  sourceName: string;
  sourceUrl: string;
  description: string;
  extract: string;
  thumbnail?: string;
  keyFacts?: { label: string; value: string }[];
}

export interface MediaSearchResult {
  id: string;
  title: string;
  japaneseTitle?: string;
  type: "anime" | "movie" | "show";
  year?: string | number;
  score?: number | string;
  ratingRank?: string;
  posterUrl: string;
  bannerUrl?: string;
  genres: string[];
  synopsis: string;
  trailerUrl?: string;
  watchUrl?: string;
  episodes?: number;
  status?: string;
  source: "kitsu" | "tvmaze" | "wikipedia" | "featured";
  internetSummary?: InternetSummary;
}
