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
 * Utility function to handle image loading errors
 * @param {Event} event - The error event
 */
export const handleImageError = (event) => {
  // Set a default image when the original fails to load
  event.target.src = '/default-book-cover.jpg';

  // Remove onerror to prevent infinite loop if default image also fails
  event.target.onerror = null;

  // Ensure the image maintains proper dimensions
  event.target.style.objectFit = 'cover';
  event.target.style.width = '100%';
  event.target.style.height = '100%';
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
import React, { useState } from 'react';

export const SafeImage = ({ src, alt, style, className, ...rest }) => {
  const [isLoading, setIsLoading] = useState(true);
  const proxiedSrc = getProxiedImageUrl(src);

  // Default styles to ensure consistent image display
  const defaultStyle = {
    objectFit: 'cover',
    width: '100%',
    height: '100%',
    transition: 'opacity 0.3s ease',
    opacity: isLoading ? 0.5 : 1,
    ...style
  };

  return (
    <img
      src={proxiedSrc}
      alt={alt || 'Image'}
      onError={handleImageError}
      onLoad={() => setIsLoading(false)}
      style={defaultStyle}
      className={className}
      loading="lazy" // Add lazy loading for better performance
      {...rest}
    />
  );
};
