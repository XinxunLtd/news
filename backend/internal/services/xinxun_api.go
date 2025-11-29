package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type XinxunLoginRequest struct {
	Number   string `json:"number"`
	Password string `json:"password"`
}

type XinxunLoginResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    struct {
		ID       uint    `json:"id"`
		Name     string  `json:"name"`
		Number   string  `json:"number"`
		Balance  float64 `json:"balance"`
		Status   string  `json:"status"`
		ReffCode string  `json:"reff_code"`
	} `json:"data"`
}

type XinxunRewardRequest struct {
	UserID uint    `json:"user_id"`
	Amount float64 `json:"amount"`
}

type XinxunRewardResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    interface{} `json:"data"`
}

const XinxunAPIBaseURL = "https://api.xinxun.us/v3/news"

func LoginXinxun(number, password string) (*XinxunLoginResponse, error) {
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	reqBody := XinxunLoginRequest{
		Number:   number,
		Password: password,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", fmt.Sprintf("%s/login", XinxunAPIBaseURL), bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result XinxunLoginResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	return &result, nil
}

func SendReward(userID uint, amount float64) (*XinxunRewardResponse, error) {
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	reqBody := XinxunRewardRequest{
		UserID: userID,
		Amount: amount,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", fmt.Sprintf("%s/reward", XinxunAPIBaseURL), bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var result XinxunRewardResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	return &result, nil
}

