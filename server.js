const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3001;

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, DOC, and TXT files are allowed.'));
    }
  }
});

// Store uploaded files metadata
const uploadedFiles = new Map();

// File upload endpoint
app.post('/api/files/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded'
      });
    }

    const user = req.body.user || 'anonymous';
    const fileId = 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Store file metadata
    const fileMetadata = {
      id: fileId,
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype,
      path: req.file.path,
      uploadedAt: new Date().toISOString(),
      user: user
    };
    
    uploadedFiles.set(fileId, fileMetadata);
    
    console.log('✅ File uploaded successfully:', {
      id: fileId,
      name: req.file.originalname,
      size: req.file.size,
      user: user
    });
    
    res.json({
      id: fileId,
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype,
      created_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      error: 'Upload failed: ' + error.message
    });
  }
});

// Chat messages endpoint (mock)
app.post('/api/chat-messages', (req, res) => {
  try {
    const { query, files, user } = req.body;
    
    console.log('🤖 Processing chat message:', {
      query: query?.substring(0, 100) + '...',
      filesCount: files?.length || 0,
      user: user
    });
    
    // Simulate processing time
    setTimeout(() => {
      // Mock analysis response
      const mockAnalysis = `# Analyse du Document

## Résumé
Le document téléchargé a été analysé avec succès. Voici les informations principales extraites :

## Points Clés Identifiés
- Document de type : ${files?.[0]?.type === 'document' ? 'Document texte' : 'Fichier'}
- Contenu analysé et traité
- Structure du document identifiée

## Recommandations
1. Le document semble être bien structuré
2. Les informations sont cohérentes
3. Aucun problème majeur détecté

## Synthèse Globale
L'analyse du document est terminée. Le contenu a été traité avec succès et les informations principales ont été extraites.

*Note: Ceci est une analyse simulée pour démonstration. Dans un environnement de production, cette analyse serait effectuée par l'API Dify réelle.*`;

      res.json({
        event: 'message',
        message_id: 'msg_' + Date.now(),
        conversation_id: 'conv_' + Date.now(),
        mode: 'chat',
        answer: mockAnalysis,
        metadata: {
          usage: {
            prompt_tokens: 150,
            completion_tokens: 300,
            total_tokens: 450
          },
          retriever_resources: []
        },
        created_at: Date.now()
      });
    }, 2000); // 2 second delay to simulate processing
    
  } catch (error) {
    console.error('❌ Chat processing error:', error);
    res.status(500).json({
      error: 'Processing failed: ' + error.message
    });
  }
});

// Get file status endpoint
app.get('/api/files/:fileId', (req, res) => {
  const fileId = req.params.fileId;
  const user = req.query.user;
  
  const fileMetadata = uploadedFiles.get(fileId);
  
  if (!fileMetadata) {
    return res.status(404).json({
      error: 'File not found'
    });
  }
  
  if (fileMetadata.user !== user) {
    return res.status(403).json({
      error: 'Access denied'
    });
  }
  
  res.json({
    id: fileMetadata.id,
    name: fileMetadata.name,
    size: fileMetadata.size,
    type: fileMetadata.type,
    status: 'completed',
    created_at: fileMetadata.uploadedAt
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uploadedFiles: uploadedFiles.size
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'File too large. Maximum size is 10MB.'
      });
    }
  }
  
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error: ' + error.message
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Mock Dify API server running on http://localhost:${port}`);
  console.log(`📁 File uploads will be stored in ./uploads directory`);
  console.log(`🔗 Health check: http://localhost:${port}/api/health`);
});