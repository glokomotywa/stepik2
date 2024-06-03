import mongoose from "mongoose";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = 3000;
const mongoURL = "mongodb://localhost:27017/test";

// Helper to get __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up EJS as the view engine
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // To serve static files like JS

mongoose
  .connect(mongoURL)
  .then(() => console.log("connected to mongo!"))
  .catch((err) => console.log(err));

const productSchema = new mongoose.Schema({
  name: {
    type: mongoose.Schema.Types.String,
    required: true,
    unique: true,
  },
  price: {
    type: mongoose.Schema.Types.Number,
    required: true,
  },
  weight: {
    type: mongoose.Schema.Types.Number,
    required: true,
  },
  quantity: {
    type: mongoose.Schema.Types.Number,
    required: true,
    default: 0,
  },
});

const Product = mongoose.model("product", productSchema);

app.get("/products", async (req, res) => {
  try {
    const { name, minPrice, maxPrice, sortBy, sortOrder } = req.query;
    const filter = {};
    const sort = {};

    if (name) filter.name = new RegExp(name, 'i');
    if (minPrice) filter.price = { $gte: minPrice };
    if (maxPrice) filter.price = { ...filter.price, $lte: maxPrice };

    if (sortBy) sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const products = await Product.find(filter).sort(sort);
    if (req.xhr) { // Check if the request is an AJAX request
      res.json(products);
    } else {
      res.render("index", { products });
    }
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

app.post("/products", async (req, res) => {
  const { body } = req;
  console.log(body);
  const newProduct = new Product(body);
  try {
    const savedProduct = await newProduct.save();
    return res.status(200).send(savedProduct);
  } catch (err) {
    res.status(500).send(err);
  }
});

app.put("/products/:id", async (req, res) => {
  const { id } = req.params;
  const { body } = req;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).send({ msg: "Invalid User ID" });
  }

  const updatedProduct = await Product.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  });

  if (!updatedProduct)
    return res.status(404).send({ msg: "product not found" });
  res.status(200).send(updatedProduct);
});

app.delete("/products/:id", async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).send({ msg: "Invalid User ID" });
  }

  const deletedProduct = await Product.findByIdAndDelete(id);
  if (!deletedProduct)
    return res.status(404).send({ msg: "product not found" });
  res.sendStatus(200);
});

app.get("/inventory-report", async (req, res) => {
  try {
    const report = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: "$quantity" },
          totalValue: { $sum: { $multiply: ["$price", "$quantity"] } },
          products: {
            $push: {
              name: "$name",
              quantity: "$quantity",
              value: { $multiply: ["$price", "$quantity"] },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalQuantity: 1,
          totalValue: 1,
          products: 1,
        },
      },
    ]);

    res.render("report", { report: report[0] });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Running on Port ${PORT}`);
});
