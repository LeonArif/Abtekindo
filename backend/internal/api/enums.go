package api

import (
	"github.com/danielgtaylor/huma/v2"

	"github.com/LeonArif/Abtekindo/backend/internal/catalog"
	"github.com/LeonArif/Abtekindo/backend/internal/storage"
)

// Brand and ProductType are string types that publish their own OpenAPI enum.
//
// The alternative, a static `enum:"gree,daikin,..."` struct tag, would be a
// second copy of the value list that silently rots the moment a brand is added
// to the database enum. These derive from catalog at runtime instead, so the
// published schema, the request validator and the parser can never disagree.
//
// Two things fall out of this. Unknown values are rejected with 422 at the edge
// rather than silently ignored, and the TypeScript the frontend generates gets
// a literal union such as "gree" | "daikin" | "panasonic" | "midea" instead of
// a bare string.
type Brand string

// Schema implements huma.SchemaProvider.
func (Brand) Schema(huma.Registry) *huma.Schema {
	return &huma.Schema{
		Type:        huma.TypeString,
		Title:       "Brand",
		Description: "AC manufacturer",
		Enum:        toAnySlice(catalog.BrandValues()),
	}
}

// ProductType is the form factor of a unit.
type ProductType string

// Schema implements huma.SchemaProvider.
func (ProductType) Schema(huma.Registry) *huma.Schema {
	return &huma.Schema{
		Type:        huma.TypeString,
		Title:       "ProductType",
		Description: "Unit form factor",
		Enum:        toAnySlice(catalog.ProductTypeValues()),
	}
}

// ImageContentType is an uploadable image MIME type. Like Brand, its enum is
// derived at runtime, here from the storage package's allowlist, so the
// documented types and the accepted types are the same list.
type ImageContentType string

// Schema implements huma.SchemaProvider.
func (ImageContentType) Schema(huma.Registry) *huma.Schema {
	return &huma.Schema{
		Type:        huma.TypeString,
		Title:       "ImageContentType",
		Description: "Accepted image MIME type",
		Enum:        toAnySlice(storage.AllowedContentTypes()),
	}
}

func toAnySlice[T any](in []T) []any {
	out := make([]any, 0, len(in))
	for _, v := range in {
		out = append(out, v)
	}
	return out
}

func toStringSlice[T ~string](in []T) []string {
	out := make([]string, 0, len(in))
	for _, v := range in {
		out = append(out, string(v))
	}
	return out
}
