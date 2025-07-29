export const logger = {
    info: (message) => {
        if (process.env.NODE_ENV !== 'production') {
            console.log(`ℹ️ ${message}`);
        }
    },
    
    error: (message) => {
        console.error(`❌ ${message}`);
    },
    
    success: (message) => {
        if (process.env.NODE_ENV !== 'production') {
            console.log(`✅ ${message}`);
        }
    }
};