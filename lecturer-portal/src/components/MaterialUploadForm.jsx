// MaterialUploadForm — title + PDF file. Calls onUpload({ title, file }) and resets on success.
import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import Alert from './Alert.jsx';
import { checkPdfFile, MAX_UPLOAD_MB } from '../config/uploads.js';

export default function MaterialUploadForm({
  onUpload,
  heading = 'Upload lecture material',
  placeholder = 'e.g. Lecture 3 – Symmetric encryption',
}) {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef(null);

  function handleFileChange(event) {
    const chosen = event.target.files?.[0] ?? null;
    setFile(chosen);
    setError(chosen ? checkPdfFile(chosen) : '');
    // Suggest a title from the file name when none was typed
    if (chosen && !title.trim()) setTitle(chosen.name.replace(/\.pdf$/i, '').slice(0, 200));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const fileError = checkPdfFile(file);
    if (!title.trim()) return setError('Please enter a title.');
    if (fileError) return setError(fileError);

    setError('');
    setUploading(true);
    try {
      await onUpload({ title: title.trim(), file });
      setTitle('');
      setFile(null);
      if (fileInput.current) fileInput.current.value = '';
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <form className="card upload-form" onSubmit={handleSubmit} noValidate>
      <h3>{heading}</h3>
      {error && <Alert>{error}</Alert>}
      <div className="form-row">
        <label className="field">
          <span>Title</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder={placeholder}
            required
          />
        </label>
        <label className="field">
          <span>PDF file (max {MAX_UPLOAD_MB} MB)</span>
          <input ref={fileInput} type="file" accept="application/pdf,.pdf" onChange={handleFileChange} required />
        </label>
        <button type="submit" className="button button-primary" disabled={uploading}>
          <Upload size={16} aria-hidden="true" />
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
      </div>
    </form>
  );
}
