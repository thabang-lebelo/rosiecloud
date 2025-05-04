// OnlineTransactions.js
import React, { useState } from 'react';
import axios from 'axios';

const OnlineTransactions = ({ close }) => {
  const [transactionDetails, setTransactionDetails] = useState({
    amount: '',
    recipient: '',
    description: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTransactionDetails({ ...transactionDetails, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/online-transactions', transactionDetails);
      alert(response.data.message || 'Transaction successful!');
      close(); // Close the widget after success
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to process transaction.');
    }
  };

  return (
    <div>
      <h3>Online Transactions</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="recipient"
          placeholder="Recipient"
          value={transactionDetails.recipient}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="amount"
          placeholder="Amount"
          value={transactionDetails.amount}
          onChange={handleChange}
          required
        />
        <textarea
          name="description"
          placeholder="Transaction Description"
          value={transactionDetails.description}
          onChange={handleChange}
        />
        <button type="submit">Submit Transaction</button>
      </form>
      <button onClick={close}>Cancel</button>
    </div>
  );
};

export default OnlineTransactions;