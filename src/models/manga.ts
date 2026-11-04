export interface Chapter {
  id: string;
  mangaId: string;
  number?: string;
  title?: string;
  publishedAt?: string;
  language: string;
  sourceUrl?: string;
  translationSource?: string;
  pages: Page[];
}

export interface Page {
  id: string;
  imageUrl: string;
  order: number;
  sourceUrl?: string;
  license?: string;
}

export interface Manga {
  id: string;
  slug: string;
  title: string;
  description?: string;
  cover?: string;
  author?: string;
  genres: string[];
  status?: string;
  language: string;
  sourceId: string;
  sourceUrl?: string;
  license?: string;
  licenseUrl?: string;
  chapters: Chapter[];
  updatedAt?: string;
}

export interface Provider {
  id: string;
  name: string;
  baseUrl: string;
  apiUrl?: string;
  documentationUrl: string;
  providerType: string[];
  authenticationType: string;
  allowedLanguages: string[];
  license?: string;
  licenseUrl?: string;
  termsUrl?: string;
  active: boolean;
  status: string;
  lastCheckedAt?: string;
}
