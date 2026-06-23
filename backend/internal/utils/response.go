package utils

import "github.com/gin-gonic/gin"

func JSONError(c *gin.Context, statusCode int, message string) {
	c.JSON(statusCode, gin.H{
		"success": false,
		"error":   message,
	})
}
