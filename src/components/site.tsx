import React, { useRef, useEffect } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { OSM } from 'ol/source';
import VectorSource from 'ol/source/Vector';
import { Draw } from 'ol/interaction';
import { fromLonLat } from 'ol/proj';
import { Style, Stroke, Fill } from 'ol/style';

const MapComponent: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);

  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      // Define the vector source and layer for drawing
      const vectorSource = new VectorSource();
      const vectorLayer = new VectorLayer({
        source: vectorSource,
        style: new Style({
          fill: new Fill({ color: 'rgba(255, 255, 255, 0.2)' }),
          stroke: new Stroke({ color: '#ffcc33', width: 2 }),
        }),
      });

      // Initialize the map
      mapInstance.current = new Map({
        target: mapRef.current,
        layers: [
          new TileLayer({ source: new OSM() }),
          vectorLayer,
        ],
        view: new View({
          center: fromLonLat([0, 0]), // Adjust to your desired starting coordinates
          zoom: 2,
        }),
      });

      // Add drawing interactions
      const drawPolygon = new Draw({
        source: vectorSource,
        type: 'Polygon',
      });
      const drawLine = new Draw({
        source: vectorSource,
        type: 'LineString',
      });

      // Add both draw interactions to the map
      mapInstance.current.addInteraction(drawPolygon);
      mapInstance.current.addInteraction(drawLine);
    }
  }, []);

  return <div ref={mapRef} style={{ width: '100%', height: '500px' }} />;
};

export default MapComponent;
