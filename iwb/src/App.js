import React, { useState } from "react";
//import './App.css'; // Import the CSS file
import RegisterPage from "./RegisterPage";
import LoginPage from "./LoginPage";
import HomePage from "./HomePage";
import ProductsPage from "./ProductsPage";
import ProductDetailPage from "./ProductDetailPage";
import CartPage from "./CartPage";
import SalesDashboard from "./SalesDashboard";
import FinanceDashboard from "./FinanceDashboard";
import AdminDashboard from "./AdminDashboard";
import CustomerDashboard from "./CustomerDashboard"; 
import CheckoutPage from "./CheckoutPage";
import ClientQueryPage from "./ClientQueryPage";
import AutomatedResponseInterface from "./AutomatedResponseInterface";

// Function to format currency
export const formatCurrency = (amount) => {
  return amount === undefined || amount === null || isNaN(amount)
    ? "M0.00"
    : `M${amount.toFixed(2)}`;
};

// Main App component
const App = () => {
  const [currentPage, setCurrentPage] = useState("home");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [salesRecords, setSalesRecords] = useState([]);
  const [queries, setQueries] = useState([]);

  // Handle user login and redirect to the appropriate dashboard based on role
  const handleLogin = (role) => {
    setIsLoggedIn(true);
    setUserRole(role);
    switch (role) {
      case "admin":
        setCurrentPage("AdminDashboard");
        break;
      case "sales":
        setCurrentPage("salesDashboard");
        break;
      case "finance":
        setCurrentPage("financeDashboard");
        break;
      case "customer":
        setCurrentPage("CustomerDashboard");
        break;
      default:
        setCurrentPage("home");
    }
  };

  // Handle logout and reset all states
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    setCurrentPage("home");
    setCartItems([]);
    alert("You have logged out successfully.");
  };

  // Register a new user
  const registerUser = async (newUser) => {
    try {
      const response = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        alert("Registration successful! Please log in using your credentials.");
        setCurrentPage("login");
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Registration failed! Please check your inputs.");
      }
    } catch (error) {
      alert("An error occurred during registration. Please try again.");
      console.error("Error during registration:", error);
    }
  };

  // Check user credentials and log in
  const checkUserCredentials = (email, password, role) => {
    handleLogin(role); // Call handleLogin to set userRole and navigate accordingly
  };

  // Navigate to a specific page
  const navigateTo = (page, product = null) => {
    if (page === "productDetail" && product) {
      setSelectedProduct(product);
    }
    setCurrentPage(page);
  };

  // Add item to cart
  const addToCart = (product, quantity = 1) => {
    const existingProduct = cartItems.find((item) => item.id === product.id);
    if (existingProduct) {
      setCartItems(
        cartItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity } 
            : item
        )
      );
    } else {
      setCartItems([...cartItems, { ...product, quantity }]);
    }
  };

  // Remove item from cart
  const removeFromCart = (id) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
  };

  // Update cart item quantity
  const updateCartItemQuantity = (id, quantity) => {
    if (quantity < 1) return;
    setCartItems(
      cartItems.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  // Place an order
  const handleOrderPlacement = (buyerInfo) => {
    console.log("Order placed for:", buyerInfo);
    setCartItems([]); // Clear the cart after placing the order
    alert("Order placed successfully!");
    setCurrentPage("home");
  };

  // Submit a client query
  const submitQuery = (newQuery) => {
    const queryWithId = { ...newQuery, id: Date.now(), status: "pending" };
    setQueries([...queries, queryWithId]);
    alert("Your query has been submitted successfully.");
  };

  // Mark a query as complete
  const markQueryAsComplete = (id) => {
    const updatedQueries = queries.map((query) =>
      query.id === id ? { ...query, status: "complete" } : query
    );
    setQueries(updatedQueries);
  };

  // Navigate back to home
  const handleBack = () => {
    setCurrentPage("home"); // Navigate back to home
  };

  return (
    <div className="app-container">
      <header className="app-header">
        {/* Navigation */}
        <nav className="app-navbar">
          {/* Show only Register and Login buttons for non-logged-in users */}
          {!isLoggedIn ? (
            <>
             
            </>
          ) : (
            <button className="nav-button" onClick={handleLogout}>Logout</button>
          )}
        </nav>
      </header>
      <main className="app-main">
        {/* Page Content */}
        {currentPage === "home" && <HomePage navigateTo={navigateTo} />}
        {currentPage === "register" && (
          <RegisterPage
            navigateTo={setCurrentPage}
            registerUser={registerUser}
          />
        )}
        {currentPage === "login" && (
          <LoginPage
            navigateTo={setCurrentPage}
            checkUserCredentials={checkUserCredentials}  // Pass the checkUserCredentials prop
          />
        )}
        {currentPage === "products" && (
          <ProductsPage
            navigateTo={navigateTo}
            addToCart={addToCart}
            formatCurrency={formatCurrency}
          />
        )}
        {currentPage === "productDetail" && (
          <ProductDetailPage product={selectedProduct} addToCart={addToCart} />
        )}
        {currentPage === "cart" && (
          <CartPage
            cartItems={cartItems.map((item) => ({
              ...item,
              price: formatCurrency(item.price),
            }))}
            removeFromCart={removeFromCart}
            proceedToCheckout={() => setCurrentPage("checkout")}
            updateCartItemQuantity={updateCartItemQuantity}
          />
        )}
        {currentPage === "checkout" && (
          <CheckoutPage
            cartItems={cartItems}
            totalAmount={cartItems.reduce(
              (sum, item) => sum + item.price * item.quantity,
              0
            )}
            onOrderPlaced={handleOrderPlacement}
          />
        )}
        {currentPage === "salesDashboard" && (
          <SalesDashboard
            salesRecords={salesRecords}
            setSalesRecords={setSalesRecords}
            queries={queries}
            setQueries={setQueries}
            handleBack={handleBack}
          />
        )}
        {currentPage === "financeDashboard" && (
          <FinanceDashboard
            incomeData={[
              { month: "January", totalIncome: 1000 },
              { month: "February", totalIncome: 1500 },
            ]}
          />
        )}
        {currentPage === "AdminDashboard" && (
          <AdminDashboard currentUser={{ role: userRole }} />
        )}
        {currentPage === "CustomerDashboard" && (
          <CustomerDashboard currentUser={{ name: "Customer", role: userRole }} handleBack={handleBack} />
        )}
        {currentPage === "clientQueries" && (
          <ClientQueryPage submitQuery={submitQuery} queries={queries} />
        )}
        {currentPage === "automatedResponses" && (
          <AutomatedResponseInterface
            queries={queries}
            markQueryAsComplete={markQueryAsComplete}
          />
        )}
        {isLoggedIn && userRole && (
          <div className="user-role">
            {`${userRole.charAt(0).toUpperCase() + userRole.slice(1)} Dashboard`}
          </div>
        )}
      </main>
    </div>
  );
};

// Export the App component as default
export default App;
