import React, { useEffect } from 'react'
import Navbar from '../components/Navbar'
import '../pagescss/Home.css'
import bestseller from '../images/bestseller.png'
import Footer from '../components/Footer'
import { useCart } from './MarketPlace/cart'
import { SafeImage, getProxiedImageUrl, handleImageError } from '../utils/imageUtils'
import {useNavigate} from 'react-router-dom'

const Home = () => {
  const { syncCartWithServer } = useCart();
  const navigate = useNavigate();

  // Check if we need to sync cart after Google login
  useEffect(() => {
    const shouldSyncCart = localStorage.getItem('syncCartAfterLogin');
    if (shouldSyncCart === 'true') {
      // Sync cart with server
      syncCartWithServer();
      // Remove the flag
      localStorage.removeItem('syncCartAfterLogin');
    }
  }, [syncCartWithServer]);

  return (
    <div>
      <Navbar/>
      <div className='main-box'>
        <div className='quote-container'>
          <h1 className='quote-line'>TO SUCCEED<br/>YOU MUST<br/>READ</h1>
          <h3 className='line'>NOT SURE WHAT TO READ? EXPLORE OUR CATALOG OF PUBLIC DOMAIN BOOKS WITH OUR EDITORS</h3>
          <button className='explore' onClick={() => navigate('/marketplace')}>EXPLORE MORE | <span>&#8599;</span></button>
        </div>

        <div className='main-books'>
          <img className='photo book1' src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRzIbGw5k2kZZMVRhAtcqYdhqH4RLsEnEjdUw&s" alt="hard things about hard things" />
          <img className='photo book2' src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQe3Au_7qcAvUYAqjrzSHr2vpJp5GmZwu3C7A&s" alt="think and grow rich" />
          <img className='photo book3' src="https://raajkart.com/media/catalog/product/cache/378cf9a83101843e5b8b1271b991c285/z/e/zero_to_one_peter_thiel_.png" alt="zero to one" />
        </div>
      </div>
      <div className='middle-box'>
        <div className='bestseller-showcase'>
          <div className='bestseller-book'>
            <div className='bestseller-badge-container'>
              <img className='bestseller-badge' src={bestseller} alt="bestseller badge" />
            </div>
            <img className='bestseller-cover' src="https://m.media-amazon.com/images/I/71vtwPxOZRL._AC_UF1000,1000_QL80_.jpg" alt="Dot Com Secrets" />
          </div>

          <div className='bestseller-details'>
            <h2 className='bestseller-title'>Dot Com Secrets</h2>
            <p className='bestseller-author'>By Russell Brunson</p>
            <div className='bestseller-rating'>
              <span className='stars'>★★★★★</span>
              <span className='count'>(3,842 reviews)</span>
            </div>
            <p className='bestseller-description'>
              The Underground Playbook For Growing Your Company Online With Sales Funnels.
              This book walks you through the exact strategies that helped companies grow from
              zero to generating millions in revenue.
            </p>
            <div className='bestseller-meta'>
              <div className='meta-item'>
                <span className='meta-label'>Pages:</span>
                <span className='meta-value'>384</span>
              </div>
              <div className='meta-item'>
                <span className='meta-label'>Published:</span>
                <span className='meta-value'>2015</span>
              </div>
              <div className='meta-item'>
                <span className='meta-label'>Category:</span>
                <span className='meta-value'>Marketing</span>
              </div>
            </div>
            <button className='bestseller-button'>Read More</button>
          </div>
        </div>

        <div className='featured-section'>
          <h2 className='section-title'>Featured Books</h2>
          <p className='section-subtitle'>Discover our most popular titles this month</p>

          <div className='featured-books-container'>
            <div className='featured-book'>
              <div className='book-cover'>
                <SafeImage src="https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1348805097i/10534.jpg" alt="The Hobbit" />
              </div>
              <div className='book-info'>
                <h3>The Hobbit</h3>
                <p className='author'>J.R.R. Tolkien</p>
                <div className='rating'>
                  <span>★★★★★</span>
                  <span className='rating-count'>(2,453)</span>
                </div>
              </div>
            </div>

            <div className='featured-book'>
              <div className='book-cover'>
                <SafeImage src="https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1631088473i/5907.jpg" alt="Pride and Prejudice" />
              </div>
              <div className='book-info'>
                <h3>Pride and Prejudice</h3>
                <p className='author'>Jane Austen</p>
                <div className='rating'>
                  <span>★★★★☆</span>
                  <span className='rating-count'>(1,987)</span>
                </div>
              </div>
            </div>

            <div className='featured-book'>
              <div className='book-cover'>
                <SafeImage src="https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1673869741i/1885.jpg" alt="Frankenstein" />
              </div>
              <div className='book-info'>
                <h3>Frankenstein</h3>
                <p className='author'>Mary Shelley</p>
                <div className='rating'>
                  <span>★★★★☆</span>
                  <span className='rating-count'>(1,245)</span>
                </div>
              </div>
            </div>

            <div className='featured-book'>
              <div className='book-cover'>
                <SafeImage src="https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1572098085i/18135.jpg" alt="Romeo and Juliet" />
              </div>
              <div className='book-info'>
                <h3>Romeo and Juliet</h3>
                <p className='author'>William Shakespeare</p>
                <div className='rating'>
                  <span>★★★★☆</span>
                  <span className='rating-count'>(1,756)</span>
                </div>
              </div>
            </div>
          </div>

          <button className='view-all-btn'>View All Books</button>
        </div>
      </div>
      <Footer/>
    </div>
  )
}

export default Home
