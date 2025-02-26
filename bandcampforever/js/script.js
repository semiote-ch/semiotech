let articlesData = [];
let playlistsData = [];
var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// For infinite scroll
let currentIndex = 0; // which article index we're up to in the filtered list
const batchSize = 4; // how many articles to load each time
let loading = false;

// Global filter variable – default "all"
let currentFilter = "all";

/* ---------- CATEGORY FUNCTIONS ---------- */
function getCategory(article) {
  try {
    const url = new URL(article.article_url);
    const segments = url.pathname.split('/').filter(Boolean);
    return segments[0] ? segments[0].toLowerCase() : "unknown";
  } catch (e) {
    return "unknown";
  }
}

function toTitleCase(str) {
  return str.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
}

function getPastelColor(category) {
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360; // Hue from 0 to 359
  // Return a pastel color using HSL (e.g., 60% saturation and 80% lightness)
  return `hsl(${hue}, 60%, 80%)`;
}


/* ---------- DATA LOADING & INFINITE SCROLL ---------- */
async function loadData() {
  try {
    const articlesRes = await fetch('data/articles.json');
    articlesData = await articlesRes.json();

    const playlistsRes = await fetch('data/playlists.json');
    playlistsData = await playlistsRes.json();

    loadNextBatch();
    updateCategoryCounts();
  } catch (error) {
    console.error("Error loading data:", error);
  }
}

function getPlaylistUrl(articleUrl) {
  const match = playlistsData.find(item => item.article_url === articleUrl);
  return match ? match.spotify_url : null;
}

// Only one definition of getFilteredArticles
function getFilteredArticles() {
  if (currentFilter === "all") return articlesData;
  return articlesData.filter(article => getCategory(article) === currentFilter);
}

function createArticleCard(article) {
  const card = document.createElement('div');
  card.classList.add('article-card');

  // Create a container for title, category, and genre pills
  const titleContainer = document.createElement('div');
  titleContainer.style.display = "flex";
  titleContainer.style.alignItems = "baseline";
  titleContainer.style.gap = "10px";
  titleContainer.style.paddingLeft = "3%";
  titleContainer.style.flexWrap = "wrap";  // Allow the pills to wrap if they overflow

  // Create the category pill
  const category = getCategory(article);
  const categoryTag = document.createElement('span');
  categoryTag.classList.add('category-tag');
  categoryTag.textContent = toTitleCase(category);
  categoryTag.style.backgroundColor = getPastelColor(category);
  categoryTag.style.border = "1px solid black";
  categoryTag.style.padding = "2px 6px";
  categoryTag.style.cursor = "pointer";
  categoryTag.style.whiteSpace = "nowrap";
  categoryTag.addEventListener('click', () => {
    applyFilter(category);
    highlightSidebarCategory(category);
  });
  titleContainer.appendChild(categoryTag);
  if (article.genre && Array.isArray(article.genre) && article.genre.length > 0) {
    article.genre.forEach(genre => {
      const genreTag = document.createElement('span');
      genreTag.classList.add('category-tag');
      genreTag.textContent = genre.toLowerCase();
      genreTag.style.backgroundColor = getPastelColor(genre);
      genreTag.style.border = "1px solid black";
      genreTag.style.padding = "2px 6px";
      genreTag.style.cursor = "pointer";
      genreTag.style.whiteSpace = "nowrap";
      genreTag.addEventListener('click', () => {
        applyFilter(genre);  // Trigger genre filter
        highlightSidebarCategory(genre);  // Highlight genre in the sidebar
      });
      titleContainer.appendChild(genreTag);
    });
  }

  // Create and append the article title
  const titleElem = document.createElement('h2');
  const linkElem = document.createElement('a');
  linkElem.textContent = article.title;
  linkElem.href = article.article_url;
  linkElem.target = '_blank';
  titleElem.appendChild(linkElem);
  titleContainer.appendChild(titleElem);

  // Create genre tags (if genres exist)

  card.appendChild(titleContainer);

  // Author
  const authorElem = document.createElement('p');
  authorElem.classList.add('author');
  authorElem.style.paddingLeft = "3%";
  authorElem.textContent = `by ${article.author}`;
  card.appendChild(authorElem);

  const readLink = document.createElement('a');
  readLink.href = article.article_url;
  readLink.target = '_blank';
  readLink.textContent = 'read the full article here';
  authorElem.appendChild(document.createTextNode(' | '));
  authorElem.appendChild(readLink);

  // Row 1: Playlist and article details
  const row1 = document.createElement('div');
  row1.classList.add('article-row1');

  // Row1 left: Playlist embed container
  const playlistDiv = document.createElement('div');
  playlistDiv.classList.add('row1-left');
  playlistDiv.classList.add('playlist-container');
  const spotifyUrl = getPlaylistUrl(article.article_url);
  if (spotifyUrl) {
    const iframe = document.createElement('iframe');
    iframe.style.borderRadius = '12px';
    iframe.src = spotifyUrl + '?utm_source=generator';
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.frameBorder = '0';
    iframe.allowFullscreen = true;
    iframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
    iframe.loading = 'lazy';
    playlistDiv.appendChild(iframe);
  }

  // Row1 right: Article details
  const row1Right = document.createElement('div');
  row1Right.classList.add('row1-right');

  let artistList = '';
  if (article.songs && article.songs.length > 0) {
    const artists = article.songs.map(song => song.title).filter(Boolean);
    if (artists.length > 0) {
      artistList = 'ft. ' + artists.join(', ');
    }
  }
  const artistP = document.createElement('p');
  artistP.textContent = artistList;
  row1Right.appendChild(artistP);

  const buyHeader = document.createElement('h3');
  buyHeader.textContent = 'buy the albums here';
  row1Right.appendChild(buyHeader);

  if (article.songs && article.songs.length > 0) {
    article.songs.forEach(song => {
      if (song.link && song.link.includes('bandcamp.com/album')) {
        const lastSegment = song.link.split('/').pop();
        const albumName = lastSegment.replace(/\?.*$/, '').replace(/-/g, ' ');

        const artist = song.title || 'Unknown Artist';
        const p = document.createElement('p');
        p.innerHTML = `<a href="${song.link}" target="_blank"><b>${albumName}</b> by ${artist}</a>`;
        row1Right.appendChild(p);
      }
    });
  } else {
    const possibleRefs = article.content_refs || [];
    const albumLinks = possibleRefs.filter(ref => ref.includes('bandcamp.com/album'));
    albumLinks.forEach(link => {
      const lastSegment = link.split('/').pop();
      const albumName = lastSegment.replace(/\?.*$/, '').replace(/-/g, ' ');
      const p = document.createElement('p');
      p.innerHTML = `<a href="${link}" target="_blank"><b>${albumName}</b> by Unknown</a>`;
      row1Right.appendChild(p);
    });
  }

  const relatedHeader = document.createElement('h3');
  relatedHeader.textContent = 'Related Articles:';
  row1Right.appendChild(relatedHeader);

  let relatedRefs = [];
  if (article.songs && article.songs.length > 0) {
    article.songs.forEach(song => {
      if (song.refs && Array.isArray(song.refs)) {
        relatedRefs.push(...song.refs);
      }
    });
  }
  relatedRefs.push(...(article.content_refs || []));
  const dailyLinks = relatedRefs.filter(r => r.includes('daily.bandcamp.com'));

  // Remove duplicate links
  const uniqueDailyLinks = [...new Set(dailyLinks)];

  // Limit to 3 articles
  uniqueDailyLinks.slice(0, 3).forEach(dl => {
    // Remove any query parameters for clean parsing
    const cleanUrl = dl.split('?')[0];

    // Attempt to extract title and author assuming URL structure:
    // .../some-title-by-some-author
    const dailyArticle = articlesData.find(a => a.article_url.split('?')[0] === cleanUrl);
    const match = cleanUrl.match(/daily\.bandcamp\.com\/(.*?)-by-(.*)/); let displayText = dl;
    if (dailyArticle) {
      displayText = `<b>${dailyArticle.title}</b> `;
    }

    // Create a paragraph and anchor element for this daily article
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = '#'; // prevent default navigation
    a.innerHTML = displayText;

    // Attach an event listener that pulls up the article card
    a.addEventListener('click', (e) => {
      e.preventDefault();
      if (dailyArticle) {
        const container = document.getElementById('articles-container');
        container.innerHTML = "";
        const card = createArticleCard(dailyArticle);
        container.appendChild(card);
        currentIndex = articlesJson.indexOf(dailyArticle);
      }
    });

    p.appendChild(a);
    row1Right.appendChild(p);
  });

  if (isMobile) {
    // Mobile: Stack the playlist (left) on top of the text details (right)
    row1.style.display = 'flex';
    row1.style.flexDirection = 'column';
    playlistDiv.querySelector('iframe').style.height = '30px';
    row1Right.style.flexDirection = 'column';
    row1.appendChild(playlistDiv);
    row1.appendChild(row1Right);
  } else {
    // Desktop: Side-by-side layout
    row1.style.display = 'flex';
    row1.style.flexDirection = 'row';
    row1.appendChild(playlistDiv);
    row1.appendChild(row1Right);
  }

  card.appendChild(row1);

  return card;
}

function loadNextBatch() {
  if (loading) return;
  loading = true;
  const container = document.getElementById('articles-container');
  const filteredArticles = getFilteredArticles();
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

window.addEventListener('scroll', () => {
  if ((window.innerHeight + window.pageYOffset) >= document.body.offsetHeight - 200) {
    loadNextBatch();
  }
});

/* ---------- CATEGORY FILTER EVENT HANDLERS ---------- */
function applyFilter(filter) {
  currentFilter = filter;
  currentIndex = 0;
  const container = document.getElementById('articles-container');
  container.innerHTML = "";
  loadNextBatch();
}

// Add event listeners for sidebar filter links (only once)
document.querySelectorAll('.category-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const category = e.target.getAttribute('data-category');
    applyFilter(category);
    // Only highlight if it's not the "random" category
    if (category !== "random") {
      highlightSidebarCategory(category);
    }
  });
});

window.addEventListener('DOMContentLoaded', () => {
  loadData();
});

// Event listener for "All" link
document.getElementById('all-link').addEventListener('click', (e) => {
  e.preventDefault();
  applyFilter("all");
});

document.addEventListener('DOMContentLoaded', () => {
  const randomLink = document.getElementById('random-link');
  if (!randomLink) return;

  randomLink.addEventListener('click', (e) => {
    e.preventDefault();
    const filtered = getFilteredArticles();
    if (filtered.length === 0) return;
    const randomIndex = Math.floor(Math.random() * filtered.length);
    const container = document.getElementById('articles-container');
    container.innerHTML = "";
    const card = createArticleCard(filtered[randomIndex]);
    container.appendChild(card);
    // Adjust currentIndex as desired
    currentIndex = filtered.length;
  });
});


function adjustPlaylistHeight() {
  const row1Right = document.querySelector('.row1-right');
  const playlistContainer = document.querySelector('.playlist-container');
  if (row1Right && playlistContainer) {
    // Get the height of the text container
    const newHeight = row1Right.offsetHeight;
    // Apply the height to the playlist container
    playlistContainer.style.height = newHeight + 'px';

    // If needed, also update the iframe's height (if not already inheriting 100%)
    const iframe = playlistContainer.querySelector('iframe');
    if (iframe) {
      iframe.style.height = '100%'; // or newHeight + 'px'
    }
  }
}

// Call adjustPlaylistHeight once the DOM is loaded and whenever the window resizes
window.addEventListener('load', adjustPlaylistHeight);
window.addEventListener('resize', adjustPlaylistHeight);

function updateCategoryCounts() {
  // Wait until articlesData is loaded
  if (!articlesData.length) return;

  // Loop through sidebar links (skip if data-category is not set, e.g., "random")
  document.querySelectorAll('.category-link').forEach(link => {
    const category = link.getAttribute('data-category');
    if (category && category !== "all-link" && category !== "random-link") {
      // Count articles for the given category
      const count = articlesData.filter(article => getCategory(article) === category).length;
      // Append count in brackets next to the link text (or update an existing element)
      link.innerHTML = `${toTitleCase(category)} <span class="count">(${count})</span>`;
    } else if (category === "all-link") {
      // If you want to show the total count for "all"
      link.innerHTML = `all <span class="count">(${articlesData.length})</span>`;
    }
  });
}
function highlightSidebarCategory(selectedCategory) {
  // Loop through all sidebar category links
  document.querySelectorAll('.category-link').forEach(link => {
    const category = link.getAttribute('data-category');
    // Clear previous highlights
    link.classList.remove('selected');

    // If this is the selected category, add the selected class and inline style
    if (category === selectedCategory) {
      link.classList.add('selected');
      // Optionally, set the background color to the category's pastel color
      link.style.backgroundColor = getPastelColor(selectedCategory);
      link.style.fontWeight = 'bold';
    } else {
      // Reset background for non-selected links
      link.style.backgroundColor = "";
      link.style.fontWeight = "";
    }
  });
}

// Ensure card is relatively positioned so the footer can be placed absolutely
// Create a fixed container for the bottom-right text
const bottomRightText = document.createElement('div');
bottomRightText.style.position = 'fixed';
bottomRightText.style.bottom = '10px';
bottomRightText.style.right = '10px';
bottomRightText.style.textAlign = 'right';
bottomRightText.style.fontSize = '0.9em';
bottomRightText.style.zIndex = '1000'; // Ensure it appears above other content

// Set the inner HTML with a red heart emoji and the Spotify link (update the URL as needed)
bottomRightText.innerHTML = `made with <span style="color: red;">❤️</span> by jean<br>
a <a href="https://semiote.ch" target="_blank">semiote.ch</a> production<br>
<a href="https://open.spotify.com/user/s3s8huo8u5tdc4r2qmnymyw4y?si=39601b5a99bd4bd1" target="_blank">follow jean on spotify</a>`;

// Append the element to the body so it's visible on every page
document.body.appendChild(bottomRightText);
