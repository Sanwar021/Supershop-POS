package config

import (
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	AppEnv           string
	Port             string
	DatabaseURL      string
	JWTAccessSecret  string
	JWTRefreshSecret string
	CorsOrigins      []string
	DefaultCurrency  string
	DefaultTimezone  string
}

func Load() *Config {
	_ = godotenv.Load()

	port := os.Getenv("HTTP_PORT")
	if port == "" {
		port = os.Getenv("PORT")
	}
	if port == "" {
		port = "8080"
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://postgres:postgres@localhost:5433/restoflow?sslmode=disable"
	}

	accessSecret := os.Getenv("JWT_ACCESS_SECRET")
	if accessSecret == "" {
		accessSecret = "restoflow-super-secret-jwt-access-key-2026"
	}

	refreshSecret := os.Getenv("JWT_REFRESH_SECRET")
	if refreshSecret == "" {
		refreshSecret = "restoflow-super-secret-jwt-refresh-key-2026"
	}

	corsStr := os.Getenv("CORS_ORIGINS")
	var origins []string
	if corsStr != "" {
		origins = strings.Split(corsStr, ",")
	} else {
		origins = []string{"*"}
	}

	currency := os.Getenv("DEFAULT_CURRENCY")
	if currency == "" {
		currency = "BDT"
	}

	tz := os.Getenv("DEFAULT_TIMEZONE")
	if tz == "" {
		tz = "Asia/Dhaka"
	}

	return &Config{
		AppEnv:           getEnvDefault("APP_ENV", "development"),
		Port:             port,
		DatabaseURL:      dbURL,
		JWTAccessSecret:  accessSecret,
		JWTRefreshSecret: refreshSecret,
		CorsOrigins:      origins,
		DefaultCurrency:  currency,
		DefaultTimezone:  tz,
	}
}

func getEnvDefault(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
