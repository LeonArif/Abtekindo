// Package storage issues presigned upload URLs for product images.
//
// Images are uploaded by the browser straight to Cloudflare R2 using a
// short-lived presigned URL. The API only signs the request and never sees the
// bytes, which keeps large uploads off the API's memory and request timeouts,
// and means image traffic never counts against its bandwidth.
package storage

import (
	"context"
	"errors"
	"fmt"
	"path"
	"slices"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awscfg "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"

	"github.com/LeonArif/Abtekindo/backend/internal/config"
)

// ErrNotConfigured is returned when object storage is unavailable, which is
// normal in development.
var ErrNotConfigured = errors.New("object storage is not configured")

// ErrUnsupportedType is returned for a content type outside the allowlist.
var ErrUnsupportedType = errors.New("unsupported image type")

// presignTTL is how long an upload URL stays valid. Long enough for a slow
// mobile connection to finish, short enough that a leaked URL is near useless.
const presignTTL = 10 * time.Minute

// allowedContentTypes maps accepted MIME types to their file extension.
//
// This is an allowlist rather than a blocklist, and the extension comes from
// the map rather than from the uploaded filename, so a caller cannot smuggle a
// ".html" or ".svg" into the bucket and have it served from the image origin.
var allowedContentTypes = map[string]string{
	"image/jpeg": ".jpg",
	"image/png":  ".png",
	"image/webp": ".webp",
	"image/avif": ".avif",
}

// AllowedContentTypes returns the accepted MIME types, for schema generation.
func AllowedContentTypes() []string {
	out := make([]string, 0, len(allowedContentTypes))
	for ct := range allowedContentTypes {
		out = append(out, ct)
	}
	// Sorted so the OpenAPI document is byte-stable across restarts; Go map
	// iteration order is deliberately randomised.
	slices.Sort(out)
	return out
}

// Target is everything the browser needs to perform an upload.
type Target struct {
	// UploadURL is the presigned PUT destination.
	UploadURL string
	// ObjectKey is what gets stored on the product record.
	ObjectKey string
	// PublicURL is where the object will be readable once uploaded.
	PublicURL string
	// ExpiresInSeconds tells the client how long it has.
	ExpiresInSeconds int
}

// Uploader signs upload requests for the configured bucket.
type Uploader struct {
	presign       *s3.PresignClient
	bucket        string
	publicBaseURL string
}

// New builds an uploader, or returns nil when storage is not configured.
//
// A nil uploader is a valid state: the admin UI hides the upload control and
// every other feature keeps working, which is what allows local development
// without Cloudflare credentials.
func New(ctx context.Context, cfg config.StorageConfig) (*Uploader, error) {
	if !cfg.Configured() {
		return nil, nil
	}

	awsCfg, err := awscfg.LoadDefaultConfig(ctx,
		// R2 is S3-compatible but has no regions. "auto" is what Cloudflare
		// documents for its S3 API.
		awscfg.WithRegion("auto"),
		awscfg.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
			cfg.AccessKeyID, cfg.SecretAccessKey, "",
		)),
	)
	if err != nil {
		return nil, fmt.Errorf("load aws config: %w", err)
	}

	endpoint := fmt.Sprintf("https://%s.r2.cloudflarestorage.com", cfg.AccountID)
	client := s3.NewFromConfig(awsCfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(endpoint)
		// R2 does not support virtual-host style addressing for custom domains.
		o.UsePathStyle = true
	})

	return &Uploader{
		presign:       s3.NewPresignClient(client),
		bucket:        cfg.Bucket,
		publicBaseURL: strings.TrimRight(cfg.PublicBaseURL, "/"),
	}, nil
}

// PresignUpload returns a short-lived URL the browser can PUT an image to.
func (u *Uploader) PresignUpload(ctx context.Context, contentType string) (Target, error) {
	if u == nil {
		return Target{}, ErrNotConfigured
	}

	ext, ok := allowedContentTypes[strings.ToLower(strings.TrimSpace(contentType))]
	if !ok {
		return Target{}, fmt.Errorf("%w: %s", ErrUnsupportedType, contentType)
	}

	// The key is generated, never taken from the client. A caller-supplied
	// filename could otherwise traverse paths or overwrite an existing image.
	key := path.Join("products", uuid.NewString()+ext)

	req, err := u.presign.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket: aws.String(u.bucket),
		Key:    aws.String(key),
		// Binding the content type into the signature means the presigned URL
		// can only be used to upload the type that was approved.
		ContentType: aws.String(contentType),
	}, s3.WithPresignExpires(presignTTL))
	if err != nil {
		return Target{}, fmt.Errorf("presign upload: %w", err)
	}

	return Target{
		UploadURL:        req.URL,
		ObjectKey:        key,
		PublicURL:        u.publicURL(key),
		ExpiresInSeconds: int(presignTTL.Seconds()),
	}, nil
}

func (u *Uploader) publicURL(key string) string {
	if u.publicBaseURL == "" {
		return "/" + key
	}
	return u.publicBaseURL + "/" + key
}
