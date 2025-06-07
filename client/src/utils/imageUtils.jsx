import React, { useState, useEffect } from 'react';

/**
 * Utility function to proxy image URLs through our server to avoid CORS issues
 * @param {string} url - The original image URL
 * @returns {string} - The proxied image URL
 */
export const getProxiedImageUrl = (url) => {
  // Check if the URL is from a problematic source (like Goodreads)
  if (url && (
    url.includes('goodreads.com') ||
    url.includes('images-amazon.com') ||
    url.includes('ssl-images-amazon.com')
  )) {
    // Return the proxied URL
    return `https://s89-akhil-bookaura-3.onrender.com/api/pdf/image-proxy?url=${encodeURIComponent(url)}`;
  }

  // Return the original URL for other sources
  return url;
};

/**
 * Utility function to handle image loading errors with multiple fallbacks
 * @param {Event} event - The error event
 */
export const handleImageError = (event) => {
  const img = event.target;

  // Check if we've already tried fallbacks to prevent infinite loops
  if (img.dataset.fallbackAttempted) {
    return;
  }

  // Mark that we've attempted fallback
  img.dataset.fallbackAttempted = 'true';

  // Try multiple fallback strategies
  const fallbackImages = [
    'https://via.placeholder.com/300x400/f0f0f0/666666?text=Book+Cover',
    'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=400&fit=crop',
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDMwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjBGMEYwIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMjAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjY2NjY2IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiPkJvb2sgQ292ZXI8L3RleHQ+Cjwvc3ZnPgo='
  ];

  // Try the first fallback
  if (fallbackImages.length > 0) {
    img.src = fallbackImages[0];

    // Set up error handler for fallback
    img.onerror = () => {
      if (fallbackImages.length > 1) {
        img.src = fallbackImages[1];
        img.onerror = () => {
          if (fallbackImages.length > 2) {
            img.src = fallbackImages[2];
            img.onerror = null; // Final fallback, no more retries
          }
        };
      }
    };
  }

  // Ensure the image maintains proper dimensions
  img.style.objectFit = 'cover';
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.backgroundColor = '#f0f0f0';
};

/**
 * Component to render an image with error handling and proxy support
 * @param {Object} props - Component props
 * @param {string} props.src - The image source URL
 * @param {string} props.alt - The image alt text
 * @param {Object} props.style - Optional style object
 * @param {string} props.className - Optional CSS class name
 * @returns {JSX.Element} - The image element
 */

export const SafeImage = ({ src, alt, style, className, ...rest }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState('');

  // Initialize source with proxy if needed
  useEffect(() => {
    if (src) {
      const proxiedSrc = getProxiedImageUrl(src);
      setCurrentSrc(proxiedSrc);
      setIsLoading(true);
      setError(false);
    }
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    setError(false);
  };

  const handleError = (event) => {
    setError(true);
    setIsLoading(false);
    handleImageError(event);
  };

  // Default styles to ensure consistent image display
  const defaultStyle = {
    objectFit: 'cover',
    width: '100%',
    height: '100%',
    transition: 'opacity 0.3s ease',
    opacity: isLoading ? 0.7 : 1,
    backgroundColor: isLoading || error ? '#f0f0f0' : 'transparent',
    ...style
  };

  // Show loading placeholder if no src provided
  if (!src) {
    return (
      <div
        style={{
          ...defaultStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f0f0f0',
          color: '#666',
          fontSize: '12px'
        }}
        className={className}
      >
        No Image
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt || 'Book Cover'}
      onError={handleError}
      onLoad={handleLoad}
      style={defaultStyle}
      className={className}
      loading="lazy"
      crossOrigin="anonymous" // Help with CORS issues
      {...rest}
    />
  );
};
