// Package api defines the HTTP surface: huma operations and the DTOs they
// exchange.
//
// The DTOs here are a deliberate boundary. The frontend generates its
// TypeScript types from the OpenAPI document these produce, so field names and
// shapes are part of a published contract and must not be changed casually.
// Every collection field is emitted as an array rather than null, so the
// frontend never has to null-check one.
package api

import (
	"time"

	"github.com/LeonArif/Abtekindo/backend/internal/catalog"
)

// ImageDTO is a single product photo.
type ImageDTO struct {
	URL string `json:"url" doc:"Absolute URL of the image"`
	Alt string `json:"alt" doc:"Alternative text, in Indonesian"`
}

// ProductDTO is a catalog entry as returned to clients.
type ProductDTO struct {
	ID            string      `json:"id" format:"uuid"`
	Slug          string      `json:"slug" doc:"URL segment, e.g. daikin-standard-ftv25cxv-1pk"`
	Name          string      `json:"name"`
	Brand         Brand       `json:"brand"`
	Type          ProductType `json:"type"`
	CapacityPK    float64     `json:"capacityPk" doc:"Cooling capacity in PK (paardenkracht)"`
	BTU           int32       `json:"btu" doc:"Cooling capacity in BTU/h"`
	StartingPrice int64       `json:"startingPrice" doc:"Indicative starting price in whole rupiah"`
	Inverter      bool        `json:"inverter"`
	Refrigerant   string      `json:"refrigerant" doc:"Refrigerant type, e.g. R32"`
	PowerWatt     int32       `json:"powerWatt" doc:"Rated power draw in watts"`
	RoomSize      string      `json:"roomSize" doc:"Recommended room size, e.g. 14 - 18 m²"`
	Description   string      `json:"description"`
	Features      []string    `json:"features" nullable:"false"`
	Featured      bool        `json:"featured" doc:"Shown on the homepage"`
	// Published and SortOrder are always true and meaningless on public
	// endpoints, which only ever return published rows. They are here because
	// the admin CMS reads the same shape and needs them to populate its edit
	// form and flag hidden rows in the list.
	Published bool       `json:"published"`
	SortOrder int32      `json:"sortOrder" doc:"Lower values are shown first"`
	Images    []ImageDTO `json:"images" nullable:"false"`
	UpdatedAt time.Time  `json:"updatedAt"`
}

// PaginationDTO describes the position of a page within a result set.
type PaginationDTO struct {
	Page       int   `json:"page" doc:"Current page, 1-based"`
	PageSize   int   `json:"pageSize"`
	Total      int64 `json:"total" doc:"Total matching items across all pages"`
	TotalPages int   `json:"totalPages" doc:"At least 1, even when there are no results"`
}

// ProductListBody is the response body of the catalog listing.
type ProductListBody struct {
	Products   []ProductDTO  `json:"products" nullable:"false"`
	Pagination PaginationDTO `json:"pagination"`
}

// ProductBody wraps a single product.
type ProductBody struct {
	Product ProductDTO   `json:"product"`
	Related []ProductDTO `json:"related" nullable:"false" doc:"Other units of the same type, same brand first"`
}

// FeaturedProductsBody is the homepage product selection.
type FeaturedProductsBody struct {
	Products []ProductDTO `json:"products" nullable:"false"`
}

// RateDTO is one line of a service's published price list.
type RateDTO struct {
	Label     string `json:"label" doc:"What the rate covers, e.g. AC Split 0,5 - 1 PK"`
	Unit      string `json:"unit" doc:"Billing unit, e.g. unit, meter, kunjungan"`
	PriceFrom int64  `json:"priceFrom" doc:"Starting price in whole rupiah"`
	Note      string `json:"note" doc:"Optional qualifier, empty when there is none"`
}

// ServiceDTO is an offered service together with its rate table.
type ServiceDTO struct {
	ID          string    `json:"id" format:"uuid"`
	Slug        string    `json:"slug"`
	Name        string    `json:"name"`
	Summary     string    `json:"summary" doc:"One-sentence description for cards and listings"`
	Description string    `json:"description" doc:"Full description for the service page"`
	Bullets     []string  `json:"bullets" nullable:"false"`
	Icon        string    `json:"icon" doc:"Icon identifier the frontend maps to a glyph"`
	Published   bool      `json:"published"`
	SortOrder   int32     `json:"sortOrder" doc:"Lower values are shown first"`
	Rates       []RateDTO `json:"rates" nullable:"false"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// ServiceListBody is the response body of the services listing.
type ServiceListBody struct {
	Services []ServiceDTO `json:"services" nullable:"false"`
}

// SlugEntryDTO drives sitemap and static path generation.
type SlugEntryDTO struct {
	Slug      string    `json:"slug"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// SitemapBody lists everything the frontend needs to build its sitemap.
type SitemapBody struct {
	Products []SlugEntryDTO `json:"products" nullable:"false"`
	Services []SlugEntryDTO `json:"services" nullable:"false"`
}

// --------------------------------------------------------------------------
// Mapping from domain types
// --------------------------------------------------------------------------

func toProductDTO(p catalog.Product) ProductDTO {
	images := make([]ImageDTO, 0, len(p.Images))
	for _, img := range p.Images {
		images = append(images, ImageDTO{URL: img.URL, Alt: img.Alt})
	}
	return ProductDTO{
		ID:            p.ID,
		Slug:          p.Slug,
		Name:          p.Name,
		Brand:         Brand(p.Brand),
		Type:          ProductType(p.Type),
		CapacityPK:    p.CapacityPK,
		BTU:           p.BTU,
		StartingPrice: p.StartingPrice,
		Inverter:      p.Inverter,
		Refrigerant:   p.Refrigerant,
		PowerWatt:     p.PowerWatt,
		RoomSize:      p.RoomSize,
		Description:   p.Description,
		Features:      p.Features,
		Featured:      p.Featured,
		Published:     p.Published,
		SortOrder:     p.SortOrder,
		Images:        images,
		UpdatedAt:     p.UpdatedAt,
	}
}

func toProductDTOs(products []catalog.Product) []ProductDTO {
	out := make([]ProductDTO, 0, len(products))
	for _, p := range products {
		out = append(out, toProductDTO(p))
	}
	return out
}

func toServiceDTO(s catalog.Service) ServiceDTO {
	rates := make([]RateDTO, 0, len(s.Rates))
	for _, r := range s.Rates {
		rates = append(rates, RateDTO{
			Label:     r.Label,
			Unit:      r.Unit,
			PriceFrom: r.PriceFrom,
			Note:      r.Note,
		})
	}
	return ServiceDTO{
		ID:          s.ID,
		Slug:        s.Slug,
		Name:        s.Name,
		Summary:     s.Summary,
		Description: s.Description,
		Bullets:     s.Bullets,
		Icon:        s.Icon,
		Published:   s.Published,
		SortOrder:   s.SortOrder,
		Rates:       rates,
		UpdatedAt:   s.UpdatedAt,
	}
}

func toSlugEntryDTOs(entries []catalog.SlugEntry) []SlugEntryDTO {
	out := make([]SlugEntryDTO, 0, len(entries))
	for _, e := range entries {
		out = append(out, SlugEntryDTO{Slug: e.Slug, UpdatedAt: e.UpdatedAt})
	}
	return out
}
