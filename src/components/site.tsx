"use client";

import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import { Map, View, Overlay } from 'ol';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Draw } from 'ol/interaction';
import { fromLonLat } from 'ol/proj';
import { Style, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
import { getArea, getLength } from 'ol/sphere';
import { Geometry, Polygon, LineString } from 'ol/geom';
import GeoJSON from 'ol/format/GeoJSON';
import { geojsonObject } from "./data";

const MapWithMeasurements: React.FC = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<Map | null>(null);
  const [drawType, setDrawType] = useState<'Polygon' | 'LineString'>('Polygon');
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [tooltipOverlay, setTooltipOverlay] = useState<Overlay | null>(null);
  const drawRef = useRef<Draw | null>(null); // Define drawRef here

  // Function to add drawing interaction
  const addDrawingInteraction = (drawType: 'Polygon' | 'LineString') => {
    if (map && drawRef.current) {
      map.removeInteraction(drawRef.current); // Remove the previous drawing interaction if it exists
    }

    const vectorSource = map?.getLayers().item(1).getSource(); // Assuming your second layer is the vector layer

    const draw = new Draw({
      source: vectorSource,
      type: drawType,
    });
    map?.addInteraction(draw);
    drawRef.current = draw;

    draw.on('drawstart', () => {
      if (tooltipRef.current) {
        tooltipRef.current.innerHTML = '';
        tooltipOverlay?.setPosition(undefined);
      }
    });

    draw.on('drawend', (event) => {
      const geometry = event.feature.getGeometry();
      if (tooltipRef.current && tooltipOverlay) {
        const measurementText = getMeasurement(geometry);
        tooltipRef.current.innerHTML = measurementText;
        tooltipOverlay.setPosition(geometry.getLastCoordinate());
      }
    });
  };

  useEffect(() => {
    const vectorSource = new VectorSource({
      features: new GeoJSON().readFeatures(geojsonObject, {
        featureProjection: 'EPSG:3857',
      }),
    });

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: new Style({
        fill: new Fill({ color: 'rgba(255, 255, 255, 0.2)' }),
        stroke: new Stroke({ color: '#ffcc33', width: 2 }),
        image: new CircleStyle({ radius: 7, fill: new Fill({ color: '#ffcc33' }) }),
      }),
    });

    const map = new Map({
      target: mapRef.current!,
      layers: [
        new TileLayer({ source: new OSM() }),
        vectorLayer,
      ],
      view: new View({
        center: fromLonLat([142.34725515, -34.541585409999996]), zoom: 18,
      }),
    });

    setMap(map);

    const tooltipElement = document.createElement('div');
    tooltipElement.className = 'tooltip';
    tooltipElement.style.position = 'absolute';
    tooltipElement.style.backgroundColor = 'white';
    tooltipElement.style.padding = '5px';
    tooltipElement.style.border = '1px solid black';
    tooltipElement.style.borderRadius = '4px';
    tooltipElement.style.pointerEvents = 'none';

    const overlay = new Overlay({
      element: tooltipElement,
      offset: [15, 0],
      positioning: 'center-left',
    });
    map.addOverlay(overlay);
    tooltipRef.current = tooltipElement;
    setTooltipOverlay(overlay);

    // Add drawing interaction for initial drawType
    addDrawingInteraction(drawType);

    return () => {
      map.setTarget(null);
    };
  }, []); // Empty dependency array to only run once

  useEffect(() => {
    if (map && drawRef.current) {
      addDrawingInteraction(drawType); // Update the drawing interaction when drawType changes
    }
  }, [drawType, map]);

  const getMeasurement = (geometry: Geometry): string => {
    if (geometry instanceof Polygon) {
      const area = getArea(geometry);
      return area > 10000
        ? `${(area / 1000000).toFixed(2)} km²`
        : `${area.toFixed(2)} m²`;
    } else if (geometry instanceof LineString) {
      const length = getLength(geometry);
      return length > 1000
        ? `${(length / 1000).toFixed(2)} km`
        : `${length.toFixed(2)} m`;
    }
    return '';
  };

  return (
    <div>
      <div style={{ marginBottom: '10px', textAlign: 'center' }}>
        <label htmlFor="drawType">Select Draw Type: </label>
        <select
          id="drawType"
          value={drawType}
          onChange={(e) => setDrawType(e.target.value as 'Polygon' | 'LineString')}
        >
          <option value="Polygon">Polygon</option>
          <option value="LineString">Line</option>
        </select>
      </div>
      <div ref={mapRef} style={{ width: '100%', height: '500px' }}></div>
      <style jsx>{`
        .tooltip {
          font-size: 10px; /* Adjusted font size */
        }
      `}</style>
    </div>
  );
};

export default MapWithMeasurements;
