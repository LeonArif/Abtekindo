package store_test

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/LeonArif/Abtekindo/backend/internal/store"
)

// testDatabaseURL returns the connection string for the integration database,
// or skips the test when one is not configured. Integration tests must never
// be the reason a contributor without Docker cannot run `go test ./...`.
func testDatabaseURL(t *testing.T) string {
	t.Helper()
	if url := os.Getenv("TEST_DATABASE_URL"); url != "" {
		return url
	}
	if url := os.Getenv("DATABASE_URL"); url != "" {
		return url
	}
	t.Skip("set TEST_DATABASE_URL or DATABASE_URL to run store integration tests")
	return ""
}

// TestCapacityRoundTrip guards the sqlc override that maps Postgres numeric to
// Go float64.
//
// That override compiles regardless of whether pgx can actually encode and
// decode the type, so this test exercises the real driver against a real
// database. Every capacity used in the catalog is a binary-exact fraction, so
// an exact equality assertion is correct here and would catch any silent
// precision loss introduced by changing the column type.
func TestCapacityRoundTrip(t *testing.T) {
	url := testDatabaseURL(t)

	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	pool, err := store.NewPool(ctx, url)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	// Registered with t.Cleanup rather than defer: deferred calls run before
	// any cleanup function, so a deferred Close would shut the pool down while
	// the fixture cleanup below still needs it.
	t.Cleanup(pool.Close)

	q := store.New(pool)

	// Fixtures use a reserved slug prefix and are swept before each run, so a
	// previously crashed run cannot poison this one with a unique violation.
	purgeFixtures(ctx, t, pool)

	capacities := []float64{0.5, 0.75, 1, 1.5, 2, 2.5, 3, 5}

	created := make([]store.Product, 0, len(capacities))
	for i, pk := range capacities {
		p, err := q.CreateProduct(ctx, store.CreateProductParams{
			Slug:          slugForCapacity(i),
			Name:          "Capacity round trip fixture",
			Brand:         store.BrandDaikin,
			Type:          store.ProductTypeSplitWall,
			CapacityPk:    pk,
			Btu:           9000,
			StartingPrice: 1_000_000,
			PowerWatt:     660,
			Features:      []string{},
			Published:     false, // keep fixtures out of the public catalog
		})
		if err != nil {
			t.Fatalf("create product with capacity %v: %v", pk, err)
		}
		created = append(created, p)
	}
	t.Cleanup(func() {
		cleanupCtx, cancelCleanup := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancelCleanup()
		for _, p := range created {
			if _, err := q.DeleteProduct(cleanupCtx, p.ID); err != nil {
				t.Errorf("cleanup product %v: %v", p.ID, err)
			}
		}
	})

	// Decode check: the value read back must equal the value written.
	for i, want := range capacities {
		if got := created[i].CapacityPk; got != want {
			t.Errorf("capacity round trip: wrote %v, read back %v", want, got)
		}
	}

	// Encode check: []float64 must reach Postgres as a numeric[] that the
	// ANY(...) filter matches. This is the half that a compile-time check
	// cannot verify.
	rows, err := q.ListPublishedProducts(ctx, store.ListPublishedProductsParams{
		Brands:      []store.Brand{},
		Types:       []store.ProductType{},
		Capacities:  []float64{0.75, 2.5},
		ResultLimit: 50,
	})
	if err != nil {
		t.Fatalf("filter by capacity array: %v", err)
	}
	// The fixtures are unpublished, so they must not appear. What matters is
	// that Postgres accepted the numeric[] parameter without a type error.
	for _, r := range rows {
		if r.Product.Name == "Capacity round trip fixture" {
			t.Error("unpublished fixture leaked into the published catalog listing")
		}
	}
}

func slugForCapacity(i int) string {
	return fixtureSlugPrefix + "capacity-" + string(rune('a'+i))
}

const fixtureSlugPrefix = "zz-test-"

func purgeFixtures(ctx context.Context, t *testing.T, pool *pgxpool.Pool) {
	t.Helper()
	if _, err := pool.Exec(ctx, "DELETE FROM products WHERE slug LIKE $1", fixtureSlugPrefix+"%"); err != nil {
		t.Fatalf("purge leftover fixtures: %v", err)
	}
}
