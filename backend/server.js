const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

// Add natural for text similarity on the backend
const natural = require('natural');
const tokenizer = new natural.WordTokenizer();
const { TfIdf } = natural;

const app = express();
app.use(cors()); // Allow CORS for all routes
app.use(bodyParser.json()); // Parse JSON bodies

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("MongoDB Connected"))
.catch(err => console.error("MongoDB connection error:", err));


// Sales Record Schema Definition
const SalesRecordSchema = new mongoose.Schema({
    date: { type: String, required: true },
    items: { type: [String], required: true },
    Price: { type: Number, required: true },
    customer: { type: String, required: true }, // Customer's name
});

const SalesRecord = mongoose.model("SalesRecord", SalesRecordSchema);

// Product Schema Definition
const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    specifications: { type: [String], required: true },
});

const Product = mongoose.model("Product", ProductSchema);

// Cart Item Schema Definition
const CartItemSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // Reference to the user owning the cart
    productId: { type: String, required: true }, // ID of the product
    quantity: { type: Number, required: true, default: 1 } // Quantity of the product
});

const CartItem = mongoose.model("CartItem", CartItemSchema);

// User Schema Definition
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true }, // Email must be unique
    password: { type: String, required: true }, // Password stored in plaintext (not recommended)
    role: { type: String, required: true },
});

const User = mongoose.model("User", UserSchema);

// Automated Response Schema Definition
const AutomatedResponseSchema = new mongoose.Schema({
    keywords: { type: [String], required: false }, // Keywords to match
    responseText: { type: String, required: true }, // The actual response text
    isDefault: { type: Boolean, default: false } // Whether this is the default response
});

const AutomatedResponse = mongoose.model("AutomatedResponse", AutomatedResponseSchema);

// --- Backup Schema Definition (NEW) ---
const BackupSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    queries: { type: Array, required: true }, // Store queries as an array of objects
    responses: { type: Array, required: true }, // Store automated responses as an array of objects
    // You could add other data here like sales records, products, etc.
    // salesRecords: { type: Array, required: false },
    // products: { type: Array, required: false },
});

const Backup = mongoose.model("Backup", BackupSchema);
// --- End of Backup Schema Definition ---


// User Registration Route
app.post("/register", async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: "All fields (name, email, password, role) are required!" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
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
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "User registration failed: " + error.message });
    }
});

// User Login Route
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user || user.password !== password) { // Compare plain text password
            return res.status(401).json({ error: "Invalid email or password!" });
        }

        res.status(200).json({
            user: { name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Login failed: " + error.message });
    }
});

// Get All Users Route
app.get("/api/users", async (req, res) => {
    try {
        const users = await User.find().select("-password"); // Exclude password in response
        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users: " + error.message });
    }
});

// Add New User Route
app.post("/api/users", async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: "All fields (name, email, password, role) are required." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
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
    } catch (error) {
        console.error("Error adding user:", error);
        if (error.code === 11000) {
            return res.status(400).json({ error: "Email already exists." });
        }
        res.status(500).json({ error: "Failed to add user: " + error.message });
    }
});

// Update User Route
app.put("/api/users/:userId", async (req, res) => {
    const { userId } = req.params;
    const { name, email, role } = req.body;

    if (!name && !email && !role) {
        return res.status(400).json({ error: "At least one field (name, email, role) is required for update." });
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(userId, { name, email, role }, { new: true, omitUndefined: true });
        if (!updatedUser) {
            return res.status(404).json({ error: "User not found!" });
        }
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ error: "Failed to update user: " + error.message });
    }
});

// Delete User Route
app.delete("/api/users/:userId", async (req, res) => {
    const { userId } = req.params;

    try {
        const result = await User.findByIdAndDelete(userId);
        if (!result) {
            return res.status(404).json({ error: "User not found!" });
        }
        res.status(204).send(); // No content
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ error: "Failed to delete user: " + error.message });
    }
});

// Sales Record Routes
app.post("/api/sales", async (req, res) => {
    const { date, items, Price, customer } = req.body;

    if (!date || !items || !Array.isArray(items) || items.length === 0 || Price == null || !customer) {
        return res.status(400).json({ error: "All fields (date, items, Price, customer) are required." });
    }

    try {
        const newSalesRecord = new SalesRecord({ date, items, Price, customer });
        await newSalesRecord.save();
        res.status(201).json({ message: "Sales record created successfully!", record: newSalesRecord });
    } catch (error) {
        console.error("Error adding sales record:", error);
        res.status(500).json({ error: "Failed to add sales record: " + error.message });
    }
});

// Get All Sales Records
app.get("/api/sales", async (req, res) => {
    try {
        const salesRecords = await SalesRecord.find();
        res.status(200).json(salesRecords);
    } catch (error) {
        console.error("Error fetching sales records:", error);
        res.status(500).json({ error: "Failed to fetch sales records: " + error.message });
    }
});

// Update Sales Record
app.put("/api/sales/:recordId", async (req, res) => {
    const { recordId } = req.params;
    const { date, items, Price, customer } = req.body;

    if (!date && !items && Price == null && !customer) {
        return res.status(400).json({ error: "At least one field (date, items, Price, customer) is required for update." });
    }

    try {
        const updatedSalesRecord = await SalesRecord.findByIdAndUpdate(recordId, { date, items, Price, customer }, { new: true, omitUndefined: true });
        if (!updatedSalesRecord) {
            return res.status(404).json({ error: "Sales record not found!" });
        }
        res.status(200).json(updatedSalesRecord);
    } catch (error) {
        console.error("Error updating sales record:", error);
        res.status(500).json({ error: "Failed to update sales record: " + error.message });
    }
});

// Delete Sales Record
app.delete("/api/sales/:recordId", async (req, res) => {
    const { recordId } = req.params;

    try {
        const result = await SalesRecord.findByIdAndDelete(recordId);
        if (!result) {
            return res.status(404).json({ error: "Sales record not found!" });
        }
        res.status(204).send(); // No content
    } catch (error) {
        console.error("Error deleting sales record:", error);
        res.status(500).json({ error: "Failed to delete sales record: " + error.message });
    }
});

// Product Routes
app.post("/api/products", async (req, res) => {
    const { name, description, price, specifications } = req.body;

    if (!name || !description || price == null || !specifications) {
        return res.status(400).json({ error: "All fields (name, description, price, specifications) are required." });
    }

    try {
        const newProduct = new Product({ name, description, price, specifications });
        await newProduct.save();
        res.status(201).json({ message: "Product created successfully!", product: newProduct });
    } catch (error) {
        console.error("Error adding product:", error);
        res.status(500).json({ error: "Failed to add product: " + error.message });
    }
});

// Get All Products
app.get("/api/products", async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ error: "Failed to fetch products: " + error.message });
    }
});

// Update Product
app.put("/api/products/:productId", async (req, res) => {
    const { productId } = req.params;
    const { name, description, price, specifications } = req.body;

    if (!name && !description && price == null && !specifications) {
        return res.status(400).json({ error: "At least one field (name, description, price, specifications) is required for update." });
    }

    try {
        const updatedProduct = await Product.findByIdAndUpdate(productId, { name, description, price, specifications }, { new: true, omitUndefined: true });
        if (!updatedProduct) {
            return res.status(404).json({ error: "Product not found!" });
        }
        res.status(200).json(updatedProduct);
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ error: "Failed to update product: " + error.message });
    }
});

// Delete Product
app.delete("/api/products/:productId", async (req, res) => {
    const { productId } = req.params;

    try {
        const result = await Product.findByIdAndDelete(productId);
        if (!result) {
            return res.status(404).json({ error: "Product not found!" });
        }
        res.status(204).send(); // No content
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ error: "Failed to delete product: " + error.message });
    }
});

// --- Query Schema Definition (Updated) ---
const QuerySchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true }, // Added email field
    message: { type: String, required: true }, // Added message field
    dateCreated: { type: Date, default: Date.now },
    status: { type: String, enum: ['open', 'resolved'], default: 'open' }, // Use lowercase 'open' and 'resolved'
    resolvedBy: { type: String, required: false },
    resolutionDate: { type: Date, required: false },
    automatedResponse: { type: String, required: false }, // Added automated response field
    autoResolved: { type: Boolean, required: false }, // Added auto resolved flag
});

const Query = mongoose.model('Query', QuerySchema);

// --- Query Routes (Updated) ---

// Get All Queries
app.get("/api/queries", async (req, res) => {
    try {
        const queries = await Query.find();
        res.status(200).json(queries);
    } catch (error) {
        console.error("Error fetching queries:", error);
        res.status(500).json({ error: "Failed to fetch queries: " + error.message });
    }
});

// Add New Query (Updated to save email and message)
app.post("/api/queries", async (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: "Name, email, and message are required." });
    }

    try {
        const newQuery = new Query({
            name,
            email, // Save email
            message, // Save message
            status: 'open', // Default status to 'open'
        });

        await newQuery.save();
        res.status(201).json({ message: "Query submitted successfully!", query: newQuery });
    } catch (error) {
        console.error("Error adding query:", error);
        res.status(500).json({ error: "Failed to add query: " + error.message });
    }
});


// Update Query (Updated to handle automatedResponse and autoResolved)
app.put("/api/queries/:queryId", async (req, res) => {
    const { queryId } = req.params;
    // Include new fields in destructuring
    const { status, resolvedBy, resolutionDate, automatedResponse, autoResolved } = req.body;

    // Check if at least one field is provided for update
    if (!status && !resolvedBy && !resolutionDate && automatedResponse === undefined && autoResolved === undefined) {
         return res.status(400).json({ error: "At least one field is required for updating." });
    }

    // Create an update object with only the provided fields
    const updateFields = {};
    if (status !== undefined) updateFields.status = status;
    if (resolvedBy !== undefined) updateFields.resolvedBy = resolvedBy;
    if (resolutionDate !== undefined) updateFields.resolutionDate = resolutionDate;
    if (automatedResponse !== undefined) updateFields.automatedResponse = automatedResponse;
    if (autoResolved !== undefined) updateFields.autoResolved = autoResolved;


    try {
        const updatedQuery = await Query.findByIdAndUpdate(
            queryId,
            updateFields, // Use the updateFields object
            { new: true, omitUndefined: true }
        );

        if (!updatedQuery) {
            return res.status(404).json({ error: "Query not found!" });
        }

        res.status(200).json(updatedQuery);
    } catch (error) {
        console.error("Error updating query:", error);
        res.status(500).json({ error: "Failed to update query: " + error.message });
    }
});

// Delete Query
app.delete("/api/queries/:queryId", async (req, res) => {
    const { queryId } = req.params;

    try {
        const result = await Query.findByIdAndDelete(queryId);
        if (!result) {
            return res.status(404).json({ error: "Query not found!" });
        }
        res.status(204).send(); // No content
    } catch (error) {
        console.error("Error deleting query:", error);
        res.status(500).json({ error: "Failed to delete query: " + error.message });
    }
});

// --- Backend function to calculate similarity ---
const calculateSimilarity = (text1, text2) => {
    const tfidf = new TfIdf();

    // Add documents
    tfidf.addDocument(text1);
    tfidf.addDocument(text2);

    // Get the terms in document 1
    const terms = tokenizer.tokenize(text1.toLowerCase());

    // Calculate similarity
    let similarity = 0;
    terms.forEach(term => {
        // Get the TF-IDF value for this term in doc 1 and doc 2
        const termWeight1 = tfidf.tfidf(term, 0);
        const termWeight2 = tfidf.tfidf(term, 1);

        // Add to similarity if the term appears in both docs
        if (termWeight1 > 0 && termWeight2 > 0) {
            similarity += (termWeight1 * termWeight2);
        }
    });

    return similarity;
};


// --- New Backend Endpoint to Auto-Respond to a Single Query ---
app.post("/api/queries/:queryId/auto-respond", async (req, res) => {
    const { queryId } = req.params;

    try {
        const query = await Query.findById(queryId);
        if (!query) {
            return res.status(404).json({ error: "Query not found!" });
        }

        if (query.status === 'resolved') { // Use lowercase 'resolved'
             return res.status(400).json({ error: "Query is already resolved." });
        }

        // Fetch all automated responses
        const predefinedResponses = await AutomatedResponse.find();

        let bestMatch = null;
        let highestSimilarity = -1;

        if (predefinedResponses && predefinedResponses.length > 0) {
             // Find most similar response (backend logic)
             predefinedResponses.forEach(response => {
                 // Check keyword match first (direct match)
                 const keywords = response.keywords || [];
                 const keywordMatch = keywords.some(keyword =>
                     query.message.toLowerCase().includes(keyword.toLowerCase())
                 );

                 if (keywordMatch) {
                     // If keywords match, this is a priority match
                      // Use a high similarity score for keyword matches
                     if (highestSimilarity < 1) { // Set a high score to prioritize keyword matches
                         highestSimilarity = 1;
                         bestMatch = response;
                     }
                 } else {
                     // If no keyword match, calculate text similarity
                     const similarity = calculateSimilarity(query.message, response.responseText);
                     if (similarity > highestSimilarity) {
                         highestSimilarity = similarity;
                         bestMatch = response;
                     }
                 }
             });
        }


        // Use default response if similarity is too low or no best match found
        if (!bestMatch || highestSimilarity < 0.2) { // Adjust the threshold as needed
             bestMatch = predefinedResponses.find(r => r.isDefault) ||
                         {responseText: "Thank you for your query. Our team will get back to you shortly."};
        }

        // Update query status to mark it as automatically addressed
        const updatedQuery = await Query.findByIdAndUpdate(
            query._id,
            {
                status: 'resolved', // Use lowercase 'resolved'
                automatedResponse: bestMatch.responseText,
                autoResolved: true,
                resolutionDate: new Date(),
                resolvedBy: 'Automated System' // Or similar identifier
            },
            { new: true }
        );

        res.status(200).json(updatedQuery);

    } catch (error) {
        console.error('Error auto-responding to query:', error);
        res.status(500).json({ error: 'Failed to auto-respond to query: ' + error.message });
    }
});

// --- New Backend Endpoint to Auto-Respond to All Pending Queries ---
 app.post("/api/queries/auto-respond-all-pending", async (req, res) => {
     try {
         const pendingQueries = await Query.find({ status: { $ne: 'resolved' } }); // Find queries not marked as resolved (use lowercase 'resolved')
         const predefinedResponses = await AutomatedResponse.find();

         let processedCount = 0;
         const updatedQueries = []; // To send back the updated list

         for (const query of pendingQueries) {
             let bestMatch = null;
             let highestSimilarity = -1;

             // Find most similar response (backend logic)
             if (predefinedResponses && predefinedResponses.length > 0) {
                  predefinedResponses.forEach(response => {
                     const keywords = response.keywords || [];
                     const keywordMatch = keywords.some(keyword =>
                         query.message.toLowerCase().includes(keyword.toLowerCase())
                     );

                     if (keywordMatch) {
                         if (highestSimilarity < 1) { // Set a high score to prioritize keyword matches
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

             // Use default response if similarity is too low or no best match found
             if (!bestMatch || highestSimilarity < 0.2) { // Adjust the threshold as needed
                  bestMatch = predefinedResponses.find(r => r.isDefault) ||
                              {responseText: "Thank you for your query. Our team will get back to you shortly."};
             }

             // Update query
             const updatedQuery = await Query.findByIdAndUpdate(
                 query._id,
                 {
                     status: 'resolved', // Use lowercase 'resolved'
                     automatedResponse: bestMatch.responseText,
                     autoResolved: true,
                     resolutionDate: new Date(),
                     resolvedBy: 'Automated System'
                 },
                 { new: true }
             );
             updatedQueries.push(updatedQuery);
             processedCount++;
         }

         res.status(200).json({ message: `Automatically responded to ${processedCount} queries`, processedCount, updatedQueries });

     } catch (error) {
         console.error('Error auto-responding to all queries:', error);
         res.status(500).json({ error: 'Failed to auto-respond to all queries: ' + error.message });
     }
 });

 // --- Updated Backup Endpoint (to fetch data from DB and save to Backup collection) ---
 app.post("/api/backup", async (req, res) => {
     try {
         // Fetch all queries and responses from the database
         const queriesData = await Query.find().lean(); // Use .lean() for plain JavaScript objects
         const responsesData = await AutomatedResponse.find().lean(); // Use .lean()

         const backupData = {
             queries: queriesData,
             responses: responsesData,
             timestamp: new Date() // Mongoose will handle saving this as Date type
         };

         // Create a new backup document in the Backup collection
         const newBackup = new Backup(backupData);
         await newBackup.save();

         console.log("Backup saved to database collection 'backups'");

         // In a real application, you would ALSO send this data to cloud storage
         // using a library like AWS SDK (S3), Google Cloud Storage client, etc.
         // Example (pseudocode for cloud upload):
         // const AWS = require('aws-sdk');
         // const s3 = new AWS.S3({ accessKeyId: 'YOUR_KEY', secretAccessKey: 'YOUR_SECRET' });
         // const params = {
         //     Bucket: 'your-backup-bucket',
         //     Key: `backup-${backupData.timestamp.toISOString()}.json`, // Use ISO string for file name
         //     Body: JSON.stringify(backupData, null, 2),
         //     ContentType: 'application/json'
         // };
         // s3.upload(params, (err, data) => {
         //     if (err) {
         //         console.error("S3 Upload Error:", err);
         //         // Decide how to handle partial failure (DB saved, Cloud failed)
         //         return res.status(500).json({ error: "Backup saved to DB, but failed to upload to cloud." });
         //     }
         //     console.log("Backup uploaded to S3:", data.Location);
         //     res.status(200).json({ message: "Backup completed to database and cloud storage." });
         // });

         // For this example, just send a success response after saving to DB
         res.status(200).json({ message: "Backup completed and saved to database." });

     } catch (error) {
         console.error("Error performing database backup:", error);
         res.status(500).json({ error: "Failed to perform database backup: " + error.message });
     }
 });

// --- New Endpoint to Get Backup History (Optional but useful) ---
app.get("/api/backups", async (req, res) => {
    try {
        // Fetch all backup records, maybe sorted by timestamp descending
        const backups = await Backup.find().sort({ timestamp: -1 });
        // You might want to limit the fields returned to avoid sending large data arrays
        // e.g., .select('timestamp _id')
        res.status(200).json(backups);
    } catch (error) {
        console.error("Error fetching backup history:", error);
        res.status(500).json({ error: "Failed to fetch backup history: " + error.message });
    }
});

// --- New Endpoint to Restore from a Specific Backup (Optional but complex) ---
// This endpoint would take a backup ID, fetch the backup data, and replace
// the current data in the Query and AutomatedResponse collections.
// **WARNING**: Implementing restore requires careful consideration of data integrity,
// potential data loss, and should ideally have strong authentication and
// potentially a confirmation step. This is a complex operation.
/*
app.post("/api/restore/:backupId", async (req, res) => {
    const { backupId } = req.params;
    try {
        const backupRecord = await Backup.findById(backupId);
        if (!backupRecord) {
            return res.status(404).json({ error: "Backup record not found!" });
        }

        // --- Start Transaction (Recommended for critical operations like restore) ---
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Delete current data
            await Query.deleteMany({}, { session });
            await AutomatedResponse.deleteMany({}, { session });

            // Insert data from backup
            if (backupRecord.queries && backupRecord.queries.length > 0) {
                 // Map backup data to schema format if needed, and remove _id to let MongoDB generate new ones
                 const queriesToInsert = backupRecord.queries.map(q => ({
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

             if (backupRecord.responses && backupRecord.responses.length > 0) {
                 // Map backup data to schema format and remove _id
                 const responsesToInsert = backupRecord.responses.map(r => ({
                     keywords: r.keywords,
                     responseText: r.responseText,
                     isDefault: r.isDefault,
                 }));
                 await AutomatedResponse.insertMany(responsesToInsert, { session });
            }

            await session.commitTransaction();
            session.endSession();

            res.status(200).json({ message: `Data restored from backup ${backupId}.` });

        } catch (txError) {
            await session.abortTransaction();
            session.endSession();
            console.error("Transaction error during restore:", txError);
            res.status(500).json({ error: "Transaction failed during restore: " + txError.message });
        }
        // --- End Transaction ---

    } catch (error) {
        console.error("Error initiating restore:", error);
        res.status(500).json({ error: "Failed to initiate restore: " + error.message });
    }
});
*/


// Cart Item Routes
app.post("/api/cart", async (req, res) => {
    const { userId, productId, quantity } = req.body;

    if (!userId || !productId || quantity == null) {
        return res.status(400).json({ error: "userId, productId, and quantity are required." });
    }

    try {
        const existingCartItem = await CartItem.findOne({ userId, productId });
        if (existingCartItem) {
            existingCartItem.quantity += quantity; // Increase quantity
            await existingCartItem.save();
            return res.status(200).json({ message: "Cart item updated successfully!", cartItem: existingCartItem });
        } else {
            const newCartItem = new CartItem({ userId, productId, quantity });
            await newCartItem.save();
            res.status(201).json({ message: "Cart item added successfully!", cartItem: newCartItem });
        }
    } catch (error) {
        console.error("Error adding cart item:", error);
        res.status(500).json({ error: "Failed to add cart item: " + error.message });
    }
});

app.get("/api/cart/:userId", async (req, res) => {
    const { userId } = req.params;

    try {
        const cartItems = await CartItem.find({ userId });
        res.status(200).json(cartItems);
    } catch (error) {
        console.error("Error fetching cart items:", error);
        res.status(500).json({ error: "Failed to fetch cart items: " + error.message });
    }
});

app.put("/api/cart/:itemId", async (req, res) => {
    const { itemId } = req.params;
    const { quantity } = req.body;

    if (quantity == null) {
        return res.status(400).json({ error: "Quantity is required for update." });
    }

    try {
        const updatedCartItem = await CartItem.findByIdAndUpdate(itemId, { quantity }, { new: true });
        if (!updatedCartItem) {
            return res.status(404).json({ error: "Cart item not found!" });
        }
        res.status(200).json(updatedCartItem);
    } catch (error) {
        console.error("Error updating cart item:", error);
        res.status(500).json({ error: "Failed to update cart item: " + error.message });
    }
});

app.delete("/api/cart/:itemId", async (req, res) => {
    const { itemId } = req.params;

    try {
        const result = await CartItem.findByIdAndDelete(itemId);
        if (!result) {
            return res.status(404).json({ error: "Cart item not found!" });
        }
        res.status(204).send(); // No content
    } catch (error) {
        console.error("Error deleting cart item:", error);
        res.status(500).json({ error: "Failed to delete cart item: " + error.message });
    }
});

// Checkout Route
app.post("/api/checkout", async (req, res) => {
    try {
        const cartItems = await CartItem.find();
        if (cartItems.length === 0) {
            return res.status(400).json({ error: "Cart is empty" });
        }

        let Price = 0;

        for (let item of cartItems) {
            let product = await Product.findById(item.productId);
            if (product) {
                Price += product.price * item.quantity;
            }
        }

        let date = new Date().toISOString();

        let items = [];
        for (let item of cartItems) {
            let product = await Product.findById(item.productId);
            if (product) {
                items.push(`${product.name}(Quantity:${item.quantity})`);
            }
        }

        let newSalesRecord = new SalesRecord({
            date,
            items,
            Price,
            customer: req.body.customerName,
        });

        await newSalesRecord.save();

        // Clear the cart
        await CartItem.deleteMany();

        res.json({
            message: "Order Placed Successfully!",
            salesRecord: newSalesRecord,
        });
    } catch (error) {
        console.error('Error During Checkout:', error);
        res.status(500).json({
            error: "Failed to process checkout: " + error.message,
        });
    }
});


// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server Running On Port ${PORT}`);
});