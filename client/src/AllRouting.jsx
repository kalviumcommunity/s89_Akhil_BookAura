import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Forgotpassword from './pages/forgotpassword';
import Login from './pages/login';
import Signup from './pages/signup';
import Home from './pages/Home';
import Marketplace from './pages/MarketPlace/Marketplace';
import LandingPage from './pages/LandingPage';
import AddProducts from './pages/AddProducts';
import Pdf from './pages/Pdf';
import Book from './pages/MarketPlace/Book';

const pageTransition = {
  initial: { opacity: 0, x: -100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 100 },
};

const AllRouting = () => {
  const location = useLocation(); 

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <motion.div
              variants={pageTransition}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.5 }}
            >
              <LandingPage />
            </motion.div>
          }
        />
        <Route
          path="/login"
          element={
              <Login />
            
          }
        />
        <Route
          path="/signup"
          element={
              <Signup />
            
          }
        />
        <Route
          path="/forgotpassword"
          element={
              <Forgotpassword />
            
          }
        />
        <Route
          path="/home"
          element={
              <Home />
            
          }
        />
        <Route
          path="/marketplace"
          element={
              <Marketplace />
            
          }
        />
        <Route
          path="/addproducts"
          element={
              <AddProducts />
            
          }
        />
        <Route
          path="/pdfviewer"
          element={
              <Pdf />
            
          }
        />
        <Route
          path="/books"
          element={
              <Book />
            
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

export default AllRouting;