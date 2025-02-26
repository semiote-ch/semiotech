import { loadData, currentIndex, batchSize } from './dataLoader.js';
import { adjustPlaylistHeight } from './domUtils.js';
import { setupEventListeners } from './eventHandlers.js';

window.addEventListener('DOMContentLoaded', () => {
  loadData();
  setupEventListeners();
  window.addEventListener('resize', adjustPlaylistHeight);
});
