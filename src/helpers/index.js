import path from 'path';

const helpers = {
    // HELPERS DE COMPARACIÓN
    eq: function(a, b) { return a === b; },
    ne: function(a, b) { return a !== b; },
    gt: function(a, b) { return a > b; },
    lt: function(a, b) { return a < b; },
    gte: function(a, b) { return a >= b; },
    lte: function(a, b) { return a <= b; },

    // HELPERS MATEMÁTICOS  
    multiply: function(a, b) { return a * b; },
    add: function(a, b) { return parseInt(a) + parseInt(b); },
    subtract: function(a, b) { return parseInt(a) - parseInt(b); },
    percentage: function(value, total) {
        if (!total || total === 0) return 0;
        return Math.round((value / total) * 100);
    },
    round: function(number, decimals = 0) {
        return Number(Math.round(number + 'e' + decimals) + 'e-' + decimals);
    },

    // HELPERS DE FORMATO
    formatNumber: function(number) {
        if (typeof number !== 'number') {
            number = parseFloat(number) || 0;
        }
        return number.toLocaleString('es-CL');
    },
    formatPrice: function(price) {
        if (typeof price !== 'number') {
            price = parseFloat(price) || 0;
        }
        return '$' + price.toLocaleString('es-CL');
    },
    formatDate: function(date, format) {
        if (!date) return '';
        
        const d = new Date(date);
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        
        if (format === 'short') {
            options.month = 'short';
        } else if (format === 'time') {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }
        
        return d.toLocaleDateString('es-CL', options);
    },

    // HELPERS DE STRING
    capitalize: function(str) {
        if (typeof str !== 'string') return str;
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },
    truncate: function(str, length) {
        if (typeof str !== 'string') return str;
        if (str.length <= length) return str;
        return str.substring(0, length) + '...';
    },
    case: function(str, caseType) {
        if (typeof str !== 'string') return str;
        
        switch (caseType) {
            case 'upper':
                return str.toUpperCase();
            case 'lower':
                return str.toLowerCase();
            case 'title':
                return str.replace(/\w\S*/g, (txt) => 
                    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
                );
            default:
                return str;
        }
    },

    // HELPERS DE ARRAY
    length: function(obj) {
        if (Array.isArray(obj)) return obj.length;
        if (typeof obj === 'object' && obj !== null) return Object.keys(obj).length;
        if (typeof obj === 'string') return obj.length;
        return 0;
    },
    hasItems: function(array) {
        return Array.isArray(array) && array.length > 0;
    },
    first: function(array) {
        return array && array.length > 0 ? array[0] : null;
    },
    isEmpty: function(obj) {
        if (!obj) return true;
        if (Array.isArray(obj)) return obj.length === 0;
        if (typeof obj === 'object') return Object.keys(obj).length === 0;
        if (typeof obj === 'string') return obj.trim() === '';
        return false;
    },

    // HELPERS CONDICIONALES
    ifCond: function(v1, operator, v2, options) {
        switch (operator) {
            case '==': return (v1 == v2) ? options.fn(this) : options.inverse(this);
            case '===': return (v1 === v2) ? options.fn(this) : options.inverse(this);
            case '!=': return (v1 != v2) ? options.fn(this) : options.inverse(this);
            case '!==': case 'ne': return (v1 !== v2) ? options.fn(this) : options.inverse(this);
            case '<': return (v1 < v2) ? options.fn(this) : options.inverse(this);
            case '<=': return (v1 <= v2) ? options.fn(this) : options.inverse(this);
            case '>': return (v1 > v2) ? options.fn(this) : options.inverse(this);
            case '>=': return (v1 >= v2) ? options.fn(this) : options.inverse(this);
            case '&&': return (v1 && v2) ? options.fn(this) : options.inverse(this);
            case '||': return (v1 || v2) ? options.fn(this) : options.inverse(this);
            default: return options.inverse(this);
        }
    },
    and: function(a, b) { return a && b; },
    or: function(a, b) { return a || b; },
    not: function(value) { return !value; },

    // HELPERS ESPECÍFICOS DE ECOMMERCE
    stockClass: function(stock) {
        if (stock <= 0) return 'text-danger';
        if (stock <= 5) return 'text-warning';
        return 'text-success';
    },
    stockStatus: function(stock) {
        if (stock <= 0) return 'Sin stock';
        if (stock <= 5) return 'Stock bajo';
        return 'Disponible';
    },
    isNew: function(createdAt) {
        if (!createdAt) return false;
        const now = new Date();
        const created = new Date(createdAt);
        const diffTime = Math.abs(now - created);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30;
    },

    // HELPERS DE PAGINACIÓN Y QUERY
    range: function(start, end, min, max) {
        const result = [];
        const actualStart = Math.max(min || 1, start);
        const actualEnd = Math.min(max || end, end);
        
        for (let i = actualStart; i <= actualEnd; i++) {
            result.push(i);
        }
        return result;
    },
    buildQueryString: function(currentQuery, newParams) {
        const params = new URLSearchParams();
        
        // Agregar parámetros actuales
        if (currentQuery) {
            Object.keys(currentQuery).forEach(key => {
                if (currentQuery[key] && currentQuery[key] !== 'all' && currentQuery[key] !== '') {
                    params.set(key, currentQuery[key]);
                }
            });
        }
        
        // Sobrescribir con nuevos parámetros
        if (newParams && typeof newParams === 'object') {
            Object.keys(newParams).forEach(key => {
                if (newParams[key] !== undefined && newParams[key] !== null && newParams[key] !== '') {
                    params.set(key, newParams[key]);
                } else {
                    params.delete(key);
                }
            });
        }
        
        return params.toString();
    },

    // HELPERS DE UTILIDAD
    json: function(context) {
        return JSON.stringify(context, null, 2);
    },

    getTotalItems: function(products) {
        
        if (!products) {
            return 0;
        }
        
        if (!Array.isArray(products)) {
            return 0;
        }
        
        const total = products.reduce((total, item) => {
            const quantity = parseInt(item.quantity) || 0;
            return total + quantity;
        }, 0);
        
        return total;
    }
};

export default helpers;