# Enhanced EPUB Viewer Component

This component provides a feature-rich EPUB reader for the BookAura application. It allows users to read EPUB format books with a variety of reading enhancement features.

## Features

### Navigation
- **Page Navigation**: Navigate through the book using next/previous buttons
- **Table of Contents**: Access and navigate through the book's chapters
- **Keyboard Navigation**: Use arrow keys to navigate pages (left/right)
- **Page Tracking**: Shows current page number and total pages

### Reading Experience
- **Theme Switching**: Toggle between light and dark reading modes
- **Zoom Controls**: Increase or decrease text size
- **Fullscreen Mode**: Expand the reader to fill the entire screen
- **Responsive Design**: Works well on different screen sizes

### Book Management
- **Bookmarks**: Add, view, and remove bookmarks
- **Search**: Search for text within the book
- **Loading Indicator**: Shows a loading spinner while the book is being loaded

## Usage

```jsx
import EpubViewer from './components/EpubViewer';

// In your component
<EpubViewer epubUrl="path/to/your/book.epub" />
```

## Props

| Prop | Type | Description |
|------|------|-------------|
| epubUrl | string | URL or path to the EPUB file |

## Implementation Details

The component uses the `epubjs` library to render EPUB files. It handles:

1. Fetching and loading the EPUB file
2. Rendering the content with proper pagination
3. Extracting and displaying the table of contents
4. Managing user interactions and state

## File Structure

- `EpubViewer.jsx`: Main component implementation
- `EpubViewer.css`: Styling for the component

## Integration with BookAura

The EPUB viewer is integrated with:

1. **MyBooksPage**: Used to read purchased EPUB books
2. **TestEpubViewer**: A test page to demonstrate the viewer's capabilities

## Technical Notes

- Bookmarks are stored in localStorage for persistence
- The component handles both remote and local EPUB files
- Error handling is implemented for failed loads
- The viewer supports keyboard navigation for better accessibility

## Future Enhancements

Potential future improvements:
- Text highlighting and note-taking
- Font family selection
- Reading progress synchronization across devices
- Text-to-speech integration
- Annotation export/import
