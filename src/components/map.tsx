"use client";
import React, { useEffect, useRef } from "react";
import "ol/ol.css";
import { Map, View } from "ol";
import { fromLonLat } from "ol/proj";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import { GeoJSON } from "ol/format";
import { Fill, Stroke, Style } from "ol/style";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";

import { geojsonObject } from "./data"; // Make sure to adjust the path as necessary
const MAPBOX_ ='https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12?access_token='+
  "pk.eyJ1IjoicGFjZTMwNjgiLCJhIjoiY20yY2U2Y3l4MHpndTJqb241NXNkbDUxZyJ9._x38TqLuw3fR-WBwyQzJow";


const MapComponent = () => {
  const mapRef = useRef(null);

  useEffect(() => {
    const initialCoordinates = fromLonLat([142.34725515, -34.541585409999996]);
    const zoomLevel = 17;

    // Create the OpenStreetMap map for testing
    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(), // Start with OSM to check if map displays
        }),
      ],
      view: new View({
        center: initialCoordinates,
        zoom: zoomLevel,
      }),
    });

    // Check if the map is displayed
    console.log("Map created:", map);

    // Create vector source and layer from GeoJSON object
    const vectorSource = new VectorSource({
      features: new GeoJSON().readFeatures(geojsonObject, {
        featureProjection: 'EPSG:3857',
      }),
    });

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: createStyle, // Use a simple style to verify rendering
    });

    // Add the vector layer to the map
    map.addLayer(vectorLayer);
    console.log("Vector layer added:", vectorLayer);

    // Clean up on component unmount
    return () => {
      map.setTarget(undefined);
      console.log("Map target cleared");
    };
  }, []);

  // Simple style for debugging
  const createStyle = (feature) => {
    return new Style({
      fill: new Fill({
        color: 'rgba(255, 0, 0, 0.5)', // Simple fill color
      }),
      stroke: new Stroke({
        color: 'rgba(0, 0, 255, 1)', // Simple stroke color
        width: 2,
      }),
    });
  };

  return (
    <div
      ref={mapRef}
      style={{ width: "100%", height: "700px", backgroundColor: "lightgrey" }}
    />
  );
};

export default MapComponent;
