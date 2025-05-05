import React from 'react';
import '../pagescss/LandingPage.css';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const navigate = useNavigate();
    const quotes =[
        "A book is a dream that you hold in your hand.",
        "Books are a uniquely portable magic.",
        "Reading is a passport to countless adventures.",
        "A room without books is like a body without a soul.",
        "Books are the mirrors of the soul.",
        "The only thing that you absolutely have to know is the location of the library.",
        "So many books, so little time."
    ]
    return (
        <div className='landing-page'>
            <h1 className='quote' >{quotes[Math.floor(Math.random() * quotes.length)]}</h1>
            <br />
            <button className='explore' onClick={()=>
                navigate('/home')}>Explore more →</button>
        </div>
    );
};

export default LandingPage;