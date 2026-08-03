package catalog

import (
	"testing"

	"github.com/LeonArif/Abtekindo/backend/internal/store"
)

func TestProductFilterNormalise(t *testing.T) {
	tests := []struct {
		name         string
		in           ProductFilter
		wantPage     int
		wantPageSize int
	}{
		{"zero values get defaults", ProductFilter{}, 1, DefaultPageSize},
		{"page below one is clamped", ProductFilter{Page: 0}, 1, DefaultPageSize},
		{"negative page is clamped", ProductFilter{Page: -5}, 1, DefaultPageSize},
		{"oversized page size is capped", ProductFilter{Page: 2, PageSize: 5000}, 2, MaxPageSize},
		{"valid values pass through", ProductFilter{Page: 3, PageSize: 12}, 3, 12},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			f := tt.in
			f.normalise()

			if f.Page != tt.wantPage {
				t.Errorf("Page = %d, want %d", f.Page, tt.wantPage)
			}
			if f.PageSize != tt.wantPageSize {
				t.Errorf("PageSize = %d, want %d", f.PageSize, tt.wantPageSize)
			}
			// Nil facets must become empty slices: the SQL uses
			// cardinality(...) = 0 to mean "no filter", and pgx cannot encode a
			// nil slice of a custom enum type at all.
			if f.Brands == nil || f.Types == nil || f.Capacities == nil {
				t.Error("normalise left a nil facet slice")
			}
		})
	}
}

func TestProductPageTotalPages(t *testing.T) {
	tests := []struct {
		name      string
		page      ProductPage
		want      int
		rationale string
	}{
		{"empty result still has one page", ProductPage{Total: 0, PageSize: 24}, 1, "an empty catalog reads as page 1 of 1"},
		{"exact multiple", ProductPage{Total: 48, PageSize: 24}, 2, ""},
		{"partial final page rounds up", ProductPage{Total: 49, PageSize: 24}, 3, ""},
		{"single item", ProductPage{Total: 1, PageSize: 24}, 1, ""},
		{"zero page size does not divide by zero", ProductPage{Total: 10, PageSize: 0}, 1, ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := tt.page.TotalPages(); got != tt.want {
				t.Errorf("TotalPages() = %d, want %d %s", got, tt.want, tt.rationale)
			}
		})
	}
}

func TestParseBrands(t *testing.T) {
	got := ParseBrands([]string{"daikin", "not-a-brand", "gree", ""})
	want := []store.Brand{store.BrandDaikin, store.BrandGree}

	if len(got) != len(want) {
		t.Fatalf("ParseBrands returned %v, want %v", got, want)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Errorf("ParseBrands[%d] = %q, want %q", i, got[i], want[i])
		}
	}
}

func TestParseBrandsAlwaysReturnsNonNil(t *testing.T) {
	// A nil slice reaching pgx fails to encode, so the empty case matters.
	if got := ParseBrands(nil); got == nil {
		t.Error("ParseBrands(nil) returned nil, want empty slice")
	}
	if got := ParseProductTypes(nil); got == nil {
		t.Error("ParseProductTypes(nil) returned nil, want empty slice")
	}
}

func TestParseProductType(t *testing.T) {
	if _, ok := ParseProductType("split-wall"); !ok {
		t.Error("ParseProductType(split-wall) should succeed")
	}
	if _, ok := ParseProductType("Split-Wall"); ok {
		t.Error("ParseProductType should be case sensitive, enum values are lowercase")
	}
	if _, ok := ParseProductType("vrv"); ok {
		t.Error("ParseProductType should reject a type that is not in the schema")
	}
}

func TestImageURL(t *testing.T) {
	tests := []struct {
		name    string
		baseURL string
		key     string
		want    string
	}{
		{"composed against the CDN origin", "https://img.abtekindo.com", "products/a.jpg", "https://img.abtekindo.com/products/a.jpg"},
		{"trailing slash on the base is not doubled", "https://img.abtekindo.com/", "products/a.jpg", "https://img.abtekindo.com/products/a.jpg"},
		{"leading slash on the key is not doubled", "https://img.abtekindo.com", "/products/a.jpg", "https://img.abtekindo.com/products/a.jpg"},
		{"unconfigured storage yields a rooted path", "", "products/a.jpg", "/products/a.jpg"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c := New(nil, tt.baseURL)
			if got := c.imageURL(tt.key); got != tt.want {
				t.Errorf("imageURL(%q) = %q, want %q", tt.key, got, tt.want)
			}
		})
	}
}
