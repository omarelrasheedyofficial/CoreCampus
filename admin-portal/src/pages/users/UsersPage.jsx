// pages/users/UsersPage.jsx — all university accounts with search and role filter.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, UserPlus } from 'lucide-react';
import { fetchUsers } from '../../api/admin.api.js';
import { ROLE_LABELS } from '../../config/portals.js';
import PageHeader from '../../components/PageHeader.jsx';
import DataTable from '../../components/DataTable.jsx';
import Loader from '../../components/Loader.jsx';
import Alert from '../../components/Alert.jsx';

const COLUMNS = [
  {
    key: 'fullName',
    header: 'Name',
    render: (u) => (
      <Link className="link" to={`/users/${u.userId}`}>
        {u.fullName}
      </Link>
    ),
  },
  { key: 'email', header: 'Email' },
  {
    key: 'roles',
    header: 'Roles',
    render: (u) => (u.roles.length ? u.roles.map((r) => ROLE_LABELS[r] ?? r).join(', ') : 'None'),
  },
  {
    key: 'identifier',
    header: 'ID / Employee no.',
    render: (u) => u.studentProfile?.universityId ?? u.staffProfile?.employeeNumber ?? '—',
  },
  {
    key: 'status',
    header: 'Status',
    render: (u) => (
      <span className={`badge ${u.isActive ? 'badge-active' : 'badge-inactive'}`}>{u.isActive ? 'Active' : 'Inactive'}</span>
    ),
  },
];

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Debounced reload when the filters change
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      fetchUsers({ search: search.trim(), role })
        .then((rows) => !cancelled && (setUsers(rows), setError('')))
        .catch((err) => !cancelled && setError(err.message))
        .finally(() => !cancelled && setLoading(false));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, role]);

  return (
    <>
      <PageHeader
        title="Users & Roles"
        subtitle="Create university accounts, assign roles and manage access."
        actions={
          <Link className="button button-primary" to="/users/new">
            <UserPlus size={16} aria-hidden="true" /> New user
          </Link>
        }
      />

      <div className="toolbar">
        <label className="search-field">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search name, email, university ID or employee no."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search users"
            maxLength={100}
          />
        </label>
        <select className="select" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Filter by role">
          <option value="">All roles</option>
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {error && <Alert>{error}</Alert>}
      {loading && users.length === 0 ? (
        <Loader label="Loading users…" />
      ) : (
        <DataTable columns={COLUMNS} rows={users} rowKey={(u) => u.userId} emptyMessage="No users match the filters." />
      )}
    </>
  );
}
