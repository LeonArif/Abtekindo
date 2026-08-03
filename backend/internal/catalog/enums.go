package catalog

import "github.com/LeonArif/Abtekindo/backend/internal/store"

// AllBrands and AllProductTypes are the single source of truth for what the API
// accepts. The HTTP layer builds its OpenAPI enum constraint from these, so the
// published schema can never drift from what the parser actually allows.
var (
	AllBrands = []store.Brand{
		store.BrandGree,
		store.BrandDaikin,
		store.BrandPanasonic,
		store.BrandMidea,
	}

	AllProductTypes = []store.ProductType{
		store.ProductTypeSplitWall,
		store.ProductTypeCassette,
		store.ProductTypeFloorStanding,
		store.ProductTypeCeilingSuspended,
		store.ProductTypePortable,
	}
)

// BrandValues returns the accepted brand values as strings, for schema tags.
func BrandValues() []string { return toStrings(AllBrands) }

// ProductTypeValues returns the accepted type values as strings.
func ProductTypeValues() []string { return toStrings(AllProductTypes) }

// ParseBrand converts an untrusted string into a Brand.
func ParseBrand(s string) (store.Brand, bool) {
	for _, b := range AllBrands {
		if string(b) == s {
			return b, true
		}
	}
	return "", false
}

// ParseProductType converts an untrusted string into a ProductType.
func ParseProductType(s string) (store.ProductType, bool) {
	for _, t := range AllProductTypes {
		if string(t) == s {
			return t, true
		}
	}
	return "", false
}

// ParseBrands converts a list of strings, silently dropping unknown values.
//
// Dropping rather than erroring is the right behaviour for a catalog facet: a
// stale bookmark naming a brand that no longer exists should still return
// results instead of a validation error. The HTTP layer rejects unknown values
// earlier via the OpenAPI enum, so this path is defence in depth.
func ParseBrands(values []string) []store.Brand {
	out := make([]store.Brand, 0, len(values))
	for _, v := range values {
		if b, ok := ParseBrand(v); ok {
			out = append(out, b)
		}
	}
	return out
}

// ParseProductTypes converts a list of strings, dropping unknown values.
func ParseProductTypes(values []string) []store.ProductType {
	out := make([]store.ProductType, 0, len(values))
	for _, v := range values {
		if t, ok := ParseProductType(v); ok {
			out = append(out, t)
		}
	}
	return out
}

func toStrings[T ~string](in []T) []string {
	out := make([]string, 0, len(in))
	for _, v := range in {
		out = append(out, string(v))
	}
	return out
}
