"use client";
import React, { useEffect, useRef } from "react";
import MapGL, { Source, Layer } from "react-map-gl";
import { LayerProps } from "react-map-gl";
import type { FeatureCollection } from "geojson";
import { geojsonObject, MAPBOX_TOKEN } from "./data";

const Map: React.FC = () => {
  const polygonLayerStyle: LayerProps = {
    id: "polygon-layer",
    type: "fill",
    paint: {
      "fill-color": [
        "case",
        ["has", "fill"],
        ["get", "fill"],
        "#ffffff", 
      ],
      "fill-opacity": [
        "case",
        ["has", "fill-opacity"],
        ["get", "fill-opacity"],
        0.1, 
      ],
    },
  };

  const lineLayerStyle: LayerProps = {
    id: "lines",
    type: "line",
    paint: {
      "line-color": "#00FF00",
      "line-width": 1,
    },
  };

  return (
    <div
      style={{ width: "100%", height: "700px", backgroundColor: "lightgrey" }}
    >
      <MapGL
        attributionControl={false}
        initialViewState={{
          longitude: 142.3476209583,
          latitude: -34.5407412127,
          zoom: 16.5,
        }}
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <Source id="my-geojson" type="geojson" data={geojsonObject}>
          <Layer {...polygonLayerStyle} />
          <Layer {...lineLayerStyle} />
        </Source>
      </MapGL>
    </div>
  );
};

export default Map;
