// pages/section/SectionMaterialsTab.jsx — upload, list, rename, download and delete
// the lecture materials of one section.
import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Download, FileText, Pencil, Trash2 } from 'lucide-react';
import {
  deleteMaterial,
  downloadMaterial,
  fetchSectionMaterials,
  renameMaterial,
  uploadSectionMaterial,
} from '../../api/materials.api.js';
import { formatDateTime, formatFileSize } from '../../utils/format.js';
import MaterialUploadForm from '../../components/MaterialUploadForm.jsx';
import DataTable from '../../components/DataTable.jsx';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';

export default function SectionMaterialsTab() {
  const { section } = useOutletContext();
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState(null); // { materialId, title }
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchSectionMaterials(section.sectionId)
      .then((items) => !cancelled && setMaterials(items))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [section.sectionId]);

  async function runAction(materialId, action) {
    setError('');
    setNotice('');
    setBusyId(materialId);
    try {
      await action();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleUpload(input) {
    setError('');
    setNotice('');
    const material = await uploadSectionMaterial(section.sectionId, input); // errors shown by the form
    setMaterials((items) => [material, ...items]);
    setNotice(`Uploaded "${material.title}".`);
  }

  function handleRenameSave() {
    const { materialId, title } = editing;
    runAction(materialId, async () => {
      const updated = await renameMaterial(materialId, title);
      setMaterials((items) => items.map((m) => (m.materialId === materialId ? updated : m)));
      setEditing(null);
    });
  }

  function handleDelete(material) {
    if (!window.confirm(`Delete "${material.title}"? Students will no longer be able to access it.`)) return;
    runAction(material.materialId, async () => {
      await deleteMaterial(material.materialId);
      setMaterials((items) => items.filter((m) => m.materialId !== material.materialId));
      setNotice(`Deleted "${material.title}".`);
    });
  }

  const columns = [
    {
      key: 'title',
      header: 'Title',
      render: (m) =>
        editing?.materialId === m.materialId ? (
          <form
            className="inline-edit"
            onSubmit={(e) => {
              e.preventDefault();
              handleRenameSave();
            }}
          >
            <input
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              maxLength={200}
              aria-label="New title"
              autoFocus
            />
            <button type="submit" className="button button-primary button-small" disabled={!editing.title.trim() || busyId === m.materialId}>
              Save
            </button>
            <button type="button" className="button button-ghost button-small" onClick={() => setEditing(null)}>
              Cancel
            </button>
          </form>
        ) : (
          <span className="material-title">
            <FileText size={16} aria-hidden="true" /> {m.title}
          </span>
        ),
    },
    {
      key: 'file',
      header: 'File',
      render: (m) => (
        <span className="small">
          {m.originalFilename} <span className="muted">· {formatFileSize(m.fileSize)}</span>
        </span>
      ),
    },
    {
      key: 'uploaded',
      header: 'Uploaded',
      render: (m) => (
        <span className="small">
          {formatDateTime(m.createdAt)} <span className="muted">· {m.uploadedBy}</span>
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (m) => (
        <div className="row-actions">
          <button
            type="button"
            className="icon-button"
            title="Download"
            aria-label={`Download ${m.title}`}
            disabled={busyId === m.materialId}
            onClick={() => runAction(m.materialId, () => downloadMaterial(m.materialId))}
          >
            <Download size={16} />
          </button>
          <button
            type="button"
            className="icon-button"
            title="Rename"
            aria-label={`Rename ${m.title}`}
            disabled={busyId === m.materialId}
            onClick={() => setEditing({ materialId: m.materialId, title: m.title })}
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            className="icon-button icon-button-danger"
            title="Delete"
            aria-label={`Delete ${m.title}`}
            disabled={busyId === m.materialId}
            onClick={() => handleDelete(m)}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <MaterialUploadForm onUpload={handleUpload} />

      {notice && <Alert variant="info">{notice}</Alert>}
      {error && <Alert>{error}</Alert>}

      {loading ? (
        <Loader label="Loading materials…" />
      ) : (
        <DataTable
          columns={columns}
          rows={materials}
          rowKey={(m) => m.materialId}
          emptyMessage="No materials uploaded for this section yet."
        />
      )}
    </>
  );
}
