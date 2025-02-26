export function getCategory(article) {
  try {
    const url = new URL(article.article_url);
    const segments = url.pathname.split('/').filter(Boolean);
    return segments[0] ? segments[0].toLowerCase() : "unknown";
  } catch (e) {
    return "unknown";
  }
}

export function toTitleCase(str) {
  return str.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
}

export function getFilteredArticles(articlesData, currentFilter) {
  if (currentFilter === "all") return articlesData;
  return articlesData.filter(article => getCategory(article) === currentFilter);
}
