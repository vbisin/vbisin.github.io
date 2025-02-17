import React, { useState } from 'react';
import { Globe, Map } from 'lucide-react';

// Travel data structure with specific image paths
const travels = {
  'USA': {
    code: 'USA',
    cities: {
      'Shenandoah National Park': {
        photos: [
          { 
            url: './src/images/usa/shenandoah/cattle.jpg',
            size: 'large',
            alt: 'Cattle grazing in Shenandoah National Park'
          },
          { 
            url: './src/images/usa/shenandoah/campfire.jpg',
            size: 'medium',
            alt: 'Evening campfire with friends'
          },
          { 
            url: './src/images/usa/shenandoah/landscape.jpg',
            size: 'small',
            alt: 'Mountain landscape view'
          }
        ]
      }
    }
  },
  'Italy': {
    code: 'ITA',
    cities: {
      'Val di Noto': {
        photos: [
          { 
            url: './src/images/italy/val-di-noto/cathedral.jpg',
            size: 'large',
            alt: 'Baroque cathedral with steps'
          },
          { 
            url: './src/images/italy/val-di-noto/steps.jpg',
            size: 'medium',
            alt: 'Cathedral steps view'
          },
          { 
            url: './src/images/italy/val-di-noto/detail.jpg',
            size: 'small',
            alt: 'Architectural detail'
          },
          { 
            url: './src/images/italy/val-di-noto/plaza.jpg',
            size: 'medium',
            alt: 'City plaza'
          },
          { 
            url: './src/images/italy/val-di-noto/street.jpg',
            size: 'small',
            alt: 'Street view'
          }
        ]
      },
      'Venice': {
        photos: [
          { 
            url: './src/images/italy/venice/university.jpg',
            size: 'large',
            alt: "Ca' Foscari University entrance"
          }
        ]
      },
      'Rome': {
        photos: [
          { 
            url: './src/images/italy/rome/forum.jpg',
            size: 'large',
            alt: 'Roman Forum panorama'
          },
          { 
            url: './src/images/italy/rome/architecture.jpg',
            size: 'medium',
            alt: 'Roman architecture'
          },
          { 
            url: './src/images/italy/rome/street.jpg',
            size: 'small',
            alt: 'Roman street scene'
          }
        ]
      },
      'Bologna': {
        photos: [
          { 
            url: './src/images/italy/bologna/towers.jpg',
            size: 'medium',
            alt: 'Bologna towers at night'
          }
        ]
      },
      'Milan': {
        photos: [
          { 
            url: './src/images/italy/milan/city.jpg',
            size: 'small',
            alt: 'Milan city view'
          }
        ]
      },
      'Verona': {
        photos: [
          { 
            url: './src/images/italy/verona/street.jpg',
            size: 'small',
            alt: 'Verona street scene'
          }
        ]
      },
      'Genova': {
        photos: [
          { 
            url: './src/images/italy/genova/view.jpg',
            size: 'small',
            alt: 'Genova city view'
          }
        ]
      },
      'Grosseto': {
        photos: [
          { 
            url: './src/images/italy/grosseto/thermal.jpg',
            size: 'small',
            alt: 'Thermal baths'
          }
        ]
      }
    }
  }
};

// Masonry layout component
const MasonryGallery = ({ photos }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {photos.map((photo, index) => (
        <div 
          key={index} 
          className={`${
            photo.size === 'large' ? 'col-span-2 row-span-2' :
            photo.size === 'medium' ? 'col-span-1 row-span-2' :
            'col-span-1 row-span-1'
          } overflow-hidden rounded-lg transform transition-transform duration-300 hover:scale-[1.02]`}
        >
          <img
            src={photo.url}
            alt={photo.alt}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
};

const TravelSection = () => {
  const [selectedCountry, setSelectedCountry] = useState(null);

  return (
    <div className="max-w-6xl mx-auto p-8 bg-purple-50">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Travel & Adventures</h1>
        <div className="flex justify-center items-center gap-4">
          <Globe className="text-purple-600" size={24} />
          <span className="text-gray-600">Exploring the world, one city at a time</span>
        </div>
      </div>

      {/* Countries and Cities */}
      {Object.entries(travels).map(([countryName, country]) => (
        <div key={countryName} className="mb-16">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
            <Map className="text-purple-600 mr-2" size={20} />
            {countryName}
          </h2>
          
          {/* Cities */}
          {Object.entries(country.cities).map(([cityName, city]) => (
            <div key={cityName} className="mb-12">
              <h3 className="text-xl text-gray-700 mb-4 pl-2 border-l-4 border-purple-300">
                {cityName}
              </h3>
              <MasonryGallery photos={city.photos} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default TravelSection;
