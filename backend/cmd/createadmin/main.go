// Command createadmin registers an administrator.
//
// Admin accounts are created here rather than through an HTTP endpoint. A
// public registration route on a single-tenant CMS is pure attack surface with
// no upside, so the only way to create an operator is shell access to the
// deployment.
package main

import (
	"bufio"
	"context"
	"errors"
	"flag"
	"fmt"
	"log/slog"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
	"golang.org/x/term"

	"github.com/LeonArif/Abtekindo/backend/internal/auth"
	"github.com/LeonArif/Abtekindo/backend/internal/config"
	"github.com/LeonArif/Abtekindo/backend/internal/store"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, "error:", err)
		os.Exit(1)
	}
}

func run() error {
	email := flag.String("email", "", "admin email address (required)")
	name := flag.String("name", "", "display name (required)")
	flag.Parse()

	if strings.TrimSpace(*email) == "" || strings.TrimSpace(*name) == "" {
		flag.Usage()
		return errors.New("both -email and -name are required")
	}

	_ = godotenv.Load()

	cfg, err := config.Load()
	if err != nil {
		return err
	}

	password, err := readPassword()
	if err != nil {
		return err
	}
	if err := auth.ValidatePassword(password); err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
	defer cancel()

	pool, err := store.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		return err
	}
	defer pool.Close()

	logger := slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelWarn}))
	svc := auth.NewService(
		store.New(pool),
		auth.NewTokenIssuer(cfg.JWT.Secret, cfg.JWT.AccessTTL),
		cfg.JWT.RefreshTTL,
		logger,
	)

	user, err := svc.CreateAdmin(ctx, *email, password, *name)
	if err != nil {
		return err
	}

	fmt.Printf("created admin %s <%s>\n", user.Name, user.Email)
	return nil
}

// readPassword prompts twice without echoing, so the password never lands in
// shell history or a process listing the way a -password flag would.
func readPassword() (string, error) {
	fd := int(os.Stdin.Fd())
	if !term.IsTerminal(fd) {
		// Non-interactive use, such as a provisioning script piping the value.
		scanner := bufio.NewScanner(os.Stdin)
		if !scanner.Scan() {
			return "", errors.New("no password supplied on stdin")
		}
		return strings.TrimRight(scanner.Text(), "\r\n"), scanner.Err()
	}

	fmt.Fprint(os.Stderr, "Password: ")
	first, err := term.ReadPassword(fd)
	fmt.Fprintln(os.Stderr)
	if err != nil {
		return "", fmt.Errorf("read password: %w", err)
	}

	fmt.Fprint(os.Stderr, "Confirm password: ")
	second, err := term.ReadPassword(fd)
	fmt.Fprintln(os.Stderr)
	if err != nil {
		return "", fmt.Errorf("read password confirmation: %w", err)
	}

	if string(first) != string(second) {
		return "", errors.New("passwords do not match")
	}
	return string(first), nil
}
