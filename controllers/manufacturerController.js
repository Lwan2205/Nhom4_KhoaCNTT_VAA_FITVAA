const Manufacturer = require("../../backend/model/manufacturer");

// Lấy tất cả nhà sản xuất
const getAllManufacturers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
        const limit = parseInt(req.query.limit) || 6; // Default to 6 items per page if not provided
        const skip = (page - 1) * limit; // Calculate the number of records to skip based on the page

        const manufacturers = await Manufacturer.find()
            .skip(skip)
            .limit(limit);
        const totalManufacturers = await Manufacturer.countDocuments(); // Get the total number of manufacturers

        const totalPages = Math.ceil(totalManufacturers / limit); // Calculate total pages

        res.status(200).json({
            data: manufacturers,
            totalPages: totalPages,
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// Lấy nhà sản xuất theo ID
const getManufacturerById = async (req, res) => {
    try {
        const manufacturer = await Manufacturer.findById(req.params.id);
        if (!manufacturer) {
            return res.status(404).json({ message: 'Manufacturer not found' });
        }
        res.status(200).json(manufacturer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Thêm nhà sản xuất mới (có hỗ trợ upload hình ảnh nếu có)
// Thêm nhà sản xuất mới
const addManufacturer = async (req, res) => {
    const { name, country, contactInfo } = req.body;
    const imageUrl = req.file ? req.file.path : null; // Sử dụng URL đầy đủ từ Cloudinary

    if (!name) {
        return res.status(400).json({ message: 'Name is required' });
    }

    try {
        const manufacturer = new Manufacturer({
            name,
            country,
            contactInfo,
            images: imageUrl
        });

        const createdManufacturer = await manufacturer.save();
        res.status(201).json(createdManufacturer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Cập nhật nhà sản xuất theo ID
const updateManufacturer = async (req, res) => {
    const { name, country, contactInfo } = req.body;
    const imageUrl = req.file ? req.file.path : null; // Sử dụng URL đầy đủ từ Cloudinary

    try {
        const manufacturer = await Manufacturer.findById(req.params.id);
        if (!manufacturer) {
            return res.status(404).json({ message: 'Manufacturer not found' });
        }

        // Cập nhật các trường có sẵn
        manufacturer.name = name || manufacturer.name;
        manufacturer.country = country || manufacturer.country;
        manufacturer.contactInfo = contactInfo || manufacturer.contactInfo;
        if (imageUrl) {
            manufacturer.images = imageUrl; // Cập nhật hình ảnh nếu có ảnh mới
        }

        const updatedManufacturer = await manufacturer.save();
        res.status(200).json(updatedManufacturer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};




// Xóa nhà sản xuất theo ID
// Xóa nhà sản xuất theo ID
// Xóa nhà sản xuất theo ID
const deleteManufacturer = async (req, res) => {
    try {
        const manufacturer = await Manufacturer.findByIdAndDelete(req.params.id);
        if (!manufacturer) {
            return res.status(404).json({ message: 'Manufacturer not found' });
        }

        res.status(200).json({ message: 'Manufacturer deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



// Lấy các nhà sản xuất yêu thích dựa trên salesCount
const getFavoriteManufacturersBySales = async (req, res) => {
    try {
        // Lấy các nhà sản xuất có salesCount cao nhất
        const favoriteManufacturers = await Manufacturer.find().sort({ salesCount: -1 }).limit(5);
        res.status(200).json({ success: true, data: favoriteManufacturers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllManufacturers,
    getManufacturerById,
    addManufacturer,
    updateManufacturer,
    deleteManufacturer,
    getFavoriteManufacturersBySales
};
