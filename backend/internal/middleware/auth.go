package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
)

func JWTReady() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		token, ok := strings.CutPrefix(authHeader, "Bearer ")
		if ok && token != "" {
			c.Set("authToken", token)
		}
		c.Next()
	}
}
