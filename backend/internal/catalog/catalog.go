// Package catalog holds the product and service domain logic.
//
// It sits between the generated store and the HTTP layer: it composes rows into
// whole domain objects, applies pagination rules, and turns storage keys into
// public URLs. Nothing here knows about HTTP, and nothing here leaks pgtype
// values to callers.
package catalog

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/LeonArif/Abtekindo/backend/internal/store"
)

// ErrNotFound is returned when a requested slug or id does not exist, or exists
// but is unpublished. The two cases are deliberately indistinguishable to
// public callers.
var ErrNotFound = errors.New("not found")

// Pagination bounds. The maximum exists so a crawler cannot ask for the entire
// catalog in one request as the product count grows.
const (
	DefaultPageSize = 24
	MaxPageSize     = 100
)

// Catalog reads and composes catalog data.
type Catalog struct {
	// pool is held alongside q because admin writes that touch a parent row and
	// its children must be transactional.
	pool *pgxpool.Pool
	q    *store.Queries
	// imageBaseURL is the public origin that object keys are served from,
	// typically the R2 CDN domain. Keeping it out of the database means the
	// CDN can be changed without rewriting every stored row.
	imageBaseURL string
}

// New builds a Catalog over the given connection pool.
func New(pool *pgxpool.Pool, imageBaseURL string) *Catalog {
	c := &Catalog{pool: pool, imageBaseURL: strings.TrimRight(imageBaseURL, "/")}
	if pool != nil {
		c.q = store.New(pool)
	}
	return c
}

// withTx runs fn inside a transaction.
func (c *Catalog) withTx(ctx context.Context, fn func(*store.Queries) error) error {
	tx, err := c.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}
	// Rollback after a successful commit is a no-op, so this is safe as the
	// single unconditional cleanup path.
	defer func() { _ = tx.Rollback(ctx) }()

	if err := fn(store.New(tx)); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

// Image is a single product photo.
type Image struct {
	URL string
	Alt string
}

// Product is a catalog entry with its images attached.
type Product struct {
	ID            string
	Slug          string
	Name          string
	Brand         store.Brand
	Type          store.ProductType
	CapacityPK    float64
	BTU           int32
	StartingPrice int64
	Inverter      bool
	Refrigerant   string
	PowerWatt     int32
	RoomSize      string
	Description   string
	Features      []string
	Featured      bool
	Published     bool
	SortOrder     int32
	Images        []Image
	UpdatedAt     time.Time
}

// Rate is one line of a service's published price list.
type Rate struct {
	Label     string
	Unit      string
	PriceFrom int64
	Note      string
}

// Service is an offered service with its rate table attached.
type Service struct {
	ID          string
	Slug        string
	Name        string
	Summary     string
	Description string
	Bullets     []string
	Icon        string
	Published   bool
	SortOrder   int32
	Rates       []Rate
	UpdatedAt   time.Time
}

// ProductFilter describes a catalog query. Empty facet slices mean "no filter".
type ProductFilter struct {
	Brands     []store.Brand
	Types      []store.ProductType
	Capacities []float64
	Page       int
	PageSize   int
}

// normalise clamps paging into a sane range so a hand-edited URL cannot request
// page 0 or a million rows.
func (f *ProductFilter) normalise() {
	if f.Page < 1 {
		f.Page = 1
	}
	if f.PageSize < 1 {
		f.PageSize = DefaultPageSize
	}
	if f.PageSize > MaxPageSize {
		f.PageSize = MaxPageSize
	}
	if f.Brands == nil {
		f.Brands = []store.Brand{}
	}
	if f.Types == nil {
		f.Types = []store.ProductType{}
	}
	if f.Capacities == nil {
		f.Capacities = []float64{}
	}
}

// ProductPage is one page of catalog results plus the unpaginated total.
type ProductPage struct {
	Products []Product
	Total    int64
	Page     int
	PageSize int
}

// TotalPages reports how many pages the current filter yields, minimum one so
// an empty result still renders as "page 1 of 1".
func (p ProductPage) TotalPages() int {
	if p.PageSize <= 0 {
		return 1
	}
	pages := int((p.Total + int64(p.PageSize) - 1) / int64(p.PageSize))
	if pages < 1 {
		return 1
	}
	return pages
}

// ListProducts returns a filtered, paginated page of published products.
func (c *Catalog) ListProducts(ctx context.Context, f ProductFilter) (ProductPage, error) {
	f.normalise()

	rows, err := c.q.ListPublishedProducts(ctx, store.ListPublishedProductsParams{
		Brands:       f.Brands,
		Types:        f.Types,
		Capacities:   f.Capacities,
		ResultLimit:  int32(f.PageSize),
		ResultOffset: int32((f.Page - 1) * f.PageSize),
	})
	if err != nil {
		return ProductPage{}, fmt.Errorf("list products: %w", err)
	}

	page := ProductPage{
		Products: make([]Product, 0, len(rows)),
		Page:     f.Page,
		PageSize: f.PageSize,
	}
	models := make([]store.Product, 0, len(rows))
	for _, row := range rows {
		models = append(models, row.Product)
		// Every row carries the same window count; reading it from the first
		// is enough, and zero rows correctly means a total of zero.
		page.Total = row.TotalCount
	}

	products, err := c.attachImages(ctx, models)
	if err != nil {
		return ProductPage{}, err
	}
	page.Products = products
	return page, nil
}

// GetProductBySlug returns a single published product.
func (c *Catalog) GetProductBySlug(ctx context.Context, slug string) (Product, error) {
	row, err := c.q.GetPublishedProductBySlug(ctx, slug)
	if errors.Is(err, pgx.ErrNoRows) {
		return Product{}, ErrNotFound
	}
	if err != nil {
		return Product{}, fmt.Errorf("get product %q: %w", slug, err)
	}

	products, err := c.attachImages(ctx, []store.Product{row})
	if err != nil {
		return Product{}, err
	}
	return products[0], nil
}

// ListFeatured returns products flagged for the homepage.
func (c *Catalog) ListFeatured(ctx context.Context, limit int32) ([]Product, error) {
	rows, err := c.q.ListFeaturedProducts(ctx, limit)
	if err != nil {
		return nil, fmt.Errorf("list featured products: %w", err)
	}
	return c.attachImages(ctx, rows)
}

// ListRelated returns other products of the same type, same brand first.
func (c *Catalog) ListRelated(ctx context.Context, p Product, limit int32) ([]Product, error) {
	id, err := parseUUID(p.ID)
	if err != nil {
		return nil, err
	}
	rows, err := c.q.ListRelatedProducts(ctx, store.ListRelatedProductsParams{
		Type:        p.Type,
		ExcludeID:   id,
		Brand:       p.Brand,
		ResultLimit: limit,
	})
	if err != nil {
		return nil, fmt.Errorf("list related products: %w", err)
	}
	return c.attachImages(ctx, rows)
}

// SlugEntry drives sitemap and static path generation on the frontend.
type SlugEntry struct {
	Slug      string
	UpdatedAt time.Time
}

// ListProductSlugs returns every published product slug with its last update.
func (c *Catalog) ListProductSlugs(ctx context.Context) ([]SlugEntry, error) {
	rows, err := c.q.ListPublishedProductSlugs(ctx)
	if err != nil {
		return nil, fmt.Errorf("list product slugs: %w", err)
	}
	out := make([]SlugEntry, 0, len(rows))
	for _, r := range rows {
		out = append(out, SlugEntry{Slug: r.Slug, UpdatedAt: r.UpdatedAt.Time})
	}
	return out, nil
}

// ListServices returns published services with their rate tables attached.
func (c *Catalog) ListServices(ctx context.Context) ([]Service, error) {
	rows, err := c.q.ListPublishedServices(ctx)
	if err != nil {
		return nil, fmt.Errorf("list services: %w", err)
	}
	return c.attachRates(ctx, rows)
}

// GetServiceBySlug returns a single published service with its rates.
func (c *Catalog) GetServiceBySlug(ctx context.Context, slug string) (Service, error) {
	row, err := c.q.GetPublishedServiceBySlug(ctx, slug)
	if errors.Is(err, pgx.ErrNoRows) {
		return Service{}, ErrNotFound
	}
	if err != nil {
		return Service{}, fmt.Errorf("get service %q: %w", slug, err)
	}
	services, err := c.attachRates(ctx, []store.Service{row})
	if err != nil {
		return Service{}, err
	}
	return services[0], nil
}

// attachImages loads images for a set of products in one query and groups them
// in memory, avoiding a query per product.
func (c *Catalog) attachImages(ctx context.Context, rows []store.Product) ([]Product, error) {
	products := make([]Product, 0, len(rows))
	if len(rows) == 0 {
		return products, nil
	}

	ids := make([]pgtype.UUID, 0, len(rows))
	for _, r := range rows {
		ids = append(ids, r.ID)
	}

	images, err := c.q.ListProductImages(ctx, ids)
	if err != nil {
		return nil, fmt.Errorf("list product images: %w", err)
	}

	byProduct := make(map[string][]Image, len(rows))
	for _, img := range images {
		key := img.ProductID.String()
		byProduct[key] = append(byProduct[key], Image{
			URL: c.imageURL(img.ObjectKey),
			Alt: img.Alt,
		})
	}

	for _, r := range rows {
		p := toProduct(r)
		if imgs, ok := byProduct[r.ID.String()]; ok {
			p.Images = imgs
		}
		products = append(products, p)
	}
	return products, nil
}

// attachRates loads rate tables for a set of services in one query.
func (c *Catalog) attachRates(ctx context.Context, rows []store.Service) ([]Service, error) {
	services := make([]Service, 0, len(rows))
	if len(rows) == 0 {
		return services, nil
	}

	ids := make([]pgtype.UUID, 0, len(rows))
	for _, r := range rows {
		ids = append(ids, r.ID)
	}

	rates, err := c.q.ListServiceRates(ctx, ids)
	if err != nil {
		return nil, fmt.Errorf("list service rates: %w", err)
	}

	byService := make(map[string][]Rate, len(rows))
	for _, rate := range rates {
		key := rate.ServiceID.String()
		byService[key] = append(byService[key], Rate{
			Label:     rate.Label,
			Unit:      rate.Unit,
			PriceFrom: rate.PriceFrom,
			Note:      rate.Note,
		})
	}

	for _, r := range rows {
		s := toService(r)
		if rs, ok := byService[r.ID.String()]; ok {
			s.Rates = rs
		}
		services = append(services, s)
	}
	return services, nil
}

func (c *Catalog) imageURL(objectKey string) string {
	key := strings.TrimLeft(objectKey, "/")
	if c.imageBaseURL == "" {
		// Object storage is not configured, which only happens in development.
		// Returning a rooted path keeps the value obviously non-public rather
		// than silently emitting a broken absolute URL.
		return "/" + key
	}
	return c.imageBaseURL + "/" + key
}

func toProduct(r store.Product) Product {
	return Product{
		ID:            r.ID.String(),
		Slug:          r.Slug,
		Name:          r.Name,
		Brand:         r.Brand,
		Type:          r.Type,
		CapacityPK:    r.CapacityPk,
		BTU:           r.Btu,
		StartingPrice: r.StartingPrice,
		Inverter:      r.Inverter,
		Refrigerant:   r.Refrigerant,
		PowerWatt:     r.PowerWatt,
		RoomSize:      r.RoomSize,
		Description:   r.Description,
		Features:      nonNil(r.Features),
		Featured:      r.Featured,
		Published:     r.Published,
		SortOrder:     r.SortOrder,
		Images:        []Image{},
		UpdatedAt:     r.UpdatedAt.Time,
	}
}

func toService(r store.Service) Service {
	return Service{
		ID:          r.ID.String(),
		Slug:        r.Slug,
		Name:        r.Name,
		Summary:     r.Summary,
		Description: r.Description,
		Bullets:     nonNil(r.Bullets),
		Icon:        r.Icon,
		Published:   r.Published,
		SortOrder:   r.SortOrder,
		Rates:       []Rate{},
		UpdatedAt:   r.UpdatedAt.Time,
	}
}

// nonNil guarantees a JSON array rather than null, so the frontend never has to
// null-check a collection.
func nonNil(s []string) []string {
	if s == nil {
		return []string{}
	}
	return s
}

func parseUUID(s string) (pgtype.UUID, error) {
	var id pgtype.UUID
	if err := id.Scan(s); err != nil {
		return pgtype.UUID{}, fmt.Errorf("invalid uuid %q: %w", s, err)
	}
	return id, nil
}
