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
    return `http://localhost:5000/api/pdf/image-proxy?url=${encodeURIComponent(url)}`;
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
import React from 'react';

export const SafeImage = ({ src, alt, style, className, ...rest }) => {
  const proxiedSrc = getProxiedImageUrl(src);
  
  return (
    <img 
      src={proxiedSrc} 
      alt={alt || 'Image'} 
      onError={handleImageError}
      style={style}
      className={className}
      {...rest}
    />
  );
};
