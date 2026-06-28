FROM golang:1.23-alpine AS build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go test ./...
RUN go build -o /server ./cmd/server

FROM alpine:3.20
WORKDIR /app
COPY --from=build /server /app/server
COPY --from=build /app/migrations /app/migrations
EXPOSE 8080
CMD ["/app/server"]
