export const logger = {
    info: (message) => {
        if (process.env.NODE_ENV !== 'production') {
        }
    },
    
    error: (message, ...args) => {
        if (process.env.NODE_ENV === 'development') {
            console.error(`❌ ${message}`, ...args);
        }
    },
    
    success: (message) => {
        if (process.env.NODE_ENV !== 'production') {
        }
    }
};