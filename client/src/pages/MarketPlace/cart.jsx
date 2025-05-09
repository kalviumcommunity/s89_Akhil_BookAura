import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is logged in
  useEffect(() => {
    // Check for the non-httpOnly isLoggedIn cookie
    const hasToken = document.cookie.includes('isLoggedIn=true');
    setIsLoggedIn(hasToken);
    console.log('User login status:', hasToken ? 'Logged in' : 'Not logged in');
  }, []);

  // Fetch cart from server if logged in, otherwise from localStorage
  useEffect(() => {
    const fetchCart = async () => {
      setIsLoading(true);
      try {
        if (isLoggedIn) {
          console.log('Fetching cart from server...');
          // Fetch cart from server
          const response = await axios.get('http://localhost:5000/api/cart', {
            withCredentials: true
          });

          if (response.data.success) {
            console.log('Server cart fetched successfully:', response.data.data);
            const serverCart = response.data.data;
            setCartItems(serverCart);
            updateCartStats(serverCart);

            // Sync localStorage with server cart
            localStorage.setItem('bookCart', JSON.stringify(serverCart));
          } else {
            console.log('Server returned unsuccessful response:', response.data);
          }
        } else {
          // Use localStorage cart
          const storedCart = JSON.parse(localStorage.getItem('bookCart')) || [];
          setCartItems(storedCart);
          updateCartStats(storedCart);
        }
      } catch (error) {
        console.error('Error fetching cart:', error);
        // Fallback to localStorage if server request fails
        const storedCart = JSON.parse(localStorage.getItem('bookCart')) || [];
        setCartItems(storedCart);
        updateCartStats(storedCart);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCart();
  }, [isLoggedIn]);

  const updateCartStats = (items) => {
    setCartCount(items.length);
    const price = items.reduce((total, item) => total + item.price, 0);
    setTotalPrice(price);
  };

  const addToCart = async (book) => {
    // Check if book is already in cart
    const alreadyInCart = cartItems.some(item => item._id === book._id || item.bookId === book._id);
    if (alreadyInCart) return; // Don't add duplicates

    try {
      if (isLoggedIn) {
        // Add to server cart
        const response = await axios.post('http://localhost:5000/api/cart/add', {
          bookId: book._id
        }, {
          withCredentials: true
        });

        if (response.data.success) {
          const updatedCart = response.data.data;
          setCartItems(updatedCart);
          updateCartStats(updatedCart);

          // Sync localStorage with server cart
          localStorage.setItem('bookCart', JSON.stringify(updatedCart));
        }
      } else {
        // Add to localStorage cart
        setCartItems(prevItems => {
          const newItems = [...prevItems, book];
          localStorage.setItem('bookCart', JSON.stringify(newItems));
          updateCartStats(newItems);
          return newItems;
        });
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      // Fallback to localStorage if server request fails
      setCartItems(prevItems => {
        const newItems = [...prevItems, book];
        localStorage.setItem('bookCart', JSON.stringify(newItems));
        updateCartStats(newItems);
        return newItems;
      });
    }
  };

  const removeFromCart = async (bookId) => {
    try {
      if (isLoggedIn) {
        // Remove from server cart
        const response = await axios.delete(`http://localhost:5000/api/cart/remove/${bookId}`, {
          withCredentials: true
        });

        if (response.data.success) {
          const updatedCart = response.data.data;
          setCartItems(updatedCart);
          updateCartStats(updatedCart);

          // Sync localStorage with server cart
          localStorage.setItem('bookCart', JSON.stringify(updatedCart));
        }
      } else {
        // Remove from localStorage cart
        setCartItems(prevItems => {
          const newItems = prevItems.filter(item => item._id !== bookId);
          localStorage.setItem('bookCart', JSON.stringify(newItems));
          updateCartStats(newItems);
          return newItems;
        });
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      // Fallback to localStorage if server request fails
      setCartItems(prevItems => {
        const newItems = prevItems.filter(item => item._id !== bookId);
        localStorage.setItem('bookCart', JSON.stringify(newItems));
        updateCartStats(newItems);
        return newItems;
      });
    }
  };

  const clearCart = async () => {
    try {
      if (isLoggedIn) {
        // Clear server cart
        const response = await axios.delete('http://localhost:5000/api/cart/clear', {
          withCredentials: true
        });

        if (response.data.success) {
          setCartItems([]);
          updateCartStats([]);

          // Sync localStorage with server cart
          localStorage.removeItem('bookCart');
        }
      } else {
        // Clear localStorage cart
        setCartItems([]);
        localStorage.removeItem('bookCart');
        updateCartStats([]);
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      // Fallback to localStorage if server request fails
      setCartItems([]);
      localStorage.removeItem('bookCart');
      updateCartStats([]);
    }
  };

  // Function to sync localStorage cart with server when user logs in
  const syncCartWithServer = async () => {
    // Check login status again to ensure it's current
    const hasToken = document.cookie.includes('isLoggedIn=true');

    if (!hasToken) {
      console.log('Cannot sync cart: User not logged in');
      return;
    }

    console.log('Starting cart sync with server...');

    try {
      // Get cart from localStorage
      const localCart = JSON.parse(localStorage.getItem('bookCart')) || [];
      console.log('Local cart items:', localCart.length);

      // If local cart is empty, no need to sync
      if (localCart.length === 0) {
        console.log('Local cart is empty, no need to sync');
        return;
      }

      // Add each item to server cart
      console.log('Adding items to server cart...');
      for (const item of localCart) {
        try {
          const bookId = item._id || item.bookId; // Handle both formats
          if (!bookId) {
            console.error('Item missing ID:', item);
            continue;
          }

          console.log('Adding item to cart:', bookId);
          await axios.post('http://localhost:5000/api/cart/add', {
            bookId: bookId
          }, {
            withCredentials: true
          });
        } catch (itemError) {
          console.error('Error adding item to server cart:', itemError);
          // Continue with next item
        }
      }

      // Fetch updated cart from server
      console.log('Fetching updated cart from server...');
      const response = await axios.get('http://localhost:5000/api/cart', {
        withCredentials: true
      });

      if (response.data.success) {
        console.log('Server cart updated successfully:', response.data.data);
        const serverCart = response.data.data;
        setCartItems(serverCart);
        updateCartStats(serverCart);

        // Update localStorage with server cart
        localStorage.setItem('bookCart', JSON.stringify(serverCart));
      } else {
        console.log('Server returned unsuccessful response:', response.data);
      }
    } catch (error) {
      console.error('Error syncing cart with server:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    }
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      cartCount,
      totalPrice,
      addToCart,
      removeFromCart,
      clearCart,
      isLoading,
      isLoggedIn,
      syncCartWithServer
    }}>
      {children}
    </CartContext.Provider>
  );
};
