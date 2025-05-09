import React, { useState, useEffect } from "react";

// Input Field component used in the form
const InputField = ({ label, name, value, onChange, required, type = "text", placeholder }) => {
  return (
    <div className="input-container">
      <label htmlFor={name}>
        {label} {required && <span className="required">*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="input-field"
      />
    </div>
  );
};

// Accept navigation props
const CheckoutPage = ({ onReturnToCart, onContinueShopping }) => {
  // State for cart data (loaded from localStorage for display)
  const [cartItems, setCartItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  // userId is loaded but not sent to checkout route as per backend
  const [userId, setUserId] = useState('guest');

  // State for form and UI
  const [buyerInfo, setBuyerInfo] = useState({
    name: '',
    email: '',
    address: '',
    paymentInfo: '', // Placeholder for payment details
  });
  const [orderStatus, setOrderStatus] = useState(null); // 'success', 'error', or null
  const [loading, setLoading] = useState(false); // Loading state for API calls
  const [error, setError] = useState(null); // Error message state

  // API configuration
  const API_BASE_URL = 'http://localhost:5000';

  // Simple API wrapper for consistency
  const api = {
    get: async (url) => {
      const response = await fetch(`${API_BASE_URL}${url}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Attempt to parse error body
        throw new Error(errorData.error || `API GET error: ${response.status}`);
      }
      return response.json();
    },
    post: async (url, data) => {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Attempt to parse error body
        throw new Error(errorData.error || `API POST error: ${response.status}`);
      }
      return response.json();
    }
  };

  // Format currency: change from USD to M
  const formatCurrency = (amount) => {
    return `M${amount.toFixed(2)}`;
  };

  // Load cart items and buyer information when component mounts
  useEffect(() => {
    // Retrieve data from localStorage (used for displaying summary)
    const storedCartItems = JSON.parse(localStorage.getItem('checkoutCartItems') || '[]');
    const storedTotal = parseFloat(localStorage.getItem('checkoutTotal') || '0');
    const storedUserId = localStorage.getItem('checkoutUserId') || 'guest'; // Load user ID

    // Set cart state (for display purposes)
    setCartItems(storedCartItems);
    setTotalAmount(storedTotal);
    setUserId(storedUserId); // Keep userId state

    // Load buyer info from localStorage or initialize
    const storedBuyerInfo = JSON.parse(localStorage.getItem('buyerInfo') || '{}');
    setBuyerInfo({
      name: storedBuyerInfo.name || '',
      email: storedBuyerInfo.email || '',
      address: storedBuyerInfo.address || '',
      paymentInfo: storedBuyerInfo.paymentInfo || '',
    });

  }, []); // Empty dependency array means this runs only once on mount

  // Handle input changes and save to localStorage
  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedBuyerInfo = {
      ...buyerInfo,
      [name]: value,
    };

    // Update state and save to localStorage
    setBuyerInfo(updatedBuyerInfo);
    localStorage.setItem('buyerInfo', JSON.stringify(updatedBuyerInfo));
  };

  // Validate email format
  const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Sync cart with backend before checkout
  const syncCartWithBackend = async () => {
    try {
      await api.post("/api/cart/sync", {
        userId: userId,
        cartItems: cartItems.map(item => ({
          productId: item.productId || item._id,
          quantity: item.quantity
        }))
      });
      return true;
    } catch (error) {
      console.error("Error syncing cart:", error);
      setError("Failed to synchronize cart with server. Please try again.");
      return false;
    }
  };

  // Handle form submission
 const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    // Add validation if needed

    setLoading(true);
    try {
      // First sync the cart
      const syncSuccess = await syncCartWithBackend();
      if (!syncSuccess) return;

      // Then proceed with checkout
      const response = await api.post("/api/checkout", {
        customerName: buyerInfo.name,
        userId: userId,
      });

      // Assume success if no error thrown
      setOrderStatus('success');
    } catch (err) {
      setError(err.message || "An error occurred during checkout.");
      setOrderStatus('error');
    } finally {
      setLoading(false);
    }
  };

  // Navigation handlers
  const handleReturnToCart = () => {
    if (onReturnToCart) {
      onReturnToCart();
    } else {
      alert('Return to Cart navigation not configured.');
    }
  };

  const handleContinueShopping = () => {
    if (onContinueShopping) {
      onContinueShopping();
    } else {
      alert('Continue Shopping navigation not configured.');
    }
  };

  return (
    <div className="checkout-container">
      <h2>Checkout</h2>
      <div className="back-to-cart">
        <button onClick={handleReturnToCart} className="back-button">
          ← Back to Cart
        </button>
      </div>
      {orderStatus !== 'success' && <h4>Order Total: {formatCurrency(totalAmount)}</h4>}

      {error && <div className="error-message">{error}</div>}

      {orderStatus === 'success' ? (
        <div className="success-message">
          <h3>🎉 Thank you for your order!</h3>
          <p>Your order has been placed successfully.</p>
          {cartItems.length > 0 && (
            <>
              <h4>Order Summary</h4>
              <ul className="order-items">
                {cartItems.map(item => (
                  <li key={item._id || item.productId || item.name}>
                    <span className="item-name">{item.name || 'Product'}</span>
                    <span className="item-quantity">x{item.quantity}</span>
                    <span className="item-price">{formatCurrency((item.price || 0) * item.quantity)}</span>
                  </li>
                ))}
                <li className="order-total">
                  <span>Total:</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </li>
              </ul>
            </>
          )}
          {buyerInfo.email && <p>A confirmation email will be sent to {buyerInfo.email}</p>}
          <button onClick={handleContinueShopping} className="continue-shopping">
            Continue Shopping
          </button>
        </div>
      ) : orderStatus === 'error' ? (
        <div className="error-container">
          <h3>⚠️ Order Processing Error</h3>
          <p>{error || "There was an error processing your order. Please try again later."}</p>
          <button onClick={() => { setOrderStatus(null); setError(null); }} className="retry-button">
            Try Again
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="checkout-form">
          <div className="form-section">
            <h3>Customer Information</h3>
            <InputField
              label="Full Name"
              name="name"
              value={buyerInfo.name}
              onChange={handleChange}
              required
              placeholder="Enter your full name"
            />
            <InputField
              label="Email Address"
              name="email"
              value={buyerInfo.email}
              onChange={handleChange}
              required
              type="email"
              placeholder="Enter your email address"
            />
            <InputField
              label="Shipping Address"
              name="address"
              value={buyerInfo.address}
              onChange={handleChange}
              required
              placeholder="Enter your complete shipping address"
            />
          </div>

          <div className="form-section">
            <h3>Payment Information</h3>
            <InputField
              label="Credit Card Details"
              name="paymentInfo"
              value={buyerInfo.paymentInfo}
              onChange={handleChange}
              required
              placeholder="Enter your credit card number (placeholder)"
            />
          </div>

          <div className="order-summary">
            <h3>Order Summary</h3>
            {cartItems.length > 0 ? (
              <ul className="order-items">
                {cartItems.map(item => (
                  <li key={item._id || item.productId || item.name}>
                    <span className="item-name">{item.name || 'Product'}</span>
                    <span className="item-quantity">x{item.quantity}</span>
                    <span className="item-price">{formatCurrency((item.price || 0) * item.quantity)}</span>
                  </li>
                ))}
                <li className="order-total">
                  <span>Total:</span>
                  <span>{formatCurrency(totalAmount)}</span>
                </li>
              </ul>
            ) : (
              <p>Your cart is empty. Add items from the product page.</p>
            )}
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={loading || cartItems.length === 0}
          >
            {loading ? "Processing Order..." : "Place Order"}
          </button>
        </form>
      )}

      {/* Style block remains the same */}
      <style jsx>{`
        .checkout-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
        }

        h2 {
          margin-bottom: 10px;
          color: #333;
        }

        h4 {
          margin-bottom: 20px;
          color: #666;
        }

        .back-to-cart {
          margin-bottom: 20px;
        }

        .back-button {
          background: none;
          border: none;
          color: #3b82f6;
          cursor: pointer;
          font-size: 16px;
          padding: 0;
          display: flex;
          align-items: center;
        }

        .back-button:hover {
          text-decoration: underline;
        }

        .error-message {
          background-color: #fee2e2;
          color: #b91c1c;
          padding: 10px 15px;
          border-radius: 4px;
          margin-bottom: 20px;
        }

        .success-message {
          background-color: #d1fae5;
          color: #047857;
          padding: 20px;
          border-radius: 4px;
          margin-bottom: 20px;
        }

        .success-message h3 {
          margin-top: 0;
        }

        .success-message ul {
          padding-left: 20px;
        }

        .continue-shopping {
          background-color: #3b82f6;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          margin-top: 15px;
        }

        .continue-shopping:hover {
          background-color: #2563eb;
        }

        .error-container {
          background-color: #fee2e2;
          color: #b91c1c;
          padding: 20px;
          border-radius: 4px;
          margin-bottom: 20px;
        }

        .retry-button {
          background-color: #ef4444;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          margin-top: 10px;
        }

        .retry-button:hover {
          background-color: #dc2626;
        }

        .checkout-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-section {
          background-color: #f9fafb;
          padding: 20px;
          border-radius: 4px;
          border: 1px solid #e5e7eb;
        }

        .form-section h3 {
          margin-top: 0;
          margin-bottom: 15px;
          color: #374151;
        }

        .input-container {
          margin-bottom: 15px;
        }

        .input-container label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
          color: #4b5563;
        }

        .input-container .required {
          color: #ef4444;
        }

        .input-field {
          width: 100%;
          padding: 10px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 16px;
        }

        .input-field:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }

        .order-summary {
          background-color: #f9fafb;
          padding: 20px;
          border-radius: 4px;
          border: 1px solid #e5e7eb;
        }

        .order-summary h3 {
          margin-top: 0;
          margin-bottom: 15px;
          color: #374151;
        }

        .order-items {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .order-items li {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .order-items li:last-child {
          border-bottom: none;
        }

        .item-name {
          flex: 2;
          font-weight: 500;
        }

        .item-quantity {
          flex: 1;
          text-align: center;
          color: #6b7280;
        }

        .item-price {
          flex: 1;
          text-align: right;
          font-weight: 500;
        }

        .order-total {
          margin-top: 10px;
          font-weight: bold;
          color: #1f2937;
          border-top: 2px solid #e5e7eb !important;
          padding-top: 15px !important;
        }

        .submit-button {
          background-color: #3b82f6;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 4px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: background-color 0.2s;
          width: 100%;
          margin-top: 10px;
        }

        .submit-button:hover {
          background-color: #2563eb;
        }

        .submit-button:disabled {
          background-color: #93c5fd;
          cursor: not-allowed;
        }

        @media (max-width: 640px) {
          .checkout-container {
            padding: 15px;
          }
          .form-section,
          .order-summary {
            padding: 15px;
          }
          .input-field {
            padding: 8px;
          }
          .submit-button {
            padding: 10px 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default CheckoutPage;