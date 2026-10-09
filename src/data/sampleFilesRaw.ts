/**
 * Raw Sample KML content for testing manual drag-and-drop file upload.
 */

export const MUNICH_KML_RAW = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Munich Campus Cadastre Survey</name>
    <description>Cadastral parcels and utilities for the Bavarian Research Campus</description>
    
    <Placemark>
      <name>LOT_101_QUANTUM_LAB</name>
      <description>Research &amp; Development Facility</description>
      <ExtendedData>
        <Data name="parcel_id"><value>PAR-8921-A</value></Data>
        <Data name="zoning"><value>R&amp;D Special District</value></Data>
        <Data name="surveyor"><value>Bavarian Cadastral Office</value></Data>
      </ExtendedData>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              11.5650,48.1475,0
              11.5675,48.1475,0
              11.5675,48.1495,0
              11.5650,48.1495,0
              11.5650,48.1475,0
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>

    <Placemark>
      <name>LOT_102_SOLAR_CANOPY</name>
      <description>Renewable Energy Infrastructure</description>
      <ExtendedData>
        <Data name="capacity_kw"><value>640</value></Data>
        <Data name="grid_feed"><value>20kV Substation</value></Data>
      </ExtendedData>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              11.5685,48.1475,0
              11.5710,48.1475,0
              11.5710,48.1490,0
              11.5685,48.1490,0
              11.5685,48.1475,0
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>

    <Placemark>
      <name>LINE_201_PRIMARY_FIBER_BACKBONE</name>
      <description>Dark Fiber Telecommunication Trunk</description>
      <ExtendedData>
        <Data name="depth_m"><value>1.8</value></Data>
        <Data name="strands"><value>288</value></Data>
      </ExtendedData>
      <LineString>
        <coordinates>
          11.5645,48.1465,0
          11.5670,48.1485,0
          11.5700,48.1505,0
          11.5735,48.1530,0
        </coordinates>
      </LineString>
    </Placemark>

    <Placemark>
      <name>PT_301_GEODETIC_SURVEY_DATUM</name>
      <description>GNSS Reference Base Pillar</description>
      <ExtendedData>
        <Data name="elevation_m"><value>541.24</value></Data>
      </ExtendedData>
      <Point>
        <coordinates>11.5688,48.1482,0</coordinates>
      </Point>
    </Placemark>
  </Document>
</kml>`;

export const BERLIN_KML_RAW = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Berlin Mitte Infrastructure</name>
    <Placemark>
      <name>DISTRICT_HEATING_PLANT_MITTE</name>
      <description>Thermal utility footprint</description>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              13.3980,52.5150,0
              13.4040,52.5150,0
              13.4040,52.5200,0
              13.3980,52.5200,0
              13.3980,52.5150,0
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
    <Placemark>
      <name>UBAHN_LINE_U5_TUNNEL</name>
      <description>Subway transit path</description>
      <LineString>
        <coordinates>
          13.3880,52.5160,0
          13.3970,52.5170,0
          13.4080,52.5210,0
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;

export function downloadSampleKml(filename: string): void {
  const content = filename.includes('berlin') ? BERLIN_KML_RAW : MUNICH_KML_RAW;
  const blob = new Blob([content], { type: 'application/vnd.google-earth.kml+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
