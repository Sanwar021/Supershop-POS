package audit

import (
	"context"
	"encoding/json"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
	"restoflow/internal/middleware"
)

type AuditService struct {
	pool *pgxpool.Pool
}

func NewAuditService(pool *pgxpool.Pool) *AuditService {
	return &AuditService{pool: pool}
}

func (s *AuditService) Log(ctx context.Context, action, entity string, entityID *string, before, after interface{}, ip, device string) {
	claims := middleware.GetUserClaims(ctx)
	var restID *string
	var userID *string

	if claims != nil {
		if claims.RestaurantID != "" {
			restID = &claims.RestaurantID
		}
		if claims.UserID != "" {
			userID = &claims.UserID
		}
	}

	var beforeJSON []byte
	var afterJSON []byte
	var err error

	if before != nil {
		beforeJSON, err = json.Marshal(before)
		if err != nil {
			log.Printf("[Audit] Error marshaling before: %v", err)
		}
	}
	if after != nil {
		afterJSON, err = json.Marshal(after)
		if err != nil {
			log.Printf("[Audit] Error marshaling after: %v", err)
		}
	}

	query := `
		INSERT INTO audit_logs (restaurant_id, user_id, action, entity, entity_id, before, after, ip, device)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`
	_, err = s.pool.Exec(ctx, query, restID, userID, action, entity, entityID, beforeJSON, afterJSON, ip, device)
	if err != nil {
		log.Printf("[Audit] Failed to insert audit log: %v", err)
	}
}
