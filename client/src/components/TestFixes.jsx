import React, { useState, useEffect } from 'react';
import { SafeImage } from '../utils/imageUtils';
import { isAuthenticated, getAuthToken, getUserData } from '../utils/authUtils';
import NavbarGoogleTranslate from './NavbarGoogleTranslate';

const TestFixes = () => {
  const [authStatus, setAuthStatus] = useState(null);
  const [userData, setUserData] = useState(null);
  const [testImages, setTestImages] = useState([]);

  useEffect(() => {
    // Test authentication utilities
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      const token = getAuthToken();
      const user = getUserData();
      
      setAuthStatus({
        authenticated,
        hasToken: !!token,
        tokenLength: token ? token.length : 0
      });
      
      setUserData(user);
    };

    checkAuth();

    // Test images with various scenarios
    setTestImages([
      {
        id: 1,
        name: 'Valid Cloudinary Image',
        src: 'https://res.cloudinary.com/dg3i8akzq/image/upload/v1/book-covers/sample.jpg'
      },
      {
        id: 2,
        name: 'Invalid Image URL',
        src: 'https://invalid-url-that-will-fail.com/image.jpg'
      },
      {
        id: 3,
        name: 'External Image (may have CORS issues)',
        src: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=300&h=400'
      },
      {
        id: 4,
        name: 'No Image (undefined)',
        src: undefined
      }
    ]);
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>BookAura Fixes Test Page</h1>
      
      {/* Translation Test */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '30px' 
      }}>
        <h2>🌐 Translation Test</h2>
        <p>The Google Translate widget below should work for all accounts and hide the banner:</p>
        <NavbarGoogleTranslate />
        <p style={{ marginTop: '15px' }}>
          This is sample text to translate. Try changing the language above and this text should be translated.
          यह अनुवाद के लिए नमूना पाठ है। ऊपर भाषा बदलने की कोशिश करें और इस पाठ का अनुवाद होना चाहिए।
        </p>
      </div>

      {/* Authentication Test */}
      <div style={{ 
        backgroundColor: '#e8f5e8', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '30px' 
      }}>
        <h2>🔐 Authentication Status Test</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <h3>Auth Status:</h3>
            <pre style={{ backgroundColor: 'white', padding: '10px', borderRadius: '4px' }}>
              {JSON.stringify(authStatus, null, 2)}
            </pre>
          </div>
          <div>
            <h3>User Data:</h3>
            <pre style={{ backgroundColor: 'white', padding: '10px', borderRadius: '4px' }}>
              {JSON.stringify(userData, null, 2)}
            </pre>
          </div>
        </div>
      </div>

      {/* Image Loading Test */}
      <div style={{ 
        backgroundColor: '#fff3cd', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '30px' 
      }}>
        <h2>🖼️ Image Loading Test</h2>
        <p>Testing various image scenarios with improved error handling:</p>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px',
          marginTop: '15px'
        }}>
          {testImages.map(image => (
            <div key={image.id} style={{ 
              border: '1px solid #ddd', 
              borderRadius: '8px', 
              padding: '15px',
              textAlign: 'center'
            }}>
              <h4 style={{ fontSize: '14px', marginBottom: '10px' }}>{image.name}</h4>
              <div style={{ height: '150px', marginBottom: '10px' }}>
                <SafeImage
                  src={image.src}
                  alt={image.name}
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    borderRadius: '4px'
                  }}
                />
              </div>
              <small style={{ color: '#666', fontSize: '12px' }}>
                {image.src ? `URL: ${image.src.substring(0, 50)}...` : 'No URL provided'}
              </small>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div style={{ 
        backgroundColor: '#d1ecf1', 
        padding: '20px', 
        borderRadius: '8px' 
      }}>
        <h2>📋 Test Instructions</h2>
        <ol>
          <li><strong>Translation Test:</strong> Try changing languages using the dropdown. The banner should not appear.</li>
          <li><strong>Authentication Test:</strong> Check if your account data is properly detected.</li>
          <li><strong>Image Test:</strong> All images should display properly with fallbacks for failed loads.</li>
          <li><strong>Cross-Account Test:</strong> Try logging out and logging in with different accounts.</li>
        </ol>
        
        <h3 style={{ marginTop: '20px' }}>Expected Results:</h3>
        <ul>
          <li>✅ Translation works without showing Google banner</li>
          <li>✅ Authentication status is consistent across accounts</li>
          <li>✅ Images load with proper fallbacks when they fail</li>
          <li>✅ No console errors related to authentication or image loading</li>
        </ul>
      </div>
    </div>
  );
};

export default TestFixes;
