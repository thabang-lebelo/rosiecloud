import React, { useEffect, useState } from 'react';
import ProductsPage from './ProductsPage';
import ProductDetailPage from './ProductDetailPage';
import ClientQueryPage from './ClientQueryPage';
import CartPage from './CartPage';
import CheckoutPage from './CheckoutPage';
import axios from 'axios';
import { ShoppingCart, MessageCircle, Grid, ChevronLeft, User } from 'lucide-react';

const CustomerDashboard = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState('products');
  const [cart, setCart] = useState([]);
  const [queries, setQueries] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Theme colors
  const colors = {
    primary: '#4f46e5', // Indigo
    secondary: '#f97316', // Orange
    background: '#f9fafb', // Light gray
    card: '#ffffff',
    text: '#1f2937',
    lightText: '#6b7280',
    border: '#e5e7eb',
    success: '#10b981', // Green
    hover: '#e0e7ff', // Light indigo
  };

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      // Load Products
      try {
        const response = await axios.get('https://rosiecloud.onrender.com');
        setProducts(response.data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      }

      // Load Cart from localStorage
      const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
      setCart(storedCart);

      // Load Queries from localStorage
      const storedQueries = JSON.parse(localStorage.getItem('queries')) || [];
      setQueries(storedQueries);
    };

    loadData();
  }, []);

  // Save cart to localStorage whenever the cart state changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Save queries to localStorage whenever the queries state changes
  useEffect(() => {
    localStorage.setItem('queries', JSON.stringify(queries));
  }, [queries]);

  // Function to add a product to the cart
  const addToCart = (product, quantity) => {
    setCart(prevCart => {
      // Find the product in the current products list to get its details
      const productDetails = products.find(p => p._id === product._id);

      if (!productDetails) {
        console.error("Product details not found for adding to cart:", product);
        alert("Could not add product to cart.");
        return prevCart;
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
        const cartItemId = `${productDetails._id}-${Date.now()}`;

        const newItem = {
          _id: cartItemId,
          productId: productDetails._id,
          name: productDetails.name,
          price: productDetails.price,
          quantity: quantity,
        };
        updatedCart = [...prevCart, newItem];
      }

      return updatedCart;
    });

    // Using a custom snackbar notification instead of alert
    showNotification(`${product.name} added to cart!`, 'success');
  };

  // Function to show notifications
  const showNotification = (message, type = 'info') => {
    // Create a div for notification
    const notification = document.createElement('div');
    notification.innerText = message;
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '4px';
    notification.style.zIndex = '1000';
    notification.style.minWidth = '200px';
    notification.style.textAlign = 'center';
    
    // Set styles based on notification type
    if (type === 'success') {
      notification.style.backgroundColor = colors.success;
      notification.style.color = 'white';
    } else {
      notification.style.backgroundColor = colors.primary;
      notification.style.color = 'white';
    }
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.5s ease-in-out';
      setTimeout(() => document.body.removeChild(notification), 500);
    }, 3000);
  };

  // Function to remove an item from the cart
  const removeFromCart = (cartItemId) => {
    setCart(prevCart => {
      const updatedCart = prevCart.filter(item => item._id !== cartItemId);
      return updatedCart;
    });
    showNotification('Item removed from cart', 'info');
  };

  // Function to update the quantity of a cart item
  const updateCartItemQuantity = (cartItemId, quantity) => {
    const newQuantity = Math.max(1, parseInt(quantity, 10) || 1);

    setCart(prevCart => {
      const updatedCart = prevCart.map(item =>
        item._id === cartItemId ? { ...item, quantity: newQuantity } : item
      );
      return updatedCart;
    });
  };

  // Function to submit a client query
  const submitQuery = (query) => {
    setQueries(prevQueries => [...prevQueries, query]);
    showNotification('Your query has been submitted!', 'success');
  };

  // Modified proceedToCheckout function
  const proceedToCheckout = (total) => {
    localStorage.setItem('checkoutCartItems', JSON.stringify(cart));
    localStorage.setItem('checkoutTotal', total.toString());
    localStorage.setItem('checkoutUserId', currentUser._id || 'guest');
    setIsCheckingOut(true);
  };

  // Function to handle returning from Checkout to Cart
  const handleReturnToCart = () => {
    setIsCheckingOut(false);
    setActiveTab('cart');
  };

  // Function to handle continuing shopping from Checkout (success or error)
  const handleContinueShopping = () => {
    setIsCheckingOut(false);
    setActiveTab('products');
    localStorage.removeItem('checkoutCartItems');
    localStorage.removeItem('checkoutTotal');
    localStorage.removeItem('checkoutUserId');
    localStorage.removeItem('buyerInfo');
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: colors.background,
      color: colors.text,
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Sidebar - hidden on mobile */}
      {!isCheckingOut && (
        <div style={{
          width: '250px',
          backgroundColor: colors.card,
          borderRight: `1px solid ${colors.border}`,
          padding: '20px 0',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          height: '100vh',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          zIndex: 10,
          transition: 'transform 0.3s ease-in-out',
          transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}>
          <div style={{ padding: '0 20px', marginBottom: '30px' }}>
            <h2 style={{ 
              color: colors.primary, 
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '10px'
            }}>
              EcoShop
            </h2>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              padding: '10px 0'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: colors.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <User size={20} />
              </div>
              <div>
                <p style={{ fontWeight: 'bold', margin: 0 }}>{currentUser.name}</p>
                <p style={{ fontSize: '12px', color: colors.lightText, margin: 0 }}>Customer</p>
              </div>
            </div>
          </div>
          
          <div style={{ flex: 1 }}>
            <button 
              onClick={() => { setActiveTab('products'); setSelectedProduct(null); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '15px 20px',
                backgroundColor: activeTab === 'products' ? colors.hover : 'transparent',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                borderLeft: activeTab === 'products' ? `4px solid ${colors.primary}` : '4px solid transparent',
                fontWeight: activeTab === 'products' ? 'bold' : 'normal',
                color: activeTab === 'products' ? colors.primary : colors.text,
              }}
            >
              <Grid size={18} style={{ marginRight: '10px' }} />
              Products
            </button>
            
            <button 
              onClick={() => setActiveTab('queries')}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '15px 20px',
                backgroundColor: activeTab === 'queries' ? colors.hover : 'transparent',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                borderLeft: activeTab === 'queries' ? `4px solid ${colors.primary}` : '4px solid transparent',
                fontWeight: activeTab === 'queries' ? 'bold' : 'normal',
                color: activeTab === 'queries' ? colors.primary : colors.text,
              }}
            >
              <MessageCircle size={18} style={{ marginRight: '10px' }} />
              Queries
            </button>
            
            <button 
              onClick={() => setActiveTab('cart')}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '15px 20px',
                backgroundColor: activeTab === 'cart' ? colors.hover : 'transparent',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                borderLeft: activeTab === 'cart' ? `4px solid ${colors.primary}` : '4px solid transparent',
                fontWeight: activeTab === 'cart' ? 'bold' : 'normal',
                color: activeTab === 'cart' ? colors.primary : colors.text,
              }}
            >
              <ShoppingCart size={18} style={{ marginRight: '10px' }} />
              Cart
              <span style={{
                marginLeft: '10px',
                backgroundColor: colors.secondary,
                color: 'white',
                borderRadius: '30px',
                padding: '2px 8px',
                fontSize: '12px',
                display: 'inline-block',
              }}>
                {cart.length}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Mobile menu toggle button */}
      {!isCheckingOut && (
        <button
          onClick={toggleMobileMenu}
          style={{
            position: 'fixed',
            top: '10px',
            left: '10px',
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '4px',
            backgroundColor: colors.primary,
            border: 'none',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          {isMobileMenuOpen ? <ChevronLeft size={24} /> : <Grid size={24} />}
        </button>
      )}

      {/* Main Content */}
      <div style={{
        flex: 1,
        marginLeft: isCheckingOut ? 0 : '250px',
        padding: '30px',
        transition: 'margin 0.3s ease-in-out',
      }}>
        {/* Back button when in product detail view */}
        {!isCheckingOut && activeTab === 'productDetail' && (
          <button
            onClick={() => { setActiveTab('products'); setSelectedProduct(null); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'transparent',
              border: 'none',
              color: colors.primary,
              cursor: 'pointer',
              padding: '10px 0',
              marginBottom: '20px',
              fontSize: '16px',
            }}
          >
            <ChevronLeft size={20} style={{ marginRight: '5px' }} />
            Back to Products
          </button>
        )}
        
        {/* Render CheckoutPage if isCheckingOut is true */}
        {isCheckingOut ? (
          <CheckoutPage
            onReturnToCart={handleReturnToCart}
            onContinueShopping={handleContinueShopping}
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
                cartItems={cart}
                removeFromCart={removeFromCart}
                proceedToCheckout={proceedToCheckout}
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
