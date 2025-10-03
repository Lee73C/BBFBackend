export const validateProductQuery = (req, res, next) => {
    try {
        const query = req.query;

        // Validar y sanitizar page
        if (query.page) {
            const page = parseInt(query.page);
            if (isNaN(page) || page < 1) {
                query.page = 1;
            } else {
                query.page = Math.min(page, 100); 
            }
        } else {
            query.page = 1; 
        }

        // Validar y sanitizar limit
        if (query.limit) {
            const limit = parseInt(query.limit);
            if (isNaN(limit) || limit < 1) {
                query.limit = 10;
            } else {
                query.limit = Math.min(limit, 100); 
            }
        } else {
            query.limit = 10; 
        }

        // Validar sort
        if (query.sort) {
            const validSorts = [
                'price_asc', 'price_desc', 'title_asc', 'title_desc', 
                'stock_asc', 'stock_desc', 'newest', 'oldest', 'category_asc', 'status_desc'
            ];
            if (!validSorts.includes(query.sort)) {
                query.sort = 'status_desc'; 
            }
        }

        // Validar availability
        if (query.availability) {
            const validAvailability = ['available', 'outOfStock', 'lowStock', 'all'];
            if (!validAvailability.includes(query.availability)) {
                query.availability = 'all';
            }
        }

        // Validar status
        if (query.status !== undefined) {
            if (query.status === 'true' || query.status === true) {
                query.status = 'true';
            } else if (query.status === 'false' || query.status === false) {
                query.status = 'false';
            } else if (query.status === 'all' || query.status === '') {
                delete query.status; 
            } else {
                delete query.status; 
            }
        }

        // Validar y sanitizar precios
        if (query.minPrice !== undefined && query.minPrice !== '') {
            const minPrice = parseFloat(query.minPrice);
            if (isNaN(minPrice) || minPrice < 0) {
                delete query.minPrice;
            } else {
                query.minPrice = minPrice;
            }
        }

        if (query.maxPrice !== undefined && query.maxPrice !== '') {
            const maxPrice = parseFloat(query.maxPrice);
            if (isNaN(maxPrice) || maxPrice < 0) {
                delete query.maxPrice;
            } else {
                query.maxPrice = maxPrice;
            }
        }

        // Validar que minPrice <= maxPrice
        if (query.minPrice !== undefined && query.maxPrice !== undefined && query.minPrice > query.maxPrice) {
            delete query.minPrice;
            delete query.maxPrice;
        }

        // Sanitizar búsqueda
        if (query.search !== undefined) {
            if (typeof query.search === 'string') {
                query.search = query.search.trim().substring(0, 100); 
                if (query.search.length === 0) {
                    delete query.search;
                }
            } else {
                delete query.search;
            }
        }

        // Sanitizar categoría
        if (query.category !== undefined) {
            if (typeof query.category === 'string') {
                query.category = query.category.trim().substring(0, 50);
                if (query.category.length === 0 || query.category === 'all') {
                    delete query.category;
                }
            } else {
                delete query.category;
            }
        }

        // Sanitizar campos específicos
        if (query.fields !== undefined) {
            if (typeof query.fields === 'string') {
                query.fields = query.fields.trim();
                if (query.fields.length === 0) {
                    delete query.fields;
                }
            } else {
                delete query.fields;
            }
        }

        req.query = query;
        next();

    } catch (error) {
        // En caso de error, usar valores por defecto
        req.query = {
            page: 1,
            limit: 10,
            sort: 'status_desc'
        };
        next();
    }
};

export const validateCartParams = (req, res, next) => {
    try {
        const { cid, pid } = req.params;

        // Validar formato ObjectId
        const objectIdRegex = /^[0-9a-fA-F]{24}$/;

        if (cid && !objectIdRegex.test(cid)) {
            return res.status(400).json({
                status: 'error',
                message: 'ID de carrito inválido'
            });
        }

        if (pid && !objectIdRegex.test(pid)) {
            return res.status(400).json({
                status: 'error',
                message: 'ID de producto inválido'
            });
        }

        // Validar quantity en body si existe
        if (req.body.quantity !== undefined) {
            const quantity = parseInt(req.body.quantity);
            if (isNaN(quantity) || quantity < 0) {
                return res.status(400).json({
                    status: 'error',
                    message: 'La cantidad debe ser un número positivo'
                });
            }
            req.body.quantity = quantity;
        }

        next();

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error interno del servidor'
        });
    }
};