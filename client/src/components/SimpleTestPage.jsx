import React from 'react';
import NavbarGoogleTranslate from './NavbarGoogleTranslate';
import { SafeImage } from '../utils/imageUtils';

const SimpleTestPage = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Simple Test Page</h1>
      
      <div style={{ marginBottom: '30px' }}>
        <h2>Translation Test</h2>
        <NavbarGoogleTranslate />
        <p>This text should be translatable. Try changing the language above.</p>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2>Image Test</h2>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ width: '200px' }}>
            <h4>Valid Image</h4>
            <SafeImage
              src="https://picsum.photos/300/400?random=1"
              alt="Valid book cover"
              style={{ width: '100%', height: '200px', objectFit: 'cover' }}
            />
          </div>

          <div style={{ width: '200px' }}>
            <h4>Invalid Image</h4>
            <SafeImage
              src="https://invalid-url.com/image.jpg"
              alt="Invalid book cover"
              style={{ width: '100%', height: '200px', objectFit: 'cover' }}
            />
          </div>

          <div style={{ width: '200px' }}>
            <h4>Local File Reference</h4>
            <SafeImage
              src="https://s89-akhil-bookaura-3.onrender.com/api/books/file/1748865858441_cover"
              alt="Local file reference"
              style={{ width: '100%', height: '200px', objectFit: 'cover' }}
            />
          </div>

          <div style={{ width: '200px' }}>
            <h4>No Image</h4>
            <SafeImage
              src={undefined}
              alt="No image"
              style={{ width: '100%', height: '200px', objectFit: 'cover' }}
            />
          </div>
        </div>
      </div>

      <div>
        <h2>Instructions</h2>
        <ul>
          <li>Try changing the language using the translate dropdown - no banner should appear</li>
          <li>Check that all images display properly with fallbacks</li>
          <li>Open browser console to check for errors</li>
        </ul>
      </div>
    </div>
  );
};

export default SimpleTestPage;
