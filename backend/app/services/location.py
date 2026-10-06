import math


# Conservative bounds covering Pakistan while rejecting swapped or clearly
# unrelated geocoder results.
PAKISTAN_LATITUDE = (23.5, 37.5)
PAKISTAN_LONGITUDE = (60.5, 77.5)


def is_valid_pakistan_location(latitude: float, longitude: float) -> bool:
    return (
        math.isfinite(latitude)
        and math.isfinite(longitude)
        and PAKISTAN_LATITUDE[0] <= latitude <= PAKISTAN_LATITUDE[1]
        and PAKISTAN_LONGITUDE[0] <= longitude <= PAKISTAN_LONGITUDE[1]
    )
