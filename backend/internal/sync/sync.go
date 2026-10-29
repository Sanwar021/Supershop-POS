package sync

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"restoflow/internal/middleware"
	"restoflow/internal/orders"
)

type SyncService struct {
	pool         *pgxpool.Pool
	orderService *orders.OrderService
}

func NewSyncService(pool *pgxpool.Pool, orderService *orders.OrderService) *SyncService {
	return &SyncService{pool: pool, orderService: orderService}
}

type SyncOperation struct {
	ID             string          `json:"id"`
	Type           string          `json:"type"` // create_order, pay_order, send_kot
	Payload        json.RawMessage `json:"payload"`
	IdempotencyKey string          `json:"idempotency_key"`
}

type SyncResponse struct {
	OperationID    string      `json:"operation_id"`
	IdempotencyKey string      `json:"idempotency_key"`
	Status         string      `json:"status"` // success, error, cached
	Response       interface{} `json:"response"`
	Error          string      `json:"error,omitempty"`
}

func (s *SyncService) MountRoutes(r chi.Router) {
	r.Post("/sync/batch", func(w http.ResponseWriter, req *http.Request) {
		restID := middleware.GetRestaurantID(req.Context())
		claims := middleware.GetUserClaims(req.Context())

		var operations []SyncOperation
		var raw json.RawMessage
		if err := json.NewDecoder(req.Body).Decode(&raw); err != nil {
			middleware.JSONError(w, http.StatusBadRequest, "INVALID_BODY", err.Error(), nil)
			return
		}

		if len(raw) > 0 && raw[0] == '{' {
			var wrapper struct {
				Operations []SyncOperation `json:"operations"`
			}
			if err := json.Unmarshal(raw, &wrapper); err != nil {
				middleware.JSONError(w, http.StatusBadRequest, "INVALID_BODY", err.Error(), nil)
				return
			}
			operations = wrapper.Operations
		} else {
			if err := json.Unmarshal(raw, &operations); err != nil {
				middleware.JSONError(w, http.StatusBadRequest, "INVALID_BODY", err.Error(), nil)
				return
			}
		}

		var results []SyncResponse

		for _, op := range operations {
			if op.IdempotencyKey == "" {
				op.IdempotencyKey = op.ID
			}

			// Check if already processed in outbox_sync_log
			var prevStatus string
			var prevRespJSON []byte
			err := s.pool.QueryRow(req.Context(), `
				SELECT status, response FROM outbox_sync_log
				WHERE restaurant_id = $1 AND idempotency_key = $2
			`, restID, op.IdempotencyKey).Scan(&prevStatus, &prevRespJSON)

			if err == nil {
				// Cached response
				var parsedResp interface{}
				_ = json.Unmarshal(prevRespJSON, &parsedResp)
				results = append(results, SyncResponse{
					OperationID:    op.ID,
					IdempotencyKey: op.IdempotencyKey,
					Status:         "cached",
					Response:       parsedResp,
				})
				continue
			}

			// Execute operation
			var opResult interface{}
			var opErr error

			switch op.Type {
			case "create_order":
				var orderReq orders.CreateOrderRequest
				if err := json.Unmarshal(op.Payload, &orderReq); err == nil {
					opResult, opErr = s.orderService.CreateOrder(req.Context(), restID, claims.UserID, orderReq)
				} else {
					opErr = err
				}

			case "pay_order":
				var payReq struct {
					OrderID string            `json:"order_id"`
					Body    orders.PayRequest `json:"body"`
				}
				if err := json.Unmarshal(op.Payload, &payReq); err == nil {
					opResult, opErr = s.orderService.Pay(req.Context(), restID, claims.UserID, payReq.OrderID, payReq.Body)
				} else {
					opErr = err
				}

			case "send_kot":
				var kotReq struct {
					OrderID string `json:"order_id"`
				}
				if err := json.Unmarshal(op.Payload, &kotReq); err == nil {
					opResult, opErr = s.orderService.SendKOT(req.Context(), restID, claims.UserID, kotReq.OrderID)
				} else {
					opErr = err
				}

			default:
				opErr = nil
				opResult = map[string]string{"message": "acknowledged"}
			}

			if opErr != nil {
				results = append(results, SyncResponse{
					OperationID:    op.ID,
					IdempotencyKey: op.IdempotencyKey,
					Status:         "error",
					Error:          opErr.Error(),
				})
			} else {
				resJSON, _ := json.Marshal(opResult)
				_, _ = s.pool.Exec(req.Context(), `
					INSERT INTO outbox_sync_log (restaurant_id, idempotency_key, status, response)
					VALUES ($1, $2, 'success', $3::jsonb)
					ON CONFLICT (restaurant_id, idempotency_key) DO NOTHING
				`, restID, op.IdempotencyKey, resJSON)

				results = append(results, SyncResponse{
					OperationID:    op.ID,
					IdempotencyKey: op.IdempotencyKey,
					Status:         "success",
					Response:       opResult,
				})
			}
		}

		middleware.JSONSuccess(w, http.StatusOK, results, nil)
	})
}
