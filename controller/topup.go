package controller

import (
	"errors"
	"fmt"
	"one-api/constant"

	"github.com/Calcium-Ion/go-epay/epay"
	"github.com/gin-gonic/gin"
	"github.com/samber/lo"

	"log"
	"net/url"
	"one-api/common"
	"one-api/i18n"
	"one-api/model"
	"one-api/service"
	"strconv"
	"sync"
	"time"
)

type EpayRequest struct {
	Amount        int    `json:"amount"`
	PaymentMethod string `json:"payment_method"`
	TopUpCode     string `json:"top_up_code"`
}

type AmountRequest struct {
	Amount    int    `json:"amount"`
	TopUpCode string `json:"top_up_code"`
}

// Error messages
var (
	ErrInvalidParams            = errors.New("invalid_params")
	ErrAmountTooLow             = errors.New("amount_too_low")
	ErrAmountTooLowToRecharge   = errors.New("amount_too_low_to_recharge")
	ErrPaymentInfoNotConfigured = errors.New("payment_info_not_configured")
	ErrPaymentFailed            = errors.New("payment_failed")
	ErrOrderCreationFailed      = errors.New("order_creation_failed")
)

func GetEpayClient() *epay.Client {
	if constant.PayAddress == "" || constant.EpayId == "" || constant.EpayKey == "" {
		return nil
	}
	withUrl, err := epay.NewClient(&epay.Config{
		PartnerID: constant.EpayId,
		Key:       constant.EpayKey,
	}, constant.PayAddress)
	if err != nil {
		return nil
	}
	return withUrl
}

func getPayMoney(amount float64, user model.User) float64 {
	if !common.DisplayInCurrencyEnabled {
		amount = amount / common.QuotaPerUnit
	}
	topupGroupRatio := common.GetTopupGroupRatio(user.Group)
	if topupGroupRatio == 0 {
		topupGroupRatio = 1
	}
	payMoney := amount * constant.Price * topupGroupRatio
	return payMoney
}

func getMinTopup() int {
	minTopup := constant.MinTopUp
	if !common.DisplayInCurrencyEnabled {
		minTopup = minTopup * int(common.QuotaPerUnit)
	}
	return minTopup
}

func RequestEpay(c *gin.Context) {
	var req EpayRequest
	err := c.ShouldBindJSON(&req)
	if err != nil {
		c.JSON(200, gin.H{"message": "error", "data": i18n.GetErrorMessage(ErrInvalidParams.Error(), i18n.GetPreferredLanguage(c))})
		return
	}
	if req.Amount < getMinTopup() {
		c.JSON(200, gin.H{"message": "error", "data": fmt.Sprintf(i18n.GetErrorMessage(ErrAmountTooLowToRecharge.Error(), i18n.GetPreferredLanguage(c)), getMinTopup())})
		return
	}

	id := c.GetInt("id")
	user, _ := model.GetUserById(id, false)
	payMoney := getPayMoney(float64(req.Amount), *user)
	if payMoney < 0.01 {
		c.JSON(200, gin.H{"message": "error", "data": i18n.GetErrorMessage(ErrAmountTooLow.Error(), i18n.GetPreferredLanguage(c))})
		return
	}

	var payType epay.PurchaseType
	if req.PaymentMethod == "zfb" {
		payType = epay.Alipay
	}
	if req.PaymentMethod == "wx" {
		req.PaymentMethod = "wxpay"
		payType = epay.WechatPay
	}
	if req.PaymentMethod == "stripe" {
		req.PaymentMethod = "stripe"
		payType = "stripe"
	}
	if req.PaymentMethod == "paypal" {
		req.PaymentMethod = "paypal"
		payType = "paypal"
	}
	callBackAddress := service.GetCallbackAddress()
	returnUrl, _ := url.Parse(common.ServerAddress + "/log")
	notifyUrl, _ := url.Parse(callBackAddress + "/api/user/epay/notify")
	tradeNo := fmt.Sprintf("%s%d", common.GetRandomString(6), time.Now().Unix())
	client := GetEpayClient()
	if client == nil {
		c.JSON(200, gin.H{"message": "error", "data": i18n.GetErrorMessage(ErrPaymentInfoNotConfigured.Error(), i18n.GetPreferredLanguage(c))})
		return
	}
	uri, params, err := client.Purchase(&epay.PurchaseArgs{
		Type:           payType,
		ServiceTradeNo: "A" + tradeNo,
		Name:           "B" + tradeNo,
		Money:          strconv.FormatFloat(payMoney, 'f', 2, 64),
		Device:         epay.PC,
		NotifyUrl:      notifyUrl,
		ReturnUrl:      returnUrl,
	})
	if err != nil {
		c.JSON(200, gin.H{"message": "error", "data": i18n.GetErrorMessage(ErrPaymentFailed.Error(), i18n.GetPreferredLanguage(c))})
		return
	}
	amount := req.Amount
	if !common.DisplayInCurrencyEnabled {
		amount = amount / int(common.QuotaPerUnit)
	}
	topUp := &model.TopUp{
		UserId:     id,
		Amount:     amount,
		Money:      payMoney,
		TradeNo:    "A" + tradeNo,
		CreateTime: time.Now().Unix(),
		Status:     "pending",
	}
	err = topUp.Insert()
	if err != nil {
		c.JSON(200, gin.H{"message": "error", "data": i18n.GetErrorMessage(ErrOrderCreationFailed.Error(), i18n.GetPreferredLanguage(c))})
		return
	}
	c.JSON(200, gin.H{"message": "success", "data": params, "url": uri})
}

var orderLocks sync.Map
var createLock sync.Mutex

func LockOrder(tradeNo string) {
	lock, ok := orderLocks.Load(tradeNo)
	if !ok {
		createLock.Lock()
		defer createLock.Unlock()
		lock, ok = orderLocks.Load(tradeNo)
		if !ok {
			lock = new(sync.Mutex)
			orderLocks.Store(tradeNo, lock)
		}
	}
	lock.(*sync.Mutex).Lock()
}

func UnlockOrder(tradeNo string) {
	lock, ok := orderLocks.Load(tradeNo)
	if ok {
		lock.(*sync.Mutex).Unlock()
	}
}

func EpayNotify(c *gin.Context) {
	params := lo.Reduce(lo.Keys(c.Request.URL.Query()), func(r map[string]string, t string, i int) map[string]string {
		r[t] = c.Request.URL.Query().Get(t)
		return r
	}, map[string]string{})
	client := GetEpayClient()
	if client == nil {
		log.Println("易支付回调失败 未找到配置信息")
		_, err := c.Writer.Write([]byte("fail"))
		if err != nil {
			log.Println("易支付回调写入失败")
			return
		}
	}
	verifyInfo, err := client.Verify(params)
	if err == nil && verifyInfo.VerifyStatus {
		_, err := c.Writer.Write([]byte("success"))
		if err != nil {
			log.Println("易支付回调写入失败")
		}
	} else {
		_, err := c.Writer.Write([]byte("fail"))
		if err != nil {
			log.Println("易支付回调写入失败")
		}
		log.Println("易支付回调签名验证失败")
		return
	}

	if verifyInfo.TradeStatus == epay.StatusTradeSuccess {
		log.Println(verifyInfo)
		LockOrder(verifyInfo.ServiceTradeNo)
		defer UnlockOrder(verifyInfo.ServiceTradeNo)
		topUp := model.GetTopUpByTradeNo(verifyInfo.ServiceTradeNo)
		if topUp == nil {
			log.Printf("易支付回调未找到订单: %v", verifyInfo)
			return
		}
		if topUp.Status == "pending" {
			topUp.Status = "success"
			err := topUp.Update()
			if err != nil {
				log.Printf("易支付回调更新订单失败: %v", topUp)
				return
			}
			err = model.IncreaseUserQuota(topUp.UserId, topUp.Amount*int(common.QuotaPerUnit))
			if err != nil {
				log.Printf("易支付回调更新用户失败: %v", topUp)
				return
			}
			log.Printf("易支付回调更新用户成功 %v", topUp)
			model.RecordLog(topUp.UserId, model.LogTypeTopup, fmt.Sprintf("使用在线充值成功，充值金额: %v，支付金额：%f", common.LogQuota(topUp.Amount*int(common.QuotaPerUnit)), topUp.Money))
		}
	} else {
		log.Printf("易支付异常回调: %v", verifyInfo)
	}
}

func RequestAmount(c *gin.Context) {
	var req AmountRequest
	err := c.ShouldBindJSON(&req)
	if err != nil {
		c.JSON(200, gin.H{"message": "error", "data": i18n.GetErrorMessage(ErrInvalidParams.Error(), i18n.GetPreferredLanguage(c))})
		return
	}

	if req.Amount < getMinTopup() {
		c.JSON(200, gin.H{"message": "error", "data": fmt.Sprintf(i18n.GetErrorMessage(ErrAmountTooLowToRecharge.Error(), i18n.GetPreferredLanguage(c)), getMinTopup())})
		return
	}
	id := c.GetInt("id")
	user, _ := model.GetUserById(id, false)
	payMoney := getPayMoney(float64(req.Amount), *user)
	if payMoney <= 0.01 {
		c.JSON(200, gin.H{"message": "error", "data": i18n.GetErrorMessage(ErrAmountTooLow.Error(), i18n.GetPreferredLanguage(c))})
		return
	}
	c.JSON(200, gin.H{"message": "success", "data": strconv.FormatFloat(payMoney, 'f', 2, 64)})
}
