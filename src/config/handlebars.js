import { engine } from 'express-handlebars';
import path from 'path';
import handlebarsHelpers from '../helpers/index.js';

export const configureHandlebars = (app) => {
    app.engine('handlebars', engine({
        defaultLayout: 'main',
        layoutsDir: path.join(process.cwd(), 'src/views/layouts'),
        viewsDir: path.join(process.cwd(), 'src/views'),
        runtimeOptions: {
            allowProtoPropertiesByDefault: true,
            allowProtoMethodsByDefault: true,
        },
        helpers: handlebarsHelpers
    }));
    
    app.set('view engine', 'handlebars');
    app.set('views', path.join(process.cwd(), 'src/views'));
};