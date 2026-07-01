package models

type PaginationMeta struct {
	Page       int `json:"page"`
	PageSize   int `json:"pageSize"`
	TotalItems int `json:"totalItems"`
	TotalPages int `json:"totalPages"`
}

type PaginatedResponse[T any] struct {
	Items []T           `json:"items"`
	Meta  PaginationMeta `json:"meta"`
}
