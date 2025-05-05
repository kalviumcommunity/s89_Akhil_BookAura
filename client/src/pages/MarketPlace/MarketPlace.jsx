import React from 'react'
import './MarketPlace.css'
import {Search,BookOpen,Sparkles,Award,BookMarked} from 'lucide-react'
import Navbar from '../../components/Navbar'
import {Link} from 'react-router-dom'
import Footer from '../../components/Footer'
const Marketplace = () => {
  return (
    <>
    <Navbar />
      <div className='marketplace-main'>
        <div className='marketplace-box'>
        <h1 className='marketplace-title'>Discover Your Next<br/><span className='highlight'>Favorite Book</span></h1>
        </div>
        <div>
        <h2>Explore our curated collection of books spanning every genre. From timeless classics to the latest bestsellers, find your perfect read today.</h2>
      </div>
      <div className='search-button'>
      <div className='search'>
        <Search/>
        <input type="text" placeholder="Search for books, authors, or genres..." />
        </div>
        
      <Link className='link-button-marketplace' to={'/books'} >Browse All Books</Link>
      </div>
      </div>
      <div className='features'>
  <div className='collection'>
    <div className='collection-icon'><BookOpen size={24} /></div>
    <h3>Vast Collection</h3>
    <p>Discover thousands of titles across every genre imaginable.</p>
  </div>
  <div className='collection'>
    <div className='collection-icon'><Sparkles size={24} /></div>
    <h3>Personalized Recommendations</h3>
    <p>Find your next favorite read with tailored suggestions.</p>
  </div>
  <div className='collection'>
    <div className='collection-icon'><Award size={24} /></div>
    <h3>Award Winners</h3>
    <p>Explore critically acclaimed and award-winning titles.</p>
  </div>
  <div className='collection'>
    <div className='collection-icon'><BookMarked size={24} /></div>
    <h3>Your Digital Library</h3>
    <p>Access your purchased books anytime, anywhere.</p>
  </div>
</div>

      <Footer/>
    </>
  )
}

export default Marketplace
