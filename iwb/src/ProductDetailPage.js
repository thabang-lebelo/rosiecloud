import React, { useState } from 'react';

const ProductDetailPage = ({ product, addToCart }) => {
  const [quantity, setQuantity] = useState(1);

  if (!product) return <div>Product not found.</div>;

  // Function to handle quantity change
  const handleQuantityChange = (e) => {
    const value = Math.max(1, parseInt(e.target.value, 10)); // Ensure quantity is at least 1
    setQuantity(value);
  };

  return (
    <div>
      <h2>{product.name}</h2>
      <div className="product-gallery">
        {product.images.map((image, index) => (
          <img 
            key={index} 
            src={image} 
            alt={`${product.name} - ${index + 1}`} 
            className="product-image" // Optional: Add a class for CSS styling later
          />
        ))}
      </div>
      <p>Price: M {product.price.toFixed(2)}</p> {/* Changed to Maluti */}
      <p>{product.description}</p>
      <h4>Specifications:</h4>
      <ul>
        {product.specifications.map((spec, index) => (
          <li key={index}>{spec}</li>
        ))}
      </ul>
      <div>
        <label htmlFor="quantity">Quantity:</label>
        <input
          type="number"
          id="quantity"
          value={quantity}
          min="1"
          onChange={handleQuantityChange} // Use dedicated function
        />
        <button 
          onClick={() => {
            addToCart(product, quantity);
            alert(`${quantity} of ${product.name} added to cart!`);
          }} 
          disabled={quantity < 1} // Optional: Disable button until valid quantity is set
        >
          Add to Cart
        </button>
      </div>
      <h4>Reviews:</h4>
      <div>No reviews yet.</div>
    </div>
  );
};

export default ProductDetailPage;