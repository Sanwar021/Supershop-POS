package platform_admin

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"restoflow/internal/audit"
	"restoflow/internal/config"
	"restoflow/internal/middleware"
	"restoflow/internal/models"
)

type PlatformAdminService struct {
	pool  *pgxpool.Pool
	cfg   *config.Config
	audit *audit.AuditService
}

func NewPlatformAdminService(pool *pgxpool.Pool, cfg *config.Config, audit *audit.AuditService) *PlatformAdminService {
	return &PlatformAdminService{pool: pool, cfg: cfg, audit: audit}
}

func (s *PlatformAdminService) MountRoutes(r chi.Router) {
	// Tenant View: Subscription details
	r.Get("/subscription", func(w http.ResponseWriter, req *http.Request) {
		restID := middleware.GetRestaurantID(req.Context())
		var sub models.Subscription
		var p models.Plan
		var fJSON []byte

		query := `
			SELECT s.id, s.restaurant_id, s.plan_id, p.name, p.code, s.status, s.trial_ends_at, s.current_period_end, s.grace_until,
			       p.price_minor, p.interval, p.max_branches, p.max_users, p.features
			FROM subscriptions s
			JOIN plans p ON s.plan_id = p.id
			WHERE s.restaurant_id = $1
			ORDER BY s.created_at DESC
			LIMIT 1
		`
		err := s.pool.QueryRow(req.Context(), query, restID).Scan(
			&sub.ID, &sub.RestaurantID, &sub.PlanID, &sub.PlanName, &sub.PlanCode, &sub.Status, &sub.TrialEndsAt, &sub.CurrentPeriodEnd, &sub.GraceUntil,
			&p.PriceMinor, &p.Interval, &p.MaxBranches, &p.MaxUsers, &fJSON,
		)
		if err != nil {
			middleware.JSONError(w, http.StatusNotFound, "NO_SUBSCRIPTION", "No active subscription found", nil)
			return
		}

		if len(fJSON) > 0 {
			_ = json.Unmarshal(fJSON, &p.Features)
		}

		// Calculate trial days left
		daysLeft := 0
		if sub.TrialEndsAt != nil {
			dur := time.Until(*sub.TrialEndsAt)
			if dur > 0 {
				daysLeft = int(dur.Hours() / 24)
			}
		}

		middleware.JSONSuccess(w, http.StatusOK, map[string]interface{}{
			"subscription": sub,
			"plan":         p,
			"trial_days":   daysLeft,
		}, nil)
	})

	// Platform Super Admin Routes
	r.Group(func(pr chi.Router) {
		pr.Use(middleware.RequireRole("super_admin"))

		pr.Get("/admin/restaurants", func(w http.ResponseWriter, req *http.Request) {
			rows, err := s.pool.Query(req.Context(), `
				SELECT r.id, r.name, r.slug, r.email, r.phone, r.status, r.currency, r.created_at,
				       COALESCE(p.name, 'No Plan'), COALESCE(s.status, 'none'), s.trial_ends_at
				FROM restaurants r
				LEFT JOIN subscriptions s ON r.id = s.restaurant_id
				LEFT JOIN plans p ON s.plan_id = p.id
				ORDER BY r.created_at DESC
			`)
			if err != nil {
				middleware.JSONError(w, http.StatusInternalServerError, "FETCH_FAILED", err.Error(), nil)
				return
			}
			defer rows.Close()

			type tenantItem struct {
				ID          string     `json:"id"`
				Name        string     `json:"name"`
				Slug        string     `json:"slug"`
				Email       string     `json:"email"`
				Phone       string     `json:"phone"`
				Status      string     `json:"status"`
				Currency    string     `json:"currency"`
				PlanName    string     `json:"plan_name"`
				SubStatus   string     `json:"sub_status"`
				TrialEndsAt *time.Time `json:"trial_ends_at"`
				CreatedAt   time.Time  `json:"created_at"`
			}
			var list []tenantItem
			for rows.Next() {
				var it tenantItem
				if err := rows.Scan(&it.ID, &it.Name, &it.Slug, &it.Email, &it.Phone, &it.Status, &it.Currency, &it.CreatedAt, &it.PlanName, &it.SubStatus, &it.TrialEndsAt); err == nil {
					list = append(list, it)
				}
			}
			middleware.JSONSuccess(w, http.StatusOK, list, nil)
		})

		pr.Patch("/admin/restaurants/{id}/status", func(w http.ResponseWriter, req *http.Request) {
			targetID := chi.URLParam(req, "id")
			var body struct {
				Status        string `json:"status"` // active, past_due, suspended
				ExtendDays    int    `json:"extend_days,omitempty"`
			}
			if err := json.NewDecoder(req.Body).Decode(&body); err != nil {
				middleware.JSONError(w, http.StatusBadRequest, "INVALID_BODY", err.Error(), nil)
				return
			}

			_, err := s.pool.Exec(req.Context(), "UPDATE restaurants SET status = $1, updated_at = NOW() WHERE id = $2", body.Status, targetID)
			if err != nil {
				middleware.JSONError(w, http.StatusInternalServerError, "UPDATE_FAILED", err.Error(), nil)
				return
			}

			if body.ExtendDays > 0 {
				newTrial := time.Now().Add(time.Duration(body.ExtendDays) * 24 * time.Hour)
				_, _ = s.pool.Exec(req.Context(), "UPDATE subscriptions SET trial_ends_at = $1, status = 'active' WHERE restaurant_id = $2", newTrial, targetID)
			}

			s.audit.Log(req.Context(), "SUPERADMIN_STATUS_CHANGE", "restaurant", &targetID, nil, body, "", "")
			middleware.JSONSuccess(w, http.StatusOK, map[string]string{"message": "restaurant status updated"}, nil)
		})

		pr.Get("/admin/plans", func(w http.ResponseWriter, req *http.Request) {
			rows, err := s.pool.Query(req.Context(), "SELECT id, code, name, price_minor, interval, max_branches, max_users, features, created_at FROM plans ORDER BY price_minor ASC")
			if err != nil {
				middleware.JSONError(w, http.StatusInternalServerError, "FETCH_FAILED", err.Error(), nil)
				return
			}
			defer rows.Close()

			var plans []models.Plan
			for rows.Next() {
				var p models.Plan
				var fJSON []byte
				if err := rows.Scan(&p.ID, &p.Code, &p.Name, &p.PriceMinor, &p.Interval, &p.MaxBranches, &p.MaxUsers, &fJSON, &p.CreatedAt); err == nil {
					if len(fJSON) > 0 {
						_ = json.Unmarshal(fJSON, &p.Features)
					}
					plans = append(plans, p)
				}
			}
			middleware.JSONSuccess(w, http.StatusOK, plans, nil)
		})

		pr.Post("/admin/restaurants/{id}/impersonate", func(w http.ResponseWriter, req *http.Request) {
			targetID := chi.URLParam(req, "id")
			var owner models.User
			err := s.pool.QueryRow(req.Context(), `
				SELECT id, restaurant_id, name, email, role, discount_limit_pct
				FROM users
				WHERE restaurant_id = $1 AND role = 'owner'
				LIMIT 1
			`, targetID).Scan(&owner.ID, &owner.RestaurantID, &owner.Name, &owner.Email, &owner.Role, &owner.DiscountLimitPct)
			if err != nil {
				middleware.JSONError(w, http.StatusNotFound, "OWNER_NOT_FOUND", "Owner not found for this restaurant", nil)
				return
			}

			access, refresh, err := middleware.GenerateTokens(owner.ID, targetID, owner.Email, "owner", 100.0, s.cfg.JWTAccessSecret, s.cfg.JWTRefreshSecret)
			if err != nil {
				middleware.JSONError(w, http.StatusInternalServerError, "TOKEN_ERROR", err.Error(), nil)
				return
			}

			s.audit.Log(req.Context(), "SUPERADMIN_IMPERSONATE", "restaurant", &targetID, nil, map[string]string{"target_owner": owner.Email}, "", "")
			middleware.JSONSuccess(w, http.StatusOK, map[string]interface{}{
				"access_token":  access,
				"refresh_token": refresh,
				"user":          owner,
			}, nil)
		})
	})
}
