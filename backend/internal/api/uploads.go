package api

import (
	"context"
	"errors"
	"net/http"

	"github.com/danielgtaylor/huma/v2"

	"github.com/LeonArif/Abtekindo/backend/internal/storage"
)

// UploadRequest asks for permission to upload one image.
type UploadRequest struct {
	ContentType ImageContentType `json:"contentType" doc:"MIME type of the image to upload"`
}

// UploadInput is the presign request body.
type UploadInput struct {
	Body UploadRequest
}

// UploadTargetBody tells the browser where and how to upload.
type UploadTargetBody struct {
	UploadURL        string `json:"uploadUrl" doc:"PUT the file here with the same Content-Type"`
	ObjectKey        string `json:"objectKey" doc:"Store this on the product record"`
	PublicURL        string `json:"publicUrl" doc:"Where the image will be readable once uploaded"`
	ExpiresInSeconds int    `json:"expiresInSeconds"`
}

// UploadOutput wraps the upload target.
type UploadOutput struct {
	Body UploadTargetBody
}

func (h *Handler) registerUploads(api huma.API) {
	huma.Register(api, huma.Operation{
		OperationID: "adminCreateUpload",
		Method:      http.MethodPost,
		Path:        "/v1/admin/uploads",
		Summary:     "Get a presigned image upload URL",
		Description: "Returns a short-lived URL the browser PUTs the image to directly. " +
			"The file never passes through this API.",
		Tags:        []string{"Admin"},
		Security:    adminSecurity,
		Middlewares: huma.Middlewares{h.requireAdmin},
		Errors: []int{
			http.StatusUnauthorized,
			http.StatusUnprocessableEntity,
			http.StatusServiceUnavailable,
		},
	}, h.adminCreateUpload)
}

func (h *Handler) adminCreateUpload(ctx context.Context, in *UploadInput) (*UploadOutput, error) {
	target, err := h.uploads.PresignUpload(ctx, string(in.Body.ContentType))
	switch {
	case errors.Is(err, storage.ErrNotConfigured):
		// 503 rather than 500: the deployment is missing credentials, which is
		// an operator problem the admin UI should surface as "uploads are off"
		// rather than as a crash.
		return nil, huma.Error503ServiceUnavailable("penyimpanan gambar belum dikonfigurasi")
	case errors.Is(err, storage.ErrUnsupportedType):
		return nil, huma.Error422UnprocessableEntity("tipe gambar tidak didukung")
	case err != nil:
		return nil, h.internal(ctx, "presign upload", err)
	}

	return &UploadOutput{Body: UploadTargetBody{
		UploadURL:        target.UploadURL,
		ObjectKey:        target.ObjectKey,
		PublicURL:        target.PublicURL,
		ExpiresInSeconds: target.ExpiresInSeconds,
	}}, nil
}
