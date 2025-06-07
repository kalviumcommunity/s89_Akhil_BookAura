/**
 * Utility functions specifically for handling book cover images
 * Addresses issues with local file references and missing images
 */

/**
 * Check if a book cover URL is valid and accessible
 * @param {string} url - The image URL to check
 * @returns {boolean} - True if URL appears to be valid
 */
export const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Check for local file references that likely don't exist
  if (url.includes('/api/books/file/')) {
    return false;
  }

  // Check for obviously invalid URLs
  if (url.includes('localhost') && !window.location.hostname.includes('localhost')) {
    return false;
  }

  return true;
};

/**
 * Get a working fallback image URL for book covers
 * @param {number} seed - Optional seed for random images
 * @returns {string} - A working image URL
 */
export const getFallbackBookCover = (seed = 1) => {
  const fallbackOptions = [
    `https://picsum.photos/300/400?random=${seed}`,
    'https://dummyimage.com/300x400/f0f0f0/666666&text=Book+Cover',
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDMwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjBGMEYwIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMjAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjY2NjY2IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiPkJvb2sgQ292ZXI8L3RleHQ+Cjwvc3ZnPgo='
  ];

  return fallbackOptions[0]; // Return the first (most reliable) option
};

/**
 * Process a book cover URL and return a working URL
 * @param {string} originalUrl - The original book cover URL
 * @param {string} bookTitle - Optional book title for seeding
 * @returns {string} - A working image URL
 */
export const processBookCoverUrl = (originalUrl, bookTitle = '') => {
  // If no URL provided, return fallback
  if (!originalUrl) {
    return getFallbackBookCover();
  }

  // If URL is invalid, return fallback
  if (!isValidImageUrl(originalUrl)) {
    console.warn('Invalid book cover URL detected:', originalUrl);
    // Use book title to create a consistent seed for the same book
    const seed = bookTitle ? bookTitle.length : Math.floor(Math.random() * 100);
    return getFallbackBookCover(seed);
  }

  // URL appears valid, return as-is
  return originalUrl;
};

/**
 * Fix book data to ensure all cover images are working
 * @param {object} book - Book object with potentially broken cover image
 * @returns {object} - Book object with fixed cover image
 */
export const fixBookCoverImage = (book) => {
  if (!book) return book;

  const fixedBook = { ...book };
  
  // Process the cover image URL
  fixedBook.coverimage = processBookCoverUrl(book.coverimage, book.title);
  
  return fixedBook;
};

/**
 * Fix an array of books to ensure all cover images are working
 * @param {array} books - Array of book objects
 * @returns {array} - Array of books with fixed cover images
 */
export const fixBooksArray = (books) => {
  if (!Array.isArray(books)) return books;
  
  return books.map(book => fixBookCoverImage(book));
};

/**
 * Create a placeholder book object with working image
 * @param {string} title - Book title
 * @param {string} author - Book author
 * @returns {object} - Book object with placeholder data
 */
export const createPlaceholderBook = (title = 'Sample Book', author = 'Unknown Author') => {
  return {
    _id: 'placeholder',
    title,
    author,
    description: 'This is a placeholder book with a working cover image.',
    genre: 'General',
    price: 0,
    coverimage: getFallbackBookCover(),
    url: '#',
    epubUrl: '#'
  };
};

/**
 * Log book image issues for debugging
 * @param {object} book - Book object to check
 */
export const debugBookImage = (book) => {
  if (!book) {
    console.log('📚 Book Debug: No book provided');
    return;
  }

  console.log('📚 Book Debug:', {
    title: book.title,
    originalCoverUrl: book.coverimage,
    isValidUrl: isValidImageUrl(book.coverimage),
    processedUrl: processBookCoverUrl(book.coverimage, book.title)
  });
};
