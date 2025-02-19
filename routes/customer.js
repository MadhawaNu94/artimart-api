const Customer = require("../models/Customer");
const CryptoJS = require("crypto-js");
const { verifyToken, verifyTokenAndAuthorization, verifyTokenAndAdmin } = require("./verifyToken");

const router = require("express").Router();
  
// Get Customer By Id
router.get("/find/:id", verifyTokenAndAdmin, async (req, res) => {
    try {
    const customer = await Customer.findById(req.params.id);
    const { password, ...others } = customer._doc;
    res.status(200).json(others);
    } catch (error) {
    res.status(500).json(error);
    }
});

// Get Customer By Name
router.get("/find/:username", verifyTokenAndAdmin, async (req, res) => {
    try {
    let customer = await Customer.find(
        { 
            "$or": [
                {customerName: {$regex:req.params.username}}
            ]  
        }
    );
    const { password, ...others } = customer._doc;
    res.status(200).json(customer);
    } catch (error) {
    res.status(500).json(error);
    }
});

// Get all Customers
router.get("/", verifyTokenAndAdmin, async (req, res) => {
    const query = req.query.new;
    try {
    const customers = query
        ? await Customer.find().sort({ _id: -1 }).limit(5)
        : await Customer.find();
    res.status(200).json(customers);
    } catch (error) {
    res.status(500).json(error);
    }
});

// Get Customer Statistics
router.get("/stats", verifyTokenAndAdmin, async (req, res) => {
    const date = new Date();
    const lastYear = new Date(date.setFullYear(date.getFullYear() - 1));

    try {
    const data = await Customer.aggregate([
        { $match: { createdAt: { $gte: lastYear } } },
        {
        $project: {
            month: { $month: "$createdAt" },
        },
        },
        {
        $group: {
            _id: "$month",
            total: { $sum: 1 },
        },
        },
    ]);
    res.status(200).json(data)
    } catch (error) {
    res.status(500).json(error);
    }
});

// Update a Customer By Id
router.put("/:id", verifyTokenAndAuthorization, async (req, res) => {
    if(req.body.password){
        req.body.password = CryptoJS.AES.encrypt(req.body.password, process.env.PASSWORD_SECRET_KEY).toString()
    }

    try{
        const updatedCustomer = await Customer.findByIdAndUpdate(
            req.params.id,
            {
                $set: req.body
            },
            {new: true}
        );
        res.status(200).json(updatedCustomer);
    }catch(error){
        res.status(500).json(error);
    }

});

// Delete a Customer By Id
router.delete("/:id", verifyTokenAndAuthorization, async (req, res) => {
    try {
    await Customer.findByIdAndDelete(req.params.id);
    res.status(200).json("Customer has been deleted");
    } catch (error) {
    res.status(500).json(error);
    }
});

module.exports = router