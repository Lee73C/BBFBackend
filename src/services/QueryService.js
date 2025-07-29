class QueryService {
    constructor(model, queryString) {
        this.model = model;
        this.queryString = queryString;
        this.query = this.model.find();
        this.filterQuery = {}; // Agregar filtro separado para count
    }

    // Filtros comunes
    filter() {
        const queryObj = { ...this.queryString };
        const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
        excludedFields.forEach(el => delete queryObj[el]);

        // Procesar filtros específicos
        this.filterQuery = {}; // Reset filter query

        // Filtro de categoría
        if (queryObj.category && queryObj.category !== 'all') {
            this.filterQuery.category = queryObj.category;
        }

        // Filtro de status/availability
        if (queryObj.status !== undefined) {
            if (queryObj.status === 'true' || queryObj.status === true) {
                this.filterQuery.status = true;
            } else if (queryObj.status === 'false' || queryObj.status === false) {
                this.filterQuery.status = false;
            }
        }

        if (queryObj.availability && queryObj.availability !== 'all') {
            switch (queryObj.availability) {
                case 'available':
                    this.filterQuery.status = true;
                    this.filterQuery.stock = { $gt: 0 };
                    break;
                case 'outOfStock':
                    this.filterQuery.stock = { $lte: 0 };
                    break;
                case 'lowStock':
                    this.filterQuery.stock = { $gt: 0, $lte: 5 };
                    break;
            }
        }

        // Filtros de precio
        if (queryObj.minPrice !== undefined) {
            this.filterQuery.price = { ...this.filterQuery.price, $gte: parseFloat(queryObj.minPrice) };
        }
        if (queryObj.maxPrice !== undefined) {
            this.filterQuery.price = { ...this.filterQuery.price, $lte: parseFloat(queryObj.maxPrice) };
        }

        // Aplicar filtros a la consulta
        this.query = this.query.find(this.filterQuery);
        return this;
    }

    // Búsqueda por texto
    search() {
        if (this.queryString.search && this.queryString.search.trim()) {
            const searchRegex = new RegExp(this.queryString.search.trim(), 'i');
            const searchFilter = {
                $or: [
                    { title: searchRegex },
                    { description: searchRegex },
                    { category: searchRegex },
                    { code: searchRegex }
                ]
            };
            
            // Combinar filtros de búsqueda con otros filtros
            if (Object.keys(this.filterQuery).length > 0) {
                this.filterQuery = { $and: [this.filterQuery, searchFilter] };
            } else {
                this.filterQuery = searchFilter;
            }
            
            this.query = this.model.find(this.filterQuery);
        }
        return this;
    }

    // Ordenamiento corregido
    sort() {
        if (this.queryString.sort) {
            let sortOptions = {};
            
            switch (this.queryString.sort) {
                case 'price_asc':
                    sortOptions = { price: 1 };
                    break;
                case 'price_desc':
                    sortOptions = { price: -1 };
                    break;
                case 'title_asc':
                    sortOptions = { title: 1 };
                    break;
                case 'title_desc':
                    sortOptions = { title: -1 };
                    break;
                case 'stock_asc':
                    sortOptions = { stock: 1 };
                    break;
                case 'stock_desc':
                    sortOptions = { stock: -1 };
                    break;
                case 'newest':
                    sortOptions = { createdAt: -1 };
                    break;
                case 'oldest':
                    sortOptions = { createdAt: 1 };
                    break;
                case 'category_asc':
                    sortOptions = { category: 1, title: 1 };
                    break;
                case 'status_desc':
                default:
                    sortOptions = { status: -1, createdAt: -1 };
                    break;
            }
            
            this.query = this.query.sort(sortOptions);
            console.log('🔀 Ordenamiento aplicado:', this.queryString.sort, sortOptions);
        } else {
            this.query = this.query.sort({ status: -1, createdAt: -1 });
        }
        return this;
    }

    // Limitación de campos
    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select('-__v');
        }
        return this;
    }

    // Paginación corregida
    paginate() {
        const page = Math.max(1, parseInt(this.queryString.page) || 1);
        const limit = Math.max(1, Math.min(100, parseInt(this.queryString.limit) || 10));
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);
        
        // Almacenar para cálculos posteriores
        this.pagination = { page, limit, skip };
        
        console.log('📄 Paginación aplicada:', { page, limit, skip });
        return this;
    }

    // Ejecutar consulta con metadatos
    async execute() {
        try {
            console.log('🔍 Ejecutando consulta con filtros:', this.filterQuery);
            console.log('📊 Parámetros de paginación:', this.pagination);
            
            // Crear consulta de conteo usando los mismos filtros
            const countQuery = this.model.countDocuments(this.filterQuery || {});
            
            // Ejecutar ambas consultas en paralelo
            const [docs, totalDocs] = await Promise.all([
                this.query.exec(),
                countQuery
            ]);

            // Calcular metadatos de paginación
            const { page, limit } = this.pagination || { page: 1, limit: 10 };
            const totalPages = Math.ceil(totalDocs / limit);
            const hasNextPage = page < totalPages;
            const hasPrevPage = page > 1;

            const result = {
                status: 'success',
                payload: docs,
                totalPages,
                prevPage: hasPrevPage ? page - 1 : null,
                nextPage: hasNextPage ? page + 1 : null,
                page,
                hasPrevPage,
                hasNextPage,
                totalDocs,
                limit
            };

            console.log('✅ Consulta ejecutada exitosamente:', {
                docs: docs.length,
                totalDocs,
                page,
                totalPages
            });

            return result;

        } catch (error) {
            console.error('❌ Error ejecutando consulta:', error);
            throw new Error(`Error en consulta: ${error.message}`);
        }
    }
}

export default QueryService;