import { useState, useEffect } from 'react';
import './CultureSlider.css';

const CultureSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Images de la culture guinéenne
  const images = [
    {
      url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=400&fit=crop',
      title: 'Danse traditionnelle guinéenne',
      description: 'Les danses folkloriques de Guinée'
    },
    {
      url: 'https://images.unsplash.com/photo-1571771019784-3ff35f4f4277?w=800&h=400&fit=crop',
      title: 'Instruments traditionnels',
      description: 'Djembé et autres percussions'
    },
    {
      url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=400&fit=crop',
      title: 'Artisanat guinéen',
      description: 'Tissage et sculptures traditionnelles'
    },
    {
      url: 'https://images.unsplash.com/photo-1571771019784-3ff35f4f4277?w=800&h=400&fit=crop',
      title: 'Cuisine guinéenne',
      description: 'Plats traditionnels et épices'
    },
    {
      url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=400&fit=crop',
      title: 'Paysages de Guinée',
      description: 'Montagnes du Fouta Djalon'
    }
  ];

  // Changement automatique toutes les 15 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, 15000);

    return () => clearInterval(interval);
  }, [images.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === images.length - 1 ? 0 : currentIndex + 1);
  };

  return (
    <div className="culture-slider">
      <div className="slider-container">
        <div 
          className="slider-wrapper" 
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((image, index) => (
            <div key={index} className="slide">
              <img src={image.url} alt={image.title} />
              <div className="slide-overlay">
                <h3>{image.title}</h3>
                <p>{image.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <button className="slider-btn prev" onClick={goToPrevious}>
          &#8249;
        </button>
        <button className="slider-btn next" onClick={goToNext}>
          &#8250;
        </button>
        
        <div className="slider-dots">
          {images.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CultureSlider;