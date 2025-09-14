import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import './Marketplace.css';

const Marketplace = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showSellModal, setShowSellModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: 'Artisanat', description: '' });

  useEffect(() => {
    const mockProducts = [
      { _id: '1', name: 'Masque Traditionnel', price: '25 000 GNF', category: 'Artisanat', location: 'Conakry', icon: '🎭', seller: 'Alpha Bah' },
      { _id: '2', name: 'Collier Artisanal', price: '15 000 GNF', category: 'Artisanat', location: 'Kindia', icon: '📿', seller: 'Mariama Sow' },
      { _id: '3', name: 'Djembé Authentique', price: '80 000 GNF', category: 'Musique', location: 'Kankan', icon: '🥁', seller: 'Sekou Touré' },
      { _id: '4', name: 'Livre de Contes', price: '12 000 GNF', category: 'Livres', location: 'Labé', icon: '📚', seller: 'Hadja Kaba' },
      { _id: '5', name: 'Boubou Traditionnel', price: '45 000 GNF', category: 'Vêtements', location: 'Boké', icon: '👗', seller: 'Ibrahima Diallo' }
    ];
    setProducts(mockProducts);
  }, []);

  useEffect(() => {
    if (activeCategory === 'Tous') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(product => product.category === activeCategory));
    }
  }, [products, activeCategory]);

  const handleSellProduct = () => {
    if (newProduct.name && newProduct.price) {
      const product = {
        _id: Date.now().toString(),
        ...newProduct,
        location: 'Conakry',
        icon: '🏷️',
        seller: user?.name || 'Vous'
      };
      setProducts(prev => [product, ...prev]);
      setNewProduct({ name: '', price: '', category: 'Artisanat', description: '' });
      setShowSellModal(false);
    }
  };

  return (
    <div className="marketplace-page">
      <div className="marketplace-header">
        <h1>🛒 Marketplace</h1>
        <p>Découvrez et vendez des objets culturels</p>
      </div>

      <div className="marketplace-actions">
        <button className="sell-btn" onClick={() => setShowSellModal(true)}>
          ➕ Vendre un article
        </button>
      </div>

      <div className="marketplace-categories">
        {['Tous', 'Artisanat', 'Livres', 'Musique', 'Vêtements'].map(category => (
          <button 
            key={category}
            className={`category-btn ${activeCategory === category ? 'active' : ''}`}
            onClick={() => setActiveCategory(category)}
          >
            {category === 'Tous' ? '🛍️ Tous' : 
             category === 'Artisanat' ? '🎨 Artisanat' :
             category === 'Livres' ? '📚 Livres' :
             category === 'Musique' ? '🎵 Musique' : '👗 Vêtements'}
          </button>
        ))}
      </div>

      <div className="products-grid">
        {filteredProducts.map(product => (
          <div key={product._id} className="product-card">
            <div className="product-image">{product.icon}</div>
            <h3>{product.name}</h3>
            <p className="price">{product.price}</p>
            <p className="location">📍 {product.location}</p>
            <p className="seller">Vendeur: {product.seller}</p>
            <button className="contact-btn">Contacter</button>
          </div>
        ))}
      </div>

      {showSellModal && (
        <div className="modal-overlay" onClick={() => setShowSellModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Vendre un article</h3>
            <input
              type="text"
              placeholder="Nom de l'article"
              value={newProduct.name}
              onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
              className="modal-input"
            />
            <input
              type="text"
              placeholder="Prix (ex: 25 000 GNF)"
              value={newProduct.price}
              onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
              className="modal-input"
            />
            <select
              value={newProduct.category}
              onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
              className="modal-input"
            >
              <option value="Artisanat">Artisanat</option>
              <option value="Livres">Livres</option>
              <option value="Musique">Musique</option>
              <option value="Vêtements">Vêtements</option>
            </select>
            <textarea
              placeholder="Description de l'article"
              value={newProduct.description}
              onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
              className="modal-textarea"
              rows={3}
            />
            <div className="modal-actions">
              <button onClick={() => setShowSellModal(false)} className="cancel-btn">
                Annuler
              </button>
              <button onClick={handleSellProduct} className="create-btn">
                Publier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;