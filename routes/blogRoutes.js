const Blog = require('../../backend/model/blog');

// Thêm bài viết mới
const addBlog = async (req, res) => {
    const { title, content, category } = req.body;

    if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required' });
    }

    try {
        const blog = new Blog({
            title,
            content,
            author: req.user._id,  // Người dùng đăng nhập làm tác giả
            category
        });

        const createdBlog = await blog.save();
        res.status(201).json(createdBlog);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Lấy tất cả bài viết blog
const getAllBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find().populate('author', 'name');  // Lấy thêm thông tin tác giả
        res.status(200).json(blogs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Lấy chi tiết bài viết theo ID
const getBlogById = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id).populate('author', 'name');
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }
        res.status(200).json(blog);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Cập nhật bài viết
const updateBlog = async (req, res) => {
    const { title, content, category } = req.body;

    if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required' });
    }

    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // Kiểm tra xem người dùng có phải là tác giả không
        if (blog.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You are not authorized to update this blog' });
        }

        // Cập nhật bài viết
        blog.title = title;
        blog.content = content;
        blog.category = category || blog.category;
        blog.updatedAt = Date.now();

        const updatedBlog = await blog.save();
        res.status(200).json(updatedBlog);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Xóa bài viết
const deleteBlog = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // Kiểm tra xem người dùng có phải là tác giả không
        if (blog.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You are not authorized to delete this blog' });
        }

        await blog.remove();
        res.status(200).json({ message: 'Blog deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    addBlog,
    getAllBlogs,
    getBlogById,
    updateBlog,
    deleteBlog,
};
