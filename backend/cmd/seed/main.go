// Command seed loads the starting catalog into the database.
//
// It is additive and idempotent: a slug that already exists is left untouched,
// so re-running the seeder can never overwrite a price or description edited
// through the admin CMS.
package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"os"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"

	"github.com/LeonArif/Abtekindo/backend/internal/config"
	"github.com/LeonArif/Abtekindo/backend/internal/store"
)

func main() {
	if err := run(); err != nil {
		slog.Error("seed failed", slog.Any("error", err))
		os.Exit(1)
	}
}

func run() error {
	_ = godotenv.Load()

	cfg, err := config.Load()
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	pool, err := store.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		return err
	}
	defer pool.Close()

	q := store.New(pool)

	productsAdded, productsSkipped, err := seedProductCatalog(ctx, q)
	if err != nil {
		return err
	}

	servicesAdded, servicesSkipped, err := seedServiceCatalog(ctx, pool, q)
	if err != nil {
		return err
	}

	fmt.Printf("products: %d added, %d already present\n", productsAdded, productsSkipped)
	fmt.Printf("services: %d added, %d already present\n", servicesAdded, servicesSkipped)
	return nil
}

func seedProductCatalog(ctx context.Context, q *store.Queries) (added, skipped int, err error) {
	for _, p := range seedProducts {
		exists, err := productExists(ctx, q, p.Slug)
		if err != nil {
			return added, skipped, err
		}
		if exists {
			skipped++
			continue
		}
		// Set here rather than on each literal. The column defaults to true,
		// but CreateProduct passes published explicitly, so an unset Go field
		// silently inserts false and the product vanishes from the catalog.
		// Doing it once in the loop means a new seed entry cannot forget it.
		p.Published = true
		if _, err := q.CreateProduct(ctx, p); err != nil {
			return added, skipped, fmt.Errorf("create product %q: %w", p.Slug, err)
		}
		added++
	}
	return added, skipped, nil
}

// seedServiceCatalog inserts each service together with its rate table inside a
// transaction, so a failure partway through cannot leave a service published
// with a half-populated price list.
func seedServiceCatalog(ctx context.Context, pool *pgxpool.Pool, q *store.Queries) (added, skipped int, err error) {
	for _, s := range seedServices {
		exists, err := serviceExists(ctx, q, s.Service.Slug)
		if err != nil {
			return added, skipped, err
		}
		if exists {
			skipped++
			continue
		}

		if err := withTx(ctx, pool, func(tx *store.Queries) error {
			// Same reasoning as products: the insert passes published
			// explicitly, so it has to be set rather than left to the column
			// default.
			svc := s.Service
			svc.Published = true

			created, err := tx.CreateService(ctx, svc)
			if err != nil {
				return fmt.Errorf("create service %q: %w", s.Service.Slug, err)
			}
			for _, rate := range s.Rates {
				rate.ServiceID = created.ID
				if _, err := tx.AddServiceRate(ctx, rate); err != nil {
					return fmt.Errorf("add rate %q to %q: %w", rate.Label, s.Service.Slug, err)
				}
			}
			return nil
		}); err != nil {
			return added, skipped, err
		}
		added++
	}
	return added, skipped, nil
}

func productExists(ctx context.Context, q *store.Queries, slug string) (bool, error) {
	_, err := q.FindProductBySlug(ctx, slug)
	if errors.Is(err, pgx.ErrNoRows) {
		return false, nil
	}
	if err != nil {
		return false, fmt.Errorf("look up product %q: %w", slug, err)
	}
	return true, nil
}

func serviceExists(ctx context.Context, q *store.Queries, slug string) (bool, error) {
	_, err := q.FindServiceBySlug(ctx, slug)
	if errors.Is(err, pgx.ErrNoRows) {
		return false, nil
	}
	if err != nil {
		return false, fmt.Errorf("look up service %q: %w", slug, err)
	}
	return true, nil
}

func withTx(ctx context.Context, pool *pgxpool.Pool, fn func(*store.Queries) error) error {
	tx, err := pool.Begin(ctx)
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
