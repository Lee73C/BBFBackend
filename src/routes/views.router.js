import { Router } from 'express';
import ProductManager from '../managers/ProductManager.js';
import CartManager from '../managers/CartManager.js';

const router = Router();
const productManager = new ProductManager();
const cartManager = new CartManager();


// Ruta Raíz - Home con filtros y paginación
router.get('/products', async (req, res) => {
    try {
        console.log('🏠 Cargando /products con parámetros:', req.query);

        // Extraer parámetros de la URL
        const {
            page = 1,
            limit = 2,
            category,
            status = 'true',
            minPrice,
            maxPrice,
            search,
            availability,
            sort = 'status_desc'
        } = req.query;

        // Opciones para el manager
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            category,
            status,
            minPrice: minPrice ? parseFloat(minPrice) : undefined,
            maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
            search,
            availability,
            sort
        };

        console.log('📊 Obteniendo productos...');
        const productsResult = await productManager.getProducts(options);
        console.log('✅ Productos obtenidos:', productsResult.payload.length);

        // Obtener categorías
        let categories = [];
        try {
            categories = await productManager.getCategories();
        } catch (error) {
            console.log('⚠️ Usando categorías por defecto');
            categories = ['ofertas', 'nuevos', 'mas vendidos', 'nuevo'];
        }

        // Obtener estadísticas
        let stats = null;
        try {
            stats = await productManager.getProductStats();
        } catch (error) {
            console.log('⚠️ Usando estadísticas básicas');
            stats = {
                totalProducts: productsResult.totalDocs || 0,
                activeProducts: productsResult.payload?.filter(p => p.status)?.length || 0,
                inactiveProducts: 0,
                outOfStock: 0,
                lowStock: 0,
                avgPrice: 0,
                minPrice: 0,
                maxPrice: 0,
                totalValue: 0
            };
        }

        // RENDERIZAR CON LA VISTA home.handlebars (es la vista principal de productos)
        res.render('home', {
            title: 'Catálogo de Productos', // Cambiar título
            products: productsResult.payload,
            pagination: {
                page: productsResult.page,
                totalPages: productsResult.totalPages,
                hasNextPage: productsResult.hasNextPage,
                hasPrevPage: productsResult.hasPrevPage,
                nextPage: productsResult.nextPage,
                prevPage: productsResult.prevPage,
                limit: productsResult.limit,
                totalDocs: productsResult.totalDocs
            },
            filters: {
                categories,
                currentCategory: category || 'all',
                currentStatus: status || 'all',
                currentAvailability: availability || 'all',
                currentSort: sort || 'status_desc',
                minPrice: minPrice || '',
                maxPrice: maxPrice || '',
                search: search || ''
            },
            stats,
            query: req.query,
            isProductsPage: true // Flag para identificar que es la página de productos
        });

    } catch (error) {
        console.error('❌ Error en ruta /products:', error);
        res.render('home', {
            title: 'Catálogo de Productos',
            products: [],
            pagination: { page: 1, totalPages: 0, hasNextPage: false, hasPrevPage: false, totalDocs: 0 },
            filters: {
                categories: [],
                currentCategory: 'all',
                currentStatus: 'all',
                currentAvailability: 'all',
                currentSort: 'status_desc',
                minPrice: '', maxPrice: '', search: ''
            },
            stats: { totalProducts: 0, activeProducts: 0, inactiveProducts: 0, outOfStock: 0, lowStock: 0, avgPrice: 0, minPrice: 0, maxPrice: 0, totalValue: 0 },
            error: 'Error al cargar productos: ' + error.message,
            isProductsPage: true
        });
    }
});

// RUTA RAÍZ REDIRIGE A /products 
router.get('/', (req, res) => {
    console.log('🔄 Redirigiendo de / a /products');
    res.redirect('/products');
});

// Ruta para realTimeProducts.handlebars
router.get('/realtimeproducts', async (req, res) => {
    try {
        console.log('🔄 Cargando realTimeProducts...');

        const result = await productManager.getProducts({
            limit: 100, // Obtener más productos para la vista en tiempo real
            status: undefined // Incluir todos los productos (activos e inactivos)
        });

        console.log('📦 Productos obtenidos para realTimeProducts:', {
            count: result.payload.length,
            total: result.totalDocs
        });

        res.render('realTimeProducts', {
            title: 'Productos en Tiempo Real',
            products: result.payload
        });
    } catch (error) {
        console.error('❌ Error en ruta realtimeproducts:', error);
        res.render('realTimeProducts', {
            title: 'Productos en Tiempo Real',
            products: [],
            error: 'Error al cargar productos: ' + error.message
        });
    }
});

// Ruta para ver productos por categoría
router.get('/category/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const {
            page = 1,
            limit = 12,
            status = 'true',
            minPrice,
            maxPrice,
            availability,
            sort = 'title_asc'
        } = req.query;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            category,
            status,
            minPrice: minPrice ? parseFloat(minPrice) : undefined,
            maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
            availability,
            sort
        };

        const [productsResult, categories] = await Promise.all([
            productManager.getProducts(options),
            productManager.getCategories()
        ]);

        res.render('category', {
            title: `Categoría: ${category}`,
            category,
            products: productsResult.payload,
            pagination: {
                page: productsResult.page,
                totalPages: productsResult.totalPages,
                hasNextPage: productsResult.hasNextPage,
                hasPrevPage: productsResult.hasPrevPage,
                nextPage: productsResult.nextPage,
                prevPage: productsResult.prevPage,
                totalDocs: productsResult.totalDocs
            },
            filters: {
                categories,
                currentCategory: category,
                currentStatus: status || 'all',
                currentAvailability: availability || 'all',
                currentSort: sort || 'title_asc',
                minPrice: minPrice || '',
                maxPrice: maxPrice || ''
            },
            query: req.query
        });

    } catch (error) {
        console.error('❌ Error en categoría:', error);
        res.render('category', {
            title: 'Error en Categoría',
            category: req.params.category,
            products: [],
            pagination: { page: 1, totalPages: 0 },
            error: error.message
        });
    }
});


// Ruta para ver un carrito específico
router.get('/carts/:cid', async (req, res) => {
    try {
        const { cid } = req.params;
        console.log('🛒 Obteniendo carrito:', cid);

        const cart = await cartManager.getCartById(cid);
        console.log('📦 Carrito obtenido:', JSON.stringify(cart, null, 2));

        const total = await cartManager.getCartTotal(cid);
        console.log('💰 Total calculado:', total);

        // DEBUGGING ESPECÍFICO PARA PRODUCTOS
        console.log('🔍 Productos en carrito:');
        if (cart.products && Array.isArray(cart.products)) {
            console.log(`- Número de productos: ${cart.products.length}`);
            cart.products.forEach((item, index) => {
                console.log(`- Producto ${index + 1}:`, {
                    id: item.product._id,
                    title: item.product.title,
                    quantity: item.quantity,
                    price: item.product.price
                });
            });

            // Calcular total manual para verificar
            const manualTotal = cart.products.reduce((sum, item) => sum + item.quantity, 0);
            console.log('📊 Total manual de items:', manualTotal);
        } else {
            console.log('❌ No hay productos o products no es un array');
        }

        const cartPlain = cart.toObject ? cart.toObject() : cart;
        console.log('🔄 Carrito convertido a objeto plano');

        // Calcular total de items en el servidor
        const totalItems = cartPlain.products ?
            cartPlain.products.reduce((sum, item) => sum + item.quantity, 0) : 0;

        console.log('🎯 Total items calculado en servidor:', totalItems);

        res.render('cart', {
            title: `Carrito ${cid}`,
            cart: cartPlain,
            cartId: cid,
            total: total,
            totalItems: totalItems,  // Pasar el total calculado
            hasProducts: cartPlain.products && cartPlain.products.length > 0
        });
    } catch (error) {
        console.error('❌ Error en ruta cart:', error);
        res.render('cart', {
            title: 'Carrito',
            cart: { products: [] },
            cartId: req.params.cid,
            total: 0,
            totalItems: 0,
            hasProducts: false,
            error: error.message
        });
    }
});

// Ruta de administración
router.get('/admin', async (req, res) => {
    try {
        const [stats, categories, recentProducts] = await Promise.all([
            productManager.getProductStats(),
            productManager.getCategories(),
            productManager.getProducts({
                page: 1,
                limit: 10,
                sort: 'newest'
            })
        ]);

        res.render('admin', {
            title: 'Panel de Administración',
            stats,
            categories,
            recentProducts: recentProducts.payload
        });

    } catch (error) {
        console.error('❌ Error en panel admin:', error);
        res.render('admin', {
            title: 'Panel de Administración',
            error: error.message
        });
    }
});
router.get('/products/:pid', async (req, res) => {
    try {
        const { pid } = req.params;
        console.log('🔍 Cargando producto individual:', pid);

        // VALIDAR FORMATO DE ID ANTES DE CONSULTAR LA BASE DE DATOS
        if (!pid || !/^[0-9a-fA-F]{24}$/.test(pid)) {
            console.log('❌ ID inválido:', pid);
            return res.status(400).render('error', {
                title: 'ID de producto inválido',
                status: 400,
                message: 'El ID del producto no tiene un formato válido',
                url: req.originalUrl,
                backUrl: '/products'
            });
        }

        // Obtener el producto específico
        const product = await productManager.getProductById(pid);
        console.log('✅ Producto encontrado:', product.title);

        // Obtener productos relacionados (misma categoría)
        let relatedProducts = [];
        try {
            relatedProducts = await productManager.getRelatedProducts(pid, 4);
            console.log('📦 Productos relacionados encontrados:', relatedProducts.length);
        } catch (error) {
            console.log('⚠️ No se pudieron obtener productos relacionados:', error.message);
            relatedProducts = [];
        }

        // Obtener categorías para navegación
        let categories = [];
        try {
            categories = await productManager.getCategories();
        } catch (error) {
            categories = [];
        }
        
        res.render('productDetail', {
            title: product.title,
            product,
            relatedProducts,
            categories,
            breadcrumb: {
                category: product.category,
                title: product.title
            },
            // Datos para el carrito
            cartData: {
                productId: product._id,
                productTitle: product.title,
                productPrice: product.price,
                productStock: product.stock,
                productStatus: product.status
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo producto:', error);

        // Determinar el tipo de error y renderizar apropiadamente
        let status = 500;
        let title = 'Error del servidor';
        let message = error.message;

        if (error.message.includes('no encontrado') || error.message.includes('not found')) {
            status = 404;
            title = 'Producto no encontrado';
            message = 'El producto que buscas no existe o ha sido eliminado';
        } else if (error.message.includes('ID inválido') || error.message.includes('CastError')) {
            status = 400;
            title = 'ID de producto inválido';
            message = 'El ID del producto no tiene un formato válido';
        }

        res.status(status).render('error', {
            title,
            status,
            message,
            url: req.originalUrl,
            backUrl: '/products'
        });
    }
});

export default router;