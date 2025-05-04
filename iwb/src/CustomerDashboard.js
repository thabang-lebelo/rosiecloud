// CustomerDashboard.js
import React, { useEffect, useState } from 'react';
import ProductsPage from './ProductsPage';
import ProductDetailPage from './ProductDetailPage';
import ClientQueryPage from './ClientQueryPage';
import CartPage from './CartPage';
import CheckoutPage from './CheckoutPage'; // Import the CheckoutPage
import axios from 'axios';

const CustomerDashboard = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState('products');
  const [cart, setCart] = useState([]);
  const [queries, setQueries] = useState([]); // State for client queries
  const [selectedProduct, setSelectedProduct] = useState(null); // State for product detail view
  const [products, setProducts] = useState([]); // State for all products

  // New state to control displaying the CheckoutPage
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Load products, cart, and queries on component mount
  useEffect(() => {
    const loadData = async () => {
      // Load Products
      try {
        const response = await axios.get('http://localhost:5000/api/products');
        setProducts(response.data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
        // Optionally show an error message to the user
      }

      // Load Cart from localStorage
      const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
      setCart(storedCart);

      // Load Queries from localStorage
      const storedQueries = JSON.parse(localStorage.getItem('queries')) || [];
      setQueries(storedQueries);
    };

    loadData();
  }, []); // Empty dependency array means this runs only once on mount

  // Save cart to localStorage whenever the cart state changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]); // Dependency array includes 'cart', so this runs after setCart completes

  // Save queries to localStorage whenever the queries state changes
  useEffect(() => {
    localStorage.setItem('queries', JSON.stringify(queries));
  }, [queries]); // Dependency array includes 'queries'

  // Function to add a product to the cart
  const addToCart = (product, quantity) => {
    setCart(prevCart => {
      // Find the product in the current products list to get its details
      const productDetails = products.find(p => p._id === product._id);

      if (!productDetails) {
          console.error("Product details not found for adding to cart:", product);
          alert("Could not add product to cart.");
          return prevCart; // Return previous state if product details are missing
      }

      const existingItemIndex = prevCart.findIndex(item => item.productId === productDetails._id);

      let updatedCart;
      if (existingItemIndex > -1) {
        // If item exists, update its quantity
        updatedCart = prevCart.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // If item does not exist, add it
        // Create a unique ID for the cart item itself
        const cartItemId = `${productDetails._id}-${Date.now()}`; // Simple unique ID

        const newItem = {
            _id: cartItemId, // Unique ID for the item within the cart state
            productId: productDetails._id, // Store the actual product ID
            name: productDetails.name, // Store product name
            price: productDetails.price, // Store price
            quantity: quantity,
        };
        updatedCart = [...prevCart, newItem];
      }

      // localStorage is handled by the separate useEffect hook

      return updatedCart; // Return the new state
    });

    // Alert is fine here, but it shows before state update is fully reflected
    // Consider placing alerts/notifications after state update or using a notification system
     alert(`${product.name} added to cart!`);
  };

  // Function to remove an item from the cart
  const removeFromCart = (cartItemId) => {
    setCart(prevCart => {
      const updatedCart = prevCart.filter(item => item._id !== cartItemId);
      // localStorage is handled by the separate useEffect hook
      return updatedCart;
    });
  };

  // Function to update the quantity of a cart item
  const updateCartItemQuantity = (cartItemId, quantity) => {
    // Ensure quantity is at least 1 if changing via input
    const newQuantity = Math.max(1, parseInt(quantity, 10) || 1);

    setCart(prevCart => {
      const updatedCart = prevCart.map(item =>
        item._id === cartItemId ? { ...item, quantity: newQuantity } : item
      );
      // localStorage is handled by the separate useEffect hook
      return updatedCart;
    });
  };

  // Function to submit a client query
  const submitQuery = (query) => {
      setQueries(prevQueries => [...prevQueries, query]);
      // localStorage is handled by the separate useEffect hook
      alert('Your query has been submitted!');
  };


  // Modified proceedToCheckout function
  const proceedToCheckout = (total) => {
    // Save cart data and total to localStorage for the CheckoutPage
    localStorage.setItem('checkoutCartItems', JSON.stringify(cart));
    localStorage.setItem('checkoutTotal', total.toString());
    localStorage.setItem('checkoutUserId', currentUser._id || 'guest'); // Save user ID

    // Switch to the checkout view
    setIsCheckingOut(true);
  };

  // Function to handle returning from Checkout to Cart
  const handleReturnToCart = () => {
    setIsCheckingOut(false); // Hide checkout page
    setActiveTab('cart'); // Show cart tab (optional, but makes sense)
  };

   // Function to handle continuing shopping from Checkout (success or error)
  const handleContinueShopping = () => {
    setIsCheckingOut(false); // Hide checkout page
    setActiveTab('products'); // Show products tab
     // Optionally clear localStorage data related to checkout after returning
    localStorage.removeItem('checkoutCartItems');
    localStorage.removeItem('checkoutTotal');
    localStorage.removeItem('checkoutUserId');
    localStorage.removeItem('buyerInfo'); // Also clear buyer info
  };


  return (
    // Add scrolling styles to this main container div
    <div style={{
        height: 'calc(100vh - 60px)', // Example: 100vh minus approximate height of header/nav
        overflowY: 'auto', // Add vertical scrollbar if content overflows
        padding: '20px' // Add some padding
    }}>
      <h1>Welcome, {currentUser.name}</h1>
      {/* Navigation tabs - hide when checking out */}
      {!isCheckingOut && (
        <nav style={{ marginBottom: '20px' }}>
          <button onClick={() => { setActiveTab('products'); setSelectedProduct(null); }}>Products</button> {/* Reset selected product */}
          <button onClick={() => setActiveTab('queries')}>Queries</button>
          <button onClick={() => setActiveTab('cart')}>Cart ({cart.length})</button> {/* Display cart item count */}
        </nav>
      )}

      <div> {/* This div wraps the content of the active tab */}
        {/* Render CheckoutPage if isCheckingOut is true */}
        {isCheckingOut ? (
           <CheckoutPage
             onReturnToCart={handleReturnToCart} // Pass the return function
             onContinueShopping={handleContinueShopping} // Pass continue shopping function
           />
        ) : (
          // Render other tabs if not checking out
          <>
            {activeTab === 'products' && (
              <ProductsPage
                navigateTo={(product) => { setSelectedProduct(product); setActiveTab('productDetail'); }}
                products={products}
                addToCart={addToCart}
              />
            )}
            {activeTab === 'productDetail' && selectedProduct && (
              <ProductDetailPage product={selectedProduct} addToCart={addToCart} />
            )}
            {activeTab === 'queries' && (
              <ClientQueryPage
                 submitQuery={submitQuery}
                 queries={queries}
              />
            )}
            {activeTab === 'cart' && (
              <CartPage
                cartItems={cart} // Pass the cart state as props
                removeFromCart={removeFromCart}
                proceedToCheckout={proceedToCheckout} // Pass the modified function
                updateCartItemQuantity={updateCartItemQuantity}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;