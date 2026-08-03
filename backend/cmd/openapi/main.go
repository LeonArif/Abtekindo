// Command openapi writes the OpenAPI document to stdout.
//
// The frontend generates its TypeScript types from this output, so it must not
// need a database or a running server: `make openapi` has to work in CI and on
// a clean checkout.
package main

import (
	"fmt"
	"log/slog"
	"os"

	"github.com/danielgtaylor/huma/v2/adapters/humachi"
	"github.com/go-chi/chi/v5"

	"github.com/LeonArif/Abtekindo/backend/internal/api"
	"github.com/LeonArif/Abtekindo/backend/internal/server"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, "error:", err)
		os.Exit(1)
	}
}

func run() error {
	humaAPI := humachi.New(chi.NewRouter(), server.HumaConfig())

	// Registration only reflects over the request and response types to build
	// schemas; no handler runs, so the nil dependencies are never dereferenced.
	api.NewHandler(api.Deps{
		Logger: slog.New(slog.NewTextHandler(os.Stderr, nil)),
	}).Register(humaAPI)

	doc, err := humaAPI.OpenAPI().MarshalJSON()
	if err != nil {
		return fmt.Errorf("marshal OpenAPI document: %w", err)
	}

	if _, err := os.Stdout.Write(doc); err != nil {
		return err
	}
	_, err = fmt.Fprintln(os.Stdout)
	return err
}
