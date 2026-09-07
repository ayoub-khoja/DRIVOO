/* Minimal Google Maps Places typings used by GooglePlacesService / googleMaps loader. */

export {}

declare global {
  namespace google.maps {
    class LatLng {
      constructor(lat: number, lng: number)
      lat(): number
      lng(): number
    }

    interface MapLibraryHost {
      importLibrary?(name: string): Promise<unknown>
      places?: typeof google.maps.places
    }

    namespace places {
      enum PlacesServiceStatus {
        OK = 'OK',
        ZERO_RESULTS = 'ZERO_RESULTS',
        OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
        REQUEST_DENIED = 'REQUEST_DENIED',
        INVALID_REQUEST = 'INVALID_REQUEST',
        UNKNOWN_ERROR = 'UNKNOWN_ERROR',
      }

      interface AutocompletePrediction {
        description: string
        place_id: string
        structured_formatting?: {
          main_text: string
          secondary_text: string
        }
      }

      interface AutocompletionRequest {
        input: string
        componentRestrictions?: { country: string | string[] }
        location?: LatLng
        radius?: number
        language?: string
        types?: string[]
      }

      interface PlaceResult {
        place_id?: string
        name?: string
        formatted_address?: string
        geometry?: {
          location?: {
            lat: () => number
            lng: () => number
          }
        }
        address_components?: Array<{
          long_name: string
          short_name: string
          types: string[]
        }>
      }

      interface PlaceDetailsRequest {
        placeId: string
        fields?: string[]
      }

      class AutocompleteService {
        getPlacePredictions(
          request: AutocompletionRequest,
          callback: (
            predictions: AutocompletePrediction[] | null,
            status: PlacesServiceStatus | string,
          ) => void,
        ): void
      }

      class PlacesService {
        constructor(attrContainer: HTMLDivElement | HTMLElement)
        getDetails(
          request: PlaceDetailsRequest,
          callback: (result: PlaceResult | null, status: PlacesServiceStatus | string) => void,
        ): void
      }
    }
  }

  // eslint-disable-next-line no-var
  var google: {
    maps: google.maps.MapLibraryHost & {
      LatLng: typeof google.maps.LatLng
      places: {
        PlacesServiceStatus: typeof google.maps.places.PlacesServiceStatus
        AutocompleteService: typeof google.maps.places.AutocompleteService
        PlacesService: typeof google.maps.places.PlacesService
      }
      importLibrary?(name: string): Promise<unknown>
    }
  }

  interface Window {
    google?: typeof google
    __bcGoogleMapsPromise?: Promise<typeof google>
    __bcGoogleMapsCallback?: () => void
  }
}
