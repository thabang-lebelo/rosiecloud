// RegisterPage.js
import React, { useState } from 'react';

const RegisterPage = ({ navigateTo, registerUser }) => {
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: ""
    });
    
    const [error, setError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prevForm) => ({
            ...prevForm,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        
        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match. Please try again.");
            return;
        }
        
        if (!form.name || !form.email || !form.password || !form.role) {
            setError("All fields are required to create your account.");
            return;
        }

        await registerUser(form);
    };

    return (
        <div
            className="register-container"
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                backgroundColor: '#f1f5f9',
            }}
        >
            {/* Header */}
            <div
                style={{
                    width: '100%',
                    maxWidth: '550px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                }}
            >
                <h1 
                    style={{ 
                        fontSize: '22px', 
                        color: '#0f172a',
                        cursor: 'pointer',
                    }}
                    onClick={() => navigateTo("home")}
                >
                    Innovative Waste Bins
                </h1>
                <button
                    onClick={() => navigateTo("home")}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: 'transparent',
                        color: '#1e40af',
                        border: '1px solid #1e40af',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                    }}
                >
                    Return to Home
                </button>
            </div>

            {/* Registration Form Card */}
            <div
                style={{
                    width: '100%',
                    maxWidth: '550px',
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                    padding: '40px',
                }}
            >
                <h2
                    style={{
                        color: '#0f172a',
                        fontSize: '24px',
                        marginBottom: '24px',
                        fontWeight: '600',
                        textAlign: 'center',
                    }}
                >
                    Create Your Account
                </h2>

                {error && (
                    <div
                        style={{
                            padding: '12px 16px',
                            backgroundColor: '#fef2f2',
                            border: '1px solid #ef4444',
                            borderRadius: '4px',
                            color: '#b91c1c',
                            fontSize: '14px',
                            marginBottom: '20px',
                        }}
                    >
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label
                            htmlFor="name"
                            style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '14px',
                                color: '#334155',
                                fontWeight: '500',
                            }}
                        >
                            Full Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            required
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '4px',
                                fontSize: '16px',
                                color: '#0f172a',
                                outline: 'none',
                                transition: 'border-color 0.15s ease-in-out',
                                boxSizing: 'border-box',
                            }}
                            placeholder="Enter your full name"
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label
                            htmlFor="email"
                            style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '14px',
                                color: '#334155',
                                fontWeight: '500',
                            }}
                        >
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '4px',
                                fontSize: '16px',
                                color: '#0f172a',
                                outline: 'none',
                                transition: 'border-color 0.15s ease-in-out',
                                boxSizing: 'border-box',
                            }}
                            placeholder="example@company.com"
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label
                            htmlFor="password"
                            style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '14px',
                                color: '#334155',
                                fontWeight: '500',
                            }}
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '4px',
                                fontSize: '16px',
                                color: '#0f172a',
                                outline: 'none',
                                transition: 'border-color 0.15s ease-in-out',
                                boxSizing: 'border-box',
                            }}
                            placeholder="Create a secure password"
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label
                            htmlFor="confirmPassword"
                            style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '14px',
                                color: '#334155',
                                fontWeight: '500',
                            }}
                        >
                            Confirm Password
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            name="confirmPassword"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            required
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '4px',
                                fontSize: '16px',
                                color: '#0f172a',
                                outline: 'none',
                                transition: 'border-color 0.15s ease-in-out',
                                boxSizing: 'border-box',
                            }}
                            placeholder="Re-enter your password"
                        />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label
                            htmlFor="role"
                            style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '14px',
                                color: '#334155',
                                fontWeight: '500',
                            }}
                        >
                            User Role
                        </label>
                        <select
                            id="role"
                            name="role"
                            value={form.role}
                            onChange={handleChange}
                            required
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '4px',
                                fontSize: '16px',
                                color: '#0f172a',
                                backgroundColor: '#fff',
                                outline: 'none',
                                transition: 'border-color 0.15s ease-in-out',
                                boxSizing: 'border-box',
                                appearance: 'none',
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23334155' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 12px center',
                            }}
                        >
                            <option value="">Select Role</option>
                            <option value="sales">Sales Personnel</option>
                            <option value="finance">Finance Personnel</option>
                            <option value="admin">Administrator</option>
                            <option value="customer">Customer</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <button
                            type="submit"
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: '#1e40af',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '16px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'background-color 0.15s ease-in-out',
                            }}
                        >
                            Create Account
                        </button>
                        
                        <div
                            style={{
                                width: '100%',
                                textAlign: 'center',
                                position: 'relative',
                                margin: '16px 0',
                            }}
                        >
                            <div 
                                style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: 0,
                                    right: 0,
                                    height: '1px',
                                    backgroundColor: '#e2e8f0',
                                    zIndex: 1,
                                }}
                            />
                            <span
                                style={{
                                    position: 'relative',
                                    zIndex: 2,
                                    backgroundColor: '#fff',
                                    padding: '0 12px',
                                    color: '#64748b',
                                    fontSize: '14px',
                                }}
                            >
                                Already have an account?
                            </span>
                        </div>
                        
                        <button
                            type="button"
                            onClick={() => navigateTo("login")}
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: 'transparent',
                                color: '#1e40af',
                                border: '1px solid #1e40af',
                                borderRadius: '4px',
                                fontSize: '16px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'background-color 0.15s ease-in-out',
                            }}
                        >
                            Sign In
                        </button>
                    </div>
                </form>
            </div>

            {/* Footer */}
            <div
                style={{
                    marginTop: '40px',
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: '12px',
                }}
            >
                <p>© {new Date().getFullYear()} Innovative Waste Bins. All rights reserved.</p>
                <p style={{ marginTop: '8px' }}>
                    <span style={{ margin: '0 8px', cursor: 'pointer' }}>Privacy Policy</span>
                    <span style={{ margin: '0 8px', cursor: 'pointer' }}>Terms of Service</span>
                    <span style={{ margin: '0 8px', cursor: 'pointer' }}>Support</span>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;