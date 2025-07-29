import express from 'express';

export const configureExpress = (app) => {
    // Middlewares
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static('public'));
    
    return app;
};