import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import type { User } from '../types';
import Spinner from '../components/Spinner';
import './Discover.css';

const PAGE_SIZE = 20;

type SortOption = 'name_asc' | 'name_desc';

const Discover = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [sort, setSort] = useState<SortOption>('name_asc');
  const [onlyNotFollowed, setOnlyNotFollowed] = useState(true);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/users?page=${page}&limit=${PAGE_SIZE}&q=${encodeURIComponent(debouncedQuery)}`);
        const data = res.data;
        let list: User[] = data.data || [];

        // Client-side sort
        list = [...list].sort((a, b) => {
          const an = (a.name || '').toLocaleLowerCase();
          const bn = (b.name || '').toLocaleLowerCase();
          if (sort === 'name_asc') return an.localeCompare(bn);
          return bn.localeCompare(an);
        });

        // Client-side filter non suivis
        if (onlyNotFollowed && followingIds.size > 0) {
          list = list.filter(u => !followingIds.has(u._id));
        }

        setUsers(list);
        setTotal(data.total || 0);
        setHasMore(Boolean(data.hasMore));
      } catch (e) {
        setError("Impossible de charger les utilisateurs.");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [page, debouncedQuery, sort, onlyNotFollowed, followingIds]);

  useEffect(() => {
    const fetchFollowing = async () => {
      try {
        const res = await api.get('/users/following');
        const data: User[] = res.data?.data || res.data || [];
        setFollowingIds(new Set(data.map(u => u._id)));
      } catch {}
    };
    fetchFollowing();
  }, []);

  const handleFollow = async (userId: string) => {
    try {
      await api.post(`/users/${userId}/follow`);
      setUsers(prev => prev.filter(u => u._id !== userId));
    } catch (e) {
      setError("Impossible de suivre cet utilisateur.");
    }
  };

  const totalPages = useMemo(() => Math.max(Math.ceil(total / PAGE_SIZE), 1), [total]);

  if (loading) return <Spinner />;

  return (
    <div className="discover-container">
      <h2>Découvrir des personnes</h2>
      <div className="discover-toolbar">
        <input
          type="search"
          placeholder="Rechercher par nom ou email..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
        />
        <select value={sort} onChange={(e) => setSort(e.target.value as SortOption)}>
          <option value="name_asc">Nom A→Z</option>
          <option value="name_desc">Nom Z→A</option>
        </select>
        <label className="chk">
          <input type="checkbox" checked={onlyNotFollowed} onChange={(e) => setOnlyNotFollowed(e.target.checked)} />
          Non suivis seulement
        </label>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="discover-grid">
        {users.map(user => (
          <div key={user._id} className="discover-card">
            <div className="discover-avatar">
              <img src={user.avatarUrl || '/default-avatar.png'} alt={user.name} />
            </div>
            <div className="discover-info">
              <div className="discover-name">{user.name}</div>
              <div className="discover-bio">{user.bio || 'Aucune bio'}</div>
            </div>
            <button className="follow-btn" onClick={() => handleFollow(user._id)}>Suivre</button>
          </div>
        ))}
      </div>
      <div className="discover-pagination">
        <button disabled={page <= 1} onClick={() => setPage(p => Math.max(p - 1, 1))}>Précédent</button>
        <span>Page {page} / {totalPages}</span>
        <button disabled={!hasMore} onClick={() => setPage(p => p + 1)}>Suivant</button>
      </div>
    </div>
  );
};

function useDebounce<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default Discover;


