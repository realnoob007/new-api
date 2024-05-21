package controller

import (
	"encoding/json"
	"errors"
	"net/http"
	"one-api/common"
	"one-api/i18n"
	"one-api/model"
	"strings"

	"github.com/gin-gonic/gin"
)

var (
	ErrGitHubOAuthDisabled            = errors.New("github_oauth_disabled")
	ErrEmailDomainRestrictionDisabled = errors.New("email_domain_restriction_disabled")
	ErrWeChatAuthDisabled             = errors.New("wechat_auth_disabled")
	ErrTurnstileCheckDisabled         = errors.New("turnstile_check_disabled")
)

func GetOptions(c *gin.Context) {
	var options []*model.Option
	common.OptionMapRWMutex.Lock()
	for k, v := range common.OptionMap {
		if strings.HasSuffix(k, "Token") || strings.HasSuffix(k, "Secret") || strings.HasSuffix(k, "Key") {
			continue
		}
		options = append(options, &model.Option{
			Key:   k,
			Value: common.Interface2String(v),
		})
	}
	common.OptionMapRWMutex.Unlock()
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    options,
	})
	return
}

func UpdateOption(c *gin.Context) {
	var option model.Option
	err := json.NewDecoder(c.Request.Body).Decode(&option)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": i18n.GetErrorMessage("invalid_params", i18n.GetPreferredLanguage(c)),
		})
		return
	}
	switch option.Key {
	case "GitHubOAuthEnabled":
		if option.Value == "true" && common.GitHubClientId == "" {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": i18n.GetErrorMessage(ErrGitHubOAuthDisabled.Error(), i18n.GetPreferredLanguage(c)),
			})
			return
		}
	case "EmailDomainRestrictionEnabled":
		if option.Value == "true" && len(common.EmailDomainWhitelist) == 0 {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": i18n.GetErrorMessage(ErrEmailDomainRestrictionDisabled.Error(), i18n.GetPreferredLanguage(c)),
			})
			return
		}
	case "WeChatAuthEnabled":
		if option.Value == "true" && common.WeChatServerAddress == "" {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": i18n.GetErrorMessage(ErrWeChatAuthDisabled.Error(), i18n.GetPreferredLanguage(c)),
			})
			return
		}
	case "TurnstileCheckEnabled":
		if option.Value == "true" && common.TurnstileSiteKey == "" {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": i18n.GetErrorMessage(ErrTurnstileCheckDisabled.Error(), i18n.GetPreferredLanguage(c)),
			})
			return
		}
	}
	err = model.UpdateOption(option.Key, option.Value)
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
