const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;


const whitelist = [
  'https://comunidauto.net.ar',
  'https://www.comunidauto.net.ar',
  'https://front-comuni.vercel.app',
  'http://localhost:3000', // útil en desarrollo
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

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

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024
  }
});

const cpUpload = upload.fields([
  { name : 'foto', maxCount: 10},
  { name: 'foto[]', maxCount: 10}
]) ;

app.post('/subir-fotos', cpUpload, (req, res) =>{
  const files = req.files['foto'] || req.files['foto[]'] || [];

    if (!files || files.length === 0) {
        return res.status(400).json({ error : 'Error en la carga'})
    }
    res.json({
        mensaje: 'Carga exitosa',
        archivos: files.map(f => f.filename)
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

app.delete('/carpetas/:carpeta', (req, res) => {
  const carpeta = req.params.carpeta;
  const dir = path.join(__dirname, 'uploads', carpeta);

  if (!fs.existsSync(dir)) {
    return res.status(404).json({ error: 'Carpeta no encontrada' });
  }

  // Borrar carpeta y todo su contenido
  fs.rm(dir, { recursive: true, force: true }, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Error al borrar la carpeta' });
    }
    res.json({ mensaje: `Carpeta ${carpeta} eliminada correctamente` });
  });
});



app.listen(PORT, '0.0.0.0', ()=>{
    console.log (`Servidor corriendo en el puerto ${PORT}`)
})