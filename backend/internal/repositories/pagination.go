package repositories

func paginateSlice[T any](items []T, page, pageSize int) ([]T, int) {
	if pageSize <= 0 {
		pageSize = 10
	}
	totalItems := len(items)
	if totalItems == 0 {
		return []T{}, 1
	}
	totalPages := (totalItems + pageSize - 1) / pageSize
	if page < 1 {
		page = 1
	}
	if page > totalPages {
		page = totalPages
	}
	start := (page - 1) * pageSize
	if start >= totalItems {
		return []T{}, totalPages
	}
	end := start + pageSize
	if end > totalItems {
		end = totalItems
	}
	return append([]T(nil), items[start:end]...), totalPages
}
