package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"haunter/types"
)

// SSEHub manages active client connections and broadcasts events
type SSEHub struct {
	clients   map[chan types.SSEEvent]bool
	broadcast chan types.SSEEvent
	register  chan chan types.SSEEvent
	unregister chan chan types.SSEEvent
	mu        sync.RWMutex
}

// NewSSEHub creates a new SSEHub instance
func NewSSEHub() *SSEHub {
	return &SSEHub{
		clients:    make(map[chan types.SSEEvent]bool),
		broadcast:  make(chan types.SSEEvent, 256),
		register:   make(chan chan types.SSEEvent),
		unregister: make(chan chan types.SSEEvent),
	}
}

// Run starts the event loop for client registration and broadcasting
func (h *SSEHub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client)
			}
			h.mu.Unlock()
		case event := <-h.broadcast:
			h.mu.RLock()
			for client := range h.clients {
				select {
				case client <- event:
				default:
					close(client)
					delete(h.clients, client)
				}
			}
			h.mu.RUnlock()
		}
	}
}

// Broadcast sends an event to all connected SSE clients
func (h *SSEHub) Broadcast(event types.SSEEvent) {
	h.broadcast <- event
}

// ServeHTTP handles incoming SSE HTTP requests (/api/stream)
func (h *SSEHub) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// Enable CORS & SSE headers
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported!", http.StatusInternalServerError)
		return
	}

	clientChan := make(chan types.SSEEvent, 64)
	h.register <- clientChan

	defer func() {
		h.unregister <- clientChan
	}()

	// Send initial connection ACK
	initAck := types.SSEEvent{
		Event: types.EventExecutionLog,
		Data: types.ExecutionLogPayload{
			ID:        "ACK-INIT",
			Timestamp: time.Now(),
			Level:     types.LogLevelSuccess,
			Message:   "Connected to Haunter SSE Stream Hub",
		},
	}
	sendSSEMessage(w, flusher, initAck)

	ctx := r.Context()
	for {
		select {
		case <-ctx.Done():
			return
		case event, ok := <-clientChan:
			if !ok {
				return
			}
			sendSSEMessage(w, flusher, event)
		}
	}
}

func sendSSEMessage(w http.ResponseWriter, flusher http.Flusher, event types.SSEEvent) {
	jsonData, err := json.Marshal(event.Data)
	if err != nil {
		return
	}
	fmt.Fprintf(w, "event: %s\ndata: %s\n\n", event.Event, jsonData)
	flusher.Flush()
}
