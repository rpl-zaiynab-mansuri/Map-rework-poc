"use client";
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMapEvents } from 'react-leaflet';
import { EditControl } from "react-leaflet-draw";
import L from 'leaflet';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';
import "leaflet-draw/dist/leaflet.draw.css";
import { geojsonObject } from './data';

const MapWithMeasurements: React.FC = () => {
  const [geoJsonData, setGeoJsonData] = useState(geojsonObject);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [measurements, setMeasurements] = useState({ area: '', length: '' });
  const [newPolygonProperties, setNewPolygonProperties] = useState({
    id: '',
    type: '',
    name: '',
    fill: '#00FFF6',
  });

  const mapRef = useRef<L.Map | null>(null);

  // Initialize the map and draw controls
  const handleMapLoad = (map: L.Map) => {
    mapRef.current = map;
  };

  // Calculate area and length for the selected feature
  const calculateMeasurement = (feature: GeoJSON.Feature) => {
    if (!feature.geometry) return { area: '', length: '' };

    let area = '';
    let length = '';

    if (feature.geometry.type === 'Polygon') {
      const coordinates = feature.geometry.coordinates as turf.helpers.Position[][];
      const turfPolygon = turf.polygon(coordinates);
      area = (turf.area(turfPolygon) / 1_000_000).toFixed(2) + ' km²';
    }

    if (feature.geometry.type === 'LineString') {
      const coordinates = feature.geometry.coordinates as turf.helpers.Position[];
      const turfLine = turf.lineString(coordinates);
      length = (turf.length(turfLine, { units: 'kilometers' })).toFixed(2) + ' km';
    }

    return { area, length };
  };

  // On feature creation, save and style it
  const handleCreate = (e: any) => {
    const layer = e.layer;
    const feature = layer.toGeoJSON();
    feature.properties = { ...newPolygonProperties };

    // Calculate measurements and update GeoJSON data
    setGeoJsonData({
      ...geoJsonData,
      features: [...geoJsonData.features, feature],
    });
    createMeasurementsForFeature(feature);
  };

  // Calculate and display measurements for the selected feature
  const createMeasurementsForFeature = (feature: GeoJSON.Feature) => {
    const newMeasurements = calculateMeasurement(feature);
    setMeasurements(newMeasurements);
    setSelectedFeature(feature);
  };

  return (
    <div>
      {/* Map Container */}
      <MapContainer
        center={[-34.5407412127, 142.3476209583]}
        zoom={16}
        style={{ width: '100%', height: '500px' }}
        whenCreated={handleMapLoad}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        <EditControl
          position="topright"
          onCreated={handleCreate}
          draw={{
            rectangle: false,
            circle: false,
            marker: false,
            polyline: true,
            polygon: true,
          }}
        />

        <GeoJSON
          data={geoJsonData}
          style={(feature) => ({
            color: feature.properties.stroke || '#000',
            fillColor: feature.properties.fill || '#00FFF6',
            fillOpacity: feature.properties['fill-opacity'] || 0.5,
            weight: 2,
          })}
          onEachFeature={(feature, layer) => {
            layer.on({
              click: () => {
                createMeasurementsForFeature(feature);
              },
            });
          }}
        />
      </MapContainer>

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
        <button onClick={() => mapRef.current?.drawControl.enableDraw('polygon')}>Add Polygon</button>
      </div>

      {/* Measurements below the map */}
      {selectedFeature && (
        <div>
          <h4>Selected Feature: {selectedFeature.properties?.name || 'Unnamed'}</h4>
          <p>{measurements.area ? `Area: ${measurements.area}` : ''}</p>
          <p>{measurements.length ? `Length: ${measurements.length}` : ''}</p>
        </div>
      )}
    </div>
  );
};

export default MapWithMeasurements;
