import { loadNextBatch, applyFilter, articlesData } from './dataLoader.js';
import { getFilteredArticles } from './utils.js';
import { highlightSidebarCategory } from './domUtils.js';

export function setupEventListeners() {
  // Infinite scroll event
  window.addEventListener('scroll', () => {
    if ((window.innerHeight + window.pageYOffset) >= document.body.offsetHeight - 200) {
      loadNextBatch();
    }
  });

  // Sidebar filter links
  document.querySelectorAll('.category-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const category = e.target.getAttribute('data-category');
      if (category === "random") {
        handleRandomSelection();
      } else {
        applyFilter(category);
        highlightSidebarCategory(category);
      }
    });
  });

  // Listen for custom filter events (from clicking a category pill)
  document.addEventListener('filterByCategory', (e) => {
    const category = e.detail;
    applyFilter(category);
    highlightSidebarCategory(category);
  });

  // Special handling for the "All" link
  const allLink = document.getElementById('all-link');
  if (allLink) {
    allLink.addEventListener('click', (e) => {
      e.preventDefault();
      applyFilter("all");
    });
  }

  // Handling for the random selection
  const randomLink = document.getElementById('random-link');
  if (randomLink) {
    randomLink.addEventListener('click', (e) => {
      e.preventDefault();
      const filtered = getFilteredArticles(articlesData, "all");
      if (filtered.length === 0) return;
      const randomIndex = Math.floor(Math.random() * filtered.length);
      const container = document.getElementById('articles-container');
      container.innerHTML = "";
      // Dynamically import createArticleCard from domUtils if needed
      import('./domUtils.js').then(module => {
        const card = module.createArticleCard(filtered[randomIndex]);
        container.appendChild(card);
      });
      // Optionally update currentIndex
    });
  }

  // Append fixed footer with attribution
  const bottomRightText = document.createElement('div');
  bottomRightText.style.position = 'fixed';
  bottomRightText.style.bottom = '10px';
  bottomRightText.style.right = '10px';
  bottomRightText.style.textAlign = 'right';
  bottomRightText.style.fontSize = '0.9em';
  bottomRightText.style.zIndex = '1000';
  bottomRightText.innerHTML = `made with <span style="color: red;">❤️</span> by jean<br>
  <a href="https://open.spotify.com/artist/jean" target="_blank">follow jean on spotify</a>`;
  document.body.appendChild(bottomRightText);
}

function handleRandomSelection() {
  // For a random selection, use the filtered articles
  const filtered = getFilteredArticles(articlesData, "all");
  if (filtered.length === 0) return;
  const randomIndex = Math.floor(Math.random() * filtered.length);
  const container = document.getElementById('articles-container');
  container.innerHTML = "";
  import('./domUtils.js').then(module => {
    const card = module.createArticleCard(filtered[randomIndex]);
    container.appendChild(card);
  });
}
