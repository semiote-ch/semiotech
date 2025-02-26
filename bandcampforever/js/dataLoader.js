import { createArticleCard, updateCategoryCounts } from './domUtils.js';
import { getFilteredArticles } from './utils.js';

export let articlesData = [];
export let playlistsData = [];

// For infinite scroll
export let currentIndex = 0; // which article index we're up to
export const batchSize = 4; // how many articles to load each time
export let loading = false;

// Global filter – default "all"
export let currentFilter = "all";

export async function loadData() {
  try {
    const articlesRes = await fetch(`${config.basePath}/data/articles.json`);
    articlesData = await articlesRes.json();

    const playlistsRes = await fetch(`${config.basePath}/data/playlists.json`);
    playlistsData = await playlistsRes.json();

    loadNextBatch();
    updateCategoryCounts(articlesData);
  } catch (error) {
    console.error("Error loading data:", error);
  }
}

export function getPlaylistUrl(articleUrl) {
  const match = playlistsData.find(item => item.article_url === articleUrl);
  return match ? match.spotify_url : null;
}

export function loadNextBatch() {
  if (loading) return;
  loading = true;
  const container = document.getElementById('articles-container');
  const filteredArticles = getFilteredArticles(articlesData, currentFilter);
  if (currentIndex >= filteredArticles.length) {
    loading = false;
    return;
  }
  const endIndex = currentIndex + batchSize;
  const batch = filteredArticles.slice(currentIndex, endIndex);
  batch.forEach(article => {
    const card = createArticleCard(article);
    container.appendChild(card);
  });
  currentIndex += batchSize;
  loading = false;
}

export function applyFilter(filter) {
  currentFilter = filter;
  currentIndex = 0;
  const container = document.getElementById('articles-container');
  container.innerHTML = "";
  loadNextBatch();
}
