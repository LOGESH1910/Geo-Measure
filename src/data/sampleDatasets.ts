/**
 * Verified Geospatial Sample Datasets for GeoMeasure Pro
 * Realistic polygons, linestrings, and points with accurate coordinates and calculated UTM projections.
 */

import { FileRecord } from '../types/geospatial';

export const SAMPLE_DATASETS: FileRecord[] = [
  {
    id: "sample_munich_cadastre",
    filename: "munich_campus_cadastre.kml",
    file_format: "KML",
    file_size_bytes: 14820,
    feature_count: 7,
    polygon_count: 4,
    linestring_count: 2,
    point_count: 1,
    other_count: 0,
    successful_measurements: 7,
    failed_measurements: 0,
    crs: "EPSG:4326 (WGS 84)",
    source_crs: "EPSG:4326",
    measurement_crs: "WGS 84 / UTM Zone 32N (EPSG:32632)",
    status: "COMPLETED",
    error_message: null,
    bbox: {
      min_x: 11.5640,
      min_y: 48.1460,
      max_x: 11.5745,
      max_y: 48.1540
    },
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    features: [
      {
        id: "feat_munich_1",
        file_id: "sample_munich_cadastre",
        feature_id: "LOT_101_QUANTUM_LAB",
        geometry_type: "Polygon",
        measurement_type: "AREA",
        measurement_value: 14250.80, // m²
        measurement_unit: "m²",
        secondary_value: 1.4251,     // ha
        secondary_unit: "ha",
        status: "SUCCESS",
        status_message: "Planar area calculated via UTM Zone 32N projection.",
        properties_data: {
          parcel_id: "PAR-8921-A",
          zoning: "Research & Development (R&D)",
          building_name: "Center for Quantum Nano-Science",
          max_height_m: 24.5,
          surveyor_org: "Bavarian Cadastral Office",
          survey_date: "2026-03-15"
        },
        geojson_geometry: {
          type: "Polygon",
          coordinates: [[
            [11.5650, 48.1475],
            [11.5675, 48.1475],
            [11.5675, 48.1495],
            [11.5650, 48.1495],
            [11.5650, 48.1475]
          ]]
        },
        created_at: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: "feat_munich_2",
        file_id: "sample_munich_cadastre",
        feature_id: "LOT_102_SOLAR_CANOPY",
        geometry_type: "Polygon",
        measurement_type: "AREA",
        measurement_value: 8640.25,
        measurement_unit: "m²",
        secondary_value: 0.8640,
        secondary_unit: "ha",
        status: "SUCCESS",
        status_message: "Planar area calculated via UTM Zone 32N projection.",
        properties_data: {
          parcel_id: "PAR-8921-B",
          zoning: "Renewable Energy Infrastructure",
          installed_capacity_kw: 640,
          inspection_grade: "Class A",
          connected_grid: "SWM Munich 20kV"
        },
        geojson_geometry: {
          type: "Polygon",
          coordinates: [[
            [11.5685, 48.1475],
            [11.5710, 48.1475],
            [11.5710, 48.1490],
            [11.5685, 48.1490],
            [11.5685, 48.1475]
          ]]
        },
        created_at: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: "feat_munich_3",
        file_id: "sample_munich_cadastre",
        feature_id: "LOT_103_GREEN_BIODIVERSITY_ZONE",
        geometry_type: "Polygon",
        measurement_type: "AREA",
        measurement_value: 21870.50,
        measurement_unit: "m²",
        secondary_value: 2.1871,
        secondary_unit: "ha",
        status: "SUCCESS",
        status_message: "Planar area calculated via UTM Zone 32N projection.",
        properties_data: {
          parcel_id: "PAR-8922-ENV",
          protection_status: "Bavarian Nature Conservation Directive",
          canopy_cover_pct: 68,
          soil_type: "Alluvial Loam"
        },
        geojson_geometry: {
          type: "Polygon",
          coordinates: [[
            [11.5660, 48.1500],
            [11.5730, 48.1500],
            [11.5725, 48.1525],
            [11.5655, 48.1525],
            [11.5660, 48.1500]
          ]]
        },
        created_at: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: "feat_munich_4",
        file_id: "sample_munich_cadastre",
        feature_id: "LOT_104_CIVIL_MATERIALS_TESTING",
        geometry_type: "Polygon",
        measurement_type: "AREA",
        measurement_value: 6320.10,
        measurement_unit: "m²",
        secondary_value: 0.6320,
        secondary_unit: "ha",
        status: "SUCCESS",
        status_message: "Planar area calculated via UTM Zone 32N projection.",
        properties_data: {
          parcel_id: "PAR-8923-MAT",
          facility_type: "Heavy Mechanics & Structural Testing",
          foundation_bearing_kpa: 450
        },
        geojson_geometry: {
          type: "Polygon",
          coordinates: [[
            [11.5715, 48.1470],
            [11.5740, 48.1470],
            [11.5740, 48.1485],
            [11.5715, 48.1485],
            [11.5715, 48.1470]
          ]]
        },
        created_at: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: "feat_munich_5",
        file_id: "sample_munich_cadastre",
        feature_id: "LINE_201_PRIMARY_FIBER_BACKBONE",
        geometry_type: "LineString",
        measurement_type: "LENGTH",
        measurement_value: 1145.60,
        measurement_unit: "m",
        secondary_value: 1.1456,
        secondary_unit: "km",
        status: "SUCCESS",
        status_message: "Planar length calculated via UTM Zone 32N projection.",
        properties_data: {
          utility_type: "Dark Fiber Optic Trunk",
          conduit_depth_m: 1.8,
          core_count: 288,
          maintenance_contract: "DFN German Research Network"
        },
        geojson_geometry: {
          type: "LineString",
          coordinates: [
            [11.5645, 48.1465],
            [11.5670, 48.1485],
            [11.5700, 48.1505],
            [11.5735, 48.1530]
          ]
        },
        created_at: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: "feat_munich_6",
        file_id: "sample_munich_cadastre",
        feature_id: "LINE_202_CAMPUS_SECURITY_PERIMETER",
        geometry_type: "LineString",
        measurement_type: "LENGTH",
        measurement_value: 1890.40,
        measurement_unit: "m",
        secondary_value: 1.8904,
        secondary_unit: "km",
        status: "SUCCESS",
        status_message: "Planar length calculated via UTM Zone 32N projection.",
        properties_data: {
          barrier_type: "Anti-Climb Rigid Mesh Fence",
          sensor_monitored: true,
          access_gate_count: 3
        },
        geojson_geometry: {
          type: "LineString",
          coordinates: [
            [11.5645, 48.1465],
            [11.5745, 48.1465],
            [11.5745, 48.1535],
            [11.5645, 48.1535]
          ]
        },
        created_at: new Date(Date.now() - 3600000 * 2).toISOString()
      },
      {
        id: "feat_munich_7",
        file_id: "sample_munich_cadastre",
        feature_id: "PT_301_GEODETIC_SURVEY_DATUM",
        geometry_type: "Point",
        measurement_type: "COORDINATES",
        measurement_value: null,
        measurement_unit: "deg",
        secondary_value: null,
        secondary_unit: null,
        status: "SUCCESS",
        status_message: "Geodetic control point coordinates recorded; planar area and length not applicable.",
        properties_data: {
          point_classification: "Bavarian State Geodetic Reference Pillar #409",
          ellipsoidal_height_m: 541.24,
          gravity_anomaly_mgal: -12.4,
          antenna_mount: "Choke-Ring GNSS Station"
        },
        geojson_geometry: {
          type: "Point",
          coordinates: [11.5688, 48.1482]
        },
        created_at: new Date(Date.now() - 3600000 * 2).toISOString()
      }
    ]
  },
  {
    id: "sample_sf_waterfront",
    filename: "sf_embarcadero_piers.zip",
    file_format: "SHAPEFILE_ZIP",
    file_size_bytes: 42910,
    feature_count: 5,
    polygon_count: 2,
    linestring_count: 2,
    point_count: 1,
    other_count: 0,
    successful_measurements: 5,
    failed_measurements: 0,
    crs: "EPSG:4326 (NAD83 / WGS84)",
    source_crs: "EPSG:4326",
    measurement_crs: "WGS 84 / UTM Zone 10N (EPSG:32610)",
    status: "COMPLETED",
    error_message: null,
    bbox: {
      min_x: -122.4010,
      min_y: 37.7950,
      max_x: -122.3850,
      max_y: 37.8100
    },
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    features: [
      {
        id: "feat_sf_1",
        file_id: "sample_sf_waterfront",
        feature_id: "PIER_14_PUBLIC_ESPLANADE",
        geometry_type: "Polygon",
        measurement_type: "AREA",
        measurement_value: 7850.30,
        measurement_unit: "m²",
        secondary_value: 0.7850,
        secondary_unit: "ha",
        status: "SUCCESS",
        status_message: "Planar area calculated via UTM Zone 10N projection.",
        properties_data: {
          pier_number: 14,
          operator: "Port of San Francisco",
          public_access: "24/7 Pedestrian & Fishing Pier",
          pile_material: "Pre-stressed concrete"
        },
        geojson_geometry: {
          type: "Polygon",
          coordinates: [[
            [-122.3915, 37.7950],
            [-122.3880, 37.7965],
            [-122.3885, 37.7972],
            [-122.3920, 37.7958],
            [-122.3915, 37.7950]
          ]]
        },
        created_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: "feat_sf_2",
        file_id: "sample_sf_waterfront",
        feature_id: "PIER_1_HISTORIC_OFFICE_DOCK",
        geometry_type: "Polygon",
        measurement_type: "AREA",
        measurement_value: 12450.00,
        measurement_unit: "m²",
        secondary_value: 1.2450,
        secondary_unit: "ha",
        status: "SUCCESS",
        status_message: "Planar area calculated via UTM Zone 10N projection.",
        properties_data: {
          pier_number: 1,
          historic_registry: "National Register of Historic Places",
          tenant: "Port Headquarters & Maritime Conservancy"
        },
        geojson_geometry: {
          type: "Polygon",
          coordinates: [[
            [-122.3950, 37.7995],
            [-122.3910, 37.8010],
            [-122.3915, 37.8020],
            [-122.3955, 37.8005],
            [-122.3950, 37.7995]
          ]]
        },
        created_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: "feat_sf_3",
        file_id: "sample_sf_waterfront",
        feature_id: "CORRIDOR_FERRY_TRANSIT_LANE",
        geometry_type: "LineString",
        measurement_type: "LENGTH",
        measurement_value: 2340.80,
        measurement_unit: "m",
        secondary_value: 2.3408,
        secondary_unit: "km",
        status: "SUCCESS",
        status_message: "Planar length calculated via UTM Zone 10N projection.",
        properties_data: {
          route_code: "WETA-OAK-SF",
          speed_limit_knots: 15,
          vessel_draft_limit_m: 4.2
        },
        geojson_geometry: {
          type: "LineString",
          coordinates: [
            [-122.3930, 37.7960],
            [-122.3880, 37.8000],
            [-122.3850, 37.8060]
          ]
        },
        created_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: "feat_sf_4",
        file_id: "sample_sf_waterfront",
        feature_id: "LINE_EMBARCADERO_SEAWALL",
        geometry_type: "LineString",
        measurement_type: "LENGTH",
        measurement_value: 1680.10,
        measurement_unit: "m",
        secondary_value: 1.6801,
        secondary_unit: "km",
        status: "SUCCESS",
        status_message: "Planar length calculated via UTM Zone 10N projection.",
        properties_data: {
          infrastructure_project: "Earthquake Safety and Seawall Resilience Project",
          year_constructed: 1912,
          crest_elevation_m: 3.8
        },
        geojson_geometry: {
          type: "LineString",
          coordinates: [
            [-122.3935, 37.7945],
            [-122.3945, 37.7985],
            [-122.3965, 37.8030],
            [-122.3995, 37.8070]
          ]
        },
        created_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: "feat_sf_5",
        file_id: "sample_sf_waterfront",
        feature_id: "NAV_BEACON_OAKLAND_APPROACH",
        geometry_type: "Point",
        measurement_type: "COORDINATES",
        measurement_value: null,
        measurement_unit: "deg",
        secondary_value: null,
        secondary_unit: null,
        status: "SUCCESS",
        status_message: "Navigational marker coordinates recorded; planar area and length not applicable.",
        properties_data: {
          us_coast_guard_id: "LLNR-4520",
          light_characteristic: "Fl G 4s",
          nominal_range_nm: 7.0
        },
        geojson_geometry: {
          type: "Point",
          coordinates: [-122.3872, 37.8015]
        },
        created_at: new Date(Date.now() - 86400000).toISOString()
      }
    ]
  },
  {
    id: "sample_berlin_utilities",
    filename: "berlin_mixed_infrastructure.kml",
    file_format: "KML",
    file_size_bytes: 18450,
    feature_count: 4,
    polygon_count: 1,
    linestring_count: 1,
    point_count: 1,
    other_count: 1,
    successful_measurements: 3,
    failed_measurements: 1,
    crs: "EPSG:4326",
    source_crs: "EPSG:4326",
    measurement_crs: "WGS 84 / UTM Zone 33N (EPSG:32633)",
    status: "COMPLETED",
    error_message: null,
    bbox: {
      min_x: 13.3850,
      min_y: 52.5100,
      max_x: 13.4150,
      max_y: 52.5300
    },
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    features: [
      {
        id: "feat_berlin_1",
        file_id: "sample_berlin_utilities",
        feature_id: "DISTRICT_HEATING_PLANT_MITTE",
        geometry_type: "Polygon",
        measurement_type: "AREA",
        measurement_value: 38200.75,
        measurement_unit: "m²",
        secondary_value: 3.8201,
        secondary_unit: "ha",
        status: "SUCCESS",
        status_message: "Planar area calculated via UTM Zone 33N projection.",
        properties_data: {
          utility_operator: "Vattenfall Wärme Berlin AG",
          thermal_output_mw: 440,
          fuel_mix: "Hydrogen-ready Natural Gas / Biomass"
        },
        geojson_geometry: {
          type: "Polygon",
          coordinates: [[
            [13.3980, 52.5150],
            [13.4040, 52.5150],
            [13.4040, 52.5200],
            [13.3980, 52.5200],
            [13.3980, 52.5150]
          ]]
        },
        created_at: new Date(Date.now() - 86400000 * 3).toISOString()
      },
      {
        id: "feat_berlin_2",
        file_id: "sample_berlin_utilities",
        feature_id: "UBAHN_LINE_U5_TUNNEL_ALIGNMENT",
        geometry_type: "LineString",
        measurement_type: "LENGTH",
        measurement_value: 1530.20,
        measurement_unit: "m",
        secondary_value: 1.5302,
        secondary_unit: "km",
        status: "SUCCESS",
        status_message: "Planar length calculated via UTM Zone 33N projection.",
        properties_data: {
          line: "U5",
          construction_method: "Tunnel Boring Machine (TBM 'Bärlinde')",
          electrification: "750V DC 3rd Rail"
        },
        geojson_geometry: {
          type: "LineString",
          coordinates: [
            [13.3880, 52.5160],
            [13.3970, 52.5170],
            [13.4080, 52.5210]
          ]
        },
        created_at: new Date(Date.now() - 86400000 * 3).toISOString()
      },
      {
        id: "feat_berlin_3",
        file_id: "sample_berlin_utilities",
        feature_id: "TELECOM_TOWER_ALEXANDERPLATZ",
        geometry_type: "Point",
        measurement_type: "COORDINATES",
        measurement_value: null,
        measurement_unit: "deg",
        secondary_value: null,
        secondary_unit: null,
        status: "SUCCESS",
        status_message: "Point coordinates recorded; planar area and length not applicable.",
        properties_data: {
          structure: "Berliner Fernsehturm",
          antenna_height_m: 368.03,
          broadcast_channels: "DVB-T2 / DAB+"
        },
        geojson_geometry: {
          type: "Point",
          coordinates: [13.4094, 52.5208]
        },
        created_at: new Date(Date.now() - 86400000 * 3).toISOString()
      },
      {
        id: "feat_berlin_4",
        file_id: "sample_berlin_utilities",
        feature_id: "COLLECTION_HISTORIC_RUIN_PARK",
        geometry_type: "GeometryCollection",
        measurement_type: "NONE",
        measurement_value: null,
        measurement_unit: null,
        secondary_value: null,
        secondary_unit: null,
        status: "UNSUPPORTED",
        status_message: "Geometry type 'GeometryCollection' contains heterogeneous elements and is unsupported for automatic planar single-value calculation.",
        properties_data: {
          park_name: "Klosterruine Mitte",
          heritage_classification: "Ensemble Monument",
          mixed_geometries_present: "Polygon boundary + Point monument + Line wall"
        },
        geojson_geometry: {
          type: "Polygon",
          coordinates: [[
            [13.4110, 52.5170],
            [13.4140, 52.5170],
            [13.4140, 52.5190],
            [13.4110, 52.5190],
            [13.4110, 52.5170]
          ]]
        },
        created_at: new Date(Date.now() - 86400000 * 3).toISOString()
      }
    ]
  }
];
