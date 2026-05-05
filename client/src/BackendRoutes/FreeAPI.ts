import axios from "axios";

const freeApi = axios.create({
  baseURL: "https://api.freeapi.app/api/v1/public",
  headers: {
    "Content-Type": "application/json",
  },
});

async function getFreeApi<T>(path: string, params?: Record<string, unknown>) {
  const res = await freeApi.get<T>(path, { params });
  return res.data?.data;
}

export const freeAPI = {
  // YouTube
  getYouTubeVideos: <T = unknown>(params?: {
    page?: number;
    limit?: number;
    query?: string;
  }) => getFreeApi<T>("/youtube/videos", params),

  getAYoutubeVideo: <T = unknown>(videoId: string) =>
    getFreeApi<T>(`/youtube/videos/${encodeURIComponent(videoId)}`),

  getYouTubeVideoComment: <T = unknown>(
    videoId: string,
    params?: { page?: number; limit?: number },
  ) =>
    getFreeApi<T>(`/youtube/comments/${encodeURIComponent(videoId)}`, params),

  getRelatedVideos: <T = unknown>(
    videoId: string,
    params?: { page?: number; limit?: number },
  ) => getFreeApi<T>(`/youtube/related/${encodeURIComponent(videoId)}`, params),

  // Quotes
  getQuotes: <T = unknown>(params?: {
    page?: number;
    limit?: number;
    query?: string;
  }) => getFreeApi<T>("/quotes", params),
  getRandomQuotes: <T = unknown>() => getFreeApi<T>("/quotes"),
  getAQuote: <T = unknown>(quoteId: string) =>
    getFreeApi<T>(`/quotes/${encodeURIComponent(quoteId)}`),

  // Products
  getRandomProducts: <T = unknown>(params?: {
    page?: number;
    limit?: number;
    inc?: string;
    query?: string;
  }) => getFreeApi<T>("/randomproducts", params),
  getAProduct: <T = unknown>(productId: string) =>
    getFreeApi<T>(`/randomproducts/${encodeURIComponent(productId)}`),

  // Jokes
  getRandomJokes: <T = unknown>(params?: { page?: number; limit?: number }) =>
    getFreeApi<T>("/randomjokes", params),
  getAJoke: <T = unknown>(jokeId: string) =>
    getFreeApi<T>(`/randomjokes/${encodeURIComponent(jokeId)}`),

  // Cats
  getRandomCats: <T = unknown>(params?: {
    page?: number;
    limit?: number;
    query?: string;
  }) => getFreeApi<T>("/cats", params),
  getACat: <T = unknown>(catId: string) =>
    getFreeApi<T>(`/cats/${encodeURIComponent(catId)}`),
  getARandomCat: <T = unknown>() => getFreeApi<T>("/cats/cat/random"),

  // Meals
  getMeals: <T = unknown>(params?: {
    page?: number;
    limit?: number;
    query?: string;
  }) => getFreeApi<T>("/meals", params),
  getAMeal: <T = unknown>(mealId: string) =>
    getFreeApi<T>(`/meals/${encodeURIComponent(mealId)}`),
  getARandomMeal: <T = unknown>() => getFreeApi<T>("/meals/meal/random"),

  // Random Users
  getRandomUsers: <T = unknown>(params?: {
    page?: number;
    limit?: number;
    query?: string;
  }) => getFreeApi<T>("/randomusers", params),
  getAUser: <T = unknown>(userId: string) =>
    getFreeApi<T>(`/randomusers/${encodeURIComponent(userId)}`),
};

export default freeAPI;
