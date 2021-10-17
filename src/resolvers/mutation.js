import bcrypt from "bcryptjs"

import User from "../models/user"
import Product from "../models/product"

const Mutation = {
// ------------------------------------------------------------------------- สมัครสมาชิก
  signup: async (parent, args, context, info) => {
    const username = args.username.trim().toLowerCase();
    const currentUsers = await User.find({});
    const isUsernameExist = currentUsers.findIndex(user => user.username === username) > -1;
    if (isUsernameExist) {
      throw new Error("Username already exist.");
    }
    if (args.password.trim().length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }
    const password = await bcrypt.hash(args.password, 10);
    return User.create({...args,password})
  },
// ------------------------------------------------------------------------- เพิ่มสินค้าให้สมาชิก
  createProduct: async (parent, args, context, info) => {
    const userId = "5ea71f8b796e2560d80facf6"
    if (!args.name || !args.description || !args.price) {
      throw new Error("Please provide all required fields.")
    }
    const product = await Product.create({ ...args, user: userId })
    const user = await User.findById(userId)
    if (!user.products) {
      user.products = [product]
    } else {
      user.products.push(product)
    }
    await user.save()
    return Product.findById(product.id).populate({
      path: "user",
      populate: { path: "products" }
    })
  },
// ------------------------------------------------------------------------- Updateสินค้าให้สมาชิก
  updateProduct: async (parent, args, context, info) => {
    const { id, name, description, price } = args
    // TODO: Check if user logged in
    // หา product ใน database
    const product = await Product.findById(id)
    // TODO: Check if user is the owner of the product
    const userId = "5ea71f8b796e2560d80facf6"
    if (userId !== product.user.toString()) {
      throw new Error("You are not authorized.")
    }
    // Form ที่ใช้ในการ updated
    const updateInfo = {
      name: !!name ? name : product.name,
      description: !!description ? description : product.description,
      price: !!price ? price : product.price
    }
    // Update product ใน database
    await Product.findByIdAndUpdate(id, updateInfo)
    // หา Product ที่ update มาแสดง
    const updatedProduct = await Product.findById(id).populate({ path: "user" })
    return updatedProduct
  },
  // ------------------------------------------------------------------------- ลบสินค้าให้สมาชิก
  deleteProduct: async (parent, args, context, info) => {
    const { id } = args;
    // Find product from given id
    const product = await Product.findById(id);
    // TODO: Check if user logged in
    // TODO: user id from request --> Find user
    const userId = "5ea71f8b796e2560d80facf6";
    // Check if user logged in
    if (!userId) throw new Error("Please log in.");
    const user = await User.findById(userId)
    // Check ownership of the product
    if (product.user.toString() !== userId) {
      throw new Error("Not authorized.")
    }
    // Delete product
    const deletedProduct = await Product.findOneAndRemove(id);
    // Update user's products
    const updatedUserProducts = user.products.filter(
      productId => productId.toString() !== deletedProduct.id.toString()
    );
    await User.findByIdAndUpdate(userId, { products: updatedUserProducts });
    return deletedProduct;
  }
}

export default Mutation