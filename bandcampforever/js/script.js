let articlesData = [];
var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// For infinite scroll
let currentIndex = 0; // which article index we're up to in the filtered list
const batchSize = 4; // how many articles to load each time
let isLoading = false;

// Global filter variable – default "all"
let currentFilter = null;
console.log(cleanCategoryName("Hip-Hop/Rap"))
console.log(cleanCategoryName("R&B/Soup"))
/* ---------- CATEGORY FUNCTIONS ---------- */
function getCategory(article) {
  try {
    // Assuming article.category is an array of category tags
    if (Array.isArray(article.category)) {

      return article.category.map(tag => cleanCategoryName(tag));
    }
    // If article.category is a single category as a string, return it as an array
    if (typeof article.category === 'string') {
      return [cleanCategoryName(article.category)];
    }

    // If no categories or in an unexpected format
    return ["unknown"];
  } catch (e) {
    return ["unknown"];
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
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 80%)`;
}

/* ---------- DATA LOADING & INFINITE SCROLL ---------- */
async function loadData() {
  try {
    const response = await fetch('data/test2_articles_with_spotify.json');
    articlesData = await response.json();

    // Debug: Log the loaded data
    console.log('Total articles loaded:', articlesData.length);
    console.log('First few articles:', articlesData.slice(0, 3));

    // Get all unique categories for debugging
    const allCategories = new Set();
    articlesData.forEach(article => {
      if (article.category) {
        article.category.forEach(cat => allCategories.add(cleanCategoryName(cat)));
      }
    });
    console.log('All available categories:', [...allCategories]);

    loadNextBatch();
    updateCategoryCounts();
  } catch (error) {
    console.error("Error loading data:", error);
    // Log more detailed error information
    console.error('Error details:', {
      status: error.status,
      message: error.message,
      stack: error.stack
    });
  }
}

function getPlaylistUrl(articleUrl) {
  const article = articlesData.find(item => item.article_url === articleUrl);
  return article ? article.spotify_url : null;
}

// Update getFilteredArticles to use new category structure
function getFilteredArticles() {
  if (!currentFilter) return articlesData;

  // Special handling for about page
  if (currentFilter === 'about') {
    console.log(currentFilter)
    return [{
      article: 'About',
      article_url: '#',
      author: '',
      category: ['about'],
      isAboutPage: true  // Special flag to identify this is the about page
    }];
  }

  const normalizedFilter = cleanCategoryName(currentFilter).toLowerCase();

  return articlesData.filter(article => {
    // Get article categories and normalize them
    const articleCategories = article.category ?
      article.category.map(cat => cat.toLowerCase().trim()) : [];

    // Exact match in the category array
    return articleCategories.includes(normalizedFilter);
  });
}

function createArticleCard(article, index, total) {
  const card = document.createElement('div');
  card.classList.add('article-card');

  // Special handling for about page
  if (article.isAboutPage) {
    const titleContainer = document.createElement('div');
    titleContainer.style.display = "flex";
    titleContainer.style.alignItems = "baseline";
    titleContainer.style.gap = "10px";
    titleContainer.style.paddingLeft = "3%";
    titleContainer.style.flexWrap = "wrap";

    const titleElem = document.createElement('h2');
    titleElem.textContent = 'about';
    titleContainer.appendChild(titleElem);

    const content = document.createElement('div');
    content.style.padding = "3%";

    // Main text
    const mainText = document.createElement('p');
    mainText.innerHTML = "<strong><em>bandcamp forever</strong></em> is a directory of every <a href='https://daily.bandcamp.com/'>bandcamp</a> article as a spotify playlist. you can also conveniently purchase those albums via attached bandcamp links. <br> <br> streaming is killing artists <em>and</em> killing our tastes. profit-driven music rec algorithms makes it harder for good artists to get discovered by fans, and artists make less because streaming platforms don't pay them. at the same time, we are being spoonfed industry-funded slop by algorithms at spotify &amp; apple music because people pay these platforms to recommend certain songs to us. this eventually creates a &quot;monopoly&quot; of taste: as more and more people listen to bigger artists or &quot;discoverable&quot; artists on spotify, great music becomes less accessible to fans and artists alike. there are more than <strong>2,301,853</strong> artists on bandcamp, many of whom are no longer active. we <em>willingly</em> let this happen because big streaming platforms are simply more convenient. <br>";
    content.appendChild(mainText);

    // Problems section
    const problemsTitle = document.createElement('p');
    problemsTitle.innerHTML = "<br><strong>there are problems with your website / playlists</strong>";
    content.appendChild(problemsTitle);

    // Email
    const emailText = document.createElement('p');
    emailText.innerHTML = "pls email me at jayeychen [at] gmail [dot] com";
    content.appendChild(emailText);

    card.appendChild(titleContainer);
    card.appendChild(content);
    return card;
  }

  const titleContainer = document.createElement('div');
  titleContainer.style.display = "flex";
  titleContainer.style.alignItems = "baseline";
  titleContainer.style.gap = "10px";
  titleContainer.style.paddingLeft = "3%";
  titleContainer.style.flexWrap = "wrap";

  // Update genre pills to use new category structure
  if (article.category && article.category.length > 0) {
    const articleCategories = getCategory(article); // Get all categories from the article

    articleCategories.forEach(category => {
        const genreTag = document.createElement('span');
        genreTag.classList.add('category-tag');
        genreTag.textContent = category.toLowerCase();
        genreTag.style.backgroundColor = getPastelColor(category);
        genreTag.style.border = "1px solid black";
        genreTag.style.padding = "2px 6px";
        genreTag.style.cursor = "pointer";
        genreTag.style.whiteSpace = "nowrap";
        genreTag.addEventListener('click', () => {
          applyFilter(category);
          highlightSidebarCategory(category);
        });
        titleContainer.appendChild(genreTag);
    });
  }

  const titleElem = document.createElement('h2');
  const linkElem = document.createElement('a');
  linkElem.textContent = article.article;
  linkElem.href = article.article_url;
  linkElem.target = '_blank';
  titleElem.appendChild(linkElem);
  titleContainer.appendChild(titleElem);

  card.appendChild(titleContainer);

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

  const row1 = document.createElement('div');
  row1.classList.add('article-row1');

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

  const row1Right = document.createElement('div');
  row1Right.classList.add('row1-right');

  let artistList = '';
  if (article.songs && article.songs.length > 0) {
    // Create a Set of unique artists and convert back to array
    const uniqueArtists = [...new Set(article.songs
      .map(song => song.artist)
      .filter(Boolean))];

    if (uniqueArtists.length > 0) {
      artistList = 'ft. ' + uniqueArtists.join(', ');
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
      if (song.link && (song.link.includes('bandcamp.com/album') || song.link.includes('bandcamp.com/track'))) {
        const lastSegment = song.link.split('/').pop();
        const albumName = lastSegment.replace(/\?.*$/, '').replace(/-/g, ' ');
        const artist = song.artist || 'Unknown Artist';
        const p = document.createElement('p');
        p.innerHTML = `<a href="${song.link}" target="_blank"><b>${albumName}</b> by ${artist}</a>`;
        row1Right.appendChild(p);
      }
    });
  } else {
    const possibleRefs = article.refs || [];
    console.log("possibleRefs:", possibleRefs);
    const albumLinks = possibleRefs.filter(ref => ref.includes('bandcamp.com/album'));
    albumLinks.forEach(link => {
      const lastSegment = link.split('/').pop();
      const albumName = lastSegment.replace(/\?.*$/, '').replace(/-/g, ' ');
      const p = document.createElement('p');
      p.innerHTML = `<a href="${link}" target="_blank"><b>${albumName}</b> by Unknown</a>`;
      row1Right.appendChild(p);
    });
  }



  const relatedRefs = article.refs || [];
  console.log("relatedRefs:", relatedRefs);


  const dailyLinks = relatedRefs.filter(r => r.includes('daily.bandcamp.com'));
  const uniqueDailyLinks = [...new Set(dailyLinks)];
  console.log("uniqueDailyLinks:", uniqueDailyLinks);

  let hasMatches = false;
  const fragment = document.createDocumentFragment();

  uniqueDailyLinks.slice(0, 4).forEach(dl => {
      const cleanUrl = dl.split('?')[0];
      const dailyArticle = articlesData.find(a => a.article_url.split('?')[0] === cleanUrl);

      if (dailyArticle) {
          hasMatches = true;
          const displayText = `<b>${dailyArticle.article}</b>`;
          const p = document.createElement('p');
          const a = document.createElement('a');
          a.href = '#';
          a.innerHTML = displayText;
          a.addEventListener('click', (e) => {
              e.preventDefault();
              const container = document.getElementById('articles-container');
              container.innerHTML = "";
              const card = createArticleCard(dailyArticle, currentIndex, articlesData.length);
              container.appendChild(card);
              currentIndex = articlesData.indexOf(dailyArticle);
          });
          p.appendChild(a);
          fragment.appendChild(p);
      }
  });

  if (hasMatches) {
      const relatedHeader = document.createElement('h3');
      relatedHeader.textContent = 'related articles:';
      row1Right.appendChild(relatedHeader);
      row1Right.appendChild(fragment);
  }


  if (isMobile) {
    row1.style.display = 'flex';
    row1.style.flexDirection = 'column';
    if (playlistDiv.querySelector('iframe')) {
      playlistDiv.querySelector('iframe').style.height = '30px';
    }
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
function cleanCategoryName(category) {
  if (!category) return '';
  return category
    .toLowerCase()
    .trim()                         // Remove leading/trailing spaces
    .replace(/^[\s-]+|[\s-]+$/g, '') // Remove leading/trailing hyphens and spaces
    .replace(/[\/\-&]+/g, ' ')     // Replace slashes, hyphens, and ampersands with spaces
    .replace(/\s+/g, ' ')          // Replace multiple spaces with single space
    .trim();                       // Final trim
}
function loadNextBatch() {
  if (isLoading) {
    console.log('Already loading, skipping...');
    return;
  }

  const container = document.getElementById('articles-container');
  const filteredArticles = getFilteredArticles();
  const totalArticles = filteredArticles.length;

  // Special handling for about page
  if (currentFilter === 'about') {
    container.innerHTML = ''; // Clear existing content
    const card = createArticleCard(filteredArticles[0], 0, 1);
    container.appendChild(card);
    currentIndex = 1; // Prevent further loading
    isLoading = false;
    return;
  }

  // Regular handling for other categories
  // Check if we've reached the end
  if (currentIndex >= totalArticles) {
    // Add end note if it doesn't exist
    if (!document.querySelector('.end-note')) {
      const endNote = document.createElement('div');
      endNote.className = 'end-note';
      endNote.style.textAlign = 'center';
      endNote.style.padding = '40px';
      endNote.style.color = 'rgba(0, 0, 0, 0.5)';
      endNote.style.fontStyle = 'italic';
      endNote.style.cursor = 'pointer';
      endNote.style.transition = 'color 0.3s ease';
      endNote.innerHTML = '~ the end ~';

      endNote.addEventListener('mouseover', () => endNote.style.color = 'rgba(0, 0, 0, 0.8)');
      endNote.addEventListener('mouseout', () => endNote.style.color = 'rgba(0, 0, 0, 0.5)');
      endNote.addEventListener('click', () => {
        applyFilter('all');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });

      container.appendChild(endNote);
    }
    isLoading = false;
    return;
  }

  try {
    isLoading = true;
    console.log(`Loading articles ${currentIndex} to ${currentIndex + batchSize} of ${totalArticles}`);

    // Update the input placeholder to show current index
    const skipInput = document.querySelector('.sidebar input[type="number"]');
    if (skipInput) {
      skipInput.placeholder = `Current: ${currentIndex}`;
    }

    // Add skip button if we're in 'all' view and have more than 100 articles ahead
    const endIndex = currentIndex + batchSize;
    const batch = filteredArticles.slice(currentIndex, endIndex);

    batch.forEach((article, i) => {
      const card = createArticleCard(
        article,
        currentIndex + i,
        totalArticles
      );
      container.appendChild(card);
    });

    currentIndex += batch.length;
  } catch (error) {
    console.error('Error loading batch:', error);
  } finally {
    isLoading = false;
  }
}

// Simplified scroll handler with reset capability
function handleScroll() {
  // If stuck in loading state for more than 5 seconds, reset it
  if (isLoading) {
    setTimeout(() => {
      if (isLoading) {
        console.log('Resetting stuck loading state');
        isLoading = false;
      }
    }, 5000);
    return;
  }

  const buffer = 300;
  const bottomOfWindow = window.scrollY + window.innerHeight;
  const bottomOfDocument = document.documentElement.scrollHeight;

  if (bottomOfWindow + buffer >= bottomOfDocument) {
    loadNextBatch();
  }
}

// Throttle scroll events
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

// Add throttled scroll listener
window.addEventListener('scroll', throttle(handleScroll, 100));

/* ---------- CATEGORY FILTER EVENT HANDLERS ---------- */
function applyFilter(filter) {
  console.log('Applying filter:', filter);
  currentFilter = filter === "all" ? null : filter;
  currentIndex = 0;
  isLoading = false;

  const container = document.getElementById('articles-container');
  container.innerHTML = ""; // This will also remove any existing end note

  loadNextBatch();
}

// Sidebar event listeners for category links
document.querySelectorAll('.category-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const category = e.target.getAttribute('data-category');
    console.log('Category clicked:', category); // Debug log
    applyFilter(category);
    if (category !== "random") {
      highlightSidebarCategory(category);
    }
  });
});

window.addEventListener('DOMContentLoaded', () => {
  loadData();
});



// Optional: separate "all" link event listener, if needed
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
    const card = createArticleCard(filtered[randomIndex], randomIndex, filtered.length);
    container.appendChild(card);
    currentIndex = filtered.length;
  });

  // Add about link handler
  const aboutLink = document.getElementById('about');
  if (aboutLink) {
    aboutLink.addEventListener('click', (e) => {
      e.preventDefault();
      const container = document.getElementById('articles-container');
      container.innerHTML = "";

      const aboutArticle = {
        article: 'About',
        article_url: '#',
        author: '',
        category: ['about'],
        isAboutPage: true
      };

      const card = createArticleCard(aboutArticle, 0, 1);
      container.appendChild(card);
      currentFilter = 'about';  // Set the filter to about
      currentIndex = 1;  // Set to 1 to prevent more loading
      isLoading = false; // Reset loading state
    });
  }
});


function updateCategoryCounts() {
  if (!articlesData.length) return;

  // Create a map to store category counts
  const categoryCounts = new Map();

  // Count all categories
  articlesData.forEach(article => {
    if (article.category && Array.isArray(article.category)) {
      article.category.forEach(cat => {
        if (!cat) return;
        const cleanedCategory = cleanCategoryName(cat);
        if (cleanedCategory) {
          categoryCounts.set(
            cleanedCategory,
            (categoryCounts.get(cleanedCategory) || 0) + 1
          );
        }
      });
    }
  });

  // Update the sidebar links
      document.querySelectorAll('.category-link').forEach(link => {
        const category = link.getAttribute('data-category');
        if (category === "all") {
          link.innerHTML = `all <span class="count">(${articlesData.length})</span>`;
        } else if (category && category !== "random") {
          const cleanedCategory = cleanCategoryName(category);
          const count = categoryCounts.get(cleanedCategory) || 0;
          link.innerHTML = `${category} <span class="count">(${count})</span>`;
          // Update the data-category attribute with cleaned version
          link.setAttribute('data-category', cleanedCategory);
        }
      });
    }


function highlightSidebarCategory(selectedCategory) {
  document.querySelectorAll('.category-link').forEach(link => {
    const category = link.getAttribute('data-category');
    link.classList.remove('selected');

    // Check if the category matches the selectedCategory
    if (category && category.toLowerCase() === selectedCategory.toLowerCase()) {
      link.classList.add('selected');
      link.style.backgroundColor = getPastelColor(selectedCategory);
      link.style.fontWeight = 'bold';
    } else {
      link.style.backgroundColor = "";
      link.style.fontWeight = "";
    }
  });
}


const bottomRightText = document.createElement('div');
bottomRightText.style.position = 'fixed';
bottomRightText.style.bottom = '10px';
bottomRightText.style.right = '10px';
bottomRightText.style.textAlign = 'right';
bottomRightText.style.fontSize = '0.9em';
bottomRightText.style.zIndex = '1000';
bottomRightText.innerHTML = `<a href="/about.html">about</a><br>
made with <span style="color: red;">❤️</span> by jean<br>
a <a href="https://semiote.ch" target="_blank">semiote.ch</a> production<br>
// `;
document.body.appendChild(bottomRightText);
// Update isNotOnSpotify function to work with new schema
function isNotOnSpotify(article, albumLink) {
  return article.not_on_spotify && article.not_on_spotify.includes(albumLink);
}

// Helper function: Generate a color from a spectrum based on the link text
function getNotOnSpotifyColor(link) {
  const colors = ['#0000FF', '#800080', '#FF1493']; // blue, purple, deep pink
  let hash = 0;
  for (let i = 0; i < link.length; i++) {
    hash = link.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

// Update scroll event listener to be more reliable
window.addEventListener('scroll', () => {
  const scrollPosition = window.innerHeight + window.pageYOffset;
  const totalHeight = document.documentElement.scrollHeight;
  const buffer = 200; // pixels before bottom to trigger load

  if (scrollPosition + buffer >= totalHeight) {
    console.log('Scroll triggered load:', {
      scrollPosition,
      totalHeight,
      difference: totalHeight - scrollPosition
    });
    loadNextBatch();
  }
});

// Add this function to create the skip navigation
function createSkipNavigation() {
  // Create new list item
  const skipLi = document.createElement('li');

  // Create link element to match other sidebar links
  const skipLink = document.createElement('a');
  skipLink.href = "#";
  skipLink.className = "category-link";
  skipLink.textContent = 'Skip +10 articles';

  // Handle skip navigation
  skipLink.addEventListener('click', (e) => {
    e.preventDefault();

    const filteredArticles = getFilteredArticles();
    const nextIndex = currentIndex + 10;

    if (nextIndex >= filteredArticles.length) {
      alert(`Can't skip that far. Maximum index is ${filteredArticles.length - 1}`);
      return;
    }

    currentIndex = nextIndex;
    const container = document.getElementById('articles-container');
    container.innerHTML = '';
    loadNextBatch();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Add link to list item
  skipLi.appendChild(skipLink);

  // Insert after "Random" link
  const randomLi = document.getElementById('random-link').parentElement;
  randomLi.parentElement.insertBefore(skipLi, randomLi.nextSibling);
}

// Call this function after the sidebar is created
document.addEventListener('DOMContentLoaded', () => {
  createSkipNavigation();
});
