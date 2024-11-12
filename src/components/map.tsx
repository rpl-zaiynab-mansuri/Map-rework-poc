"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import * as turf from '@turf/turf';
import { geojsonObject } from './data'; 

const Map: React.FC = () => {
  const [geoJsonData, setGeoJsonData] = useState(null);
  const [zoom, setZoom] = useState<number>(16.5);
  const mapCenter = { lat: -34.5407412127, lng: 142.3476209583 };
  
  useEffect(() => {
    setGeoJsonData(geojsonObject);
  }, []);

  // Initialize icons
  const initializeIcons = () => {
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/home/zaiynabmansuri/Documents/POC/maps-poc/t1/Map-rework-poc/public/favicon.ico',
      iconUrl:'/home/zaiynabmansuri/Documents/POC/maps-poc/t1/Map-rework-poc/public/favicon.ico',
      shadowUrl: '/home/zaiynabmansuri/Documents/POC/maps-poc/t1/Map-rework-poc/public/favicon.ico',
    });
  };

  useEffect(() => {
    initializeIcons();
  }, []);

   const styleFeature = (feature: any) => ({
    color: feature.properties.stroke || '#000000',
    weight: feature.properties['stroke-width'] || 2,
    fillColor: feature.properties.fill || '#0000FF',
    fillOpacity: feature.properties['fill-opacity'] || 0.5,
  });

   const onEachFeature = (feature: any, layer: L.Layer) => {
    
    if (feature.properties && feature.properties.name) {
      let areaInSqMeters;
      if (feature.geometry.type === 'Polygon') {
      const polygon = turf.polygon(feature.geometry.coordinates);
      areaInSqMeters = turf.area(polygon);
      }
      const areaInHectares = areaInSqMeters / 10000; 
  
      const name = feature.properties.name;
      const areaLabel = `${name} - ${areaInHectares.toFixed(2)} ha`;
  
      const labelHtml = `
        <div class="bg-green-700 text-white p-1 rounded-md font-semibold text-xs text-center">
          ${areaLabel}
        </div>`;
  
      layer.bindPopup(labelHtml);
    }

     layer.on({
      click: () => {
        console.log('Feature clicked:', feature.properties.name);
      },
    });
  };

  // Zoom level change event
  const ZoomLevelListener = () => {
    const map = useMap();
    map.on('zoomend', () => {
      setZoom(map.getZoom());
    });
    return null;
  };

  return (
    <div style={{ width: '100%', height: '500px' }}>
      <MapContainer 
        preferCanvas={true} 
        scrollWheelZoom={true} 
        center={mapCenter} 
        zoom={zoom} 
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer url="https://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}&s=Ga" />
        
        {geoJsonData && (
          <GeoJSON 
            data={geoJsonData} 
            style={styleFeature} 
            onEachFeature={onEachFeature} 
            pointToLayer={(feature, latlng) => 
              L.marker(latlng, {
                icon: L.icon({
                  iconUrl: feature.properties.iconUrl || 'default-icon.png',
                  iconSize: [25, 41],
                  iconAnchor: [12, 41],
                  popupAnchor: [1, -34],
                  shadowSize: [41, 41],
                }),
              })
            }
          />
        )}
        <ZoomLevelListener />
      </MapContainer>
    </div>
  );
};

export default Map;
