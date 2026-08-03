package catalog

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/LeonArif/Abtekindo/backend/internal/store"
)

// ErrSlugTaken is returned when a write would collide with an existing slug.
var ErrSlugTaken = errors.New("slug already in use")

// uniqueViolation is the Postgres error code for a unique constraint breach.
const uniqueViolation = "23505"

// ImageInput is a product photo being attached by the admin.
type ImageInput struct {
	ObjectKey string
	Alt       string
}

// ProductInput is the full editable state of a product.
//
// Writes replace the whole row rather than patching individual fields. For a
// CMS form that always submits every field, a partial-update API would only add
// ambiguity about whether an absent field means "unchanged" or "clear it".
type ProductInput struct {
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
	Images        []ImageInput
}

// ListAllProducts returns a page of products including unpublished ones.
func (c *Catalog) ListAllProducts(ctx context.Context, page, pageSize int) (ProductPage, error) {
	f := ProductFilter{Page: page, PageSize: pageSize}
	f.normalise()

	rows, err := c.q.ListAllProducts(ctx, store.ListAllProductsParams{
		ResultLimit:  int32(f.PageSize),
		ResultOffset: int32((f.Page - 1) * f.PageSize),
	})
	if err != nil {
		return ProductPage{}, fmt.Errorf("list all products: %w", err)
	}

	result := ProductPage{Page: f.Page, PageSize: f.PageSize}
	models := make([]store.Product, 0, len(rows))
	for _, row := range rows {
		models = append(models, row.Product)
		result.Total = row.TotalCount
	}

	products, err := c.attachImages(ctx, models)
	if err != nil {
		return ProductPage{}, err
	}
	result.Products = products
	return result, nil
}

// GetProduct returns one product by id, published or not.
func (c *Catalog) GetProduct(ctx context.Context, id string) (Product, error) {
	uid, err := parseUUID(id)
	if err != nil {
		return Product{}, ErrNotFound
	}

	row, err := c.q.GetProductByID(ctx, uid)
	if errors.Is(err, pgx.ErrNoRows) {
		return Product{}, ErrNotFound
	}
	if err != nil {
		return Product{}, fmt.Errorf("get product: %w", err)
	}

	products, err := c.attachImages(ctx, []store.Product{row})
	if err != nil {
		return Product{}, err
	}
	return products[0], nil
}

// CreateProduct inserts a product and its images atomically.
func (c *Catalog) CreateProduct(ctx context.Context, in ProductInput) (Product, error) {
	var created store.Product

	err := c.withTx(ctx, func(q *store.Queries) error {
		var err error
		created, err = q.CreateProduct(ctx, store.CreateProductParams{
			Slug:          in.Slug,
			Name:          in.Name,
			Brand:         in.Brand,
			Type:          in.Type,
			CapacityPk:    in.CapacityPK,
			Btu:           in.BTU,
			StartingPrice: in.StartingPrice,
			Inverter:      in.Inverter,
			Refrigerant:   in.Refrigerant,
			PowerWatt:     in.PowerWatt,
			RoomSize:      in.RoomSize,
			Description:   in.Description,
			Features:      nonNil(in.Features),
			Featured:      in.Featured,
			Published:     in.Published,
			SortOrder:     in.SortOrder,
		})
		if err != nil {
			return wrapSlugConflict(err)
		}
		return insertImages(ctx, q, created.ID, in.Images)
	})
	if err != nil {
		return Product{}, err
	}

	return c.GetProduct(ctx, created.ID.String())
}

// UpdateProduct replaces a product and its image set atomically.
func (c *Catalog) UpdateProduct(ctx context.Context, id string, in ProductInput) (Product, error) {
	uid, err := parseUUID(id)
	if err != nil {
		return Product{}, ErrNotFound
	}

	err = c.withTx(ctx, func(q *store.Queries) error {
		updated, err := q.UpdateProduct(ctx, store.UpdateProductParams{
			ID:            uid,
			Slug:          in.Slug,
			Name:          in.Name,
			Brand:         in.Brand,
			Type:          in.Type,
			CapacityPk:    in.CapacityPK,
			Btu:           in.BTU,
			StartingPrice: in.StartingPrice,
			Inverter:      in.Inverter,
			Refrigerant:   in.Refrigerant,
			PowerWatt:     in.PowerWatt,
			RoomSize:      in.RoomSize,
			Description:   in.Description,
			Features:      nonNil(in.Features),
			Featured:      in.Featured,
			Published:     in.Published,
			SortOrder:     in.SortOrder,
		})
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		if err != nil {
			return wrapSlugConflict(err)
		}

		// Replace rather than diff: the CMS submits the complete ordered image
		// list, so recreating it is both simpler and free of ordering bugs.
		if err := q.ReplaceProductImages(ctx, updated.ID); err != nil {
			return fmt.Errorf("clear product images: %w", err)
		}
		return insertImages(ctx, q, updated.ID, in.Images)
	})
	if err != nil {
		return Product{}, err
	}

	return c.GetProduct(ctx, id)
}

// DeleteProduct removes a product. Its images cascade; its leads do not.
func (c *Catalog) DeleteProduct(ctx context.Context, id string) error {
	uid, err := parseUUID(id)
	if err != nil {
		return ErrNotFound
	}

	rows, err := c.q.DeleteProduct(ctx, uid)
	if err != nil {
		return fmt.Errorf("delete product: %w", err)
	}
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

// --------------------------------------------------------------------------
// Services
// --------------------------------------------------------------------------

// RateInput is one line of a service price list being written.
type RateInput struct {
	Label     string
	Unit      string
	PriceFrom int64
	Note      string
}

// ServiceInput is the full editable state of a service.
type ServiceInput struct {
	Slug        string
	Name        string
	Summary     string
	Description string
	Bullets     []string
	Icon        string
	Published   bool
	SortOrder   int32
	Rates       []RateInput
}

// ListAllServices returns every service including unpublished ones.
func (c *Catalog) ListAllServices(ctx context.Context) ([]Service, error) {
	rows, err := c.q.ListAllServices(ctx)
	if err != nil {
		return nil, fmt.Errorf("list all services: %w", err)
	}
	return c.attachRates(ctx, rows)
}

// GetService returns one service by id, published or not.
func (c *Catalog) GetService(ctx context.Context, id string) (Service, error) {
	uid, err := parseUUID(id)
	if err != nil {
		return Service{}, ErrNotFound
	}

	row, err := c.q.GetServiceByID(ctx, uid)
	if errors.Is(err, pgx.ErrNoRows) {
		return Service{}, ErrNotFound
	}
	if err != nil {
		return Service{}, fmt.Errorf("get service: %w", err)
	}

	services, err := c.attachRates(ctx, []store.Service{row})
	if err != nil {
		return Service{}, err
	}
	return services[0], nil
}

// CreateService inserts a service and its rate table atomically, so a service
// can never be published with a half-written price list.
func (c *Catalog) CreateService(ctx context.Context, in ServiceInput) (Service, error) {
	var created store.Service

	err := c.withTx(ctx, func(q *store.Queries) error {
		var err error
		created, err = q.CreateService(ctx, store.CreateServiceParams{
			Slug:        in.Slug,
			Name:        in.Name,
			Summary:     in.Summary,
			Description: in.Description,
			Bullets:     nonNil(in.Bullets),
			Icon:        in.Icon,
			Published:   in.Published,
			SortOrder:   in.SortOrder,
		})
		if err != nil {
			return wrapSlugConflict(err)
		}
		return insertRates(ctx, q, created.ID, in.Rates)
	})
	if err != nil {
		return Service{}, err
	}

	return c.GetService(ctx, created.ID.String())
}

// UpdateService replaces a service and its rate table atomically.
func (c *Catalog) UpdateService(ctx context.Context, id string, in ServiceInput) (Service, error) {
	uid, err := parseUUID(id)
	if err != nil {
		return Service{}, ErrNotFound
	}

	err = c.withTx(ctx, func(q *store.Queries) error {
		updated, err := q.UpdateService(ctx, store.UpdateServiceParams{
			ID:          uid,
			Slug:        in.Slug,
			Name:        in.Name,
			Summary:     in.Summary,
			Description: in.Description,
			Bullets:     nonNil(in.Bullets),
			Icon:        in.Icon,
			Published:   in.Published,
			SortOrder:   in.SortOrder,
		})
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		if err != nil {
			return wrapSlugConflict(err)
		}

		if err := q.DeleteServiceRates(ctx, updated.ID); err != nil {
			return fmt.Errorf("clear service rates: %w", err)
		}
		return insertRates(ctx, q, updated.ID, in.Rates)
	})
	if err != nil {
		return Service{}, err
	}

	return c.GetService(ctx, id)
}

// DeleteService removes a service and its rates.
func (c *Catalog) DeleteService(ctx context.Context, id string) error {
	uid, err := parseUUID(id)
	if err != nil {
		return ErrNotFound
	}

	rows, err := c.q.DeleteService(ctx, uid)
	if err != nil {
		return fmt.Errorf("delete service: %w", err)
	}
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

func insertImages(ctx context.Context, q *store.Queries, productID pgtype.UUID, images []ImageInput) error {
	for i, img := range images {
		if _, err := q.AddProductImage(ctx, store.AddProductImageParams{
			ProductID: productID,
			ObjectKey: img.ObjectKey,
			Alt:       img.Alt,
			SortOrder: int32(i),
		}); err != nil {
			return fmt.Errorf("add product image %d: %w", i, err)
		}
	}
	return nil
}

func insertRates(ctx context.Context, q *store.Queries, serviceID pgtype.UUID, rates []RateInput) error {
	for i, r := range rates {
		unit := r.Unit
		if unit == "" {
			unit = "unit"
		}
		if _, err := q.AddServiceRate(ctx, store.AddServiceRateParams{
			ServiceID: serviceID,
			Label:     r.Label,
			Unit:      unit,
			PriceFrom: r.PriceFrom,
			Note:      r.Note,
			SortOrder: int32(i),
		}); err != nil {
			return fmt.Errorf("add service rate %d: %w", i, err)
		}
	}
	return nil
}

// wrapSlugConflict turns a unique violation into a domain error.
//
// Detecting the constraint breach beats checking for an existing slug first:
// a pre-check races with concurrent writes, whereas the database's own
// constraint cannot be raced.
func wrapSlugConflict(err error) error {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == uniqueViolation {
		return ErrSlugTaken
	}
	return err
}
