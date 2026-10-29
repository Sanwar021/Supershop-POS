package tables

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"restoflow/internal/audit"
	"restoflow/internal/middleware"
	"restoflow/internal/models"
	"restoflow/internal/platform"
)

type TableService struct {
	pool  *pgxpool.Pool
	hub   *platform.WSHub
	audit *audit.AuditService
}

func NewTableService(pool *pgxpool.Pool, hub *platform.WSHub, audit *audit.AuditService) *TableService {
	return &TableService{pool: pool, hub: hub, audit: audit}
}

func (s *TableService) MountRoutes(r chi.Router) {
	// Table Sections
	r.Get("/table-sections", func(w http.ResponseWriter, req *http.Request) {
		restID := middleware.GetRestaurantID(req.Context())
		branchID := req.URL.Query().Get("branch_id")
		rows, err := s.pool.Query(req.Context(), `
			SELECT id, restaurant_id, branch_id, name, sort
			FROM table_sections
			WHERE restaurant_id = $1 AND ($2 = '' OR branch_id = $2::uuid)
			ORDER BY sort ASC, name ASC
		`, restID, branchID)
		if err != nil {
			middleware.JSONError(w, http.StatusInternalServerError, "FETCH_FAILED", err.Error(), nil)
			return
		}
		defer rows.Close()

		var list []models.TableSection
		for rows.Next() {
			var sec models.TableSection
			if err := rows.Scan(&sec.ID, &sec.RestaurantID, &sec.BranchID, &sec.Name, &sec.Sort); err == nil {
				list = append(list, sec)
			}
		}
		middleware.JSONSuccess(w, http.StatusOK, list, nil)
	})

	r.Post("/table-sections", func(w http.ResponseWriter, req *http.Request) {
		restID := middleware.GetRestaurantID(req.Context())
		var body models.TableSection
		if err := json.NewDecoder(req.Body).Decode(&body); err != nil {
			middleware.JSONError(w, http.StatusBadRequest, "INVALID_BODY", err.Error(), nil)
			return
		}
		var sec models.TableSection
		err := s.pool.QueryRow(req.Context(), `
			INSERT INTO table_sections (restaurant_id, branch_id, name, sort)
			VALUES ($1, $2, $3, $4)
			RETURNING id, restaurant_id, branch_id, name, sort
		`, restID, body.BranchID, body.Name, body.Sort).Scan(&sec.ID, &sec.RestaurantID, &sec.BranchID, &sec.Name, &sec.Sort)
		if err != nil {
			middleware.JSONError(w, http.StatusBadRequest, "CREATE_FAILED", err.Error(), nil)
			return
		}
		middleware.JSONSuccess(w, http.StatusCreated, sec, nil)
	})

	// Tables
	r.Get("/tables", func(w http.ResponseWriter, req *http.Request) {
		restID := middleware.GetRestaurantID(req.Context())
		branchID := req.URL.Query().Get("branch_id")
		rows, err := s.pool.Query(req.Context(), `
			SELECT t.id, t.restaurant_id, t.branch_id, t.section_id, COALESCE(s.name, ''), t.name, t.seats, t.pos_x, t.pos_y, t.status, t.current_order_id, t.created_at, t.updated_at
			FROM tables t
			LEFT JOIN table_sections s ON t.section_id = s.id
			WHERE t.restaurant_id = $1 AND ($2 = '' OR t.branch_id = $2::uuid)
			ORDER BY t.name ASC
		`, restID, branchID)
		if err != nil {
			middleware.JSONError(w, http.StatusInternalServerError, "FETCH_FAILED", err.Error(), nil)
			return
		}
		defer rows.Close()

		var list []models.Table
		for rows.Next() {
			var tb models.Table
			if err := rows.Scan(&tb.ID, &tb.RestaurantID, &tb.BranchID, &tb.SectionID, &tb.SectionName, &tb.Name, &tb.Seats, &tb.PosX, &tb.PosY, &tb.Status, &tb.CurrentOrderID, &tb.CreatedAt, &tb.UpdatedAt); err == nil {
				list = append(list, tb)
			}
		}
		middleware.JSONSuccess(w, http.StatusOK, list, nil)
	})

	r.Post("/tables", func(w http.ResponseWriter, req *http.Request) {
		restID := middleware.GetRestaurantID(req.Context())
		var body models.Table
		if err := json.NewDecoder(req.Body).Decode(&body); err != nil {
			middleware.JSONError(w, http.StatusBadRequest, "INVALID_BODY", err.Error(), nil)
			return
		}
		var tb models.Table
		err := s.pool.QueryRow(req.Context(), `
			INSERT INTO tables (restaurant_id, branch_id, section_id, name, seats, pos_x, pos_y, status)
			VALUES ($1, $2, $3, $4, $5, $6, $7, 'free')
			RETURNING id, restaurant_id, branch_id, section_id, name, seats, pos_x, pos_y, status, created_at, updated_at
		`, restID, body.BranchID, body.SectionID, body.Name, body.Seats, body.PosX, body.PosY).Scan(
			&tb.ID, &tb.RestaurantID, &tb.BranchID, &tb.SectionID, &tb.Name, &tb.Seats, &tb.PosX, &tb.PosY, &tb.Status, &tb.CreatedAt, &tb.UpdatedAt,
		)
		if err != nil {
			middleware.JSONError(w, http.StatusBadRequest, "CREATE_FAILED", err.Error(), nil)
			return
		}
		middleware.JSONSuccess(w, http.StatusCreated, tb, nil)
	})

	r.Patch("/tables/{id}/status", func(w http.ResponseWriter, req *http.Request) {
		restID := middleware.GetRestaurantID(req.Context())
		tblID := chi.URLParam(req, "id")
		var body struct {
			Status string `json:"status"` // free, occupied, bill_requested, cleaning, reserved
		}
		if err := json.NewDecoder(req.Body).Decode(&body); err != nil {
			middleware.JSONError(w, http.StatusBadRequest, "INVALID_BODY", err.Error(), nil)
			return
		}

		var branchID string
		err := s.pool.QueryRow(req.Context(), `
			UPDATE tables
			SET status = $1, updated_at = NOW()
			WHERE id = $2 AND restaurant_id = $3
			RETURNING branch_id
		`, body.Status, tblID, restID).Scan(&branchID)
		if err != nil {
			middleware.JSONError(w, http.StatusInternalServerError, "UPDATE_FAILED", err.Error(), nil)
			return
		}

		// Broadcast live table status update
		s.hub.BroadcastBranch(branchID, "table.updated", map[string]interface{}{
			"table_id": tblID,
			"status":   body.Status,
		})

		middleware.JSONSuccess(w, http.StatusOK, map[string]interface{}{"id": tblID, "status": body.Status}, nil)
	})

	r.Post("/tables/transfer", func(w http.ResponseWriter, req *http.Request) {
		restID := middleware.GetRestaurantID(req.Context())
		var body struct {
			FromTableID string `json:"from_table_id"`
			ToTableID   string `json:"to_table_id"`
			OrderID     string `json:"order_id"`
		}
		if err := json.NewDecoder(req.Body).Decode(&body); err != nil {
			middleware.JSONError(w, http.StatusBadRequest, "INVALID_BODY", err.Error(), nil)
			return
		}

		tx, err := s.pool.Begin(req.Context())
		if err != nil {
			middleware.JSONError(w, http.StatusInternalServerError, "TX_ERROR", err.Error(), nil)
			return
		}
		defer tx.Rollback(req.Context())

		// Update order
		var branchID string
		err = tx.QueryRow(req.Context(), `
			UPDATE orders
			SET table_id = $1
			WHERE id = $2 AND restaurant_id = $3
			RETURNING branch_id
		`, body.ToTableID, body.OrderID, restID).Scan(&branchID)
		if err != nil {
			middleware.JSONError(w, http.StatusBadRequest, "ORDER_UPDATE_FAILED", err.Error(), nil)
			return
		}

		// Free old table
		_, _ = tx.Exec(req.Context(), "UPDATE tables SET status = 'free', current_order_id = NULL WHERE id = $1", body.FromTableID)
		// Occupy new table
		_, _ = tx.Exec(req.Context(), "UPDATE tables SET status = 'occupied', current_order_id = $1 WHERE id = $2", body.OrderID, body.ToTableID)

		if err := tx.Commit(req.Context()); err != nil {
			middleware.JSONError(w, http.StatusInternalServerError, "COMMIT_ERROR", err.Error(), nil)
			return
		}

		s.hub.BroadcastBranch(branchID, "table.updated", map[string]interface{}{
			"transferred": true,
			"from_table":  body.FromTableID,
			"to_table":    body.ToTableID,
			"order_id":    body.OrderID,
		})

		s.audit.Log(req.Context(), "TABLE_TRANSFER", "order", &body.OrderID, nil, body, "", "")
		middleware.JSONSuccess(w, http.StatusOK, map[string]string{"message": "table transferred successfully"}, nil)
	})
}
