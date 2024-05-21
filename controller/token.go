package controller

import (
	"net/http"
	"one-api/common"
	"one-api/i18n"
	"one-api/model"
	"strconv"

	"github.com/gin-gonic/gin"
)

func GetAllTokens(c *gin.Context) {
	userId := c.GetInt("id")
	p, _ := strconv.Atoi(c.Query("p"))
	size, _ := strconv.Atoi(c.Query("size"))
	if p < 0 {
		p = 0
	}
	if size <= 0 {
		size = common.ItemsPerPage
	} else if size > 100 {
		size = 100
	}
	tokens, err := model.GetAllUserTokens(userId, p*size, size)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": i18n.GetErrorMessage(err.Error(), i18n.GetPreferredLanguage(c)),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    tokens,
	})
	return
}

func SearchTokens(c *gin.Context) {
	userId := c.GetInt("id")
	keyword := c.Query("keyword")
	token := c.Query("token")
	tokens, err := model.SearchUserTokens(userId, keyword, token)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": i18n.GetErrorMessage(err.Error(), i18n.GetPreferredLanguage(c)),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    tokens,
	})
	return
}

func GetToken(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	userId := c.GetInt("id")
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": i18n.GetErrorMessage(err.Error(), i18n.GetPreferredLanguage(c)),
		})
		return
	}
	token, err := model.GetTokenByIds(id, userId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": i18n.GetErrorMessage(err.Error(), i18n.GetPreferredLanguage(c)),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    token,
	})
	return
}

func GetTokenStatus(c *gin.Context) {
	tokenId := c.GetInt("token_id")
	userId := c.GetInt("id")
	token, err := model.GetTokenByIds(tokenId, userId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": i18n.GetErrorMessage(err.Error(), i18n.GetPreferredLanguage(c)),
		})
		return
	}
	expiredAt := token.ExpiredTime
	if expiredAt == -1 {
		expiredAt = 0
	}
	c.JSON(http.StatusOK, gin.H{
		"object":          "credit_summary",
		"total_granted":   token.RemainQuota,
		"total_used":      0, // not supported currently
		"total_available": token.RemainQuota,
		"expires_at":      expiredAt * 1000,
	})
}

func AddToken(c *gin.Context) {
	token := model.Token{}
	err := c.ShouldBindJSON(&token)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": i18n.GetErrorMessage(err.Error(), i18n.GetPreferredLanguage(c)),
		})
		return
	}
	if len(token.Name) > 30 {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": i18n.GetErrorMessage("token_name_too_long", i18n.GetPreferredLanguage(c)),
		})
		return
	}
	cleanToken := model.Token{
		UserId:             c.GetInt("id"),
		Name:               token.Name,
		Key:                common.GenerateKey(),
		CreatedTime:        common.GetTimestamp(),
		AccessedTime:       common.GetTimestamp(),
		ExpiredTime:        token.ExpiredTime,
		RemainQuota:        token.RemainQuota,
		UnlimitedQuota:     token.UnlimitedQuota,
		ModelLimitsEnabled: token.ModelLimitsEnabled,
		ModelLimits:        token.ModelLimits,
	}
	err = cleanToken.Insert()
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": i18n.GetErrorMessage(err.Error(), i18n.GetPreferredLanguage(c)),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
	})
	return
}

func DeleteToken(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	userId := c.GetInt("id")
	err := model.DeleteTokenById(id, userId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": i18n.GetErrorMessage(err.Error(), i18n.GetPreferredLanguage(c)),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
	})
	return
}

func UpdateToken(c *gin.Context) {
	userId := c.GetInt("id")
	statusOnly := c.Query("status_only")
	token := model.Token{}
	err := c.ShouldBindJSON(&token)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": i18n.GetErrorMessage(err.Error(), i18n.GetPreferredLanguage(c)),
		})
		return
	}
	if len(token.Name) > 30 {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": i18n.GetErrorMessage("token_name_too_long", i18n.GetPreferredLanguage(c)),
		})
		return
	}
	cleanToken, err := model.GetTokenByIds(token.Id, userId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": i18n.GetErrorMessage(err.Error(), i18n.GetPreferredLanguage(c)),
		})
		return
	}
	if token.Status == common.TokenStatusEnabled {
		if cleanToken.Status == common.TokenStatusExpired && cleanToken.ExpiredTime <= common.GetTimestamp() && cleanToken.ExpiredTime != -1 {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": i18n.GetErrorMessage("token_expired", i18n.GetPreferredLanguage(c)),
			})
			return
		}
		if cleanToken.Status == common.TokenStatusExhausted && cleanToken.RemainQuota <= 0 && !cleanToken.UnlimitedQuota {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": i18n.GetErrorMessage("token_quota_exhausted", i18n.GetPreferredLanguage(c)),
			})
			return
		}
	}
	if statusOnly != "" {
		cleanToken.Status = token.Status
	} else {
		// If you add more fields, please also update token.Update()
		cleanToken.Name = token.Name
		cleanToken.ExpiredTime = token.ExpiredTime
		cleanToken.RemainQuota = token.RemainQuota
		cleanToken.UnlimitedQuota = token.UnlimitedQuota
		cleanToken.ModelLimitsEnabled = token.ModelLimitsEnabled
		cleanToken.ModelLimits = token.ModelLimits
	}
	err = cleanToken.Update()
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": i18n.GetErrorMessage(err.Error(), i18n.GetPreferredLanguage(c)),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    cleanToken,
	})
	return
}
