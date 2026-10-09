"""Dynamic CRS selection strategy for accurate planar geospatial measurements."""

import math
from typing import Tuple


def determine_optimal_projected_crs(centroid_lon: float, centroid_lat: float) -> Tuple[str, str]:
    """
    Selects the most suitable projected Coordinate Reference System (CRS)
    based on the geographic coordinates of the dataset centroid.

    For locations between 80°S and 84°N, Universal Transverse Mercator (UTM)
    is selected, which is conformal and minimizes planar distortion within its 6° zone.
    For polar regions, UPS (Universal Polar Stereographic) or equal-area is chosen.
    """
    if -80.0 <= centroid_lat <= 84.0:
        # Determine 6-degree UTM zone
        zone = math.floor((centroid_lon + 180.0) / 6.0) + 1
        zone = max(1, min(zone, 60))

        if centroid_lat >= 0:
            epsg_code = f"EPSG:{32600 + zone}"
            crs_name = f"WGS 84 / UTM Zone {zone}N ({epsg_code})"
        else:
            epsg_code = f"EPSG:{32700 + zone}"
            crs_name = f"WGS 84 / UTM Zone {zone}S ({epsg_code})"
            
        return epsg_code, crs_name

    # Polar North
    if centroid_lat > 84.0:
        return "EPSG:3413", "WGS 84 / NSIDC Sea Ice Polar Stereographic North (EPSG:3413)"
    
    # Polar South
    return "EPSG:3031", "WGS 84 / Antarctic Polar Stereographic (EPSG:3031)"
