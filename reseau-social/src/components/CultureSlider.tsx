import { useState, useEffect } from 'react';
import './CultureSlider.css';

interface SlideImage {
  url: string;
  title: string;
  description: string;
}

const CultureSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [images, setImages] = useState<SlideImage[]>([]);

  // Charger les images du dossier slider
  useEffect(() => {
    const loadImages = async () => {
      const potentialImages = [
        {
          url: '/slider/011217-environnement-43.jpg',
          title: 'Technologie et Environnement',
          description: 'Innovation pour un avenir durable'
        },
        {
          url: '/slider/1397.jpg',
          title: 'Culture Numérique',
          description: 'L’évolution technologique moderne'
        },
        {
          url: '/slider/160617-cyber43.jpg',
          title: 'Cybersécurité',
          description: 'Protection et sécurité numérique'
        },
        {
          url: '/slider/2fcdf6a1d58cc41c1cc794c94b1d904e.jpg',
          title: 'Innovation Technologique',
          description: 'Les nouvelles technologies au service de tous'
        },
        {
          url: '/slider/3542_854x480.jpg',
          title: 'Monde Connecté',
          description: 'La connectivité au cœur de notre quotidien'
        },
        {
          url: '/slider/4318ee9a04de8fb1dcb35cf31ffaf2c5.jpg',
          title: 'Innovation',
          description: 'Technologies d’avant-garde'
        },
        {
          url: '/slider/4954.jpg_860(0).jpg',
          title: 'Futur Technologique',
          description: 'Vision du futur numérique'
        },
        {
          url: '/slider/8404.jpg_wh860.jpg',
          title: 'Monde Numérique',
          description: 'La révolution digitale'
        },
        {
          url: '/slider/logoOrientMe.jpg',
          title: 'OrientMe',
          description: 'Votre guide dans le monde numérique'
        }
      ];

      const validImages: SlideImage[] = [];
      
      for (const image of potentialImages) {
        try {
          const response = await fetch(image.url, { method: 'HEAD' });
          if (response.ok) {
            validImages.push(image);
          }
        } catch (error) {
          console.log(`Image non accessible: ${image.url}`);
        }
      }

      if (validImages.length > 0) {
        setImages(validImages);
      } else {
        // Images par défaut si aucune n'est accessible
        setImages([
          {
            url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=400&fit=crop',
            title: 'Culture Technologique',
            description: 'Découvrez l’innovation'
          }
        ]);
      }
    };

    loadImages();
  }, []);

  // Changement automatique toutes les 5 secondes
  useEffect(() => {
    if (images.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

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