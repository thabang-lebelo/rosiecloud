// CartPage.js
import React, { useState, useEffect } from 'react';
// Remove useNavigate as it's part of react-router-dom
// import { useNavigate } from 'react-router-dom'; // REMOVED

// Accept cartItems, removeFromCart, updateCartItemQuantity, and proceedToCheckout as props
const CartPage = ({ cartItems, removeFromCart, updateCartItemQuantity, proceedToCheckout }) => {
  // Remove useNavigate hook
  // const navigate = useNavigate(); // REMOVED

  // We no longer need to fetch cartItems or products here
  // const [cartItems, setCartItems] = useState([]); // REMOVED
  const [products, setProducts] = useState({}); // We still need products to display details
  // const [customerName, setCustomerName] = useState(''); // REMOVED, handle in CustomerDashboard or CheckoutPage
  const [isLoading, setIsLoading] = useState(false); // Set to false as we're not fetching cart data here
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderStatus, setOrderStatus] = useState({ message: '', isError: false });

  const TAX_RATE = 0.1; // 10% tax
  const API_BASE_URL = 'http://localhost:5000';

  // Custom fetch wrapper (Still needed to fetch product details)
  const api = {
    get: async (url) => {
      const response = await fetch(`${API_BASE_URL}${url}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Network response was not ok');
      }
      return response.json();
    },
    // Remove post, put, delete as cart operations are handled by the parent
    // post: async (url, data) => { ... }, // REMOVED
    // put: async (url, data) => { ... }, // REMOVED
    // delete: async (url) => { ... }, // REMOVED
  };

  // Fetch product details for the items in the cart
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (cartItems.length === 0) {
        setProducts({});
        return;
      }

      try {
        // Get all product IDs from the cart
        const productIds = cartItems.map(item => item.productId);
        // Fetch details for these specific products (or all if your API supports it)
        // For simplicity, we'll fetch all products again, but a more efficient API call would be better
        const productsData = await api.get('/api/products');

        const productMap = {};
        productsData.forEach(product => {
          productMap[product._id] = product;
        });

        setProducts(productMap);
      } catch (error) {
        console.error('Error fetching product details:', error);
        setOrderStatus({
          message: 'Failed to load product details.',
          isError: true
        });
      }
    };

    fetchProductDetails();
  }, [cartItems]); // Re-fetch product details when cartItems change

  // Calculate subtotal
  const getSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const product = products[item.productId];
      return total + (product ? product.price * item.quantity : 0);
    }, 0);
  };

  // Calculate tax
  const getTax = (subtotal) => {
    return subtotal * TAX_RATE;
  };

  // Calculate total
  const getTotal = (subtotal) => {
    return subtotal + getTax(subtotal);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const subtotal = getSubtotal();
  const tax = getTax(subtotal);
  const total = getTotal(subtotal);

  // isLoading is always false now
  // if (isLoading) {
  //   return (
  //     <div className="cart-page">
  //       <p>Loading your cart...</p>
  //     </div>
  //   );
  // }

  return (
    <div className="cart-page">
      <h2>Your Shopping Cart</h2>

      {/* Status Messages */}
      {orderStatus.message && (
        <div className={`status-message ${orderStatus.isError ? 'error' : 'success'}`}>
          <span>{orderStatus.message}</span>
          <button
            onClick={() => setOrderStatus({ message: '', isError: false })}
            className="close-button"
          >
            ×
          </button>
        </div>
      )}

      {/* Customer Name Input - REMOVED, handle in CheckoutPage */}
      {/* <div className="form-group">
        <label htmlFor="customerName">
          Customer Name
        </label>
        <input
          id="customerName"
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Enter your name"
          required
        />
      </div> */}

      {/* Empty Cart Message */}
      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <p>Your cart is empty</p>
        </div>
      ) : (
        <>
          {/* Cart Items */}
          <div className="cart-items">
            {cartItems.map((item) => {
              const product = products[item.productId] || {};
              return (
                <div key={item._id} className="cart-item">
                  {/* Product image placeholder */}
                  <div className="product-image">
                    <div className="image-placeholder" />
                  </div>

                  <div className="product-info">
                    {/* Display product name from fetched products */}
                    <h3>{product.name || "Product"}</h3>
                    {/* Display product price from fetched products */}
                    <p>{formatCurrency(product.price || 0)} each</p>
                  </div>

                  <div className="quantity-controls">
                    <button
                      // Call the updateCartItemQuantity prop function
                      onClick={() => updateCartItemQuantity(item._id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>

                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      // Call the updateCartItemQuantity prop function
                      onChange={(e) => updateCartItemQuantity(item._id, parseInt(e.target.value) || 1)}
                    />

                    <button
                      // Call the updateCartItemQuantity prop function
                      onClick={() => updateCartItemQuantity(item._id, item.quantity + 1)}
                    >
                      +
                    </button>

                    <button
                      // Call the removeFromCart prop function
                      onClick={() => removeFromCart(item._id)}
                      className="remove-button"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="item-total">
                    {/* Calculate total based on price from fetched products */}
                    <p>{formatCurrency((product.price || 0) * item.quantity)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cart Summary */}
          <div className="cart-summary">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>Tax (10%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            // Call the proceedToCheckout prop function
            onClick={() => proceedToCheckout(total)} // Pass the total to the parent
            disabled={isSubmitting || cartItems.length === 0}
            className="checkout-button"
          >
            Proceed to Checkout
          </button>
        </>
      )}

      <style jsx>{`
        .cart-page {
          max-width: 800px;
          margin: auto;
          padding: 20px;
          font-family: Arial, sans-serif;
        }

        h2 {
          margin-bottom: 20px;
          color: #333;
        }

        .status-message {
          padding: 10px 15px;
          margin-bottom: 20px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .status-message.error {
          background-color: #fee2e2;
          color: #b91c1c;
        }

        .status-message.success {
          background-color: #d1fae5;
          color: #047857;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: inherit;
        }

        /* .form-group styles removed as the input was removed */

        .empty-cart {
          text-align: center;
          padding: 40px 0;
          color: #666;
        }

        .cart-items {
          margin-bottom: 20px;
        }

        .cart-item {
          display: flex;
          align-items: center;
          padding: 15px 0;
          border-bottom: 1px solid #eee;
        }

        .product-image {
          width: 80px;
          margin-right: 15px;
        }

        .image-placeholder {
          width: 80px;
          height: 80px;
          background-color: #f0f0f0;
          border-radius: 4px;
        }

        .product-info {
          flex-grow: 1;
        }

        .product-info h3 {
          margin: 0 0 5px;
          font-size: 16px;
        }

        .product-info p {
          margin: 0;
          color: #666;
        }

        .quantity-controls {
          display: flex;
          align-items: center;
          margin: 0 15px;
        }

        .quantity-controls button {
          background-color: #f0f0f0;
          border: 1px solid #ddd;
          border-radius: 4px;
          width: 30px;
          height: 30px;
          font-size: 16px;
          cursor: pointer;
        }

        .quantity-controls button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .quantity-controls input {
          width: 40px;
          text-align: center;
          margin: 0 5px;
          padding: 5px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .remove-button {
          margin-left: 10px;
          padding: 5px 10px;
          background-color: #fff;
          color: #e53e3e;
          border: 1px solid #e53e3e;
          border-radius: 4px;
          cursor: pointer;
        }

        .remove-button:hover {
          background-color: #e53e3e;
          color: white;
        }

        .item-total {
          width: 80px;
          text-align: right;
          font-weight: bold;
        }

        .cart-summary {
          margin-top: 20px;
          padding: 15px;
          background-color: #f9f9f9;
          border-radius: 4px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
        }

        .summary-row.total {
          font-weight: bold;
          font-size: 18px;
          border-top: 1px solid #ddd;
          padding-top: 10px;
          margin-top: 5px;
        }

        .checkout-button {
          display: block;
          width: 100%;
          padding: 12px;
          margin-top: 20px;
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
        }

        .checkout-button:hover {
          background-color: #2563eb;
        }

        .checkout-button:disabled {
          background-color: #93c5fd;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default CartPage;