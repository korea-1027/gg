import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp, 
  doc, 
  getDoc,
  orderBy,
  limit,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  Link as LinkIcon, 
  Image as ImageIcon, 
  ExternalLink, 
  Copy, 
  Check, 
  Upload, 
  Loader2, 
  ArrowRight,
  Home as HomeIcon,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const generateId = (length: number = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const CHUNK_SIZE = 800 * 1024; // 800KB chunks for safety

// --- Components ---

const Navbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200">
    <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 font-bold text-xl text-zinc-900">
        <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white">
          <LinkIcon size={18} />
        </div>
        <span>Hub</span>
      </Link>
      <div className="flex gap-6">
        <Link to="/link" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">Shorten Link</Link>
        <Link to="/img" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">Share Image</Link>
      </div>
    </div>
  </nav>
);

const Home = () => (
  <div className="min-h-screen pt-32 pb-20 px-4 bg-zinc-50">
    <div className="max-w-4xl mx-auto text-center">
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-5xl md:text-7xl font-bold tracking-tight text-zinc-900 mb-6"
      >
        Share anything, <br />
        <span className="text-zinc-400">instantly.</span>
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-lg text-zinc-600 mb-12 max-w-2xl mx-auto"
      >
        A powerful platform for shortening links and sharing high-quality images. 
        Simple, fast, and secure.
      </motion.p>
      
      <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <Link to="/link">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-8 bg-white rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-all text-left group"
          >
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <LinkIcon size={24} />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">Link Shortener</h2>
            <p className="text-zinc-500 mb-4">Transform long URLs into clean, 10-character links.</p>
            <div className="flex items-center gap-2 text-blue-600 font-medium">
              Get started <ArrowRight size={16} />
            </div>
          </motion.div>
        </Link>

        <Link to="/img">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-8 bg-white rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-all text-left group"
          >
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <ImageIcon size={24} />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 mb-2">Image Sharing</h2>
            <p className="text-zinc-500 mb-4">Upload and share images up to 10MB instantly.</p>
            <div className="flex items-center gap-2 text-emerald-600 font-medium">
              Upload now <ArrowRight size={16} />
            </div>
          </motion.div>
        </Link>
      </div>
    </div>
  </div>
);

const LinkShortener = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    try {
      const shortId = generateId();
      await addDoc(collection(db, 'links'), {
        url: url.startsWith('http') ? url : `https://${url}`,
        shortId,
        createdAt: serverTimestamp(),
        clicks: 0
      });
      setResult(`${window.location.origin}/l/${shortId}`);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 bg-zinc-50">
      <div className="max-w-xl mx-auto">
        <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">Shorten URL</h1>
          <p className="text-zinc-500 mb-8">Paste your long link below to create a short one.</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <input 
              type="text"
              placeholder="https://example.com/very-long-url"
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
            />
            <button 
              type="submit"
              disabled={loading || !url}
              className="w-full py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Shorten Link'}
            </button>
          </form>

          <AnimatePresence>
            {result && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-8 pt-8 border-t border-zinc-100"
              >
                <p className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Your short link</p>
                <div className="flex items-center gap-2 p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                  <span className="flex-1 font-mono text-zinc-900 truncate">{result}</span>
                  <button 
                    onClick={copyToClipboard}
                    className="p-2 hover:bg-zinc-200 rounded-lg transition-colors text-zinc-600"
                  >
                    {copied ? <Check size={18} className="text-emerald-600" /> : <Copy size={18} />}
                  </button>
                  <a 
                    href={result} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-zinc-200 rounded-lg transition-colors text-zinc-600"
                  >
                    <ExternalLink size={18} />
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const ImageSharer = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit.');
        setFile(null);
        return;
      }
      setError(null);
      setFile(selected);
    }
  };

  const cleanSVG = (svgText: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');
    const scripts = doc.getElementsByTagName('script');
    while (scripts.length > 0) {
      scripts[0].parentNode?.removeChild(scripts[0]);
    }
    return new XMLSerializer().serializeToString(doc);
  };

  const uploadImage = async () => {
    if (!file) return;
    setLoading(true);
    setProgress(0);
    try {
      let dataToUpload: string;
      
      if (file.type === 'image/svg+xml') {
        const text = await file.text();
        dataToUpload = btoa(cleanSVG(text));
      } else {
        const reader = new FileReader();
        dataToUpload = await new Promise((resolve) => {
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.readAsDataURL(file);
        });
      }

      const shortId = generateId();
      const totalChunks = Math.ceil(dataToUpload.length / CHUNK_SIZE);
      
      // 1. Create Metadata
      const metadataRef = await addDoc(collection(db, 'images'), {
        shortId,
        name: file.name,
        mimeType: file.type,
        createdAt: serverTimestamp(),
        totalChunks,
        size: file.size
      });

      // 2. Upload Chunks
      for (let i = 0; i < totalChunks; i++) {
        const chunkData = dataToUpload.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        await addDoc(collection(db, 'images', metadataRef.id, 'chunks'), {
          chunkIndex: i,
          data: chunkData
        });
        setProgress(Math.round(((i + 1) / totalChunks) * 100));
      }

      setResult(`${window.location.origin}/i/${shortId}`);
    } catch (err) {
      console.error(err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 bg-zinc-50">
      <div className="max-w-xl mx-auto">
        <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">Share Image</h1>
          <p className="text-zinc-500 mb-8">Upload an image up to 10MB to share it with others.</p>

          <div 
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all",
              file ? "border-emerald-200 bg-emerald-50/30" : "border-zinc-200 hover:border-zinc-400 bg-zinc-50/50"
            )}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*"
            />
            <div className={cn(
              "w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 transition-colors",
              file ? "bg-emerald-100 text-emerald-600" : "bg-zinc-100 text-zinc-400"
            )}>
              <Upload size={32} />
            </div>
            {file ? (
              <div>
                <p className="font-bold text-zinc-900 truncate max-w-xs mx-auto">{file.name}</p>
                <p className="text-sm text-zinc-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            ) : (
              <div>
                <p className="font-bold text-zinc-900">Click to upload</p>
                <p className="text-sm text-zinc-500">SVG, PNG, JPG, GIF (Max 10MB)</p>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button 
            onClick={uploadImage}
            disabled={loading || !file}
            className="w-full mt-6 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="flex items-center gap-3">
                <Loader2 className="animate-spin" size={20} />
                <span>Uploading {progress}%</span>
              </div>
            ) : 'Upload & Share'}
          </button>

          <AnimatePresence>
            {result && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-8 pt-8 border-t border-zinc-100"
              >
                <p className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">Shareable link</p>
                <div className="flex items-center gap-2 p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                  <span className="flex-1 font-mono text-zinc-900 truncate">{result}</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(result);
                    }}
                    className="p-2 hover:bg-zinc-200 rounded-lg transition-colors text-zinc-600"
                  >
                    <Copy size={18} />
                  </button>
                  <a 
                    href={result} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-zinc-200 rounded-lg transition-colors text-zinc-600"
                  >
                    <ExternalLink size={18} />
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const RedirectLink = () => {
  const { id } = useParams();
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchLink = async () => {
      if (!id) return;
      try {
        const q = query(collection(db, 'links'), where('shortId', '==', id), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          window.location.href = data.url;
        } else {
          setError(true);
        }
      } catch (err) {
        console.error(err);
        setError(true);
      }
    };
    fetchLink();
  }, [id]);

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 px-4 text-center">
      <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mb-6">
        <AlertCircle size={40} />
      </div>
      <h1 className="text-3xl font-bold text-zinc-900 mb-2">Link not found</h1>
      <p className="text-zinc-500 mb-8">The link you're looking for doesn't exist or has been removed.</p>
      <Link to="/" className="px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all">
        Go Home
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50">
      <Loader2 className="animate-spin text-zinc-400 mb-4" size={40} />
      <p className="text-zinc-500 font-medium">Redirecting you...</p>
    </div>
  );
};

const ViewImage = () => {
  const { id } = useParams();
  const [image, setImage] = useState<{ name: string, mimeType: string, data: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchImage = async () => {
      if (!id) return;
      try {
        const q = query(collection(db, 'images'), where('shortId', '==', id), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const metadataDoc = snapshot.docs[0];
          const metadata = metadataDoc.data();
          
          // Fetch chunks
          const chunksSnapshot = await getDocs(query(collection(db, 'images', metadataDoc.id, 'chunks'), orderBy('chunkIndex')));
          const chunks = chunksSnapshot.docs.map(doc => doc.data().data);
          const fullData = chunks.join('');
          
          setImage({
            name: metadata.name,
            mimeType: metadata.mimeType,
            data: `data:${metadata.mimeType};base64,${fullData}`
          });
        } else {
          setError(true);
        }
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchImage();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50">
      <Loader2 className="animate-spin text-zinc-400 mb-4" size={40} />
      <p className="text-zinc-500 font-medium">Loading image...</p>
    </div>
  );

  if (error || !image) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 px-4 text-center">
      <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mb-6">
        <AlertCircle size={40} />
      </div>
      <h1 className="text-3xl font-bold text-zinc-900 mb-2">Image not found</h1>
      <p className="text-zinc-500 mb-8">The image you're looking for doesn't exist or has been removed.</p>
      <Link to="/" className="px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all">
        Go Home
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 bg-zinc-50">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white p-4 rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-4 px-4 pt-2">
            <h1 className="font-bold text-zinc-900 truncate max-w-md">{image.name}</h1>
            <a 
              href={image.data} 
              download={image.name}
              className="flex items-center gap-2 text-sm font-bold text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              Download
            </a>
          </div>
          <div className="bg-zinc-100 rounded-2xl overflow-hidden flex items-center justify-center min-h-[400px]">
            <img 
              src={image.data} 
              alt={image.name} 
              className="max-w-full h-auto"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/link" element={<LinkShortener />} />
        <Route path="/img" element={<ImageSharer />} />
        <Route path="/l/:id" element={<RedirectLink />} />
        <Route path="/i/:id" element={<ViewImage />} />
      </Routes>
    </Router>
  );
}
