// ProductsPage.js
import React, { useState } from 'react';
import './ProductsPage.css';

const ProductsPage = ({ navigateTo, products, addToCart }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Function to handle search input
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    // Filter products based on search term
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div>
            <h2>Products and Services</h2>
            <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={handleSearch}
            />
            <div className="product-list">
                {currentProducts.map((product, index) => (
                    <div key={product._id} className="product-card" onClick={() => navigateTo(product)}>
                        <h3>{product.name}</h3>
                        <p>{product.description}</p>
                        <p>M {product.price.toFixed(2)}</p>
                        <ul>
                            {product.specifications.map((spec, idx) => (
                                <li key={idx}>{spec}</li>
                            ))}
                        </ul>
                        <button onClick={(e) => {
                            e.stopPropagation(); // Prevent navigation to detail page on button click
                            addToCart(product, 1);
                        }}>Add to Cart</button>
                    </div>
                ))}
            </div>
            <div className="pagination">
                {Array.from({ length: totalPages }, (_, index) => (
                    <button
                        key={index + 1}
                        onClick={() => setCurrentPage(index + 1)}
                        disabled={currentPage === index + 1}
                    >
                        {index + 1}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ProductsPage;