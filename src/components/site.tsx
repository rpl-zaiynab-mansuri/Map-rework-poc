"use client";
import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import L from 'leaflet';
import 'leaflet-draw';
import * as turf from '@turf/turf';
import { geojsonObject } from './data'; // Your existing GeoJSON data

const MapWithMeasurements: React.FC = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [editableLayers, setEditableLayers] = useState<L.FeatureGroup | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<GeoJSON.Feature | null>(null);
  const [measurements, setMeasurements] = useState({ area: '', length: '' });

  const [newPolygonProperties, setNewPolygonProperties] = useState({
    id: '',
    type: '',
    name: '',
    fill: '#00FFF6',
    weight: 2,
    fillOpacity: 0.5,
  });

  // Initialize the map only once
  useEffect(() => {
    if (!mapRef.current || map) return;

    const mapInstance = L.map(mapRef.current).setView([-34.5407412127, 142.3476209583], 16);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    }).addTo(mapInstance);

    const editableLayersInstance = new L.FeatureGroup();
    mapInstance.addLayer(editableLayersInstance);
    setEditableLayers(editableLayersInstance);

    const drawControlInstance = new L.Control.Draw({
      draw: {
        polygon: true,
        polyline: true,
        rectangle: true,
        circle: false,
      },
      edit: {
        featureGroup: editableLayersInstance,
        remove: true,
      },
    });

    mapInstance.addControl(drawControlInstance);
    setMap(mapInstance);

    // Add existing GeoJSON data to editable layers
    L.geoJSON(geojsonObject, {
      style: (feature) => ({
        color: feature.properties?.color || newPolygonProperties.fill,
        weight: feature.properties?.weight || newPolygonProperties.weight,
        fillColor: feature.properties?.fill || newPolygonProperties.fill,
        fillOpacity: feature.properties?.fillOpacity || newPolygonProperties.fillOpacity,
      }),
      onEachFeature: (feature, layer) => {
        layer.on('click', () => {
          setSelectedFeature(feature);
          if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
            const area = turf.area(feature).toFixed(2);
            setMeasurements((prev) => ({ ...prev, area }));
          }
          if (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString') {
            const length = turf.length(feature).toFixed(2);
            setMeasurements((prev) => ({ ...prev, length }));
          }
        });
        editableLayersInstance.addLayer(layer);
      },
    });

    // Event listener for creating new features
    mapInstance.on('draw:created', (e) => {
      const layer = e.layer;
      layer.setStyle({
        color: newPolygonProperties.fill,
        weight: newPolygonProperties.weight,
        fillColor: newPolygonProperties.fill,
        fillOpacity: newPolygonProperties.fillOpacity,
      });
      editableLayersInstance.addLayer(layer);
    });

    return () => {
      mapInstance.remove();
    };
  }, []);

  return (
    <div>
      <div ref={mapRef} style={{ width: '100%', height: '500px' }} />

      {/* Form to Add New Polygon */}
      <div>
        <h4>New Polygon Properties</h4>
        <input
          type="text"
          placeholder="ID"
          onChange={(e) => setNewPolygonProperties({ ...newPolygonProperties, id: e.target.value })}
        />
        <input
          type="text"
          placeholder="Type"
          onChange={(e) => setNewPolygonProperties({ ...newPolygonProperties, type: e.target.value })}
        />
        <input
          type="text"
          placeholder="Name"
          onChange={(e) => setNewPolygonProperties({ ...newPolygonProperties, name: e.target.value })}
        />
        <input
          type="color"
          value={newPolygonProperties.fill}
          onChange={(e) => setNewPolygonProperties({ ...newPolygonProperties, fill: e.target.value })}
        />
        <input
          type="number"
          placeholder="Line Weight"
          value={newPolygonProperties.weight}
          onChange={(e) => setNewPolygonProperties({ ...newPolygonProperties, weight: +e.target.value })}
        />
        <input
          type="number"
          placeholder="Fill Opacity"
          value={newPolygonProperties.fillOpacity}
          onChange={(e) => setNewPolygonProperties({ ...newPolygonProperties, fillOpacity: +e.target.value })}
        />
      </div>

      {/* Measurements display */}
      {selectedFeature && (
        <div>
          <h4>Selected Feature: {selectedFeature.properties?.name || 'Unnamed'}</h4>
          <p>{measurements.area ? `Area: ${measurements.area} m²` : ''}</p>
          <p>{measurements.length ? `Length: ${measurements.length} m` : ''}</p>
        </div>
      )}
    </div>
  );
};

export default MapWithMeasurements;
