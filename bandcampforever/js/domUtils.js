import { getPlaylistUrl } from './dataLoader.js';
import { getCategory, toTitleCase } from './utils.js';
var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

export function createArticleCard(article) {
  const card = document.createElement('div');
  card.classList.add('article-card');

  // Create container for title and category pill
  const titleContainer = document.createElement('div');
  titleContainer.style.display = "flex";
  titleContainer.style.alignItems = "baseline";
  titleContainer.style.gap = "10px";


  // Create category pill
  const category = getCategory(article);
  const tag = document.createElement('span');
  tag.classList.add('category-tag');
  tag.textContent = toTitleCase(category);
  tag.style.backgroundColor = getPastelColor(category);
  tag.style.border = "1px solid black";
  tag.style.padding = "2px 6px";
  tag.style.cursor = "pointer";
  tag.style.display = "inline-block";
  tag.style.whiteSpace = "nowrap";
  // Clicking the pill applies the filter (handled in eventHandlers)
  tag.addEventListener('click', () => {
    // Dispatch a custom event to filter by category
    document.dispatchEvent(new CustomEvent('filterByCategory', { detail: category }));
  });
  titleContainer.appendChild(tag);

  // Create article title element
  const titleElem = document.createElement('h2');
  const linkElem = document.createElement('a');
  linkElem.textContent = article.title;
  linkElem.style.display = "inline-block";
  linkElem.href = article.article_url;
  linkElem.target = '_blank';
  titleElem.appendChild(linkElem);
  titleContainer.appendChild(titleElem);
  card.appendChild(titleContainer);

  // Author and read link
  const authorElem = document.createElement('p');
  authorElem.classList.add('author');
  authorElem.textContent = `by ${article.author}`;
  const readLink = document.createElement('a');
  readLink.href = article.article_url;
  readLink.target = '_blank';
  readLink.textContent = ' read the full article here';
  authorElem.appendChild(document.createTextNode(' | '));
  authorElem.appendChild(readLink);
  card.appendChild(authorElem);

  // Row 1: Playlist and article details
  const row1 = document.createElement('div');
  row1.classList.add('article-row1');

  // Row1 left: Playlist embed container
  const playlistDiv = document.createElement('div');
  playlistDiv.classList.add('row1-left', 'playlist-container');
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

  // Row1 right: Article details (songs, albums, related articles)
  const row1Right = document.createElement('div');
  row1Right.classList.add('row1-right');

  // List of artists (if available)
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

  // Album purchase links
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

  // Related articles header and links
  const relatedHeader = document.createElement('h3');
  relatedHeader.textContent = 'Related Articles:';
  row1Right.appendChild(relatedHeader);

  // Gather related links from song refs and content_refs
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
  const uniqueDailyLinks = [...new Set(dailyLinks)];

  uniqueDailyLinks.slice(0, 3).forEach(dl => {
    const cleanUrl = dl.split('?')[0];
    const dailyArticle = window.articlesData && window.articlesData.find(a => a.article_url.split('?')[0] === cleanUrl);
    let displayText = dl;
    if (dailyArticle) {
      displayText = `<b>${dailyArticle.title}</b> `;
    }
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = '#';
    a.innerHTML = displayText;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      if (dailyArticle) {
        const container = document.getElementById('articles-container');
        container.innerHTML = "";
        const card = createArticleCard(dailyArticle);
        container.appendChild(card);
        // Optionally adjust currentIndex if needed
      }
    });
    p.appendChild(a);
    row1Right.appendChild(p);
  });

  // Responsive layout: mobile vs. desktop
  if (isMobile) {
    row1.style.display = 'flex';
    row1.style.flexDirection = 'column';
    row1Right.style.flexDirection = 'column';
    row1.appendChild(playlistDiv);
    row1.appendChild(row1Right);
  } else {
    row1.style.display = 'flex';
    row1.style.flexDirection = 'row';
    row1.appendChild(playlistDiv);
    row1.appendChild(row1Right);
  }
  card.appendChild(row1);

  return card;
}

export function updateCategoryCounts(articlesData) {
  document.querySelectorAll('.category-link').forEach(link => {
    const category = link.getAttribute('data-category');
    if (category && category !== "all-link" && category !== "random-link") {
      // Count articles for the given category
      const count = articlesData.filter(article => getCategory(article) === category).length;
      link.innerHTML = `${toTitleCase(category)} <span class="count">(${count})</span>`;
    } else if (category === "all-link") {
      link.innerHTML = `all <span class="count">(${articlesData.length})</span>`;
    }
  });
}

export function highlightSidebarCategory(selectedCategory) {
  document.querySelectorAll('.category-link').forEach(link => {
    const category = link.getAttribute('data-category');
    link.classList.remove('selected');
    if (category === selectedCategory) {
      link.classList.add('selected');
      link.style.backgroundColor = getPastelColor(selectedCategory);
      link.style.fontWeight = 'bold';
    } else {
      link.style.backgroundColor = "";
      link.style.fontWeight = "";
    }
  });
}

export function adjustPlaylistHeight() {
  const row1Right = document.querySelector('.row1-right');
  const playlistContainer = document.querySelector('.playlist-container');
  if (row1Right && playlistContainer) {
    const newHeight = row1Right.offsetHeight;
    playlistContainer.style.height = newHeight + 'px';
    const iframe = playlistContainer.querySelector('iframe');
    if (iframe) {
      iframe.style.height = '100%';
    }
  }
}

// Local helper: pastel color generator
function getPastelColor(category) {
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 80%)`;
}
