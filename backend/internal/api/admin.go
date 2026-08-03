package api

import (
	"context"
	"errors"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/LeonArif/Abtekindo/backend/internal/catalog"
	"github.com/LeonArif/Abtekindo/backend/internal/store"
)

// adminSecurity marks an operation as requiring a session cookie. Declaring it
// on the operation is what puts the requirement into the OpenAPI document; the
// requireAdmin middleware is what enforces it.
var adminSecurity = []map[string][]string{{"cookieAuth": {}}}

// ImageWrite is a product photo submitted by the admin.
type ImageWrite struct {
	ObjectKey string `json:"objectKey" minLength:"1" maxLength:"512" doc:"Key of the uploaded object in the bucket"`
	Alt       string `json:"alt" maxLength:"300" doc:"Alternative text, in Indonesian"`
}

// ProductWrite is the full editable state of a product.
//
// Writes replace the entire row. The CMS form always submits every field, so a
// partial-update shape would only introduce ambiguity between "unchanged" and
// "clear this".
type ProductWrite struct {
	Slug          string       `json:"slug" minLength:"1" maxLength:"200" pattern:"^[a-z0-9]+(-[a-z0-9]+)*$" doc:"Lowercase URL segment"`
	Name          string       `json:"name" minLength:"1" maxLength:"200"`
	Brand         Brand        `json:"brand"`
	Type          ProductType  `json:"type"`
	CapacityPK    float64      `json:"capacityPk" minimum:"0.1" maximum:"99" doc:"Cooling capacity in PK"`
	BTU           int32        `json:"btu" minimum:"1" maximum:"200000"`
	StartingPrice int64        `json:"startingPrice" minimum:"1" doc:"Indicative starting price in whole rupiah"`
	Inverter      bool         `json:"inverter"`
	Refrigerant   string       `json:"refrigerant" maxLength:"50"`
	PowerWatt     int32        `json:"powerWatt" minimum:"1" maximum:"100000"`
	RoomSize      string       `json:"roomSize" maxLength:"100"`
	Description   string       `json:"description" maxLength:"5000"`
	Features      []string     `json:"features" nullable:"false" maxItems:"30"`
	Featured      bool         `json:"featured"`
	Published     bool         `json:"published"`
	SortOrder     int32        `json:"sortOrder"`
	Images        []ImageWrite `json:"images" nullable:"false" maxItems:"12"`
}

func (w ProductWrite) toInput() catalog.ProductInput {
	images := make([]catalog.ImageInput, 0, len(w.Images))
	for _, img := range w.Images {
		images = append(images, catalog.ImageInput{ObjectKey: img.ObjectKey, Alt: img.Alt})
	}
	return catalog.ProductInput{
		Slug:          w.Slug,
		Name:          w.Name,
		Brand:         store.Brand(w.Brand),
		Type:          store.ProductType(w.Type),
		CapacityPK:    w.CapacityPK,
		BTU:           w.BTU,
		StartingPrice: w.StartingPrice,
		Inverter:      w.Inverter,
		Refrigerant:   w.Refrigerant,
		PowerWatt:     w.PowerWatt,
		RoomSize:      w.RoomSize,
		Description:   w.Description,
		Features:      w.Features,
		Featured:      w.Featured,
		Published:     w.Published,
		SortOrder:     w.SortOrder,
		Images:        images,
	}
}

// RateWrite is one line of a service price list.
type RateWrite struct {
	Label     string `json:"label" minLength:"1" maxLength:"200"`
	Unit      string `json:"unit" maxLength:"50" doc:"Defaults to \"unit\" when empty"`
	PriceFrom int64  `json:"priceFrom" minimum:"1" doc:"Starting price in whole rupiah"`
	Note      string `json:"note" maxLength:"300"`
}

// ServiceWrite is the full editable state of a service.
type ServiceWrite struct {
	Slug        string      `json:"slug" minLength:"1" maxLength:"200" pattern:"^[a-z0-9]+(-[a-z0-9]+)*$"`
	Name        string      `json:"name" minLength:"1" maxLength:"200"`
	Summary     string      `json:"summary" maxLength:"500"`
	Description string      `json:"description" maxLength:"5000"`
	Bullets     []string    `json:"bullets" nullable:"false" maxItems:"20"`
	Icon        string      `json:"icon" maxLength:"50"`
	Published   bool        `json:"published"`
	SortOrder   int32       `json:"sortOrder"`
	Rates       []RateWrite `json:"rates" nullable:"false" maxItems:"30"`
}

func (w ServiceWrite) toInput() catalog.ServiceInput {
	rates := make([]catalog.RateInput, 0, len(w.Rates))
	for _, r := range w.Rates {
		rates = append(rates, catalog.RateInput{
			Label:     r.Label,
			Unit:      r.Unit,
			PriceFrom: r.PriceFrom,
			Note:      r.Note,
		})
	}
	return catalog.ServiceInput{
		Slug:        w.Slug,
		Name:        w.Name,
		Summary:     w.Summary,
		Description: w.Description,
		Bullets:     w.Bullets,
		Icon:        w.Icon,
		Published:   w.Published,
		SortOrder:   w.SortOrder,
		Rates:       rates,
	}
}

// --------------------------------------------------------------------------
// Inputs and outputs
// --------------------------------------------------------------------------

type AdminListProductsInput struct {
	Page     int `query:"page" default:"1" minimum:"1"`
	PageSize int `query:"pageSize" default:"50" minimum:"1" maximum:"100"`
}

type AdminProductListOutput struct {
	Body ProductListBody
}

type AdminProductIDInput struct {
	ID string `path:"id" format:"uuid"`
}

type AdminCreateProductInput struct {
	Body ProductWrite
}

type AdminUpdateProductInput struct {
	ID   string `path:"id" format:"uuid"`
	Body ProductWrite
}

type AdminProductOutput struct {
	Body AdminProductBody
}

// AdminProductBody wraps a single product for admin responses. It is separate
// from ProductBody because the admin view carries no related suggestions.
type AdminProductBody struct {
	Product ProductDTO `json:"product"`
}

type AdminServiceListOutput struct {
	Body ServiceListBody
}

type AdminServiceIDInput struct {
	ID string `path:"id" format:"uuid"`
}

type AdminCreateServiceInput struct {
	Body ServiceWrite
}

type AdminUpdateServiceInput struct {
	ID   string `path:"id" format:"uuid"`
	Body ServiceWrite
}

type AdminServiceOutput struct {
	Body AdminServiceBody
}

// AdminServiceBody wraps a single service.
type AdminServiceBody struct {
	Service ServiceDTO `json:"service"`
}

// NoContentOutput is a 204 with no body.
type NoContentOutput struct {
	Status int
}

// --------------------------------------------------------------------------
// Registration
// --------------------------------------------------------------------------

func (h *Handler) registerAdmin(api huma.API) {
	guard := huma.Middlewares{h.requireAdmin}
	authErrors := []int{http.StatusUnauthorized}
	writeErrors := []int{http.StatusUnauthorized, http.StatusConflict, http.StatusUnprocessableEntity}

	huma.Register(api, huma.Operation{
		OperationID: "adminListProducts", Method: http.MethodGet, Path: "/v1/admin/products",
		Summary: "List all products", Description: "Includes unpublished products.",
		Tags: []string{"Admin"}, Security: adminSecurity, Middlewares: guard, Errors: authErrors,
	}, h.adminListProducts)

	huma.Register(api, huma.Operation{
		OperationID: "adminGetProduct", Method: http.MethodGet, Path: "/v1/admin/products/{id}",
		Summary: "Get a product by id", Tags: []string{"Admin"}, Security: adminSecurity,
		Middlewares: guard, Errors: append(authErrors, http.StatusNotFound),
	}, h.adminGetProduct)

	huma.Register(api, huma.Operation{
		OperationID: "adminCreateProduct", Method: http.MethodPost, Path: "/v1/admin/products",
		Summary: "Create a product", Tags: []string{"Admin"}, Security: adminSecurity,
		Middlewares: guard, Errors: writeErrors, DefaultStatus: http.StatusCreated,
	}, h.adminCreateProduct)

	huma.Register(api, huma.Operation{
		OperationID: "adminUpdateProduct", Method: http.MethodPut, Path: "/v1/admin/products/{id}",
		Summary: "Replace a product", Tags: []string{"Admin"}, Security: adminSecurity,
		Middlewares: guard, Errors: append(writeErrors, http.StatusNotFound),
	}, h.adminUpdateProduct)

	huma.Register(api, huma.Operation{
		OperationID: "adminDeleteProduct", Method: http.MethodDelete, Path: "/v1/admin/products/{id}",
		Summary: "Delete a product", Tags: []string{"Admin"}, Security: adminSecurity,
		Middlewares: guard, Errors: append(authErrors, http.StatusNotFound),
		DefaultStatus: http.StatusNoContent,
	}, h.adminDeleteProduct)

	huma.Register(api, huma.Operation{
		OperationID: "adminListServices", Method: http.MethodGet, Path: "/v1/admin/services",
		Summary: "List all services", Description: "Includes unpublished services.",
		Tags: []string{"Admin"}, Security: adminSecurity, Middlewares: guard, Errors: authErrors,
	}, h.adminListServices)

	huma.Register(api, huma.Operation{
		OperationID: "adminGetService", Method: http.MethodGet, Path: "/v1/admin/services/{id}",
		Summary: "Get a service by id", Tags: []string{"Admin"}, Security: adminSecurity,
		Middlewares: guard, Errors: append(authErrors, http.StatusNotFound),
	}, h.adminGetService)

	huma.Register(api, huma.Operation{
		OperationID: "adminCreateService", Method: http.MethodPost, Path: "/v1/admin/services",
		Summary: "Create a service", Tags: []string{"Admin"}, Security: adminSecurity,
		Middlewares: guard, Errors: writeErrors, DefaultStatus: http.StatusCreated,
	}, h.adminCreateService)

	huma.Register(api, huma.Operation{
		OperationID: "adminUpdateService", Method: http.MethodPut, Path: "/v1/admin/services/{id}",
		Summary: "Replace a service", Tags: []string{"Admin"}, Security: adminSecurity,
		Middlewares: guard, Errors: append(writeErrors, http.StatusNotFound),
	}, h.adminUpdateService)

	huma.Register(api, huma.Operation{
		OperationID: "adminDeleteService", Method: http.MethodDelete, Path: "/v1/admin/services/{id}",
		Summary: "Delete a service", Tags: []string{"Admin"}, Security: adminSecurity,
		Middlewares: guard, Errors: append(authErrors, http.StatusNotFound),
		DefaultStatus: http.StatusNoContent,
	}, h.adminDeleteService)
}

// --------------------------------------------------------------------------
// Product handlers
// --------------------------------------------------------------------------

func (h *Handler) adminListProducts(ctx context.Context, in *AdminListProductsInput) (*AdminProductListOutput, error) {
	page, err := h.catalog.ListAllProducts(ctx, in.Page, in.PageSize)
	if err != nil {
		return nil, h.internal(ctx, "admin list products", err)
	}
	return &AdminProductListOutput{Body: ProductListBody{
		Products: toProductDTOs(page.Products),
		Pagination: PaginationDTO{
			Page: page.Page, PageSize: page.PageSize,
			Total: page.Total, TotalPages: page.TotalPages(),
		},
	}}, nil
}

func (h *Handler) adminGetProduct(ctx context.Context, in *AdminProductIDInput) (*AdminProductOutput, error) {
	product, err := h.catalog.GetProduct(ctx, in.ID)
	if err != nil {
		return nil, h.catalogError(ctx, "admin get product", err)
	}
	return &AdminProductOutput{Body: AdminProductBody{Product: toProductDTO(product)}}, nil
}

func (h *Handler) adminCreateProduct(ctx context.Context, in *AdminCreateProductInput) (*AdminProductOutput, error) {
	product, err := h.catalog.CreateProduct(ctx, in.Body.toInput())
	if err != nil {
		return nil, h.catalogError(ctx, "admin create product", err)
	}
	h.revalidate(ctx, "products")
	return &AdminProductOutput{Body: AdminProductBody{Product: toProductDTO(product)}}, nil
}

func (h *Handler) adminUpdateProduct(ctx context.Context, in *AdminUpdateProductInput) (*AdminProductOutput, error) {
	product, err := h.catalog.UpdateProduct(ctx, in.ID, in.Body.toInput())
	if err != nil {
		return nil, h.catalogError(ctx, "admin update product", err)
	}
	h.revalidate(ctx, "products")
	return &AdminProductOutput{Body: AdminProductBody{Product: toProductDTO(product)}}, nil
}

func (h *Handler) adminDeleteProduct(ctx context.Context, in *AdminProductIDInput) (*NoContentOutput, error) {
	if err := h.catalog.DeleteProduct(ctx, in.ID); err != nil {
		return nil, h.catalogError(ctx, "admin delete product", err)
	}
	h.revalidate(ctx, "products")
	return &NoContentOutput{Status: http.StatusNoContent}, nil
}

// --------------------------------------------------------------------------
// Service handlers
// --------------------------------------------------------------------------

func (h *Handler) adminListServices(ctx context.Context, _ *struct{}) (*AdminServiceListOutput, error) {
	services, err := h.catalog.ListAllServices(ctx)
	if err != nil {
		return nil, h.internal(ctx, "admin list services", err)
	}
	out := make([]ServiceDTO, 0, len(services))
	for _, s := range services {
		out = append(out, toServiceDTO(s))
	}
	return &AdminServiceListOutput{Body: ServiceListBody{Services: out}}, nil
}

func (h *Handler) adminGetService(ctx context.Context, in *AdminServiceIDInput) (*AdminServiceOutput, error) {
	service, err := h.catalog.GetService(ctx, in.ID)
	if err != nil {
		return nil, h.catalogError(ctx, "admin get service", err)
	}
	return &AdminServiceOutput{Body: AdminServiceBody{Service: toServiceDTO(service)}}, nil
}

func (h *Handler) adminCreateService(ctx context.Context, in *AdminCreateServiceInput) (*AdminServiceOutput, error) {
	service, err := h.catalog.CreateService(ctx, in.Body.toInput())
	if err != nil {
		return nil, h.catalogError(ctx, "admin create service", err)
	}
	h.revalidate(ctx, "services")
	return &AdminServiceOutput{Body: AdminServiceBody{Service: toServiceDTO(service)}}, nil
}

func (h *Handler) adminUpdateService(ctx context.Context, in *AdminUpdateServiceInput) (*AdminServiceOutput, error) {
	service, err := h.catalog.UpdateService(ctx, in.ID, in.Body.toInput())
	if err != nil {
		return nil, h.catalogError(ctx, "admin update service", err)
	}
	h.revalidate(ctx, "services")
	return &AdminServiceOutput{Body: AdminServiceBody{Service: toServiceDTO(service)}}, nil
}

func (h *Handler) adminDeleteService(ctx context.Context, in *AdminServiceIDInput) (*NoContentOutput, error) {
	if err := h.catalog.DeleteService(ctx, in.ID); err != nil {
		return nil, h.catalogError(ctx, "admin delete service", err)
	}
	h.revalidate(ctx, "services")
	return &NoContentOutput{Status: http.StatusNoContent}, nil
}

// catalogError maps domain errors onto HTTP status codes, falling back to a
// logged 500 for anything unrecognised.
func (h *Handler) catalogError(ctx context.Context, op string, err error) error {
	switch {
	case errors.Is(err, catalog.ErrNotFound):
		return huma.Error404NotFound("data tidak ditemukan")
	case errors.Is(err, catalog.ErrSlugTaken):
		return huma.Error409Conflict("slug sudah digunakan, gunakan slug lain")
	default:
		return h.internal(ctx, op, err)
	}
}
