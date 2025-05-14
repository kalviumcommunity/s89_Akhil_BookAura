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
            const serverCart = response.data.data || [];

            // Log cart items for debugging
            if (serverCart.length > 0) {
              console.log('Cart items from server:');
              serverCart.forEach((item, index) => {
                console.log(`Item ${index + 1}:`, {
                  bookId: item.bookId,
                  _id: item._id,
                  title: item.title
                });
              });
            } else {
              console.log('Server cart is empty');
            }

            setCartItems(serverCart);
            updateCartStats(serverCart);

            // Sync localStorage with server cart
            localStorage.setItem('bookCart', JSON.stringify(serverCart));
          } else {
            console.log('Server returned unsuccessful response:', response.data);
            // Use localStorage as fallback
            const storedCart = JSON.parse(localStorage.getItem('bookCart')) || [];
            setCartItems(storedCart);
            updateCartStats(storedCart);
          }
        } else {
          // Use localStorage cart
          const storedCart = JSON.parse(localStorage.getItem('bookCart')) || [];
          console.log('Using localStorage cart, items:', storedCart.length);
          setCartItems(storedCart);
          updateCartStats(storedCart);
        }
      } catch (error) {
        console.error('Error fetching cart:', error);
        // Fallback to localStorage if server request fails
        const storedCart = JSON.parse(localStorage.getItem('bookCart')) || [];
        console.log('Error fetching cart, using localStorage fallback, items:', storedCart.length);
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
        console.log('Removing book from server cart, ID:', bookId);

        // Make sure we're using the bookId property for server operations
        let serverBookId = bookId;

        // Find the item in the cart to get the correct bookId
        const cartItem = cartItems.find(item => {
          const itemId = item._id || item.bookId;
          return itemId.toString() === bookId.toString();
        });

        if (cartItem) {
          // Use the bookId property for server operations
          serverBookId = cartItem.bookId;
          console.log('Found cart item, using bookId:', serverBookId);
        }

        // Try the direct remove endpoint first
        try {
          console.log('Calling DELETE endpoint with bookId:', serverBookId);
          const response = await axios.delete(`http://localhost:5000/api/cart/remove/${serverBookId}`, {
            withCredentials: true
          });

          if (response.data.success) {
            console.log('Book removed from server cart successfully');
            // Update local state with the updated cart from server
            const updatedCart = response.data.data;
            setCartItems(updatedCart);
            updateCartStats(updatedCart);
            localStorage.setItem('bookCart', JSON.stringify(updatedCart));

            // Verify the item was actually removed
            console.log('Updated cart items:', updatedCart.length);
            const stillExists = updatedCart.some(item => {
              const itemId = item._id || item.bookId;
              return itemId.toString() === bookId.toString();
            });

            if (stillExists) {
              console.error('Item still exists in cart after removal!');
            } else {
              console.log('Item successfully removed from cart');
            }

            return;
          }
        } catch (deleteError) {
          console.error('Error with DELETE endpoint, trying POST endpoint:', deleteError);

          // If DELETE fails, try the POST endpoint as fallback
          try {
            console.log('Calling POST endpoint with bookId:', serverBookId);
            const postResponse = await axios.post('http://localhost:5000/api/cart/remove', {
              bookId: serverBookId
            }, {
              withCredentials: true
            });

            if (postResponse.data.success) {
              console.log('Book removed from server cart successfully using POST endpoint');
              const updatedCart = postResponse.data.data;
              setCartItems(updatedCart);
              updateCartStats(updatedCart);
              localStorage.setItem('bookCart', JSON.stringify(updatedCart));

              // Verify the item was actually removed
              console.log('Updated cart items:', updatedCart.length);
              const stillExists = updatedCart.some(item => {
                const itemId = item._id || item.bookId;
                return itemId.toString() === bookId.toString();
              });

              if (stillExists) {
                console.error('Item still exists in cart after removal!');
              } else {
                console.log('Item successfully removed from cart');
              }

              return;
            }
          } catch (postError) {
            console.error('Error with POST endpoint too:', postError);
            // Continue to local fallback
          }
        }
      }

      // Remove from localStorage cart (fallback or for non-logged in users)
      setCartItems(prevItems => {
        // Handle both _id and bookId formats
        const newItems = prevItems.filter(item => {
          const itemId = item._id || item.bookId;
          return itemId.toString() !== bookId.toString();
        });
        console.log('Removed item locally, new cart size:', newItems.length);
        localStorage.setItem('bookCart', JSON.stringify(newItems));
        updateCartStats(newItems);
        return newItems;
      });
    } catch (error) {
      console.error('Error removing from cart:', error);

      // Fallback to local removal
      setCartItems(prevItems => {
        // Handle both _id and bookId formats
        const newItems = prevItems.filter(item => {
          const itemId = item._id || item.bookId;
          return itemId.toString() !== bookId.toString();
        });
        console.log('Removed item locally (fallback), new cart size:', newItems.length);
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
          console.log('Cart cleared successfully on server');
          setCartItems([]);
          updateCartStats([]);

          // Sync localStorage with server cart
          localStorage.removeItem('bookCart');
        } else {
          console.error('Server returned unsuccessful response when clearing cart:', response.data);
          // Continue to fallback
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

  // Function to force refresh the cart from the server
  const refreshCart = async () => {
    if (!isLoggedIn) {
      console.log('Cannot refresh cart: User not logged in');
      return;
    }

    console.log('Forcing cart refresh from server...');
    setIsLoading(true);

    try {
      const response = await axios.get('http://localhost:5000/api/cart', {
        withCredentials: true
      });

      if (response.data.success) {
        console.log('Cart refreshed successfully from server');
        const serverCart = response.data.data || [];
        setCartItems(serverCart);
        updateCartStats(serverCart);
        localStorage.setItem('bookCart', JSON.stringify(serverCart));
      } else {
        console.error('Server returned unsuccessful response when refreshing cart:', response.data);
      }
    } catch (error) {
      console.error('Error refreshing cart from server:', error);
    } finally {
      setIsLoading(false);
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
      refreshCart,
      isLoading,
      isLoggedIn,
      syncCartWithServer
    }}>
      {children}
    </CartContext.Provider>
  );
};
