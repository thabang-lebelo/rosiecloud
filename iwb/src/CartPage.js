import React, { useState, useEffect } from 'react';

const CartPage = ({ cartItems, removeFromCart, updateCartItemQuantity, proceedToCheckout }) => {
  const [products, setProducts] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderStatus, setOrderStatus] = useState({ message: '', isError: false });

  const TAX_RATE = 0.1; // 10% tax
  const API_BASE_URL = 'https://rosiecloud.onrender.com';

  // Custom fetch wrapper for product details
  const api = {
    get: async (url) => {
      const response = await fetch(`${API_BASE_URL}${url}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Network response was not ok');
      }
      return response.json();
    },
  };

  // Fetch product details for the items in the cart
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (cartItems.length === 0) {
        setProducts({});
        return;
      }

      try {
        const productIds = cartItems.map(item => item.productId);
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
  }, [cartItems]);

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

  // Format currency: change from USD to 'M'
  const formatCurrency = (amount) => {
    return `M${amount.toFixed(2)}`;
  };

  const subtotal = getSubtotal();
  const tax = getTax(subtotal);
  const total = getTotal(subtotal);

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h1>Shopping Cart</h1>
        {cartItems.length > 0 && (
          <span className="cart-count">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</span>
        )}
      </div>

      {/* Status Messages */}
      {orderStatus.message && (
        <div className={`status-message ${orderStatus.isError ? 'error' : 'success'}`}>
          <span>{orderStatus.message}</span>
          <button
            onClick={() => setOrderStatus({ message: '', isError: false })}
            className="close-button"
            aria-label="Close message"
          >
            ×
          </button>
        </div>
      )}

      {/* Cart Content */}
      <div className="cart-content">
        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <svg className="empty-cart-icon" viewBox="0 0 24 24" width="64" height="64">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added any products to your cart yet.</p>
          </div>
        ) : (
          <>
            <div className="cart-items-container">
              <table className="cart-items-table">
                <thead>
                  <tr>
                    <th className="product-col">Product</th>
                    <th className="price-col">Price</th>
                    <th className="quantity-col">Quantity</th>
                    <th className="total-col">Total</th>
                    <th className="actions-col"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item) => {
                    const product = products[item.productId] || {};
                    return (
                      <tr key={item._id} className="cart-item">
                        <td className="product-col">
                          <div className="product-details">
                            <div className="product-image">
                              <div className="image-placeholder" />
                            </div>
                            <div className="product-info">
                              <h3>{product.name || "Product"}</h3>
                              {product.category && <p className="product-category">{product.category}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="price-col">{formatCurrency(product.price || 0)}</td>
                        <td className="quantity-col">
                          <div className="quantity-controls">
                            <button
                              onClick={() => updateCartItemQuantity(item._id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="quantity-btn"
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateCartItemQuantity(item._id, parseInt(e.target.value) || 1)}
                              className="quantity-input"
                              aria-label="Product quantity"
                            />
                            <button
                              onClick={() => updateCartItemQuantity(item._id, item.quantity + 1)}
                              className="quantity-btn"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="total-col">{formatCurrency((product.price || 0) * item.quantity)}</td>
                        <td className="actions-col">
                          <button
                            onClick={() => removeFromCart(item._id)}
                            className="remove-button"
                            aria-label="Remove item"
                          >
                            <svg viewBox="0 0 24 24" width="16" height="16">
                              <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="cart-summary-container">
              <div className="cart-summary">
                <h2>Order Summary</h2>
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="summary-row">
                  <span>Tax (10%)</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <div className="summary-row shipping">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="summary-divider"></div>
                <div className="summary-row total">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <button
                  onClick={() => proceedToCheckout(total)}
                  disabled={isSubmitting || cartItems.length === 0}
                  className="checkout-button"
                >
                  {isSubmitting ? 'Processing...' : 'Proceed to Checkout'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        /* Global Styles */
        .cart-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          color: #333;
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }

        /* Cart Header */
        .cart-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 2rem;
          border-bottom: 1px solid #eaeaea;
          padding-bottom: 1rem;
        }

        .cart-header h1 {
          font-size: 1.75rem;
          font-weight: 600;
          color: #111827;
          margin: 0;
        }

        .cart-count {
          font-size: 1rem;
          color: #6b7280;
        }

        /* Status Messages */
        .status-message {
          padding: 1rem;
          margin-bottom: 1.5rem;
          border-radius: 0.375rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          animation: fadeIn 0.3s ease-in-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .status-message.error {
          background-color: #fee2e2;
          color: #b91c1c;
          border-left: 4px solid #ef4444;
        }

        .status-message.success {
          background-color: #d1fae5;
          color: #047857;
          border-left: 4px solid #10b981;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          color: inherit;
          padding: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          line-height: 1;
        }

        .close-button:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }

        /* Cart Content */
        .cart-content {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        @media (min-width: 1024px) {
          .cart-content {
            flex-direction: row;
            align-items: flex-start;
          }

          .cart-items-container {
            flex: 1 1 65%;
          }

          .cart-summary-container {
            flex: 1 1 35%;
          }
        }

        /* Empty Cart */
        .empty-cart {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          text-align: center;
          background-color: #f9fafb;
          border-radius: 0.5rem;
          border: 1px dashed #d1d5db;
        }

        .empty-cart-icon {
          color: #9ca3af;
          margin-bottom: 1.5rem;
        }

        .empty-cart h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0 0 0.5rem;
          color: #111827;
        }

        .empty-cart p {
          color: #6b7280;
          max-width: 24rem;
          margin: 0;
        }

        /* Cart Items Table */
        .cart-items-container {
          width: 100%;
          overflow-x: auto;
        }

        .cart-items-table {
          width: 100%;
          border-collapse: collapse;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
          border-radius: 0.5rem;
          background-color: white;
          overflow: hidden;
        }

        .cart-items-table th {
          background-color: #f9fafb;
          padding: 0.75rem 1rem;
          text-align: left;
          font-weight: 500;
          color: #4b5563;
          font-size: 0.875rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .cart-items-table td {
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
          vertical-align: middle;
        }

        .cart-items-table tr:last-child td {
          border-bottom: none;
        }

        .cart-item:hover {
          background-color: #f9fafb;
        }

        /* Product Column */
        .product-details {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .product-image {
          flex-shrink: 0;
        }

        .image-placeholder {
          width: 64px;
          height: 64px;
          background-color: #f3f4f6;
          border-radius: 0.375rem;
          border: 1px solid #e5e7eb;
        }

        .product-info h3 {
          margin: 0 0 0.25rem;
          font-size: 1rem;
          font-weight: 500;
          color: #111827;
        }

        .product-category {
          margin: 0;
          font-size: 0.875rem;
          color: #6b7280;
        }

        /* Price Column */
        .price-col {
          white-space: nowrap;
          color: #4b5563;
          font-size: 0.9375rem;
        }

        /* Quantity Column */
        .quantity-controls {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          max-width: 120px;
        }

        .quantity-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          background-color: #f9fafb;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 1rem;
          cursor: pointer;
          color: #4b5563;
          transition: all 0.15s ease;
        }

        .quantity-btn:hover:not(:disabled) {
          background-color: #f3f4f6;
          border-color: #9ca3af;
        }

        .quantity-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .quantity-input {
          width: 2.5rem;
          height: 2rem;
          text-align: center;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          padding: 0 0.25rem;
          -moz-appearance: textfield;
          appearance: textfield;
        }

        .quantity-input::-webkit-outer-spin-button,
        .quantity-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        /* Total Column */
        .total-col {
          white-space: nowrap;
          font-weight: 500;
          color: #111827;
        }

        /* Actions Column */
        .actions-col {
          text-align: right;
          width: 50px;
        }

        .remove-button {
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          transition: all 0.15s ease;
        }

        .remove-button:hover {
          background-color: #fee2e2;
          color: #b91c1c;
        }

        /* Cart Summary */
        .cart-summary {
          background-color: white;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
          padding: 1.5rem;
          position: sticky;
          top: 2rem;
        }

        .cart-summary h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 0;
          margin-bottom: 1.5rem;
          color: #111827;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 0.75rem 0;
          color: #4b5563;
        }

        .summary-row.shipping {
          color: #047857;
        }

        .summary-divider {
          height: 1px;
          background-color: #e5e7eb;
          margin: 0.75rem 0;
        }

        .summary-row.total {
          color: #111827;
          font-weight: 600;
          font-size: 1.125rem;
        }

        .checkout-button {
          display: block;
          width: 100%;
          padding: 0.875rem 1.5rem;
          margin-top: 1.5rem;
          background-color: #4f46e5;
          color: white;
          border: none;
          border-radius: 0.375rem;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.15s ease;
          line-height: 1.5;
        }

        .checkout-button:hover:not(:disabled) {
          background-color: #4338ca;
        }

        .checkout-button:disabled {
          background-color: #a5b4fc;
          cursor: not-allowed;
        }

        /* Responsive Adjustments */
        @media (max-width: 768px) {
          .cart-container {
            padding: 1rem;
          }

          .cart-items-table {
            font-size: 0.875rem;
          }

          .product-info h3 {
            font-size: 0.9375rem;
          }

          .price-col, .quantity-col, .total-col {
            font-size: 0.875rem;
          }

          .cart-summary {
            margin-top: 2rem;
          }
        }

        @media (max-width: 640px) {
          .product-col, .price-col, .quantity-col, .total-col, .actions-col {
            padding: 0.75rem 0.5rem;
          }

          .image-placeholder {
            width: 48px;
            height: 48px;
          }

          .quantity-controls {
            max-width: 100px;
          }

          .quantity-btn, .quantity-input {
            width: 1.75rem;
            height: 1.75rem;
          }
          
          .cart-items-table thead {
            display: none;
          }
          
          .cart-items-table, .cart-items-table tbody, .cart-items-table tr, .cart-items-table td {
            display: block;
            width: 100%;
          }
          
          .cart-item {
            position: relative;
            padding: 1rem 0;
            display: grid;
            grid-template-columns: auto 1fr;
            grid-template-areas:
              "image info"
              "image price"
              "quantity quantity"
              "total actions";
            gap: 0.5rem;
          }
          
          .product-details {
            grid-area: info;
            flex-direction: column;
            align-items: flex-start;
          }
          
          .product-image {
            grid-area: image;
          }
          
          .price-col {
            grid-area: price;
          }
          
          .price-col::before {
            content: "Price: ";
            font-weight: 500;
          }
          
          .quantity-col {
            grid-area: quantity;
            padding-top: 0.5rem;
          }
          
          .total-col {
            grid-area: total;
          }
          
          .total-col::before {
            content: "Total: ";
            font-weight: 500;
          }
          
          .actions-col {
            grid-area: actions;
            text-align: right;
          }
        }
      `}</style>
    </div>
  );
};

export default CartPage;
