// Reader.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import EpubViewer from './EpubViewer';

function Reader() {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  console.log("Loading book with ID:", id);

  useEffect(() => {
    const fetchBook = async () => {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://s89-akhil-bookaura-3.onrender.com';
      const res = await axios.get(`${baseUrl}/api/books/${id}`);
      setBook(res.data);
    };
    fetchBook();
  }, [id]);

  if (!book) return <p>Loading...</p>;

  return (
    <div>
      <h1>{book.title} by {book.author}</h1>
      <EpubViewer epubUrl={book.epubUrl} />
    </div>
  );
}

export default Reader;
