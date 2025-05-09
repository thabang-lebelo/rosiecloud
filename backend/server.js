// Import required modules
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();
const natural = require('natural');
const { TfIdf } = natural;
const tokenizer = new natural.WordTokenizer();

// Initialize Express app
const app = express();

// Middleware setup
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json()); // Parse JSON request bodies

// =================== Database Connection ===================

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log("MongoDB Connected");
})
.catch((err) => {
  console.error("MongoDB connection error:", err);
});

// =================== Schema Definitions ===================

// =================== Sales Record Schema ===================
const SalesRecordSchema = new mongoose.Schema({
  date: { type: String, required: true },
  items: { type: [String], required: true },
  Price: { type: Number, required: true },
  customer: { type: String, required: true },
}, { timestamps: true });

const SalesRecord = mongoose.model("SalesRecord", SalesRecordSchema);

// =================== Product Schema ===================
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  specifications: { type: [String], required: true },
}, { timestamps: true });

const Product = mongoose.model("Product", ProductSchema);

// =================== Cart Item Schema ===================
const CartItemSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  productId: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
}, { timestamps: true });

const CartItem = mongoose.model("CartItem", CartItemSchema);

// =================== User Schema ===================
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Plaintext, insecure for production
  role: { type: String, required: true },
}, { timestamps: true });

const User = mongoose.model("User", UserSchema);

// =================== Automated Response Schema ===================
const AutomatedResponseSchema = new mongoose.Schema({
  keywords: { type: [String], required: false },
  responseText: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

const AutomatedResponse = mongoose.model("AutomatedResponse", AutomatedResponseSchema);

// =================== Backup Schema ===================
const BackupSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  queries: { type: Array, required: true },
  responses: { type: Array, required: true },
}, { timestamps: true });

const Backup = mongoose.model("Backup", BackupSchema);

// =================== Query Schema ===================
const QuerySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  dateCreated: { type: Date, default: Date.now },
  status: { type: String, enum: ['open', 'resolved'], default: 'open' },
  resolvedBy: { type: String, required: false },
  resolutionDate: { type: Date, required: false },
  automatedResponse: { type: String, required: false },
  autoResolved: { type: Boolean, required: false },
}, { timestamps: true });

const Query = mongoose.model("Query", QuerySchema);

// =================== Utility Functions ===================

// Function to calculate similarity between two texts
const calculateSimilarity = (text1, text2) => {
  const tfidf = new TfIdf();
  tfidf.addDocument(text1);
  tfidf.addDocument(text2);
  const terms = new natural.WordTokenizer().tokenize(text1.toLowerCase());
  let similarityScore = 0;
  terms.forEach((term) => {
    const tfidfValue1 = tfidf.tfidf(term, 0);
    const tfidfValue2 = tfidf.tfidf(term, 1);
    if (tfidfValue1 > 0 && tfidfValue2 > 0) {
      similarityScore += tfidfValue1 * tfidfValue2;
    }
  });
  return similarityScore;
};

// Function to validate email format
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// =================== Routes ===================

// =================== User Routes ===================

// Register User
app.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "All fields (name, email, password, role) are required." });
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ error: "Invalid email format." });
  }
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists." });
    }
    const newUser = new User({ name, email, password, role });
    await newUser.save();
    res.status(201).json({ message: "User registered successfully!", user: newUser });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: "User registration failed." });
  }
});

// User Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }
  try {
    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    res.json({ user: { name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed." });
  }
});

// Get All Users
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users." });
  }
});

// Add User
app.post("/api/users", async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "All fields (name, email, password, role) are required." });
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ error: "Invalid email format." });
  }
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists." });
    }
    const newUser = new User({ name, email, password, role });
    await newUser.save();
    res.status(201).json({ message: "User added successfully!", user: newUser });
  } catch (err) {
    console.error("Error adding user:", err);
    if (err.code === 11000) {
      return res.status(400).json({ error: "Email already exists." });
    }
    res.status(500).json({ error: "Failed to add user." });
  }
});

// Update User
app.put("/api/users/:userId", async (req, res) => {
  const { userId } = req.params;
  const { name, email, role } = req.body;
  if (!name && !email && !role) {
    return res.status(400).json({ error: "At least one field (name, email, role) is required for update." });
  }
  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email, role },
      { new: true, omitUndefined: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found." });
    }
    res.json(updatedUser);
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: "Failed to update user." });
  }
});

// Delete User
app.delete("/api/users/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await User.findByIdAndDelete(userId);
    if (!result) {
      return res.status(404).json({ error: "User not found." });
    }
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Failed to delete user." });
  }
});

// =================== Sales Records Routes ===================

// Create a new sales record
app.post("/api/sales", async (req, res) => {
  const { date, items, Price, customer } = req.body;
  if (!date || !items || !Array.isArray(items) || items.length === 0 || Price == null || !customer) {
    return res.status(400).json({ error: "Missing required fields." });
  }
  try {
    const newSalesRecord = new SalesRecord({ date, items, Price, customer });
    await newSalesRecord.save();
    res.status(201).json({ message: "Sales record created.", salesRecord: newSalesRecord });
  } catch (err) {
    console.error("Error creating sales record:", err);
    res.status(500).json({ error: "Failed to create sales record." });
  }
});

// Retrieve all sales records
app.get("/api/sales", async (req, res) => {
  try {
    const sales = await SalesRecord.find();
    res.json(sales);
  } catch (err) {
    console.error("Error fetching sales records:", err);
    res.status(500).json({ error: "Failed to fetch sales records." });
  }
});

// Update a sales record
app.put("/api/sales/:recordId", async (req, res) => {
  const { recordId } = req.params;
  const { date, items, Price, customer } = req.body;
  if (!date && !items && Price == null && !customer) {
    return res.status(400).json({ error: "At least one field required for update." });
  }
  try {
    const updateData = {};
    if (date !== undefined) updateData.date = date;
    if (items !== undefined) updateData.items = items;
    if (Price !== undefined) updateData.Price = Price;
    if (customer !== undefined) updateData.customer = customer;

    const updatedRecord = await SalesRecord.findByIdAndUpdate(recordId, updateData, { new: true, omitUndefined: true });
    if (!updatedRecord) {
      return res.status(404).json({ error: "Sales record not found." });
    }
    res.json(updatedRecord);
  } catch (err) {
    console.error("Error updating sales record:", err);
    res.status(500).json({ error: "Failed to update sales record." });
  }
});

// Delete a sales record
app.delete("/api/sales/:recordId", async (req, res) => {
  const { recordId } = req.params;
  try {
    const result = await SalesRecord.findByIdAndDelete(recordId);
    if (!result) {
      return res.status(404).json({ error: "Sales record not found." });
    }
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting sales record:", err);
    res.status(500).json({ error: "Failed to delete sales record." });
  }
});

// =================== Products Routes ===================

// Create a new product
app.post("/api/products", async (req, res) => {
  const { name, description, price, specifications } = req.body;
  if (!name || !description || price == null || !specifications) {
    return res.status(400).json({ error: "Missing required fields." });
  }
  try {
    const newProduct = new Product({ name, description, price, specifications });
    await newProduct.save();
    res.status(201).json({ message: "Product created.", product: newProduct });
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).json({ error: "Failed to create product." });
  }
});

// Retrieve all products
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Failed to fetch products." });
  }
});

// Update a product
app.put("/api/products/:productId", async (req, res) => {
  const { productId } = req.params;
  const { name, description, price, specifications } = req.body;
  if (!name && !description && price == null && !specifications) {
    return res.status(400).json({ error: "At least one field required for update." });
  }
  try {
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price;
    if (specifications !== undefined) updateData.specifications = specifications;

    const updatedProduct = await Product.findByIdAndUpdate(productId, updateData, { new: true, omitUndefined: true });
    if (!updatedProduct) return res.status(404).json({ error: "Product not found." });
    res.json(updatedProduct);
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ error: "Failed to update product." });
  }
});

// Delete a product
app.delete("/api/products/:productId", async (req, res) => {
  const { productId } = req.params;
  try {
    const result = await Product.findByIdAndDelete(productId);
    if (!result) return res.status(404).json({ error: "Product not found." });
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ error: "Failed to delete product." });
  }
});

// =================== Customer Queries Routes ===================

// Get all queries
app.get("/api/queries", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  try {
    const totalCount = await Query.countDocuments();
    const queries = await Query.find()
      .sort({ createdAt: -1 }) // optional: latest first
      .skip(skip)
      .limit(limit);
    res.json({ queries, totalCount });
  } catch (err) {
    console.error("Error fetching queries:", err);
    res.status(500).json({ error: "Failed to fetch queries." });
  }
});

// Submit a new query
app.post("/api/queries", async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Name, email, and message are required." });
  }
  try {
    const newQuery = new Query({ name, email, message });
    await newQuery.save();
    res.status(201).json({ message: "Query submitted successfully!", query: newQuery });
  } catch (err) {
    console.error("Error submitting query:", err);
    res.status(500).json({ error: "Failed to submit query." });
  }
});

// Update a query (for resolving, auto-responding)
app.put("/api/queries/:queryId", async (req, res) => {
  const { queryId } = req.params;
  const { status, resolvedBy, resolutionDate, automatedResponse, autoResolved } = req.body;
  if (
    status === undefined &&
    resolvedBy === undefined &&
    resolutionDate === undefined &&
    automatedResponse === undefined &&
    autoResolved === undefined
  ) {
    return res.status(400).json({ error: "At least one field is required for update." });
  }

  const updateData = {};
  if (status !== undefined) updateData.status = status;
  if (resolvedBy !== undefined) updateData.resolvedBy = resolvedBy;
  if (resolutionDate !== undefined) updateData.resolutionDate = resolutionDate;
  if (automatedResponse !== undefined) updateData.automatedResponse = automatedResponse;
  if (autoResolved !== undefined) updateData.autoResolved = autoResolved;

  try {
    const updatedQuery = await Query.findByIdAndUpdate(queryId, updateData, { new: true, omitUndefined: true });
    if (!updatedQuery) return res.status(404).json({ error: "Query not found." });
    res.json(updatedQuery);
  } catch (err) {
    console.error("Error updating query:", err);
    res.status(500).json({ error: "Failed to update query." });
  }
});

// Delete a query
app.delete("/api/queries/:queryId", async (req, res) => {
  const { queryId } = req.params;
  try {
    const result = await Query.findByIdAndDelete(queryId);
    if (!result) return res.status(404).json({ error: "Query not found." });
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting query:", err);
    res.status(500).json({ error: "Failed to delete query." });
  }
});

// =================== Automated Response Routes ===================

// Get all automated responses
app.get("/api/responses", async (req, res) => {
  try {
    const responses = await AutomatedResponse.find();
    res.json(responses);
  } catch (err) {
    console.error("Error fetching responses:", err);
    res.status(500).json({ error: "Failed to fetch responses." });
  }
});

// Add a new automated response
app.post("/api/responses", async (req, res) => {
  const { keywords, responseText, isDefault } = req.body;
  if (!responseText) {
    return res.status(400).json({ error: "Response text is required." });
  }
  try {
    const newResponse = new AutomatedResponse({ keywords, responseText, isDefault });
    await newResponse.save();
    res.status(201).json({ message: "Automated response added.", response: newResponse });
  } catch (err) {
    console.error("Error adding response:", err);
    res.status(500).json({ error: "Failed to add response." });
  }
});

// Update an automated response
app.put("/api/responses/:responseId", async (req, res) => {
  const { responseId } = req.params;
  const { keywords, responseText, isDefault } = req.body;
  try {
    const updateData = {};
    if (keywords !== undefined) updateData.keywords = keywords;
    if (responseText !== undefined) updateData.responseText = responseText;
    if (isDefault !== undefined) updateData.isDefault = isDefault;

    const updatedResponse = await AutomatedResponse.findByIdAndUpdate(responseId, updateData, { new: true, omitUndefined: true });
    if (!updatedResponse) return res.status(404).json({ error: "Response not found." });
    res.json(updatedResponse);
  } catch (err) {
    console.error("Error updating response:", err);
    res.status(500).json({ error: "Failed to update response." });
  }
});

// Delete an automated response
app.delete("/api/responses/:responseId", async (req, res) => {
  const { responseId } = req.params;
  try {
    const result = await AutomatedResponse.findByIdAndDelete(responseId);
    if (!result) return res.status(404).json({ error: "Response not found." });
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting response:", err);
    res.status(500).json({ error: "Failed to delete response." });
  }
});

// =================== Backup and Restore ===================

// Save current queries and responses as backup
app.post("/api/backup", async (req, res) => {
  try {
    const queriesData = await Query.find().lean();
    const responsesData = await AutomatedResponse.find().lean();

    const backupData = {
      queries: queriesData,
      responses: responsesData,
      timestamp: new Date(),
    };

    const newBackup = new Backup(backupData);
    await newBackup.save();

    console.log("Backup saved to 'backups' collection");
    res.json({ message: "Backup completed and saved to database." });
  } catch (err) {
    console.error("Error during backup:", err);
    res.status(500).json({ error: "Failed to perform backup." });
  }
});

// Retrieve backup history
app.get("/api/backups", async (req, res) => {
  try {
    const backups = await Backup.find().sort({ timestamp: -1 });
    res.json(backups);
  } catch (err) {
    console.error("Error fetching backups:", err);
    res.status(500).json({ error: "Failed to fetch backups." });
  }
});

// =================== Auto-Respond to Specific Query ===================

app.post("/api/queries/:queryId/auto-respond", async (req, res) => {
  const { queryId } = req.params;
  try {
    const query = await Query.findById(queryId);
    if (!query) return res.status(404).json({ error: "Query not found." });
    if (query.status === 'resolved') return res.status(400).json({ error: "Query already resolved." });

    const predefinedResponses = await AutomatedResponse.find();

    let bestMatch = null;
    let highestSimilarity = -1;

    if (predefinedResponses.length > 0) {
      predefinedResponses.forEach((response) => {
        const keywords = response.keywords || [];
        const keywordMatch = keywords.some((keyword) =>
          query.message.toLowerCase().includes(keyword.toLowerCase())
        );
        if (keywordMatch) {
          if (highestSimilarity < 1) {
            highestSimilarity = 1;
            bestMatch = response;
          }
        } else {
          const similarity = calculateSimilarity(query.message, response.responseText);
          if (similarity > highestSimilarity) {
            highestSimilarity = similarity;
            bestMatch = response;
          }
        }
      });
    }

    if (!bestMatch || highestSimilarity < 0.2) {
      bestMatch =
        predefinedResponses.find((r) => r.isDefault) ||
        { responseText: "Thank you for your query. Our team will get back to you shortly." };
    }

    // Update query status
    const updatedQuery = await Query.findByIdAndUpdate(
      query._id,
      {
        status: 'resolved',
        automatedResponse: bestMatch.responseText,
        autoResolved: true,
        resolutionDate: new Date(),
        resolvedBy: 'Automated System',
      },
      { new: true }
    );

    res.json(updatedQuery);
  } catch (err) {
    console.error("Error auto-responding to query:", err);
    res.status(500).json({ error: "Failed to auto-respond to query." });
  }
});

// =================== Auto-Respond to All Pending Queries ===================

app.post("/api/queries/auto-respond-all-pending", async (req, res) => {
  try {
    const pendingQueries = await Query.find({ status: { $ne: 'resolved' } });
    const responses = await AutomatedResponse.find();

    let processedCount = 0;
    const updatedQueries = [];

    for (const query of pendingQueries) {
      let bestMatch = null;
      let highestSimilarity = -1;

      if (responses.length > 0) {
        responses.forEach((response) => {
          const keywords = response.keywords || [];
          const keywordMatch = keywords.some((keyword) =>
            query.message.toLowerCase().includes(keyword.toLowerCase())
          );
          if (keywordMatch) {
            if (highestSimilarity < 1) {
              highestSimilarity = 1;
              bestMatch = response;
            }
          } else {
            const similarity = calculateSimilarity(query.message, response.responseText);
            if (similarity > highestSimilarity) {
              highestSimilarity = similarity;
              bestMatch = response;
            }
          }
        });
      }

      if (!bestMatch || highestSimilarity < 0.2) {
        bestMatch =
          responses.find((r) => r.isDefault) ||
          { responseText: "Thank you for your query. Our team will get back to you shortly." };
      }

      // Update query
      const updatedQuery = await Query.findByIdAndUpdate(
        query._id,
        {
          status: 'resolved',
          automatedResponse: bestMatch.responseText,
          autoResolved: true,
          resolutionDate: new Date(),
          resolvedBy: 'Automated System',
        },
        { new: true }
      );
      updatedQueries.push(updatedQuery);
      processedCount++;
    }

    res.json({
      message: `Automatically responded to ${processedCount} queries`,
      processedCount,
      updatedQueries,
    });
  } catch (err) {
    console.error("Error auto-responding to all:", err);
    res.status(500).json({ error: "Failed to auto-respond to all queries." });
  }
});

// =================== Server Backup & Restore APIs ===================

// Save current queries and responses as backup
app.post("/api/backup", async (req, res) => {
  try {
    const queriesData = await Query.find().lean();
    const responsesData = await AutomatedResponse.find().lean();

    const backupData = {
      queries: queriesData,
      responses: responsesData,
      timestamp: new Date(),
    };

    const newBackup = new Backup(backupData);
    await newBackup.save();

    console.log("Backup saved to 'backups' collection");
    res.json({ message: "Backup completed and saved to database." });
  } catch (err) {
    console.error("Error during backup:", err);
    res.status(500).json({ error: "Failed to perform backup." });
  }
});

// Fetch backup history
app.get("/api/backups", async (req, res) => {
  try {
    const backups = await Backup.find().sort({ timestamp: -1 });
    res.json(backups);
  } catch (err) {
    console.error("Error fetching backups:", err);
    res.status(500).json({ error: "Failed to fetch backups." });
  }
});

// Optional: Restore from a specific backup (commented out for safety)
/*
app.post("/api/restore/:backupId", async (req, res) => {
  const { backupId } = req.params;
  try {
    const backupRecord = await Backup.findById(backupId);
    if (!backupRecord) return res.status(404).json({ error: "Backup not found." });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await Query.deleteMany({}, { session });
      await AutomatedResponse.deleteMany({}, { session });

      // Insert queries
      if (backupRecord.queries && backupRecord.queries.length > 0) {
        const queriesToInsert = backupRecord.queries.map((q) => ({
          name: q.name,
          email: q.email,
          message: q.message,
          dateCreated: q.dateCreated,
          status: q.status,
          resolvedBy: q.resolvedBy,
          resolutionDate: q.resolutionDate,
          automatedResponse: q.automatedResponse,
          autoResolved: q.autoResolved,
        }));
        await Query.insertMany(queriesToInsert, { session });
      }
      // Insert responses
      if (backupRecord.responses && backupRecord.responses.length > 0) {
        const responsesToInsert = backupRecord.responses.map((r) => ({
          keywords: r.keywords,
          responseText: r.responseText,
          isDefault: r.isDefault,
        }));
        await AutomatedResponse.insertMany(responsesToInsert, { session });
      }

      await session.commitTransaction();
      session.endSession();
      res.json({ message: "Data restored from backup successfully." });
    } catch (txErr) {
      await session.abortTransaction();
      session.endSession();
      console.error("Transaction error during restore:", txErr);
      res.status(500).json({ error: "Restore transaction failed." });
    }
  } catch (err) {
    console.error("Error initiating restore:", err);
    res.status(500).json({ error: "Failed to initiate restore." });
  }
});
*/

// =================== Cart Management APIs ===================

// Add item to cart
app.post("/api/cart", async (req, res) => {
  const { userId, productId, quantity } = req.body;
  if (!userId || !productId || quantity == null) {
    return res.status(400).json({ error: "userId, productId, and quantity are required." });
  }
  try {
    const existingItem = await CartItem.findOne({ userId, productId });
    if (existingItem) {
      existingItem.quantity += quantity;
      await existingItem.save();
      return res.json({ message: "Cart item updated.", cartItem: existingItem });
    }
    const newItem = new CartItem({ userId, productId, quantity });
    await newItem.save();
    res.status(201).json({ message: "Cart item added.", cartItem: newItem });
  } catch (err) {
    console.error("Error adding cart item:", err);
    res.status(500).json({ error: "Failed to add cart item." });
  }
});

// Get cart items for a user
app.get("/api/cart/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const items = await CartItem.find({ userId });
    res.json(items);
  } catch (err) {
    console.error("Error fetching cart items:", err);
    res.status(500).json({ error: "Failed to fetch cart items." });
  }
});

// Update cart item quantity
app.put("/api/cart/:itemId", async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;
  if (quantity == null) {
    return res.status(400).json({ error: "Quantity is required." });
  }
  try {
    const updatedItem = await CartItem.findByIdAndUpdate(itemId, { quantity }, { new: true });
    if (!updatedItem) return res.status(404).json({ error: "Cart item not found." });
    res.json(updatedItem);
  } catch (err) {
    console.error("Error updating cart item:", err);
    res.status(500).json({ error: "Failed to update cart." });
  }
});

// Remove item from cart
app.delete("/api/cart/:itemId", async (req, res) => {
  const { itemId } = req.params;
  try {
    const result = await CartItem.findByIdAndDelete(itemId);
    if (!result) return res.status(404).json({ error: "Cart item not found." });
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting cart item:", err);
    res.status(500).json({ error: "Failed to delete cart item." });
  }
});

// Checkout process
app.post("/api/checkout", async (req, res) => {
  try {
    const { customerName, userId } = req.body;
    const cartItems = await CartItem.find({ userId });
    if (cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    let totalPrice = 0;
    const itemsDescription = [];

    for (const item of cartItems) {
      const product = await Product.findById(item.productId);
      if (product) {
        totalPrice += product.price * item.quantity;
        itemsDescription.push(`${product.name}(Quantity:${item.quantity})`);
      }
    }

    const dateNow = new Date().toISOString();
    const newSalesRecord = new SalesRecord({
      date: dateNow,
      items: itemsDescription,
      Price: totalPrice,
      customer: customerName,
    });
    await newSalesRecord.save();

    await CartItem.deleteMany({ userId }); // Empty user's cart after checkout

    res.json({ message: "Order Placed Successfully!", salesRecord: newSalesRecord });
  } catch (err) {
    console.error('Error During Checkout:', err);
    res.status(500).json({ error: "Failed to process checkout." });
  }
});

/* -------- API: Sync Cart (New Endpoint) -------- */

app.post("/api/cart/sync", async (req, res) => {
  const { userId, cartItems } = req.body;
  try {
    // Remove existing cart items
    await CartItem.deleteMany({ userId });
    // Insert new cart items if provided
    if (cartItems && Array.isArray(cartItems) && cartItems.length > 0) {
      const insertItems = cartItems.map(item => ({
        userId,
        productId: item.productId,
        quantity: item.quantity,
      }));
      await CartItem.insertMany(insertItems);
    }
    res.status(200).json({ message: "Cart synchronized successfully" });
  } catch (err) {
    console.error("Error synchronizing cart:", err);
    res.status(500).json({ error: "Failed to synchronize cart: " + err.message });
  }
});

// =================== Server Initialization ===================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});