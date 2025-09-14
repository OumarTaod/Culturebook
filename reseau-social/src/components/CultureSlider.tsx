import { useState, useEffect } from 'react';
import './CultureSlider.css';

interface SlideImage {
  url: string;
  title: string;
  description: string;
}

const CultureSlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const images: SlideImage[] = [
    {
      url: '/slider/slide-1.jpg',
      title: 'Contes Traditionnels',
      description: 'Découvrez les histoires ancestrales'
    },
    {
      url: '/slider/slide-2.jpg',
      title: 'Proverbes Africains',
      description: 'La sagesse transmise'
    },
    {
      url: '/slider/slide-3.jpg',
      title: 'Histoires Locales',
      description: 'Récits de votre communauté'
    },
    {
      url: '/slider/slide-4.jpg',
      title: 'Patrimoine Culturel',
      description: 'Notre héritage commun'
    }
  ];

  useEffect(() => {
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