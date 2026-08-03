package api

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/danielgtaylor/huma/v2"

	"github.com/LeonArif/Abtekindo/backend/internal/catalog"
)

// publicCacheControl lets a CDN in front of the API serve repeat reads without
// hitting the origin. The frontend has its own tag-based cache that the admin
// invalidates on write, so this window only affects direct API consumers.
const publicCacheControl = "public, max-age=60, stale-while-revalidate=300"

// relatedProductLimit is how many suggestions a product page shows.
const relatedProductLimit = 4

// ListProductsInput is the catalog query. Slice parameters are comma-separated,
// for example ?brand=daikin,gree.
type ListProductsInput struct {
	Brand    []Brand       `query:"brand" doc:"Filter by one or more brands"`
	Type     []ProductType `query:"type" doc:"Filter by one or more unit types"`
	PK       []float64     `query:"pk" doc:"Filter by capacity in PK, e.g. 0.5,1,1.5"`
	Page     int           `query:"page" default:"1" minimum:"1" doc:"1-based page number"`
	PageSize int           `query:"pageSize" default:"24" minimum:"1" maximum:"100"`
}

// ListProductsOutput is a page of catalog results.
type ListProductsOutput struct {
	CacheControl string `header:"Cache-Control"`
	Body         ProductListBody
}

// GetProductInput identifies a product by slug.
type GetProductInput struct {
	Slug string `path:"slug" maxLength:"200" doc:"Product slug"`
}

// GetProductOutput is a single product plus related suggestions.
type GetProductOutput struct {
	CacheControl string `header:"Cache-Control"`
	Body         ProductBody
}

// ListFeaturedInput bounds the homepage selection.
type ListFeaturedInput struct {
	Limit int `query:"limit" default:"6" minimum:"1" maximum:"24"`
}

// ListFeaturedOutput is the homepage product selection.
type ListFeaturedOutput struct {
	CacheControl string `header:"Cache-Control"`
	Body         FeaturedProductsBody
}

// ListServicesOutput is every published service with its rate table.
type ListServicesOutput struct {
	CacheControl string `header:"Cache-Control"`
	Body         ServiceListBody
}

// GetServiceInput identifies a service by slug.
type GetServiceInput struct {
	Slug string `path:"slug" maxLength:"200" doc:"Service slug"`
}

// GetServiceOutput is a single service.
type GetServiceOutput struct {
	CacheControl string `header:"Cache-Control"`
	Body         ServiceDTO
}

// SitemapOutput lists every published slug.
type SitemapOutput struct {
	CacheControl string `header:"Cache-Control"`
	Body         SitemapBody
}

// registerPublic mounts the endpoints the public website reads from. None of
// them require authentication and all are safe to cache.
func (h *Handler) registerPublic(api huma.API) {
	huma.Register(api, huma.Operation{
		OperationID: "listProducts",
		Method:      http.MethodGet,
		Path:        "/v1/products",
		Summary:     "List catalog products",
		Description: "Returns published products with optional brand, type and capacity facets.",
		Tags:        []string{"Catalog"},
	}, h.listProducts)

	huma.Register(api, huma.Operation{
		OperationID: "getProduct",
		Method:      http.MethodGet,
		Path:        "/v1/products/{slug}",
		Summary:     "Get one product",
		Description: "Returns a single published product together with related suggestions.",
		Tags:        []string{"Catalog"},
	}, h.getProduct)

	huma.Register(api, huma.Operation{
		OperationID: "listFeaturedProducts",
		Method:      http.MethodGet,
		Path:        "/v1/products-featured",
		Summary:     "List featured products",
		Description: "Returns the products flagged for the homepage.",
		Tags:        []string{"Catalog"},
	}, h.listFeatured)

	huma.Register(api, huma.Operation{
		OperationID: "listServices",
		Method:      http.MethodGet,
		Path:        "/v1/services",
		Summary:     "List services",
		Description: "Returns published services with their price lists.",
		Tags:        []string{"Catalog"},
	}, h.listServices)

	huma.Register(api, huma.Operation{
		OperationID: "getService",
		Method:      http.MethodGet,
		Path:        "/v1/services/{slug}",
		Summary:     "Get one service",
		Tags:        []string{"Catalog"},
	}, h.getService)

	huma.Register(api, huma.Operation{
		OperationID: "getSitemap",
		Method:      http.MethodGet,
		Path:        "/v1/sitemap",
		Summary:     "List published slugs",
		Description: "Feeds the frontend's sitemap and static path generation.",
		Tags:        []string{"Catalog"},
	}, h.getSitemap)
}

func (h *Handler) listProducts(ctx context.Context, in *ListProductsInput) (*ListProductsOutput, error) {
	page, err := h.catalog.ListProducts(ctx, catalog.ProductFilter{
		Brands:     catalog.ParseBrands(toStringSlice(in.Brand)),
		Types:      catalog.ParseProductTypes(toStringSlice(in.Type)),
		Capacities: in.PK,
		Page:       in.Page,
		PageSize:   in.PageSize,
	})
	if err != nil {
		return nil, h.internal(ctx, "list products", err)
	}

	return &ListProductsOutput{
		CacheControl: publicCacheControl,
		Body: ProductListBody{
			Products: toProductDTOs(page.Products),
			Pagination: PaginationDTO{
				Page:       page.Page,
				PageSize:   page.PageSize,
				Total:      page.Total,
				TotalPages: page.TotalPages(),
			},
		},
	}, nil
}

func (h *Handler) getProduct(ctx context.Context, in *GetProductInput) (*GetProductOutput, error) {
	product, err := h.catalog.GetProductBySlug(ctx, strings.ToLower(in.Slug))
	if errors.Is(err, catalog.ErrNotFound) {
		return nil, huma.Error404NotFound("produk tidak ditemukan")
	}
	if err != nil {
		return nil, h.internal(ctx, "get product", err)
	}

	related, err := h.catalog.ListRelated(ctx, product, relatedProductLimit)
	if err != nil {
		// Suggestions are a nice-to-have. Failing the whole product page
		// because the related query broke would be a worse outcome than
		// rendering the page without them.
		h.logger.WarnContext(ctx, "related products unavailable", "slug", product.Slug, "error", err)
		related = nil
	}

	return &GetProductOutput{
		CacheControl: publicCacheControl,
		Body: ProductBody{
			Product: toProductDTO(product),
			Related: toProductDTOs(related),
		},
	}, nil
}

func (h *Handler) listFeatured(ctx context.Context, in *ListFeaturedInput) (*ListFeaturedOutput, error) {
	products, err := h.catalog.ListFeatured(ctx, int32(in.Limit))
	if err != nil {
		return nil, h.internal(ctx, "list featured products", err)
	}
	return &ListFeaturedOutput{
		CacheControl: publicCacheControl,
		Body:         FeaturedProductsBody{Products: toProductDTOs(products)},
	}, nil
}

func (h *Handler) listServices(ctx context.Context, _ *struct{}) (*ListServicesOutput, error) {
	services, err := h.catalog.ListServices(ctx)
	if err != nil {
		return nil, h.internal(ctx, "list services", err)
	}

	out := make([]ServiceDTO, 0, len(services))
	for _, s := range services {
		out = append(out, toServiceDTO(s))
	}
	return &ListServicesOutput{
		CacheControl: publicCacheControl,
		Body:         ServiceListBody{Services: out},
	}, nil
}

func (h *Handler) getService(ctx context.Context, in *GetServiceInput) (*GetServiceOutput, error) {
	service, err := h.catalog.GetServiceBySlug(ctx, strings.ToLower(in.Slug))
	if errors.Is(err, catalog.ErrNotFound) {
		return nil, huma.Error404NotFound("layanan tidak ditemukan")
	}
	if err != nil {
		return nil, h.internal(ctx, "get service", err)
	}
	return &GetServiceOutput{
		CacheControl: publicCacheControl,
		Body:         toServiceDTO(service),
	}, nil
}

func (h *Handler) getSitemap(ctx context.Context, _ *struct{}) (*SitemapOutput, error) {
	products, err := h.catalog.ListProductSlugs(ctx)
	if err != nil {
		return nil, h.internal(ctx, "list product slugs", err)
	}
	services, err := h.catalog.ListServices(ctx)
	if err != nil {
		return nil, h.internal(ctx, "list services for sitemap", err)
	}

	serviceEntries := make([]SlugEntryDTO, 0, len(services))
	for _, s := range services {
		serviceEntries = append(serviceEntries, SlugEntryDTO{Slug: s.Slug, UpdatedAt: s.UpdatedAt})
	}

	return &SitemapOutput{
		CacheControl: publicCacheControl,
		Body: SitemapBody{
			Products: toSlugEntryDTOs(products),
			Services: serviceEntries,
		},
	}, nil
}
