import { useState, useRef } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import './CreatePost.css';

interface CreatePostProps {
  onPostSubmit: (content: string, type: 'Proverbe' | 'Conte' | 'Histoire' | 'Poème', mediaFile?: File, language?: string, region?: string) => Promise<void>;
}

const CreatePost = ({ onPostSubmit }: CreatePostProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [type, setType] = useState<'Proverbe' | 'Conte' | 'Histoire' | 'Poème'>('Proverbe');
  const [language, setLanguage] = useState('Français');
  const [region, setRegion] = useState('Conakry');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      await onPostSubmit(content, type, mediaFile || undefined, language, region);
      setContent('');
      setType('Proverbe');
      setLanguage('Français');
      setRegion('Conakry');
      setMediaFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError("Erreur lors de la publication. Veuillez réessayer.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) { // 5MB limit
        setError("Le fichier est trop volumineux. Taille maximale : 10MB");
        return;
      }
      setMediaFile(file);
      setError('');
    }
  };

  return (
    <div className="create-post-card">
      <h3>Créer une publication</h3>
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Quoi de neuf, ${user?.name} ? Partagez un proverbe, un conte...`}
          rows={4}
          disabled={isSubmitting}
        />
        <div className="create-post-options">
          <select value={type} onChange={(e) => setType(e.target.value as any)} disabled={isSubmitting}>
            <option value="Proverbe">Proverbe</option>
            <option value="Conte">Conte</option>
            <option value="Histoire">Histoire</option>
            <option value="Poème">Poème</option>
          </select>
          
          <select value={language} onChange={(e) => setLanguage(e.target.value)} disabled={isSubmitting}>
            <option value="Français">Français</option>
            <option value="Soussou">Soussou</option>
            <option value="Peul">Peul</option>
            <option value="Malinké">Malinké</option>
            <option value="Kissi">Kissi</option>
            <option value="Toma">Toma</option>
          </select>
          
          <select value={region} onChange={(e) => setRegion(e.target.value)} disabled={isSubmitting}>
            <option value="Conakry">Conakry</option>
            <option value="Kindia">Kindia</option>
            <option value="Boké">Boké</option>
            <option value="Labé">Labé</option>
            <option value="Mamou">Mamou</option>
            <option value="Faranah">Faranah</option>
            <option value="Kankan">Kankan</option>
            <option value="Nzérékoré">Nzérékoré</option>
          </select>
        </div>
        
        <div className="create-post-footer">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,video/*,audio/*"
            style={{ display: 'none' }}
            disabled={isSubmitting}
          />
          <div className="media-buttons">
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isSubmitting}>
              📎 Ajouter un média
            </button>
            {mediaFile && (
              <span className="media-name">{mediaFile.name}</span>
            )}
          </div>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Publication...' : 'Publier'}
          </button>
        </div>
        {error && <p className="submit-error">{error}</p>}
      </form>
    </div>
  );
};

export default CreatePost;