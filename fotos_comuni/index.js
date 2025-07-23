const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

/// Configuración Multer con almacenamiento dinámico

const storage = multer.diskStorage({
    destination : function (req, file, cb) {
        let carpeta = 'sin_identificar';

        if (req.body.dominio && req.body.dominio.trim() !== '') {
            carpeta = req.body.dominio.toUpperCase().replace(/[^A-Z0-9]/g, '');
        } 
        const dir = path.join(__dirname, 'uploads', carpeta);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); 
        cb(null, dir);

    },

    filename: function (req, file, cb) {
        let id = 'sin_id';
        if (req.body.dominio && req.body.dominio.trim() !== '') {
            id = req.body.dominio.toUpperCase().replace(/[^A-Z0-9]/g, '');
        } 

    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g,'');
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}_${id}${ext}`);
    }
});

const upload = multer({storage});

app.post('/subir-fotos', upload.array('foto', 10), (req, res) =>{
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error : 'Error en la carga'})
    }
    res.json({
        mensaje: 'Carga exitosa',
        archivos: req.files.map(f => f.filename)
    })
})

app.get('/carpetas', (req, res) =>{
    const uploadsDir = path.join(__dirname, 'uploads');
    fs.readdir(uploadsDir, { withFileTypes: true }, (err, files) => {
        if (err) return res.status(500).json({ error : 'Error al leer carpetas '})
        
        const carpetas = files
            .filter(f => f.isDirectory())
            .map(f => f.name);
        res.json({ carpetas })
    })
})

app.get('/fotos/:carpeta', (req,res) => {
    const dir = path.join(__dirname, 'uploads', req.params.carpeta)
    if (!fs.existsSync(dir)){
        return res.status(404).json({ error: 'Carpeta no encontrada '});
    }

    fs.readdir(dir, (err, files) => {
        if (err) return res.status(500).json( { error : 'Error al leer archivos'})

        const archivos = files.filter(f => /\.(jpg|jpeg|png|webp|pdf)$/i.test(f));
        res.json({ archivos })
    })
})
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));


app.listen(PORT, '0.0.0.0', ()=>{
    console.log (`Servidor corriendo en el puerto ${PORT}`)
})