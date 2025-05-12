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
import Book from './pages/MarketPlace/Book';
import CartPage from './pages/MarketPlace/CartPage';
import SuccessPage from './pages/MarketPlace/SuccessPage';
import CancelPage from './pages/MarketPlace/CancelPage';
import MyBooksPage from './pages/MarketPlace/MyBooksPage';
import CalendarPage from './pages/Calendar/CalendarPage';
import CalendarCallback from './pages/Calendar/CalendarCallback';
import StudyHome from './pages/studyhub/StudyHome';
import Flashcards from './pages/studyhub/FlashcardsFixed';
import AiChat from './pages/studyhub/AiChat';
import Profile from './pages/Profile';
import TestPdfViewer from './pages/TestPdfViewer';

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
          path="/books"
          element={
              <Book />

          }
        />
        <Route
          path="/cart"
          element={
              <CartPage />

          }
        />
        <Route
          path="/success"
          element={
              <SuccessPage />

          }
        />
        <Route
          path="/cancel"
          element={
              <CancelPage />

          }
        />
        <Route
          path="/my-books"
          element={
              <MyBooksPage />

          }
        />

        <Route
        path='/studyhome'
        element={<StudyHome/>}
        />
        <Route
          path="/calendar"
          element={<CalendarPage />}
        />
        <Route
          path="/calendar/callback"
          element={<CalendarCallback />}
        />
        <Route
          path="/flashcards"
          element={<Flashcards />}
        />
        <Route
          path="/aichat"
          element={<AiChat />}
        />
        <Route
          path="/profile"
          element={<Profile />}
        />
        <Route
          path="/test-pdf"
          element={<TestPdfViewer />}
        />
      </Routes>
    </AnimatePresence>
  );
};

export default AllRouting;