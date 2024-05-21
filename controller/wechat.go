package controller

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"one-api/common"
	"one-api/i18n" // import the i18n package
	"one-api/model"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type wechatLoginResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    string `json:"data"`
}

const (
	invalidParamError        = "invalid_param"
	codeInvalidOrExpired     = "code_invalid_or_expired"
	wechatAuthNotEnabled     = "wechat_auth_not_enabled"
	registrationDisabled     = "registration_disabled"
	userBanned               = "user_banned"
	wechatAccountAlreadyBind = "wechat_account_already_bind"
)

func getWeChatIdByCode(code string) (string, error) {
	if code == "" {
		return "", errors.New(invalidParamError)
	}
	req, err := http.NewRequest("GET", fmt.Sprintf("%s/api/wechat/user?code=%s", common.WeChatServerAddress, code), nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", common.WeChatServerToken)
	client := http.Client{
		Timeout: 5 * time.Second,
	}
	httpResponse, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer httpResponse.Body.Close()
	var res wechatLoginResponse
	err = json.NewDecoder(httpResponse.Body).Decode(&res)
	if err != nil {
		return "", err
	}
	if !res.Success {
		return "", errors.New(res.Message)
	}
	if res.Data == "" {
		return "", errors.New(codeInvalidOrExpired)
	}
	return res.Data, nil
}

func WeChatAuth(c *gin.Context) {
	if !common.WeChatAuthEnabled {
		c.JSON(http.StatusOK, gin.H{
			"message": i18n.GetErrorMessage(wechatAuthNotEnabled, i18n.GetPreferredLanguage(c)),
			"success": false,
		})
		return
	}
	code := c.Query("code")
	wechatId, err := getWeChatIdByCode(code)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"message": i18n.GetErrorMessage(err.Error(), i18n.GetPreferredLanguage(c)),
			"success": false,
		})
		return
	}
	user := model.User{
		WeChatId: wechatId,
	}
	if model.IsWeChatIdAlreadyTaken(wechatId) {
		err := user.FillUserByWeChatId()
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": i18n.GetErrorMessage(err.Error(), i18n.GetPreferredLanguage(c)),
			})
			return
		}
	} else {
		if common.RegisterEnabled {
			user.Username = "wechat_" + strconv.Itoa(model.GetMaxUserId()+1)
			user.DisplayName = "WeChat User"
			user.Role = common.RoleCommonUser
			user.Status = common.UserStatusEnabled

			if err := user.Insert(0); err != nil {
				c.JSON(http.StatusOK, gin.H{
					"success": false,
					"message": i18n.GetErrorMessage(err.Error(), i18n.GetPreferredLanguage(c)),
				})
				return
			}
		} else {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": i18n.GetErrorMessage(registrationDisabled, i18n.GetPreferredLanguage(c)),
			})
			return
		}
	}

	if user.Status != common.UserStatusEnabled {
		c.JSON(http.StatusOK, gin.H{
			"message": i18n.GetErrorMessage(userBanned, i18n.GetPreferredLanguage(c)),
			"success": false,
		})
		return
	}
	setupLogin(&user, c)
}

func WeChatBind(c *gin.Context) {
	if !common.WeChatAuthEnabled {
		c.JSON(http.StatusOK, gin.H{
			"message": i18n.GetErrorMessage(wechatAuthNotEnabled, i18n.GetPreferredLanguage(c)),
			"success": false,
		})
		return
	}
	code := c.Query("code")
	wechatId, err := getWeChatIdByCode(code)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"message": i18n.GetErrorMessage(err.Error(), i18n.GetPreferredLanguage(c)),
			"success": false,
		})
		return
	}
	if model.IsWeChatIdAlreadyTaken(wechatId) {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": i18n.GetErrorMessage(wechatAccountAlreadyBind, i18n.GetPreferredLanguage(c)),
		})
		return
	}
	id := c.GetInt("id")
	user := model.User{
		Id: id,
	}
	err = user.FillUserById()
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": i18n.GetErrorMessage(err.Error(), i18n.GetPreferredLanguage(c)),
		})
		return
	}
	user.WeChatId = wechatId
	err = user.Update(false)
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
