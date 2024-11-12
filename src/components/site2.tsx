"use client";
import React, { useEffect, useRef, useState } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import * as turf from '@turf/turf';
import { geojsonObject, MAPBOX_TOKEN } from './data';

const MapWithMeasurements: React.FC = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [draw, setDraw] = useState<MapboxDraw | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<GeoJSON.Feature | null>(null);
  const [measurements, setMeasurements] = useState({ area: '', length: '' });

  const [newPolygonProperties, setNewPolygonProperties] = useState({
    id: '',
    type: '',
    name: '',
    fill: '#00FFF6', // Default fill color
  });

  useEffect(() => {
    if (mapRef.current) {
      mapboxgl.accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.Map({
        container: mapRef.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [142.3476209583, -34.5407412127],
        zoom: 16,
      });

      const draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          line_string: true,
          trash: true,
        },
        modes: {
          ...MapboxDraw.modes,
          simple_select: MapboxDraw.modes.simple_select,
          direct_select: MapboxDraw.modes.direct_select,
          draw_polygon: MapboxDraw.modes.draw_polygon,
          draw_line_string: MapboxDraw.modes.draw_line_string,
        },
      });

      map.addControl(draw);
      setMap(map);
      setDraw(draw);

      map.on('draw.create', handleDrawEvent);
      map.on('draw.update', handleDrawEvent);
      map.on('draw.delete', handleDrawDelete);
      map.on('draw.selectionchange', handleDrawSelectionChange);

      map.on('load', () => {
        if (geojsonObject) {
          map.addSource('geojson', {
            type: 'geojson',
            data: geojsonObject,
          });

          geojsonObject.features.forEach((feature) => {
            draw.add(feature);
          });
        }
      });

      return () => {
        map.remove();
      };
    }
  }, []);

  const handleDrawEvent = (e: any) => {
    if (!draw) return;
    const features = draw.getAll().features || [];
    features.forEach((feature) => {
      saveFeatureToGeoJSON(feature);
    });
  };

  const handleDrawDelete = () => {
    setSelectedFeature(null);
    setMeasurements({ area: '', length: '' });
  };

  const handleDrawSelectionChange = (e: any) => {
    const selectedFeatures = e.features;

    if (selectedFeatures.length === 0) {
      setSelectedFeature(null);
      setMeasurements({ area: '', length: '' });
      return;
    }

    const selected = selectedFeatures[0];
    setSelectedFeature(selected);
    createMeasurementsForFeature(selected);
  };

  const createMeasurementsForFeature = (feature: GeoJSON.Feature) => {
    if (feature.geometry) {
      const newMeasurements = calculateMeasurement(feature);
      setMeasurements(newMeasurements);
    }
  };

  const calculateMeasurement = (feature: GeoJSON.Feature) => {
    if (!feature.geometry) return { area: '', length: '' };

    let area = '';
    let length = '';

    if (feature.geometry.type === 'Polygon') {
      const coordinates = feature.geometry.coordinates as turf.helpers.Position[][];
      const turfPolygon = turf.polygon(coordinates);
      area = (turf.area(turfPolygon) / 1_000_000).toFixed(2) + ' km²'; // Convert to km²
    }

    if (feature.geometry.type === 'LineString') {
      const coordinates = feature.geometry.coordinates as turf.helpers.Position[];
      const turfLine = turf.lineString(coordinates);
      length = (turf.length(turfLine, { units: 'kilometers' })).toFixed(2) + ' km'; // Convert to km
    }

    return { area, length };
  };

  const saveFeatureToGeoJSON = (feature: GeoJSON.Feature) => {
    feature.properties = {
      ...feature.properties,
      fill: newPolygonProperties.fill,
      id: newPolygonProperties.id,
      type: newPolygonProperties.type,
      name: newPolygonProperties.name,
    };

    if (map) {
      const currentSource = map.getSource('geojson');
      if (currentSource) {
        const updatedData = {
          type: 'FeatureCollection',
          features: [...(currentSource as any).getData().features, feature],
        };

        (currentSource as mapboxgl.GeoJSONSource).setData(updatedData);
      }
    }
  };

  const setPolygonStyle = (feature: GeoJSON.Feature) => {
    const fill = feature.properties?.fill || '#00FFF6'; // Use 'fill' property or default color

    return {
      id: `polygon-layer-${feature.properties?.id}`,
      type: 'fill',
      paint: {
        'fill-color': fill,
        'fill-opacity': feature.properties?.['fill-opacity'] || 0.5, // Default opacity
      },
    };
  };

  return (
    <div>
      {/* Map Container */}
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
        <button onClick={() => draw?.changeMode('draw_polygon')}>Add Polygon</button>
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
