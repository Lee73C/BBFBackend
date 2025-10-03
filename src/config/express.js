import express from 'express';

export const configureExpress = (app) => {
    // Middlewares
    app.use(express.static('public'));
    
    return app;
};